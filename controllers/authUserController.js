/**
 * Authentication & User Profile Controller (controllers/authUserController.js)
 */
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { extractValidationErrors } = require("../middleware/validators");
const {
  syncEventLifecycles,
  decorateEventForView,
} = require("./eventController");

function formText(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getLogin(req, res) {
  if (req.currentUser) return res.redirect("/profile");
  res.render("login", {
    title: "Sign In — AnimoEvents",
    activeNav: "login",
  });
}

async function postLogin(req, res, next) {
  try {
    if (req.currentUser) return res.redirect("/profile");
    const email = formText(req.body.email).trim().toLowerCase();
    const password = formText(req.body.password);

    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("login", {
        title: "Sign In — AnimoEvents",
        activeNav: "login",
        error: valErrors[0],
        formEmail: email,
      });
    }

    const userDoc = await User.findOne({ email }).select("+password");
    if (!userDoc || !(await userDoc.comparePassword(password))) {
      return res.status(401).render("login", {
        title: "Sign In — AnimoEvents",
        activeNav: "login",
        error: "The email address or password is incorrect.",
        formEmail: email,
      });
    }

    return startUserSession(req, res, next, userDoc._id);
  } catch (err) {
    return next(err);
  }
}

function startUserSession(req, res, next, userId) {
  req.session.regenerate(function (err) {
    if (err) return next(err);
    req.session.userId = String(userId);
    req.session.save(function (saveError) {
      if (saveError) return next(saveError);
      return res.redirect("/");
    });
  });
}

function getLogout(req, res) {
  if (req.currentUser) return res.redirect("/profile");
  res.render("logout", {
    title: "Signed Out — AnimoEvents",
    activeNav: "logout",
  });
}

function postLogout(req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.redirect(303, "/logout");
  });
}

function getRegister(req, res) {
  if (req.currentUser) return res.redirect("/profile");
  res.render("register", {
    title: "Create DLSU Account — AnimoEvents",
    activeNav: "register",
    formData: {
      role: "Student",
      academicLevel: "Undergraduate",
      college: "CCS",
      department: "ST",
      campus: "Manila",
    },
  });
}

async function checkEmailAvailability(req, res, next) {
  try {
    res.set("Cache-Control", "no-store");
    if (extractValidationErrors(req).length > 0) {
      return res.status(400).json({ available: false, validDomain: false });
    }
    const existing = await User.exists({ email: req.query.email });
    return res.json({ available: !existing, validDomain: true });
  } catch (err) {
    return next(err);
  }
}

async function postRegister(req, res, next) {
  try {
    if (req.currentUser) return res.redirect("/profile");
    const displayName = formText(req.body.displayName).trim();
    const email = formText(req.body.email).trim().toLowerCase();
    const password = formText(req.body.password);
    const role = formText(req.body.role, "Student");
    const academicLevel =
      role === "Student"
        ? formText(req.body.academicLevel, "Undergraduate")
        : "N/A";
    const college = formText(req.body.college, "CCS");
    const department = formText(req.body.department, "ST");
    const campus = formText(req.body.campus, "Manila");
    const bio = formText(req.body.bio).trim();

    const errors = extractValidationErrors(req);

    const formData = {
      displayName,
      email,
      role,
      academicLevel,
      college,
      department,
      campus,
      bio,
    };
    function renderRegistrationError(status, error, emailError) {
      return res.status(status).render("register", {
        title: "Create DLSU Account — AnimoEvents",
        activeNav: "register",
        error,
        emailError,
        formData,
      });
    }
    if (errors.length > 0) return renderRegistrationError(400, errors.join(" "));

    const newUser = new User({
      displayName,
      email,
      password,
      role,
      academicLevel,
      college,
      department,
      campus,
      bio,
    });
    try {
      await newUser.save();
    } catch (err) {
      if (err.code === 11000) {
        return renderRegistrationError(
          409,
          null,
          "An account with this email address already exists.",
        );
      }
      throw err;
    }
    return startUserSession(req, res, next, newUser._id);
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    return await renderProfile(req, res);
  } catch (err) {
    return next(err);
  }
}

async function renderProfile(req, res, status = 200, error) {
  await syncEventLifecycles();
  const user = req.currentUser;
  if (!user) return res.redirect("/login");

  const filter =
    user.role === "Organizer"
      ? { organizer: user._id }
      : { attendees: user._id };

  const rawEvents = await Event.find(filter).sort({ date: 1, time: 1 }).lean();
  const userEvents = rawEvents.map(function (ev) {
    return decorateEventForView(ev, user, null);
  });

  return res.status(status).render("profile", {
    title: "My Profile — AnimoEvents",
    activeNav: "profile",
    profileUser: user,
    userEvents,
    eventCount: userEvents.length,
    isOrganizer: user.role === "Organizer",
    error,
  });
}

async function getProfileEdit(req, res, next) {
  try {
    const user = req.currentUser;
    if (!user) {
      return res.redirect("/login");
    }
    res.render("profile-edit", {
      title: "Edit Profile & Affiliation — AnimoEvents",
      activeNav: "profile",
      profileUser: user,
    });
  } catch (err) {
    next(err);
  }
}

async function postProfileEdit(req, res, next) {
  try {
    const user = req.currentUser;
    if (!user) {
      return res.redirect("/login");
    }

    const displayName = formText(req.body.displayName).trim();
    const rawPic = formText(req.body.profilePic, user.profilePic || "/images/avatar-u1.svg")
      .trim()
      .replace(/^\.\//, "/");
    const profilePic = /^\/images\/avatar-u([1-9]|1[0-2])\.svg$/.test(rawPic)
      ? rawPic
      : user.profilePic || "/images/avatar-u1.svg";
    const role = user.role; // Read-only after registration
    const academicLevel =
      role === "Student"
        ? formText(req.body.academicLevel, user.academicLevel)
        : "N/A";
    const college = formText(req.body.college, user.college);
    const department = formText(req.body.department, user.department);
    const campus = formText(req.body.campus, user.campus);
    const bio = formText(req.body.bio).trim();

    const errors = extractValidationErrors(req);
    if (errors.length > 0) {
      return res.status(400).render("profile-edit", {
        title: "Edit Profile & Affiliation — AnimoEvents",
        activeNav: "profile",
        error: errors.join(" "),
        profileUser: Object.assign({}, user, {
          displayName,
          profilePic,
          academicLevel,
          college,
          department,
          campus,
          bio,
        }),
      });
    }

    await User.findByIdAndUpdate(
      user._id,
      { displayName, profilePic, academicLevel, college, department, campus, bio },
      { runValidators: true },
    );

    // Synchronize denormalized organizerName and thread authorName
    await Event.updateMany(
      { organizer: user._id },
      { $set: { organizerName: displayName }, $inc: { __v: 1 } },
    );

    await Event.updateMany(
      { "updates.author": user._id },
      { $set: { "updates.$[post].authorName": displayName }, $inc: { __v: 1 } },
      { arrayFilters: [{ "post.author": user._id }] },
    );

    return res.redirect("/profile");
  } catch (err) {
    return next(err);
  }
}

async function postProfileDelete(req, res, next) {
  try {
    const user = req.currentUser;
    if (!user) {
      return res.redirect("/login");
    }
    if (req.body.confirmDelete !== "yes") {
      return await renderProfile(
        req, res, 400, "Confirm account deletion before continuing.",
      );
    }
    const userId = user._id;

    // Keep each parent until its dependent records have been removed so a failed request can be retried.
    const hostedEventIds = await Event.distinct("_id", { organizer: userId });
    if (hostedEventIds.length > 0) {
      await Bookmark.deleteMany({ event: { $in: hostedEventIds } });
    }
    await Bookmark.deleteMany({ user: userId });

    await Event.updateMany(
      { $or: [{ attendees: userId }, { "updates.author": userId }] },
      {
        $pull: { attendees: userId, updates: { author: userId } },
        $inc: { __v: 1 },
      },
    );
    await syncEventLifecycles();

    await Event.deleteMany({ organizer: userId });
    await User.findByIdAndDelete(userId);
    return postLogout(req, res, next);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getLogin,
  postLogin,
  getLogout,
  postLogout,
  getRegister,
  checkEmailAvailability,
  postRegister,
  getProfile,
  getProfileEdit,
  postProfileEdit,
  postProfileDelete,
};

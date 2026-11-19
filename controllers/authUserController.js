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
    error: error || (user.deleting
      ? "Account deletion was interrupted. Select Delete Account again to finish."
      : null),
  });
}

function renderProfileEdit(res, user, status = 200, error) {
  return res.status(status).render("profile-edit", {
    title: "Edit Profile & Affiliation — AnimoEvents",
    activeNav: "profile",
    profileUser: user,
    profileVersion: user.__v ?? 0,
    error,
  });
}

function getProfileEdit(req, res) {
  return renderProfileEdit(res, req.currentUser);
}

async function syncUserName(user) {
  const { _id, displayName } = user;
  await Event.updateMany(
    { organizer: _id, organizerName: { $ne: displayName } },
    { $set: { organizerName: displayName }, $inc: { __v: 1 } },
  );
  const nameMismatch = { author: _id, authorName: { $ne: displayName } };
  await Event.updateMany(
    { updates: { $elemMatch: nameMismatch } },
    { $set: { "updates.$[post].authorName": displayName }, $inc: { __v: 1 } },
    { arrayFilters: [{ "post.author": _id, "post.authorName": { $ne: displayName } }] },
  );
  await User.updateOne({ _id, displayName }, { $unset: { nameSyncPending: "" } });
}

function staleProfile(res, user) {
  return renderProfileEdit(
    res, user, 409,
    "Your profile changed after you opened this form. Review the latest values and apply your changes again.",
  );
}

async function postProfileEdit(req, res, next) {
  try {
    const user = req.currentUser;
    if (!user) {
      return res.redirect("/login");
    }
    if (user.nameSyncPending) await syncUserName(user);

    const version = user.__v ?? 0;
    if (req.body.profileVersion !== String(version)) {
      return staleProfile(res, user);
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
      const draft = { ...user, displayName, profilePic, academicLevel, college, department, campus, bio };
      return renderProfileEdit(res, draft, 400, errors.join(" "));
    }

    const fields = { displayName, profilePic, academicLevel, college, department, campus, bio };
    if (displayName !== user.displayName) fields.nameSyncPending = true;
    const updated = await User.findOneAndUpdate(
      { _id: user._id, __v: user.__v === undefined ? { $exists: false } : version, deleting: { $ne: true } },
      { $set: fields, $inc: { __v: 1 } },
      { runValidators: true, new: true },
    ).lean();
    if (!updated) {
      const current = await User.findById(user._id).lean();
      if (!current) return postLogout(req, res, next);
      return staleProfile(res, current);
    }

    if (updated.nameSyncPending) await syncUserName(updated);
    return res.redirect("/profile");
  } catch (err) {
    return next(err);
  }
}

async function finishAccountDeletion(user) {
  const userId = user._id;

  // The saved list still identifies dependent bookmarks if the process stopped after deleting the events.
  await Event.deleteMany({ organizer: userId });
  await Bookmark.deleteMany({
    $or: [{ user: userId }, { event: { $in: user.hostedEventIdsToDelete || [] } }],
  });
  await Event.updateMany(
    { $or: [{ attendees: userId }, { "updates.author": userId }] },
    {
      $pull: { attendees: userId, updates: { author: userId } },
      $inc: { __v: 1 },
    },
  );
  await syncEventLifecycles();
  await User.deleteOne({ _id: userId, deleting: true });
}

async function finishPendingAccountChanges() {
  const pending = await User.find({
    $or: [{ deleting: true }, { nameSyncPending: true }],
  }).lean();
  for (const user of pending) {
    if (user.deleting) await finishAccountDeletion(user);
    else await syncUserName(user);
  }
}

async function postProfileDelete(req, res, next) {
  try {
    const user = req.currentUser;
    if (!user) return res.redirect("/login");
    if (req.body.confirmDelete !== "yes") {
      return await renderProfile(
        req, res, 400, "Confirm account deletion before continuing.",
      );
    }

    if (!user.deleting) {
      user.hostedEventIdsToDelete = await Event.distinct("_id", { organizer: user._id });
      await User.updateOne({ _id: user._id }, {
        $set: { deleting: true, hostedEventIdsToDelete: user.hostedEventIdsToDelete },
      });
    }
    await finishAccountDeletion(user);
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
  finishPendingAccountChanges,
};

/**
 * Authentication & User Profile Controller (controllers/authUserController.js)
 */
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { validateAffiliationCombination } = require("../model/constants");
const { extractValidationErrors } = require("../middleware/validators");
const {
  syncEventLifecycles,
  decorateEventForView,
} = require("./eventController");

async function getLogin(req, res, next) {
  try {
    res.render("login", {
      title: "Sign In — AnimoEvents",
      activeNav: "login",
    });
  } catch (err) {
    next(err);
  }
}

async function postLogin(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("login", {
        title: "Sign In — AnimoEvents",
        activeNav: "login",
        error: valErrors[0],
        formEmail: email,
      });
    }

    const userDoc = await User.findOne({ email: email });
    if (!userDoc) {
      return res.status(400).render("login", {
        title: "Sign In — AnimoEvents",
        activeNav: "login",
        error: "No account found with that @dlsu.edu.ph email address.",
        formEmail: email,
      });
    }

    const isMatch = await userDoc.comparePassword(password);
    if (!isMatch) {
      return res.status(400).render("login", {
        title: "Sign In — AnimoEvents",
        activeNav: "login",
        error: "The password you entered is incorrect.",
        formEmail: email,
      });
    }

    if (req.session) {
      req.session.userId = String(userDoc._id);
      req.session.loggedOut = false;
    }
    return res.redirect("/");
  } catch (err) {
    return next(err);
  }
}

async function switchDemoAccount(req, res, next) {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();
    if (email) {
      const targetUser = await User.findOne({ email: email }).lean();
      if (targetUser && req.session) {
        req.session.userId = String(targetUser._id);
        req.session.loggedOut = false;
      }
    }
    const referer = req.get("Referrer") || "/";
    if (referer.includes("/login") || referer.includes("/logout")) {
      return res.redirect("/");
    }
    return res.redirect(referer);
  } catch (err) {
    return next(err);
  }
}

function getLogout(req, res) {
  if (req.session) {
    req.session.userId = null;
    req.session.loggedOut = true;
  }
  req.currentUser = null;
  res.locals.currentUser = null;
  res.render("logout", {
    title: "Signed Out — AnimoEvents",
    activeNav: "logout",
  });
}

function getRegister(_req, res) {
  res.render("register", {
    title: "Create DLSU Account — AnimoEvents",
    activeNav: "register",
  });
}

async function checkEmailAvailability(req, res, next) {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();
    if (!email || !email.endsWith("@dlsu.edu.ph")) {
      return res.json({ available: false, validDomain: false });
    }
    const existing = await User.findOne({ email: email }).lean();
    return res.json({ available: !existing, validDomain: true });
  } catch (err) {
    return next(err);
  }
}

async function postRegister(req, res, next) {
  try {
    const displayName = String(req.body.displayName || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const role = String(req.body.role || "Student");
    const academicLevel =
      role === "Student"
        ? String(req.body.academicLevel || "Undergraduate")
        : "N/A";
    const college = String(req.body.college || "CCS");
    const department = String(req.body.department || "ST");
    const campus = String(req.body.campus || "Manila");
    const bio = String(req.body.bio || "").trim();

    const errors = extractValidationErrors(req);
    if (displayName.length < 2 || displayName.length > 100) {
      errors.push("Display name must be between 2 and 100 characters.");
    }
    if (!email.endsWith("@dlsu.edu.ph")) {
      errors.push("Registration requires a valid @dlsu.edu.ph email address.");
    }
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters.");
    }
    if (password !== confirmPassword) {
      errors.push("Password and Confirm Password do not match.");
    }

    const affilErrors = validateAffiliationCombination(
      role,
      academicLevel,
      college,
      department,
    );
    for (let i = 0; i < affilErrors.length; i++) {
      errors.push(affilErrors[i]);
    }

    const existing = await User.findOne({ email: email }).lean();
    if (existing) {
      errors.push("An account with this @dlsu.edu.ph email already exists.");
    }

    const uniqueErrors = Array.from(new Set(errors));
    if (uniqueErrors.length > 0) {
      return res.status(400).render("register", {
        title: "Create DLSU Account — AnimoEvents",
        activeNav: "register",
        error: uniqueErrors.join(" "),
        formData: {
          displayName,
          email,
          role,
          academicLevel,
          college,
          department,
          campus,
          bio,
        },
      });
    }

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
      profilePic:
        role === "Organizer"
          ? "/images/avatar-u6.svg"
          : "/images/avatar-u1.svg",
    });
    const savedUser = await newUser.save();

    if (req.session) {
      req.session.userId = String(savedUser._id);
      req.session.loggedOut = false;
    }
    return res.redirect("/");
  } catch (err) {
    return next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;
    if (!user) {
      return res.redirect("/login");
    }

    const filter =
      user.role === "Organizer"
        ? { organizer: user._id }
        : { attendees: user._id };

    const rawEvents = await Event.find(filter)
      .sort({ date: 1, time: 1 })
      .lean();
    const userEvents = rawEvents.map(function (ev) {
      return decorateEventForView(ev, user, null);
    });

    res.render("profile", {
      title: "My Profile — AnimoEvents",
      activeNav: "profile",
      profileUser: user,
      userEvents,
      eventCount: userEvents.length,
      isOrganizer: user.role === "Organizer",
    });
  } catch (err) {
    next(err);
  }
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

    const displayName = String(req.body.displayName || "").trim();
    const rawPic = String(
      req.body.profilePic || user.profilePic || "/images/avatar-u1.svg",
    )
      .trim()
      .replace(/^\.\//, "/");
    const profilePic = /^\/images\/avatar-u([1-9]|1[0-2])\.svg$/.test(rawPic)
      ? rawPic
      : user.profilePic || "/images/avatar-u1.svg";
    const role = user.role; // Read-only after registration
    const academicLevel =
      role === "Student"
        ? String(req.body.academicLevel || user.academicLevel)
        : "N/A";
    const college = String(req.body.college || user.college);
    const department = String(req.body.department || user.department);
    const campus = String(req.body.campus || user.campus);
    const bio = String(req.body.bio || "").trim();

    const errors = extractValidationErrors(req);
    if (displayName.length < 2 || displayName.length > 100) {
      errors.push("Display name must be between 2 and 100 characters.");
    }
    if (bio.length > 300) {
      errors.push("Bio cannot exceed 300 characters.");
    }

    const affilErrors = validateAffiliationCombination(
      role,
      academicLevel,
      college,
      department,
    );
    for (let i = 0; i < affilErrors.length; i++) {
      errors.push(affilErrors[i]);
    }

    const uniqueErrors = Array.from(new Set(errors));
    if (uniqueErrors.length > 0) {
      return res.status(400).render("profile-edit", {
        title: "Edit Profile & Affiliation — AnimoEvents",
        activeNav: "profile",
        error: uniqueErrors.join(" "),
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

    await User.findByIdAndUpdate(user._id, {
      displayName,
      profilePic,
      academicLevel,
      college,
      department,
      campus,
      bio,
    });

    // Synchronize denormalized organizerName and thread authorName using lecture-taught loops
    await Event.updateMany(
      { organizer: user._id },
      { $set: { organizerName: displayName } },
    );

    const eventsWithUserComments = await Event.find({
      "updates.author": user._id,
    });
    for (let i = 0; i < eventsWithUserComments.length; i++) {
      const ev = eventsWithUserComments[i];
      for (let j = 0; j < ev.updates.length; j++) {
        if (String(ev.updates[j].author) === String(user._id)) {
          ev.updates[j].authorName = displayName;
        }
      }
      await ev.save();
    }

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
    const userId = user._id;

    // 1. Delete bookmarks on events hosted by this user
    const hostedEvents = await Event.find({ organizer: userId }).lean();
    for (let i = 0; i < hostedEvents.length; i++) {
      await Bookmark.deleteMany({ event: hostedEvents[i]._id });
    }

    // 2. Delete user's own bookmarks and hosted events
    await Bookmark.deleteMany({ user: userId });
    await Event.deleteMany({ organizer: userId });

    // 3. Remove user from attendees and thread updates, reopening Full events if capacity frees up
    const joinedOrCommented = await Event.find({
      $or: [{ attendees: userId }, { "updates.author": userId }],
    });
    for (let i = 0; i < joinedOrCommented.length; i++) {
      const ev = joinedOrCommented[i];
      ev.attendees = ev.attendees.filter(function (id) {
        return String(id) !== String(userId);
      });
      ev.updates = ev.updates.filter(function (u) {
        return String(u.author) !== String(userId);
      });
      if (ev.status === "Full" && ev.attendees.length < ev.maxCapacity) {
        ev.status = "Open";
      }
      await ev.save();
    }

    // 4. Delete user record and clear session
    await User.findByIdAndDelete(userId);
    if (req.session) {
      req.session.userId = null;
      req.session.loggedOut = true;
    }
    return res.redirect("/logout");
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getLogin,
  postLogin,
  switchDemoAccount,
  getLogout,
  getRegister,
  checkEmailAvailability,
  postRegister,
  getProfile,
  getProfileEdit,
  postProfileEdit,
  postProfileDelete,
};

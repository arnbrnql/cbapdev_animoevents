/**
 * Authentication Loader & Role-Based Authorization Guards (middleware/auth.js)
 * Loads the active DLSU user with .lean() and enforces Student/Faculty vs. Organizer permissions.
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");

let lastMutation = Promise.resolve();

function serializeMutations(req, res, next) {
  if (req.method !== "POST") return next();

  const previous = lastMutation;
  let release;
  lastMutation = new Promise(resolve => { release = resolve; });

  previous.then(function () {
    if (res.destroyed) return release();

    // The route ends its response after its writes finish, even if the client has disconnected.
    const endResponse = res.end;
    res.end = function (...args) {
      try {
        return endResponse.apply(this, args);
      } finally {
        release();
      }
    };
    next();
  }).catch(function (err) {
    release();
    next(err);
  });
}

async function loadCurrentUser(req, res, next) {
  try {
    req.currentUser = null;
    if (req.session && req.session.userId) {
      if (mongoose.Types.ObjectId.isValid(req.session.userId)) {
        req.currentUser = await User.findById(req.session.userId).lean();
      }
      if (!req.currentUser) {
        delete req.session.userId;
      }
    }

    res.locals.currentUser = req.currentUser;
    if (req.currentUser) res.set("Cache-Control", "private, no-store");
    if (req.currentUser?.deleting && !["/profile", "/profile/delete", "/logout"].includes(req.path)) {
      return res.redirect(303, "/profile");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.redirect("/login");
  }
  return next();
}

function requireOrganizer(req, res, next) {
  if (!req.currentUser) {
    return res.redirect("/login");
  }
  if (req.currentUser.role !== "Organizer") {
    return res.status(403).render("error", {
      title: "Access Forbidden — AnimoEvents",
      message:
        "Only accredited DLSU Organizer accounts may publish or manage campus events.",
    });
  }
  return next();
}

async function requireEventOwner(req, res, next) {
  try {
    if (!req.currentUser) {
      return res.redirect("/login");
    }
    if (
      req.currentUser.role !== "Organizer" ||
      !mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    const ev = await Event.findOne({
      _id: req.params.id,
      organizer: req.currentUser._id,
    }).lean();
    if (!ev) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    req.event = ev;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  serializeMutations,
  loadCurrentUser,
  requireAuth,
  requireOrganizer,
  requireEventOwner,
};

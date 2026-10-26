/**
 * Authentication Loader & Role-Based Authorization Guards (middleware/auth.js)
 * Loads the active DLSU user with .lean() and enforces Student/Faculty vs. Organizer permissions.
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");

async function loadCurrentUser(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      req.currentUser = null;
      res.locals.currentUser = null;
      return next();
    }

    if (req.session && req.session.userId) {
      req.currentUser = await User.findById(req.session.userId).lean();
    } else if (req.session && req.session.loggedOut) {
      req.currentUser = null;
    } else if (process.env.PHASE_MODE !== "phase3") {
      req.currentUser = await User.findOne({
        email: "miguel_tan@dlsu.edu.ph",
      }).lean();
    } else {
      req.currentUser = null;
    }

    res.locals.currentUser = req.currentUser || null;
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    const ev = await Event.findById(req.params.id).lean();
    if (!ev) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    if (String(ev.organizer) !== String(req.currentUser._id)) {
      return res.status(403).render("error", {
        title: "Access Forbidden — AnimoEvents",
        message:
          "Only the hosting organizer of this event can edit its details or delete it.",
      });
    }

    req.event = ev;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  loadCurrentUser,
  requireAuth,
  requireOrganizer,
  requireEventOwner,
};

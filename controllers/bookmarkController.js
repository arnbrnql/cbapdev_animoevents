/**
 * Saved Bookmarks & About Page Controller (controllers/bookmarkController.js)
 */
const mongoose = require("mongoose");
const Event = require("../model/Event");
const User = require("../model/User");
const getReturnPath = require("./returnPath");
const Bookmark = require("../model/Bookmark");
const { extractValidationErrors } = require("../middleware/validators");
const {
  syncEventLifecycles,
  buildVisibilityQuery,
  isGrandfatheredAttendee,
  canUserViewEvent,
  getStatusBadgeClass,
} = require("./eventController");

async function getBookmarksPage(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;
    if (!user) {
      return res.render("bookmarks", {
        title: "Saved Event Bookmarks — AnimoEvents",
        activeNav: "bookmarks",
        bookmarks: [],
        eligibleEvents: [],
        bookmarkCount: 0,
      });
    }

    const userBookmarks = await Bookmark.find({ user: user._id })
      .populate("event")
      .sort({ _id: -1 })
      .lean();

    const bookmarkedEventIds = new Set();
    const decoratedBookmarks = userBookmarks.map(function (bookmark) {
      const event = bookmark.event;
      if (event) bookmarkedEventIds.add(String(event._id));
      const visible = Boolean(event) && canUserViewEvent(user, event);

      return {
        _id: bookmark._id,
        personalNote: bookmark.personalNote,
        createdAt: bookmark.createdAt,
        eligibilityChanged: visible && isGrandfatheredAttendee(user, event),
        event: visible
          ? { ...event, statusBadgeClass: getStatusBadgeClass(event.status) }
          : null,
      };
    });

    const visibleEvents = await Event.find(buildVisibilityQuery(user))
      .sort({ date: 1, time: 1 })
      .lean();
    const eligibleEvents = visibleEvents.filter(function (event) {
      return canUserViewEvent(user, event) && !bookmarkedEventIds.has(String(event._id));
    });

    res.render("bookmarks", {
      title: "Saved Event Bookmarks — AnimoEvents",
      activeNav: "bookmarks",
      bookmarks: decoratedBookmarks,
      eligibleEvents,
      bookmarkCount: decoratedBookmarks.length,
    });
  } catch (err) {
    next(err);
  }
}

async function postBookmark(req, res, next) {
  try {
    const user = req.currentUser;
    const eventId = req.body.eventId;
    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("error", {
        title: "Invalid Bookmark Note — AnimoEvents",
        message: valErrors.join(" "),
      });
    }

    const personalNote = String(req.body.personalNote || "")
      .trim()
      .slice(0, 250);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.redirect("/bookmarks");
    }

    const ev = await Event.findById(eventId).lean();
    if (!ev || !canUserViewEvent(user, ev)) {
      return res.redirect("/bookmarks");
    }

    const identity = { user: user._id, event: ev._id };
    try {
      await Bookmark.updateOne(identity, { $setOnInsert: { personalNote } }, {
        upsert: true,
        runValidators: true,
      });
    } catch (err) {
      // Two saves for the same pair can race on the unique index.
      if (err.code !== 11000) throw err;
    }

    const [eventExists, userExists] = await Promise.all([
      Event.exists({ _id: ev._id }),
      User.exists({ _id: user._id }),
    ]);
    if (!eventExists || !userExists) await Bookmark.deleteOne(identity);

    return res.redirect(getReturnPath(req.body.returnTo, "/bookmarks"));
  } catch (err) {
    return next(err);
  }
}

async function postEditBookmark(req, res, next) {
  try {
    const user = req.currentUser;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/bookmarks");
    }

    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("error", {
        title: "Invalid Bookmark Note — AnimoEvents",
        message: valErrors.join(" "),
      });
    }

    await Bookmark.updateOne(
      { _id: req.params.id, user: user._id },
      { $set: { personalNote: String(req.body.personalNote || "").trim() } },
      { runValidators: true },
    );
    return res.redirect("/bookmarks");
  } catch (err) {
    return next(err);
  }
}

async function postDeleteBookmark(req, res, next) {
  try {
    const user = req.currentUser;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/bookmarks");
    }

    await Bookmark.deleteOne({ _id: req.params.id, user: user._id });
    return res.redirect("/bookmarks");
  } catch (err) {
    return next(err);
  }
}

async function postRemoveEventBookmark(req, res, next) {
  try {
    const eventId = req.body.eventId;
    if (typeof eventId === "string" && mongoose.Types.ObjectId.isValid(eventId)) {
      await Bookmark.deleteOne({ user: req.currentUser._id, event: eventId });
    }
    return res.redirect(getReturnPath(req.body.returnTo, "/bookmarks"));
  } catch (err) {
    return next(err);
  }
}

function getAboutPage(req, res) {
  res.render("about", {
    title: "About AnimoEvents — CBAPDEV Group 4",
    activeNav: "about",
  });
}

module.exports = {
  getBookmarksPage,
  postBookmark,
  postEditBookmark,
  postDeleteBookmark,
  postRemoveEventBookmark,
  getAboutPage,
};

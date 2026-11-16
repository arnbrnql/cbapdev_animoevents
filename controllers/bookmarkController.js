/**
 * Saved Bookmarks & About Page Controller (controllers/bookmarkController.js)
 */
const mongoose = require("mongoose");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { extractValidationErrors } = require("../middleware/validators");
const {
  syncEventLifecycles,
  buildVisibilityQuery,
  isUserEligibleForEvent,
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
    const decoratedBookmarks = [];

    userBookmarks.forEach(function (bm) {
      if (!bm.event) return;
      bookmarkedEventIds.add(String(bm.event._id));
      const eligibleNow = isUserEligibleForEvent(user, bm.event);
      decoratedBookmarks.push({
        _id: bm._id,
        personalNote: bm.personalNote || "",
        createdAt: bm.createdAt,
        eligibilityChanged: !eligibleNow,
        event: Object.assign({}, bm.event, {
          statusBadgeClass: getStatusBadgeClass(bm.event.status),
        }),
      });
    });

    const visibleEvents = await Event.find(buildVisibilityQuery(user))
      .sort({ date: 1, time: 1 })
      .lean();
    const eligibleEvents = visibleEvents
      .filter(function (ev) {
        return canUserViewEvent(user, ev);
      })
      .map(function (ev) {
        return Object.assign({}, ev, {
          alreadyBookmarked: bookmarkedEventIds.has(String(ev._id)),
        });
      })
      .sort(function (a, b) {
        return Number(a.alreadyBookmarked) - Number(b.alreadyBookmarked);
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
    const isToggle = String(req.body.toggle) === "true";
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

    const existing = await Bookmark.findOne({ user: user._id, event: ev._id });
    if (existing && isToggle) {
      await Bookmark.findByIdAndDelete(existing._id);
    } else if (existing) {
      existing.personalNote = personalNote;
      await existing.save();
    } else {
      await Bookmark.create({
        user: user._id,
        event: ev._id,
        personalNote,
      });
    }

    const backUrl = req.body.returnTo || req.get("Referrer") || "/bookmarks";
    return res.redirect(backUrl);
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

    const bm = await Bookmark.findById(req.params.id);
    if (bm && String(bm.user) === String(user._id)) {
      bm.personalNote = String(req.body.personalNote || "")
        .trim()
        .slice(0, 250);
      await bm.save();
    }
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

    const bm = await Bookmark.findById(req.params.id);
    if (bm && String(bm.user) === String(user._id)) {
      await Bookmark.findByIdAndDelete(bm._id);
    }
    return res.redirect("/bookmarks");
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
  getAboutPage,
};

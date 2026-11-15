/**
 * Discovery, Search/Filter, RSVP & Multi-Year Calendar Controller (controllers/discoveryController.js)
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const {
  CALENDAR_MIN_YEAR,
  CALENDAR_MAX_YEAR,
  MONTH_NAMES,
  parseAndValidateYearMonth,
  shiftYearMonth,
} = require("../model/constants");
const {
  syncEventLifecycles,
  buildVisibilityQuery,
  isUserEligibleForEvent,
  canUserViewEvent,
  decorateEventForView,
} = require("./eventController");

async function getEventsDirectory(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;

    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "");
    const statusFilter = String(req.query.status || "active");
    const college = String(req.query.college || "");
    const campus = String(req.query.campus || "");
    const academicLevel = String(req.query.academicLevel || "");
    const visibility = String(req.query.visibility || "");
    const dateVal = String(req.query.date || "");
    const sortVal = String(req.query.sort || "recent");

    const mongoConditions = [buildVisibilityQuery(user)];

    if (q !== "") {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeQ, "i");
      mongoConditions.push({
        $or: [
          { title: { $regex: regex } },
          { description: { $regex: regex } },
          { venue: { $regex: regex } },
          { category: { $regex: regex } },
          { organizerName: { $regex: regex } },
          { targetColleges: { $regex: regex } },
          { targetDepartments: { $regex: regex } },
        ],
      });
    }

    if (category) {
      mongoConditions.push({ category: category });
    }
    if (statusFilter === "active") {
      mongoConditions.push({ status: { $nin: ["Completed", "Cancelled"] } });
    } else if (statusFilter && statusFilter !== "all") {
      mongoConditions.push({ status: statusFilter });
    }
    if (college) {
      mongoConditions.push({ targetColleges: college });
    }
    if (academicLevel) {
      mongoConditions.push({ targetAcademicLevels: academicLevel });
    }
    if (visibility === "public") {
      mongoConditions.push({ isPublic: true });
    } else if (visibility === "targeted") {
      mongoConditions.push({ isPublic: false });
    }
    if (dateVal) {
      mongoConditions.push({ date: dateVal });
    }

    const mongoQuery =
      mongoConditions.length > 0 ? { $and: mongoConditions } : {};
    const sortSpec =
      sortVal === "upcoming" ? { date: 1, time: 1 } : { createdAt: -1 };

    const queriedEvents = await Event.find(mongoQuery).sort(sortSpec).lean();

    let results = queriedEvents.filter(function (ev) {
      return canUserViewEvent(user, ev);
    });

    if (campus) {
      results = results.filter(function (ev) {
        if (ev.targetCampuses && ev.targetCampuses.length > 0) {
          return ev.targetCampuses.indexOf(campus) !== -1;
        }
        return ev.venue.toLowerCase().indexOf(campus.toLowerCase()) !== -1;
      });
    }

    const bookmarkedSet = new Set();
    if (user) {
      const userBookmarks = await Bookmark.find({ user: user._id }).lean();
      userBookmarks.forEach(function (bm) {
        bookmarkedSet.add(String(bm.event));
      });
    }

    const decoratedResults = results.map(function (ev) {
      return decorateEventForView(ev, user, bookmarkedSet);
    });

    res.render("events", {
      title: "Browse & Search Events — AnimoEvents",
      activeNav: "events",
      events: decoratedResults,
      resultCount: decoratedResults.length,
      filters: {
        q,
        category,
        status: statusFilter,
        college,
        campus,
        academicLevel,
        visibility,
        date: dateVal,
        sort: sortVal,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function postToggleRsvp(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;
    if (!user) return res.redirect("/login");

    if (user.role === "Organizer") {
      return res.status(403).render("error", {
        title: "Organizer Role Restriction",
        message:
          "Organizer accounts host and manage events and cannot RSVP as human attendees.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/events");
    }

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.redirect("/events");

    if (ev.status === "Completed" || ev.status === "Cancelled") {
      return res.redirect(req.get("Referrer") || "/events/" + ev._id);
    }

    const existingIdx = ev.attendees.findIndex(function (id) {
      return String(id) === String(user._id);
    });

    if (existingIdx !== -1) {
      ev.attendees.splice(existingIdx, 1);
      if (ev.status === "Full" && ev.attendees.length < ev.maxCapacity) {
        ev.status = "Open";
      }
      await ev.save();
    } else {
      if (
        ev.status === "Open" &&
        ev.attendees.length < ev.maxCapacity &&
        isUserEligibleForEvent(user, ev)
      ) {
        ev.attendees.push(user._id);
        if (ev.attendees.length >= ev.maxCapacity) {
          ev.status = "Full";
        }
        await ev.save();
      }
    }

    const backUrl =
      req.body.returnTo || req.get("Referrer") || "/events/" + ev._id;
    return res.redirect(backUrl);
  } catch (err) {
    return next(err);
  }
}

async function getCalendar(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;

    const now = new Date();
    const todayStr =
      now.getFullYear() +
      "-" +
      String(now.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(now.getDate()).padStart(2, "0");
    const currentYearMonth = todayStr.slice(0, 7);
    const humanToday =
      MONTH_NAMES[now.getMonth()] +
      " " +
      now.getDate() +
      ", " +
      now.getFullYear();

    // Support both ?month=YYYY-MM and separate ?year=YYYY&monthNum=MM
    let requestedYM = req.query.month;
    if (req.query.year && req.query.monthNum) {
      requestedYM =
        String(req.query.year) +
        "-" +
        String(req.query.monthNum).padStart(2, "0");
    }

    const selectedMonth = parseAndValidateYearMonth(
      requestedYM,
      currentYearMonth,
    );
    const highlightedDate = req.query.highlight || null;
    const listScope = req.query.scope === "month" ? "month" : "all";

    const parts = selectedMonth.split("-").map(Number);
    const yearNum = parts[0];
    const monthNum = parts[1];
    const selectedMonthPadded = String(monthNum).padStart(2, "0");
    const fullMonthLabel = MONTH_NAMES[monthNum - 1] + " " + yearNum;

    let rawEvents = [];
    if (user) {
      const filter =
        user.role === "Organizer"
          ? { organizer: user._id }
          : { attendees: user._id };
      rawEvents = await Event.find(filter).sort({ date: 1, time: 1 }).lean();
    }

    const scheduledEvents = rawEvents.map(function (ev) {
      const decorated = decorateEventForView(ev, user, null);
      let pillClass = "";
      if (ev.status === "Completed" || ev.status === "Cancelled") {
        pillClass = "pill-completed";
      } else if (ev.status === "Postponed") {
        pillClass = "pill-postponed";
      }
      return Object.assign(decorated, {
        pillClass,
        eventYM: ev.date.slice(0, 7),
        isInSelectedMonth: ev.date.slice(0, 7) === selectedMonth,
      });
    });

    const monthEvents = scheduledEvents.filter(function (ev) {
      return ev.isInSelectedMonth;
    });

    const firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay();
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    const weeks = [];
    let currentWeek = new Array(firstDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = selectedMonth + "-" + String(day).padStart(2, "0");
      const dayEvents = monthEvents.filter(function (ev) {
        return ev.date === dateStr;
      });
      currentWeek.push({
        dayNumber: day,
        dateStr,
        isToday: dateStr === todayStr,
        isHighlighted: dateStr === highlightedDate,
        hasEvents: dayEvents.length > 0,
        dayEvents,
      });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    const years = [];
    for (let y = CALENDAR_MIN_YEAR; y <= CALENDAR_MAX_YEAR; y++) {
      years.push({ value: String(y), selected: y === yearNum });
    }
    const months = MONTH_NAMES.map(function (name, idx) {
      const val = String(idx + 1).padStart(2, "0");
      return { value: val, name, selected: val === selectedMonthPadded };
    });

    res.render("calendar", {
      title: "My Event Calendar — AnimoEvents",
      activeNav: "calendar",
      selectedMonth,
      selectedYear: String(yearNum),
      selectedMonthPadded,
      fullMonthLabel,
      prevMonth: shiftYearMonth(selectedMonth, -1),
      nextMonth: shiftYearMonth(selectedMonth, 1),
      disablePrev: selectedMonth <= CALENDAR_MIN_YEAR + "-01",
      disableNext: selectedMonth >= CALENDAR_MAX_YEAR + "-12",
      todayYM: currentYearMonth,
      todayStr,
      humanToday,
      weeks,
      years,
      months,
      scheduledEvents,
      monthEvents,
      eventsToList: listScope === "month" ? monthEvents : scheduledEvents,
      listScope,
      totalCount: scheduledEvents.length,
      monthCount: monthEvents.length,
      isOrganizer: Boolean(user) && user.role === "Organizer",
    });
  } catch (err) {
    next(err);
  }
}

async function getOrganizersDirectory(req, res, next) {
  try {
    await syncEventLifecycles();
    const viewer = req.currentUser;
    const organizers = await User.find({ role: "Organizer" })
      .sort({ createdAt: 1 })
      .lean();

    if (organizers.length === 0) {
      return res.render("organizer", {
        title: "DLSU Organizers & Research Centers — AnimoEvents",
        activeNav: "organizers",
        organizers: [],
        selectedOrg: null,
        orgEvents: [],
      });
    }

    const requestedId = req.params.id || req.query.id;
    let selectedOrg = organizers[0];
    if (requestedId && mongoose.Types.ObjectId.isValid(requestedId)) {
      const found = organizers.find(function (o) {
        return String(o._id) === String(requestedId);
      });
      if (found) selectedOrg = found;
    }

    const hostedEvents = await Event.find({
      $and: [{ organizer: selectedOrg._id }, buildVisibilityQuery(viewer)],
    })
      .sort({ date: 1, time: 1 })
      .lean();
    const visibleOrgEvents = hostedEvents
      .filter(function (ev) {
        return canUserViewEvent(viewer, ev);
      })
      .map(function (ev) {
        return decorateEventForView(ev, viewer, null);
      });

    res.render("organizer", {
      title: "DLSU Organizers & Research Centers — AnimoEvents",
      activeNav: "organizers",
      organizers,
      organizerCount: organizers.length,
      selectedOrg,
      orgEvents: visibleOrgEvents,
      orgEventCount: visibleOrgEvents.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEventsDirectory,
  postToggleRsvp,
  getCalendar,
  getOrganizersDirectory,
};

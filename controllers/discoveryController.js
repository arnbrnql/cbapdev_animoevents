/**
 * Discovery, Search/Filter, RSVP & Multi-Year Calendar Controller (controllers/discoveryController.js)
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { getManilaDate, isEventEnded } = require("../model/manilaTime");
const getReturnPath = require("./returnPath");
const {
  CALENDAR_MIN_YEAR,
  CALENDAR_MAX_YEAR,
  MONTH_NAMES,
  parseAndValidateYearMonth,
  shiftYearMonth,
} = require("../model/constants");
const {
  syncEventLifecycles,
  eventRevisionFilter,
  buildVisibilityQuery,
  isUserEligibleForEvent,
  canUserViewEvent,
  decorateEventForView,
} = require("./eventController");

async function getEventsDirectory(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;

    const q = String(req.query.q || "").trim().slice(0, 100);
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
    if (campus) {
      mongoConditions.push({ targetCampuses: campus });
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

    const results = queriedEvents.filter(function (ev) {
      return canUserViewEvent(user, ev);
    });

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
      returnTo: req.originalUrl,
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

async function updateRsvp(req, res, next, joining) {
  try {
    const user = req.currentUser;
    if (user.role === "Organizer") {
      return res.status(403).render("error", {
        title: "Registration unavailable",
        message: "Organizer accounts host events. Only students and faculty can RSVP.",
      });
    }

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return renderRsvpError(res, 404, "Event not found.");
    }

    await syncEventLifecycles();
    const returnTo = getReturnPath(req.body.returnTo, "/events/" + id);

    for (let attempt = 0; attempt < 5; attempt++) {
      const event = await Event.findById(id).lean();
      if (!event || !canUserViewEvent(user, event)) {
        return renderRsvpError(res, 404, "Event not found.");
      }

      const hasJoined = event.attendees.some(function (attendee) {
        return String(attendee) === String(user._id);
      });
      if (hasJoined === joining) return res.redirect(returnTo);

      if (
        event.status === "Completed" ||
        event.status === "Cancelled" ||
        (["Open", "Full", "Closed"].includes(event.status) && isEventEnded(event))
      ) {
        return renderRsvpError(res, 409, "Registration changes are closed for this event.");
      }

      let status = event.status;
      if (joining) {
        if (!isUserEligibleForEvent(user, event)) {
          return renderRsvpError(res, 403, "Your current affiliation is not eligible to join.");
        }
        if (status !== "Open" || event.attendees.length >= event.maxCapacity) {
          return renderRsvpError(res, 409, "This event is no longer accepting registrations.");
        }
        if (event.attendees.length + 1 === event.maxCapacity) status = "Full";
      } else if (status === "Full" && event.attendees.length - 1 < event.maxCapacity) {
        status = "Open";
      }

      // Retry if another registration, host edit, or lifecycle change won the race.
      const result = await Event.updateOne(
        eventRevisionFilter(event),
        {
          ...(joining ? { $addToSet: { attendees: user._id } } : { $pull: { attendees: user._id } }),
          $set: { status: status },
          $inc: { __v: 1 },
        },
      );
      if (result.modifiedCount === 1) return res.redirect(returnTo);
    }

    return renderRsvpError(res, 409, "The event changed while you were registering. Please try again.");
  } catch (err) {
    return next(err);
  }
}

function renderRsvpError(res, status, message) {
  return res.status(status).render("error", {
    title: status === 404 ? "Event not found" : "Registration unavailable",
    message: message,
  });
}

function postJoinRsvp(req, res, next) {
  return updateRsvp(req, res, next, true);
}

function postLeaveRsvp(req, res, next) {
  return updateRsvp(req, res, next, false);
}

async function getCalendar(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;

    const todayStr = getManilaDate();
    const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
    const currentYearMonth = todayStr.slice(0, 7);
    const calendarMonth = currentYearMonth < CALENDAR_MIN_YEAR + "-01"
      ? CALENDAR_MIN_YEAR + "-01"
      : currentYearMonth > CALENDAR_MAX_YEAR + "-12"
        ? CALENDAR_MAX_YEAR + "-12"
        : currentYearMonth;
    const humanToday = MONTH_NAMES[todayMonth - 1] + " " + todayDay + ", " + todayYear;

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
      calendarMonth,
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

    const firstDayOfWeek = new Date(Date.UTC(yearNum, monthNum - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();

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
      todayYM: calendarMonth,
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

    const requestedId = req.params.id || req.query.id;
    const selectedOrg = requestedId
      ? organizers.find(function (organizer) {
          return String(organizer._id) === requestedId;
        })
      : organizers[0];

    if (!selectedOrg && requestedId) {
      return res.status(404).render("error", {
        title: "Organizer not found",
        message: "The requested organizer could not be found.",
      });
    }
    if (!selectedOrg) {
      return res.render("organizer", {
        title: "DLSU Organizers & Research Centers — AnimoEvents",
        activeNav: "organizers",
        organizers: [],
        selectedOrg: null,
        orgEvents: [],
      });
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
  postJoinRsvp,
  postLeaveRsvp,
  getCalendar,
  getOrganizersDirectory,
};

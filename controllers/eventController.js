/**
 * Event Posts, Lifecycle & Discussion Thread Controller (controllers/eventController.js)
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { extractValidationErrors } = require("../middleware/validators");
const {
  STUDENT_ACADEMIC_LEVELS,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
  DEPARTMENTS_BY_COLLEGE,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  MIN_EVENT_DATE,
  MAX_EVENT_DATE,
} = require("../model/constants");

function buildDeptToCollegeMap() {
  const map = {};
  Object.keys(DEPARTMENTS_BY_COLLEGE).forEach(function (collegeCode) {
    DEPARTMENTS_BY_COLLEGE[collegeCode].forEach(function (dept) {
      if (dept.code !== "N/A") {
        map[dept.code] = collegeCode;
      }
    });
  });
  return map;
}

const DEPT_TO_COLLEGE = buildDeptToCollegeMap();

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  return [String(val)];
}

function uniqueValidValues(values, allowed) {
  return Array.from(
    new Set(
      toArray(values).filter(function (v) {
        return allowed.indexOf(v) !== -1;
      }),
    ),
  );
}

function getNowTimestamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hrs = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hrs}:${mins}`;
}

async function syncEventLifecycles() {
  const now = new Date();
  const activeEvents = await Event.find({
    status: { $in: ["Open", "Full", "Closed"] },
  });

  for (let i = 0; i < activeEvents.length; i++) {
    const ev = activeEvents[i];
    const endClock =
      ev.endTime && ev.endTime.trim() !== "" ? ev.endTime.trim() : "23:59";
    const eventEnd = new Date(ev.date + "T" + endClock + ":00");
    let changed = false;

    if (!isNaN(eventEnd.getTime()) && eventEnd < now) {
      ev.status = "Completed";
      changed = true;
    } else if (ev.status === "Open" && ev.attendees.length >= ev.maxCapacity) {
      ev.status = "Full";
      changed = true;
    } else if (ev.status === "Full" && ev.attendees.length < ev.maxCapacity) {
      ev.status = "Open";
      changed = true;
    }

    if (changed) {
      await ev.save();
    }
  }
}

function buildVisibilityQuery(user) {
  if (!user) {
    return { isPublic: true };
  }

  const eligibilityConditions = [
    {
      $or: [{ targetColleges: { $size: 0 } }, { targetColleges: user.college }],
    },
    {
      $or: [{ targetCampuses: { $size: 0 } }, { targetCampuses: user.campus }],
    },
  ];

  if (user.role === "Student") {
    eligibilityConditions.push({
      $or: [{ targetRoles: { $size: 0 } }, { targetRoles: "Student" }],
    });
    eligibilityConditions.push({
      $or: [
        { targetAcademicLevels: { $size: 0 } },
        { targetAcademicLevels: user.academicLevel },
      ],
    });
  } else if (user.role === "Faculty") {
    eligibilityConditions.push({
      $or: [
        { targetRoles: "Faculty" },
        {
          $and: [
            { targetRoles: { $size: 0 } },
            { targetAcademicLevels: { $size: 0 } },
          ],
        },
      ],
    });
  }

  return {
    $or: [
      { isPublic: true },
      { organizer: user._id },
      { attendees: user._id },
      { $and: eligibilityConditions },
    ],
  };
}

function isUserEligibleForEvent(user, event) {
  if (!event) return false;
  if (event.isPublic) return true;
  if (!user) return false;
  if (String(event.organizer) === String(user._id)) return true;

  const roles = event.targetRoles || [];
  const levels = event.targetAcademicLevels || [];
  const colleges = event.targetColleges || [];
  const depts = event.targetDepartments || [];
  const campuses = event.targetCampuses || [];

  if (user.role === "Student") {
    if (roles.length > 0 && roles.indexOf("Student") === -1) return false;
    if (levels.length > 0 && levels.indexOf(user.academicLevel) === -1) {
      return false;
    }
  } else if (user.role === "Faculty") {
    if (roles.length > 0) {
      if (roles.indexOf("Faculty") === -1) return false;
    } else if (levels.length > 0) {
      return false;
    }
  }

  if (colleges.length > 0 && colleges.indexOf(user.college) === -1) {
    return false;
  }

  if (depts.length > 0) {
    const collegeHasDeptFilter = depts.some(function (d) {
      return DEPT_TO_COLLEGE[d] === user.college;
    });
    if (collegeHasDeptFilter && depts.indexOf(user.department) === -1) {
      return false;
    }
  }

  if (campuses.length > 0 && campuses.indexOf(user.campus) === -1) {
    return false;
  }

  return true;
}

function canUserViewEvent(user, event) {
  if (!event) return false;
  if (event.isPublic) return true;
  if (!user) return false;
  if (String(event.organizer) === String(user._id)) return true;
  const isAttendee = (event.attendees || []).some(function (id) {
    return String(id) === String(user._id);
  });
  if (isAttendee) return true;
  return isUserEligibleForEvent(user, event);
}

function isGrandfatheredAttendee(user, event) {
  if (!user || !event) return false;
  const isAttendee = (event.attendees || []).some(function (id) {
    return String(id) === String(user._id);
  });
  return isAttendee && !isUserEligibleForEvent(user, event);
}

function formatAudienceSummary(event) {
  if (event.isPublic) {
    return "Open to All DLSU Community";
  }
  const parts = [];
  if (event.targetColleges && event.targetColleges.length > 0) {
    parts.push(event.targetColleges.join(", "));
  }
  if (event.targetDepartments && event.targetDepartments.length > 0) {
    parts.push("Dept/Strand: " + event.targetDepartments.join(", "));
  }
  if (event.targetAcademicLevels && event.targetAcademicLevels.length > 0) {
    parts.push(event.targetAcademicLevels.join(", "));
  }
  if (event.targetRoles && event.targetRoles.length > 0) {
    parts.push(event.targetRoles.join(" / "));
  }
  if (event.targetCampuses && event.targetCampuses.length > 0) {
    parts.push(event.targetCampuses.join(" & ") + " Campus");
  }
  return parts.length > 0
    ? "Restricted: " + parts.join(" • ")
    : "Targeted Audience";
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Open":
      return "badge-status-open";
    case "Full":
      return "badge-status-full";
    case "Closed":
      return "badge-status-closed";
    case "Postponed":
      return "badge-status-postponed";
    case "Cancelled":
      return "badge-status-cancelled";
    case "Completed":
      return "badge-status-completed";
    default:
      return "bg-secondary text-white";
  }
}

function decorateEventForView(ev, user, bookmarkedSet) {
  const isJoined =
    Boolean(user) &&
    (ev.attendees || []).some(function (id) {
      return String(id) === String(user._id);
    });
  const isOwner = Boolean(user) && String(ev.organizer) === String(user._id);
  const isBookmarked =
    Boolean(user) && bookmarkedSet && bookmarkedSet.has(String(ev._id));
  const isGrandfathered = isGrandfatheredAttendee(user, ev);
  const isArchived = ev.status === "Completed" || ev.status === "Cancelled";

  return Object.assign({}, ev, {
    isJoined,
    isOwner,
    isBookmarked,
    isGrandfathered,
    isArchived,
    isOpen: ev.status === "Open",
    isOrganizerViewer: Boolean(user) && user.role === "Organizer" && !isOwner,
    statusBadgeClass: getStatusBadgeClass(ev.status),
    audienceLabel: formatAudienceSummary(ev),
    attendeeCount: (ev.attendees || []).length,
    updateCount: (ev.updates || []).length,
  });
}

async function getHomeFeed(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;
    const validFeeds = ["eligible", "targeted", "joined", "archive"];
    const activeFeedMode =
      validFeeds.indexOf(req.query.feed) !== -1 ? req.query.feed : "eligible";

    const queriedEvents = await Event.find(buildVisibilityQuery(user))
      .sort({ createdAt: -1 })
      .lean();
    const visibleEvents = queriedEvents.filter(function (ev) {
      return canUserViewEvent(user, ev);
    });

    const bookmarkedSet = new Set();
    if (user) {
      const userBookmarks = await Bookmark.find({ user: user._id }).lean();
      userBookmarks.forEach(function (bm) {
        bookmarkedSet.add(String(bm.event));
      });
    }

    const decoratedVisible = visibleEvents.map(function (ev) {
      return decorateEventForView(ev, user, bookmarkedSet);
    });

    const activeEligible = decoratedVisible.filter(function (ev) {
      return !ev.isArchived;
    });
    const activeTargeted = activeEligible.filter(function (ev) {
      return !ev.isPublic;
    });
    const myJoinedOrHosted = decoratedVisible.filter(function (ev) {
      if (!user) return false;
      return user.role === "Organizer" ? ev.isOwner : ev.isJoined;
    });
    const archivedEvents = decoratedVisible.filter(function (ev) {
      return ev.isArchived;
    });

    let feedEvents = activeEligible;
    let feedHeading = "Upcoming Eligible Campus Events";
    if (activeFeedMode === "targeted") {
      feedEvents = activeTargeted;
      feedHeading = "Upcoming Events Targeted for My Group";
    } else if (activeFeedMode === "joined") {
      feedEvents = myJoinedOrHosted;
      feedHeading =
        user && user.role === "Organizer"
          ? "My Hosted Campus Events"
          : "Events I Have Joined";
    } else if (activeFeedMode === "archive") {
      feedEvents = archivedEvents;
      feedHeading = "Past & Completed Events Archive";
    }

    const subscribedEvents = visibleEvents.filter(function (ev) {
      if (!user) return ev.isPublic;
      if (user.role === "Organizer") {
        return String(ev.organizer) === String(user._id);
      }
      return (ev.attendees || []).some(function (id) {
        return String(id) === String(user._id);
      });
    });

    const officialUpdates = [];
    subscribedEvents.forEach(function (ev) {
      (ev.updates || []).forEach(function (upd) {
        if (upd.isOfficialUpdate) {
          officialUpdates.push({
            eventId: String(ev._id),
            eventTitle: ev.title,
            organizerName: ev.organizerName,
            content: upd.content,
            postedAt: upd.postedAt,
          });
        }
      });
    });
    officialUpdates.sort(function (a, b) {
      return String(b.postedAt).localeCompare(String(a.postedAt));
    });

    res.render("index", {
      title: "AnimoEvents — DLSU Campus Events & Activities Hub",
      activeNav: "home",
      activeFeedMode,
      feedHeading,
      events: feedEvents,
      counts: {
        eligible: activeEligible.length,
        targeted: activeTargeted.length,
        joined: myJoinedOrHosted.length,
        archive: archivedEvents.length,
      },
      officialUpdates,
      updateCount: officialUpdates.length,
    });
  } catch (err) {
    next(err);
  }
}

async function getEventDetails(req, res, next) {
  try {
    await syncEventLifecycles();
    const user = req.currentUser;
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    const ev = await Event.findById(eventId).lean();
    if (!ev) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    if (!canUserViewEvent(user, ev)) {
      return res.status(403).render("error", {
        title: "Access Restricted to Target Audience",
        message:
          'This event ("' +
          ev.title +
          '") is restricted to ' +
          formatAudienceSummary(ev) +
          ".",
      });
    }

    const bookmarkedSet = new Set();
    if (user) {
      const bm = await Bookmark.findOne({
        user: user._id,
        event: ev._id,
      }).lean();
      if (bm) bookmarkedSet.add(String(ev._id));
    }

    const decorated = decorateEventForView(ev, user, bookmarkedSet);
    const capacityPercent = Math.min(
      100,
      Math.round((decorated.attendeeCount / ev.maxCapacity) * 100),
    );

    const attendeeDocs = await User.find({
      _id: { $in: ev.attendees || [] },
    }).lean();
    const attendeeMap = {};
    attendeeDocs.forEach(function (u) {
      attendeeMap[String(u._id)] = u;
    });
    const confirmedParticipants = (ev.attendees || [])
      .map(function (id) {
        return attendeeMap[String(id)];
      })
      .filter(Boolean);

    const decoratedUpdates = (ev.updates || []).map(function (upd) {
      const canEdit = Boolean(user) && String(upd.author) === String(user._id);
      const canDelete =
        Boolean(user) &&
        (String(upd.author) === String(user._id) || decorated.isOwner);
      return Object.assign({}, upd, {
        canEdit,
        canDelete,
      });
    });

    res.render("event-details", {
      title: ev.title + " — AnimoEvents",
      activeNav: "events",
      event: decorated,
      capacityPercent,
      confirmedParticipants,
      updates: decoratedUpdates,
    });
  } catch (err) {
    next(err);
  }
}

function getEventCreate(_req, res) {
  res.render("event-create", {
    title: "Publish Campus Event — AnimoEvents",
    activeNav: "create",
  });
}

function parseAudienceBody(body) {
  const isPublic = String(body.isPublic) !== "false";
  if (isPublic) {
    return {
      isPublic: true,
      targetRoles: [],
      targetAcademicLevels: [],
      targetColleges: [],
      targetDepartments: [],
      targetCampuses: [],
    };
  }

  const validColleges = COLLEGE_CODES.filter(function (c) {
    return c !== "UNIV";
  });
  const validDepts = ALL_DEPARTMENT_CODES.filter(function (d) {
    return d !== "N/A";
  });

  const targetRoles = uniqueValidValues(body.targetRoles, [
    "Student",
    "Faculty",
  ]);
  const targetAcademicLevels = uniqueValidValues(
    body.targetAcademicLevels,
    STUDENT_ACADEMIC_LEVELS,
  );
  const targetColleges = uniqueValidValues(body.targetColleges, validColleges);
  const targetDepartments = uniqueValidValues(
    body.targetDepartments,
    validDepts,
  );
  const targetCampuses = uniqueValidValues(body.targetCampuses, CAMPUSES);

  targetDepartments.forEach(function (deptCode) {
    const parentCollege = DEPT_TO_COLLEGE[deptCode];
    if (parentCollege && targetColleges.indexOf(parentCollege) === -1) {
      targetColleges.push(parentCollege);
    }
  });

  return {
    isPublic: false,
    targetRoles,
    targetAcademicLevels,
    targetColleges,
    targetDepartments,
    targetCampuses,
  };
}

function validateAudienceRules(audience, errors) {
  if (!audience.isPublic) {
    const hasTarget =
      audience.targetRoles.length > 0 ||
      audience.targetAcademicLevels.length > 0 ||
      audience.targetColleges.length > 0 ||
      audience.targetDepartments.length > 0 ||
      audience.targetCampuses.length > 0;
    if (!hasTarget) {
      errors.push(
        "Select at least one target audience restriction when publishing a Targeted event.",
      );
    }
    if (
      audience.targetAcademicLevels.length > 0 &&
      audience.targetRoles.length > 0 &&
      audience.targetRoles.indexOf("Student") === -1
    ) {
      errors.push(
        "Student academic levels require Students to be included in the target roles.",
      );
    }
  }
}

async function postEventCreate(req, res, next) {
  try {
    const user = req.currentUser;
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "");
    const date = String(req.body.date || "").trim();
    const time = String(req.body.time || "").trim();
    const endTime = String(req.body.endTime || "").trim();
    const venue = String(req.body.venue || "").trim();
    const maxCapacity = Number.parseInt(req.body.maxCapacity, 10);
    const description = String(req.body.description || "").trim();
    const audience = parseAudienceBody(req.body);

    const errors = extractValidationErrors(req);
    if (title.length < 5 || title.length > 120) {
      errors.push("Event title must be between 5 and 120 characters.");
    }
    if (EVENT_CATEGORIES.indexOf(category) === -1) {
      errors.push("Please select a valid event category.");
    }
    if (!date || date < MIN_EVENT_DATE || date > MAX_EVENT_DATE) {
      errors.push("Event date must be between 2025-01-01 and 2036-12-31.");
    }
    if (!time) {
      errors.push("Start time is required.");
    }
    if (endTime && endTime <= time) {
      errors.push("End Time must be later than Start Time.");
    }
    if (venue.length < 3 || venue.length > 100) {
      errors.push("Venue must be between 3 and 100 characters.");
    }
    if (isNaN(maxCapacity) || maxCapacity < 5 || maxCapacity > 5000) {
      errors.push("Maximum capacity must be between 5 and 5000.");
    }
    if (description.length < 20 || description.length > 1000) {
      errors.push("Description must be between 20 and 1000 characters.");
    }
    validateAudienceRules(audience, errors);

    const uniqueErrors = Array.from(new Set(errors));
    if (uniqueErrors.length > 0) {
      return res.status(400).render("event-create", {
        title: "Publish Campus Event — AnimoEvents",
        activeNav: "create",
        error: uniqueErrors.join(" "),
        formData: Object.assign(
          {
            title,
            category,
            date,
            time,
            endTime,
            venue,
            maxCapacity,
            description,
          },
          audience,
        ),
        audienceJson: JSON.stringify(audience),
      });
    }

    const created = await Event.create({
      title,
      category,
      date,
      time,
      endTime,
      venue,
      description,
      organizer: user._id,
      organizerName: user.displayName,
      isPublic: audience.isPublic,
      targetRoles: audience.targetRoles,
      targetAcademicLevels: audience.targetAcademicLevels,
      targetColleges: audience.targetColleges,
      targetDepartments: audience.targetDepartments,
      targetCampuses: audience.targetCampuses,
      status: "Open",
      maxCapacity,
      attendees: [],
      updates: [
        {
          author: user._id,
          authorName: user.displayName,
          authorRole: "Organizer",
          content: "Event published! Registration is now open.",
          isOfficialUpdate: true,
          postedAt: getNowTimestamp(),
        },
      ],
    });

    return res.redirect("/events/" + created._id);
  } catch (err) {
    return next(err);
  }
}

async function getEventEdit(req, res, next) {
  try {
    const ev = req.event;
    const minAllowedCapacity = Math.max(5, (ev.attendees || []).length);
    res.render("event-edit", {
      title: "Edit Event — " + ev.title,
      activeNav: "events",
      event: ev,
      minAllowedCapacity,
      attendeeCount: (ev.attendees || []).length,
      audienceJson: JSON.stringify({
        isPublic: ev.isPublic,
        targetRoles: ev.targetRoles || [],
        targetAcademicLevels: ev.targetAcademicLevels || [],
        targetColleges: ev.targetColleges || [],
        targetDepartments: ev.targetDepartments || [],
        targetCampuses: ev.targetCampuses || [],
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function postEventEdit(req, res, next) {
  try {
    const targetEv = await Event.findById(req.params.id);
    if (!targetEv) {
      return res.status(404).render("error", {
        title: "Event Not Found — AnimoEvents",
        message: "The requested campus event could not be found.",
      });
    }

    const newTitle = String(req.body.title || "").trim();
    const newCategory = String(req.body.category || "");
    const newDate = String(req.body.date || "").trim();
    const newTime = String(req.body.time || "").trim();
    const newEndTime = String(req.body.endTime || "").trim();
    let newStatus = String(req.body.status || targetEv.status);
    const newVenue = String(req.body.venue || "").trim();
    const newCap = Number.parseInt(req.body.maxCapacity, 10);
    const newDesc = String(req.body.description || "").trim();
    const audience = parseAudienceBody(req.body);

    const errors = extractValidationErrors(req);
    if (newTitle.length < 5 || newTitle.length > 120) {
      errors.push("Event title must be between 5 and 120 characters.");
    }
    if (EVENT_CATEGORIES.indexOf(newCategory) === -1) {
      errors.push("Please select a valid event category.");
    }
    if (!newDate || newDate < MIN_EVENT_DATE || newDate > MAX_EVENT_DATE) {
      errors.push("Event date must be between 2025-01-01 and 2036-12-31.");
    }
    if (!newTime) {
      errors.push("Start time is required.");
    }
    if (newEndTime && newEndTime <= newTime) {
      errors.push("End Time must be later than Start Time.");
    }
    if (EVENT_STATUSES.indexOf(newStatus) === -1) {
      errors.push("Please select a valid lifecycle status.");
    }
    if (newVenue.length < 3 || newVenue.length > 100) {
      errors.push("Venue must be between 3 and 100 characters.");
    }
    if (
      isNaN(newCap) ||
      newCap < Math.max(5, targetEv.attendees.length) ||
      newCap > 5000
    ) {
      errors.push(
        "Maximum capacity cannot be lower than current registered participants (" +
          targetEv.attendees.length +
          ") or exceed 5000.",
      );
    }
    if (newDesc.length < 20 || newDesc.length > 1000) {
      errors.push("Description must be between 20 and 1000 characters.");
    }
    validateAudienceRules(audience, errors);

    const uniqueErrors = Array.from(new Set(errors));
    if (uniqueErrors.length > 0) {
      const draftEv = Object.assign(targetEv.toObject(), {
        title: newTitle,
        category: newCategory,
        date: newDate,
        time: newTime,
        endTime: newEndTime,
        status: newStatus,
        venue: newVenue,
        maxCapacity: newCap,
        description: newDesc,
      });
      return res.status(400).render("event-edit", {
        title: "Edit Event — " + newTitle,
        activeNav: "events",
        error: uniqueErrors.join(" "),
        event: draftEv,
        minAllowedCapacity: Math.max(5, targetEv.attendees.length),
        attendeeCount: targetEv.attendees.length,
        audienceJson: JSON.stringify(audience),
      });
    }

    if (newStatus === "Open" && targetEv.attendees.length >= newCap) {
      newStatus = "Full";
    } else if (newStatus === "Full" && targetEv.attendees.length < newCap) {
      newStatus = "Open";
    }

    const scheduleOrStatusChanged =
      targetEv.title !== newTitle ||
      targetEv.date !== newDate ||
      targetEv.time !== newTime ||
      targetEv.venue !== newVenue ||
      targetEv.status !== newStatus;

    targetEv.title = newTitle;
    targetEv.category = newCategory;
    targetEv.date = newDate;
    targetEv.time = newTime;
    targetEv.endTime = newEndTime;
    targetEv.status = newStatus;
    targetEv.venue = newVenue;
    targetEv.maxCapacity = newCap;
    targetEv.description = newDesc;
    targetEv.isPublic = audience.isPublic;
    targetEv.targetRoles = audience.targetRoles;
    targetEv.targetAcademicLevels = audience.targetAcademicLevels;
    targetEv.targetColleges = audience.targetColleges;
    targetEv.targetDepartments = audience.targetDepartments;
    targetEv.targetCampuses = audience.targetCampuses;

    if (scheduleOrStatusChanged) {
      targetEv.updates.unshift({
        author: targetEv.organizer,
        authorName: targetEv.organizerName,
        authorRole: "Organizer",
        content:
          "[Official Schedule/Venue Update] Event details updated: " +
          newDate +
          " at " +
          newTime +
          ", Venue: " +
          newVenue +
          " (Status: " +
          newStatus +
          ").",
        isOfficialUpdate: true,
        postedAt: getNowTimestamp(),
      });
    }

    await targetEv.save();
    return res.redirect("/events/" + targetEv._id);
  } catch (err) {
    return next(err);
  }
}

async function postEventDelete(req, res, next) {
  try {
    const eventId = req.params.id;
    await Bookmark.deleteMany({ event: eventId });
    await Event.findByIdAndDelete(eventId);
    return res.redirect("/events");
  } catch (err) {
    return next(err);
  }
}

async function postThreadUpdate(req, res, next) {
  try {
    const user = req.currentUser;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/events");
    }

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.redirect("/events");

    if (!canUserViewEvent(user, ev)) {
      return res.status(403).render("error", {
        title: "Access Forbidden — AnimoEvents",
        message: "You do not have permission to post in this restricted event.",
      });
    }

    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("error", {
        title: "Invalid Discussion Post — AnimoEvents",
        message: valErrors.join(" "),
      });
    }

    const content = String(req.body.content || "").trim();
    if (content.length >= 2 && content.length <= 500) {
      const isHost = String(ev.organizer) === String(user._id);
      ev.updates.unshift({
        author: user._id,
        authorName: user.displayName,
        authorRole: user.role,
        content,
        isOfficialUpdate: isHost,
        postedAt: getNowTimestamp(),
      });
      await ev.save();
    }

    return res.redirect("/events/" + ev._id);
  } catch (err) {
    return next(err);
  }
}

async function postEditThreadUpdate(req, res, next) {
  try {
    const user = req.currentUser;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/events");
    }

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.redirect("/events");

    const valErrors = extractValidationErrors(req);
    if (valErrors.length > 0) {
      return res.status(400).render("error", {
        title: "Invalid Discussion Post — AnimoEvents",
        message: valErrors.join(" "),
      });
    }

    const content = String(req.body.content || "").trim();
    if (content.length >= 2 && content.length <= 500) {
      for (let i = 0; i < ev.updates.length; i++) {
        if (
          String(ev.updates[i]._id) === String(req.params.updateId) &&
          String(ev.updates[i].author) === String(user._id)
        ) {
          ev.updates[i].content = content;
          await ev.save();
          break;
        }
      }
    }

    return res.redirect("/events/" + ev._id);
  } catch (err) {
    return next(err);
  }
}

async function postDeleteThreadUpdate(req, res, next) {
  try {
    const user = req.currentUser;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.redirect("/events");
    }

    const ev = await Event.findById(req.params.id);
    if (!ev) return res.redirect("/events");

    const isOwner = String(ev.organizer) === String(user._id);
    ev.updates = ev.updates.filter(function (upd) {
      if (String(upd._id) !== String(req.params.updateId)) return true;
      const isAuthor = String(upd.author) === String(user._id);
      return !(isAuthor || isOwner);
    });

    await ev.save();
    return res.redirect("/events/" + ev._id);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  syncEventLifecycles,
  buildVisibilityQuery,
  isUserEligibleForEvent,
  canUserViewEvent,
  isGrandfatheredAttendee,
  formatAudienceSummary,
  getStatusBadgeClass,
  decorateEventForView,
  getHomeFeed,
  getEventDetails,
  getEventCreate,
  postEventCreate,
  getEventEdit,
  postEventEdit,
  postEventDelete,
  postThreadUpdate,
  postEditThreadUpdate,
  postDeleteThreadUpdate,
};

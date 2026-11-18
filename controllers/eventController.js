/**
 * Event Posts, Lifecycle & Discussion Thread Controller (controllers/eventController.js)
 */
const mongoose = require("mongoose");
const User = require("../model/User");
const Event = require("../model/Event");
const Bookmark = require("../model/Bookmark");
const { extractValidationErrors } = require("../middleware/validators");
const { getManilaTimestamp, isEventEnded } = require("../model/manilaTime");
const {
  STUDENT_ACADEMIC_LEVELS,
  COLLEGES,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
  DEPARTMENTS_BY_COLLEGE,
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

const AUDIENCE_COLLEGES = COLLEGES.filter(function (c) {
  return c.code !== "UNIV";
});

const AUDIENCE_DEPT_GROUPS = Object.keys(DEPARTMENTS_BY_COLLEGE)
  .filter(function (code) {
    return code !== "UNIV";
  })
  .map(function (collegeCode) {
    return {
      collegeCode: collegeCode,
      departments: DEPARTMENTS_BY_COLLEGE[collegeCode].map(function (d) {
        return {
          code: d.code,
          shortName: d.name.replace(/^Department of /, ""),
        };
      }),
    };
  });

const AUDIENCE_OPTIONS = {
  targetRoles: { label: "roles", values: ["Student", "Faculty"] },
  targetAcademicLevels: {
    label: "academic levels",
    values: STUDENT_ACADEMIC_LEVELS,
  },
  targetColleges: {
    label: "colleges",
    values: COLLEGE_CODES.filter(code => code !== "UNIV"),
  },
  targetDepartments: {
    label: "departments or strands",
    values: ALL_DEPARTMENT_CODES.filter(code => code !== "N/A"),
  },
  targetCampuses: { label: "campuses", values: CAMPUSES },
};
const AUDIENCE_FIELDS = Object.keys(AUDIENCE_OPTIONS);

function hasAudienceRestrictions(event) {
  return AUDIENCE_FIELDS.some(field => event[field] && event[field].length > 0);
}

function eventRevisionFilter(event) {
  return {
    _id: event._id,
    __v: event.__v === undefined ? { $exists: false } : event.__v,
  };
}

async function syncEventLifecycles() {
  const now = new Date();
  const activeEvents = await Event.find({
    status: { $in: ["Open", "Full", "Closed"] },
  }).select("status date endTime attendees maxCapacity __v").lean();

  const updates = [];
  for (const ev of activeEvents) {
    const attendeeCount = (ev.attendees || []).length;
    let status = ev.status;
    if (isEventEnded(ev, now)) {
      status = "Completed";
    } else if (ev.status === "Open" && attendeeCount >= ev.maxCapacity) {
      status = "Full";
    } else if (ev.status === "Full" && attendeeCount < ev.maxCapacity) {
      status = "Open";
    }

    if (status === ev.status) continue;
    updates.push({
      updateOne: {
        filter: eventRevisionFilter(ev),
        update: { $set: { status }, $inc: { __v: 1 } },
      },
    });
  }
  if (updates.length > 0) {
    await Event.bulkWrite(updates, { ordered: false });
  }
}

function buildVisibilityQuery(user) {
  if (!user) {
    return { isPublic: true };
  }

  const collegeDeptCodes = (DEPARTMENTS_BY_COLLEGE[user.college] || [])
    .map(function (d) {
      return d.code;
    })
    .filter(function (code) {
      return code !== "N/A";
    });

  const eligibilityConditions = [
    {
      $or: AUDIENCE_FIELDS.map(field => ({ [field + ".0"]: { $exists: true } })),
    },
    {
      $or: [
        { targetColleges: user.college },
        {
          $and: [
            { targetColleges: { $size: 0 } },
            { $or: [{ targetDepartments: { $size: 0 } }, { targetDepartments: user.department }] },
          ],
        },
      ],
    },
    {
      $or: [
        { targetDepartments: { $nin: collegeDeptCodes } },
        { targetDepartments: user.department },
      ],
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
  } else if (user.role === "Organizer") {
    eligibilityConditions.push({
      $and: [
        { targetRoles: { $size: 0 } },
        { targetAcademicLevels: { $size: 0 } },
      ],
    });
  } else {
    return {
      $or: [{ isPublic: true }, { organizer: user._id }, { attendees: user._id }],
    };
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
  if (event.organizer && String(event.organizer) === String(user._id)) return true;
  if (!hasAudienceRestrictions(event)) return false;

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
  } else if (user.role === "Organizer") {
    if (roles.length > 0 || levels.length > 0) {
      return false;
    }
  } else {
    return false;
  }

  if (colleges.length > 0 && colleges.indexOf(user.college) === -1) {
    return false;
  }

  if (depts.length > 0) {
    const collegeHasDeptFilter = depts.some(function (d) {
      return DEPT_TO_COLLEGE[d] === user.college;
    });
    if ((!colleges.length || collegeHasDeptFilter) && !depts.includes(user.department)) {
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

function eventNotFound(res) {
  return res.status(404).render("error", {
    title: "Event Not Found — AnimoEvents",
    message: "The requested campus event could not be found.",
  });
}

async function renderEventDetails(req, res, ev, discussion = {}) {
  const user = req.currentUser;
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
  })
    .select("displayName profilePic role college department campus academicLevel")
    .lean();
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
    const editing = discussion.editId === String(upd._id);
    return Object.assign({}, upd, {
      canEdit,
      canDelete,
      editing,
      draftContent: editing ? discussion.content : upd.content,
    });
  });

  return res.render("event-details", {
    title: ev.title + " — AnimoEvents",
    activeNav: "events",
    event: decorated,
    capacityPercent,
    confirmedParticipants,
    updates: decoratedUpdates,
    discussionError: discussion.error,
    discussionContent: discussion.editId ? "" : discussion.content,
  });
}

async function getEventDetails(req, res, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return eventNotFound(res);
    await syncEventLifecycles();
    const ev = await Event.findById(req.params.id).lean();
    if (!canUserViewEvent(req.currentUser, ev)) return eventNotFound(res);
    return await renderEventDetails(req, res, ev);
  } catch (err) {
    next(err);
  }
}

function getEventCreate(req, res) {
  const defaultAudience = {
    isPublic: true,
    targetRoles: [],
    targetAcademicLevels: [],
    targetColleges: [],
    targetDepartments: [],
    targetCampuses: [],
  };
  res.render("event-create", {
    title: "Publish Campus Event — AnimoEvents",
    activeNav: "create",
    formData: {
      title: "",
      category: "",
      date: "",
      time: "",
      endTime: "",
      venue: "",
      maxCapacity: 30,
      description: "",
    },
    audience: defaultAudience,
    audienceColleges: AUDIENCE_COLLEGES,
    audienceDeptGroups: AUDIENCE_DEPT_GROUPS,
  });
}

function parseAudienceBody(body, errors) {
  const audience = { isPublic: body.isPublic === true || body.isPublic === "true" };
  for (const field of AUDIENCE_FIELDS) {
    const raw = body[field];
    const submitted = raw === undefined ? [] : (Array.isArray(raw) ? raw : [raw]);
    const allowed = AUDIENCE_OPTIONS[field];
    const valid = submitted.filter(value => allowed.values.includes(value));
    if (valid.length !== submitted.length) {
      errors.push("Select valid audience " + allowed.label + ".");
    }
    audience[field] = audience.isPublic ? [] : [...new Set(valid)];
  }

  for (const deptCode of audience.targetDepartments) {
    const parentCollege = DEPT_TO_COLLEGE[deptCode];
    if (parentCollege && !audience.targetColleges.includes(parentCollege)) {
      audience.targetColleges.push(parentCollege);
    }
  }
  return audience;
}

function validateAudienceRules(audience, errors) {
  if (audience.isPublic) return;
  if (!hasAudienceRestrictions(audience)) {
    errors.push("Select at least one audience restriction for a targeted event.");
  }
  if (!audience.targetAcademicLevels.length) return;

  if (audience.targetRoles.length && !audience.targetRoles.includes("Student")) {
    errors.push("Include Students in target roles when selecting student academic levels.");
    return;
  }

  const matchesCollege = audience.targetColleges.some(college =>
    audience.targetAcademicLevels.some(level =>
      (college === "SHS") === (level === "Senior High School")
    )
  );
  if (audience.targetColleges.length && !matchesCollege) {
    errors.push("Select academic levels that match at least one target college or school.");
  }
}

function readEventFields(body) {
  const fields = {};
  for (const name of ["title", "category", "date", "time", "endTime", "venue", "description"]) {
    fields[name] = typeof body[name] === "string" ? body[name].trim() : "";
  }
  const capacity = body.maxCapacity;
  const hasCapacity = typeof capacity === "number" ||
    (typeof capacity === "string" && capacity.trim() !== "");
  fields.maxCapacity = hasCapacity ? Number(capacity) : NaN;
  return fields;
}

async function postEventCreate(req, res, next) {
  try {
    const user = req.currentUser;
    const draft = readEventFields(req.body);
    const errors = extractValidationErrors(req);
    const audience = parseAudienceBody(req.body, errors);
    validateAudienceRules(audience, errors);

    if (errors.length > 0) {
      return res.status(400).render("event-create", {
        title: "Publish Campus Event — AnimoEvents",
        activeNav: "create",
        error: errors.join(" "),
        formData: { ...draft, maxCapacity: Number.isFinite(draft.maxCapacity) ? draft.maxCapacity : "" },
        audience,
        audienceColleges: AUDIENCE_COLLEGES,
        audienceDeptGroups: AUDIENCE_DEPT_GROUPS,
      });
    }

    const status = isEventEnded(draft) ? "Completed" : "Open";
    const created = await Event.create({
      ...draft,
      ...audience,
      organizer: user._id,
      organizerName: user.displayName,
      status,
      attendees: [],
      updates: [
        {
          author: user._id,
          authorName: user.displayName,
          authorRole: "Organizer",
          content: status === "Open"
            ? "Registration is now open."
            : "This event has been added to the archive.",
          isOfficialUpdate: true,
          postedAt: getManilaTimestamp(),
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
    const audience = {
      isPublic: ev.isPublic,
      targetRoles: ev.targetRoles || [],
      targetAcademicLevels: ev.targetAcademicLevels || [],
      targetColleges: ev.targetColleges || [],
      targetDepartments: ev.targetDepartments || [],
      targetCampuses: ev.targetCampuses || [],
    };
    res.render("event-edit", {
      title: "Edit Event — " + ev.title,
      activeNav: "events",
      event: ev,
      minAllowedCapacity,
      attendeeCount: (ev.attendees || []).length,
      audience,
      audienceColleges: AUDIENCE_COLLEGES,
      audienceDeptGroups: AUDIENCE_DEPT_GROUPS,
    });
  } catch (err) {
    next(err);
  }
}

async function postEventEdit(req, res, next) {
  try {
    const event = req.event;
    const draft = {
      ...readEventFields(req.body),
      status: typeof req.body.status === "string" ? req.body.status : event.status,
    };

    const errors = extractValidationErrors(req);
    const audience = parseAudienceBody(req.body, errors);
    validateAudienceRules(audience, errors);
    if (draft.maxCapacity < event.attendees.length) {
      errors.push("Maximum capacity cannot be lower than the current registration count.");
    }

    function renderDraft(status, message, latest) {
      return res.status(status).render("event-edit", {
        title: "Edit Event — " + latest.title,
        activeNav: "events",
        error: message,
        event: Object.assign({}, latest, draft, {
          maxCapacity: Number.isFinite(draft.maxCapacity) ? draft.maxCapacity : "",
        }),
        minAllowedCapacity: Math.max(5, latest.attendees.length),
        attendeeCount: latest.attendees.length,
        audience,
        audienceColleges: AUDIENCE_COLLEGES,
        audienceDeptGroups: AUDIENCE_DEPT_GROUPS,
      });
    }
    if (errors.length > 0) return renderDraft(400, errors.join(" "), event);

    let status = draft.status;
    if (["Open", "Full", "Closed"].includes(status) && isEventEnded(draft)) {
      status = "Completed";
    } else if (status === "Open" || status === "Full") {
      status = event.attendees.length >= draft.maxCapacity ? "Full" : "Open";
    }

    const changes = {
      $set: Object.assign({}, draft, audience, { status }),
      $inc: { __v: 1 },
    };
    const scheduleChanged =
      event.title !== draft.title ||
      event.date !== draft.date ||
      event.time !== draft.time ||
      (event.endTime || "") !== draft.endTime ||
      event.venue !== draft.venue ||
      event.status !== status;

    if (scheduleChanged) {
      const hours = draft.endTime ? draft.time + "–" + draft.endTime : draft.time;
      changes.$push = {
        updates: {
          author: event.organizer,
          authorName: req.currentUser.displayName,
          authorRole: "Organizer",
          content: "Event details updated: " + draft.date + " at " + hours +
            ", venue: " + draft.venue + ". Status: " + status + ".",
          isOfficialUpdate: true,
          postedAt: getManilaTimestamp(),
        },
      };
    }

    const owner = { _id: event._id, organizer: req.currentUser._id };
    const result = await Event.updateOne(
      { ...owner, ...eventRevisionFilter(event) },
      changes,
      { runValidators: true },
    );
    if (result.matchedCount === 0) {
      const latest = await Event.findOne(owner).lean();
      if (!latest) return eventNotFound(res);
      return renderDraft(409, "The event changed while you were saving. Review the latest registration count and submit again.", latest);
    }
    return res.redirect("/events/" + event._id);
  } catch (err) {
    return next(err);
  }
}

async function postEventDelete(req, res, next) {
  try {
    const eventId = req.params.id;
    if (!mongoose.isObjectIdOrHexString(eventId)) return eventNotFound(res);

    const result = await Event.deleteOne({ _id: eventId, organizer: req.currentUser._id });
    if (!result.deletedCount && await Event.exists({ _id: eventId })) {
      return eventNotFound(res);
    }
    // Also clean up on retry if the event was deleted before the first cleanup completed.
    await Bookmark.deleteMany({ event: eventId });
    return res.redirect("/events");
  } catch (err) {
    return next(err);
  }
}

async function findVisibleThreadEvent(req) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return null;
  const event = await Event.findById(req.params.id).lean();
  return canUserViewEvent(req.currentUser, event) ? event : null;
}

function findThreadUpdate(event, updateId) {
  if (!mongoose.isObjectIdOrHexString(updateId)) return undefined;
  return event.updates.find(update => String(update._id) === updateId);
}

function threadUpdateNotFound(res) {
  return res.status(404).render("error", {
    title: "Discussion Post Not Found — AnimoEvents",
    message: "The requested discussion post could not be found.",
  });
}

function threadUpdateForbidden(res) {
  return res.status(403).render("error", {
    title: "Access Forbidden — AnimoEvents",
    message: "You do not have permission to change this discussion post.",
  });
}

async function renderInvalidDiscussion(req, res, event, errors, editId) {
  const content = typeof req.body.content === "string" ? req.body.content : "";
  return await renderEventDetails(req, res.status(400), event, {
    error: errors.join(" "),
    content,
    editId,
  });
}

async function updateDiscussion(req, res, event, changes, editId) {
  const result = await Event.updateOne(
    eventRevisionFilter(event),
    { ...changes, $inc: { __v: 1 } },
    { runValidators: true },
  );
  if (result.matchedCount === 0) {
    const latest = await findVisibleThreadEvent(req);
    if (!latest) return eventNotFound(res);
    return await renderEventDetails(req, res.status(409), latest, {
      error: "The event changed while you were saving. Please try again.",
      content: typeof req.body.content === "string" ? req.body.content : "",
      editId,
    });
  }
  return res.redirect("/events/" + event._id + "#thread-posts-list");
}

async function postThreadUpdate(req, res, next) {
  try {
    const event = await findVisibleThreadEvent(req);
    if (!event) return eventNotFound(res);
    const validationErrors = extractValidationErrors(req);
    if (validationErrors.length > 0) {
      return await renderInvalidDiscussion(req, res, event, validationErrors);
    }
    const user = req.currentUser;
    return await updateDiscussion(req, res, event, {
      $push: {
        updates: {
          author: user._id,
          authorName: user.displayName,
          authorRole: user.role,
          content: req.body.content,
          isOfficialUpdate: String(event.organizer) === String(user._id),
          postedAt: getManilaTimestamp(),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function postEditThreadUpdate(req, res, next) {
  try {
    const event = await findVisibleThreadEvent(req);
    if (!event) return eventNotFound(res);
    const update = findThreadUpdate(event, req.params.updateId);
    if (!update) return threadUpdateNotFound(res);
    if (String(update.author) !== String(req.currentUser._id)) {
      return threadUpdateForbidden(res);
    }
    const validationErrors = extractValidationErrors(req);
    if (validationErrors.length > 0) {
      return await renderInvalidDiscussion(req, res, event, validationErrors, req.params.updateId);
    }
    const updateIndex = event.updates.indexOf(update);
    return await updateDiscussion(req, res, event, {
      $set: { ["updates." + updateIndex + ".content"]: req.body.content },
    }, req.params.updateId);
  } catch (err) {
    return next(err);
  }
}

async function postDeleteThreadUpdate(req, res, next) {
  try {
    const event = await findVisibleThreadEvent(req);
    if (!event) return eventNotFound(res);
    const update = findThreadUpdate(event, req.params.updateId);
    if (!update) return threadUpdateNotFound(res);
    const userId = String(req.currentUser._id);
    if (String(update.author) !== userId && String(event.organizer) !== userId) {
      return threadUpdateForbidden(res);
    }
    return await updateDiscussion(req, res, event, {
      $pull: { updates: { _id: update._id } },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  syncEventLifecycles,
  eventRevisionFilter,
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

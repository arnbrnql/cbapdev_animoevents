/**
 * Event & Embedded Update Mongoose Schema (model/Event.js)
 * Supports 6-state lifecycle, optional endTime, orthogonal audience targeting, and discussion threads.
 */
const mongoose = require("mongoose");
const {
  ROLES,
  STUDENT_ACADEMIC_LEVELS,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
} = require("./constants");

const updateSubSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authorName: {
    type: String,
    required: true,
    trim: true,
  },
  authorRole: {
    type: String,
    enum: ROLES,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 500,
  },
  isOfficialUpdate: {
    type: Boolean,
    default: false,
  },
  postedAt: {
    type: String,
    required: true,
    trim: true,
  },
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 120,
  },
  category: {
    type: String,
    enum: EVENT_CATEGORIES,
    required: true,
  },
  date: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: {
    type: String,
    default: "",
    trim: true,
  },
  venue: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 1000,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  organizerName: {
    type: String,
    required: true,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  targetRoles: [
    {
      type: String,
      enum: ["Student", "Faculty"],
    },
  ],
  targetAcademicLevels: [
    {
      type: String,
      enum: STUDENT_ACADEMIC_LEVELS,
    },
  ],
  targetColleges: [
    {
      type: String,
      enum: COLLEGE_CODES,
    },
  ],
  targetDepartments: [
    {
      type: String,
      enum: ALL_DEPARTMENT_CODES,
    },
  ],
  targetCampuses: [
    {
      type: String,
      enum: CAMPUSES,
    },
  ],
  status: {
    type: String,
    enum: EVENT_STATUSES,
    default: "Open",
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 5,
    max: 5000,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  updates: [updateSubSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Event", eventSchema);

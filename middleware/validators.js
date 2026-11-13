/**
 * Server-Side Request Validation Chains (middleware/validators.js)
 * Uses express-validator to validate and sanitize incoming form payloads.
 */
const { body, validationResult } = require("express-validator");
const {
  ROLES,
  ACADEMIC_LEVELS,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  MIN_EVENT_DATE,
  MAX_EVENT_DATE,
} = require("../model/constants");

function extractValidationErrors(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return [];
  return result.array().map(function (err) {
    return err.msg;
  });
}

const loginValidation = [
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .matches(/@dlsu\.edu\.ph$/i)
    .withMessage(
      "Please use a valid @dlsu.edu.ph institutional email address.",
    ),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
];

const registerValidation = [
  body("displayName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Display name must be between 2 and 100 characters."),
  body("email")
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Registration requires a valid @dlsu.edu.ph email address.")
    .matches(/@dlsu\.edu\.ph$/i)
    .withMessage("Registration requires a valid @dlsu.edu.ph email address."),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  body("role")
    .isIn(ROLES)
    .withMessage("Please select a valid account affiliation."),
  body("campus")
    .isIn(CAMPUSES)
    .withMessage("Please select a valid primary campus."),
  body("bio")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters."),
];

const profileEditValidation = [
  body("displayName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Display name must be between 2 and 100 characters."),
  body("college")
    .isIn(COLLEGE_CODES)
    .withMessage("Please select a valid college or division."),
  body("department")
    .isIn(ALL_DEPARTMENT_CODES)
    .withMessage("Please select a valid department or strand."),
  body("academicLevel")
    .optional({ values: "falsy" })
    .isIn(ACADEMIC_LEVELS)
    .withMessage("Please select a valid academic level."),
  body("campus")
    .isIn(CAMPUSES)
    .withMessage("Please select a valid primary campus."),
  body("bio")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters."),
];

const eventCreateValidation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage("Event title must be between 5 and 120 characters."),
  body("category")
    .isIn(EVENT_CATEGORIES)
    .withMessage("Please select a valid event category."),
  body("date")
    .trim()
    .custom(function (val) {
      return Boolean(val) && val >= MIN_EVENT_DATE && val <= MAX_EVENT_DATE;
    })
    .withMessage("Event date must be between 2025-01-01 and 2036-12-31."),
  body("time").trim().notEmpty().withMessage("Start time is required."),
  body("venue")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Venue must be between 3 and 100 characters."),
  body("maxCapacity")
    .isInt({ min: 5, max: 5000 })
    .withMessage("Maximum capacity must be between 5 and 5000."),
  body("description")
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage("Description must be between 20 and 1000 characters."),
];

const eventEditValidation = [
  ...eventCreateValidation,
  body("status")
    .isIn(EVENT_STATUSES)
    .withMessage("Please select a valid lifecycle status."),
];

const threadUpdateValidation = [
  body("content")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Post content must be between 2 and 500 characters."),
];

const bookmarkNoteValidation = [
  body("personalNote")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 250 })
    .withMessage("Personal note cannot exceed 250 characters."),
];

module.exports = {
  extractValidationErrors,
  loginValidation,
  registerValidation,
  profileEditValidation,
  eventCreateValidation,
  eventEditValidation,
  threadUpdateValidation,
  bookmarkNoteValidation,
};

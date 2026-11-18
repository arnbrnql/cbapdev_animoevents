/**
 * Server-Side Request Validation Chains (middleware/validators.js)
 * Uses express-validator to validate and sanitize incoming form payloads.
 */
const { body, query, validationResult } = require("express-validator");
const {
  ACADEMIC_LEVELS,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  MIN_EVENT_DATE,
  MAX_EVENT_DATE,
  validateAffiliationCombination,
} = require("../model/constants");
const { isCalendarDate, isClockTime } = require("../model/manilaTime");

function extractValidationErrors(req) {
  const result = validationResult(req);
  if (result.isEmpty()) return [];
  return result.array().map(function (err) {
    return err.msg;
  });
}

function institutionalEmail(field) {
  return field
    .isString()
    .withMessage("Please enter your @dlsu.edu.ph email address.")
    .bail()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage("Please enter a valid @dlsu.edu.ph email address.")
    .bail()
    .matches(/@dlsu\.edu\.ph$/i)
    .withMessage("Please enter a valid @dlsu.edu.ph email address.");
}

const emailAvailabilityValidation = institutionalEmail(query("email"));

const loginValidation = [
  institutionalEmail(body("email")),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
];

const registerValidation = [
  body("displayName")
    .isString()
    .withMessage("Please enter a display name.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Display name must be between 2 and 100 characters."),
  institutionalEmail(body("email")),
  body("password")
    .isString()
    .withMessage("Please enter a password.")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .bail()
    .custom(function (value) {
      return Buffer.byteLength(value, "utf8") <= 72;
    })
    .withMessage("Password must be at most 72 bytes."),
  body("confirmPassword").custom(function (val, meta) {
    if (typeof val !== "string" || val !== meta.req.body.password) {
      throw new Error("Password and Confirm Password do not match.");
    }
    return true;
  }),
  body("role")
    .isString()
    .bail()
    .isIn(["Student", "Faculty"])
    .withMessage("Select Student or Faculty for self-registration.")
    .bail()
    .custom(function (role, meta) {
      const req = meta.req;
      const academicLevel =
        role === "Student"
          ? req.body.academicLevel
          : "N/A";
      const college = req.body.college;
      const department = req.body.department;
      if (!COLLEGE_CODES.includes(college)) {
        throw new Error("Please select a valid college or division.");
      }
      const affilErrors = validateAffiliationCombination(
        role,
        academicLevel,
        college,
        department,
      );
      if (affilErrors.length > 0) {
        throw new Error(affilErrors.join(" "));
      }
      return true;
    }),
  body("campus")
    .isString()
    .bail()
    .isIn(CAMPUSES)
    .withMessage("Please select a valid primary campus."),
  body("bio")
    .optional()
    .isString()
    .withMessage("Please enter a valid bio.")
    .bail()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters."),
];

const profileEditValidation = [
  body("displayName")
    .isString()
    .withMessage("Please enter a display name.")
    .bail()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Display name must be between 2 and 100 characters."),
  body("college")
    .isString()
    .bail()
    .isIn(COLLEGE_CODES)
    .withMessage("Please select a valid college or division."),
  body("department")
    .isString()
    .bail()
    .isIn(ALL_DEPARTMENT_CODES)
    .withMessage("Please select a valid department or strand.")
    .bail()
    .custom(function (department, meta) {
      const req = meta.req;
      const role = req.currentUser.role;
      const academicLevel =
        role === "Student"
          ? req.body.academicLevel
          : "N/A";
      const college = req.body.college;
      if (!COLLEGE_CODES.includes(college)) return true;
      const affilErrors = validateAffiliationCombination(
        role,
        academicLevel,
        college,
        department,
      );
      if (affilErrors.length > 0) {
        throw new Error(affilErrors.join(" "));
      }
      return true;
    }),
  body("academicLevel")
    .optional()
    .isString()
    .bail()
    .isIn(ACADEMIC_LEVELS)
    .withMessage("Please select a valid academic level."),
  body("campus")
    .isString()
    .bail()
    .isIn(CAMPUSES)
    .withMessage("Please select a valid primary campus."),
  body("bio")
    .optional()
    .isString()
    .withMessage("Please enter a valid bio.")
    .bail()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Bio cannot exceed 300 characters."),
];

const eventCreateValidation = [
  body("title")
    .isString()
    .withMessage("Enter an event title.")
    .bail()
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage("Event title must be between 5 and 120 characters."),
  body("category")
    .isString()
    .withMessage("Please select a valid event category.")
    .bail()
    .isIn(EVENT_CATEGORIES)
    .withMessage("Please select a valid event category."),
  body("date")
    .custom(val => isCalendarDate(val) && val >= MIN_EVENT_DATE && val <= MAX_EVENT_DATE)
    .withMessage("Enter a valid event date between " + MIN_EVENT_DATE + " and " + MAX_EVENT_DATE + "."),
  body("time")
    .custom(isClockTime)
    .withMessage("Enter a valid start time in 24-hour HH:mm format."),
  body("endTime").custom(function (val, meta) {
    if (val === undefined || val === "") return true;
    if (!isClockTime(val)) {
      throw new Error("Enter a valid end time in 24-hour HH:mm format.");
    }
    const startTime = meta.req.body.time;
    if (isClockTime(startTime) && val <= startTime) {
      throw new Error("End time must be later than start time.");
    }
    return true;
  }),
  body("venue")
    .isString()
    .withMessage("Enter an event venue.")
    .bail()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Venue must be between 3 and 100 characters."),
  body("maxCapacity")
    .custom(val => typeof val === "string" || typeof val === "number")
    .withMessage("Enter a valid maximum capacity.")
    .bail()
    .isInt({ min: 5, max: 5000 })
    .withMessage("Maximum capacity must be between 5 and 5000."),
  body("description")
    .isString()
    .withMessage("Enter an event description.")
    .bail()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage("Description must be between 20 and 1000 characters."),
  body("isPublic")
    .custom(val => val === true || val === false || val === "true" || val === "false")
    .withMessage("Choose public or targeted event visibility."),
];

const eventEditValidation = [
  ...eventCreateValidation,
  body("status")
    .isString()
    .withMessage("Please select a valid lifecycle status.")
    .bail()
    .isIn(EVENT_STATUSES)
    .withMessage("Please select a valid lifecycle status."),
];

const threadUpdateValidation = [
  body("content")
    .isString()
    .withMessage("Enter a discussion post.")
    .bail()
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
  emailAvailabilityValidation,
  loginValidation,
  registerValidation,
  profileEditValidation,
  eventCreateValidation,
  eventEditValidation,
  threadUpdateValidation,
  bookmarkNoteValidation,
};

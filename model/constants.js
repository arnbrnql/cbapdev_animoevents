/**
 * AnimoEvents Institutional Constants, Calendar Bounds & Classification Rules
 */
const ROLES = ["Student", "Faculty", "Organizer"];

const STUDENT_ACADEMIC_LEVELS = [
  "Senior High School",
  "Undergraduate",
  "Graduate",
];
const ACADEMIC_LEVELS = [
  "Senior High School",
  "Undergraduate",
  "Graduate",
  "N/A",
];

const EVENT_CATEGORIES = ["Seminar", "Workshop", "Bazaar", "Competition"];

const EVENT_STATUSES = [
  "Open",
  "Full",
  "Closed",
  "Postponed",
  "Cancelled",
  "Completed",
];

const CAMPUSES = ["Manila", "Laguna"];

const CALENDAR_MIN_YEAR = 2025;
const CALENDAR_MAX_YEAR = 2036;
const MIN_EVENT_DATE = "2025-01-01";
const MAX_EVENT_DATE = "2036-12-31";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const COLLEGES = [
  {
    code: "CCS",
    name: "College of Computer Studies",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "RVR-COB",
    name: "Ramon V. del Rosario College of Business",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "GCOE",
    name: "Gokongwei College of Engineering",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "CLA",
    name: "College of Liberal Arts",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "COS",
    name: "College of Science",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "BAGCED",
    name: "Br. Andrew Gonzalez FSC College of Education",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "CLT-SOE",
    name: "Carlos L. Tiu School of Economics",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "SHS",
    name: "Senior High School (DLSU Integrated School)",
    allowStudent: true,
    allowFaculty: true,
    allowOrganizer: true,
  },
  {
    code: "UNIV",
    name: "University-Wide Office / Research Center",
    allowStudent: false,
    allowFaculty: false,
    allowOrganizer: true,
  },
];

const COLLEGE_CODES = COLLEGES.map(function (c) {
  return c.code;
});

const DEPARTMENTS_BY_COLLEGE = {
  CCS: [
    { code: "ST", name: "Department of Software Technology" },
    { code: "CT", name: "Department of Computer Technology" },
    { code: "IT", name: "Department of Information Technology" },
  ],
  "RVR-COB": [
    { code: "MOD", name: "Department of Management and Organization" },
    { code: "MAD", name: "Department of Marketing and Advertising" },
    { code: "ACY", name: "Department of Accountancy" },
    { code: "FIN", name: "Department of Financial Management" },
    { code: "CLW", name: "Department of Commercial Law" },
    { code: "DSI", name: "Department of Decision Sciences and Innovation" },
  ],
  GCOE: [
    {
      code: "ECE",
      name: "Department of Electronics and Computer Engineering",
    },
    { code: "ME", name: "Department of Mechanical Engineering" },
    { code: "IE", name: "Department of Industrial and Systems Engineering" },
    { code: "CHE", name: "Department of Chemical Engineering" },
    { code: "CE", name: "Department of Civil Engineering" },
    {
      code: "MEM",
      name: "Department of Manufacturing Engineering and Management",
    },
  ],
  CLA: [
    { code: "COMM", name: "Department of Communication" },
    {
      code: "POL",
      name: "Department of Political Science and Development Studies",
    },
    { code: "PSY", name: "Department of Psychology" },
    { code: "LIT", name: "Department of Literature" },
    { code: "IS", name: "Department of International Studies" },
    { code: "HIST", name: "Department of History" },
    { code: "FIL", name: "Department of Filipino" },
    { code: "PHIL", name: "Department of Philosophy" },
    { code: "SBS", name: "Department of Sociology and Behavioral Sciences" },
    { code: "TH", name: "Department of Theology and Religious Education" },
  ],
  COS: [
    { code: "BIO", name: "Department of Biology" },
    { code: "CHEM", name: "Department of Chemistry" },
    { code: "MATH", name: "Department of Mathematics and Statistics" },
    { code: "PHYS", name: "Department of Physics" },
  ],
  BAGCED: [
    {
      code: "CEP",
      name: "Department of Counseling and Educational Psychology",
    },
    {
      code: "ELM",
      name: "Department of Educational Leadership and Management",
    },
    { code: "SCIED", name: "Department of Science Education" },
    { code: "DEAL", name: "Department of English and Applied Linguistics" },
    { code: "PE", name: "Department of Physical Education" },
  ],
  "CLT-SOE": [{ code: "ECON", name: "Department of Economics" }],
  SHS: [
    {
      code: "STEM",
      name: "Science, Technology, Engineering, and Mathematics (STEM)",
    },
    { code: "ABM", name: "Accountancy, Business, and Management (ABM)" },
    { code: "HUMSS", name: "Humanities and Social Sciences (HUMSS)" },
    { code: "ADT", name: "Arts and Design Track (ADT)" },
  ],
  UNIV: [{ code: "N/A", name: "Not Applicable (University-Wide Unit)" }],
};

const ALL_DEPARTMENT_CODES = ["N/A"];
Object.keys(DEPARTMENTS_BY_COLLEGE).forEach(function (collegeCode) {
  DEPARTMENTS_BY_COLLEGE[collegeCode].forEach(function (dept) {
    if (ALL_DEPARTMENT_CODES.indexOf(dept.code) === -1) {
      ALL_DEPARTMENT_CODES.push(dept.code);
    }
  });
});

function parseAndValidateYearMonth(inputStr, fallbackStr) {
  const defaultYM = fallbackStr || "2026-11";
  if (typeof inputStr !== "string") return defaultYM;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(inputStr.trim());
  if (!match) return defaultYM;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (year < CALENDAR_MIN_YEAR || year > CALENDAR_MAX_YEAR) return defaultYM;
  return String(year) + "-" + String(month).padStart(2, "0");
}

function shiftYearMonth(ymStr, deltaMonths) {
  const valid = parseAndValidateYearMonth(ymStr, "2026-11");
  const parts = valid.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1 + deltaMonths, 1);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (y < CALENDAR_MIN_YEAR) return CALENDAR_MIN_YEAR + "-01";
  if (y > CALENDAR_MAX_YEAR) return CALENDAR_MAX_YEAR + "-12";
  return String(y) + "-" + String(m).padStart(2, "0");
}

function formatYearMonthLabel(ymStr, shortFormat) {
  const valid = parseAndValidateYearMonth(ymStr, "2026-11");
  const parts = valid.split("-").map(Number);
  const names = shortFormat ? SHORT_MONTH_NAMES : MONTH_NAMES;
  return names[parts[1] - 1] + " " + parts[0];
}

function validateAffiliationCombination(
  role,
  academicLevel,
  college,
  department,
) {
  const errors = [];
  if (ROLES.indexOf(role) === -1) {
    errors.push(
      "Please select a valid account affiliation (Student, Faculty, or Organizer).",
    );
    return errors;
  }

  if (role === "Student") {
    if (STUDENT_ACADEMIC_LEVELS.indexOf(academicLevel) === -1) {
      errors.push(
        "Students must select an Academic Level (Senior High School, Undergraduate, or Graduate).",
      );
    }
    if (academicLevel === "Senior High School" && college !== "SHS") {
      errors.push(
        "Senior High School students must be assigned to the Senior High School (SHS) division.",
      );
    }
    if (
      (academicLevel === "Undergraduate" || academicLevel === "Graduate") &&
      (college === "SHS" || college === "UNIV")
    ) {
      errors.push(
        "Undergraduate and Graduate students must select their academic college.",
      );
    }
  } else {
    if (academicLevel !== "N/A") {
      errors.push(
        "Academic Level applies only to students and must be set to N/A for Faculty and Organizers.",
      );
    }
    if (role === "Faculty" && college === "UNIV") {
      errors.push(
        "Faculty members must select their home college or Senior High School division.",
      );
    }
  }

  const validDeptsForCollege = (DEPARTMENTS_BY_COLLEGE[college] || []).map(
    function (d) {
      return d.code;
    },
  );
  if (role === "Organizer") {
    if (
      department !== "N/A" &&
      validDeptsForCollege.indexOf(department) === -1
    ) {
      errors.push(
        "Selected department does not belong to the chosen college/unit.",
      );
    }
  } else {
    if (
      department === "N/A" ||
      validDeptsForCollege.indexOf(department) === -1
    ) {
      errors.push(
        "Please select a valid department or strand under the chosen college/division.",
      );
    }
  }

  return errors;
}

const ANIMO_CONSTANTS = {
  ROLES: ROLES,
  STUDENT_ACADEMIC_LEVELS: STUDENT_ACADEMIC_LEVELS,
  ACADEMIC_LEVELS: ACADEMIC_LEVELS,
  EVENT_CATEGORIES: EVENT_CATEGORIES,
  EVENT_STATUSES: EVENT_STATUSES,
  CAMPUSES: CAMPUSES,
  CALENDAR_MIN_YEAR: CALENDAR_MIN_YEAR,
  CALENDAR_MAX_YEAR: CALENDAR_MAX_YEAR,
  MIN_EVENT_DATE: MIN_EVENT_DATE,
  MAX_EVENT_DATE: MAX_EVENT_DATE,
  MONTH_NAMES: MONTH_NAMES,
  SHORT_MONTH_NAMES: SHORT_MONTH_NAMES,
  COLLEGES: COLLEGES,
  COLLEGE_CODES: COLLEGE_CODES,
  DEPARTMENTS_BY_COLLEGE: DEPARTMENTS_BY_COLLEGE,
  ALL_DEPARTMENT_CODES: ALL_DEPARTMENT_CODES,
  parseAndValidateYearMonth: parseAndValidateYearMonth,
  shiftYearMonth: shiftYearMonth,
  formatYearMonthLabel: formatYearMonthLabel,
  validateAffiliationCombination: validateAffiliationCombination,
};

if (typeof module === "object" && module.exports) {
  module.exports = ANIMO_CONSTANTS;
} else if (typeof window !== "undefined") {
  window.ANIMO_CONSTANTS = ANIMO_CONSTANTS;
}

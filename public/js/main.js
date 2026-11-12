/**
 * Client-Side Form & UI Interaction Helpers for AnimoEvents (public/js/main.js)
 * Handles dynamic college/department select binding and orthogonal audience targeting controls.
 */
(function () {
  "use strict";

  const COLLEGES_MAP = {
    CCS: {
      name: "College of Computer Studies",
      depts: [
        { code: "ST", name: "Department of Software Technology" },
        { code: "CT", name: "Department of Computer Technology" },
        { code: "IT", name: "Department of Information Technology" },
      ],
    },
    "RVR-COB": {
      name: "Ramon V. del Rosario College of Business",
      depts: [
        { code: "MOD", name: "Department of Management and Organization" },
        { code: "MAD", name: "Department of Marketing and Advertising" },
        { code: "ACY", name: "Department of Accountancy" },
        { code: "FIN", name: "Department of Financial Management" },
        { code: "CLW", name: "Department of Commercial Law" },
        { code: "DSI", name: "Department of Decision Sciences and Innovation" },
      ],
    },
    GCOE: {
      name: "Gokongwei College of Engineering",
      depts: [
        {
          code: "ECE",
          name: "Department of Electronics and Computer Engineering",
        },
        { code: "ME", name: "Department of Mechanical Engineering" },
        {
          code: "IE",
          name: "Department of Industrial and Systems Engineering",
        },
        { code: "CHE", name: "Department of Chemical Engineering" },
        { code: "CE", name: "Department of Civil Engineering" },
        {
          code: "MEM",
          name: "Department of Manufacturing Engineering and Management",
        },
      ],
    },
    CLA: {
      name: "College of Liberal Arts",
      depts: [
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
        {
          code: "SBS",
          name: "Department of Sociology and Behavioral Sciences",
        },
        { code: "TH", name: "Department of Theology and Religious Education" },
      ],
    },
    COS: {
      name: "College of Science",
      depts: [
        { code: "BIO", name: "Department of Biology" },
        { code: "CHEM", name: "Department of Chemistry" },
        { code: "MATH", name: "Department of Mathematics and Statistics" },
        { code: "PHYS", name: "Department of Physics" },
      ],
    },
    BAGCED: {
      name: "Br. Andrew Gonzalez FSC College of Education",
      depts: [
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
    },
    "CLT-SOE": {
      name: "Carlos L. Tiu School of Economics",
      depts: [{ code: "ECON", name: "Department of Economics" }],
    },
    SHS: {
      name: "Senior High School (DLSU Integrated School)",
      depts: [
        {
          code: "STEM",
          name: "Science, Technology, Engineering, and Mathematics (STEM)",
        },
        { code: "ABM", name: "Accountancy, Business, and Management (ABM)" },
        { code: "HUMSS", name: "Humanities and Social Sciences (HUMSS)" },
        { code: "ADT", name: "Arts and Design Track (ADT)" },
      ],
    },
    UNIV: {
      name: "University-Wide Office / Research Center",
      depts: [{ code: "N/A", name: "Not Applicable (University-Wide Unit)" }],
    },
  };

  function getAudienceCatalog() {
    const constants = window.ANIMO_CONSTANTS || {};
    const departmentsByCollege = constants.DEPARTMENTS_BY_COLLEGE || {};
    const colleges = (constants.COLLEGES || []).filter(function (college) {
      return college.code !== "UNIV";
    });
    const departmentToCollege = {};
    Object.keys(departmentsByCollege).forEach(function (collegeCode) {
      departmentsByCollege[collegeCode].forEach(function (department) {
        if (department.code !== "N/A") {
          departmentToCollege[department.code] = collegeCode;
        }
      });
    });
    return {
      colleges: colleges,
      departmentsByCollege: departmentsByCollege,
      departmentToCollege: departmentToCollege,
    };
  }

  function normalizeAudience(event) {
    const audience = event || {};
    const catalog = getAudienceCatalog();
    const validCollegeCodes = catalog.colleges.map(function (college) {
      return college.code;
    });
    const validDepartmentCodes = Object.keys(catalog.departmentToCollege);
    const validRoles = ["Student", "Faculty"];
    const validLevels = ["Senior High School", "Undergraduate", "Graduate"];
    const validCampuses = ["Manila", "Laguna"];
    const uniqueValid = function (values, allowed) {
      return Array.from(
        new Set(
          (Array.isArray(values) ? values : []).filter(function (value) {
            return allowed.indexOf(value) !== -1;
          }),
        ),
      );
    };

    if (audience.isPublic === true) {
      return {
        targetRoles: [],
        targetAcademicLevels: [],
        targetColleges: [],
        targetDepartments: [],
        targetCampuses: [],
      };
    }

    const targetDepartments = uniqueValid(
      audience.targetDepartments,
      validDepartmentCodes,
    );
    const explicitColleges = uniqueValid(
      audience.targetColleges,
      validCollegeCodes,
    );
    targetDepartments.forEach(function (deptCode) {
      const parentCollege = catalog.departmentToCollege[deptCode];
      if (parentCollege && explicitColleges.indexOf(parentCollege) === -1) {
        explicitColleges.push(parentCollege);
      }
    });

    return {
      targetRoles: uniqueValid(audience.targetRoles, validRoles),
      targetAcademicLevels: uniqueValid(
        audience.targetAcademicLevels,
        validLevels,
      ),
      targetColleges: explicitColleges,
      targetDepartments: targetDepartments,
      targetCampuses: uniqueValid(audience.targetCampuses, validCampuses),
    };
  }

  function validateAudience(audience) {
    const errors = [];
    if (audience.isPublic === true) return errors;
    const normalized = normalizeAudience(audience);
    const hasRestriction =
      normalized.targetRoles.length > 0 ||
      normalized.targetAcademicLevels.length > 0 ||
      normalized.targetColleges.length > 0 ||
      normalized.targetDepartments.length > 0 ||
      normalized.targetCampuses.length > 0;
    if (!hasRestriction) {
      errors.push(
        "Select at least one target audience restriction when publishing a Targeted / Restricted event.",
      );
    }
    if (
      normalized.targetAcademicLevels.length > 0 &&
      normalized.targetRoles.length > 0 &&
      normalized.targetRoles.indexOf("Student") === -1
    ) {
      errors.push(
        "Student academic levels require Students to be included in the target roles.",
      );
    }
    return errors;
  }

  function renderAudienceEditor(root, initialEvent) {
    if (!root) return null;
    const initial = initialEvent
      ? Object.assign(
          { isPublic: initialEvent.isPublic === true },
          normalizeAudience(initialEvent),
        )
      : {
          isPublic: true,
          targetRoles: [],
          targetAcademicLevels: [],
          targetColleges: [],
          targetDepartments: [],
          targetCampuses: [],
        };
    const catalog = getAudienceCatalog();
    const prefix = root.id || "audience";
    const checked = function (values, value) {
      return (values || []).indexOf(value) !== -1 ? " checked" : "";
    };

    const collegeOptions = catalog.colleges
      .map(function (college) {
        const domId =
          prefix + "-college-" + college.code.replace(/[^A-Za-z0-9]/g, "");
        return (
          '<div class="form-check">' +
          '<input class="form-check-input" type="checkbox" name="targetColleges" value="' +
          college.code +
          '" id="' +
          domId +
          '"' +
          checked(initial.targetColleges, college.code) +
          ">" +
          '<label class="form-check-label small" for="' +
          domId +
          '">' +
          college.code +
          "</label></div>"
        );
      })
      .join("");

    const departmentOptions = Object.keys(catalog.departmentsByCollege)
      .filter(function (collegeCode) {
        return collegeCode !== "UNIV";
      })
      .map(function (collegeCode) {
        const departments = catalog.departmentsByCollege[collegeCode]
          .map(function (department) {
            const domId =
              prefix +
              "-department-" +
              department.code.replace(/[^A-Za-z0-9]/g, "");
            return (
              '<div class="form-check audience-department" data-parent-college="' +
              collegeCode +
              '">' +
              '<input class="form-check-input" type="checkbox" name="targetDepartments" value="' +
              department.code +
              '" id="' +
              domId +
              '"' +
              checked(initial.targetDepartments, department.code) +
              ">" +
              '<label class="form-check-label small" for="' +
              domId +
              '">' +
              department.code +
              " — " +
              department.name.replace(/Department of /, "") +
              "</label></div>"
            );
          })
          .join("");
        return (
          '<div class="mb-2" data-dept-group="' +
          collegeCode +
          '"><div class="small fw-semibold text-success">' +
          collegeCode +
          " Departments / Strands</div>" +
          '<div class="d-flex flex-wrap gap-3">' +
          departments +
          "</div></div>"
        );
      })
      .join("");

    root.innerHTML =
      '<h2 class="h6 fw-bold mb-2">Audience Visibility & Eligibility Rules</h2>' +
      '<div class="form-check mb-2"><input class="form-check-input" type="radio" name="isPublic" value="true" id="' +
      prefix +
      '-public"' +
      (initial.isPublic !== false ? " checked" : "") +
      '><label class="form-check-label fw-semibold" for="' +
      prefix +
      '-public">University-Wide Public Event <span class="fw-normal">(Visible and open to all DLSU students and faculty)</span></label></div>' +
      '<div class="form-check mb-3"><input class="form-check-input" type="radio" name="isPublic" value="false" id="' +
      prefix +
      '-targeted"' +
      (initial.isPublic === false ? " checked" : "") +
      '><label class="form-check-label fw-semibold" for="' +
      prefix +
      '-targeted">Targeted / Restricted Event <span class="fw-normal">(Visible only to users matching the selected groups below)</span></label></div>' +
      '<div data-audience-targeting class="ps-2 border-start border-3 border-success">' +
      '<p class="small text-muted mb-3">Leave a dimension unchecked if it is unrestricted. Selecting specific departments/strands restricts that college to those departments; leaving a selected college\'s departments unchecked opens the event to the entire college.</p>' +
      '<div class="mb-3"><label class="form-label small fw-bold d-block mb-1">1. Target Affiliation Roles</label><div class="d-flex flex-wrap gap-3">' +
      '<div class="form-check"><input class="form-check-input" type="checkbox" name="targetRoles" value="Student" id="' +
      prefix +
      '-student"' +
      checked(initial.targetRoles, "Student") +
      '><label class="form-check-label small" for="' +
      prefix +
      '-student">Students</label></div>' +
      '<div class="form-check"><input class="form-check-input" type="checkbox" name="targetRoles" value="Faculty" id="' +
      prefix +
      '-faculty"' +
      checked(initial.targetRoles, "Faculty") +
      '><label class="form-check-label small" for="' +
      prefix +
      '-faculty">Faculty Members</label></div></div></div>' +
      '<div class="mb-3"><label class="form-label small fw-bold d-block mb-1">2. Target Student Academic Levels</label><div class="d-flex flex-wrap gap-3">' +
      ["Senior High School", "Undergraduate", "Graduate"]
        .map(function (level, index) {
          return (
            '<div class="form-check"><input class="form-check-input" type="checkbox" name="targetAcademicLevels" value="' +
            level +
            '" id="' +
            prefix +
            "-level-" +
            index +
            '"' +
            checked(initial.targetAcademicLevels, level) +
            '><label class="form-check-label small" for="' +
            prefix +
            "-level-" +
            index +
            '">' +
            level +
            "</label></div>"
          );
        })
        .join("") +
      "</div></div>" +
      '<div class="mb-3"><label class="form-label small fw-bold d-block mb-1">3. Target Colleges & Integrated School</label><div class="d-flex flex-wrap gap-3">' +
      collegeOptions +
      "</div></div>" +
      '<div class="mb-3"><label class="form-label small fw-bold d-block mb-1">4. Target Departments / SHS Strands <span class="text-muted fw-normal">(Optional — leave unchecked for college-wide access)</span></label>' +
      departmentOptions +
      "</div>" +
      '<div><label class="form-label small fw-bold d-block mb-1">5. Target Campuses</label><div class="d-flex flex-wrap gap-3">' +
      ["Manila", "Laguna"]
        .map(function (campus) {
          return (
            '<div class="form-check"><input class="form-check-input" type="checkbox" name="targetCampuses" value="' +
            campus +
            '" id="' +
            prefix +
            "-campus-" +
            campus.toLowerCase() +
            '"' +
            checked(initial.targetCampuses, campus) +
            '><label class="form-check-label small" for="' +
            prefix +
            "-campus-" +
            campus.toLowerCase() +
            '">' +
            campus +
            " Campus</label></div>"
          );
        })
        .join("") +
      "</div></div></div>";

    const targeting = root.querySelector("[data-audience-targeting]");
    const collegeInputs = root.querySelectorAll('input[name="targetColleges"]');
    const departmentInputs = root.querySelectorAll(
      'input[name="targetDepartments"]',
    );

    const getCheckedValues = function (fieldName) {
      return Array.from(
        root.querySelectorAll('input[name="' + fieldName + '"]:checked'),
      ).map(function (input) {
        return input.value;
      });
    };

    const sync = function (evt) {
      const checkedRadio = root.querySelector('input[name="isPublic"]:checked');
      const isPublic = !checkedRadio || checkedRadio.value === "true";
      targeting.classList.toggle("d-none", isPublic);
      targeting.querySelectorAll("input").forEach(function (input) {
        input.disabled = isPublic;
      });

      if (isPublic) return;

      if (
        evt &&
        evt.target &&
        evt.target.name === "targetDepartments" &&
        evt.target.checked
      ) {
        const parentCode = evt.target.closest("[data-parent-college]").dataset
          .parentCollege;
        collegeInputs.forEach(function (colInput) {
          if (colInput.value === parentCode) colInput.checked = true;
        });
      }

      if (
        evt &&
        evt.target &&
        evt.target.name === "targetColleges" &&
        !evt.target.checked
      ) {
        const uncheckedCol = evt.target.value;
        departmentInputs.forEach(function (deptInput) {
          const parentCode = deptInput.closest("[data-parent-college]").dataset
            .parentCollege;
          if (parentCode === uncheckedCol) deptInput.checked = false;
        });
      }
    };

    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("change", sync);
    });
    sync();

    return {
      getValues: function () {
        const checkedRadio = root.querySelector(
          'input[name="isPublic"]:checked',
        );
        const isPublic = !checkedRadio || checkedRadio.value === "true";
        const normalized = normalizeAudience({
          isPublic: isPublic,
          targetRoles: getCheckedValues("targetRoles"),
          targetAcademicLevels: getCheckedValues("targetAcademicLevels"),
          targetColleges: getCheckedValues("targetColleges"),
          targetDepartments: getCheckedValues("targetDepartments"),
          targetCampuses: getCheckedValues("targetCampuses"),
        });
        return Object.assign({ isPublic: isPublic }, normalized);
      },
      validate: function () {
        return validateAudience(this.getValues());
      },
    };
  }

  function bindAffiliationSelects(formEl) {
    if (!formEl) return;
    const roleSelect = formEl.querySelector('[name="role"]');
    const levelSelect = formEl.querySelector('[name="academicLevel"]');
    const collegeSelect = formEl.querySelector('[name="college"]');
    const deptSelect = formEl.querySelector('[name="department"]');

    if (!collegeSelect || !deptSelect) return;

    function syncFields() {
      const role = roleSelect ? roleSelect.value : "Student";

      if (levelSelect) {
        const naOption = levelSelect.querySelector('option[value="N/A"]');
        const studentOptions = levelSelect.querySelectorAll(
          'option:not([value="N/A"])',
        );
        if (role === "Student") {
          if (naOption) naOption.disabled = true;
          studentOptions.forEach(function (opt) {
            opt.disabled = false;
          });
          if (levelSelect.value === "N/A" || !levelSelect.value) {
            levelSelect.value = "Undergraduate";
          }
          levelSelect.disabled = false;
        } else {
          if (naOption) naOption.disabled = false;
          levelSelect.value = "N/A";
          studentOptions.forEach(function (opt) {
            opt.disabled = true;
          });
        }
      }

      const level = levelSelect ? levelSelect.value : "Undergraduate";

      const univOpt = collegeSelect.querySelector('option[value="UNIV"]');
      const shsOpt = collegeSelect.querySelector('option[value="SHS"]');
      if (univOpt) {
        univOpt.disabled = role !== "Organizer";
      }
      if (role === "Student" && level === "Senior High School") {
        collegeSelect.value = "SHS";
      } else if (
        role === "Student" &&
        (collegeSelect.value === "SHS" || collegeSelect.value === "UNIV")
      ) {
        collegeSelect.value = "CCS";
      } else if (role === "Faculty" && collegeSelect.value === "UNIV") {
        collegeSelect.value = "CCS";
      }
      if (shsOpt) {
        shsOpt.disabled = role === "Student" && level !== "Senior High School";
      }

      const selectedCollege = collegeSelect.value || "CCS";
      const currentDept =
        deptSelect.getAttribute("data-selected") || deptSelect.value;
      const depts = COLLEGES_MAP[selectedCollege]
        ? COLLEGES_MAP[selectedCollege].depts
        : [];

      deptSelect.innerHTML = "";
      if (role === "Organizer" && selectedCollege !== "UNIV") {
        const allDeptOpt = document.createElement("option");
        allDeptOpt.value = "N/A";
        allDeptOpt.textContent = "All Departments / College-Wide (N/A)";
        deptSelect.appendChild(allDeptOpt);
      }

      depts.forEach(function (d) {
        const opt = document.createElement("option");
        opt.value = d.code;
        opt.textContent = d.code === "N/A" ? d.name : d.code + " — " + d.name;
        deptSelect.appendChild(opt);
      });

      const validValues = Array.from(deptSelect.options).map(function (o) {
        return o.value;
      });
      if (validValues.indexOf(currentDept) !== -1) {
        deptSelect.value = currentDept;
      } else if (validValues.length > 0) {
        deptSelect.value = validValues[0];
      }
      deptSelect.removeAttribute("data-selected");
    }

    if (roleSelect) roleSelect.addEventListener("change", syncFields);
    if (levelSelect) levelSelect.addEventListener("change", syncFields);
    collegeSelect.addEventListener("change", syncFields);
    syncFields();
  }

  window.AnimoApp = {
    COLLEGES_MAP: COLLEGES_MAP,
    normalizeAudience: normalizeAudience,
    validateAudience: validateAudience,
    renderAudienceEditor: renderAudienceEditor,
    bindAffiliationSelects: bindAffiliationSelects,
  };
})();

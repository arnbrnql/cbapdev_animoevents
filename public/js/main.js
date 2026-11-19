/**
 * Client-Side Form & UI Interaction Helpers for AnimoEvents (public/js/main.js)
 * Progressive enhancement for college/department selects and audience targeting checkboxes.
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

  function bindAudienceEditor(root) {
    if (!root) return;
    const targeting = root.querySelector("[data-audience-targeting]");
    if (!targeting) return;

    const form = root.closest("form");
    const startTime = form.querySelector('[name="time"]');
    const endTime = form.querySelector('[name="endTime"]');
    const targetedRadio = root.querySelector('[name="isPublic"][value="false"]');
    const audienceInputs = targeting.querySelectorAll('input[type="checkbox"]');

    function validateTimes() {
      const endTooEarly = startTime.value && endTime.value && endTime.value <= startTime.value;
      endTime.setCustomValidity(endTooEarly ? "End time must be later than start time." : "");
    }

    startTime.addEventListener("input", validateTimes);
    endTime.addEventListener("input", validateTimes);

    const collegeInputs = root.querySelectorAll('input[name="targetColleges"]');
    const departmentInputs = root.querySelectorAll(
      'input[name="targetDepartments"]',
    );

    function sync(evt) {
      const checkedRadio = root.querySelector('input[name="isPublic"]:checked');
      const isPublic = !checkedRadio || checkedRadio.value === "true";

      targeting.classList.toggle("d-none", isPublic);
      targeting.querySelectorAll("input").forEach(function (input) {
        input.disabled = isPublic;
      });

      targetedRadio.setCustomValidity("");
      if (isPublic) return;

      if (
        evt &&
        evt.target &&
        evt.target.name === "targetDepartments" &&
        evt.target.checked
      ) {
        const wrapper = evt.target.closest("[data-parent-college]");
        const parentCode = wrapper ? wrapper.dataset.parentCollege : "";
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
          const wrapper = deptInput.closest("[data-parent-college]");
          const parentCode = wrapper ? wrapper.dataset.parentCollege : "";
          if (parentCode === uncheckedCol) deptInput.checked = false;
        });
      }

      const hasTarget = Array.from(audienceInputs).some(function (input) {
        return input.checked;
      });
      targetedRadio.setCustomValidity(hasTarget ? "" : "Select at least one audience group.");
    }

    root.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("change", sync);
    });
    sync();
    validateTimes();
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
    bindAudienceEditor: bindAudienceEditor,
    bindAffiliationSelects: bindAffiliationSelects,
  };
})();

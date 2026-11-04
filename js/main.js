/**
 * Shared client-side state and interaction helpers for AnimoEvents.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "animoevents_state";
  const DEMO_PASSWORD = "AnimoPass123!";
  let storageWarningShown = false;

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

  function getLocalDateStr(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function getLocalTimestamp(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return getLocalDateStr(d) + " " + hours + ":" + mins;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getDefaultSeedState() {
    const users = [
      {
        id: "u1",
        displayName: "Miguel Lorenzo Tan",
        email: "miguel_tan@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Undergraduate",
        college: "CCS",
        department: "ST",
        campus: "Manila",
        bio: "BS Computer Science Major in Software Technology (ID 124). Interested in full-stack web engineering and cybersecurity.",
        profilePic: "./images/avatar-u1.svg",
      },
      {
        id: "u2",
        displayName: "Hannah Sofia Reyes",
        email: "hannah_reyes@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Graduate",
        college: "CCS",
        department: "IT",
        campus: "Manila",
        bio: "MS Information Technology candidate researching cloud systems and human-computer interaction.",
        profilePic: "./images/avatar-u2.svg",
      },
      {
        id: "u3",
        displayName: "Dr. Rafael Antonio Cruz",
        email: "rafael.cruz@dlsu.edu.ph",
        role: "Faculty",
        academicLevel: "N/A",
        college: "CCS",
        department: "ST",
        campus: "Manila",
        bio: "Associate Professor in the Department of Software Technology and faculty adviser for software engineering capstones.",
        profilePic: "./images/avatar-u3.svg",
      },
      {
        id: "u4",
        displayName: "Bea Katrina Villanueva",
        email: "bea_villanueva@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Undergraduate",
        college: "RVR-COB",
        department: "MOD",
        campus: "Manila",
        bio: "BS Business Management student active in sustainability bazaars and corporate leadership forums.",
        profilePic: "./images/avatar-u4.svg",
      },
      {
        id: "u5",
        displayName: "Carlos Joaquin Mendoza",
        email: "carlos_mendoza@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Graduate",
        college: "GCOE",
        department: "ECE",
        campus: "Laguna",
        bio: "MS Electronics and Communications Engineering researcher based at the DLSU Laguna campus.",
        profilePic: "./images/avatar-u5.svg",
      },
      {
        id: "u6",
        displayName: "La Salle Computer Society (LSCS)",
        email: "lscs@dlsu.edu.ph",
        role: "Organizer",
        academicLevel: "N/A",
        college: "CCS",
        department: "N/A",
        campus: "Manila",
        bio: "The premier accredited student organization of the College of Computer Studies at De La Salle University.",
        profilePic: "./images/avatar-u6.svg",
      },
      {
        id: "u7",
        displayName:
          "Center for Computational Imaging and Visual Innovations (CIVI)",
        email: "civi@dlsu.edu.ph",
        role: "Organizer",
        academicLevel: "N/A",
        college: "CCS",
        department: "ST",
        campus: "Manila",
        bio: "Official DLSU research center specializing in computer vision, medical imaging, and visual computing.",
        profilePic: "./images/avatar-u7.svg",
      },
      {
        id: "u8",
        displayName: "Office of Student L.I.F.E.",
        email: "slife@dlsu.edu.ph",
        role: "Organizer",
        academicLevel: "N/A",
        college: "UNIV",
        department: "N/A",
        campus: "Manila",
        bio: "Office of Student Leadership, Involvement, Formation, and Empowerment coordinating university-wide student activities.",
        profilePic: "./images/avatar-u8.svg",
      },
      {
        id: "u9",
        displayName: "Engineering College Government (ECG)",
        email: "ecg@dlsu.edu.ph",
        role: "Organizer",
        academicLevel: "N/A",
        college: "GCOE",
        department: "N/A",
        campus: "Laguna",
        bio: "Official college student government serving Gokongwei College of Engineering students across Manila and Laguna.",
        profilePic: "./images/avatar-u9.svg",
      },
      {
        id: "u10",
        displayName: "Business Management Society (BMS)",
        email: "bms@dlsu.edu.ph",
        role: "Organizer",
        academicLevel: "N/A",
        college: "RVR-COB",
        department: "MOD",
        campus: "Manila",
        bio: "Accredited professional student organization under the Ramon V. del Rosario College of Business.",
        profilePic: "./images/avatar-u10.svg",
      },
      {
        id: "u11",
        displayName: "Patricia Mae Bautista",
        email: "patricia_bautista@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Undergraduate",
        college: "GCOE",
        department: "IE",
        campus: "Laguna",
        bio: "BS Industrial Engineering student at the DLSU Laguna campus focusing on operations research and robotics.",
        profilePic: "./images/avatar-u11.svg",
      },
      {
        id: "u12",
        displayName: "Marco Gabriel Lim",
        email: "marco_lim@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Graduate",
        college: "RVR-COB",
        department: "FIN",
        campus: "Manila",
        bio: "Master of Science in Computational Finance student researching FinTech and quantitative corporate strategy.",
        profilePic: "./images/avatar-u12.svg",
      },
      {
        id: "u13",
        displayName: "Sophia Gabrielle Sy",
        email: "sophia_sy@dlsu.edu.ph",
        role: "Student",
        academicLevel: "Senior High School",
        college: "SHS",
        department: "STEM",
        campus: "Manila",
        bio: "Grade 12 STEM student at DLSU Integrated School (Manila) interested in software development and robotics.",
        profilePic: "./images/avatar-u1.svg",
      },
      {
        id: "u14",
        displayName: "Dr. Elena Marie Velasco",
        email: "elena.velasco@dlsu.edu.ph",
        role: "Faculty",
        academicLevel: "N/A",
        college: "GCOE",
        department: "ECE",
        campus: "Laguna",
        bio: "Faculty researcher in Electronics and Computer Engineering at the DLSU Laguna campus.",
        profilePic: "./images/avatar-u5.svg",
      },
    ];

    users.forEach(function (user) {
      user.password = DEMO_PASSWORD;
    });

    const events = [
      {
        id: "e1",
        title: "Full-Stack Web Dev Bootcamp: Node.js, Express & MongoDB",
        category: "Workshop",
        date: "2026-11-28",
        time: "13:00",
        endTime: "17:00",
        venue: "Gokongwei Hall GK304B, Manila Campus",
        description:
          "Hands-on workshop covering MVC web application architecture, Handlebars templating, and Mongoose ODM integration.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Open",
        maxCapacity: 20,
        attendees: ["u1", "u2", "u3", "u4", "u5", "u13"],
        updates: [
          {
            id: "up1",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Please install Node.js LTS and MongoDB Compass on your laptops before arriving at GK304B.",
            isOfficialUpdate: true,
            postedAt: "2026-10-20 10:00",
          },
          {
            id: "up2",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Starter repository and lab handouts will be distributed at registration.",
            isOfficialUpdate: true,
            postedAt: "2026-10-21 14:30",
          },
          {
            id: "up3",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content:
              "Registered! Will power strips be available at the GK304B lab tables?",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 15:10",
          },
          {
            id: "up4",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content:
              "Looking forward to the session on Mongoose schema design and MVC controllers.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 16:05",
          },
          {
            id: "up5",
            author: "u3",
            authorName: "Dr. Rafael Antonio Cruz",
            authorRole: "Faculty",
            content:
              "Highly recommended practice session for all CBAPDEV project groups.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 17:00",
          },
          {
            id: "up6",
            author: "u13",
            authorName: "Sophia Gabrielle Sy",
            authorRole: "Student",
            content:
              "Glad this workshop is open across campus so SHS STEM students can learn Node.js too!",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 18:20",
          },
        ],
      },
      {
        id: "e2",
        title: "Animo Hacker Cup CTF 2026: Web Security Challenge",
        category: "Competition",
        date: "2026-11-29",
        time: "09:00",
        endTime: "16:00",
        venue: "Henry Sy Sr. Hall 5F Learning Commons, Manila & Laguna",
        description:
          "Annual capture-the-flag cybersecurity competition testing input validation, session security, and password hashing defenses.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Open",
        maxCapacity: 15,
        attendees: ["u1", "u2", "u4", "u5", "u11", "u13"],
        updates: [
          {
            id: "up7",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Check-in opens at 8:30 AM at the 5th Floor Learning Commons reception desk.",
            isOfficialUpdate: true,
            postedAt: "2026-10-18 09:00",
          },
          {
            id: "up8",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Laguna participants may join the hybrid scoreboard server from MRR Hall.",
            isOfficialUpdate: true,
            postedAt: "2026-10-20 13:00",
          },
          {
            id: "up9",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content:
              "Our team is ready for the web exploitation and bcrypt challenges.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 14:15",
          },
          {
            id: "up10",
            author: "u5",
            authorName: "Carlos Joaquin Mendoza",
            authorRole: "Student",
            content: "Joining from Laguna campus with Patricia!",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 16:40",
          },
          {
            id: "up11",
            author: "u11",
            authorName: "Patricia Mae Bautista",
            authorRole: "Student",
            content: "Excited to represent GCOE Laguna in the CTF.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 10:00",
          },
        ],
      },
      {
        id: "e3",
        title: "CCS Tech Career, Research & Internship Fair 2026",
        category: "Bazaar",
        date: "2026-12-16",
        time: "10:00",
        endTime: "17:00",
        venue: "Henry Sy Sr. Hall Roofdeck, Manila Campus",
        description:
          "Connect with partner software engineering firms, research labs, and internship coordinators for Term 2 placements.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Open",
        maxCapacity: 25,
        attendees: ["u1", "u2", "u3", "u4", "u12", "u13"],
        updates: [
          {
            id: "up12",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Over 20 partner companies have confirmed booths at the Henry Sy Roofdeck.",
            isOfficialUpdate: true,
            postedAt: "2026-10-17 11:00",
          },
          {
            id: "up13",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Bring printed copies of your CV or a QR link to your GitHub portfolio.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 09:30",
          },
          {
            id: "up14",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content: "Updated my GitHub portfolio and bookmarked this date!",
            isOfficialUpdate: false,
            postedAt: "2026-10-19 12:00",
          },
          {
            id: "up15",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content:
              "Are there R&D fellowship tracks for graduate students as well?",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 08:45",
          },
          {
            id: "up16",
            author: "u3",
            authorName: "Dr. Rafael Antonio Cruz",
            authorRole: "Faculty",
            content:
              "Yes, several partner labs are recruiting both undergraduate interns and graduate researchers.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 10:15",
          },
        ],
      },
      {
        id: "e4",
        title: "Software Engineering & Cloud Architecture Colloquium",
        category: "Seminar",
        date: "2026-12-17",
        time: "14:00",
        endTime: "16:30",
        venue: "Yuchengco Hall Y407, Manila Campus",
        description:
          "Targeted technical colloquium on scalable Node.js microservices, cloud deployment on Render, and database indexing.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["CCS", "GCOE"],
        targetDepartments: ["ST", "IT", "ECE", "IE"],
        targetAcademicLevels: ["Undergraduate", "Graduate"],
        targetCampuses: ["Manila", "Laguna"],
        status: "Open",
        maxCapacity: 20,
        attendees: ["u1", "u2", "u3", "u5", "u11"],
        updates: [
          {
            id: "up17",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "This colloquium is targeted to CCS and GCOE computing and systems students and faculty.",
            isOfficialUpdate: true,
            postedAt: "2026-10-18 13:00",
          },
          {
            id: "up18",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Speaker slides on MongoDB compound indexes will be shared after the talk.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 15:00",
          },
          {
            id: "up19",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content: "Excited for the cloud deployment walkthrough!",
            isOfficialUpdate: false,
            postedAt: "2026-10-19 16:20",
          },
          {
            id: "up20",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content:
              "Will session store configuration for production also be covered?",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 09:10",
          },
          {
            id: "up21",
            author: "u3",
            authorName: "Dr. Rafael Antonio Cruz",
            authorRole: "Faculty",
            content:
              "Yes, we will discuss session management and environment variable security.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 11:00",
          },
        ],
      },
      {
        id: "e5",
        title: "UI/UX Design Sprint & Interactive Prototyping Lab",
        category: "Workshop",
        date: "2026-12-15",
        time: "15:00",
        endTime: "18:00",
        venue: "Gokongwei Hall GK202, Manila Campus",
        description:
          "Intensive small-group design sprint focused on accessible interfaces, responsive Bootstrap layouts, and usability testing.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Full",
        maxCapacity: 5,
        attendees: ["u1", "u2", "u4", "u5", "u12"],
        updates: [
          {
            id: "up22",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "All 5 workshop lab stations in GK202 are now filled! If an attendee leaves, a slot will automatically reopen.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 10:00",
          },
          {
            id: "up23",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Please pre-install Figma Desktop or sign in via browser before 3:00 PM.",
            isOfficialUpdate: true,
            postedAt: "2026-10-21 09:00",
          },
          {
            id: "up24",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content: "Glad I secured the last slot for our group!",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 10:00",
          },
          {
            id: "up25",
            author: "u4",
            authorName: "Bea Katrina Villanueva",
            authorRole: "Student",
            content: "Excited to collaborate on the UI prototypes.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 10:30",
          },
          {
            id: "up26",
            author: "u12",
            authorName: "Marco Gabriel Lim",
            authorRole: "Student",
            content: "See everyone at GK202!",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 13:15",
          },
        ],
      },
      {
        id: "e6",
        title: "DevOps, Git Workflows & Automated Testing Seminar",
        category: "Seminar",
        date: "2026-12-18",
        time: "13:30",
        endTime: "16:00",
        venue: "Br. Andrew Gonzalez Hall A1103, Manila Campus",
        description:
          "Learn collaborative Git branching, commit hygiene, and unit testing with Jest for software engineering teams.",
        organizer: "u6",
        organizerName: "La Salle Computer Society (LSCS)",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Open",
        maxCapacity: 20,
        attendees: ["u2", "u3", "u4", "u5", "u13"],
        updates: [
          {
            id: "up27",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Room A1103 confirmed. We will demonstrate live Jest test runners and Git contributor graphs.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 09:00",
          },
          {
            id: "up28",
            author: "u6",
            authorName: "La Salle Computer Society (LSCS)",
            authorRole: "Organizer",
            content:
              "Open to all DLSU students and faculty interested in software quality assurance.",
            isOfficialUpdate: true,
            postedAt: "2026-10-21 11:00",
          },
          {
            id: "up29",
            author: "u4",
            authorName: "Bea Katrina Villanueva",
            authorRole: "Student",
            content:
              "Count me in! Very helpful for our team repository management.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 12:30",
          },
          {
            id: "up30",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content: "Will we cover TDD matchers in Jest?",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 13:00",
          },
          {
            id: "up31",
            author: "u3",
            authorName: "Dr. Rafael Antonio Cruz",
            authorRole: "Faculty",
            content:
              "Yes, both unit testing fundamentals and test-driven development will be covered.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 14:20",
          },
        ],
      },
      {
        id: "e7",
        title: "AI & Computer Vision in Healthcare Symposium",
        category: "Seminar",
        date: "2026-12-19",
        time: "10:00",
        endTime: "12:30",
        venue: "Gokongwei Hall GK401 AdRIC Lab, Manila Campus",
        description:
          "Research symposium hosted by CIVI featuring deep learning models for medical imaging and visual diagnostics.",
        organizer: "u7",
        organizerName:
          "Center for Computational Imaging and Visual Innovations (CIVI)",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["CCS", "GCOE", "COS", "SHS"],
        targetDepartments: ["ST", "IT", "ECE", "BIO", "PHYS", "STEM"],
        targetAcademicLevels: [
          "Senior High School",
          "Undergraduate",
          "Graduate",
        ],
        targetCampuses: ["Manila", "Laguna"],
        status: "Open",
        maxCapacity: 15,
        attendees: ["u1", "u2", "u3", "u13", "u14"],
        updates: [
          {
            id: "up32",
            author: "u7",
            authorName:
              "Center for Computational Imaging and Visual Innovations (CIVI)",
            authorRole: "Organizer",
            content:
              "Symposium schedule and research abstract booklet are now available for registered participants.",
            isOfficialUpdate: true,
            postedAt: "2026-10-17 10:00",
          },
          {
            id: "up33",
            author: "u7",
            authorName:
              "Center for Computational Imaging and Visual Innovations (CIVI)",
            authorRole: "Organizer",
            content:
              "Live lab demos of biomedical segmentation will follow the keynote talks in GK401.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 14:00",
          },
          {
            id: "up34",
            author: "u3",
            authorName: "Dr. Rafael Antonio Cruz",
            authorRole: "Faculty",
            content:
              "Wonderful opportunity for students considering thesis topics in visual innovations.",
            isOfficialUpdate: false,
            postedAt: "2026-10-19 16:30",
          },
          {
            id: "up35",
            author: "u1",
            authorName: "Miguel Lorenzo Tan",
            authorRole: "Student",
            content:
              "Bookmarked and registered! Excited to see CIVI research demos.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 09:15",
          },
          {
            id: "up36",
            author: "u14",
            authorName: "Dr. Elena Marie Velasco",
            authorRole: "Faculty",
            content:
              "Traveling from Laguna campus to attend the morning keynote.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 11:45",
          },
        ],
      },
      {
        id: "e8",
        title: "Graduate Thesis & LaTeX Research Publication Clinic",
        category: "Workshop",
        date: "2026-12-14",
        time: "13:00",
        endTime: "16:00",
        venue: "Henry Sy Sr. Hall 6F Seminar Room, Manila Campus",
        description:
          "Targeted academic writing clinic for Graduate students and Faculty advisers preparing IEEE/ACM camera-ready manuscripts.",
        organizer: "u7",
        organizerName:
          "Center for Computational Imaging and Visual Innovations (CIVI)",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["CCS", "GCOE", "RVR-COB"],
        targetDepartments: ["ST", "IT", "ECE", "FIN"],
        targetAcademicLevels: ["Graduate"],
        targetCampuses: ["Manila", "Laguna"],
        status: "Closed",
        maxCapacity: 10,
        attendees: ["u2", "u3", "u5", "u12", "u14"],
        updates: [
          {
            id: "up37",
            author: "u7",
            authorName:
              "Center for Computational Imaging and Visual Innovations (CIVI)",
            authorRole: "Organizer",
            content:
              "Registration is now closed as manuscript review assignments have been finalized.",
            isOfficialUpdate: true,
            postedAt: "2026-10-17 12:00",
          },
          {
            id: "up38",
            author: "u7",
            authorName:
              "Center for Computational Imaging and Visual Innovations (CIVI)",
            authorRole: "Organizer",
            content:
              "Overleaf templates for DLSU graduate theses have been sent to confirmed participants.",
            isOfficialUpdate: true,
            postedAt: "2026-10-19 14:00",
          },
          {
            id: "up39",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content: "Received the LaTeX template—thank you!",
            isOfficialUpdate: false,
            postedAt: "2026-10-19 15:20",
          },
          {
            id: "up40",
            author: "u5",
            authorName: "Carlos Joaquin Mendoza",
            authorRole: "Student",
            content: "Bringing my draft IEEE conference paper for peer review.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 10:00",
          },
          {
            id: "up41",
            author: "u14",
            authorName: "Dr. Elena Marie Velasco",
            authorRole: "Faculty",
            content:
              "Looking forward to mentoring the graduate research track.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 13:30",
          },
        ],
      },
      {
        id: "e9",
        title: "Animo Green Community & Lasallian Social Enterprise Bazaar",
        category: "Bazaar",
        date: "2026-11-30",
        time: "09:00",
        endTime: "17:00",
        venue: "Marian Quadrangle, Manila Campus",
        description:
          "University-wide sustainability fair featuring student-led social enterprises, eco-friendly crafts, and partner NGOs.",
        organizer: "u8",
        organizerName: "Office of Student L.I.F.E.",
        isPublic: true,
        targetRoles: [],
        targetColleges: [],
        targetDepartments: [],
        targetAcademicLevels: [],
        targetCampuses: [],
        status: "Open",
        maxCapacity: 30,
        attendees: ["u1", "u2", "u4", "u11", "u12", "u13"],
        updates: [
          {
            id: "up42",
            author: "u8",
            authorName: "Office of Student L.I.F.E.",
            authorRole: "Organizer",
            content:
              "Bring your own reusable tote bags and tumblers! Booth map at Marian Quadrangle is now posted.",
            isOfficialUpdate: true,
            postedAt: "2026-10-18 08:30",
          },
          {
            id: "up43",
            author: "u8",
            authorName: "Office of Student L.I.F.E.",
            authorRole: "Organizer",
            content:
              "Open to all students and faculty across colleges and Senior High School.",
            isOfficialUpdate: true,
            postedAt: "2026-10-20 10:00",
          },
          {
            id: "up44",
            author: "u4",
            authorName: "Bea Katrina Villanueva",
            authorRole: "Student",
            content: "Our RVR-COB social enterprise booth will be at Tent 4!",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 11:15",
          },
          {
            id: "up45",
            author: "u12",
            authorName: "Marco Gabriel Lim",
            authorRole: "Student",
            content: "Dropping by after our morning finance seminar.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 09:40",
          },
          {
            id: "up46",
            author: "u13",
            authorName: "Sophia Gabrielle Sy",
            authorRole: "Student",
            content: "Excited to visit with my SHS classmates!",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 14:10",
          },
        ],
      },
      {
        id: "e10",
        title: "Laguna Campus Robotics, IoT & Automation Expo",
        category: "Competition",
        date: "2026-12-15",
        time: "10:00",
        endTime: "16:00",
        venue: "MRR Building Pergola, Laguna Campus",
        description:
          "Targeted showcase of autonomous rovers, industrial automation, and smart-campus prototypes at DLSU Laguna.",
        organizer: "u8",
        organizerName: "Office of Student L.I.F.E.",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["GCOE", "RVR-COB"],
        targetDepartments: ["ECE", "IE", "ME", "MEM", "MOD", "FIN"],
        targetAcademicLevels: ["Undergraduate", "Graduate"],
        targetCampuses: ["Laguna", "Manila"],
        status: "Open",
        maxCapacity: 20,
        attendees: ["u4", "u5", "u11", "u12", "u14"],
        updates: [
          {
            id: "up47",
            author: "u8",
            authorName: "Office of Student L.I.F.E.",
            authorRole: "Organizer",
            content:
              "Arrow shuttle reservations from Manila to Laguna campus must be booked 24 hours in advance.",
            isOfficialUpdate: true,
            postedAt: "2026-10-18 09:00",
          },
          {
            id: "up48",
            author: "u8",
            authorName: "Office of Student L.I.F.E.",
            authorRole: "Organizer",
            content:
              "Prototype judging starts promptly at 10:30 AM at the MRR Pergola.",
            isOfficialUpdate: true,
            postedAt: "2026-10-20 11:00",
          },
          {
            id: "up49",
            author: "u5",
            authorName: "Carlos Joaquin Mendoza",
            authorRole: "Student",
            content: "Our ECE embedded systems lab rover is ready for testing.",
            isOfficialUpdate: false,
            postedAt: "2026-10-20 13:20",
          },
          {
            id: "up50",
            author: "u11",
            authorName: "Patricia Mae Bautista",
            authorRole: "Student",
            content:
              "Excited to host our Manila engineering and business peers at Laguna campus!",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 15:00",
          },
          {
            id: "up51",
            author: "u14",
            authorName: "Dr. Elena Marie Velasco",
            authorRole: "Faculty",
            content:
              "Looking forward to evaluating the student automation prototypes.",
            isOfficialUpdate: false,
            postedAt: "2026-10-21 16:10",
          },
        ],
      },
      {
        id: "e11",
        title:
          "GCOE Inter-Departmental Engineering & STEM Innovation Challenge",
        category: "Competition",
        date: "2026-10-15",
        time: "08:30",
        endTime: "16:30",
        venue: "Velasco Hall V103 & Laguna Milagros Del Rosario Bldg",
        description:
          "Completed engineering design pitch where interdisciplinary GCOE and STEM teams presented sustainable urban infrastructure solutions.",
        organizer: "u9",
        organizerName: "Engineering College Government (ECG)",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["GCOE", "SHS"],
        targetDepartments: ["IE", "CHE", "CE", "ECE", "ME", "MEM", "STEM"],
        targetAcademicLevels: [
          "Senior High School",
          "Undergraduate",
          "Graduate",
        ],
        targetCampuses: ["Manila", "Laguna"],
        status: "Completed",
        maxCapacity: 25,
        attendees: ["u5", "u11", "u13", "u14", "u4"],
        updates: [
          {
            id: "up52",
            author: "u9",
            authorName: "Engineering College Government (ECG)",
            authorRole: "Organizer",
            content:
              "Final pitch deck submissions have been compiled for the judging panel.",
            isOfficialUpdate: true,
            postedAt: "2026-10-14 09:00",
          },
          {
            id: "up53",
            author: "u9",
            authorName: "Engineering College Government (ECG)",
            authorRole: "Organizer",
            content:
              "Thank you to all participating teams! Certificates of participation have been issued.",
            isOfficialUpdate: true,
            postedAt: "2026-10-15 17:30",
          },
          {
            id: "up54",
            author: "u5",
            authorName: "Carlos Joaquin Mendoza",
            authorRole: "Student",
            content:
              "Great feedback from the faculty judges on our smart-grid prototype.",
            isOfficialUpdate: false,
            postedAt: "2026-10-15 18:00",
          },
          {
            id: "up55",
            author: "u11",
            authorName: "Patricia Mae Bautista",
            authorRole: "Student",
            content:
              "Thank you ECG for organizing a smooth dual-campus competition!",
            isOfficialUpdate: false,
            postedAt: "2026-10-15 18:20",
          },
          {
            id: "up56",
            author: "u13",
            authorName: "Sophia Gabrielle Sy",
            authorRole: "Student",
            content: "Learned so much from the college engineering mentors.",
            isOfficialUpdate: false,
            postedAt: "2026-10-15 19:00",
          },
        ],
      },
      {
        id: "e12",
        title: "RVR-COB Corporate Strategy, FinTech & Governance Forum",
        category: "Seminar",
        date: "2026-10-18",
        time: "14:00",
        endTime: "17:00",
        venue: "Yuchengco Hall Auditorium, Manila Campus",
        description:
          "Completed executive forum on digital banking regulation, corporate governance, and ASEAN market strategy.",
        organizer: "u10",
        organizerName: "Business Management Society (BMS)",
        isPublic: false,
        targetRoles: ["Student", "Faculty"],
        targetColleges: ["RVR-COB", "CLT-SOE", "CCS"],
        targetDepartments: [
          "MOD",
          "MAD",
          "ACY",
          "FIN",
          "CLW",
          "DSI",
          "ECON",
          "ST",
          "IT",
        ],
        targetAcademicLevels: ["Undergraduate", "Graduate"],
        targetCampuses: ["Manila"],
        status: "Completed",
        maxCapacity: 25,
        attendees: ["u1", "u2", "u3", "u4", "u12", "u14"],
        updates: [
          {
            id: "up57",
            author: "u10",
            authorName: "Business Management Society (BMS)",
            authorRole: "Organizer",
            content:
              "Yuchengco Auditorium doors open at 1:30 PM. Business casual attire is encouraged.",
            isOfficialUpdate: true,
            postedAt: "2026-10-16 10:00",
          },
          {
            id: "up58",
            author: "u10",
            authorName: "Business Management Society (BMS)",
            authorRole: "Organizer",
            content:
              "Forum concluded! Recording and speaker key takeaways are now archived on this page.",
            isOfficialUpdate: true,
            postedAt: "2026-10-18 17:30",
          },
          {
            id: "up59",
            author: "u4",
            authorName: "Bea Katrina Villanueva",
            authorRole: "Student",
            content:
              "The panel on sustainable supply chains was super insightful.",
            isOfficialUpdate: false,
            postedAt: "2026-10-18 18:00",
          },
          {
            id: "up60",
            author: "u12",
            authorName: "Marco Gabriel Lim",
            authorRole: "Student",
            content: "Great Q&A session with the FinTech industry speakers.",
            isOfficialUpdate: false,
            postedAt: "2026-10-18 18:15",
          },
          {
            id: "up61",
            author: "u2",
            authorName: "Hannah Sofia Reyes",
            authorRole: "Student",
            content:
              "Appreciated the cross-disciplinary perspective on IT governance in banking.",
            isOfficialUpdate: false,
            postedAt: "2026-10-18 18:45",
          },
        ],
      },
    ];

    const bookmarks = [
      {
        id: "b1",
        user: "u1",
        event: "e1",
        personalNote:
          "Bring laptop with Node.js v20 and MongoDB Compass; meet groupmates at GK lobby at 12:45 PM.",
        createdAt: "2026-10-20",
      },
      {
        id: "b2",
        user: "u1",
        event: "e2",
        personalNote:
          "Review express-validator and bcrypt salt rounds with Laurence before the CTF starts.",
        createdAt: "2026-10-20",
      },
      {
        id: "b3",
        user: "u1",
        event: "e3",
        personalNote:
          "Print 5 copies of resume and prepare GitHub link for software engineering internship booths.",
        createdAt: "2026-10-20",
      },
      {
        id: "b4",
        user: "u1",
        event: "e4",
        personalNote:
          "Take notes on Render deployment and MongoDB indexing for Phase 3.",
        createdAt: "2026-10-20",
      },
      {
        id: "b5",
        user: "u1",
        event: "e5",
        personalNote:
          "Bring UI wireframe sketches for our AnimoEvents mobile responsiveness check.",
        createdAt: "2026-10-20",
      },
      {
        id: "b6",
        user: "u1",
        event: "e7",
        personalNote:
          "Ask CIVI researchers about undergraduate thesis opportunities in computer vision.",
        createdAt: "2026-10-20",
      },
      {
        id: "b7",
        user: "u2",
        event: "e1",
        personalNote:
          "Assist undergraduate peers during the Mongoose ODM hands-on lab.",
        createdAt: "2026-10-20",
      },
      {
        id: "b8",
        user: "u2",
        event: "e3",
        personalNote:
          "Check R&D graduate fellowship booths at Henry Sy Roofdeck.",
        createdAt: "2026-10-20",
      },
      {
        id: "b9",
        user: "u2",
        event: "e4",
        personalNote:
          "Compare cloud architecture patterns with my MS IT capstone.",
        createdAt: "2026-10-20",
      },
      {
        id: "b10",
        user: "u2",
        event: "e6",
        personalNote: "Review Jest automated testing slides.",
        createdAt: "2026-10-20",
      },
      {
        id: "b11",
        user: "u2",
        event: "e7",
        personalNote:
          "Network with AdRIC faculty after the healthcare AI keynote.",
        createdAt: "2026-10-20",
      },
      {
        id: "b12",
        user: "u2",
        event: "e8",
        personalNote:
          "Bring LaTeX thesis bibliography file for formatting check.",
        createdAt: "2026-10-20",
      },
      {
        id: "b13",
        user: "u6",
        event: "e1",
        personalNote:
          "Confirm GK304B projector adapter and attendance sheet with CCS office.",
        createdAt: "2026-10-20",
      },
      {
        id: "b14",
        user: "u6",
        event: "e2",
        personalNote:
          "Coordinate scoreboard server uptime with CTF technical committee.",
        createdAt: "2026-10-20",
      },
      {
        id: "b15",
        user: "u6",
        event: "e3",
        personalNote:
          "Finalize company booth assignments at Henry Sy Roofdeck.",
        createdAt: "2026-10-20",
      },
      {
        id: "b16",
        user: "u6",
        event: "e4",
        personalNote:
          "Prepare guest speaker tokens and certificates for Y407 colloquium.",
        createdAt: "2026-10-20",
      },
      {
        id: "b17",
        user: "u6",
        event: "e5",
        personalNote:
          "Verify all 5 GK202 lab workstations have Figma pre-installed.",
        createdAt: "2026-10-20",
      },
      {
        id: "b18",
        user: "u6",
        event: "e6",
        personalNote:
          "Upload Git and Jest sample repository link to event thread.",
        createdAt: "2026-10-20",
      },
    ];

    return {
      currentUserId: "u1",
      users: users,
      events: events,
      bookmarks: bookmarks,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.users) &&
          Array.isArray(parsed.events)
        ) {
          if (!Array.isArray(parsed.bookmarks)) {
            parsed.bookmarks = [];
          }
          parsed.events.forEach(function (event) {
            if (!Array.isArray(event.attendees)) event.attendees = [];
            if (!Array.isArray(event.updates)) event.updates = [];
            if (!Array.isArray(event.targetRoles)) event.targetRoles = [];
            if (!Array.isArray(event.targetColleges)) event.targetColleges = [];
            if (!Array.isArray(event.targetDepartments)) {
              event.targetDepartments = [];
            }
            if (!Array.isArray(event.targetAcademicLevels)) {
              event.targetAcademicLevels = [];
            }
            if (!Array.isArray(event.targetCampuses)) {
              event.targetCampuses = [];
            }
            Object.assign(event, normalizeAudience(event));
          });
          parsed.users.forEach(function (user) {
            if (!user.password) user.password = DEMO_PASSWORD;
          });
          parsed.bookmarks = parsed.bookmarks.filter(function (bookmark) {
            return (
              bookmark &&
              bookmark.user !== undefined &&
              bookmark.event !== undefined
            );
          });
          if (
            parsed.currentUserId === undefined ||
            (parsed.currentUserId !== null &&
              !parsed.users.some(function (u) {
                return u.id === parsed.currentUserId;
              }))
          ) {
            parsed.currentUserId = parsed.users[0] ? parsed.users[0].id : null;
          }
          syncEventLifecycles(parsed.events);
          return parsed;
        }
      }
    } catch (e) {
      // Fallback to default seed state if localStorage is restricted
    }
    const fresh = getDefaultSeedState();
    syncEventLifecycles(fresh.events);
    saveState(fresh);
    return fresh;
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showToast(
          "Your browser is not allowing changes to be saved. You can continue browsing, but updates may be lost when you leave this page.",
          "warning",
        );
      }
      return false;
    }
  }

  function syncEventLifecycles(events) {
    const now = new Date();
    events.forEach(function (ev) {
      if (
        ev.status === "Cancelled" ||
        ev.status === "Postponed" ||
        ev.status === "Completed"
      ) {
        return;
      }
      const endClock =
        ev.endTime && ev.endTime.trim() !== "" ? ev.endTime.trim() : "23:59";
      const eventEnd = new Date(ev.date + "T" + endClock + ":00");
      if (!isNaN(eventEnd.getTime()) && eventEnd < now) {
        ev.status = "Completed";
      } else if (
        ev.status === "Open" &&
        ev.attendees.length >= ev.maxCapacity
      ) {
        ev.status = "Full";
      } else if (ev.status === "Full" && ev.attendees.length < ev.maxCapacity) {
        ev.status = "Open";
      }
    });
  }

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
      '<h2 class="h6 fw-bold mb-2">Audience Visibility &amp; Eligibility Rules</h2>' +
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
      '<div class="mb-3"><label class="form-label small fw-bold d-block mb-1">3. Target Colleges &amp; Integrated School</label><div class="d-flex flex-wrap gap-3">' +
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

  function isUserEligibleForEvent(user, event) {
    if (!event) return false;
    if (event.isPublic) return true;
    if (!user) return false;
    if (String(event.organizer) === String(user.id)) return true;

    const normalized = normalizeAudience(event);
    const roles = normalized.targetRoles;
    const levels = normalized.targetAcademicLevels;
    const colleges = normalized.targetColleges;
    const depts = normalized.targetDepartments;
    const campuses = normalized.targetCampuses;

    if (user.role === "Student") {
      if (roles.length > 0 && roles.indexOf("Student") === -1) return false;
      if (levels.length > 0 && levels.indexOf(user.academicLevel) === -1)
        return false;
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
      const catalog = getAudienceCatalog();
      const collegeHasDeptFilter = depts.some(function (d) {
        return catalog.departmentToCollege[d] === user.college;
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
    if (String(event.organizer) === String(user.id)) return true;
    if ((event.attendees || []).indexOf(user.id) !== -1) return true;
    return isUserEligibleForEvent(user, event);
  }

  function isGrandfatheredAttendee(user, event) {
    if (!user || !event) return false;
    const isJoined = (event.attendees || []).indexOf(user.id) !== -1;
    return isJoined && !isUserEligibleForEvent(user, event);
  }

  function formatAudienceSummary(event) {
    if (event.isPublic) {
      return "Open to All DLSU Community";
    }
    const parts = [];
    const normalized = normalizeAudience(event);
    if (normalized.targetColleges.length > 0) {
      parts.push(normalized.targetColleges.join(", "));
    }
    if (normalized.targetDepartments.length > 0) {
      parts.push("Dept/Strand: " + normalized.targetDepartments.join(", "));
    }
    if (normalized.targetAcademicLevels.length > 0) {
      parts.push(normalized.targetAcademicLevels.join(", "));
    }
    if (normalized.targetRoles.length > 0) {
      parts.push(normalized.targetRoles.join(" / "));
    }
    if (normalized.targetCampuses.length > 0) {
      parts.push(normalized.targetCampuses.join(" & ") + " Campus");
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

  function showToast(message, type) {
    let container = document.getElementById("animo-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "animo-toast-container";
      container.style.position = "fixed";
      container.style.bottom = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      container.style.maxWidth = "380px";
      document.body.appendChild(container);
    }
    const alertDiv = document.createElement("div");
    const bsClass =
      type === "danger"
        ? "alert-danger"
        : type === "warning"
          ? "alert-warning"
          : "alert-success";
    alertDiv.className =
      "alert " + bsClass + " shadow-sm border py-2 px-3 mb-2 small fw-semibold";
    alertDiv.textContent = message;
    container.appendChild(alertDiv);
    setTimeout(function () {
      if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
    }, 4200);
  }

  function handleToggleRsvp(eventId, onComplete) {
    const state = loadState();
    const user = state.users.find(function (u) {
      return u.id === state.currentUserId;
    });
    const ev = state.events.find(function (e) {
      return e.id === eventId;
    });

    if (!user) {
      showToast("Please sign in to register for campus events.", "warning");
      return;
    }
    if (!ev) return;

    if (user.role === "Organizer") {
      showToast(
        "Organizer accounts host and manage events. Please sign in with a Student or Faculty account to register as a participant.",
        "warning",
      );
      return;
    }

    if (ev.status === "Completed" || ev.status === "Cancelled") {
      showToast(
        "Registrations cannot be modified because this event is " +
          ev.status.toLowerCase() +
          ".",
        "warning",
      );
      return;
    }

    const idx = ev.attendees.indexOf(user.id);
    if (idx !== -1) {
      const grandfathered = isGrandfatheredAttendee(user, ev);
      if (grandfathered) {
        const confirmLeave = window.confirm(
          "Your current profile no longer matches this event's target audience restrictions. If you leave this event, you will not be able to re-join. Leave anyway?",
        );
        if (!confirmLeave) return;
      }
      ev.attendees.splice(idx, 1);
      if (ev.status === "Full" && ev.attendees.length < ev.maxCapacity) {
        ev.status = "Open";
      }
      saveState(state);
      showToast('You have left "' + ev.title + '".', "warning");
      if (typeof onComplete === "function") onComplete();
      return;
    }

    if (!isUserEligibleForEvent(user, ev)) {
      showToast(
        "Your profile does not match the target audience requirements for this restricted event.",
        "danger",
      );
      return;
    }
    if (ev.status === "Postponed") {
      showToast(
        "Registration is temporarily paused while this event is postponed.",
        "warning",
      );
      return;
    }
    if (ev.status === "Closed") {
      showToast(
        "Registration for this event has been closed by the organizer.",
        "danger",
      );
      return;
    }
    if (ev.attendees.length >= ev.maxCapacity || ev.status === "Full") {
      ev.status = "Full";
      saveState(state);
      showToast("This event has reached its maximum capacity.", "danger");
      return;
    }

    ev.attendees.push(user.id);
    if (ev.attendees.length >= ev.maxCapacity) {
      ev.status = "Full";
    }
    saveState(state);
    showToast(
      'Successfully registered for "' +
        ev.title +
        '"! You are now subscribed to host updates.',
      "success",
    );
    if (typeof onComplete === "function") onComplete();
  }

  function handleToggleBookmark(eventId, onComplete) {
    const state = loadState();
    const user = state.users.find(function (u) {
      return u.id === state.currentUserId;
    });
    const ev = state.events.find(function (e) {
      return e.id === eventId;
    });
    if (!user) {
      showToast("Please sign in to bookmark events.", "warning");
      return;
    }
    if (!ev) return;
    if (!canUserViewEvent(user, ev)) {
      showToast(
        "You can only bookmark events that are visible to your profile.",
        "danger",
      );
      return;
    }

    const existingIdx = state.bookmarks.findIndex(function (b) {
      return b.user === user.id && b.event === eventId;
    });

    if (existingIdx !== -1) {
      state.bookmarks.splice(existingIdx, 1);
      saveState(state);
      showToast(
        'Removed "' + ev.title + '" from your saved bookmarks.',
        "warning",
      );
    } else {
      state.bookmarks.push({
        id: "b_" + Date.now(),
        user: user.id,
        event: eventId,
        personalNote: "",
        createdAt: getLocalDateStr(),
      });
      saveState(state);
      showToast('Saved "' + ev.title + '" to your bookmarks.', "success");
    }
    if (typeof onComplete === "function") onComplete();
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

  function initSharedNavbar() {
    const state = loadState();
    const currentUser =
      state.users.find(function (u) {
        return u.id === state.currentUserId;
      }) || null;

    const navContainer = document.querySelector(".navbar-dlsu .container");
    const mainNav = document.getElementById("mainNav");
    if (navContainer && mainNav) {
      let toggler = navContainer.querySelector(".navbar-toggler");
      if (!toggler) {
        toggler = document.createElement("button");
        toggler.className = "navbar-toggler";
        toggler.type = "button";
        toggler.setAttribute("data-bs-toggle", "collapse");
        toggler.setAttribute("data-bs-target", "#mainNav");
        toggler.innerHTML = '<span class="navbar-toggler-icon"></span>';
        navContainer.insertBefore(toggler, mainNav);
      }

      const currentPage =
        window.location.pathname.split("/").pop().toLowerCase() || "index.html";
      const activePage =
        currentPage === "event-details.html" || currentPage === "events.html"
          ? "events.html"
          : currentPage === "event-create.html" ||
              currentPage === "event-edit.html"
            ? "event-create.html"
            : currentPage;
      const primaryLinks = [
        ["index.html", "Home Feed"],
        ["events.html", "Browse Events"],
        ["calendar.html", "My Calendar"],
        ["bookmarks.html", "Saved Bookmarks"],
        ["organizer.html", "Organizers"],
        ["event-create.html", "Publish Event"],
        ["about.html", "About"],
      ];
      const navList = mainNav.querySelector(".navbar-nav");
      if (navList) {
        navList.innerHTML =
          primaryLinks
            .map(function (link) {
              const isActive = link[0] === activePage;
              return (
                '<li class="nav-item">' +
                '<a class="nav-link' +
                (isActive ? " active" : "") +
                '" href="./' +
                link[0] +
                '">' +
                link[1] +
                "</a></li>"
              );
            })
            .join("") +
          '<li class="nav-item dropdown">' +
          '<a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Pages</a>' +
          '<ul class="dropdown-menu shadow-sm">' +
          '<li><h6 class="dropdown-header">Event &amp; Discovery</h6></li>' +
          '<li><a class="dropdown-item" href="./index.html">Home Feed</a></li>' +
          '<li><a class="dropdown-item" href="./events.html">Browse Events</a></li>' +
          '<li><a class="dropdown-item" href="./event-details.html?id=e1">Event Details &amp; Thread</a></li>' +
          '<li><a class="dropdown-item" href="./event-create.html">Publish Event Form</a></li>' +
          '<li><a class="dropdown-item" href="./event-edit.html?id=e1">Manage / Edit Event Form</a></li>' +
          '<li><hr class="dropdown-divider"></li>' +
          '<li><h6 class="dropdown-header">Personal &amp; Organizers</h6></li>' +
          '<li><a class="dropdown-item" href="./bookmarks.html">Saved Bookmarks</a></li>' +
          '<li><a class="dropdown-item" href="./calendar.html">Event Calendar</a></li>' +
          '<li><a class="dropdown-item" href="./organizer.html">Organizer Directory</a></li>' +
          '<li><a class="dropdown-item" href="./profile.html">My Profile</a></li>' +
          '<li><a class="dropdown-item" href="./profile-edit.html">Edit Profile</a></li>' +
          '<li><hr class="dropdown-divider"></li>' +
          '<li><h6 class="dropdown-header">Account &amp; Info</h6></li>' +
          '<li><a class="dropdown-item" href="./login.html">Sign In</a></li>' +
          '<li><a class="dropdown-item" href="./register.html">Create Account</a></li>' +
          '<li><a class="dropdown-item" href="./logout.html">Sign Out Confirmation</a></li>' +
          '<li><a class="dropdown-item" href="./about.html">About AnimoEvents</a></li>' +
          "</ul></li>";
      }

      if (!document.getElementById("nav-current-user")) {
        const wrapper = document.createElement("div");
        wrapper.className = "d-flex align-items-center gap-2 flex-wrap";
        wrapper.innerHTML =
          '<div class="dropdown">' +
          '<button class="btn btn-sm btn-dark bg-opacity-25 border-light dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown" id="nav-current-user"></button>' +
          '<ul class="dropdown-menu dropdown-menu-end shadow"></ul>' +
          "</div>";
        mainNav.appendChild(wrapper);
      }
    }

    const navUserBadge = document.getElementById("nav-current-user");
    if (navUserBadge) {
      if (currentUser) {
        const affil =
          currentUser.college +
          (currentUser.department !== "N/A"
            ? "/" + currentUser.department
            : "");
        navUserBadge.innerHTML =
          '<img src="' +
          escapeHtml(currentUser.profilePic) +
          '" alt="' +
          escapeHtml(currentUser.displayName) +
          '" class="avatar-sm me-2">' +
          '<span class="fw-semibold">' +
          escapeHtml(currentUser.displayName) +
          "</span> " +
          '<span class="badge bg-light text-dark ms-1">' +
          escapeHtml(currentUser.role) +
          " • " +
          escapeHtml(affil) +
          "</span>";
      } else {
        navUserBadge.innerHTML =
          '<span class="badge bg-warning text-dark">Guest Mode (Signed Out)</span>';
      }

      const menuEl = navUserBadge.nextElementSibling;
      if (menuEl && menuEl.classList.contains("dropdown-menu")) {
        const sessionLinks = currentUser
          ? '<li><a class="dropdown-item" href="./profile.html">View My Profile</a></li>' +
            '<li><a class="dropdown-item" href="./profile-edit.html">Edit Profile &amp; Affiliation</a></li>' +
            '<li><a class="dropdown-item text-danger" href="./logout.html">Sign Out</a></li>'
          : '<li><a class="dropdown-item fw-semibold text-success" href="./login.html">Sign In to AnimoEvents</a></li>' +
            '<li><a class="dropdown-item" href="./register.html">Create DLSU Account</a></li>';

        menuEl.innerHTML =
          '<li><h6 class="dropdown-header">Try another account</h6></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u1">Miguel Tan (Student • Undergrad • CCS/ST Manila)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u13">Sophia Sy (Student • Senior High School • STEM Manila)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u2">Hannah Reyes (Student • Graduate • CCS/IT Manila)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u3">Dr. Rafael Cruz (Faculty • CCS/ST Manila)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u5">Carlos Mendoza (Student • Graduate • GCOE/ECE Laguna)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u4">Bea Villanueva (Student • Undergrad • RVR-COB/MOD)</a></li>' +
          '<li><hr class="dropdown-divider"></li>' +
          '<li><h6 class="dropdown-header">Accredited Organizer Accounts</h6></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u6">La Salle Computer Society — LSCS (Organizer • CCS)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u7">Center for Computational Imaging — CIVI (Organizer)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u8">Office of Student L.I.F.E. (Organizer • Univ-Wide)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u9">Engineering College Government — ECG (Organizer • GCOE)</a></li>' +
          '<li><a class="dropdown-item" href="#" data-switch-user="u10">Business Management Society — BMS (Organizer • RVR-COB)</a></li>' +
          '<li><hr class="dropdown-divider"></li>' +
          sessionLinks +
          '<li><hr class="dropdown-divider"></li>' +
          '<li><a class="dropdown-item text-secondary small" href="#" data-reset-demo="true">Reset demo data</a></li>';
      }
    }

    const createLinks = document.querySelectorAll(
      'a[href$="event-create.html"]',
    );
    createLinks.forEach(function (link) {
      if (link.closest(".dropdown-menu")) return;
      if (!currentUser || currentUser.role !== "Organizer") {
        link.classList.add("d-none");
      } else {
        link.classList.remove("d-none");
      }
    });

    document.querySelectorAll("[data-switch-user]").forEach(function (btn) {
      if (btn.getAttribute("data-bound-switch") === "true") return;
      btn.setAttribute("data-bound-switch", "true");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = btn.getAttribute("data-switch-user");
        const nextState = loadState();
        nextState.currentUserId = targetId;
        saveState(nextState);
        if (
          window.location.pathname.toLowerCase().endsWith("logout.html") ||
          window.location.pathname.toLowerCase().endsWith("login.html")
        ) {
          window.location.href = "./index.html";
        } else {
          window.location.reload();
        }
      });
    });

    document.querySelectorAll("[data-reset-demo]").forEach(function (btn) {
      if (btn.getAttribute("data-bound-reset") === "true") return;
      btn.setAttribute("data-bound-reset", "true");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
      });
    });
  }

  window.AnimoApp = {
    COLLEGES_MAP: COLLEGES_MAP,
    getLocalDateStr: getLocalDateStr,
    getLocalTimestamp: getLocalTimestamp,
    escapeHtml: escapeHtml,
    loadState: loadState,
    saveState: saveState,
    syncEventLifecycles: syncEventLifecycles,
    isUserEligibleForEvent: isUserEligibleForEvent,
    canUserViewEvent: canUserViewEvent,
    isGrandfatheredAttendee: isGrandfatheredAttendee,
    formatAudienceSummary: formatAudienceSummary,
    normalizeAudience: normalizeAudience,
    validateAudience: validateAudience,
    renderAudienceEditor: renderAudienceEditor,
    getStatusBadgeClass: getStatusBadgeClass,
    handleToggleRsvp: handleToggleRsvp,
    handleToggleBookmark: handleToggleBookmark,
    bindAffiliationSelects: bindAffiliationSelects,
    showToast: showToast,
    initSharedNavbar: initSharedNavbar,
  };

  document.addEventListener("DOMContentLoaded", function () {
    initSharedNavbar();
  });
})();

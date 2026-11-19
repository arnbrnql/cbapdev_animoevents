# AnimoEvents — DLSU Campus Events & Activities Hub

**Course:** CBAPDEV (Web Application Development), Section X21, Term 1, AY 2026–2027  
**Institution:** Department of Software Technology, College of Computer Studies, De La Salle University  
**Instructor:** Asst. Prof. Arren Matthew C. Antioquia (`arren.antioquia@dlsu.edu.ph`)

## Group 4 Members & MVC Module Ownership

- **Arron Baranquil** — Authentication, User Profile CRUD & Affiliation Management (`model/User.js`, `controllers/authUserController.js`, `routes/authUserRoutes.js`, `middleware/auth.js`, `middleware/validators.js`, `views/login.hbs`, `views/logout.hbs`, `views/register.hbs`, `views/profile.hbs`, `views/profile-edit.hbs`)
- **Laurence Benjamin Diaz** — Personalized Home Feed, Event Posts CRUD, Lifecycle Management & Discussion Threads (`model/Event.js`, `controllers/eventController.js`, `routes/eventRoutes.js`, `views/index.hbs`, `views/event-details.hbs`, `views/event-create.hbs`, `views/event-edit.hbs`)
- **Alaine Carlo Magdaluyo** — Multi-Criteria Search & Filter Engine, RSVP Capacity Logic, Multi-Year Calendar & Organizers (`controllers/discoveryController.js`, `routes/discoveryRoutes.js`, `public/js/main.js`, `views/events.hbs`, `views/calendar.hbs`, `views/organizer.hbs`)
- **John Michael Sumilang** — Saved Event Bookmarks CRUD, Institutional Seed Dataset, Shared Layout Shell & Server Configuration (`app.js`, `model/db.js`, `model/constants.js`, `model/Bookmark.js`, `model/seedData.js`, `model/seed.js`, `controllers/bookmarkController.js`, `routes/bookmarkRoutes.js`, `views/layouts/main.hbs`, `views/bookmarks.hbs`, `views/about.hbs`)

---

## 1. Local Setup & Running the Application (Node.js & MongoDB)

**Prerequisites:** Node.js (v18 or higher) with npm, plus a running MongoDB Community Server on `127.0.0.1:27017`. After installing dependencies, the app serves its Bootstrap assets locally.

1. Open a terminal in the extracted project folder and install the locked dependencies:

   ```bash
   npm ci
   ```

   (Or run npm install)

2. Copy .env.example to .env. In PowerShell, run Copy-Item .env.example .env. In Command Prompt, run copy .env.example .env. In Bash, run cp .env.example .env. The example uses the dedicated local database animoevents_demo.
3. Load the sample records, then start the server:

   ```bash
   npm run seed
   npm start
   ```

4. Open http://localhost:3000. Home and the public events directory are available before sign-in.

Run the seed once per fresh demo database. It requires NODE*ENV=development, DEMO_MODE=true, and a single loopback MongoDB URI named animoevents_demo or animoevents_demo*<suffix> with no URI options. An existing or partially seeded database is left intact. For another clean run, drop animoevents_demo in MongoDB Compass (or change the database name in .env, such as animoevents_demo_retry) and run npm run seed again.

## 2. Sample DLSU Accounts & Grading Walkthrough

The seed provides 14 sample accounts, 12 events, 18 bookmarks, and 61 event discussion posts. Use the sample accounts section on the Sign In page (/login), or enter a sample email and the demo password AnimoPass123!.

| Role                       | Sample email             | What to try                                                              |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| Undergraduate student      | miguel_tan@dlsu.edu.ph   | Search, RSVP, edit bookmark notes, view the calendar, and edit a profile |
| Senior High School student | sophia_sy@dlsu.edu.ph    | Check which audience filters and targeted events apply                   |
| Graduate student           | hannah_reyes@dlsu.edu.ph | Compare access to events for different academic levels                   |
| Faculty                    | rafael.cruz@dlsu.edu.ph  | Browse and RSVP to events open to faculty                                |
| Organizer                  | lscs@dlsu.edu.ph         | Create an event, post an official update, and view hosted events         |

- Start as a guest and search for “Bootcamp” in Events. Compare the directory after signing in with different affiliations.
- The Calendar opens to the current month in the Philippines. Select December 2026 to see most sample events. The home feed’s archive includes the October and November examples.
- Create a public event with the organizer account, then sign in as a student in a separate browser session to join, save a bookmark, and leave a reply. Confirm the changes in the calendar and the discussion thread. Return to the organizer session to edit the event and verify the official update.
- Register a new student or faculty account to check signup, profile editing, sign-out, and account deletion.

## 3. References

### NPM Packages & Front-End Libraries

- express — Web application server and modular routing framework (https://expressjs.com/).
- hbs — Express view engine for Handlebars templates, layouts, partials, and custom helpers (https://www.npmjs.com/package/hbs).
- mongoose — MongoDB Object Data Modeling (ODM) library for schemas, validation, and queries (https://mongoosejs.com/).
- bcrypt — Cryptographic password salting and hashing via Mongoose pre('save') hooks (https://www.npmjs.com/package/bcrypt).
- express-session — Server-side session management with httpOnly cookies (https://www.npmjs.com/package/express-session).
- express-validator — Server-side form validation and sanitization middleware (https://express-validator.github.io/).
- dotenv — Environment variable loader for database URI and session configuration (https://www.npmjs.com/package/dotenv).
- Bootstrap 5.3.3 — Responsive layout grid, navigation bar, cards, dropdowns, and modals (https://getbootstrap.com/). The Bootstrap bundle includes Popper for dropdown placement.

### Generative AI Use Disclosure

In compliance with the CBAPDEV course policy on Artificial Intelligence tools and the DLSU Policies on Generative AI in Higher Education, Group 4 declares the use of Google Gemini during project preparation for:

1. Brainstorming institutional demographic targeting rules and edge cases (such as grandfathered event registrations when a student updates their profile).
2. Auditing requirement coverage against the approved Phase 0 project proposal and course rubrics.
3. Debugging client-side and server-side filtering and date-handling edge cases.

All code, user interfaces, database schemas, controllers, sample datasets, and application logic were reviewed, tested, and validated by the group members to ensure full understanding and ownership.

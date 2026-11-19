# AnimoEvents — DLSU Campus Events & Activities Hub

**Course:** CBAPDEV (Web Application Development) — Section X21, Term 1 AY 2026–2027  
**Department:** Department of Software Technology, College of Computer Studies, De La Salle University  
**Instructor:** Asst. Prof. Arren Matthew C. Antioquia (`arren.antioquia@dlsu.edu.ph`)

AnimoEvents is a campus event bulletin board and personal calendar for DLSU Manila and Laguna students, faculty, and accredited organizers. Users can discover public and audience-targeted events, RSVP directly, join event discussion threads, save bookmarks with personal notes, and track their schedule on a monthly calendar.

## Group 4 Members & Module Ownership

- **Arron Baranquil** — Authentication, User Profiles & Validation (`model/User.js`, `controllers/authUserController.js`, `routes/authUserRoutes.js`, `middleware/auth.js`, `middleware/validators.js`, `views/login.hbs`, `views/logout.hbs`, `views/register.hbs`, `views/profile.hbs`, `views/profile-edit.hbs`)
- **Laurence Benjamin Diaz** — Home Feed, Event CRUD, Lifecycle & Discussion Threads (`model/Event.js`, `model/manilaTime.js`, `controllers/eventController.js`, `routes/eventRoutes.js`, `views/index.hbs`, `views/event-details.hbs`, `views/event-create.hbs`, `views/event-edit.hbs`)
- **Alaine Carlo Magdaluyo** — Event Search & Filters, RSVP Logic, Calendar & Organizers (`controllers/discoveryController.js`, `controllers/returnPath.js`, `routes/discoveryRoutes.js`, `public/js/main.js`, `views/events.hbs`, `views/calendar.hbs`, `views/organizer.hbs`)
- **John Michael Sumilang** — Event Bookmarks, Seed Dataset, Layout & Server Setup (`app.js`, `model/db.js`, `model/constants.js`, `model/Bookmark.js`, `model/seedData.js`, `model/seed.js`, `controllers/bookmarkController.js`, `routes/bookmarkRoutes.js`, `views/layouts/main.hbs`, `views/bookmarks.hbs`, `views/about.hbs`)

---

## 1. Local Setup & Running the App

### Prerequisites

- **Node.js** (v18 or higher) and npm
- **MongoDB Community Server** running locally on `127.0.0.1:27017`

### Steps

1. Open a terminal in the project root folder and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file by copying `.env.example`:
   - **Windows Command Prompt:** `copy .env.example .env`
   - **PowerShell:** `Copy-Item .env.example .env`
   - **macOS / Linux:** `cp .env.example .env`

   The default `.env.example` configures a local demo database (`mongodb://127.0.0.1:27017/animoevents_demo`) with `NODE_ENV=development` and `DEMO_MODE=true`.

3. Seed the sample database (14 users, 12 events, 18 bookmarks, and 61 thread posts):
   ```bash
   npm run seed
   ```
   *(Note: To prevent overwriting existing data, the seeder only runs on an empty local `animoevents_demo` or `animoevents_demo_*` database. If you want a fresh reset later, drop `animoevents_demo` in MongoDB Compass or change the database name in `.env` and run `npm run seed` again. You can also run `npm run seed -- --check` to verify your MongoDB connection before seeding.)*

4. Start the server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

---

## 2. Sample Accounts for Testing

All seeded accounts use the demo password `AnimoPass123!`. You can type them manually on `/login` or use the sample account quick-fill list on the Sign In page.

| Role | Email | Suggested Flow to Test |
| --- | --- | --- |
| Undergraduate Student (CCS/ST Manila) | `miguel_tan@dlsu.edu.ph` | Search/filter events, RSVP, manage bookmarks, edit profile, view calendar |
| Senior High School Student (SHS/STEM Manila) | `sophia_sy@dlsu.edu.ph` | Check SHS-eligible targeted events and visibility rules |
| Graduate Student (CCS/IT Manila) | `hannah_reyes@dlsu.edu.ph` | View graduate-level events (e.g., Graduate Thesis Clinic) |
| Faculty (CCS/ST Manila) | `rafael.cruz@dlsu.edu.ph` | Browse and join faculty-accessible events |
| Organizer (LSCS — CCS Manila) | `lscs@dlsu.edu.ph` | Publish a new event, edit event details/status, post official host updates |

### Quick Feature Walkthrough

- **Guest vs. Signed-In Visibility:** Visit `/` and `/events` while signed out to see public university-wide events, then sign in with different student/faculty accounts to verify demographic targeting.
- **Calendar & Archive:** `/calendar` opens to the current month (Asia/Manila time). Switch to December 2026 to view upcoming seeded events, or check the Completed Archive tab on `/` for past October/November events.
- **Event Management & RSVP:** Create or edit an event as `lscs@dlsu.edu.ph`, then join, bookmark, and comment as a student account to verify live participant counters and official updates.
- **Account Lifecycle:** Register a new Student or Faculty account at `/register`, edit your college/department at `/profile/edit` to test grandfathered registrations, and test cascading account deletion at `/profile`.

---

## 3. Libraries & References

### NPM Packages & Front-End Libraries

- **express** — Web server and routing framework (`https://expressjs.com/`)
- **express-handlebars** — Handlebars view engine for layouts, partials, and helpers (`https://www.npmjs.com/package/express-handlebars`)
- **mongoose** — MongoDB ODM for schemas, validation, and queries (`https://mongoosejs.com/`)
- **bcrypt** — Password salting and hashing via Mongoose `pre('save')` hooks (`https://www.npmjs.com/package/bcrypt`)
- **express-session** — Server-side session management (`https://www.npmjs.com/package/express-session`)
- **express-validator** — Server-side form validation middleware (`https://express-validator.github.io/`)
- **dotenv** — Environment variable configuration (`https://www.npmjs.com/package/dotenv`)
- **Bootstrap 5.3.3** — Responsive layout, components, and modals served locally from `node_modules/bootstrap` (`https://getbootstrap.com/`)

### Generative AI Use Disclosure

In compliance with the CBAPDEV course policy and the DLSU Policies on Generative Artificial Intelligence in Higher Education, Group 4 used **Google Gemini** strictly as a supplementary learning and planning aid during development. It was used to brainstorm demographic targeting edge cases (such as preserving grandfathered event registrations after profile updates), clarify Express, Handlebars, and Mongoose documentation and syntax, and cross-check our features against the Phase 0 proposal and Phase 2 rubric. Its influence was limited to conceptual discussions and documentation reference; all schemas, routes, controllers, views, and sample data were implemented, verified against official documentation and class lectures, and tested by Group 4.

**Reference:**  
Google. (2026). *Gemini* [Large language model]. https://gemini.google.com/
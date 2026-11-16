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

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB Community Server** running locally on `mongodb://127.0.0.1:27017` (or a MongoDB Atlas connection string configured in `.env`)

### Installation & Startup Steps

1. Open a terminal in the project root directory and install all dependencies:
   ```bash
   npm install
   ```

2. (Optional) Create a `.env` file in the root directory (defaults are automatically provided if `.env` is omitted):
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/animoevents
   SESSION_SECRET=animoevents-dlsu-secret-key
   ```

3. Seed the MongoDB database with the initial 14 DLSU users, 12 campus events, and 18 saved bookmarks:
   ```bash
   npm run seed
   ```
   *(Note: Starting the server via `npm start` also checks if the database is empty and automatically seeds the initial dataset if no users exist.)*

4. Start the Express server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your web browser.

---

## 2. Sample DLSU Accounts for Testing

All seeded accounts share the demo password `AnimoPass123!` (hashed with bcrypt via `userSchema.pre('save')`). You can sign in at `/login` or use the **Try another account** switcher in the top-right navigation bar:

- **Undergraduate Student (CCS/ST Manila):** `miguel_tan@dlsu.edu.ph` (`AnimoPass123!`)
- **Senior High School Student (SHS/STEM Manila):** `sophia_sy@dlsu.edu.ph` (`AnimoPass123!`)
- **Graduate Student (CCS/IT Manila):** `hannah_reyes@dlsu.edu.ph` (`AnimoPass123!`)
- **Faculty Member (CCS/ST Manila):** `rafael.cruz@dlsu.edu.ph` (`AnimoPass123!`)
- **Laguna Graduate Student (GCOE/ECE Laguna):** `carlos_mendoza@dlsu.edu.ph` (`AnimoPass123!`)
- **Undergraduate Student (RVR-COB/MOD Manila):** `bea_villanueva@dlsu.edu.ph` (`AnimoPass123!`)
- **Accredited Organizer (La Salle Computer Society — LSCS):** `lscs@dlsu.edu.ph` (`AnimoPass123!`)
- **Accredited Organizer (CIVI Research Center):** `civi@dlsu.edu.ph` (`AnimoPass123!`)
- **Accredited Organizer (Office of Student L.I.F.E.):** `slife@dlsu.edu.ph` (`AnimoPass123!`)
- **Accredited Organizer (Engineering College Government — ECG):** `ecg@dlsu.edu.ph` (`AnimoPass123!`)
- **Accredited Organizer (Business Management Society — BMS):** `bms@dlsu.edu.ph` (`AnimoPass123!`)

---

## 3. NPM Packages, Third-Party Libraries & Generative AI Disclosure

### NPM Packages & Front-End Libraries

- **express** — Web application server and modular routing framework (https://expressjs.com/).
- **hbs** — Express view engine for Handlebars templates, layouts, partials, and custom helpers (https://www.npmjs.com/package/hbs).
- **mongoose** — MongoDB Object Data Modeling (ODM) library for schemas, validation, and queries (https://mongoosejs.com/).
- **bcrypt** — Cryptographic password salting and hashing via Mongoose `pre('save')` hooks (https://www.npmjs.com/package/bcrypt).
- **express-session** — Server-side session management with `httpOnly` cookies (https://www.npmjs.com/package/express-session).
- **express-validator** — Server-side form validation and sanitization middleware (https://express-validator.github.io/).
- **dotenv** — Environment variable loader for database URI and session configuration (https://www.npmjs.com/package/dotenv).
- **Bootstrap 5.3.3** — Responsive layout grid, navigation bar, cards, dropdowns, and modals (https://getbootstrap.com/).

### Generative AI Use Disclosure

In compliance with the CBAPDEV course policy on Artificial Intelligence tools and the DLSU Policies on Generative AI in Higher Education, Group 4 declares the use of Google Gemini during project preparation for:

1. Brainstorming institutional demographic targeting rules and edge cases (such as grandfathered event registrations when a student updates their profile).
2. Auditing requirement coverage against the approved Phase 0 project proposal and course rubrics.
3. Debugging client-side and server-side filtering and date-handling edge cases.

All code, user interfaces, database schemas, controllers, sample datasets, and application logic were reviewed, tested, and validated by the group members to ensure full understanding and ownership.
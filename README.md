# AnimoEvents — DLSU Campus Events & Activities Hub

**Course:** CBAPDEV (Web Application Development), Section X21, Term 1, AY 2026–2027  
**Institution:** Department of Software Technology, College of Computer Studies, De La Salle University  
**Instructor:** Asst. Prof. Arren Matthew C. Antioquia (`arren.antioquia@dlsu.edu.ph`)

## Group 4 Members

- **Arron Baranquil** — Authentication, User Profile CRUD & Affiliation Management (`login.html`, `logout.html`, `register.html`, `profile.html`, `profile-edit.html`)
- **Laurence Benjamin Diaz** — Personalized Home Feed, Event Posts CRUD, Lifecycle Management & Discussion Threads (`index.html`, `event-details.html`, `event-create.html`, `event-edit.html`)
- **Alaine Carlo Magdaluyo** — Multi-Criteria Search & Filter Engine, RSVP Capacity Logic, Multi-Year Calendar & Organizers (`events.html`, `calendar.html`, `organizer.html`)
- **John Michael Sumilang** — Saved Event Bookmarks CRUD, Institutional Seed Dataset, Shared Layout Shell & Styling (`bookmarks.html`, `about.html`, `css/style.css`)

---

## 1. Running the Front-End Application (Phase 1 Static Prototype)

1. Extract `Project-X21-Group4.zip` into any local folder.
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari) via `file:///`.
3. Use the **Try another account** menu in the top-right navigation bar (or sign in via `login.html`) to test different user roles and campus affiliations:
   - **Undergraduate Student (CCS/ST Manila):** `miguel_tan@dlsu.edu.ph` (`AnimoPass123!`)
   - **Senior High School Student (SHS/STEM Manila):** `sophia_sy@dlsu.edu.ph` (`AnimoPass123!`)
   - **Graduate Student (CCS/IT Manila):** `hannah_reyes@dlsu.edu.ph` (`AnimoPass123!`)
   - **Faculty Member (CCS/ST Manila):** `rafael.cruz@dlsu.edu.ph` (`AnimoPass123!`)
   - **Laguna Graduate Student (GCOE/ECE Laguna):** `carlos_mendoza@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (LSCS):** `lscs@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (CIVI Research Center):** `civi@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (Office of Student L.I.F.E.):** `slife@dlsu.edu.ph` (`AnimoPass123!`)
4. Use the **Pages** dropdown menu in the top navigation bar to navigate between all 14 application views (`index.html`, `events.html`, `event-details.html`, `event-create.html`, `event-edit.html`, `bookmarks.html`, `calendar.html`, `organizer.html`, `profile.html`, `profile-edit.html`, `login.html`, `register.html`, `logout.html`, `about.html`).
5. To reset interactive changes back to the initial 14-user, 12-event, 18-bookmark dataset, click **Reset demo data** in the account dropdown menu.

---

## 2. Running via Local Node.js Server

1. Ensure **Node.js** (v18+) and **MongoDB Community Server** are installed.
2. Open a terminal in the project root directory and install dependencies:

   ```bash
   npm install
   ```

3. (Optional for Phase 2 database seeding) Populate the local MongoDB database (`mongodb://127.0.0.1:27017/animoevents`):

   ```bash
   npm run seed
   ```

4. Start the local server on port 3000:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

---

## 3. References & Generative AI Use Disclosure

### Third-Party Libraries & Frameworks

- **Bootstrap 5.3.3** — Responsive layout grid, navigation bar, cards, dropdowns, and modal components (`https://getbootstrap.com/`).
- **Node.js & Express** — Web server and routing environment (`https://expressjs.com/`).
- **MongoDB & Mongoose** — Document database and Object Data Modeling library (`https://mongoosejs.com/`).

### Generative AI Use Disclosure

In compliance with the CBAPDEV course policy on Artificial Intelligence tools and the DLSU Policies on Generative AI in Higher Education, Group 4 declares the use of **Google Gemini** during project preparation for:

1. Brainstorming institutional demographic targeting rules and edge cases (such as grandfathered event registrations when a student updates their profile).
2. Auditing requirement coverage against the approved Phase 0 project proposal and course rubrics.
3. Debugging client-side filtering and date-handling edge cases.

All code, user interfaces, sample datasets, and application logic were reviewed, tested, and validated by the group members to ensure full understanding and ownership.

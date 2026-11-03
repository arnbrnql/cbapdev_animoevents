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

## 1. Running the Front-End Application (Browser Version)

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
4. Use the **Pages** menu in the top navigation bar to move between the 14 views (`index.html`, `events.html`, `event-details.html`, `event-create.html`, `event-edit.html`, `bookmarks.html`, `calendar.html`, `organizer.html`, `profile.html`, `profile-edit.html`, `login.html`, `register.html`, `logout.html`, `about.html`).
5. To reset interactive changes back to the initial 14-user, 12-event, 18-bookmark dataset, choose **Reset demo data** from the account menu.

> **How demo state works:** The browser version stores sample state and demo credentials in `localStorage`, so the complete flow can be tested offline without a database server. If browser storage is blocked, the app will warn you that changes may not persist.

---

## 2. Running via Local Node.js Server

1. Ensure **Node.js** (v18+) is installed.
2. Open a terminal in the project root directory and install dependencies:
   ```bash
   npm install
   ```

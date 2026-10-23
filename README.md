# AnimoEvents — DLSU Campus Events

**Course:** CBAPDEV (Web Application Development), Section X21, Term 1, AY 2026–2027  
**Institution:** Department of Software Technology, College of Computer Studies, De La Salle University  
**Instructor:** Asst. Prof. Arren Matthew C. Antioquia (`arren.antioquia@dlsu.edu.ph`)

## Group 4 Members

- **Arron Baranquil** — Authentication, User Profile CRUD & Affiliation Management (`login`, `logout`, `register`, `profile`, `profile-edit`)
- **Laurence Benjamin Diaz** — Personalized Home Feed, Event Posts CRUD, Lifecycle Management & Discussion Threads (`index`, `event-details`, `event-create`, `event-edit`)
- **Alaine Carlo Magdaluyo** — Multi-Criteria Search & Filter Engine, RSVP Capacity Logic, Multi-Year Calendar & Organizers (`events`, `calendar`, `organizer`)
- **John Michael Sumilang** — Saved Event Bookmarks CRUD, Institutional Seed Dataset, Shared Layout Shell & Deployment (`bookmarks`, `about`)

---

## 1. Run the browser version

1. Extract `Project-X21-Group4.zip` into any local folder.
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Edge, Safari) via `file:///`.
3. Use the **Switch Sample DLSU Account** menu in the top-right navbar (or visit `login.html`) to test different user roles and affiliations:
   - **Undergraduate Student (CCS/ST Manila):** `miguel_tan@dlsu.edu.ph` (`AnimoPass123!`)
   - **Senior High School Student (SHS/STEM Manila):** `sophia_sy@dlsu.edu.ph` (`AnimoPass123!`)
   - **Graduate Student (CCS/IT Manila):** `hannah_reyes@dlsu.edu.ph` (`AnimoPass123!`)
   - **Faculty Member (CCS/ST Manila):** `rafael.cruz@dlsu.edu.ph` (`AnimoPass123!`)
   - **Laguna Graduate Student (GCOE/ECE Laguna):** `carlos_mendoza@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (LSCS):** `lscs@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (CIVI Research Center):** `civi@dlsu.edu.ph` (`AnimoPass123!`)
   - **Accredited Organizer (Office of Student L.I.F.E.):** `slife@dlsu.edu.ph` (`AnimoPass123!`)
4. Use the **Quick Page Jump** dropdown in the top navigation bar to access all 14 views in one click. To reset any interactive changes back to the initial 14-user, 12-event, 18-bookmark seed state, click **Reset Sample Data** inside the account dropdown.

> **Phase 1 authentication note:** The static prototype stores demo passwords in
> browser localStorage only so the sample login and registration flows can be
> demonstrated offline. This is intentionally not production authentication;
> Phase 2/3 must move credentials to the server and use password hashing.

---

## 2. Run the Node.js server

1. Ensure **Node.js** (v18+ or v20+) and **MongoDB Community Server** (`mongod` running on `mongodb://127.0.0.1:27017`) are installed and active.
2. Open a terminal in the project root directory and install all dependencies:
   ```bash
   npm install
   ```

The repository includes a small Express server that serves the browser version
and exposes a health endpoint:

```bash
npm start
```

The server exposes `GET /health` and serves the existing static application.
MongoDB is documented in `.env.example` but is not connected yet. The browser
version uses localStorage and sample credentials for demonstration only; it is
not a production authentication system.

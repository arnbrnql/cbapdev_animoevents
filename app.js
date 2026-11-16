require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const hbs = require("hbs");

const { connectDB } = require("./model/db");
const { ensureSeeded } = require("./model/seed");
const { loadCurrentUser } = require("./middleware/auth");

const authUserRoutes = require("./routes/authUserRoutes");
const eventRoutes = require("./routes/eventRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

app.set("trust proxy", 1);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.set("view options", { layout: "layouts/main" });
hbs.registerPartials(path.join(__dirname, "views/partials"));

hbs.registerHelper("eq", function (a, b) {
  return String(a) === String(b);
});
hbs.registerHelper("neq", function (a, b) {
  return String(a) !== String(b);
});
hbs.registerHelper("includes", function (arr, val) {
  if (!Array.isArray(arr)) return false;
  return arr.some(function (item) {
    return String(item) === String(val);
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "animoevents-dlsu-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// Serve static assets from public/ and shared constants from model/constants.js
app.use(express.static(path.join(__dirname, "public")));
app.get("/model/constants.js", function (req, res) {
  res.sendFile(path.join(__dirname, "model", "constants.js"));
});

// Load active user from session (or default demo account in Phase 2)
app.use(loadCurrentUser);

// Mount modular MVC routes
app.use("/", authUserRoutes);
app.use("/", discoveryRoutes);
app.use("/", bookmarkRoutes);
app.use("/", eventRoutes);

// 404 handler
app.use(function (req, res) {
  res.status(404).render("error", {
    title: "Page Not Found — AnimoEvents",
    message: "The page you requested (" + req.originalUrl + ") does not exist.",
  });
});

// Error handler
app.use(function (err, req, res, next) {
  console.error("Server error:", err);
  res.status(500).render("error", {
    title: "Server Error — AnimoEvents",
    message: err.message || "An unexpected error occurred on the server.",
  });
});

async function startServer() {
  try {
    await connectDB();
    await ensureSeeded();
    app.listen(port, function () {
      console.log("AnimoEvents server listening on http://localhost:" + port);
    });
  } catch (err) {
    console.error("Failed to start AnimoEvents server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
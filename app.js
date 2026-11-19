require("dotenv").config();

const path = require("path");
const { randomBytes } = require("crypto");
const express = require("express");
const session = require("express-session");
const hbs = require("hbs");

const { connectDB, isLocalDemoDatabase } = require("./model/db");
const User = require("./model/User");
const Bookmark = require("./model/Bookmark");
const { loadCurrentUser } = require("./middleware/auth");

const authUserRoutes = require("./routes/authUserRoutes");
const eventRoutes = require("./routes/eventRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);
const production = process.env.NODE_ENV === "production";
const demoMode =
  process.env.NODE_ENV === "development" &&
  process.env.DEMO_MODE === "true" &&
  isLocalDemoDatabase();
const host = demoMode ? "127.0.0.1" : process.env.HOST || "127.0.0.1";
const sessionSecret = process.env.SESSION_SECRET?.trim();

if (production && !sessionSecret) {
  throw new Error("Set SESSION_SECRET before starting in production.");
}
if (production) app.set("trust proxy", 1);
app.locals.demoMode = demoMode;
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
    secret: sessionSecret || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// Serve static assets from public/ and shared constants from model/constants.js
app.use(express.static(path.join(__dirname, "public")));
app.get("/vendor/bootstrap.min.css", function (req, res) {
  res.sendFile(require.resolve("bootstrap/dist/css/bootstrap.min.css"));
});
app.get("/vendor/bootstrap.bundle.min.js", function (req, res) {
  res.sendFile(require.resolve("bootstrap/dist/js/bootstrap.bundle.min.js"));
});
app.get("/model/constants.js", function (req, res) {
  res.sendFile(path.join(__dirname, "model", "constants.js"));
});

// Load the signed-in user from the session.
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
    message: "The requested page could not be found.",
  });
});

// Error handler
app.use(function (err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.status === 400 || err.status === 413) {
    return res.status(err.status).render("error", {
      title: "Invalid Request — AnimoEvents",
      message: err.status === 413 ? "The submitted form is too large." : "The request could not be read.",
    });
  }
  console.error("AnimoEvents could not process a request.");
  res.status(500).render("error", {
    title: "Server Error — AnimoEvents",
    message: "An unexpected error occurred. Please try again.",
  });
});

async function startServer() {
  try {
    await connectDB();
    await Promise.all([User.init(), Bookmark.init()]);
    const server = app.listen(port, host, function () {
      console.log("AnimoEvents server listening on http://localhost:" + port);
    });
    server.on("error", function () {
      console.error("AnimoEvents could not listen on the configured host and port.");
      process.exit(1);
    });
  } catch (err) {
    console.error("AnimoEvents could not prepare MongoDB. Check the connection settings and ensure there are no duplicate users or bookmarks.");
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;

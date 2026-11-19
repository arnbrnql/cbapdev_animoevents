/**
 * Database Seeder (model/seed.js)
 * Run npm run seed -- --check to check the demo database before loading fixtures.
 */
const {
  connectDB,
  disconnectDB,
  localDemoDatabaseProblem,
} = require("./db");

const DEMO_PASSWORD = "AnimoPass123!";
const SEED_MARKER_COLLECTION = "demo_seed_runs";
const OCCUPIED_MESSAGE =
  "The demo database already contains data. Use a fresh demo database name before retrying.";

class SeedError extends Error {}

function normalizeAvatarPath(rawPath) {
  if (!rawPath) return "/images/avatar-u1.svg";
  return String(rawPath).replace(/^\.\//, "/");
}

function checkSeedConfiguration(showStatus) {
  const checks = {
    NODE_ENV: process.env.NODE_ENV === "development" ? null : "Set to development.",
    DEMO_MODE: process.env.DEMO_MODE === "true" ? null : "Set to true.",
    MONGODB_URI: localDemoDatabaseProblem(),
  };
  const entries = Object.entries(checks);
  const failed = entries.some(function ([, problem]) {
    return problem !== null;
  });
  if (failed || showStatus) {
    for (const [name, problem] of entries) {
      console.log(problem ? `Fix ${name}: ${problem}` : `OK ${name}`);
    }
  }
  if (failed) {
    throw new SeedError(
      "Check .env and any terminal environment variables. Terminal settings take precedence.",
    );
  }
}

async function connectEmptyDemoDatabase(showStatus) {
  checkSeedConfiguration(showStatus);

  let connection;
  try {
    connection = await connectDB({
      directConnection: true,
      autoCreate: false,
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });
  } catch {
    throw new SeedError(
      "Could not connect to the local MongoDB server. Confirm MongoDB is running and the configured port is correct.",
    );
  }

  const db = connection.db;
  let populated;
  try {
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    populated = await Promise.all(
      collections.map(({ name }) =>
        db.collection(name).findOne({}, { projection: { _id: 1 } }),
      ),
    );
  } catch {
    throw new SeedError(
      "Could not confirm that the demo database is empty. Check local database access.",
    );
  }
  if (populated.some(Boolean)) throw new SeedError(OCCUPIED_MESSAGE);
  return db;
}

async function seedDatabase(db) {
  const User = require("./User");
  const Event = require("./Event");
  const Bookmark = require("./Bookmark");
  const { usersData, eventsData, bookmarksData } = require("./seedData");

  // A unique marker prevents two seed processes from writing fixtures together.
  try {
    await db.collection(SEED_MARKER_COLLECTION).insertOne({ _id: "initial-seed" });
  } catch (err) {
    if (err.code === 11000) throw new SeedError(OCCUPIED_MESSAGE);
    throw err;
  }

  await User.createIndexes();
  await Bookmark.createIndexes();

  // 1. Seed 14 Users via .save() so userSchema.pre('save') hashes passwords with bcrypt
  const userMap = {};
  for (let i = 0; i < usersData.length; i++) {
    const u = usersData[i];
    const userDoc = new User({
      displayName: u.displayName,
      email: u.email,
      password: u.password || DEMO_PASSWORD,
      role: u.role,
      academicLevel: u.role === "Student" ? u.academicLevel : "N/A",
      college: u.college,
      department: u.department,
      campus: u.campus,
      bio: u.bio || "",
      profilePic: normalizeAvatarPath(u.profilePic),
      createdAt: new Date("2026-10-01T09:00:00+08:00"),
    });
    const savedUser = await userDoc.save();
    userMap[u.id] = savedUser;
  }

  // 2. Seed 12 Events with resolved ObjectIds and organizerName
  const eventMap = {};
  for (let i = 0; i < eventsData.length; i++) {
    const ev = eventsData[i];
    const organizerDoc = userMap[ev.organizer];
    if (!organizerDoc) {
      throw new Error(
        `Unknown organizer seed ID "${ev.organizer}" on event "${ev.id}"`,
      );
    }

    const attendeeObjectIds = (ev.attendees || []).map(function (seedUserId) {
      const attDoc = userMap[seedUserId];
      if (!attDoc) {
        throw new Error(
          `Unknown attendee seed ID "${seedUserId}" on event "${ev.id}"`,
        );
      }
      return attDoc._id;
    });

    const mappedUpdates = (ev.updates || []).map(function (upd) {
      const authorDoc = userMap[upd.author];
      if (!authorDoc) {
        throw new Error(
          `Unknown update author seed ID "${upd.author}" on event "${ev.id}"`,
        );
      }
      return {
        author: authorDoc._id,
        authorName: upd.authorName || authorDoc.displayName,
        authorRole: upd.authorRole || authorDoc.role,
        content: upd.content,
        isOfficialUpdate: Boolean(upd.isOfficialUpdate),
        postedAt: upd.postedAt,
      };
    });

    const savedEvent = await Event.create({
      title: ev.title,
      category: ev.category,
      date: ev.date,
      time: ev.time,
      endTime: ev.endTime || "",
      venue: ev.venue,
      description: ev.description,
      organizer: organizerDoc._id,
      organizerName: ev.organizerName || organizerDoc.displayName,
      isPublic: Boolean(ev.isPublic),
      targetRoles: ev.targetRoles || [],
      targetAcademicLevels: ev.targetAcademicLevels || [],
      targetColleges: ev.targetColleges || [],
      targetDepartments: ev.targetDepartments || [],
      targetCampuses: ev.targetCampuses || [],
      status: ev.status || "Open",
      maxCapacity: ev.maxCapacity,
      attendees: attendeeObjectIds,
      updates: mappedUpdates,
      createdAt: new Date(ev.createdAt),
    });

    eventMap[ev.id] = savedEvent;
  }

  // 3. Seed 18 Bookmarks with resolved user and event ObjectIds
  for (let i = 0; i < bookmarksData.length; i++) {
    const bm = bookmarksData[i];
    const userDoc = userMap[bm.user];
    const eventDoc = eventMap[bm.event];
    if (!userDoc || !eventDoc) {
      throw new Error(
        `Invalid bookmark mapping for user "${bm.user}" and event "${bm.event}"`,
      );
    }

    await Bookmark.create({
      user: userDoc._id,
      event: eventDoc._id,
      personalNote: bm.personalNote || "",
      createdAt: bm.createdAt,
    });
  }

  console.log(
    `Seed complete: ${Object.keys(userMap).length} users, ${
      Object.keys(eventMap).length
    } events, ${bookmarksData.length} bookmarks.`,
  );
}

async function runSeed(args) {
  const checkOnly = args.length === 1 && args[0] === "--check";
  if (args.length && !checkOnly) {
    console.error("Usage: npm run seed [-- --check]");
    process.exitCode = 2;
    return;
  }

  try {
    const db = await connectEmptyDemoDatabase(checkOnly);
    if (checkOnly) {
      console.log("The demo database is empty and ready. No data written.");
      return;
    }
    await seedDatabase(db);
  } catch (err) {
    const message =
      err instanceof SeedError
        ? err.message
        : "The seed did not finish. Choose a fresh demo database name before retrying.";
    console.error("Database seed failed: " + message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runSeed(process.argv.slice(2)).catch(function () {
    console.error("Could not close the seed database connection.");
    process.exitCode = 1;
  });
}

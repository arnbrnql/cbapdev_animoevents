/**
 * Database Seeder (model/seed.js)
 * Usage: npm run seed   OR   node model/seed.js
 */
require("dotenv").config();
const {
  connectDB,
  disconnectDB,
  isLocalDemoDatabase,
} = require("./db");
const User = require("./User");
const Event = require("./Event");
const Bookmark = require("./Bookmark");
const { usersData, eventsData, bookmarksData } = require("./seedData");

const DEMO_PASSWORD = "AnimoPass123!";
const SEED_MARKER_COLLECTION = "demo_seed_runs";

class SeedError extends Error {}

function normalizeAvatarPath(rawPath) {
  if (!rawPath) return "/images/avatar-u1.svg";
  return String(rawPath).replace(/^\.\//, "/");
}

async function prepareDemoDatabase() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.DEMO_MODE !== "true" ||
    !isLocalDemoDatabase()
  ) {
    throw new SeedError(
      "Seeding requires NODE_ENV=development, DEMO_MODE=true, and a loopback MongoDB URI for animoevents_demo or animoevents_demo_<suffix>.",
    );
  }

  const connection = await connectDB({
    directConnection: true,
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });
  const db = connection.db;
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const populated = await Promise.all(
    collections.map(({ name }) =>
      db.collection(name).findOne({}, { projection: { _id: 1 } }),
    ),
  );

  const occupiedMessage =
    "The demo database already contains data. Choose a new demo database name and try again.";
  if (populated.some(Boolean)) throw new SeedError(occupiedMessage);

  // A unique marker prevents two seed processes from writing fixtures together.
  try {
    await db.collection(SEED_MARKER_COLLECTION).insertOne({ _id: "initial-seed" });
  } catch (err) {
    if (err.code === 11000) throw new SeedError(occupiedMessage);
    throw err;
  }

  await User.createIndexes();
  await Bookmark.createIndexes();
}

async function seedDatabase() {
  await prepareDemoDatabase();

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

async function runSeed() {
  try {
    await seedDatabase();
  } catch (err) {
    const message =
      err instanceof SeedError
        ? err.message
        : "Check that MongoDB is running. If seed data was written before the failure, choose a new demo database name.";
    console.error("Database seed failed: " + message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runSeed().catch(function () {
    console.error("Could not close the seed database connection.");
    process.exitCode = 1;
  });
}

/**
 * Standalone Database Seeder (model/seed.js)
 * Usage: npm run seed   OR   node model/seed.js
 */
require("dotenv").config();
const { connectDB, disconnectDB } = require("./db");
const User = require("./User");
const Event = require("./Event");
const Bookmark = require("./Bookmark");
const { usersData, eventsData, bookmarksData } = require("./seedData");

const DEMO_PASSWORD = "AnimoPass123!";

function normalizeAvatarPath(rawPath) {
  if (!rawPath) return "/images/avatar-u1.svg";
  return String(rawPath).replace(/^\.\//, "/");
}

async function seedDatabase() {
  await connectDB();

  await Bookmark.deleteMany({});
  await Event.deleteMany({});
  await User.deleteMany({});

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
    });
    const savedUser = await userDoc.save();
    userMap[u.id] = savedUser;
  }

  // 2. Seed 12 Events with resolved ObjectIds and organizerName
  const eventMap = {};
  const baseTime = Date.now();
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
      // Stagger createdAt so e1 is newest and e12 is oldest when sorted by Most Recent
      createdAt: new Date(baseTime - i * 60000),
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
      createdAt: bm.createdAt || "2026-10-20",
    });
  }

  console.log(
    `Seed complete: ${Object.keys(userMap).length} users, ${
      Object.keys(eventMap).length
    } events, ${bookmarksData.length} bookmarks.`,
  );
}

if (require.main === module) {
  seedDatabase()
    .then(function () {
      return disconnectDB();
    })
    .catch(function (err) {
      console.error("Database seed failed:", err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };

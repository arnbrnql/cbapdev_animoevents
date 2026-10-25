/**
 * Bookmark Mongoose Schema & Model (model/Bookmark.js)
 * Enforces one bookmark per (user, event) pair and optional personal notes (0-250 chars).
 */
const mongoose = require("mongoose");

function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  personalNote: {
    type: String,
    default: "",
    trim: true,
    maxlength: 250,
  },
  createdAt: {
    type: String,
    default: getTodayDateStr,
  },
});

bookmarkSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);

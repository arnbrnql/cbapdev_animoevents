/**
 * Bookmark Mongoose Schema & Model (model/Bookmark.js)
 * Enforces one bookmark per (user, event) pair and optional personal notes (0-250 chars).
 */
const mongoose = require("mongoose");

const { getManilaDate } = require("./manilaTime");

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
    default: function () { return getManilaDate(); },
  },
});

bookmarkSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);

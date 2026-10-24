/**
 * User Mongoose Schema & Model (model/User.js)
 * Enforces DLSU institutional affiliation rules and bcrypt password hashing.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const {
  ROLES,
  ACADEMIC_LEVELS,
  COLLEGE_CODES,
  ALL_DEPARTMENT_CODES,
  CAMPUSES,
} = require("./constants");

const SALT_WORK_FACTOR = 10;

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 60,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@dlsu\.edu\.ph$/i,
      "Please provide a valid @dlsu.edu.ph email address.",
    ],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ROLES,
    required: true,
  },
  academicLevel: {
    type: String,
    enum: ACADEMIC_LEVELS,
    default: "N/A",
    required: true,
  },
  college: {
    type: String,
    enum: COLLEGE_CODES,
    required: true,
  },
  department: {
    type: String,
    enum: ALL_DEPARTMENT_CODES,
    default: "N/A",
    required: true,
  },
  campus: {
    type: String,
    enum: CAMPUSES,
    required: true,
  },
  bio: {
    type: String,
    default: "",
    trim: true,
    maxlength: 300,
  },
  profilePic: {
    type: String,
    default: "/images/avatar-u1.svg",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (hashErr, hash) {
      if (hashErr) return next(hashErr);
      user.password = hash;
      next();
    });
  });
});

userSchema.method("comparePassword", function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
});

module.exports = mongoose.model("User", userSchema);

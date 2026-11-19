/**
 * Mongoose Connection Manager (model/db.js)
 * Connects to local MongoDB or MongoDB Atlas via MONGODB_URI.
 */
require("dotenv").config();
const mongoose = require("mongoose");

const DEFAULT_URI = "mongodb://127.0.0.1:27017/animoevents";

function getMongoUri() {
  return process.env.MONGODB_URI || DEFAULT_URI;
}

function isLocalDemoDatabase() {
  try {
    const uri = new URL(getMongoUri());
    return (
      uri.protocol === "mongodb:" &&
      ["127.0.0.1", "[::1]", "localhost"].includes(uri.hostname) &&
      /^\/animoevents_demo(?:_[a-z0-9_]+)?$/.test(uri.pathname) &&
      !uri.username &&
      !uri.password &&
      !uri.search &&
      !uri.hash
    );
  } catch {
    return false;
  }
}

async function connectDB(options) {
  const uri = getMongoUri();
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri, options);
  console.log("Connected to MongoDB.");
  return mongoose.connection;
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("Closed MongoDB connection.");
  }
}

module.exports = {
  getMongoUri,
  isLocalDemoDatabase,
  connectDB,
  disconnectDB,
};
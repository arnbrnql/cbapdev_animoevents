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

function localDemoDatabaseProblem(uriValue = process.env.MONGODB_URI) {
  if (!uriValue) return "Set a local demo MongoDB URI in .env or the terminal.";
  let uri;
  try {
    uri = new URL(uriValue);
  } catch {
    return "Enter a valid single-host MongoDB URI.";
  }

  if (uri.protocol !== "mongodb:") return "Use the mongodb:// scheme.";
  if (!["127.0.0.1", "[::1]", "localhost"].includes(uri.hostname)) {
    return "Use a loopback host such as 127.0.0.1.";
  }
  if (!/^\/animoevents_demo(?:_[a-z0-9_]+)?$/.test(uri.pathname)) {
    return "Name the database animoevents_demo or animoevents_demo_<suffix>.";
  }
  if (uri.username || uri.password || uri.search || uri.hash) {
    return "Use a local URI without credentials, query options, or fragments.";
  }
  return null;
}

function isLocalDemoDatabase() {
  return localDemoDatabaseProblem() === null;
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
  localDemoDatabaseProblem,
  connectDB,
  disconnectDB,
};
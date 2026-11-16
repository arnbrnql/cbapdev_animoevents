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

async function connectDB() {
  const uri = getMongoUri();
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB:", uri);
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
  connectDB,
  disconnectDB,
};
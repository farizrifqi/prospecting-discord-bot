const mongoose = require("mongoose");
const Config = require("../config.json");
const { mongoUri } = Config;
async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = { connectDB };

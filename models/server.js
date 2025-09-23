const mongoose = require("mongoose");

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  name: String,
  whitelisted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Server", serverSchema);

const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },
  notifyChannelId: { type: String, default: "" },

  mentionRole: {
    type: String,
    enum: ["everyone", "here", "none"],
    default: "none",
  },

  enabled: { type: Boolean, default: true },
});

module.exports = mongoose.model("Merchant", merchantSchema);

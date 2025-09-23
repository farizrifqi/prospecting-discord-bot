const mongoose = require("mongoose");

const voidNotificationSchema = new mongoose.Schema({
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },
  channelId: { type: String, default: "" },
  enabled: { type: Boolean, default: true },
});

module.exports = mongoose.model("VoidNotification", voidNotificationSchema);

const mongoose = require("mongoose");
const eventListData = require("../data/globalEvent.json");
const eventList = Object.keys(eventListData);
const globalEventSchema = new mongoose.Schema({
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
    required: true,
  },
  channelId: { type: String, required: true },
  events: [
    {
      type: String,
      enum: eventList,
    },
  ],
  enabled: { type: Boolean, default: true },
  mentionRole: {
    type: String,
    enum: ["everyone", "here", "none"],
    default: "none",
  },
});

module.exports = mongoose.model("GlobalEvent", globalEventSchema);

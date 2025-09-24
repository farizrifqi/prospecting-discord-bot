const Server = require("../models/server");

module.exports = {
  name: "guildCreate",
  async execute(guild) {
    let server = await Server.findOne({ guildId: guild.id });
    if (!server) {
      server = await Server.create({
        guildId: guild.id,
        name: guild.name,
        membersCount: guild.memberCount ?? 0,
      });
      console.log(`✅ Added new server: ${guild.name} (${guild.id})`);
    } else {
      console.log(`ℹ️ Server already exists: ${guild.name}`);
    }
  },
};

const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config.json");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  cooldown: 15,

  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get bot help"),
  async execute(interaction) {
    try {
      const replyMsg = await interaction.reply(
        "# FAQ\n**Q**: Is it safe?\n**A**: ***100% SAFE**, BUT STILL **DYOR** THIS BOT DO NOT USE ANY EXPLOITS OR IN-GAME INJECTION*.\n\n**Q**: Why am I getting **524** Error?\n**A:** You're trying to join a _**private server**_.\n\n**Q:** Why when I clicked join server its open a web?\n**A:** Because Discord doesn't support `roblox://` protocols, thats why its redirecting thru `priv8.zeranel.dev`.\n\n-\n\n**Common Problem:**\n- Long queue\n- Private server\n- Ended experiences.\n\nInvite links:\n```txt\nhttps://discord.com/oauth2/authorize?client_id=" +
          config.clientId +
          "&permissions=8&integration_type=0&scope=applications.commands+bot```"
      );
      await wait(60_000);
      replyMsg.delete();
    } catch {}
  },
};

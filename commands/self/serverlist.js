const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Server = require("../../models/server");
const config = require("../../config.json");

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("serverlist")
    .setDescription("Show serverlist"),

  async execute(interaction) {
    try {
      const user = interaction.user;
      const guild = interaction.guild;

      if (user.id != config.ownerId || guild.id != config.guildId) {
        return;
      }
      await interaction.deferReply();
      const serverList = await Server.find();
      const total = serverList.length;
      const whitelisted = serverList.filter((sv) => sv.whitelisted).length;
      const unwhitelisted = serverList.filter((sv) => !sv.whitelisted).length;
      if (serverList) {
        await interaction.editReply({
          content: `Total servers: ${total}\n\nWhitelisted: ${whitelisted}\nUnwhitelisted: ${unwhitelisted}`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.editReply({
          content: `Unable to get serverlist`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      console.error(`Unknown error while unwhitelisting`, err);
    }
  },
};

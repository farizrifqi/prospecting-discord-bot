const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  cooldown: 15,

  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  async execute(interaction) {
    await interaction.reply("Pong!");
  },
};

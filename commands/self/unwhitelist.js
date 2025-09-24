const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Server = require("../../models/server");
const config = require("../../config.json");

module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("unwhitelist")
    .setDescription("Remove a server from whitelist")
    .addStringOption((option) =>
      option
        .setName("guildid")
        .setDescription("Guild or server id")
        .setRequired(true)
    ),
  async execute(interaction) {
    try {
      const user = interaction.user;
      const guild = interaction.guild;

      if (user.id != config.ownerId || guild.id != config.guildId) {
        return;
      }
      await interaction.deferReply();
      const inputGuildId = interaction.options.getString("guildid");
      if (inputGuildId == config.guildId) {
        await interaction.editReply({
          content: `Unable to remove whitelist your own guild.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const guildCache = interaction.client.guilds.cache.get(inputGuildId);
      if (guildCache) {
        const serverUpdate = await Server.findOneAndUpdate(
          { guildId: guildCache.id },
          { guildId: guildCache.id, name: guildCache.name, whitelisted: false },
          { new: true, upsert: true }
        );
        if (serverUpdate) {
          await interaction.editReply({
            content: `✅ Server ${guildCache.name} \`${inputGuildId}\` successfully **Unwhitelisted**.`,
            flags: MessageFlags.Ephemeral,
          });
          const owner = await interaction.client.users.fetch(
            guildCache.ownerId
          );
          if (owner) {
            owner
              .send(
                `Your server **${guildCache.name}** has been removed from whitelist. Your server no longer can receive notifications.`
              )
              .catch((e) => {
                console.error(`Unable to send DM to ${owner.tag}`, e);
              });
          } else {
            console.log("Unable to fetch owner for guild " + guildCache.id);
          }
        } else {
          await interaction.editReply({
            content: `Unable to update guild ${inputGuildId}`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } else {
        await interaction.editReply({
          content: `Unable to get guild ${inputGuildId}`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      console.error(`Unknown error while unwhitelisting`, err);
    }
  },
};

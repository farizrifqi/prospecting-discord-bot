const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const Server = require("../../models/server");
const VoidS = require("../../models/voidNotification");
const MerchantS = require("../../models/merchant");
const config = require("../../config.json");
module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Get info of a server")
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
      const guildCache = interaction.client.guilds.cache.get(inputGuildId);
      if (guildCache) {
        const serverInfo = await Server.findOne({ guildId: guildCache.id });
        if (serverInfo) {
          let content = [];
          content.push(`Server ID: \`${guildCache.id}\``);
          content.push(`Join date: \`${serverInfo.createdAt}\`\n`);
          content.push(`Server Name: \`${guildCache.name}\``);
          content.push(
            `Whitelisted: \`${serverInfo.whitelisted ? "✅" : "❌"}\`\n`
          );
          const voidInfo = await VoidS.findOne({ serverId: serverInfo._id });
          if (voidInfo) {
            content.push(
              `Void Channel: <#${voidInfo.channelId}> (${voidInfo.channelId})`
            );
          }
          const merchantInfo = await MerchantS.findOne({
            serverId: serverInfo._id,
          });
          if (merchantInfo) {
            content.push(
              `Merchant Channel: <#${merchantInfo.notifyChannelId}> (${merchantInfo.notifyChannelId})`
            );
            content.push(`Merchant mention: ${merchantInfo.mentionRole}`);
          }

          await interaction.editReply({
            content: content.join("\n"),
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.editReply({
            content: `Unable to get guild from servers.`,
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
      console.error(`Unknown error while whitelisting`, err);
    }
  },
};

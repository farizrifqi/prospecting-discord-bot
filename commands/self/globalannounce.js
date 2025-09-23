const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const config = require("../../config.json");
const Server = require("../../models/server");
const VoidS = require("../../models/voidNotification");
const MerchantS = require("../../models/merchant");
const embedForAnnounce = (guildName, message) => {
  const exampleEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle("📢 Global Announcement")
    .setDescription(`To: ${guildName}`)
    .addFields({ name: "Message", value: message });
  return exampleEmbed;
};
module.exports = {
  cooldown: 1,
  data: new SlashCommandBuilder()
    .setName("globalannounce")
    .setDescription("Get info of a server")

    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Select target announce.")
        .setRequired(true)
        .addChoices(
          { name: "Void", value: "void" },
          { name: "Merchant", value: "merchant" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message to announce")
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
      const selectedType = interaction.options.getString("category");
      const message = interaction.options.getString("message");
      if (selectedType == "void") {
        const listVoidsData = await VoidS.find({
          enabled: true,
          channelId: { $ne: "" },
        }).populate("serverId");
        const listVoids = listVoidsData
          .filter((v) => v.serverId.whitelisted)
          .map((v) => `${v.serverId.guildId}:${v.channelId}`);
        let successVoids = 0;
        for await (const gv of listVoids) {
          const [guildId, channelId] = gv.split(":");
          const guildCache = interaction.client.guilds.cache.get(guildId);
          if (guildCache) {
            const botMember = guildCache.members.me; // the bot’s GuildMember

            const channelCache = guildCache.channels.cache.get(channelId);

            if (channelCache) {
              const perms = channelCache.permissionsFor(botMember);

              if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                  const announceEmbed = embedForAnnounce(
                    guildCache.name,
                    message
                  );
                  channelCache.send({
                    content: "@here",
                    embeds: [announceEmbed],
                  });
                  successVoids++;
                } catch (err) {
                  console.log(
                    `Err while sending announcement to #${channelCache.name} on ${guildCache.name}`,
                    err
                  );
                }
              } else {
                console.log(
                  `❌ Bot has no permission to send messages in #${channelCache.name}`
                );
              }
            } else {
              console.log(
                `Channel cache ${channelCache.id} on ${guildCache.name} not found.`
              );
            }
          } else {
            console.log(`Guild cache ${guildCache.id} not found.`);
          }
        }
        console.log(`Success sending to ${successVoids} void channels`);
        await interaction.editReply({
          content: `✅ Successfully sent ${selectedType} announcement to ${successVoids}/${listVoids.length} channels.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      if (selectedType == "merchant") {
        const listVoidsData = await MerchantS.find({
          enabled: true,
          channelId: { $ne: "" },
        }).populate("serverId");
        const listVoids = listVoidsData
          .filter((v) => v.serverId.whitelisted)
          .map((v) => `${v.serverId.guildId}:${v.notifyChannelId}`);
        let successVoids = 0;
        for await (const gv of listVoids) {
          const [guildId, channelId] = gv.split(":");
          const guildCache = interaction.client.guilds.cache.get(guildId);
          if (guildCache) {
            const botMember = guildCache.members.me; // the bot’s GuildMember

            const channelCache = guildCache.channels.cache.get(channelId);

            if (channelCache) {
              const perms = channelCache.permissionsFor(botMember);

              if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                  const announceEmbed = embedForAnnounce(
                    guildCache.name,
                    message
                  );
                  channelCache.send({
                    content: "@here",
                    embeds: [announceEmbed],
                  });
                  successVoids++;
                } catch (err) {
                  console.log(
                    `Err while sending announcement to #${channelCache.name} on ${guildCache.name}`,
                    err
                  );
                }
              } else {
                console.log(
                  `❌ Bot has no permission to send messages in #${channelCache.name}`
                );
              }
            } else {
              console.log(
                `Channel cache ${channelCache.id} on ${guildCache.name} not found.`
              );
            }
          } else {
            console.log(`Guild cache ${guildCache.id} not found.`);
          }
        }
        console.log(`Success sending to ${successVoids} void channels`);
        await interaction.editReply({
          content: `✅ Successfully sent ${selectedType} announcement to ${successVoids}/${listVoids.length} channels.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      console.error(`Unknown error while whitelisting`, err);
    }
  },
};

const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const {
  SlashCommandBuilder,

  ChannelSelectMenuBuilder,
  ContainerBuilder,
  ButtonStyle,
  MessageFlags,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const globalEventList = require("../../data/globalEvent.json");
const GlobalEvent = require("../../models/globalEvent");
const Merchant = require("../../models/merchant");
const VoidNotification = require("../../models/voidNotification");
const Server = require("../../models/server");
const config = require("../../config.json");

const options = {
  ownerOnly: true,
};
const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Config for the bots")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Select configuration type")
      .addChoices(
        { name: "Void", value: "void" },
        { name: "Merchant", value: "merchant" },
        { name: "Global Event", value: "globalevent" }
      )
  );

const deployGlobalContainer = async (choices, interaction, server) => {
  const resultContainer = [];
  const guild = interaction.guild;
  /**
   *
   *  Merchant
   *
   */
  if (choices === "merchant" || choices === "all") {
    const merchants = await Merchant.findOne({ serverId: server._id });
    const channelMerchant = guild.channels.cache.get(
      merchants ? merchants.notifyChannelId : 0
    );
    const merchantChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("merchantSelect")
      .setPlaceholder("Select channel")
      .setChannelTypes(ChannelType.GuildText);
    if (channelMerchant) {
      merchantChannelSelect.setDefaultChannels(channelMerchant.id);
    }
    const merchantContainer = new ContainerBuilder()
      .setAccentColor(0x8d6000)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## Merchant")
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(
                merchants?.enabled
                  ? "toggle_merchant_off"
                  : "toggle_merchant_on"
              )
              .setLabel(!merchants?.enabled ? "Enable" : "Disable")
              .setStyle(
                !merchants?.enabled
                  ? ButtonStyle.Primary
                  : ButtonStyle.Secondary
              )
          )
      )

      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(merchantChannelSelect)
      )

      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## Rules")
      )
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "### Send Rules\n*Only send message if any of item listed below is on stock.*\n\n**List Items**:\n- Meteor Fragment\n- Void Shard\n- Perfect Reforge Token\n- Traveler's Backpack - 1B Money\n- Cosmic Enchant Book - 10B Money\n- Prismatic Enchant Book - 20B Money"
        )
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "### Mention Rules\n*Will tag selection role if any of item listed below is on stock.*\n\n**List Items:**\n- Perfect Reforge Token - 50B Money\n- Void Shard - 50B Money\n- Meteor Fragment - 5B Money"
        )
      )
      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("roleListMentionRule")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("@everyone")
                .setDescription("Mention all user that can view this channel.")
                .setValue("everyone")
                .setDefault(merchants?.mentionRole == "everyone"),
              new StringSelectMenuOptionBuilder()
                .setLabel("@here")
                .setDescription(
                  "Mention all online user that can view this channel."
                )
                .setValue("here")
                .setDefault(merchants?.mentionRole == "here"),
              new StringSelectMenuOptionBuilder()
                .setLabel("none")
                .setDescription("Disable mention.")
                .setValue("none")
                .setDefault(merchants?.mentionRole == "none")
            )
        )
      );
    resultContainer.push(merchantContainer);
  }
  /**
   * Void
   */
  if (choices === "void" || choices === "all") {
    const voidData = await VoidNotification.findOne({ serverId: server._id });

    const channelVoid = guild.channels.cache.get(
      voidData ? voidData.channelId : 0
    );
    const voidChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("voidSelect")
      .setPlaceholder("Select channel")
      .setChannelTypes(ChannelType.GuildText);
    if (channelVoid) {
      voidChannelSelect.setDefaultChannels(channelVoid.id);
    }

    const voidContainer = new ContainerBuilder()
      .setAccentColor(0x2c0049)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## Void")
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(
                voidData?.enabled ? "toggle_void_off" : "toggle_void_on"
              )
              .setLabel(!voidData?.enabled ? "Enable" : "Disable")
              .setStyle(
                !voidData?.enabled ? ButtonStyle.Primary : ButtonStyle.Secondary
              )
          )
      )

      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(voidChannelSelect)
      )
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "***Note:**Notification be sent no matter it was a private server or ended server.*"
        )
      );
    resultContainer.push(voidContainer);
  }
  /**
   *
   *  Merchant
   *
   */
  if (choices === "globalevent" || choices === "all") {
    const globalEvents = await GlobalEvent.findOne({ serverId: server._id });
    const channelEvent = guild.channels.cache.get(
      globalEvents ? globalEvents.channelId : 0
    );
    const merchantChannelSelect = new ChannelSelectMenuBuilder()
      .setCustomId("globalEventSelect")
      .setPlaceholder("Select channel")
      .setChannelTypes(ChannelType.GuildText);
    if (channelEvent) {
      merchantChannelSelect.setDefaultChannels(channelEvent.id);
    }
    const merchantContainer = new ContainerBuilder()
      .setAccentColor(0x8d6000)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent("## Global Event")
          )
          .setButtonAccessory((button) =>
            button
              .setCustomId(
                globalEvents?.enabled ? "toggle_global_off" : "toggle_global_on"
              )
              .setLabel(!globalEvents?.enabled ? "Enable" : "Disable")
              .setStyle(
                !globalEvents?.enabled
                  ? ButtonStyle.Primary
                  : ButtonStyle.Secondary
              )
          )
      )

      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(merchantChannelSelect)
      )

      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent("## Rules")
      )
      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("eventList")
            .addOptions(
              Object.keys(globalEventList).map((ev) => ({
                value: ev,
                label: globalEventList[ev],
                default: globalEvents?.events.includes(ev),
              }))
            )
            .setMinValues(1)
            .setMaxValues(Object.keys(globalEventList).length)
        )
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          "### Mention Rules\n*Will tag selection role if any of event listed above is occur."
        )
      )
      .addActionRowComponents((actionRow) =>
        actionRow.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId("roleListMentionRuleEvent")
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel("@everyone")
                .setDescription("Mention all user that can view this channel.")
                .setValue("everyone")
                .setDefault(globalEvents?.mentionRole == "everyone"),
              new StringSelectMenuOptionBuilder()
                .setLabel("@here")
                .setDescription(
                  "Mention all online user that can view this channel."
                )
                .setValue("here")
                .setDefault(globalEvents?.mentionRole == "here"),
              new StringSelectMenuOptionBuilder()
                .setLabel("none")
                .setDescription("Disable mention.")
                .setValue("none")
                .setDefault(globalEvents?.mentionRole == "none")
            )
        )
      );
    resultContainer.push(merchantContainer);
  }

  return resultContainer;
};
module.exports = {
  cooldown: 15,
  data,
  async execute(interaction, server) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "**Can only be used in servers!**",
      });
      return;
    }
    if (!server.whitelisted) {
      await interaction.reply({
        content:
          "❌ This server is not whitelisted, please contact <@" +
          config.ownerId +
          ">.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const selectedType = interaction.options.getString("category") ?? "all";
    await interaction.deferReply();

    const response = await interaction.editReply({
      components: await deployGlobalContainer(
        selectedType,
        interaction,
        server
      ),
      flags: MessageFlags.IsComponentsV2,
      withResponse: true,
    });
    /**
     * Response
     */
    const collectionFilter = (i) => i.user.id === interaction.user.id;
    try {
      const collector = await response.createMessageComponentCollector({
        filter: collectionFilter,
        time: 3_600_000,
      });

      collector.on("collect", async (i) => {
        /**
         * Button toggle
         */
        await i.deferReply();
        if (i.isButton()) {
          if (i.customId.includes("toggle_void")) {
            const voidStatus = await VoidNotification.findOneAndUpdate(
              { serverId: server._id },
              { enabled: i.customId.includes("on") },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (voidStatus) {
              await interaction.editReply({
                components: await deployGlobalContainer(
                  selectedType,
                  interaction,
                  server
                ),
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
              });
              await i.editReply({
                content: `Void is set to ${
                  i.customId.includes("on") == "Enable" ? "Enabled" : "Disabled"
                }!`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to ${
                  i.customId.includes("on") == "Enable" ? "Enable" : "Disable"
                } void notification...`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          if (i.customId.includes("toggle_merchant")) {
            const merchantStatus = await Merchant.findOneAndUpdate(
              { serverId: server._id },
              { enabled: i.customId.includes("on") },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (merchantStatus) {
              await interaction.editReply({
                components: await deployGlobalContainer(
                  selectedType,
                  interaction,
                  server
                ),
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
              });
              await i.editReply({
                content: `Merchant notification is set to ${
                  i.customId.includes("on") == "Enable" ? "Enabled" : "Disabled"
                }!`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to ${
                  i.customId.includes("on") == "Enable" ? "Enable" : "Disable"
                } merchant notification...`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          if (i.customId.includes("toggle_global")) {
            const eventStatus = await GlobalEvent.findOneAndUpdate(
              { serverId: server._id },
              { enabled: i.customId.includes("on") },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (eventStatus) {
              await interaction.editReply({
                components: await deployGlobalContainer(
                  selectedType,
                  interaction,
                  server
                ),
                flags: MessageFlags.IsComponentsV2,
                withResponse: true,
              });
              await i.editReply({
                content: `Global Event notification is set to ${
                  i.customId.includes("on") == "Enable" ? "Enabled" : "Disabled"
                }!`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to ${
                  i.customId.includes("on") == "Enable" ? "Enable" : "Disable"
                } global event notification...`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
        }
        /**
         * Mentionable Select
         */
        if (i.isStringSelectMenu()) {
          if (i.customId === "roleListMentionRule") {
            const roles = i.values[0];
            const merchantMention = await Merchant.findOneAndUpdate(
              { serverId: server._id },
              { mentionRole: roles },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (merchantMention) {
              await i.editReply({
                content: `Successfully set \`${roles}\` to be mentioned on \`send\` rule.`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to set merchant.`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          if (i.customId === "roleListMentionRuleEvent") {
            const roles = i.values[0];
            const eventMention = await GlobalEvent.findOneAndUpdate(
              { serverId: server._id },
              { mentionRole: roles },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (eventMention) {
              await i.editReply({
                content: `\`${roles}\` will be mentioned once ${eventMention.events
                  .map((ev) => globalEventList[ev])
                  .join(", ")} occur.`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to set mention.`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          if (i.customId === "eventList") {
            const events = i.values;
            const eventMention = await GlobalEvent.findOneAndUpdate(
              { serverId: server._id },
              { events: events },
              { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            if (eventMention) {
              await i.editReply({
                content: `\`${
                  events.length
                }\` Event(s) will be mentioned once ${eventMention.events
                  .map((ev) => globalEventList[ev])
                  .join(", ")} occur.`,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await i.editReply({
                content: `Unable to set mention.`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
        }

        /**
         * Channel select
         */
        if (i.isChannelSelectMenu()) {
          const selection = i.values[0];
          if (i.customId == "merchantSelect") {
            const channelCache =
              interaction.guild.channels.cache.get(selection);

            if (channelCache) {
              const botMember = interaction.guild.members.me;
              const perms = channelCache.permissionsFor(botMember);

              if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                  const testSend = await channelCache.send(
                    `<@${interaction.user.id}> set this channel to send merchant info!`
                  );
                  if (testSend) {
                    const merchant = await Merchant.findOneAndUpdate(
                      { serverId: server._id },
                      { notifyChannelId: selection },
                      { new: true, upsert: true, setDefaultsOnInsert: true }
                    );
                    if (merchant) {
                      await i.editReply({
                        content: `Success set merchant channel to <#${selection}>!`,
                        flags: MessageFlags.Ephemeral,
                      });
                    } else {
                      await i.editReply({
                        content: `Unable to set merchant channel...`,
                        flags: MessageFlags.Ephemeral,
                      });
                    }
                  } else {
                    console.log(`Test send failed`);
                    await i.editReply({
                      content: `❌ Bot has no permission to send messages in <#${selection}>`,
                      flags: MessageFlags.Ephemeral,
                    });
                  }
                } catch {
                  await i.editReply({
                    content: `❌ Bot has no permission to send messages in <#${selection}>`,
                    flags: MessageFlags.Ephemeral,
                  });
                }
              } else {
                console.log(`No flags to send message`);
                await i.editReply({
                  content: `❌ Bot has no permission to read messages in <#${selection}>`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            } else {
              console.log("Channel cache not found");

              await i.editReply({
                content: `❌ Bot has no permission to read messages in <#${selection}>`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          if (i.customId == "voidSelect") {
            const channelCache =
              interaction.guild.channels.cache.get(selection);
            if (channelCache) {
              const botMember = interaction.guild.members.me;
              const perms = channelCache.permissionsFor(botMember);
              if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                  const testSend = await channelCache.send(
                    `<@${interaction.user.id}> set this channel to send void info!`
                  );
                  if (testSend) {
                    const voidUpdate = await VoidNotification.findOneAndUpdate(
                      { serverId: server._id },
                      { channelId: selection },
                      { new: true, upsert: true, setDefaultsOnInsert: true }
                    );
                    if (voidUpdate) {
                      await i.editReply({
                        content: `Success set void channel to <#${selection}>!`,
                        flags: MessageFlags.Ephemeral,
                      });
                    } else {
                      await i.editReply({
                        content: `Set void channel failed.`,
                        flags: MessageFlags.Ephemeral,
                      });
                    }
                  } else {
                    await i.editReply({
                      content: `❌ Bot has no permission to send messages in <#${selection}>`,
                      flags: MessageFlags.Ephemeral,
                    });
                  }
                } catch (err) {
                  await i.editReply({
                    content: `❌ Bot has no permission to send messages in <#${selection}>`,
                    flags: MessageFlags.Ephemeral,
                  });
                }
              } else {
                await i.editReply({
                  content: `❌ Bot has no permission to send messages in <#${selection}>`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            } else {
              console.log("Channel cache not found");
              await i.editReply({
                content: `❌ Bot has no permission to read messages in <#${selection}>`,
                flags: MessageFlags.Ephemeral,
              });
            }
          }
          if (i.customId == "globalEventSelect") {
            const channelCache =
              interaction.guild.channels.cache.get(selection);

            if (channelCache) {
              const botMember = interaction.guild.members.me;
              const perms = channelCache.permissionsFor(botMember);

              if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                  const testSend = await channelCache.send(
                    `<@${interaction.user.id}> set this channel to send global event!`
                  );
                  if (testSend) {
                    const merchant = await GlobalEvent.findOneAndUpdate(
                      { serverId: server._id },
                      { channelId: selection },
                      { new: true, upsert: true, setDefaultsOnInsert: true }
                    );
                    if (merchant) {
                      await i.editReply({
                        content: `Success set global event channel to <#${selection}>!`,
                        flags: MessageFlags.Ephemeral,
                      });
                    } else {
                      await i.editReply({
                        content: `Unable to set global event channel...`,
                        flags: MessageFlags.Ephemeral,
                      });
                    }
                  } else {
                    console.log(`Test send failed`);

                    await i.editReply({
                      content: `❌ Bot has no permission to send messages in <#${selection}>`,
                      flags: MessageFlags.Ephemeral,
                    });
                  }
                } catch (err) {
                  console.log("An error", err);
                  await i.editReply({
                    content: `❌ Bot has no permission to send messages in <#${selection}>`,
                    flags: MessageFlags.Ephemeral,
                  });
                }
              } else {
                console.log(`No flags message`);

                await i.editReply({
                  content: `❌ Bot has no permission to read messages in <#${selection}>`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            } else {
              console.log(`No channel cache`);

              await i.editReply({
                content: `❌ Bot has no permission to read messages in <#${selection}>`,
                flags: MessageFlags.Ephemeral,
              });
              console.log("Channel cache not found");
            }
          }
        }
      });
    } catch (err) {
      console.log(err);
      await interaction.followUp({
        content: "Confirmation not received within 1 minute, cancelling",
        components: [],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
  options,
};

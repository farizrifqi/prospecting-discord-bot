const fs = require("node:fs");
const GlobalEvent = require("../models/globalEvent");
const Merchant = require("../models/merchant");
const VoidNotification = require("../models/voidNotification");
const eventListData = require("../data/globalEvent.json");
const Server = require("../models/server");
const {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require("discord.js");

const firelist = {
  merchant: [],
  void: [],
  globalEvent: [],
};
let lastSync = 0;
const getList = async () => {
  if (getTime() - lastSync >= 5) {
    const newestFirelist = await retrieveFirelist();
    firelist.void = newestFirelist.voidList;
    firelist.merchant = newestFirelist.merchantList;
    firelist.globalEvent = newestFirelist.globalEventList;
  }
};
const isExist = (username) => {
  const data = fs.readFileSync("skip.txt", "utf-8");
  return data.includes(username);
};
const isAdded = (userId) => {
  const data = fs.readFileSync("addedList.txt", "utf-8");
  return data.includes(userId);
};
async function ensureServer(Server, interaction) {
  let server = await Server.findOne({ guildId: interaction.guild.id });
  if (!server) {
    server = await Server.create({
      guildId: interaction.guild.id,
      name: interaction.guild.name,
      membersCount: interaction.guild.memberCount ?? 0,
    });
  }
  return server;
}
const getTime = () => Math.floor(Date.now() / 1000);
const readCookie = () => {
  return fs.readFileSync("cookie.txt", "utf-8");
};
const readWebhooksVoid = () => {
  return fs
    .readFileSync("void.txt", "utf-8")
    .replaceAll("\r", "")
    .split("\n")
    .filter((wh) => wh != "")
    .filter((wh) => wh.split("")[0] != "#");
};
const readWebhooksMerchant = () => {
  return fs
    .readFileSync("merchant.txt", "utf-8")
    .replaceAll("\r", "")
    .split("\n")
    .filter((wh) => wh != "")
    .filter((wh) => wh.split("")[0] != "#");
};
const appendUser = (username) => {
  fs.appendFileSync("skip.txt", `${username}\n`);
};
const appendAddedUser = (userId) => {
  fs.appendFileSync("addedList.txt", `${userId}\n`);
};
const retrieveFirelist = async () => {
  const voidListData = await VoidNotification.find({
    enabled: true,
    channelId: { $ne: "" },
  }).populate("serverId");
  const voidList = !voidListData
    ? []
    : voidListData
        .filter((f) => f.serverId?.whitelisted == true)
        .map((f) => `${f.channelId}:${f.serverId.guildId}`);

  const merchantListData = await Merchant.find({
    enabled: true,
    notifyChannelId: { $ne: "" },
  }).populate("serverId");
  const merchantList = !merchantListData
    ? []
    : merchantListData
        .filter((f) => f.serverId?.whitelisted == true)
        .map(
          (f) => `${f.notifyChannelId}:${f.serverId.guildId}:${f.mentionRole}`
        );
  const globalEventListData = await GlobalEvent.find({
    enabled: true,
    channelId: { $ne: "" },
    events: { $ne: [] },
  }).populate("serverId");
  const globalEventList = !globalEventListData
    ? []
    : globalEventListData
        .filter((f) => f.serverId?.whitelisted == true)
        .map(
          (f) =>
            `${f.channelId}:${f.serverId.guildId}:${f.events.join(",")}:${
              f.mentionRole
            }`
        );
  return { voidList, merchantList, globalEventList };
};
const messageComposeStone = (channel, gameId, stoneName) => {
  try {
    const protocolPC = new ButtonBuilder()
      .setLabel("JOIN NOW")
      .setURL(`http://priv8.zeranel.dev/roblox-join?gameId=${gameId}`)
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(protocolPC);
    channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`${stoneName} Server`)
          .setDescription(`${stoneName} server detected.`)
          .addFields({
            name: "Server",
            value: `\`${gameId}\``,
            inline: true,
          })
          .setTimestamp(),
      ],
      components: [row],
    });
  } catch (err) {
    console.log(err);
    console.error(`Err while sending`);
  }
};
const messageComposeMerchant = (channel, embeds, mentions, tier) => {
  try {
    if (tier == "hide") return;

    channel.send({
      content:
        mentions == "here"
          ? "@here"
          : mentions == "everyone"
          ? "@everyone"
          : "",
      embeds: embeds.map((e) => e.toJSON()),
    });
  } catch (err) {
    console.log(err);
    console.error(`Err while sending`);
  }
};
const messageComposeEvent = (channel, event, mentions) => {
  try {
    channel.send({
      content:
        mentions == "here"
          ? "@here"
          : mentions == "everyone"
          ? "@everyone"
          : "",
      embeds: [
        new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`Global Event Started`)
          .setDescription(
            `A global event has started: **${eventListData[event]}**`
          )
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.log(err);
    console.error(`Err while sending`);
  }
};
const coreMineralProcess = async (client, presence, type) => {
  await getList();
  if (type == "Void") {
    const list = firelist.void;
    let success = 0;
    if (list) {
      for await (const d of list) {
        const [channel, guild] = d.split(":");
        const guildCache = client.guilds.cache.get(guild);

        if (guildCache) {
          const botMember = guildCache.members.me; // the bot’s GuildMember

          const channelCache = guildCache.channels.cache.get(channel);

          if (channelCache) {
            const perms = channelCache.permissionsFor(botMember);

            if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
              messageComposeStone(channelCache, presence.gameId, "Void");
              success++;
            } else {
              console.log(
                `❌ Bot has no permission to send messages in #${channelCache.name}`
              );
            }
          } else {
            console.log(`Channel cache ${channel} on ${guild} not found.`);
          }
        } else {
          console.log(`Guild cache ${guild} not found.`);
        }
      }
      console.log(`[VOID]`, `Sent to ${success} of ${list.length}`);
    }
  }
};
const coreMerchantProcess = async (client, embeds, tier) => {
  await getList();

  const list = firelist.merchant;
  let success = 0;

  if (list) {
    for await (const d of list) {
      const [channel, guild, mentions] = d.split(":");
      const guildCache = client.guilds.cache.get(guild);
      if (guildCache) {
        const botMember = guildCache.members.me;
        const channelCache = guildCache.channels.cache.get(channel);
        if (channelCache) {
          const perms = channelCache.permissionsFor(botMember);
          if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
            messageComposeMerchant(
              channelCache,
              embeds,
              tier == "important" ? mentions : "none",
              tier
            );
            success++;
          } else {
            console.log(
              `❌ Bot has no permission to send messages in #${channelCache.name}`
            );
          }
        } else {
          console.log(`Channel cache ${channel} on ${guild} not found.`);
        }
      } else {
        console.log(`Guild cache ${guild} not found.`);
      }
    }
    console.log(`[MERCHANT]`, `Sent to ${success} of ${list.length}`);
  }
};
const coreEventProcess = async (client, event) => {
  await getList();

  const list = firelist.globalEvent.filter((g) => g.includes(event));
  let success = 0;

  if (list) {
    for await (const d of list) {
      const [channel, guild, events, mentions] = d.split(":");
      const guildCache = client.guilds.cache.get(guild);
      if (guildCache) {
        const botMember = guildCache.members.me;
        const channelCache = guildCache.channels.cache.get(channel);
        if (channelCache) {
          const perms = channelCache.permissionsFor(botMember);
          if (perms?.has(PermissionsBitField.Flags.SendMessages)) {
            messageComposeEvent(channelCache, event, mentions);
            success++;
          } else {
            console.log(
              `❌ Bot has no permission to send messages in #${channelCache.name}`
            );
          }
        } else {
          console.log(`Channel cache ${channel} on ${guild} not found.`);
        }
      } else {
        console.log(`Guild cache ${guild} not found.`);
      }
    }
    console.log(`[GLOBALEVENT]`, `Sent to ${success} of ${list.length}`);
  }
};
module.exports = {
  isExist,
  coreEventProcess,
  coreMerchantProcess,
  coreMineralProcess,
  appendUser,
  readWebhooksMerchant,
  readWebhooksVoid,
  ensureServer,
  getTime,
  readCookie,
  retrieveFirelist,
  isAdded,
  appendAddedUser,
};

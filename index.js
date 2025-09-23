const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const { selfToken, botToken } = require("./config.json");
const { connectDB } = require("./utils/database");
const { processUser } = require("./utils/selfClient");
const {
  getTime,
  coreMerchantProcess,
  coreEventProcess,
} = require("./utils/functions");
const { Client: ClientSelf } = require("discord.js-selfbot-v13");

const PROSPECTING_CHANNEL_ID = "1391824918588555324";
const PROSPECTING_TRACKER_CHANNEL_ID = "1411379476482228467";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});
const clientSelf = new ClientSelf({});
let lastSentMerchant = 0;

client.commands = new Collection();
client.cooldowns = new Collection();
let lastPerson = "";
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

/**
 * Reading Commands
 */
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command, command.options ?? null);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}
/**
 * Reading Interaction
 */
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
clientSelf.once("ready", (readyClient) => {
  console.log(`Ready! Self Client Logged in as ${readyClient.user.username}`);
});
clientSelf.on("messageCreate", async (message) => {
  const { channelId } = message;
  /**
   * Listen Channel
   */
  if (channelId === PROSPECTING_CHANNEL_ID) {
    /**
     * Listen Channel #rare-finds
     */
    try {
      const fields = message.embeds[0]?.fields;
      if (fields) {
        const [username, item, weight] = fields.map((f) => f.value);
        if (username != lastPerson) {
          if (!username || !item || !weight) {
            throw new Error("One or more embed fields are missing.");
          }
          if (item.toLowerCase().includes("voidstone")) {
            console.log(`${username} found a ${item}!`);
            processUser(client, username, "Void");
          }
        } else {
          console.log(
            `No fields found void on https://discord.com/channels/1391817778087858216/1411379476482228467/${message.id} `
          );
          throw new Error("No embeds found in the message.");
        }
        lastPerson = username;
      }
    } catch (error) {
      console.error("Failed to read embeds", error);
    }
  } else if (
    channelId === PROSPECTING_TRACKER_CHANNEL_ID &&
    getTime() - lastSentMerchant > 900
  ) {
    /**
     * Listen Channel #Tracker
     */
    try {
      const embeds = message.embeds;
      if (embeds && embeds.length > 0) {
        const fields = embeds[0]?.fields;
        if (fields) {
          if (message.embeds[0]?.title == "Traveling Merchant") {
            const result = message.embeds.flatMap((item) =>
              item.fields.map((bItem) => bItem.value)
            );
            console.log(`List items: `, result.join(", "));
            let tier = "hide";
            const showTier = result.some(
              (val) =>
                /**
                 * Shards Worth
                 */
                val.includes("Perfect Reforge Token") ||
                val.includes("Void Shard") ||
                val.includes("Meteor Fragment") ||
                /**
                 * Money Worth
                 */
                val.includes("Traveler's Backpack - 1B Money") ||
                val.includes("Cosmic Enchant Book - 10B Money") ||
                val.includes("Prismatic Enchant Book - 20B Money")
            );
            if (showTier) tier = "show";
            const importantTier = result.some(
              (val) =>
                val.includes("Perfect Reforge Token - 50B Money") ||
                val.includes("Void Shard - 10B Money") ||
                val.includes("Meteor Fragment - 5B Money")
            );
            if (importantTier) tier = "important";
            if (tier !== "hide") {
              console.log(`Traveling Merchant found! Tier: ${tier}`);
              coreMerchantProcess(client, message.embeds, tier);
              lastSentMerchant = getTime();
            }
          } else if (message.embeds[0]?.title == "Global Event Started") {
            console.log(`Global event detected`);
            const [event] = fields.map((f) => f.value);
            console.log(`Global event:`, event);

            if (event) {
              coreEventProcess(client, event);
            } else {
              console.log("Event not detected");
            }
          }
        } else {
          console.log(
            `No fields found embeds on https://discord.com/channels/1391817778087858216/1411379476482228467/${message.id} `
          );
        }
      } else {
        console.log(
          `No embeds found on https://discord.com/channels/1391817778087858216/1411379476482228467/${message.id} `
        );
        throw new Error("No embeds found in the message.");
      }
    } catch (error) {
      console.error("Failed to add reactions:", error);
    }
  }
});
/**
 * Self client
 */
(async () => {
  await connectDB();
  await client.login(botToken);
  await clientSelf.login(selfToken);
})();

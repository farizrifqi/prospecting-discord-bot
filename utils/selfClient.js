const { getUserPresence } = require("./robloxAPI");
const { coreMineralProcess, isExist, getTime } = require("./functions");
const gameIdStorage = {};

const isSameServer = (gameId) => {
  if (gameIdStorage[gameId]) {
    const currentTime = getTime();
    if (currentTime - gameIdStorage[gameId] >= 900) {
      return true;
    }
    console.info(`Skipped, same server less than 900seconds ago.`);
    return false;
  } else {
    return true;
  }
};
const processUser = async (client, username, type) => {
  if (isExist(username)) {
    console.log(`${username} already exists in skip list`);
    return;
  }
  const presence = await getUserPresence(username);
  if (presence) {
    console.info(`${username} is in a prospecting server!`);
    if (!isSameServer(presence.gameId)) return;
    gameIdStorage[presence.gameId] = getTime();
    coreMineralProcess(client, presence, type);
  }
};

module.exports = { processUser };

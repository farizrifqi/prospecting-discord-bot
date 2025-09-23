const PROSPECTING_PLACE_ID = 129827112113663;

const {
  appendUser,
  readCookie,
  getTime,
  appendAddedUser,
  isAdded,
} = require("./functions");
const config = require("../config.json");
const wait = require("node:timers/promises").setTimeout;
const ROBLOX_USER_API = "users.roblox.com";
const ROBLOX_GAME_API = "games.roblox.com";
const ROBLOX_PROXY_USER_API = "presence.roblox.com";
const ROBLOX_FRIENDS_API = "friends.roblox.com";
const cookie = readCookie();
let csrf = "";

let tooManyRequest = 0;
let lastFriendSent = 0;
let userTooManyRequest = 0;
const getCSRFRoblox = async (userId) => {
  try {
    console.info("Getting new CSRF token...");
    const request = await fetch(
      `https://www.roproxy.com/users/${userId}/profile?friendshipSourceType=PlayerSearch`,
      {
        headers: { Cookie: cookie },
        method: "GET",
      }
    );
    const response = await request.text();
    const regex = /data-token="([^"]+)"/i;

    const match = response.match(regex);
    if (match) {
      const xcsrf = match[1];
      if (
        !xcsrf.includes("#") &&
        !xcsrf.includes(":") &&
        !xcsrf.includes("!")
      ) {
        return match[1];
      } else {
        console.error(`Err getting xsrf token: seems not valid: ${xcsrf}`);
      }
    }
    return null;
  } catch (err) {
    lastFriendSent = getTime();
    console.error(`Err getting xsrf token:`, err);
    return null;
  }
};
const getUserId = async (username) => {
  if (userTooManyRequest > 0 && getTime() - userTooManyRequest <= 150) {
    console.error(`Skipped get getUserId, request cooldown.`);
    return null;
  }
  try {
    const request = await fetch(
      `https://${ROBLOX_USER_API}/v1/usernames/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true,
        }),
      }
    );

    const response = await request.json();
    if (response) {
      if (response.errors) {
        const error = response;
        throw new Error(error.errors[0].message);
      } else {
        const success = response;
        if (success.data.length === 0) {
          throw new Error("User not found");
        }
        return success.data[0].id;
      }
    }
  } catch (err) {
    userTooManyRequest = getTime();
    console.error(`Error fetching user ID for ${username}:`, err);
    return null;
  }
};
const requestFriendshipRoblox = async (userId, retries = 0) => {
  retries++;
  if (!csrf) {
    csrf = await getCSRFRoblox(userId);
    if (!csrf) {
      return null;
    }
  }
  try {
    const request = await fetch(
      `https://${ROBLOX_FRIENDS_API}/v1/users/${userId}/request-friendship`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
          "x-csrf-token": csrf,
        },
        method: "POST",
        body: JSON.stringify({ friendshipOriginSourceType: "UserProfile" }),
      }
    );
    const response = await request.json();
    if (response?.success) {
      lastFriendSent = getTime();
      console.info(`Successfully sent friend request to userId: ${userId}`);
      appendAddedUser(userId);
      return true;
    }
    if (response?.errors) {
      console.warn(
        `Error while adding friend, retrying... (${retries})`,
        `Reason: ${response.errors[0]?.message}`
      );
      if (retries >= 3) {
        console.warn(`Max retries reached for userId ${userId}.`);
        tooManyRequest = getTime();
        return null;
      }
      if (response.errors[0]?.message === "XSRF token invalid") {
        console.warn(response.errors[0]?.message, csrf);
        csrf = await getCSRFRoblox(userId);
        if (csrf) {
          await wait(30_000);
          return await requestFriendshipRoblox(userId, retries);
        } else {
          console.warn(`Unable to get CSRF.`);
          return null;
        }
      }
      if (response.errors[0]?.message === "Too many requests") {
        console.warn(response.errors[0]?.message);
        tooManyRequest = getTime();
      }
      console.warn(
        `Failed to send friend request to userId ${userId}:`,
        response
      );
    }
    tooManyRequest = getTime();
    return false;
  } catch (err) {
    tooManyRequest = getTime();

    console.error(`Err requesting friend to userId ${userId}:`, err);
    return null;
  }
};
const getUserPresence = async (username) => {
  if (userTooManyRequest > 0 && getTime() - userTooManyRequest <= 150) {
    console.error(`Skipped get userpresence, request cooldown.`);
    return null;
  }
  const userId = await getUserId(username);
  if (!userId) return null;
  try {
    const request = await fetch(
      `https://${ROBLOX_PROXY_USER_API}/v1/presence/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify({
          userIds: [userId],
        }),
      }
    );

    const response = await request.json();
    if (response.userPresences[0]) {
      if (
        response.userPresences[0].placeId == null ||
        response.userPresences[0].gameId == null
      ) {
        console.warn(`Place ID not found or hidden`);
        if (
          getTime() - tooManyRequest > 900 &&
          getTime() - lastFriendSent > 300 &&
          !isAdded(userId) &&
          config.enableAddFriend
        ) {
          requestFriendshipRoblox(userId);
        } else {
          console.warn(`Cannot add friend to ${username} request cooldown.`);
          appendUser(username);
        }
        return null;
      }
      if (response.userPresences[0].placeId != PROSPECTING_PLACE_ID) {
        console.warn(`Different game.`);
        return null;
      }
    }
    return response.userPresences[0] ?? null;
  } catch (err) {
    userTooManyRequest = getTime();
    console.error(`Error fetching presence ID for ${username}:`, err);
    return null;
  }
};
module.exports = { getCSRFRoblox, getUserPresence };

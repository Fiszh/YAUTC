let broadcaster = 'psp1g';
let loadedEmotes = false;
let autoScroll = true;
let holdingCtrl = false;
let scrollUpOffset = 0

var url = window.location.href;

var parts = url.split('/');
if (parts[4]) {
    broadcaster = parts[4]
}

if (parts.length == 2) {
    broadcaster = 'psp1g';
}

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

//TMI
let tmiUsername = 'none'

const client = new tmi.Client({
    options: {
        debug: true,
        skipUpdatingEmotesets: true
    },
    //identity: {
    //    username: tmiUsername,
    //    password: tmiPass
    //},
    channels: [broadcaster]
});

let isMod = false;

client.on('connected', async (address, port) => {
    await handleMessage(ServerUserstate, 'CONNECTED TO TMI')
});

//OTHER VARIABLES
let messageCount = 1;

//TWITCH
//let accessToken = '0';
let userToken = `Bearer ${accessToken}`
let userClientId = '0'
let channelTwitchID = '0';
let userTwitchId = '0';
let TTVGlobalEmoteData = [];
let TTVEmoteData = [];
let TTVSubBadgeData = [];
let TTVBitBadgeData = [];
let TTVGlobalBadgeData = [];
let TTVUsersData = [];
let blockedUsersData = [];
let TTVBitsData = [];
let TTVWebSocket;
let startTime;

const twitchColors = [
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#800080", // Purple
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#FFC0CB", // Pink
    "#FF1493", // Deep Pink
    "#FFD700", // Gold
    "#1E90FF", // Dodger Blue
    "#FF69B4", // Hot Pink
    "#2E8B57", // Sea Green
    "#6A5ACD", // Slate Blue
    "#9932CC", // Dark Orchid
    "#D2691E", // Chocolate
    "#008080", // Teal
    "#9370DB", // Medium Purple
    "#008B8B", // Dark Cyan
    "#CD5C5C"  // Indian Red
];

//7TV
let SevenTVID = '0';
let SevenTVemoteSetId = '0';
let SevenTVWebsocket;

let SevenTVGlobalEmoteData = [];
let SevenTVEmoteData = [];

//FFZ
let FFZGlobalEmoteData = [];
let FFZEmoteData = [];

let FFZBadgeData = [];

//BTTV
let BTTVWebsocket;
let BTTVGlobalEmoteData = [];
let BTTVEmoteData = [];

let allEmoteData = [];

//ADDITIONAL
let ChatterinoBadgeData = [];
let mode = 'none'
let translationMode;

let chatDisplay = document.getElementById("ChatDisplay");

//CUSTOM USERSTATES 

let ServerUserstate = {
    "username": 'SERVER',
    "badges-raw": 'Server/1',
    "color": "#FFFFFF"
}

let SevenTVServerUserstate = {
    "username": '7TV',
    "badges-raw": '7TVServer/1',
    "color": "#28aba1"
}

let BTTVServerUserstate = {
    "username": 'BTTV',
    "badges-raw": 'BTTVServer/1',
    "color": "#d50014"
}

let FFZServerUserstate = {
    "username": 'FFZ',
    "badges-raw": 'FFZServer/1',
    "color": "#08bc8c"
}

let TTVAnnouncementUserstate = {
    "username": '',
    "badges-raw": 'NONE/1',
    "color": "#FFFFFF"
}

client.on("cheer", (channel, userstate, message) => {
    console.log(userstate)
    handleMessage(userstate, message, channel)
});

client.on("redeem", (channel, userstate, message) => {
    console.log('Redeem:')
    console.log(userstate)
    console.log(message)
    handleMessage(userstate, message, channel)
});

client.on("subscription", (channel, username, method, message, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.split('#')[1]
    }

    let methods = ''

    if (method) {
        method = ` using ${method}`
    }

    let subMsg = '';

    if (message) {
        subMsg = `: ${message}`
    }

    handleMessage(TTVAnnouncementUserstate, `${username} Subscribed to ${channel}${methods}${subMsg}`, channel)
});

client.on("resub", (channel, username, months, message, userstate, methods) => {
    if (channel.startsWith('#')) {
        channel = channel.split('#')[1]
    }
    let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];

    let method = ''

    if (methods[0]) {
        method = ` using ${methods[0]}`
    }

    let currentMonths = ''

    if (cumulativeMonths > 1) {
        currentMonths = ` for ${cumulativeMonths} months`
    } else {
        currentMonths = ` for ${cumulativeMonths} month`
    }

    let subMsg = '';

    if (message) {
        subMsg = `: ${message}`
    }

    handleMessage(TTVAnnouncementUserstate, `${username} Subscribed to ${channel}${currentMonths}${method}${subMsg}`, channel)
});

client.on("raided", (channel, username, viewers) => {
    if (channel.startsWith('#')) {
        channel = channel.split('#')[1]
    }

    handleMessage(TTVAnnouncementUserstate, `${username} raided ${channel} with ${viewers} viewers`, channel)
});

client.on("anongiftpaidupgrade", (channel, username, userstate) => {
    handleMessage(TTVAnnouncementUserstate, `${username} is continuing the Gift Sub they got in the channel.`, channel)
});

client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
    let senderCount = ~~userstate["msg-param-sender-count"];

    let subCount = 'a subscription'

    if (numbOfSubs > 1) {
        subCount = `${numbOfSubs} subscriptions`
    }

    handleMessage(TTVAnnouncementUserstate, `${username} is gifting ${subCount} to someone in a channel.`, channel)
});

client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
    handleMessage(TTVAnnouncementUserstate, `${username} is continuing the Gift Sub they got from ${sender}.`, channel)
});

client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
    let senderCount = ~~userstate["msg-param-sender-count"];

    handleMessage(TTVAnnouncementUserstate, `${username} gifted a subscription to ${recipient} to the channel.`, channel)
});

client.on("ban", (channel, username, reason, userstate) => {
    handleMessage(ServerUserstate, `${username} has been banned from the channel.`, channel)
});

client.on("timeout", (channel, username, reason, duration, userstate) => {
    handleMessage(ServerUserstate, `${username} has been timed out for ${convertSeconds(duration)}.`, channel)
});

async function handleChat(channel, userstate, message, self) {
    if (self) {
        console.log(userstate)
    }

    const blockedUser0 = blockedUsersData.find(username => username.username === userstate.username.toLowerCase());
    const blockedUser1 = blockedUsersData.find(username => username.username === userstate["display-name"].toLowerCase());

    let canHandleMessage = false;

    if ((blockedUser0 || blockedUser1) && isMod) {
        canHandleMessage = true;
        userstate.username = `(BLOCKED) ${userstate.username}`
    }

    if (!blockedUser0 && !blockedUser1) {
        canHandleMessage = true;

        if (canHandleMessage) {
            handleMessage(userstate, message, channel)
        }
    }

    if (!blockedUser0 && !blockedUser1) {
        foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

        if (!foundUser) {
            let userColor = userstate.color

            if (userstate.color === null || userstate.color === undefined || !userstate.color) {
                userColor = getRandomTwitchColor();
            }

            let user = {
                name: `@${userstate.username}`,
                color: userColor,
                sevenTVId: null,
                sevenTVData: null,
                avatar: null,
                userId: userstate["user-id"]
            };

            TTVUsersData.push(user);
        }
    }
}

function convertSeconds(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    seconds %= (24 * 3600);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    let result = "";
    if (days > 0) {
        result += `${days} day${days !== 1 ? 's' : ''} `;
    }
    if (hours > 0) {
        result += `${hours} hour${hours !== 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
        result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    }
    if (seconds > 0) {
        result += `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    return result.trim().replace(/\s+and\s*$/, '');
}

function getRandomTwitchColor() {
    const randomIndex = Math.floor(Math.random() * twitchColors.length);
    return twitchColors[randomIndex];
}

async function makeLinksClickable(message) {
    if (!message) return '';
    return message
}

async function updateAllEmoteData() {
    allEmoteData = [
        ...TTVGlobalEmoteData,
        ...SevenTVGlobalEmoteData,
        ...SevenTVEmoteData,
        ...BTTVGlobalEmoteData,
        ...BTTVEmoteData,
        ...FFZGlobalEmoteData,
        ...FFZEmoteData,
    ];
}

async function checkPart(part, string) {
    return (part.toLowerCase() === string)
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function findEntryAndTier(prefix, bits) {
    for (let entry of TTVBitsData) {
        if (entry.name !== prefix) continue; // Skip entries that don't match the name

        // Iterate through the tiers to check where the bits fall
        for (let i = 0; i < entry.tiers.length; i++) {
            let currentTier = entry.tiers[i];
            let nextTier = entry.tiers[i + 1];

            // If this is the last tier, assume it covers all bits greater than min_bits
            if (!nextTier && bits >= currentTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }

            // Check if bits fall within the range defined by the current and next tiers
            if (bits >= currentTier.min_bits && bits < nextTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }
        }
    }

    return null; // Return null if no matching range was found
}

// Your existing function for replacing text with emotes
async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate, channel) {
    if (!inputString) { return inputString }
    let lastEmote = false;
    let latestEmote;

    try {
        const ttvEmoteData = [
            ...TTVGlobalBadgeData,
            ...TTVMessageEmoteData,
        ];

        const nonGlobalEmoteData = [
            ...SevenTVEmoteData,
            ...BTTVEmoteData,
            ...FFZEmoteData,
        ];

        const emoteData = [
            ...ttvEmoteData,
            ...nonGlobalEmoteData,
            ...allEmoteData,
        ];

        if (emoteData.length === 0) return inputString;

        const EmoteSplit = inputString.split(/\s+/);

        let foundMessageSender = null

        if (userstate) {
            foundMessageSender = TTVUsersData.find(user => user.name === `@${userstate.username}`);
        }

        const replacedParts = await Promise.all(EmoteSplit.map(async part => {
            let foundEmote;
            let foundUser;
            let emoteType = ''

            if (userstate && userstate['bits'] && false) {
                let match = part.match(/^([a-zA-Z]+)(\d+)$/);

                if (match) {
                    let prefix = match[1];
                    let bits = match[2];

                    let result = findEntryAndTier(prefix, bits);

                    if (result) {
                        foundEmote = {
                            name: result.name,
                            url: result.tier.url,
                            site: 'TTV',
                            color: result.tier.color,
                            bits: bits
                        }

                        emoteType = 'Bits'
                    }
                }
            }

            // Prioritize ttvEmoteData
            for (const emote of ttvEmoteData) {
                if (part === emote.name) {
                    foundEmote = emote;
                    emoteType = emote.site
                    break;
                }
            }

            // Prioritize personalEmotes
            if (foundMessageSender && foundMessageSender.sevenTVData) {
                const sevenTVData = foundMessageSender.sevenTVData

                if (sevenTVData.personal_emotes && sevenTVData.personal_emotes.length > 0) {
                    for (const emote of sevenTVData.personal_emotes) {
                        if (part === emote.name) {
                            foundEmote = emote;
                            emoteType = 'Personal'
                            break;
                        }
                    }
                }
            }

            // Prioritize nonGlobalEmoteData
            if (!foundEmote) {
                for (const emote of nonGlobalEmoteData) {
                    if (part === emote.name) {
                        foundEmote = emote;
                        emoteType = emote.site
                        break;
                    }
                }
            }

            // Search in allEmoteData
            if (!foundEmote) {
                for (const emote of allEmoteData) {
                    if (part === emote.name) {
                        foundEmote = emote;
                        emoteType = emote.site
                        break;
                    }
                }
            }

            // Search for user if no emote is found
            if (!foundEmote) {
                for (const user of TTVUsersData) {
                    const userName = user.name.toLowerCase();
                    const checks = await Promise.all([
                        checkPart(part, userName),
                        checkPart(part, userName.slice(1)),
                        checkPart(part, `${userName},`),
                        checkPart(part, `${userName.slice(1)},`)
                    ]);

                    if (checks.some(value => value === true)) {
                        foundUser = user;
                        break;
                    }
                }
            }

            if (foundEmote) {
                let additionalInfo = '';
                if (foundEmote && foundEmote.original_name) {
                    if (foundEmote.name !== foundEmote.original_name) {
                        additionalInfo += `Alias of: ${foundEmote.original_name}, `;
                    }
                }

                let emoteStyle = 'style="height: 36px; position: relative;"'

                let emoteHTML = `<span class="emote-wrapper" data-text="${foundEmote.name} (${additionalInfo}${emoteType})" style="color:${foundEmote.color || 'white'}">
                                    <a href="${foundEmote.emote_link}" target="_blank;" style="display: inline-flex; justify-content: center">
                                        <img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle}>
                                    </a>
                                    ${foundEmote.bits || ''}
                                </span>`;

                latestEmote = emoteHTML
                lastEmote = true;
                return emoteHTML;
            } else if (foundUser) {
                lastEmote = false;

                let avatar = null

                if (foundUser && foundUser.sevenTVData && foundUser.sevenTVData.avatar_url) {
                    avatar = foundUser.sevenTVData.avatar_url
                } else {
                    if (foundUser && foundUser.avatar) {
                        avatar = foundUser.avatar
                    } else {
                        avatar = null //await getAvatarFromUserId(channelTwitchID || 141981764)
                    }
                }

                return `<span class="name-wrapper">
                                <strong data-alt="${avatar}" style="color: ${foundUser.color}">${part}</strong>
                            </span>`;
            } else {
                lastEmote = false;

                return twemoji.parse(part, {
                    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                    folder: 'svg',
                    ext: '.svg',
                    className: 'twemoji'
                });
            }
        }));

        const resultString = replacedParts.join(' ');

        lastEmote = false;
        return resultString;
    } catch (error) {
        console.log('Error replacing words with images:', error);
        return inputString;
    }
}

function extractEmoteSubstring(emoteString) {
    if (typeof emoteString === 'object' && Object.keys(emoteString).length === 0) {
        return emoteString;
    }

    if (typeof emoteString === 'object') {
        console.log('Invalid input format:', emoteString);
        return emoteString;
    }

    const emoteList = emoteString.split(',');

    let emoteTable = [];

    emoteList.forEach(emote => {
        let [emoteId, position] = emote.split(':');
        let [start, end] = position.split('-').map(Number);

        emoteTable[emoteId] = emoteTable[emoteId] || [];
        emoteTable[emoteId].push(position);
    });

    return emoteTable
}

async function handleMessage(userstate, message, channel) {
    if (message === 'ResponseNotNeededForThisCommand') { return; }

    if (userstate["user-id"] === "528761326") {
        userstate["badges-raw"] += ',YAUTCDev/1';
    }

    if (messageCount === 0) {
        messageCount = 1
    } else if (messageCount === 1) {
        messageCount = 0
    }

    let username = userstate.username;
    let displayname = userstate["display-name"]
    let finalUsername = userstate.username

    if (username && displayname) {
        if (username.toLowerCase() == displayname.toLowerCase()) {
            finalUsername = `${displayname}:`
        } else {
            finalUsername = `${username} (${displayname}):`
        }
    }

    const messageElement = document.createElement("div");
    if (message.toLowerCase().includes(tmiUsername.toLowerCase()) && displayname) {
        //var audio = new Audio('Sounds/ping0.wav');
        //audio.play();

        messageElement.classList.add('message-mention');
    } else if (userstate['first-msg']) {
        messageElement.classList.add('message-first');
    } else if (userstate['bits'] || userstate === TTVAnnouncementUserstate) {
        messageElement.classList.add('message-bits');
    } else {
        if (messageCount === 0) {
            messageElement.classList.add('message-even');
        } else if (messageCount === 1) {
            messageElement.classList.add('message-odd');
        }
    }

    let TTVMessageEmoteData = [];

    if (userstate.emotes && userstate.emotes !== "" && Object.keys(userstate.emotes).length > 0) {
        console.log(userstate.emotes)
        userstate.emotes = await extractEmoteSubstring(userstate.emotes)

        console.log(userstate.emotes)
        TTVMessageEmoteData = Object.entries(userstate.emotes).flatMap(([emoteId, positions]) =>
            positions.map(position => {
                const [start, end] = position.split('-').map(Number);
                return {
                    name: message.substring(start, end + 1),
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
                    site: 'TTV'
                };
            })
        );
    }

    let badges = '';

    if (userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length > 0) {
        let rawBadges = userstate['badges-raw'];
        let badgesSplit = rawBadges.split(',');

        for (const Badge of badgesSplit) {
            let badgeSplit = Badge.split("/");
            if (badgeSplit[0] === 'subscriber') continue;
            const badge = TTVGlobalBadgeData.find(badge => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`);

            if (badgeSplit[0] === 'bits' && userstate.badges && userstate.badges.bits) {
                const BitBadge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);
                if (BitBadge) continue;
            }

            if (badge) {
                badges += `<span class="badge-wrapper">
                            <img src="${badge.url}" alt="${badge.title}" class="badge">
                        </span>`;
            }
        }

        if (userstate.badges) {
            if (userstate.badges.subscriber) {
                const badge = TTVSubBadgeData.find(badge => badge.id === userstate.badges.subscriber);

                if (badge) {
                    badges += `<span class="badge-wrapper">
                                <img src="${badge.url}" alt="${badge.title}" class="badge">
                            </span>`;
                }
            }

            if (userstate.badges.bits) {
                const badge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);

                if (badge) {
                    badges += `<span class="badge-wrapper">
                                <img src="${badge.url}" alt="${badge.title}" class="badge">
                            </span>`;
                }
            }
        }
    }

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    // Chatterino Badges

    const foundChatterinoBadge = ChatterinoBadgeData.find(badge => badge.owner_id == userstate["user-id"]);

    if (foundChatterinoBadge) {
        badges += `<span class="badge-wrapper">
                                <img src="${foundChatterinoBadge.url}" alt="${foundChatterinoBadge.title}" class="badge">
                            </span>`;
    }

    // FFZ Badges

    const foundFFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username);

    if (foundFFZBadge) {
        badges += `<span class="badge-wrapper">
                                <img style="background-color: ${foundFFZBadge.color};" src="${foundFFZBadge.url}" alt="${foundFFZBadge.title}" class="badge">
                            </span>`;
    }

    // 7tv Badges

    if (foundUser && foundUser.sevenTVData && foundUser.sevenTVData.badge.url) {
        badges += `<span class="badge-wrapper">
                                <img src="${foundUser.sevenTVData.badge.url}" alt="${foundUser.sevenTVData.badge.title}" class="badge">
                            </span>`;
    }

    // Determine the message HTML based on user information
    let messageHTML = `<div class="message-text">
                            ${badges}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${message}
                        </div>`;

    if (foundUser && foundUser.avatar) {
        messageHTML = `<div class="message-text">
                            ${badges}
                                <span class="name-wrapper">
                                    <strong data-alt="${foundUser.avatar}">${finalUsername}</strong>
                                </span>
                            ${message}
                        </div>`;
    }

    messageElement.innerHTML = messageHTML;

    // Check the number of child elements and remove excess
    while (chatDisplay.children.length >= 500) {
        chatDisplay.removeChild(chatDisplay.firstChild);
    }

    // Append the new message element
    chatDisplay.appendChild(messageElement);

    scrollUpOffset = messageElement.offsetHeight + 5

    // Remove the whole wait for the message

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);

    // Determine the message HTML based on user information

    // Get the current time
    const currentTime = new Date();

    // Extract hours, minutes, and seconds from the current time
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    let seconds = currentTime.getSeconds();

    // Add leading zeros if necessary
    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;

    let prefix = ''

    if (channel && channel.toLowerCase().replace('#', '') !== broadcaster) {
        prefix = `<text class="time" style="color: rgba(255, 255, 255, 0.7);">(${channel})</text>`
    }

    let finalMessageHTML = `<div class="message-text">
                            ${prefix} ${badges}
                                <span class="name-wrapper">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${results} <text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>
                        </div>`;

    if (foundUser && foundUser.avatar) {
        let avatar = null

        if (foundUser && foundUser.sevenTVData && foundUser.sevenTVData.avatar_url) {
            avatar = foundUser.sevenTVData.avatar_url
        } else {
            if (foundUser && foundUser.avatar) {
                avatar = foundUser.avatar
            } else {
                avatar = null
            }
        }

        finalMessageHTML = `<div class="message-text">
                            ${prefix} ${badges}
                                <span class="name-wrapper">
                                    <strong data-alt="${avatar}">${finalUsername}</strong>
                                </span>
                            ${results} <text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>
                        </div>`;
    }

    messageElement.innerHTML = finalMessageHTML;

    // Select all elements with class "name-wrapper"
    var usernames = messageElement.querySelectorAll('.name-wrapper');

    if (usernames) {
        // Iterate through each element
        usernames.forEach(async function (element) {
            const strongElement = element.querySelector('strong');

            if (strongElement) {
                const name = `@${strongElement.innerHTML.replace('@', '').replace(',', '').replace(':', '')}`.toLowerCase()

                const foundUser = TTVUsersData.find(user => user.name === name);

                if (foundUser) {
                    if (foundUser.sevenTVId && foundUser.sevenTVData) {
                        //await setSevenTVPaint(strongElement, foundUser.sevenTVId, foundUser, foundUser.sevenTVData);
                    } else {
                        strongElement.style = `color: ${foundUser.color}`
                    }
                } else {
                    const randomColor = getRandomTwitchColor()
                    strongElement.style.color = userstate.color || randomColor;
                }
            }
        });
    }
}


async function getUser(user_id) {
    if (userClientId === '0') { return; }

    let url = 'https://api.twitch.tv/helix/users'; // Default URL

    if (user_id) {
        const isNumeric = /^\d+$/.test(user_id);
        
        url += isNumeric 
            ? `?id=${user_id}` 
            : `?login=${user_id}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId,
        },
    });

    if (!response.ok) {
        console.log('Unable to get the user', response);
        return;
    }

    const data = await response.json();

    return data;
}

async function LoadEmotes() {
    try {
        client.disconnect();
        await handleMessage(ServerUserstate, 'LOADING')
    } catch (error) {
        await handleMessage(ServerUserstate, 'LOADING')
    }

    //TMI
    await handleMessage(ServerUserstate, 'CONNECTING TO TMI')

    client.connect().catch(console.log);

    if (getCookie('twitch_client_id')) {
        userClientId = getCookie('twitch_client_id');
    } else {
        handleMessage(ServerUserstate, "If you'd like to chat or view third-party emotes, please log in with your twitch account.")
        return
    }

    if (getCookie('twitch_access_token')) {
        userToken = `Bearer ${getCookie('twitch_access_token')}`;
    } else {
        handleMessage(ServerUserstate, "Unable to retrieve your access token. Please refresh the page or log in again.")
        return
    }

    console.log(`client-id ${userClientId}`)
    console.log(`user-token ${userToken}`)

    //get user id
    const userData = await getUser();
    if (userData && userData.data && userData.data.length > 0) {
        userTwitchId = userData.data[0].id;
        tmiUsername = userData.data[0].login;
        console.log(userTwitchId);
        console.log(tmiUsername);
    } else {
        console.log('User not found or no data returned');
    }

    //get broadcaster user id
    const broadcasterUserData = await getUser(broadcaster);
    if (broadcasterUserData && broadcasterUserData.data && broadcasterUserData.data.length > 0) {
        channelTwitchID = broadcasterUserData.data[0].id;
        console.log(channelTwitchID);
    } else {
        console.log('User not found or no data returned');
    }

    await getBadges()

    // SevenTV
    await loadSevenTV()

    // BTTV
    await loadBTTV()

    // FFZ
    await loadFFZ()

    console.log('LOADED!')

    loadedEmotes = true;

    await handleMessage(ServerUserstate, 'LOADED')
}

// TwitchTV

async function getBadges() {
    //CHANNEL
    const response = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelTwitchID}`, {
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    //SUBS
    data.data.forEach(element => {
        if (element["set_id"] === 'subscriber') {
            if (element && Object.keys(element).length > 0) {
                TTVSubBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'subscriber')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return []; // Return an empty array if no badges match the condition
                    });
            }
        }
    });

    //BITS
    data.data.forEach(element => {
        if (element["set_id"] === 'bits') {
            if (element && Object.keys(element).length > 0) {
                TTVBitBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'bits')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return []; // Return an empty array if no badges match the condition
                    });
            }
        }
    });

    //GLOBAL
    const response1 = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, {
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data1 = await response1.json();

    data1.data.forEach(element => {
        if (element["versions"]) {
            if (element && Object.keys(element).length > 0) {
                TTVGlobalBadgeData.push(
                    ...element["versions"].map(badge => ({
                        id: element.set_id + "_" + badge.id, // Set the set_id as the id
                        url: badge["image_url_4x"],
                        title: badge.title
                    }))
                );
            }
            return []; // Return an empty array if no badges
        }
    });

    //CUSTOM BADGES

    TTVGlobalBadgeData.push({
        id: '7TVServer' + "_" + 1,
        url: 'https://femboy.beauty/DoFv2',
        title: '7TV'
    })

    TTVGlobalBadgeData.push({
        id: 'BTTVServer' + "_" + 1,
        url: 'https://femboy.beauty/c5beR',
        title: 'BTTV'
    })

    TTVGlobalBadgeData.push({
        id: 'FFZServer' + "_" + 1,
        url: 'https://femboy.beauty/Qn5KQ',
        title: 'FFZ'
    })

    TTVGlobalBadgeData.push({
        id: 'Server' + "_" + 1,
        url: 'https://femboy.beauty/MQYHL',
        title: 'Server'
    })

    TTVGlobalBadgeData.push({
        id: 'YAUTCDev' + "_" + 1,
        url: 'https://femboy.beauty/xHVwg',
        title: 'YAUTC Dev'
    })
}

// SevenTV

async function loadSevenTV() {
    try {
        await handleMessage(SevenTVServerUserstate, 'LOADING')

        SevenTVID = await get7TVUserID(channelTwitchID);
        await get7TVEmoteSetID(SevenTVID);
        SevenTVGlobalEmoteData = await fetch7TVEmoteData('global');
        await handleMessage(SevenTVServerUserstate, 'LOADED GLOBAL EMOTES')

        SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId);

        //WEBSOCKET
        detect7TVEmoteSetChange();

        await handleMessage(SevenTVServerUserstate, 'LOADED')
    } catch (error) {
        await handleMessage(SevenTVServerUserstate, 'FAILED LOADING')
    }
}

async function get7TVUserID(user_id) {
    try {
        const response = await fetch(`https://7tv.io/v3/users/twitch/${user_id}`);

        if (!response.ok) {
            throw false
        }

        const data = await response.json();
        if (data && data.user && data.user.id) {
            const user = data.user;
            if (user) {
                return user.id;
            } else {
                throw new Error('User not found');
            }
        } else {
            throw new Error('Invalid response format.');
        }
    } catch (error) {
        //console.error('Error fetching user ID:', error);
    }
}

async function get7TVEmoteSetID() {
    try {
        const response = await fetch(`https://7tv.io/v3/users/${SevenTVID}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        data.connections.forEach(connection => {
            if (connection.platform === 'TWITCH' && connection.emote_set) {
                SevenTVemoteSetId = connection.emote_set.id;
                console.log(FgBlue + 'Emote Set ID:', SevenTVemoteSetId + FgWhite);
            }
        });
    } catch (error) {
        console.log('Error fetching emote set ID:', error);
    }
}

async function fetch7TVEmoteData(emoteSet) {
    try {
        const response = await fetch(`https://7tv.io/v3/emote-sets/${emoteSet}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set ${emoteSet}`);
        }
        const data = await response.json();
        if (!data.emotes) { return null }
        return data.emotes.map(emote => {
            const owner = emote.data?.owner;

            const creator = owner && Object.keys(owner).length > 0
                ? owner.display_name || owner.username || "UNKNOWN"
                : "NONE";

            return {
                name: emote.name,
                url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`,
                flags: emote.data?.flags,
                original_name: emote.data?.name,
                creator,
                emote_link: `https://7tv.app/emotes/${emote.id}`,
                site: '7TV'
            };
        });
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// BTTV

async function loadBTTV() {
    try {
        await handleMessage(BTTVServerUserstate, 'LOADING')

        await fetchBTTVGlobalEmoteData();
        await handleMessage(BTTVServerUserstate, 'LOADED GLOBAL EMOTES')

        await fetchBTTVEmoteData();

        //WEBSOCKET
        detectBTTVEmoteSetChange();

        await handleMessage(BTTVServerUserstate, 'LOADED')
    } catch (error) {
        await handleMessage(BTTVServerUserstate, 'FAILED LOADING')
    }
}

async function fetchBTTVGlobalEmoteData() {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/emotes/global`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set bttv`);
        }
        const data = await response.json();
        BTTVGlobalEmoteData = data.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            site: 'BTTV'
        }));
        console.log(FgRed + 'Success in getting Global BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

async function fetchBTTVEmoteData(channel) {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelTwitchID}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch emote data for set BTTV`);
        }
        const data = await response.json();

        const sharedEmotesData = data.sharedEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            site: 'BTTV'
        }));

        const channelEmotesData = data.channelEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            site: 'BTTV'
        }));

        BTTVEmoteData = [...sharedEmotesData, ...channelEmotesData];

        console.log(FgRed + 'Success in getting Channel BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// FFZ

async function loadFFZ() {
    try {
        await handleMessage(FFZServerUserstate, 'LOADING')

        await fetchFFZGlobalEmotes();
        await handleMessage(FFZServerUserstate, 'LOADED GLOBAL EMOTES')

        await fetchFFZEmotes();

        await getFFZBadges();

        await handleMessage(FFZServerUserstate, 'LOADED')
    } catch (error) {
        await handleMessage(FFZServerUserstate, 'FAILED LOADING')
    }
}

async function fetchFFZGlobalEmotes() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/set/global`);
        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ global emotes`);
        }
        const data = await response.json();
        FFZGlobalEmoteData = data.sets[data.default_sets[0]].emoticons.map(emote => ({
            name: emote.name,
            url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
            emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
            site: 'FFZ'
        }));

        console.log(FgGreen + 'Success in getting Global FrankerFaceZ emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching FFZ global emotes:', toString(error));
        throw error;
    }
}

async function fetchFFZEmotes(channel) {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelTwitchID}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch FFZ global emotes`);
        }
        const data = await response.json();

        FFZEmoteData = data.sets[data.room.set].emoticons.map(emote => ({
            name: emote.name,
            url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
            emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
            site: 'FFZ'
        }));

        console.log(FgGreen + 'Success in getting Channel FrankerFaceZ emotes!' + FgWhite);
    } catch (error) {
        console.error('Error fetching FFZ user emotes:', error);
        throw error;
    }
}

async function getFFZBadges() {
    const response = await fetch(`https://api.frankerfacez.com/v1/badges`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    data.badges.forEach(badge => {
        data.users[badge.id].forEach(username => {
            FFZBadgeData.push({
                id: badge.title.replace(' ', '_').toLowerCase(),
                url: badge.urls["4"],
                title: badge.title,
                color: badge.color,
                owner_username: username
            })
        });
    });
}

// EXEC LOAD FUNCTION
LoadEmotes();

const reloadButton = document.getElementById('reloadButton');
const chatInput = document.getElementById('chatInput');

let EmoteI = 0
let TabEmotes = [];
let TabLatestWord = '';
let latestKey = '';
let inputChanged = false;

async function sendMessage() {
    const textContent = chatInput.value;

    if (textContent && textContent !== '' && textContent !== ' ') {
        let message = textContent

        //TWITCH API
        sendAPIMessage(message);

        chatInput.value = ''
    }
}

async function sendAPIMessage(message) {
    if (!accessToken) {
        handleMessage(ServerUserstate, 'Not logged in!')
    }

    if (userTwitchId === '0') {
        handleMessage(ServerUserstate, 'Not connected to twitch!')
        return
    }

    const response = await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            broadcaster_id: channelTwitchID,
            sender_id: userTwitchId,
            message: message
        })
    });

    const data = await response.json();

    if (data.data && data.data[0] && data.data[0]["drop_reason"] && data.data[0]["drop_reason"]["message"]) {
        handleMessage(ServerUserstate, data.data[0]["drop_reason"]["message"].replace("Your message is being checked by mods and has not been sent.", "Your message was not sent."))
    }
}

document.addEventListener('keydown', async function (event) {
    await updateAllEmoteData();
    //handleMessage(ServerUserstate, event.key)

    if (event.key === 'Enter') {
        if (document.activeElement === chatInput) {
            sendMessage();
        }
    } else if (event.key === 'Alt') {
        event.preventDefault();
        autoScroll = !autoScroll
    } else if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === chatInput) {
            let textContent = chatInput.value;

            if (!inputChanged) {
                textContent = textContent.trimEnd();
            }

            if (textContent && textContent !== '' && textContent !== ' ') {
                let tabEmoteData = [
                    ...allEmoteData,
                    ...TTVEmoteData,
                ]

                if (tabEmoteData.length === 0) { return; }

                let split = textContent.split(" ")

                if (inputChanged || TabLatestWord === '') {
                    inputChanged = false;
                    EmoteI = 0
                    TabEmotes = [];
                    TabLatestWord = split[split.length - 1]

                    if (TabLatestWord.endsWith('@') || !TabLatestWord.includes('@')) {
                        tabEmoteData.forEach(emote => {
                            if (emote.name) {
                                if (emote.name.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(emote.name);
                                }
                            }
                        })
                    } else if (TabLatestWord.startsWith('@') || TabLatestWord === '@') {
                        TTVUsersData.forEach(user => {
                            if (user) {
                                if (user.name.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(user.name);
                                }
                            }
                        })
                    }

                    TabEmotes.sort((a, b) => a.length - b.length);

                    TabEmotes.push(TabLatestWord)
                }

                if (TabEmotes.length === 0) { return; }

                split[split.length - 1] = TabEmotes[EmoteI];

                let modifiedText = split.join(" ");

                if ((EmoteI + 1) > (TabEmotes.length - 1)) {
                    chatInput.value = modifiedText
                    EmoteI = 0
                } else {
                    chatInput.value = modifiedText + " "
                    EmoteI += 1
                }
            } else {
                EmoteI = 0
                TabEmotes = [];
                TabLatestWord = ''
            }
        }
    }
});

document.addEventListener('keyup', function (event) {
    if (event.key === 'Ctrl') {
        holdingCtrl = true;
    }
});

let lastScrollTop = 0;

function handleScroll() {
    let st = chatDisplay.scrollTop;

    if (st > lastScrollTop) {
        //console.log('Scrolled down');
    } else if (lastScrollTop - st > scrollUpOffset) {
        //autoScroll = false
    }

    if (chatDisplay.scrollTop + chatDisplay.clientHeight >= chatDisplay.scrollHeight) {
        //autoScroll = true
    }

    lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
}

chatInput.addEventListener('input', function (event) {
    latestKey = event.key
    if (latestKey !== 'Tab') {
        inputChanged = true;
    } else {
        TabEmotes = [];
        inputChanged = false;
    }
});

chatDisplay.addEventListener('scroll', handleScroll, false);

function scrollToBottom() {
    if (autoScroll) {
        document.querySelector('.chat-pause').innerHTML = '';
        chatDisplay.scrollTo({
            top: chatDisplay.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        document.querySelector('.chat-pause').innerHTML = 'Chat Paused';
    }
}

// Update the timer every second
reloadButton.addEventListener('click', LoadEmotes);
client.addListener('message', handleChat);
const intervalId = setInterval(scrollToBottom, 500);

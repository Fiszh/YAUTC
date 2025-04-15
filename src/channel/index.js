let broadcaster = 'twitch';

var url = window.location.href;

var parts = url.split('/');

if (parts[4] || is_dev_mode) {
    broadcaster = parts[parts.length - 1]
}

if (parts.length == 2) {
    broadcaster = 'twitch';
}

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";

//OTHER VARIABLES
let messageCount = 1;
let chat_max_length = 500;
let chat_with_login = false;
let tlds = new Set();
const messages = [];
let currentIndex = -1;
let tempMessage = '';
let emojiData = [];
let rateLimitRemaining = Infinity;
let rateLimitReset = 0;
let pronouns_data = [];
const corsUrls = [];
let loadedEmotes = false;
let autoScroll = true;
let last_server_nonce;

const commands = [
    "/usercard",
    "/block",
    "/unblock"
]
const mappedCommands = commands.map(command => ({ name: command })); // FOR AUTOCOMPLETION

//TMI
let tmiUsername = 'none';
let tmiConnected = false;

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

client.on("connected", async (address, port) => {
    debugChange("Twitch", "chat_connection", true);
    tmiConnected = true;

    await handleMessage(custom_userstate.Server, 'CONNECTED TO TWITCH CHAT');
});

client.on("disconnected", async (reason) => {
    debugChange("Twitch", "chat_connection", false);
    tmiConnected = false;

    await chat_alert(custom_userstate.Server, 'DISCONNECTED FROM TWITCH CHAT');
});

//TWITCH
//let userToken = `Bearer ${accessToken}` -- moved to twitchLogin.js
//let userClientId = '0' -- moved to twitchLogin.js
let channelTwitchID = '0';
let userTwitchId = '0';
let TTVChannelEmoteData = [];
let TTVGlobalEmoteData = [];
let TTVEmoteData = [];
let TTVSubBadgeData = [];
let TTVBitBadgeData = [];
let TTVGlobalBadgeData = [];
let TTVUsersData = [];
let blockedUsersData = [];
let TTVBitsData = [];
let TTVRedemsData = [];
let TTVUserRedeems = [];
let gameData = [];
let isPartner = false;

let TTVWebSocket;
let startTime;

let replying_to;
let latest_message;

let chat_settings = {
    "broadcaster_id": "",
    "slow_mode": false,
    "slow_mode_wait_time": 0,
    "follower_mode": false,
    "follower_mode_duration": 0,
    "subscriber_mode": false,
    "emote_mode": false,
    "unique_chat_mode": false
};

const twitchColors = [
    "#0000FF", // Blue
    "#8A2BE2", // Blue Violet
    "#5F9EA0", // Cadet Blue
    "#D2691E", // Chocolate
    "#FF7F50", // Coral
    "#1E90FF", // Dodger Blue
    "#B22222", // Firebrick
    "#DAA520", // Golden Rod
    "#008000", // Green
    "#FF69B4", // Hot Pink
    "#FF4500", // Orange Red
    "#FF0000", // Red
    "#2E8B57", // Sea Green
    "#00FF7F", // Spring Green
    "#9ACD32"  // Yellow Green
];

function getRandomTwitchColor(name) {
    if (!name) {
        const randomIndex = Math.floor(Math.random() * twitchColors.length);
        return twitchColors[randomIndex];
    }

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    hash = Math.abs(hash);

    const colorIndex = hash % twitchColors.length;

    return twitchColors[colorIndex];
}

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
let FFZUserBadgeData = [];

//BTTV
let BTTVWebsocket;
let BTTVGlobalEmoteData = [];
let BTTVEmoteData = [];

const BTTVZeroWidth = ['cvHazmat', 'cvMask'];

//SITE ELEMENTS
const chatInput = document.getElementById('chatInput');
const chatDisplay = document.getElementById("ChatDisplay");
const emoteButton = document.getElementById('emoteButton');
const reloadButton = document.getElementById('reloadButton');
const siteContainer = document.querySelector('.site_container');
const streamTime = document.getElementsByClassName("stream_time");
const streamTitles = document.getElementsByClassName("stream_title");
const streamAvatars = document.getElementsByClassName("stream_avatar");
const streamViewers = document.getElementsByClassName("stream_viewers");
const streamUsernames = document.getElementsByClassName("stream_username");
const streamCategories = document.getElementsByClassName("stream_category");
const autocompletion_container = document.getElementById('Emote_autocompletion');

//ADDITIONAL
let allEmoteData = [];
let ChatterinoBadgeData = [];
let link_data = [];

//CUSTOM BADGES 
let customBadgeData = [];

//CUSTOM USERSTATES 
const custom_userstate = {
    Server: { // ServerUserstate 
        "username": 'SERVER',
        "badges-raw": 'Server/1',
        "noLink": true,
        "noMention": true,
        "noEmotes": true,
        "color": "#FFFFFF"
    },
    SevenTV: { // SevenTVServerUserstate
        "username": '7TV',
        "badges-raw": '7TVServer/1',
        "noLink": true,
        "noMention": true,
        "color": "#28aba1"
    },
    BTTV: { // BTTVServerUserstate
        "username": 'BTTV',
        "badges-raw": 'BTTVServer/1',
        "noLink": true,
        "noMention": true,
        "color": "#d50014"
    },
    FFZ: { // FFZServerUserstate
        "username": 'FFZ',
        "badges-raw": 'FFZServer/1',
        "noLink": true,
        "noMention": true,
        "color": "#00a97e"
    },
    TTVAnnouncement: { // TTVAnnouncementUserstate
        "username": '',
        "badges-raw": 'NONE/1',
        "noLink": true,
        "noMention": true,
        "annoucement": true,
        "color": "#FFFFFF"
    }
}

async function handleChat(channel, userstate, message, self) {
    if (self) { console.log(userstate); }
    if (!userstate) { return; }
    if (userstate["source-room-id"]) { if ((!userSettings || userSettings['connectedChat']) && !userstate["source-room-id"].trim().includes(channelTwitchID.trim())) { return; }; };

    const blockedUser0 = blockedUsersData.find(username => username.username === userstate.username.toLowerCase());
    const blockedUser1 = blockedUsersData.find(username => username.username === userstate["display-name"].toLowerCase());

    let canHandleMessage = false;

    if ((blockedUser0 || blockedUser1) && isMod) {
        canHandleMessage = true;
        userstate.username = `(BLOCKED) ${userstate.username}`
    }

    if ((!blockedUser0 && !blockedUser1) || canHandleMessage) {
        if (userstate.color !== null && userstate.color !== undefined && userstate.color) {
            userstate.color = lightenColor(userstate.color);
        }

        const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

        foundUserCosmetics = cosmetics.user_info.find(user => user["ttv_user_id"] === userstate["user-id"]);

        if (!foundUser) {
            let userColor = userstate.color

            if (userstate.color === null || userstate.color === undefined || !userstate.color) {
                userColor = getRandomTwitchColor(userstate.username);
            }

            let user = {
                name: `@${userstate.username}`,
                color: userColor,
                cosmetics: foundUserCosmetics,
                avatar: null,
                userId: userstate["user-id"]
            };

            TTVUsersData.push(user);
        } else {
            if (foundUser.color && userstate && userstate.color) {
                foundUser.color = userstate.color
                foundUser.cosmetics = foundUserCosmetics
            }
        }

        handleMessage(userstate, message, channel);

        return;

        const foundUser1 = TTVUsersData.find(user => user.name === `@${userstate.username}`);

        let user_avatar = "imgs/user_avatar.png"

        if (userClientId !== "0" && userToken) {
            user_avatar = await getAvatarFromUserId(userstate["user-id"] || 141981764);
        }

        if (foundUser1) {
            foundUser1.avatar = user_avatar
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

async function makeLinksClickable(message) {
    if (!message) { return; }

    let hrefURL = message;

    if (!/^https?:\/\//i.test(message)) {
        hrefURL = 'http://' + message;
    }

    const regex = /^(?!.*\.$)(?!^\.).*\..+/;
    const numberNumberPattern = /^\d+\.\d+$/;

    if (!regex.test(message) || numberNumberPattern.test(message)) { return message; }

    if (tlds.size === 0) {
        if (regex.test(message) && !numberNumberPattern.test(message)) {
            if (userSettings && userSettings['phishing']) {
                message = message.toLowerCase()
            }

            let data = `<a class="chatlink" href="${hrefURL}" target="_blank" style="color: white;">${message}</a>`;

            return data
        } else {
            return message;
        }
    }

    try {
        if (hrefURL) {
            const urlParts = new URL(hrefURL);
            const domainParts = urlParts.hostname.split('.');
            const domainTld = domainParts[domainParts.length - 1].toLowerCase();

            if (tlds.has(domainTld)) {
                if (userSettings && userSettings['phishing']) {
                    message = message.toLowerCase()
                }

                let data = `<a class="chatlink" href="${hrefURL}" target="_blank" style="color: white;">${message}</a>`;

                return data
            } else {
                return message;
            }
        }
    } catch (error) {
        console.error('Error processing URL:', error);
        return message;
    }
}

async function getAllTLDs() {
    const url = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch TLD list');
        }

        const data = await response.json();
        const tldsMap = data.contents
            .split('\n')
            .filter(line => line && !line.startsWith('#'))
            .map(line => line.trim().toLowerCase());

        tlds = new Set(tldsMap);
    } catch (error) {
        console.error('Error fetching TLDs:', error);
        tlds = new Set();
    }
}

async function fetchMetaData(url) {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    let metaData = {
        title: '',
        description: '',
        url: url,
        image: '',
        themeColor: '',
        twitterCard: ''
    };

    try {
        const urlParts = new URL(url);
        const baseUrl = urlParts.origin;

        if (baseUrl && corsUrls.includes(baseUrl)) {
            return;
        }
    } catch (e) { };

    if (!userSettings || !userSettings['linkPreview']) { return metaData; }

    if (await isImage(url)) {
        metaData.image = url;
        saveMetadata(url, metaData);
        return metaData;
    }

    const existingData = link_data.find(data => data.url === url);

    if (existingData) {
        return existingData;
    }

    try {
        const response = await fetch(proxyUrl);

        if (response.ok) {
            const data = await response.json();
            const html = data.contents;

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            metaData = {
                title: doc.querySelector('meta[property="og:title"]')?.content || '',
                description: doc.querySelector('meta[property="og:description"]')?.content || '',
                url: doc.querySelector('meta[property="og:url"]')?.content || url,
                image: doc.querySelector('meta[property="og:image"]')?.content || '',
                themeColor: doc.querySelector('meta[name="theme-color"]')?.content || '',
                twitterCard: doc.querySelector('meta[name="twitter:card"]')?.content || ''
            };
        } else {
            const urlParts = new URL(url);
            const baseUrl = urlParts.origin;

            if (baseUrl) {
                corsUrls.push(baseUrl);
            }
        }
    } catch (error) {
        const urlParts = new URL(url);
        const baseUrl = urlParts.origin;

        if (baseUrl) {
            corsUrls.push(baseUrl);
        }

        console.error(error);
    }

    saveMetadata(url, metaData);
    return metaData;
}

async function isImage(url) {
    try {
        const response = await fetch(url, {
            method: 'HEAD'
        });

        const contentType = response.headers.get('Content-Type');

        return contentType && contentType.startsWith('image/');
    } catch (error) {
        const urlParts = new URL(url);
        const baseUrl = urlParts.origin;

        if (baseUrl) {
            corsUrls.push(baseUrl);
        }

        console.error('Error checking URL:', error);
        return false;
    }
}

function saveMetadata(url, metaData) {
    const existingData = link_data.find(data => data.url === url);
    if (!existingData) {
        link_data.push(metaData);
    }
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

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function findEntryAndTier(prefix, bits) {
    prefix = prefix.toLowerCase();

    for (let entry of TTVBitsData) {
        if (entry.name.toLowerCase() !== prefix) continue;

        for (let i = 0; i < entry.tiers.length; i++) {
            let currentTier = entry.tiers[i];
            let nextTier = entry.tiers[i + 1];

            if (!nextTier && bits >= currentTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }

            if (bits >= currentTier.min_bits && bits < nextTier.min_bits) {
                return { name: entry.name, tier: currentTier };
            }
        }
    }

    return null;
}

function splitTextWithTwemoji(text) {
    const parsedText = twemoji.parse(text, {
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
        folder: 'svg',
        ext: '.svg'
    });

    const div = document.createElement('div');
    div.innerHTML = parsedText;

    const result = [];
    const nodes = div.childNodes;

    nodes.forEach(node => {
        if (node.nodeName === 'IMG') {
            if (node.getAttribute('src')) {
                result.push({ emoji: node.getAttribute('alt'), image: node.getAttribute('src') });
            } else {
                result.push(...node.textContent.split(" ").filter(word => word.trim() !== ""));
            }
        } else if (node.nodeType === 3) {
            result.push(...node.textContent.split(" ").filter(word => word.trim() !== ""));
        }
    });

    return result;
}

function sanitizeInput(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/(<)(?!3)/g, "&lt;")
        .replace(/(>)(?!\()/g, "&gt;");
}

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate) {
    if (!inputString) { return inputString }

    updateAllEmoteData();

    inputString = sanitizeInput(inputString);

    try {
        const ttvEmoteData = TTVMessageEmoteData

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

        let EmoteSplit = await splitTextWithTwemoji(inputString);

        let foundMessageSender = TTVUsersData.find(user => user.name === `@${userstate?.username}`);

        let foundParts = [];
        const replacedParts = [];

        for (let part of EmoteSplit) {
            let foundEmote;
            let foundUser;

            // Prioritize custom emotes
            if (userstate?.["custom_emotes"]) {
                foundEmote = userstate["custom_emotes"].find(emote => emote.name && part === emote.name);
            }

            // Detect emoji
            if (!foundEmote && part.emoji && emojiData.length > 0) {
                const unifiedPart = await decodeEmojiToUnified(part.emoji);
                for (const emoji of emojiData) {
                    if (emoji.emoji && emoji.unified && unifiedPart == emoji.unified) {
                        foundEmote = emoji;
                        emoteType = emoji.site;

                        // Fix image url
                        if (part.image) {
                            foundEmote.url = part.image
                            foundEmote.emote_link = part.image
                        };

                        break;
                    }
                }
            }

            if (!foundEmote && part.emoji) {
                part = part.emoji;
            }

            // Detect bits
            if (!foundEmote && (userstate && userstate['bits'])) {
                let match = part.match(/^([a-zA-Z]+)(\d+)$/);

                if (match) {
                    let prefix = match[1]; // Prefix
                    let bits = match[2]; // Amount

                    let result = findEntryAndTier(prefix, bits);

                    if (result) {
                        foundEmote = {
                            name: result.name,
                            url: result.tier.url,
                            site: 'TTV',
                            color: result.tier.color,
                            bits: `<div class="bits-number">${bits}</div>`
                        };
                    }
                }
            }

            // Other emotes
            if (!foundEmote && !userstate?.["noEmotes"]) {
                foundEmote = ttvEmoteData.find(emote => emote.name && part === sanitizeInput(emote.name)) ||
                    foundMessageSender?.cosmetics?.personal_emotes?.find(emote => emote.name && part === emote.name) ||
                    [...nonGlobalEmoteData, ...allEmoteData].find(emote => emote.name && part === sanitizeInput(emote.name));
            }

            // Search for user if no emote is found
            if (!foundEmote && !userstate?.["noMention"]) {
                foundUser = TTVUsersData.find(user => {
                    const userName = user.name.toLowerCase();
                    return [userName, userName.slice(1), `${userName},`, `${userName.slice(1)},`].some(val => part.toLowerCase() == val);
                });
            }

            if (foundEmote) {
                if (foundEmote?.bits) {
                    foundParts.push({
                        "type": "bits",
                        "bits": foundEmote,
                    });
                } else {
                    if (!foundParts.length || foundParts[foundParts.length - 1]?.type !== "emote" || foundEmote?.flags !== 256) {
                        foundParts.push({
                            "type": "emote",
                            "primary": foundEmote,
                            "overlapped": []
                        });
                    } else {
                        const overlappedArray = foundParts[foundParts.length - 1].overlapped;
                        overlappedArray.push({ ...foundEmote, "overlap_index": overlappedArray.length });
                    }
                }
            } else if (foundUser) {
                foundParts.push({
                    "type": "user",
                    "input": part,
                    "user": foundUser,
                });
            } else {
                foundParts.push({
                    "type": "other",
                    "other": part,
                });
            }
        }

        for (const part of foundParts) {
            switch (part["type"]) {
                case 'emote':
                    let emoteHTML = "";

                    const primary = part["primary"];
                    const overlappedNames = part["overlapped"].slice(0, 4).map(overlapped => overlapped.name).join(', ');

                    const tooltipName = overlappedNames ? `${primary.name}, ${overlappedNames}` : primary.name;

                    emoteHTML += `<span class="emote-wrapper" tooltip-name="${tooltipName}" tooltip-type="${primary?.site || ""}" tooltip-creator="${primary?.creator || ""}" tooltip-image="${primary.url}">
                        <img src="${primary?.url || ''}" alt="${primary?.name || ''}" class="emote${primary?.emoji ? ' emoji' : ''}">`;

                    if (part["overlapped"].length) {
                        emoteHTML += part["overlapped"]
                            .map(overlapped => `<img src="${overlapped?.url || ''}" alt="${overlapped?.name || ''}" class="emote">`)
                            .join('\n');
                    }

                    replacedParts.push(`${emoteHTML}\n</span>`);

                    break;
                case 'bits':
                    const bitsInfo = part["bits"];

                    const bitsHTML = `<span class="bits-wrapper" style="color:${bitsInfo?.color || 'white'}">
                                <img src="${bitsInfo?.url || ''}" alt="${bitsInfo?.name || ''}" class="emote">
                                ${bitsInfo?.bits || ''}
                        </span>`;

                    replacedParts.push(bitsHTML);

                    break;
                case 'user':
                    const userHTML = `<span class="name-wrapper">
                            <strong style="color: ${part["user"].color}">${part["input"]}</strong>
                        </span>`;

                    replacedParts.push(userHTML);

                    break;
                case 'other':
                    let otherHTML = part["other"];

                    if (otherHTML && typeof otherHTML === "string") {
                        otherHTML = twemoji.parse(part["other"], {
                            base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                            folder: 'svg',
                            ext: '.svg',
                            className: 'twemoji'
                        });
                    }

                    if (!userstate?.["noLink"] && otherHTML == part["other"]) {
                        otherHTML = await makeLinksClickable(otherHTML);
                    }

                    replacedParts.push(otherHTML);

                    break;
                default:
                    return inputString;
            }
        }

        // MENTIONS IN TITLE
        let mentionsInTitle = [];

        if (userstate && userstate["title"]) {
            for (let i = 0; i < replacedParts.length; i++) {
                let part = replacedParts[i];

                if (part && typeof part === "string") {
                    if (part.startsWith("@") && part.length > 2 && part.length <= 25) {
                        const username = part.replace('@', '').replace(',', '');

                        if (/^[A-Za-z0-9_]+$/.test(username)) {
                            mentionsInTitle.push({ name: username, placement: i });
                        }
                    }
                }
            }
        }

        mentionsInTitle = mentionsInTitle.slice(0, 10);

        if (mentionsInTitle.length > 0) {
            for (const mention of mentionsInTitle) {
                let user = [];

                if (userSettings["mentionColor"]) {
                    user = await getTTVUser(mention.name);
                }

                replacedParts[mention.placement] = `<a href="${window.location.protocol}//${window.location.host}/YAUTC/#/${mention.name}" style="color:${!userSettings["mentionColor"] ? "#FFFFFF" : lightenColor(await getUserColorFromUserId(user.data[0].id))}; text-decoration: none; font-weight: bold;">${replacedParts[mention.placement]}</a>`;

                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return replacedParts.join(' ');
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
        //console.log('Invalid input format:', emoteString);
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

async function checkUsernameVariations(message, tmiUsername) {
    const variations = [
        `@${tmiUsername}`,
        tmiUsername,
        `${tmiUsername},`,
        `@${tmiUsername},`
    ];

    const checks = await Promise.all(
        variations.map(variation =>
            new RegExp(`\\b${variation}\\b`, 'i').test(message)
        )
    );

    return checks.some(Boolean);
}

async function trimPart(text) {
    if (text) {
        return text.trim()
    } else {
        return text
    }
}

function getRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `#${randomColor.padStart(6, '0')}`;
}

function isArabic(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
}

function generateNonce() {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

async function handleMessage(userstate, message, channel) {
    if (!userstate || !message) { return; }

    message = String(message).trimStart();
    message = sanitizeInput(message);

    const tagsReplaced = message;

    //if (message === 'ResponseNotNeededForThisCommand') { return; }
    if (channel && channel.toLowerCase().replace('#', '') === broadcaster) {
        onMessage(userstate, message)
    }

    if (messageCount === 0) {
        messageCount = 1
    } else if (messageCount === 1) {
        messageCount = 0
    }

    const messageElement = document.createElement("div");

    let username = await trimPart(userstate.username);
    let displayname = await trimPart(userstate["display-name"]);
    let finalUsername = await trimPart(userstate.username);
    const message_id = userstate.id || "0"
    const message_nonce = generateNonce() || "0"

    const replyDisplayName = userstate['reply-parent-display-name'];
    const replyUserLogin = userstate['reply-parent-user-login'];

    let isUsernameMentioned = await checkUsernameVariations(message, tmiUsername);
    let isUsernameMentionedInReplyBody;

    let message_label = '';
    let rendererMessage = tagsReplaced;
    let has_margin = true

    const currentTime = new Date();

    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    let seconds = currentTime.getSeconds();

    hours = hours < 10 ? `0${hours}` : hours;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;

    if (username && displayname) {
        if (username.toLowerCase() == displayname.toLowerCase()) {
            finalUsername = `${displayname}:`
        } else {
            finalUsername = `${username} (${displayname}):`
        }
    }

    if (userstate && userstate['reply-parent-msg-body'] && !isUsernameMentioned) {
        isUsernameMentionedInReplyBody = await checkUsernameVariations(userstate['reply-parent-msg-body'], tmiUsername);
    }

    messageElement.setAttribute("message_id", message_id);
    messageElement.setAttribute("message_nonce", message_nonce);
    messageElement.setAttribute("sender", username);

    let messageHTML = `<div class="message-text">
                                <span class="name-wrapper" tooltip-name="${finalUsername.replace(":", "")}" tooltip-type="User" tooltip-creator="" tooltip-image="">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${rendererMessage}
                        </div>`;

    // Check the number of child elements and remove excess
    if (chatDisplay.children.length >= chat_max_length) {
        chatDisplay.removeChild(chatDisplay.firstChild);
    }

    // Append the new message element
    chatDisplay.appendChild(messageElement);

    if (((isUsernameMentioned || isUsernameMentionedInReplyBody) && (!userstate.noMention && !TTVUserRedeems[userstate.username])) && tmiUsername !== "none") {
        if (tmiUsername !== userstate.username) {
            if (isUsernameMentioned) {
                const audio = new Audio('sounds/mention.mp3');
                audio.play();
            } else if (isUsernameMentionedInReplyBody) {
                const audio = new Audio('sounds/mention_reply.mp3');
                audio.play();
            }
        }

        messageElement.classList.add('message-mention');
    } else if (userstate['first-msg']) {
        messageElement.classList.add('message-first');
    } else if (userstate === custom_userstate.TTVAnnouncement || userstate["annoucement"]) {
        messageElement.classList.add('message-announcement');

        if (userstate.username && userstate.username !== "") {
            has_margin = false
        }
    }

    if (userstate['bits']) {
        userstate["message_label"] = '#660061';

        const parts = message.split(" ");

        let highestTier = { color: '#660061', level: 0 };

        for (const part of parts) {
            let match = part.match(/^([a-zA-Z]+)(\d+)$/);

            if (match) {
                let prefix = match[1]; // Prefix
                let bits = match[2]; // Amount

                let result = findEntryAndTier(prefix, bits);

                if (result.tier.color && Number(bits) && Number(bits) > highestTier.level) {
                    highestTier = { color: result.tier.color, level: Number(bits) };
                }
            }
        }

        if (highestTier.color) {
            userstate["message_label"] = highestTier.color;
        }
    }

    if (!userstate.backgroundColor && !TTVUserRedeems[userstate.username]) {
        if (messageCount === 0) {
            messageElement.classList.add('message-even');
        } else if (messageCount === 1) {
            messageElement.classList.add('message-odd');
        }
    } else {
        messageElement.classList.add('message-even');

        let backgroundColor;

        if (userstate.backgroundColor) {
            backgroundColor = userstate.backgroundColor;
        }

        messageElement.style.backgroundColor = backgroundColor;
    }

    if (userSettings && userSettings['arabic']) {
        if (isArabic(message)) {
            messageElement.setAttribute('dir', 'rtl');
            messageElement.setAttribute('lang', 'ar');
        }
    }

    if (TTVUserRedeems[userstate.username]) {
        let redeem_info = TTVUserRedeems[userstate.username];
        userstate["message_label"] = redeem_info;

        if (redeem_info == "highlight") {
            userstate["message_label"] = "#41c0c0";

            messageElement.classList = "message-highlight";
        }

        delete TTVUserRedeems[`${username}`];
    }

    if (userstate["message_label"]) {
        message_label = `<div class="message-label" style="background-color: ${userstate["message_label"]}"></div>`;
    }

    let TTVMessageEmoteData = [];

    if (userstate.emotes && userstate.emotes !== "" && Object.keys(userstate.emotes).length > 0) {
        userstate.emotes = await extractEmoteSubstring(userstate.emotes);

        const graphemes = [...message];

        TTVMessageEmoteData = Object.entries(userstate.emotes).flatMap(([emoteId, positions]) =>
            positions.map(position => {
                let [start, end] = position.split('-').map(Number);

                while (graphemes[start] === ' ' && start < end) {
                    start += 1;
                    end += 1;
                }

                const name = graphemes.slice(start, end + 1).join('');

                return {
                    name: name,
                    url: `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`,
                    site: 'Twitch Emote'
                };
            })
        );
    }

    // Remove @ from reply

    if (replyDisplayName || replyUserLogin) {
        const escapedDisplayName = replyDisplayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedUserLogin = replyUserLogin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usernamePattern = new RegExp(`@(${escapedDisplayName}|${escapedUserLogin})(,\\s?)?`, 'i');
        message = message.replace(usernamePattern, '').trimStart();
    }

    let badges = [];

    // CUSTOM BADGES

    customBadgeData.forEach(custom_badge => {
        if (custom_badge.users.includes(userstate["user-id"]) || userstate["user-id"] == "185965290") {
            badges.push({
                tooltip_name: custom_badge.title,
                badge_url: custom_badge.url,
                type: custom_badge.type || "YAUTC Badge",
                alt: custom_badge.title,
                background_color: undefined,
            });
        }
    });

    // TWITCH BADGES

    if (userstate['badges-raw'] && Object.keys(userstate['badges-raw']).length > 0) {
        let rawBadges = userstate['badges-raw'];
        let badgesSplit = rawBadges.split(',');

        for (const Badge of badgesSplit) {
            let badgeSplit = Badge.split("/");

            if (badgeSplit[0] === 'subscriber') {
                if (userstate.badges) {
                    if (userstate.badges.subscriber) {
                        const badge = TTVSubBadgeData.find(badge => badge.id === userstate.badges.subscriber);

                        if (badge) {
                            badges.push({
                                tooltip_name: badge.title,
                                badge_url: badge.url,
                                type: badge.type || "Twitch Badge",
                                alt: badge.title,
                                background_color: undefined,
                                set: badge?.set || undefined
                            });

                            continue;
                        }
                    }
                }
            } else if (badgeSplit[0] === "bits") {
                if (userstate.badges.bits) {
                    const badge = TTVBitBadgeData.find(badge => badge.id === userstate.badges.bits);

                    if (badge) {
                        badges.push({
                            tooltip_name: badge.title,
                            badge_url: badge.url,
                            type: badge.type || "Twitch Badge",
                            alt: badge.title,
                            background_color: undefined,
                            set: badge?.set || undefined
                        });

                        continue;
                    }

                }
            }

            const badge = TTVGlobalBadgeData.find(badge => badge.id === `${badgeSplit[0]}_${badgeSplit[1]}`);

            if (badge && badge.id) {
                if (badge.id === "moderator_1" && FFZUserBadgeData["mod_badge"]) {
                    badges.push({
                        tooltip_name: "Moderator",
                        badge_url: FFZUserBadgeData["mod_badge"],
                        type: "FFZ Custom Badge",
                        alt: "Moderator",
                        background_color: "#00ad03",
                    });

                    continue;
                }

                if (badge.id === "vip_1" && FFZUserBadgeData["vip_badge"]) {
                    badges.push({
                        tooltip_name: "VIP",
                        badge_url: FFZUserBadgeData["vip_badge"],
                        type: "FFZ Custom Badge",
                        alt: "VIP",
                        background_color: "#e005b9",
                    });

                    continue;
                }
            }

            if (badge) {
                badges.push({
                    tooltip_name: badge.title,
                    badge_url: badge.url,
                    type: badge.type || "Twitch Badge",
                    alt: badge.title,
                    background_color: undefined,
                    set: badge?.set || undefined
                });
            }
        }
    }

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    // Chatterino Badges -- not going to be used due to cors

    const foundChatterinoBadge = ChatterinoBadgeData.find(badge => badge.owner_id == userstate["user-id"]);

    if (foundChatterinoBadge) {
        badges.push({
            tooltip_name: foundChatterinoBadge.title,
            badge_url: foundChatterinoBadge.url,
            alt: foundChatterinoBadge.title,
            background_color: undefined,
        });
    }

    // FFZ Badges

    const foundFFZBadges = FFZBadgeData.filter(badge => badge.owner_username == userstate.username);

    foundFFZBadges.forEach(foundFFZBadge => {
        badges.push({
            tooltip_name: foundFFZBadge.title,
            badge_url: foundFFZBadge.url,
            type: "FFZ Badge",
            alt: foundFFZBadge.title,
            background_color: foundFFZBadge.color,
        });
    });

    if (FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate.username]) {
        const ffz_url = `https://cdn.frankerfacez.com/badge/${FFZUserBadgeData["user_badges"][userstate.username]}/4`;

        const foundBadge = FFZBadgeData.find(badge => badge.url === ffz_url);
        const isThere = badges.find(badge => badge.badge_url === ffz_url);

        if (!isThere) {
            badges.push({
                tooltip_name: foundBadge.title,
                badge_url: foundBadge.url,
                type: "FFZ Channel Badge",
                alt: foundBadge.title,
                background_color: foundBadge.color,
            });
        }
    }

    // 7tv Badges

    if (foundUser && foundUser.cosmetics && foundUser.cosmetics["badge_id"]) {
        const foundBadge = cosmetics.badges.find(Badge => Badge.id === foundUser.cosmetics["badge_id"]);

        if (foundBadge) {
            badges.push({
                tooltip_name: foundBadge.title,
                badge_url: foundBadge.url,
                type: "7TV Badge",
                alt: foundBadge.title,
                background_color: undefined,
            });
        }
    }

    badges = badges.filter((badge, index, self) =>
        index === self.findIndex(b => b.badge_url === badge.badge_url)
    );

    let badges_html = badges
        .map(badge => {
            const isSubscriber = ["subscriber", "founder"].includes(badge?.set?.toLowerCase());
            const subscriberMonths = userstate["badge-info"]?.subscriber || userstate["badge-info"]?.founder || 0;
            const tooltipName = isSubscriber && subscriberMonths > 0
                ? `${badge.tooltip_name} (${subscriberMonths} ${Number(subscriberMonths) === 1 ? 'month' : 'months'})`
                : badge.tooltip_name;

            return `<span class="badge-wrapper" tooltip-name="${tooltipName}" tooltip-type="${badge.type || "Badge"}" tooltip-creator="" tooltip-image="${badge.badge_url}">
            <img style="background-color: ${badge.background_color || 'transparent'};" src="${badge.badge_url}" alt="${badge.alt}" class="badge" loading="lazy">
        </span>`;
        })
        .join("");

    if (userstate["noBadge"]) {
        badges_html = "";
    }

    if (userSettings && userSettings['msgBold']) {
        rendererMessage = `<strong>${tagsReplaced}</strong>`;
    }

    messageHTML = `<div class="message-text">
                            ${message_label}
                            ${badges_html}
                                <span class="name-wrapper" tooltip-name="${finalUsername.replace(":", "")}" tooltip-type="User" tooltip-creator="" tooltip-image="">
                                    <strong id="username-strong">${finalUsername}</strong>
                                </span>
                            ${rendererMessage}
                        </div>`;

    messageElement.innerHTML = messageHTML;

    let messageDiv = messageElement.querySelector('.message-text');

    if (messageDiv && (userSettings && userSettings["msgTime"])) {
        messageDiv.insertAdjacentHTML('beforeend', `<text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>`);
    }

    if (message_label !== "") {
        messageElement.style.paddingLeft = '8px';
    }

    if (!has_margin || message_label !== "") {
        messageElement.style.marginBottom = '0px';
    } else {
        messageElement.style.marginBottom = '5px';
    }

    // Display emotes

    let results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);

    rendererMessage = results;

    if (userSettings && userSettings['msgBold']) {
        rendererMessage = `<strong>${results}</strong>`;
    }

    let prefix = '';

    // Was used at the start of the connected chats feature
    if (channel && channel.toLowerCase().replace('#', '') !== broadcaster) {
        //prefix = `<text class="time" style="color: rgba(255, 255, 255, 0.7);">(${channel})</text>`
    }

    let reply = '';
    const replyUser = TTVUsersData.find(user => user.name.trim() === `@${userstate['reply-parent-user-login']}`);

    if (userstate['reply-parent-msg-body']) {
        let replyColor = 'white';
        let replyPrefix = '';

        if (replyUser && replyUser.color) {
            replyColor = replyUser.color || 'white';
        }

        const replyMessage = sanitizeInput(userstate['reply-parent-msg-body']);
        const limitedReply = replyMessage && replyMessage.length > 45
            ? replyMessage.slice(0, 45) + '...'
            : replyMessage;

        if (userstate && userstate['reply-parent-msg-body'] && !isUsernameMentioned) {
            if (isUsernameMentionedInReplyBody) {
                replyPrefix = " (Mentioned)";
            }
        }

        reply = `<div class="reply"><img src="imgs/msgReply.png" loading="lazy"> <text class="replying_to" style="color: rgba(255, 255, 255, 0.1);">Replying to${replyPrefix}</text> <text class="replying_to" style="color: ${replyColor};"><strong>@${userstate['reply-parent-user-login']}:</strong></text> ${limitedReply} </div>`
    }

    let finalMessageHTML = `<div class="message-text">
                                ${message_label}
                                ${prefix} ${reply} ${badges_html}
                                    <span class="name-wrapper" tooltip-name="${finalUsername.replace(":", "")}" tooltip-type="User" tooltip-creator="" tooltip-image="">
                                        <strong id="username-strong" style="color: ${!userstate?.color ? getRandomTwitchColor(finalUsername.replace(":", "")) : lightenColor(userstate?.color) || "#FFFFFF"}">${finalUsername}</strong>
                                    </span>
                                ${rendererMessage}
                            </div>`;

    messageElement.innerHTML = finalMessageHTML;

    messageDiv = messageElement.querySelector('.message-text');

    try {
        if (messageDiv) {
            const existingTime = messageDiv.querySelector(".time");

            if (!existingTime && (userSettings && userSettings["msgTime"])) {
                messageDiv.insertAdjacentHTML('beforeend', `<text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>`);
            }

            if (message_id != "0" && (userSettings && userSettings["replyButton"])) {
                const existingForm = messageDiv.querySelector("#reply-button-wrapper");

                if (existingForm) {
                    existingForm.remove();
                }

                const formHTML = `<form style="display: inline;" onsubmit="reply_to('${message_id}', '${userstate["username"]}'); return false;" id="reply-button-wrapper">
                                    <input type="image" src="imgs/reply_button.png" alt="reply" width="25" height="25" loading="lazy">
                                  </form>`;

                messageDiv.insertAdjacentHTML('beforeend', formHTML);
            }
        }
    } catch (error) { };

    if (message_label !== "") {
        messageElement.style.paddingLeft = '8px';
    }

    if (!has_margin || message_label !== "") {
        messageElement.style.marginBottom = '0px';
    } else {
        messageElement.style.marginBottom = '5px';
    }

    // Display paints
    if (userSettings['paints']) {
        var usernames = messageElement.querySelectorAll('.name-wrapper');

        if (usernames && usernames.length > 0) {
            for (const element of usernames) {
                const strongElement = element.querySelector('strong');

                if (strongElement) {
                    const name = `@${strongElement.innerHTML.replace(/[@,:]|\s*\(.*\)/g, '')}`.toLowerCase()

                    const foundUser = TTVUsersData.find(user => user.name === name);

                    if (foundUser?.cosmetics) {
                        await displayCosmeticPaint(foundUser.userId, foundUser.color, strongElement);
                    }
                }
            }
        }
    }

    var chatlinks = messageElement.querySelectorAll('a.chatlink');

    if (chatlinks && chatlinks.length > 0) {
        for (const element of chatlinks) {
            const hrefValue = element.getAttribute('href');

            if (hrefValue) {
                const linkInfo = await fetchMetaData(hrefValue);

                if (linkInfo) {
                    element.setAttribute('tooltip-name', String(linkInfo["title"]));
                    element.setAttribute('tooltip-type', String(linkInfo["description"]));
                    element.setAttribute('tooltip-creator', String(`URL: ${hrefValue}`));
                    element.setAttribute('tooltip-image', String(linkInfo["image"]));

                    element.classList.remove('chatlink');
                    element.classList.add('chat_link');
                }
            }
        }
    }
}

async function reply_to(message_id, username) {
    if (message_id !== '0') {
        chatInput.focus();

        const chatReplies = document.querySelectorAll('.chat-reply');
        chatReplies.forEach(chatReply => {
            if (!chatReply) { return; }

            const replyInfo = chatReply.querySelector('#reply_info');
            const closeButton = chatReply.querySelector('#close-button');

            chatReply.style.display = "flex";

            if (!closeButton || !replyInfo) { return; }

            replying_to = message_id;

            replyInfo.innerHTML = `Replying to @${username}`;
        });
    } else {
        const chatReplies = document.querySelectorAll('.chat-reply');
        chatReplies.forEach(chatReply => {
            if (!chatReply) { return; }
            chatReply.style.display = "none";
        });

        replying_to = undefined;
    }
}

async function chat_alert(userstate, message) {
    if ((!userSettings || !userSettings['chatDebug']) && !is_dev_mode) { return false; }

    await handleMessage(userstate, message)
}

async function is_beta_tester() {
    if ((!userSettings || !userSettings['betaTest']) && !is_dev_mode) { return false; }

    return true;
}

async function waitForUserData() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (userClientId && userClientId !== 0 && userToken && accessToken) {
                clearInterval(interval);
                resolve({
                    userClientId,
                    userToken,
                    accessToken
                });
            }
        }, 100);
    });
}

async function pushUserData(userData) {
    try {
        const user7TV_id = await get7TVUserID(userData.data[0].id)

        let user = {
            name: `@${userData.data[0].login}`,
            color: await getUserColorFromUserId(userData.data[0].id || 141981764) || getRandomTwitchColor(userData.data[0].login),
            cosmetics: await pushCosmeticUserUsingGQL(user7TV_id),
            avatar: userData.data[0]["profile_image_url"].replace("300x300", "600x600"),
            userId: userData.data[0].id
        };

        if (user && user.cosmetics && user.cosmetics.avatar_url) {
            const imgElement = document.querySelector('.user_avatar');

            imgElement.src = user.cosmetics.avatar_url
        };

        TTVUsersData.push(user);

        if (user7TV_id) {
            notifyWebSocket(user7TV_id, channelTwitchID);
            setInterval(() => {
                notifyWebSocket(user7TV_id, channelTwitchID);
            }, 300000);
        }
    } catch (error) {
        console.error(error)
    }
}

function getBestImageUrl(badge) {
    const sizes = ["4x", "3x", "2x", "1x"];

    for (let size of sizes) {
        if (badge.imgs.animated && badge.imgs.animated[size]) {
            return badge.imgs.animated[size];
        }
        if (badge.imgs.static && badge.imgs.static[size]) {
            return badge.imgs.static[size];
        }
    }
    return null;
}

async function loadCustomBadges() {
    const response = await fetch('https://api.github.com/gists/7f360e3e1d6457f843899055a6210fd6');

    if (!response.ok) { return; };

    let data = await response.json();

    if (!data["files"] || !data["files"]["badges.json"] || !data["files"]["badges.json"]["content"]) { return; };

    data = JSON.parse(data["files"]["badges.json"]["content"]);

    if (!data || !data["YAUTO"]) { return; };

    customBadgeData = [
        ...data["YAUTO"],
        ...data["YAUTC"]
    ].map(badge => ({
        ...badge,
        url: getBestImageUrl(badge)
    }));
}

async function connectTmi() {
    await chat_alert(custom_userstate.Server, 'CONNECTING TO TWITCH CHAT')

    // SETTINGS CONNECT TO CHAT WITH
    if (userSettings && userSettings['twitchLogin'] && userToken) {
        client.opts.identity = {
            username: tmiUsername,
            password: `oauth:${userToken.replace('Bearer ', '')}`
        };
    }

    if (!tmiConnected) {
        try {
            await client.connect();
            console.log('Successfully connected to Twitch chat!');
        } catch (error) {
            await handleMessage(custom_userstate.Server, 'FAILED CONNECTING TO TWITCH CHAT (CHECK THE CONSOLE FOR MORE INFO)');
            console.error(error);
        }
    } else {
        console.log('Already connected to Twitch chat. Skipping connection attempt.');
    }
}

async function Load() {
    loadCustomBadges();
    getPronous();

    try {
        getAllTLDs();
    } catch (error) { }

    if (tmiConnected) {
        try {
            await client.disconnect();
            await chat_alert(custom_userstate.Server, 'LOADING');
        } catch (error) {
            console.error("Error while disconnecting:", error);
            await chat_alert(custom_userstate.Server, 'LOADING');
        }
    } else {
        console.log('Client is not connected. Skipping disconnect.');
        await chat_alert(custom_userstate.Server, 'LOADING');
    }

    // TTV
    if (!is_dev_mode) {
        if (getCookie('twitch_client_id')) {
            userClientId = getCookie('twitch_client_id');
        } else {
            handleMessage(custom_userstate.Server, "If you'd like to chat or see live updates like title or category changes, please log in with your Twitch account.");
        }

        if (getCookie('twitch_access_token')) {
            userToken = `Bearer ${getCookie('twitch_access_token')}`;
        } else {
            if (userClientId !== "0") {
                handleMessage(custom_userstate.Server, "Unable to retrieve your access token. Please refresh the page or log in again.");
                return;
            }
        }
    } else {
        await waitForUserData();
    }

    //console.log(`client-id ${userClientId}`)
    //console.log(`user-token ${userToken}`)

    //get user
    if (userClientId !== "0" && userToken) {
        const userData = await getTTVUser();
        if (userData && userData.data && userData.data.length > 0) {
            userTwitchId = userData.data[0].id;
            tmiUsername = userData.data[0].login;

            const imgElement = document.querySelector('.user_avatar');

            imgElement.src = userData.data[0]["profile_image_url"].replace("300x300", "600x600");

            console.log(`Your user-id: ${userTwitchId}`);
            console.log(`Your username ${tmiUsername}`);
            console.log(`Your avatar-url ${userData.data[0]["profile_image_url"].replace("300x300", "600x600")}`);

            LoadFollowlist();

            pushUserData(userData);

            debugChange("Twitch", "user_profile", true);
        } else {
            debugChange("Twitch", "user_profile", false);

            console.log('User not found or no data returned');
        }
    }

    //TMI
    connectTmi();

    //get broadcaster and broadcast
    if (userClientId !== "0" && userToken) {
        const broadcasterUserData = await getTTVUser(broadcaster);
        if (broadcasterUserData && broadcasterUserData.data && broadcasterUserData.data.length > 0) {
            channelTwitchID = broadcasterUserData.data[0].id;
            console.log(`Broadcaster user-id: ${channelTwitchID}`);
        } else {
            console.log('User not found or no data returned');
        };

        if (broadcasterUserData.data[0]?.display_name.toLowerCase() == broadcasterUserData.data[0]?.login.toLowerCase()) {
            document.title = `${broadcasterUserData.data[0].display_name} - YAUTC`;
        } else {
            document.title = `${broadcasterUserData.data[0].login} - YAUTC`;
        }

        if (broadcasterUserData.data[0]?.broadcaster_type == "partner") {
            isPartner = true;
        } else {
            isPartner = false; // Here in case if the streamer ever loses the partner badge and user uses the reload function
        }

        await fetchTTVChannelEmoteData();

        // Load broadcast info
        update();
        updateViewerAndStartTme();

        chat_settings = await getChatSettings();

        updateChatSettings();

        await fetchTTVGlobalEmoteData();
        await fetchTTVEmoteData();
        await fetchTTVBitsData();
        await getBadges();
        await getBlockedUsers();
    } else {
        const broadcasterUserData = await getTwitchUser(broadcaster);
        if (broadcasterUserData && Object.keys(broadcasterUserData).length > 0) {
            channelTwitchID = broadcasterUserData.id;
            console.log(`Broadcaster user-id: ${channelTwitchID}`);
        } else {
            console.log('User not found or no data returned');
        }

        if (broadcasterUserData?.displayName.toLowerCase() == broadcasterUserData?.login.toLowerCase()) {
            document.title = `${broadcasterUserData.displayName} - YAUTC`;
        } else {
            document.title = `${broadcasterUserData.login} - YAUTC`;
        }

        if (broadcasterUserData?.roles?.isPartner) {
            isPartner = true;
        } else {
            isPartner = false;
        }

        const streamInfo = await parseStreaminfo(broadcasterUserData);

        TTVChannelEmoteData = await getTwitchChannelEmotes(broadcasterUserData.login);

        // Load broadcast info
        update(streamInfo);
        updateViewerAndStartTme(streamInfo);

        await getTwitchBadges();
    }

    // Emojis
    mapEmojis();

    // SevenTV
    loadSevenTV();

    // BTTV
    loadBTTV();

    // FFZ
    loadFFZ();

    console.log('LOADED!');

    loadedEmotes = true;

    await chat_alert(custom_userstate.Server, 'LOADED');

    if (userClientId !== "0" && userToken) {
        subscribeToTwitchEvents();
        setInterval(getBlockedUsers, 10000);
        setInterval(updateViewerAndStartTme, 10000);
    }

    getRedeems();
}

// No token needed

async function getColorName(hex) {
    if (hex.startsWith("#")) {
        hex = hex.replace("#", "");
    } else {
        return 'Blank ';
    }

    const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);

    if (!response.ok) {
        return 'Error getting name color ';
    }

    const data = await response.json();

    return `${data?.["name"]?.["value"] || "Blank"} `;
}

async function getPronous() {
    const response = await fetch(`https://pronouns.alejo.io/api/pronouns`);

    if (!response.ok) {
        debugChange("pronouns.alejo.io", "pronouns_data", false);
        return;
    }

    debugChange("pronouns.alejo.io", "pronouns_data", true);

    pronouns_data = await response.json();
}

async function getRedeems() {
    const GQLbody = `
        query ChannelPointsContext($channelLogin: String!) {
            community: user(login: $channelLogin) {
                channel {
                    communityPointsSettings {
                        name
                        image {
                            url
                            url2x
                            url4x
                        }
                        customRewards {
                            id
                            backgroundColor
                            cost
                            defaultImage {
                                url
                                url2x
                                url4x
                            }
                            image {
                                url
                                url2x
                                url4x
                            }
                            prompt
                            title
                        }
                    }
                }
            }
        }
    `;

    const variables = {
        channelLogin: broadcaster,
    };

    if (!version) {
        version = await getVersion() // IMPORTANT
    }

    const data = await sendGQLRequest(GQLbody, variables);

    const pointsInfo = data.data.community.channel.communityPointsSettings

    TTVRedemsData.title = pointsInfo.name || 'Points'
    TTVRedemsData.image = pointsInfo.image?.url4x || pointsInfo.image?.url

    TTVRedemsData.redeems = pointsInfo.customRewards.map(redeem => ({
        id: redeem.id,
        color: redeem.backgroundColor,
        cost: redeem.cost.toLocaleString(),
        image: redeem.image?.url4x || redeem.image?.url || redeem.defaultImage?.url4x || redeem.defaultImage?.url,
        prompt: redeem.prompt,
        title: redeem.title
    }));
}

async function updateChatSettings() {
    const chatSettings = document.querySelectorAll('.chat-settings');
    chatSettings.forEach(chatSetting => {
        if (!chatSetting) { return; }

        const parts = [];

        if (chat_settings.slow_mode) {
            if (chat_settings.slow_mode == 0) {
                parts.push(`Slow`);
            } else {
                parts.push(`Slow (${chat_settings.slow_mode_wait_time}s)`);
            }
        }
        if (chat_settings.follower_mode) {
            if (chat_settings.follower_mode_duration == 0) {
                parts.push(`Follow`);
            } else {
                parts.push(`Follow (${chat_settings.follower_mode_duration}m)`);
            }
        }
        if (chat_settings.subscriber_mode) {
            parts.push(`Sub only`);
        }
        if (chat_settings.emote_mode) {
            parts.push(`Emote only`);
        }
        if (chat_settings.unique_chat_mode) {
            parts.push(`R9K`);
        }

        if (parts.length > 0) {
            chatSetting.innerHTML = parts.join(', ');
            chatSetting.style.display = "block";
        } else {
            chatSetting.style.display = "none";
        }
    });
}

// TwitchTV, Every function that uses your token and cliend id

async function getTTVUser(user_id) {
    if (userClientId === '0') { return; }

    let url = 'https://api.twitch.tv/helix/users'; // Default URL

    if (user_id) {
        if (/^\d+$/.test(user_id) || user_id.startsWith("id:")) {
            user_id = user_id.replace(/\D/g, '');

            url += `?id=${user_id}`;
        } else {
            user_id = user_id.replace("name:", "");

            url += `?login=${encodeURIComponent(user_id)}`;
        }
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

async function getBadges() {
    //CHANNEL
    const response = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${channelTwitchID}`, {
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId
        }
    });

    if (!response.ok) {
        debugChange("Twitch", "badges_channel", false);
        throw new Error('Network response was not ok');
    }

    debugChange("Twitch", "badges_channel", true);

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
                                    type: "Twitch Channel Badge",
                                    title: badge.title,
                                    set: element["set_id"]
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
                                    type: "Twitch Channel Badge",
                                    title: `Cheer ${badge.id}`,
                                    set: element["set_id"]
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
        debugChange("Twitch", "badges_global", false);
        throw new Error('Network response was not ok');
    }

    debugChange("Twitch", "badges_global", true);

    const data1 = await response1.json();

    data1.data.forEach(element => {
        if (element["versions"]) {
            if (element && Object.keys(element).length > 0) {
                TTVGlobalBadgeData.push(
                    ...element["versions"].map(badge => ({
                        id: element.set_id + "_" + badge.id, // Set the set_id as the id
                        url: badge["image_url_4x"],
                        type: "Twitch Global Badge",
                        title: badge.title,
                        set: element["set_id"]
                    }))
                );
            }
            return []; // Return an empty array if no badges
        }
    });

    //CUSTOM BADGES

    TTVGlobalBadgeData.push({
        id: '7TVServer' + "_" + 1,
        url: 'badges/7TV.png',
        type: "YAUTC Badge",
        title: '7TV'
    })

    TTVGlobalBadgeData.push({
        id: 'BTTVServer' + "_" + 1,
        url: 'badges/BTTV.png',
        type: "YAUTC Badge",
        title: 'BTTV'
    })

    TTVGlobalBadgeData.push({
        id: 'FFZServer' + "_" + 1,
        url: 'badges/FFZ.png',
        type: "YAUTC Badge",
        title: 'FFZ'
    })

    TTVGlobalBadgeData.push({
        id: 'Server' + "_" + 1,
        url: 'badges/SERVER.png',
        type: "YAUTC Badge",
        title: 'Server'
    })
}

async function getUserColorFromUserId(userId) {
    const userUrl = `https://api.twitch.tv/helix/chat/color?user_id=${userId}`;

    try {
        const response = await fetch(userUrl, {
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data[0]["color"];
    } catch (error) {
        console.log('Error fetching user_login color:', error);
        return null;
    }
}

async function getAvatarFromUserId(userId) {
    const userUrl = `https://api.twitch.tv/helix/users?id=${userId}`;

    try {
        const response = await fetch(userUrl, {
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data[0]["profile_image_url"].replace("300x300", "600x600");
    } catch (error) {
        console.log('Error fetching avatar:', error);
        return null;
    }
}

async function sendMessage(textContent) {
    if (!textContent) { textContent = chatInput.value; };

    if (textContent && textContent !== '' && textContent !== ' ') {
        let message = textContent

        if (autocompletion_container) { autocompletion_container.innerHTML = ""; };

        if (messages.length === 0 || messages[messages.length - 1] !== message) {
            messages.push(message);
        }

        if (message.startsWith('/')) {
            const messagesSplit = message.split(" ")

            if (commands.includes(messagesSplit[0])) {
                handleCommands(messagesSplit);
            } else {
                handleMessage(custom_userstate.Server, `${messagesSplit[0]} is not a command.`);
            }

            message = message.trimEnd() + ' ';

            currentIndex = messages.length;
            tempMessage = '';
        } else {
            //TWITCH API
            sendAPIMessage(message);
        }

        reply_to("0", "none");

        if (!pressedKeys["Control"] && textContent == chatInput.value) {
            chatInput.value = ''
        }
    }
}

async function handleCommands(messageSplit) {
    if (messageSplit[0] === "/usercard") {
        openCard(messageSplit[1]);
    } else if (messageSplit[0] === "/block" || messageSplit[0] === "/unblock") {
        if (!accessToken || userTwitchId === '0') {
            handleMessage(custom_userstate.Server, 'Not logged in!');
            return;
        }
        if (!messageSplit[1]) {
            handleMessage(custom_userstate.Server, 'Provide a valid username.');
            return;
        }

        const user_info = await getTTVUser(`name:${messageSplit[1]}`);

        if (!user_info || user_info?.data.length < 1) {
            handleMessage(custom_userstate.Server, `Provide a valid username, ${messageSplit[1]}`);
            return;
        }

        const userInfo = user_info["data"][0];

        const was_blocked = await blockUser(userInfo["id"], messageSplit[0] === "/block");

        if (was_blocked) {
            if (messageSplit[0] == "/block") {
                blockedUsersData.push({ username: userInfo["login"] });

                handleMessage(custom_userstate.Server, `${userInfo["login"]} was blocked.`);
            } else {
                blockedUsersData = blockedUsersData.filter(u => u.username !== userInfo["login"]);

                handleMessage(custom_userstate.Server, `${userInfo["login"]} was unblocked.`);
            }
        } else {
            handleMessage(custom_userstate.Server, `Error occurred while trying to block/unblock ${userInfo["login"]}.`);
        }
    }
}

async function sendAPIMessage(message) {
    if (!accessToken) {
        handleMessage(custom_userstate.Server, 'Not logged in!')
        return;
    }

    if (userTwitchId === '0') {
        handleMessage(custom_userstate.Server, 'Not connected to twitch!')
        return
    }

    if (rateLimitRemaining <= 0) {
        const remainingTime = rateLimitReset - Date.now();
        const remainingSeconds = Math.floor(remainingTime / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingTimeString = `${remainingHours} hours, ${remainingMinutes % 60} minutes, ${remainingSeconds % 60} seconds`;

        handleMessage(custom_userstate.Server, `Rate limit exceeded. Try again in ${remainingTimeString}.`);
        return;
    }

    message = message.trimEnd() + ' ';

    currentIndex = messages.length;
    tempMessage = '';

    if (latest_message && message === latest_message) {
        message += "󠀀";
    }

    const bodyContent = {
        broadcaster_id: channelTwitchID,
        sender_id: userTwitchId,
        message: message
    };

    if (replying_to) {
        bodyContent.reply_parent_message_id = replying_to;
    }

    const response = await fetch('https://api.twitch.tv/helix/chat/messages', {
        method: 'POST',
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyContent)
    });

    try {
        rateLimitRemaining = parseInt(response.headers.get('ratelimit-remaining') || "1", 10);
        rateLimitReset = parseInt(response.headers.get('ratelimit-reset') || "0", 10) * 1000;
    } catch (error) { };

    if (!response.ok) {
        debugChange("Twitch", "message_send", false);
        throw new Error('Network response was not ok');
    }

    debugChange("Twitch", "message_send", true);

    const data = await response.json();

    if (data.data && data.data[0] && data.data[0]["drop_reason"] && data.data[0]["drop_reason"]["message"]) {
        handleMessage(custom_userstate.Server, data.data[0]["drop_reason"]["message"].replace("Your message is being checked by mods and has not been sent.", "Your message was not sent."))
    }

    if (data["data"] && data["data"][0] && data["data"][0]["is_sent"]) {
        latest_message = message
    }
}

let EventSubStatus = 0

function subscribeToTwitchEvents() {
    const EventSubWS = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

    EventSubWS.onopen = async () => {
        console.log(FgMagenta + 'EventSub ' + FgWhite + 'WebSocket connection opened.');

        debugChange("Twitch", "event_sub", true);

        await chat_alert(custom_userstate.Server, `EVENTSUB WEBSOCKET OPEN`)
    };

    EventSubWS.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.metadata.message_type === 'session_welcome') {
            await chat_alert(custom_userstate.Server, `EVENTSUB WEBSOCKET CONNECTED`)
            console.log(FgMagenta + 'EventSub ' + FgWhite + 'Received Welcome Message, current session id:', message.payload.session.id);

            const sessionId = message.payload.session.id;

            // Subscribe to stream title changes
            let condition = {
                broadcaster_user_id: channelTwitchID
            }

            await subscribeToEvent(sessionId, 'channel.update', condition, "1");

            // Subscribe to raids
            condition = {
                from_broadcaster_user_id: channelTwitchID
            }

            await subscribeToEvent(sessionId, 'channel.raid', condition, "1");

            // Subscribe to chat setting changes
            condition = {
                broadcaster_user_id: channelTwitchID,
                user_id: userTwitchId
            }

            await subscribeToEvent(sessionId, 'channel.chat_settings.update', condition, "1");
        } else if (message.metadata.message_type === 'notification') {
            console.log(FgMagenta + 'EventSub ' + FgWhite + 'Received Event Notification:', message.payload);

            if (message.payload.subscription.type === 'channel.update') {
                //console.log('Stream title or metadata changed:', message.payload.event);

                let actualData = message.payload.event;
                let gameInfo = await getGameInfo(actualData["category_id"]);

                const updateInfo = {
                    title: actualData.title,
                    category: actualData.category_name,
                    viewers: "No Change",
                    categoryImage: gameInfo.data[0]["box_art_url"].replace('{width}x{height}', '144x192'),
                    time: "No Change",
                    username: actualData.broadcaster_user_name
                };

                update(updateInfo);
            } else if (message.payload.subscription.type === 'channel.raid') {
                console.log(FgMagenta + 'EventSub ' + FgWhite + 'Stream raid metadata:', message.payload.event);

                let actualData = message.payload.event;
                location.href = `${window.location.protocol}//${window.location.host}/YAUTC/#/${actualData.to_broadcaster_user_login}`;
            } else if (message.payload.subscription.type === 'channel.chat_settings.update') {
                const event = message.payload.event;

                if (Object.keys(event).length < 1) {
                    chat_settings = {};
                } else {
                    chat_settings = {
                        broadcaster_id: event.broadcaster_user_id,
                        slow_mode: event.slow_mode,
                        slow_mode_wait_time: event.slow_mode_wait_time_seconds,
                        follower_mode: event.follower_mode,
                        follower_mode_duration: event.follower_mode_duration_minutes,
                        subscriber_mode: event.subscriber_mode,
                        emote_mode: event.emote_mode,
                        unique_chat_mode: event.unique_chat_mode
                    };
                };

                updateChatSettings();
            }
        } else if (message.metadata.message_type === 'session_keepalive') {
            // Handle keepalive message if needed
        } else if (message.metadata.message_type === 'session_reconnect') {
            await chat_alert(custom_userstate.Server, `EVENTSUB WEBSOCKET RECONNECTING`)
            console.log(FgMagenta + 'EventSub ' + FgWhite + 'Reconnect needed:', message.payload.session.reconnect_url);
            EventSubWS.close();
        } else {
            console.log(message)
        }
    };

    EventSubWS.onclose = async (event) => {
        debugChange("Twitch", "event_sub", false);

        await chat_alert(custom_userstate.Server, `EVENTSUB WEBSOCKET CLOSED`)

        if (EventSubStatus !== 429) {
            subscribeToTwitchEvents()
        } else {
            await chat_alert(custom_userstate.Server, `EVENTSUB WEBSOCKET HAS TO MANY CONNECTIONS.`)
        }

        console.log(FgMagenta + 'EventSub ' + FgWhite + `WebSocket connection closed: ${event.code} - ${event.reason}`);
    };

    EventSubWS.onerror = (error) => {
        console.error(FgMagenta + 'EventSub ' + FgWhite + 'WebSocket error:', error);
    };
}

async function subscribeToEvent(sessionId, eventType, condition, version) {
    try {
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: eventType,
                version: version || "1",
                condition,
                transport: {
                    method: 'websocket',
                    session_id: sessionId
                }
            })
        });

        const data = await response.json();

        await chat_alert(custom_userstate.Server, `EVENTSUB SUBSCRIBED TO ${eventType}`.toUpperCase())

        console.log(FgMagenta + 'EventSub ' + FgWhite + 'Successfully subscribed to event:', data);

        if (data && data.status) {
            EventSubStatus = data.status
        }
    } catch (error) {
        console.error(FgMagenta + 'EventSub ' + FgWhite + 'Failed to subscribe:', error.response ? error.response.data : error.message);
    }
}

async function updateViewerAndStartTme(updateInfo) {
    try {
        let streamInfo = updateInfo

        if (!updateInfo) {
            streamInfo = await getStreamInfo(broadcaster);
        }

        for (let i = 0; i < streamViewers.length; i++) {
            let targetNumber = streamInfo.viewers;
            smoothlyChangeNumber(streamViewers[i], targetNumber, 1000);
        }

        if (streamTime && streamInfo.time) {
            startTime = new Date(streamInfo.time)
        } else if (streamTime && !streamInfo.time) {
            startTime = null;
        }
    } catch { }
}

async function update(updateInfo) {
    try {
        let streamInfo = null

        if (!updateInfo) {
            streamInfo = await getStreamInfo(broadcaster);
        } else {
            streamInfo = updateInfo
        }

        for (let i = 0; i < streamTitles.length; i++) {
            let results = await replaceWithEmotes(streamInfo.title, TTVChannelEmoteData, { "noMention": true, "title": true });

            streamTitles[i].innerHTML = results;
        }

        for (let i = 0; i < streamCategories.length; i++) {
            streamCategories[i].innerHTML = `<span class="category-wrapper" tooltip-name="${streamInfo.category}" tooltip-type="Category" tooltip-creator="" tooltip-image="${streamInfo.categoryImage}">
                                                <strong>${streamInfo.category}</strong>
                                            </span>`;
        }

        for (let i = 0; i < streamUsernames.length; i++) {
            streamUsernames[i].innerHTML = `<div class="name-wrapper" tooltip-name="${streamInfo.username}" tooltip-type="Broadcaster" tooltip-creator="" tooltip-image="none">
                                                <strong>${streamInfo.username}</strong>
                                            </div>`

            let nameWrapper = streamUsernames[i].querySelector('.name-wrapper');

            if (nameWrapper) {
                let strongElement = nameWrapper.querySelector('strong');
                const foundUser = TTVUsersData.find(user => user.name === `@${broadcaster}`);

                if (strongElement) {
                    if (foundUser) {
                        if (foundUser.cosmetics) {
                            await displayCosmeticPaint(foundUser.userId, foundUser.color, strongElement);
                        } else {
                            strongElement.style = `color: white`;
                        }
                    } else {
                        strongElement.style = `color: white`;
                    }
                }
            }

            if (isPartner) {
                streamUsernames[i].innerHTML += `<span style="margin-left: 5px;" class="badge-wrapper" tooltip-name="Partner" tooltip-type="Badge" tooltip-creator="" tooltip-image="https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3">
                                                <img src="https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3" alt="Partner" class="badge" loading="lazy">
                                            </span>`;
            }
        }

        for (let i = 0; i < streamAvatars.length; i++) {
            let foundUser = TTVUsersData.find(user => user.name === `@${broadcaster.toLowerCase()}`)
            let avatar = null

            if (foundUser && foundUser.cosmetics && foundUser.cosmetics.avatar_url) {
                avatar = foundUser.cosmetics.avatar_url
            } else {
                if (foundUser && foundUser.avatar) {
                    avatar = foundUser.avatar
                } else {
                    if (userClientId !== "0" && userToken) {
                        avatar = await getAvatarFromUserId(channelTwitchID || 141981764)
                    } else {
                        avatar = "imgs/user_avatar.png"
                    }

                    if (foundUser && avatar) {
                        foundUser.avatar = avatar;
                    }
                }
            }

            if (avatar) {
                avatar.replace("300x300", "600x600")

                streamAvatars[i].src = avatar;
            }
        }
    } catch { }
}

async function getGameInfo(gameId) {
    if (gameData[gameId]) { return gameData[gameId]; }

    const response = await fetch(`https://api.twitch.tv/helix/games?id=${gameId}`, {
        headers: {
            'Client-ID': userClientId,
            'Authorization': userToken
        }
    });

    let data = {
        "data": [
            {
                "id": "1",
                "name": "None",
                "box_art_url": "https://static-cdn.jtvnw.net/ttv-boxart/1-144x192.jpg",
                "igdb_id": "1"
            }
        ]
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch clip info: ${response.statusText}`);
    }

    const Response = await response.json()

    if (Response.data.length > 0) {
        data = Response
    }

    gameData[gameId] = data;

    return data
}

async function getStreamInfo() {
    try {
        response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${broadcaster}`, {
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken
            }
        });

        if (!response.ok) {
            debugChange("Twitch", "stream_info", false);
            throw new Error(`Failed to fetch stream info: ${response.statusText}`);
        }

        debugChange("Twitch", "stream_info", true);

        let data = await response.json();

        if (data.data.length > 0) {
            let actualData = data.data[0];
            let gameInfo = await getGameInfo(actualData["game_id"]);
            return {
                title: actualData.title,
                category: actualData.game_name,
                viewers: actualData.viewer_count,
                categoryImage: gameInfo.data[0]["box_art_url"].replace('{width}x{height}', '144x192'),
                time: new Date(actualData["started_at"]),
                username: (actualData.user_name.toLowerCase() !== actualData.user_login.toLowerCase() ? actualData.user_login : actualData.user_name) || "null"
            };
        } else {
            const data = await getOfflineStreamData();
            return {
                title: data.title,
                category: data.category,
                viewers: '0',
                categoryImage: data.categoryImage,
                time: 'offline',
                username: data.username
            };
        }
    } catch (error) {
        console.log('Error fetching stream info:', error);
        return {
            title: 'Null',
            category: 'Null',
            viewers: 'NaN',
            categoryImage: `Null`,
            time: null,
            username: 'Null'
        };
    }
}

async function getOfflineStreamData() {
    try {
        response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${channelTwitchID}`, {
            method: 'GET',
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken
            }
        });

        if (!response.ok) {
            debugChange("Twitch", "offline_stream_info", false);
            throw new Error(`Failed to fetch stream info: ${response.statusText}`);
        }

        debugChange("Twitch", "offline_stream_info", true);

        let data = await response.json();

        if (data.data.length > 0) {
            let actualData = data.data[0]
            let gameInfo = await getGameInfo(actualData["game_id"])
            return {
                title: actualData.title,
                category: actualData.game_name,
                viewers: 0,
                categoryImage: gameInfo.data[0]["box_art_url"].replace('{width}x{height}', '144x192'),
                time: 'offline',
                username: (actualData.broadcaster_name.toLowerCase() !== actualData.broadcaster_login.toLowerCase() ? actualData.broadcaster_login : actualData.broadcaster_name) || "null"
            };
        } else {
            return {
                title: 'Offline',
                category: '',
                viewers: '0',
                categoryImage: ``,
                time: 'offline',
                username: ''
            };
        }
    } catch (error) {
        console.log('Error fetching stream info:', error);
        return {
            title: 'Null',
            category: 'Null',
            viewers: 'NaN',
            categoryImage: `Null`,
            time: null,
            username: 'Null'
        };
    }
}

async function getChatSettings() {
    const response = await fetch(`https://api.twitch.tv/helix/chat/settings?broadcaster_id=${channelTwitchID}`, {
        method: 'GET',
        headers: {
            'Client-ID': userClientId,
            'Authorization': userToken
        }
    });

    if (!response.ok) {
        debugChange("Twitch", "chat_settings", false);

        console.error(`Failed to fetch chat settings: ${response.statusText}`);

        return false;
    }

    const data = await response.json()

    if (data && data["data"] && data["data"][0] && Object.keys(data["data"][0]).length > 0) {
        debugChange("Twitch", "chat_settings", true);

        return data["data"][0]
    } else {
        debugChange("Twitch", "chat_settings", false);

        return false;
    }
}

async function fetchTTVChannelEmoteData() {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${channelTwitchID}`, {
            method: 'GET',
            headers: {
                'Authorization': userToken,
                'Client-ID': userClientId
            },
        });

        if (!response.ok) {
            debugChange("Twitch", "emotes_channel", false);
            throw new Error('Network response was not ok');
        }

        debugChange("Twitch", "emotes_channel", true);

        const data = await response.json();
        TTVChannelEmoteData = data.data.map(emote => ({
            name: emote.name,
            url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
            emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
            site: 'Twitch Channel Emote'
        }));
        console.log(FgMagenta + 'Success in getting Global TTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching user ID:', error);
    }
}

async function fetchTTVGlobalEmoteData() {
    try {
        const response = await fetch('https://api.twitch.tv/helix/chat/emotes/global', {
            method: 'GET',
            headers: {
                'Authorization': userToken,
                'Client-ID': userClientId
            },
        });

        if (!response.ok) {
            debugChange("Twitch", "emotes_global", false);
            throw new Error('Network response was not ok');
        }

        debugChange("Twitch", "emotes_global", true);

        const data = await response.json();
        TTVGlobalEmoteData = data.data.map(emote => ({
            name: emote.name,
            url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
            emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
            site: 'Twitch Global'
        }));
        console.log(FgMagenta + 'Success in getting Global TTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching user ID:', error);
    }
}

async function fetchTTVBitsData() {
    try {
        const response = await fetch(`https://api.twitch.tv/helix/bits/cheermotes?broadcaster_id=${channelTwitchID}`, {
            method: 'GET',
            headers: {
                'Authorization': userToken,
                'Client-ID': userClientId
            },
        });

        if (!response.ok) {
            debugChange("Twitch", "bits_emotes", false);
            throw new Error('Network response was not ok');
        }

        debugChange("Twitch", "bits_emotes", true);

        const data = await response.json();

        TTVBitsData = data.data.map(emote => ({
            name: emote.prefix,
            tiers: emote.tiers.map(tier => ({
                min_bits: tier["min_bits"],
                url: tier.images.dark.animated["4"],
                emote_link: tier.images.dark.animated["4"],
                color: tier.color
            })),
            site: 'Cheer Emote'
        }));

        console.log(FgMagenta + 'Success in getting bits emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching user ID:', error);
    }
}

async function fetchTTVEmoteData() {
    let cursor = '';

    try {
        while (true) {
            const url = cursor
                ? `https://api.twitch.tv/helix/chat/emotes/user?user_id=${userTwitchId}&after=${encodeURIComponent(cursor)}`
                : `https://api.twitch.tv/helix/chat/emotes/user?user_id=${userTwitchId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': userToken,
                    'Client-ID': userClientId
                },
            });

            if (!response.ok) {
                debugChange("Twitch", "user_emotes", false);
                throw new Error('Network response was not ok');
            }

            debugChange("Twitch", "user_emotes", true);

            const data = await response.json();

            TTVEmoteData.push(
                ...data.data
                    .filter(emote => !(emote.emote_type === 'follower' && emote.owner_id !== channelTwitchID))
                    .map(emote => ({
                        name: emote.name,
                        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
                        emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
                        site: 'Channel Twitch Emote'
                    }))
            );

            if (data.pagination && data.pagination.cursor) {
                cursor = data.pagination.cursor;
            } else {
                break;
            }
        }

        console.log(FgMagenta + 'Success in getting TTV emotes!' + FgWhite);

    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

async function getBlockedUsers() {
    let cursor = '';

    try {
        while (true) {
            const url = cursor
                ? `https://api.twitch.tv/helix/users/blocks?broadcaster_id=${userTwitchId}&first=100&after=${encodeURIComponent(cursor)}`
                : `https://api.twitch.tv/helix/users/blocks?broadcaster_id=${userTwitchId}&first=100`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': userToken,
                    'Client-ID': userClientId
                },
            });

            if (!response.ok) {
                debugChange("Twitch", "blocked_users", false);
                throw new Error('Network response was not ok');
            }

            debugChange("Twitch", "blocked_users", true);

            const data = await response.json();

            const existingUsernames = new Set(blockedUsersData.map(user => user.username));

            blockedUsersData.push(
                ...data.data
                    .map(user => ({
                        username: user["user_login"]
                    }))
                    .filter(user => !existingUsernames.has(user.username))
            );

            existingUsernames.clear();
            existingUsernames.add(...blockedUsersData.map(user => user.username));

            if (data.pagination && data.pagination.cursor) {
                cursor = data.pagination.cursor;
            } else {
                break;
            }
        }

        //console.log(FgMagenta + 'Success in getting TTV blocked users!' + FgWhite); -- Removed due to console spam
    } catch (error) {
        console.log('Error fetching blocked users data:', error);
        throw error;
    }
}

async function blockUser(user_id, block) {
    if (!user_id) { return; }

    const request_method = block ? 'PUT' : block === false ? 'DELETE' : 'PUT';

    const response = await fetch(`https://api.twitch.tv/helix/users/blocks?target_user_id=${user_id}`, {
        method: request_method,
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId
        },
    });

    if (!response.ok) { return false; }

    return true;
}

// 7TV

async function loadSevenTV() {
    try {
        await chat_alert(custom_userstate.SevenTV, 'LOADING')

        SevenTVID = await get7TVUserID(channelTwitchID);
        if (SevenTVID) { await get7TVEmoteSetID(SevenTVID); };
        SevenTVGlobalEmoteData = await fetch7TVEmoteData('global');
        await chat_alert(custom_userstate.SevenTV, 'LOADED GLOBAL EMOTES')

        if (SevenTVemoteSetId) { SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId); };

        //WEBSOCKET
        detect7TVEmoteSetChange();

        await chat_alert(custom_userstate.SevenTV, 'LOADED')
    } catch (error) {
        await handleMessage(custom_userstate.SevenTV, 'FAILED TO LOAD (SEE DEBUG INFO: CTRL + Q)')
    }

    try {
        if (userClientId !== "0" && userToken) {
            const foundUser = TTVUsersData.find(user => user.name === `@${broadcaster}`);

            if (!foundUser) {
                let user = {
                    name: `@${broadcaster}`,
                    color: await getUserColorFromUserId(channelTwitchID || 141981764) || getRandomTwitchColor(broadcaster),
                    cosmetics: await pushCosmeticUserUsingGQL(SevenTVID),
                    avatar: await getAvatarFromUserId(channelTwitchID || 141981764),
                    userId: channelTwitchID
                };

                TTVUsersData.push(user);
            }

            update();
        } else {
            const broadcasterInfo = await getTwitchUser(broadcaster);
            const streamInfo = await parseStreaminfo(broadcasterInfo);

            let user = {
                name: `@${broadcaster}`,
                color: broadcasterInfo["chatColor"] || getRandomTwitchColor(broadcaster),
                cosmetics: await pushCosmeticUserUsingGQL(SevenTVID),
                avatar: broadcasterInfo["profile_image_url"] || "imgs/user_avatar.png",
                userId: channelTwitchID
            };

            TTVUsersData.push(user);

            update(streamInfo);
        }
    } catch (error) {
        await chat_alert(custom_userstate.Server, 'FAILED ADDING STREAMER TO USER DATA')
    }
}

async function get7TVUserID(user_id) {
    try {
        const response = await fetch(`https://7tv.io/v3/users/twitch/${user_id}`);

        if (!response.ok) {
            if (user_id === channelTwitchID) {
                debugChange("7TV", "user_profile", false);
            }

            throw false
        }

        if (user_id === channelTwitchID) {
            debugChange("7TV", "user_profile", true);
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
            debugChange("7TV", "channel_set", false);

            throw new Error('Network response was not ok');
        }

        debugChange("7TV", "channel_set", true);

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
            if (emoteSet === SevenTVemoteSetId) {
                debugChange("7TV", "emotes_channel", false);
            } else if (emoteSet === 'global') {
                debugChange("7TV", "emotes_global", false);
            }

            throw new Error(`Failed to fetch emote data for set ${emoteSet}`);
        }

        if (emoteSet === SevenTVemoteSetId) {
            debugChange("7TV", "emotes_channel", true);
        } else if (emoteSet === 'global') {
            debugChange("7TV", "emotes_global", true);
        }

        const data = await response.json();
        if (!data.emotes) { return null }
        return data.emotes.map(emote => {
            const owner = emote.data?.owner;

            const creator = owner && Object.keys(owner).length > 0
                ? owner.display_name || owner.username || "UNKNOWN"
                : "NONE";

            const emote4x = emote.data.host.files.find(file => file.name === "4x.avif")
                || emote.data.host.files.find(file => file.name === "3x.avif")
                || emote.data.host.files.find(file => file.name === "2x.avif")
                || emote.data.host.files.find(file => file.name === "1x.avif");

            return {
                name: emote.name,
                url: `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name || "1x.avif"}`.replace("cdn.7tv.app", "cdn.disembark.dev"),
                flags: emote.data?.flags,
                original_name: emote.data?.name,
                creator,
                emote_link: `https://7tv.app/emotes/${emote.id}`,
                site: emoteSet === 'global' ? 'Global 7TV' : '7TV',
                height: emote4x?.height,
                width: emote4x?.width
            };
        });
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// 7TV WEBSOCKET
const timeout = 120000;

async function detect7TVEmoteSetChange() {
    SevenTVWebsocket = new WebSocket('wss://events.7tv.io/v3');

    SevenTVWebsocket.onopen = async () => {
        let waitStartTime = Date.now();

        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket connection opened.');

        await chat_alert(custom_userstate.SevenTV, 'WEBSOCKET OPEN');

        waitStartTime = Date.now();

        while (channelTwitchID === "0" && Date.now() - waitStartTime < timeout) {
            console.log(FgYellow + 'Waiting for channelTwitchID to be set...' + FgWhite);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const subscribeEntitlementCreateMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: 'entitlement.create',
                condition: { platform: 'TWITCH', ctx: 'channel', id: channelTwitchID }
            }
        }

        if (channelTwitchID !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEntitlementCreateMessage));

            await chat_alert(custom_userstate.SevenTV, 'SUBSCRIBED TO ENTITLEMENTS');

            debugChange("7TV", "entitlements", true);
        }

        waitStartTime = Date.now();

        while ((SevenTVID === "0" || SevenTVemoteSetId === "0") && Date.now() - waitStartTime < timeout) {
            console.log(FgYellow + 'Waiting for SevenTVID or SevenTVemoteSetId to be set...' + FgWhite);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const subscribeEmoteMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: 'user.*',
                condition: {
                    object_id: SevenTVID,
                }
            }
        };

        if (SevenTVID !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteMessage));

            await chat_alert(custom_userstate.SevenTV, 'SUBSCRIBED TO USER CHANGE');

            debugChange("7TV", "user_change", true);
        }

        const subscribeEmoteSetMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };

        if (SevenTVemoteSetId !== "0") {
            await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteSetMessage));

            await chat_alert(custom_userstate.SevenTV, 'SUBSCRIBED TO SET UPDATE');

            debugChange("7TV", "set_update", true);
        }

        await chat_alert(custom_userstate.SevenTV, 'SUBSCRIBED TO ALL OF THE EVENTS');

        debugChange("7TV", "websocket", true);
    };

    SevenTVWebsocket.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message && message.d && message.d.body) {
                const body = message.d.body;
                let canProceed = false;

                if (message.d.body.updated && message.d.body.updated[0] && message.d.body.updated[0].key === "style") { return; }

                if (message.d.type === "cosmetic.create" || !message.d.body["actor"]) {
                    updateCosmetics(body);
                    return;
                }

                let tableData = {
                    name: 'none',
                    url: `4x.avif`,
                    flags: 0,
                    site: '',
                    action: 'other'
                };

                if (body["pushed"]) {
                    if (!body.pushed[0]) { return; }

                    const owner = body.pushed[0].value.data?.owner;

                    const creator = owner && Object.keys(owner).length > 0
                        ? owner.display_name || owner.username || "UNKNOWN"
                        : "NONE";

                    tableData = {
                        name: body.pushed[0].value.name,
                        url: `https://cdn.7tv.app/emote/${body.pushed[0]["value"].id}/4x.avif`,
                        flags: body.pushed[0].value.data?.flags,
                        original_name: body.pushed[0].value.data?.name,
                        creator,
                        site: '7TV',
                        user: body.actor["display_name"],
                        action: 'add'
                    };

                    canProceed = true;
                } else if (body["pulled"]) {
                    if (!body.pulled[0]) { return; }
                    tableData = {
                        name: body.pulled[0]["old_value"].name,
                        url: `https://cdn.7tv.app/emote/${body.pulled[0]["old_value"].id}/4x.avif`,
                        user: body.actor["display_name"],
                        action: 'remove'
                    };

                    canProceed = true;
                } else if (body["updated"]) {
                    if (!body.updated[0]) { return; }

                    if (body["updated"][0]["key"] === 'connections') {
                        tableData = "emote_set.change"

                        tableData = {
                            newSetName: body.updated[0]["value"][0]["value"].name,
                            newSetId: body.updated[0]["value"][0]["value"].id,
                            oldSetName: body.updated[0]["value"][0]["old_value"].name,
                            oldSetId: body.updated[0]["value"][0]["old_value"].id,
                            user: body.actor["display_name"],
                            site: '7TV',
                            action: 'emote_set.change'
                        };

                        canProceed = true;
                    } else {
                        tableData = {
                            newName: body.updated[0]["value"].name,
                            oldName: body.updated[0]["old_value"].name,
                            user: body.actor["display_name"],
                            site: '7TV',
                            action: 'update'
                        };

                        canProceed = true;
                    }
                }

                if (canProceed) {
                    update7TVEmoteSet(tableData)
                }
            }
        } catch (error) {
            console.log('Error parsing message:', error);
        }
    };

    SevenTVWebsocket.onerror = async (error) => {
        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket error:', error);
    };

    SevenTVWebsocket.onclose = async () => {
        console.log(FgBlue + 'SevenTV ' + FgWhite + 'WebSocket connection closed.');

        debugChange("7TV", "websocket", false);

        await chat_alert(custom_userstate.SevenTV, 'WEBSOCKET CLOSED');
        detect7TVEmoteSetChange();
    };
}

async function update7TVEmoteSet(table) {
    if (table.url === '4x.avif') { return; }

    if (table.action === 'add') {
        if (!table.name) {
            await handleMessage(custom_userstate.SevenTV, `Emote add failed, emote name was not provided by 7TV.`);
            return;
        }

        delete table.action;
        SevenTVEmoteData.push(table);

        await handleMessage(custom_userstate.SevenTV, `${table?.user || 'Unknown'} Added ${table.name} (${table.name})`);
    } else if (table.action === 'remove') {
        if (!table.name) {
            await handleMessage(custom_userstate.SevenTV, `Emote remove failed, emote name was not provided by 7TV.`);
            return;
        }

        await handleMessage(custom_userstate.SevenTV, `${table?.user || 'Unknown'} Removed ${table.name} (${table.name})`);

        SevenTVEmoteData = SevenTVEmoteData.filter(emote => emote.name !== table.name);
    } else if (table.action === 'update') {
        if (!table.newName || !table.oldName) {
            if (!table.newName) {
                await handleMessage(custom_userstate.SevenTV, `Emote rename failed, new emote name was not provided by 7TV.`);
            }

            if (!table.oldName) {
                await handleMessage(custom_userstate.SevenTV, `Emote rename failed, old emote name was not provided by 7TV.`);
            }

            return;
        }

        let foundEmote = SevenTVEmoteData.find(emote => emote.name === table.oldName);
        foundEmote.name = table.newName

        await handleMessage(custom_userstate.SevenTV, `${table?.user || 'Unknown'} Renamed ${table.oldName} to ${table.newName} (${table.newName})`);
    } else if (table.action === 'emote_set.change') {
        const unsubscribeEmoteSetMessage = {
            op: 36,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };

        await SevenTVWebsocket.send(JSON.stringify(unsubscribeEmoteSetMessage));

        await chat_alert(custom_userstate.SevenTV, 'UNSUBSCRIBED TO SET UPDATE');

        debugChange("7TV", "set_update", false);

        SevenTVemoteSetId = table.newSetId

        SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId);

        if (table["newSetName"]) {
            await handleMessage(custom_userstate.SevenTV, `Emote set changed to ${table["newSetName"]}`);
        } else {
            await handleMessage(custom_userstate.SevenTV, `Emote set changed, but new emote set name was not provided by 7TV.`);
        }

        const subscribeEmoteSetMessage = {
            op: 35,
            t: Date.now(),
            d: {
                type: `emote_set.update`,
                condition: {
                    object_id: SevenTVemoteSetId,
                }
            }
        };

        await SevenTVWebsocket.send(JSON.stringify(subscribeEmoteSetMessage));

        await chat_alert(custom_userstate.SevenTV, 'SUBSCRIBED TO SET UPDATE');

        debugChange("7TV", "set_update", true);

        //WEBSOCKET
        //await SevenTVWebsocket.close();
    }

    await updateAllEmoteData();
}

// BTTV

async function loadBTTV() {
    try {
        await chat_alert(custom_userstate.BTTV, 'LOADING')

        await fetchBTTVGlobalEmoteData();
        await chat_alert(custom_userstate.BTTV, 'LOADED GLOBAL EMOTES')

        await fetchBTTVEmoteData();

        //WEBSOCKET
        detectBTTVEmoteSetChange();

        await chat_alert(custom_userstate.BTTV, 'LOADED')
    } catch (error) {
        await handleMessage(custom_userstate.BTTV, 'FAILED TO LOAD (SEE DEBUG INFO: CTRL + Q)')
    }
}

async function fetchBTTVGlobalEmoteData() {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/emotes/global`);
        if (!response.ok) {
            debugChange("BetterTwitchTV", "emotes_global", false);

            throw new Error(`Failed to fetch emote data for set bttv`);
        }

        debugChange("BetterTwitchTV", "emotes_global", true);

        const data = await response.json();
        BTTVGlobalEmoteData = data.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: null,
            site: 'Global BTTV',
            flags: BTTVZeroWidth.includes(emote.code) ? 256 : undefined
        }));
        console.log(FgRed + 'Success in getting Global BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

async function fetchBTTVEmoteData() {
    try {
        const response = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${channelTwitchID}`);
        if (!response.ok) {
            debugChange("BetterTwitchTV", "user_profile", false);
            debugChange("BetterTwitchTV", "emotes_channel", false);

            throw new Error(`Failed to fetch emote data for set BTTV`);
        }

        debugChange("BetterTwitchTV", "user_profile", true);
        debugChange("BetterTwitchTV", "emotes_channel", true);

        const data = await response.json();

        const sharedEmotesData = data.sharedEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: emote.user ? emote.user.name : null,
            site: 'BTTV'
        }));

        const channelEmotesData = data.channelEmotes.map(emote => ({
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            emote_link: `https://betterttv.com/emotes/${emote.id}`,
            original_name: emote?.codeOriginal,
            creator: emote.user ? (emote.user.name || broadcaster) : null,
            site: 'BTTV'
        }));

        BTTVEmoteData = [...sharedEmotesData, ...channelEmotesData];

        console.log(FgRed + 'Success in getting Channel BetterTTV emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching emote data:', error);
        throw error;
    }
}

// BTTV WEBSOCKET

async function detectBTTVEmoteSetChange() {
    BTTVWebsocket = new WebSocket(`wss://sockets.betterttv.net/ws`);

    BTTVWebsocket.onopen = async () => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket connection opened.');

        debugChange("BetterTwitchTV", "websocket", true);

        const message = {
            name: 'join_channel',
            data: {
                name: `twitch:${channelTwitchID}`
            }
        };

        BTTVWebsocket.send(JSON.stringify(message));

        await chat_alert(custom_userstate.BTTV, 'WEBSOCKET OPEN')
    };

    BTTVWebsocket.onmessage = async (event) => {
        try {
            const message = JSON.parse(event.data);

            if (message && message.name && message.data) {
                const messageType = message.name;
                const messageData = message.data;
                let userName;

                if (messageData.channel) {
                    userName = 'none'
                }

                let tableData = {
                    name: 'none',
                    url: `4x.avif`,
                    flags: 0,
                    site: '',
                    action: 'other'
                };

                if (messageType === 'emote_create') {
                    if (!messageData.emote) { return; }
                    const emoteData = messageData.emote

                    tableData = {
                        name: emoteData.code,
                        url: `https://cdn.betterttv.net/emote/${emoteData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'add'
                    };
                } else if (messageType === 'emote_delete') {
                    const emoteFound = await BTTVEmoteData.find(emote => emote.url === `https://cdn.betterttv.net/emote/${messageData.emoteId}/3x`);

                    let emoteName = '';
                    if (emoteFound) {
                        emoteName = emoteFound.name
                    }

                    tableData = {
                        name: emoteName,
                        url: `https://cdn.betterttv.net/emote/${messageData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'remove'
                    };
                } else if (messageType === 'emote_update') {
                    if (!messageData.emote) { return; }
                    const emoteData = messageData.emote

                    tableData = {
                        name: emoteData.code,
                        url: `https://cdn.betterttv.net/emote/${emoteData.id}/3x`,
                        flags: 0,
                        user: userName,
                        site: 'BTTV',
                        action: 'update'
                    };
                }

                updateBTTVEmoteSet(tableData)
            }
        } catch (error) {
            console.log('Error parsing message:', error);
        }
    };

    BTTVWebsocket.onerror = async (error) => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket error:', error);
    };

    BTTVWebsocket.onclose = async () => {
        console.log(FgRed + 'BetterTwitchTV ' + FgWhite + 'WebSocket connection closed.');

        debugChange("BetterTwitchTV", "websocket", false);

        await chat_alert(custom_userstate.BTTV, 'WEBSOCKET CLOSED');
        detectBTTVEmoteSetChange();
    };
}

async function updateBTTVEmoteSet(table) {
    if (table.url === '4x.avif') { return; }

    if (table.action === 'add') {
        if (!table.name) {
            await handleMessage(custom_userstate.BTTV, `Emote add failed, emote name was not provided by BTTV.`);
            return;
        }

        BTTVEmoteData.push({
            name: table.name,
            url: table.url,
            flags: table.flags,
            site: table.site
        });

        await handleMessage(custom_userstate.BTTV, `${table?.user || 'Unknown'} Added ${table.name} (${table.name})`);
    } else if (table.action === 'remove') {
        if (!table.name) {
            await handleMessage(custom_userstate.BTTV, `Emote remove failed, emote name was not provided by BTTV.`);
            return;
        }

        await handleMessage(custom_userstate.BTTV, `${table?.user || 'Unknown'} Removed ${table.name} (${table.name})`);

        BTTVEmoteData = BTTVEmoteData.filter(emote => emote.name !== table.name);
    } else if (table.action === 'update') {
        if (!table.name || !table.url) {
            await handleMessage(custom_userstate.BTTV, `Emote update failed, emote name was not provided by BTTV.`);
            return;
        }

        const emoteFound = BTTVEmoteData.find(emote => emote.url === table.url);

        BTTVEmoteData.push({
            name: table.name,
            url: table.url,
            flags: table.flags,
            site: table.site
        });

        await handleMessage(custom_userstate.BTTV, `${table?.user || 'Unknown'} Renamed ${emoteFound.name} (${emoteFound.name}) to ${table.name} (${table.name})`);

        BTTVEmoteData = BTTVEmoteData.filter(emote => emote.name !== emoteFound.name);
    }

    await updateAllEmoteData();
}

// FFZ

async function loadFFZ() {
    try {
        await chat_alert(custom_userstate.FFZ, 'LOADING')

        await fetchFFZGlobalEmotes();
        await chat_alert(custom_userstate.FFZ, 'LOADED GLOBAL EMOTES')

        await fetchFFZUserData();

        await getFFZBadges();

        await chat_alert(custom_userstate.FFZ, 'LOADED')
    } catch (error) {
        await handleMessage(custom_userstate.FFZ, 'FAILED TO LOAD (SEE DEBUG INFO: CTRL + Q)')
    }
}

async function fetchFFZGlobalEmotes() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/set/global`);

        if (!response.ok) {
            debugChange("FrankerFaceZ", "emotes_global", false);

            throw new Error(`Failed to fetch FFZ global emotes`);
        }

        debugChange("FrankerFaceZ", "emotes_global", true);

        const data = await response.json();

        FFZGlobalEmoteData = data.sets[data.default_sets[0]].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length > 0
                ? owner.display_name || owner.name || "UNKNOWN"
                : "NONE";


            return {
                name: emote.name,
                url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
                emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
                creator,
                site: 'Global FFZ'
            };
        });

        console.log(FgGreen + 'Success in getting Global FrankerFaceZ emotes!' + FgWhite)
    } catch (error) {
        console.log('Error fetching FFZ global emotes:', toString(error));
        throw error;
    }
}

async function fetchFFZUserData() {
    try {
        const response = await fetch(`https://api.frankerfacez.com/v1/room/id/${channelTwitchID}`);

        if (!response.ok) {
            debugChange("FrankerFaceZ", "user_profile", false);
            debugChange("FrankerFaceZ", "emotes_channel", false);

            throw new Error(`Failed to fetch FFZ channel data`);
        }

        debugChange("FrankerFaceZ", "user_profile", true);
        debugChange("FrankerFaceZ", "emotes_channel", true);

        const data = await response.json();

        FFZEmoteData = data.sets[data.room.set].emoticons.map(emote => {
            const owner = emote.owner;

            const creator = owner && Object.keys(owner).length > 0
                ? owner.display_name || owner.name || "UNKNOWN"
                : "NONE";


            return {
                name: emote.name,
                url: emote.animated ? `https://cdn.frankerfacez.com/emote/${emote.id}/animated/4` : `https://cdn.frankerfacez.com/emote/${emote.id}/4`,
                emote_link: `https://www.frankerfacez.com/emoticon/${emote.id}`,
                creator,
                site: 'FFZ'
            };
        });

        // BADGES

        if (data.room) {
            if (data.room["vip_badge"] && Object.keys(data.room["vip_badge"]).length > 0) {
                const maxKey = Math.max(...Object.keys(data.room["vip_badge"]).map(Number));
                const maxUrl = data.room["vip_badge"][maxKey.toString()];

                FFZUserBadgeData['vip_badge'] = maxUrl
            }
            if (data.room["mod_urls"] && Object.keys(data.room["mod_urls"]).length > 0) {
                const maxKey = Math.max(...Object.keys(data.room["mod_urls"]).map(Number));
                const maxUrl = data.room["mod_urls"][maxKey.toString()];

                FFZUserBadgeData['mod_badge'] = maxUrl
            }
            if (data.room["user_badge_ids"] && Object.keys(data.room["user_badge_ids"]).length > 0) {
                const transformedBadges = {};

                Object.entries(data.room["user_badges"]).forEach(([badge, users]) => {
                    users.forEach(user => {
                        transformedBadges[user] = badge;
                    });
                });

                FFZUserBadgeData['user_badges'] = transformedBadges;
            }

            if (Object.keys(FFZUserBadgeData).length < 1) {
                debugChange("FrankerFaceZ", "badges_channel", false);
            } else {
                debugChange("FrankerFaceZ", "badges_channel", true);
            }
        }

        console.log(FgGreen + 'Success in getting Channel FrankerFaceZ data!' + FgWhite);
    } catch (error) {
        console.error('Error fetching FFZ channel data:', error);
        throw error;
    }
}

async function getFFZBadges() {
    const response = await fetch(`https://api.frankerfacez.com/v1/badges`, {
        method: 'GET'
    });

    if (!response.ok) {
        debugChange("FrankerFaceZ", "badges_global", false);

        throw new Error('Network response was not ok');
    }

    debugChange("FrankerFaceZ", "badges_global", true);

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
Load();

// OTHER CODE

function findEmote(word, userPersonal_emotes = []) {
    const TabEmotes = [];

    let emote_data = [
        ...allEmoteData,
        ...TTVEmoteData,
        ...userPersonal_emotes,
        ...mappedCommands,
    ]

    if (!word.startsWith('@') && !word.startsWith(':')) {
        emote_data.forEach(emote => {
            if (emote.name && emote.name.toLowerCase().startsWith(word.toLowerCase())) {
                TabEmotes.push(emote.name);
            }
        });
    } else if (word.startsWith('@')) {
        TTVUsersData.forEach(user => {
            if (user && user.name.toLowerCase().startsWith(word.toLowerCase())) {
                TabEmotes.push(user.name);
            }
        });
    } else if (word.startsWith(":")) {
        if (emojiData.length === 0) {
            mapEmojis();

            return TabEmotes;
        }

        // Emojis
        emojiData.forEach(emote => {
            if (emote.name && `:${emote.name}:`.toLowerCase().startsWith(word.toLowerCase())) {
                TabEmotes.push(emote.emoji);
            }
        });

        // Emotes like :) :(
        emote_data.forEach(emote => {
            if (emote.name && emote.name.toLowerCase().startsWith(word.toLowerCase())) {
                TabEmotes.push(emote.name);
            }
        });
    }

    return TabEmotes;
}

let EmoteI = 0
let TabEmotes = [];
let TabLatestWord = '';
let latestKey = '';
let inputChanged = false;

document.addEventListener('keydown', async function (event) {
    await updateAllEmoteData();
    //handleMessage(custom_userstate.Server, event.key) // DEBUG

    if (event.key === 'Enter') {
        if (document.activeElement === chatInput) {
            sendMessage();
        }
    } else if (event.key === 'Alt') {
        event.preventDefault();
        autoScroll = !autoScroll
    } else if (event.key === 'Backspace') {
        if (document.activeElement === chatInput && replying_to && (chatInput.value === '' || !chatInput.value)) {
            reply_to("0", "none");
        }
    } else if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === chatInput) {
            let textContent = chatInput.value;

            if (!inputChanged) {
                textContent = textContent.trimEnd();
            }

            if (textContent && textContent !== '' && textContent !== ' ' && !textContent.endsWith(" ")) {
                let userPersonal_emotes = [];

                const userData = TTVUsersData.find(user => user.name === `@${tmiUsername}`);

                if (userData && userData.cosmetics && userData.cosmetics.personal_emotes) {
                    userPersonal_emotes = userData.cosmetics.personal_emotes;
                }

                let split = textContent.split(" ")

                let tabEmoteData = [
                    ...allEmoteData,
                    ...TTVEmoteData,
                    ...userPersonal_emotes,
                    ...mappedCommands,
                ]

                if (tabEmoteData.length === 0) { return; }

                if (inputChanged || TabLatestWord === '') {
                    inputChanged = false;
                    EmoteI = 0
                    TabEmotes = [];
                    TabLatestWord = split[split.length - 1]

                    TabEmotes = findEmote(TabLatestWord, userPersonal_emotes);

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

                chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
                chatInput.scrollLeft = chatInput.scrollWidth;
            } else {
                EmoteI = 0
                TabEmotes = [];
                TabLatestWord = ''
            }
        }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (document.activeElement !== chatInput) { return; }

        if (currentIndex === messages.length) {
            tempMessage = chatInput.value;
        }

        event.preventDefault();

        if (event.key === 'ArrowUp') {
            if (currentIndex > 0) {
                currentIndex--;
                chatInput.value = messages[currentIndex];
            }
        } else if (event.key === 'ArrowDown') {
            if (currentIndex < messages.length - 1) {
                currentIndex++;
                chatInput.value = messages[currentIndex];
            } else {
                chatInput.value = tempMessage;
            }
        }

        chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
        chatInput.scrollLeft = chatInput.scrollWidth;
    } else if (event.key === 't') {
        if (document.activeElement !== chatInput) {
            theatreMode = !theatreMode;
        }
    }
});

function handleScroll() {
    const scrollTop = chatDisplay.scrollTop;
    const scrollHeight = chatDisplay.scrollHeight;
    const clientHeight = chatDisplay.clientHeight;

    const offset = 50;

    if (scrollTop > 0 && scrollTop < scrollHeight - clientHeight) {
        autoScroll = false;
    } else if (scrollTop >= scrollHeight - clientHeight - offset) {
        autoScroll = true;
    }
}

chatInput.addEventListener('input', async function (event) {
    latestKey = event.key

    if (latestKey !== 'Tab') {
        inputChanged = true;
    } else {
        TabEmotes = [];
        inputChanged = false;
    }

    //MOBILE AUTOCOMPLETION
    if (autocompletion_container) {
        const inputText = event.target.value.trim();

        if (chatInput.selectionStart != inputText.length) { autocompletion_container.innerHTML = ""; return; };

        let autocompletion = [];

        let userPersonal_emotes = [];

        const userData = TTVUsersData.find(user => user.name === `@${tmiUsername}`);

        if (userData && userData.cosmetics && userData.cosmetics.personal_emotes) {
            userPersonal_emotes = userData.cosmetics.personal_emotes;
        }

        if (inputText && !inputText.endsWith(' ')) {
            const words = inputText.split(/\s+/);

            const latestWord = words[words.length - 1];
            const trimmedWord = latestWord.slice(1);

            if (latestWord.length < 3) { autocompletion_container.innerHTML = ""; return; };

            if (!(isOnMobile || (latestWord.startsWith(":") || latestWord.startsWith("/")))) { return; };

            let foundEmotes0 = findEmote(latestWord, userPersonal_emotes);
            let foundEmotes1 = [];

            if (!isOnMobile) {
                foundEmotes1 = findEmote(trimmedWord, userPersonal_emotes);
            }

            // Remove duplicates
            let foundEmotes = [...new Set(foundEmotes0), ...new Set(foundEmotes1)];

            foundEmotes.sort((a, b) => {
                if (a.length !== b.length) return a.length - b.length;
                return a.localeCompare(b);
            }).reverse();

            autocompletion = foundEmotes.map(foundEmote_name => {
                let found_emote = [...userPersonal_emotes, ...TTVEmoteData, ...allEmoteData].find(emote => emote.name === foundEmote_name);

                // Detect emoji
                if (!found_emote && emojiData.length > 0) {
                    //TODO - DISPLAY THE IMAGES FOR EMOJIS

                    //found_emote = emojiData.filter(emoji => (emoji.emoji && emoji.unified) && foundEmote_name === emoji.emoji);
                }

                if (found_emote) {
                    return `<button class="emote_completion_button" autocompletion="${found_emote.emoji || found_emote.name}">
                        <img src="${found_emote.url}" alt="${found_emote.name}" class="emote_completion_emote">
                        <div class="emote_completion_name">${found_emote.name}</div>
                    </button>`;
                } else {
                    //console.log(foundEmote_name, " not found");

                    return `<button class="emote_completion_button" autocompletion="${foundEmote_name}">
                        <div class="emote_completion_name">${foundEmote_name}</div>
                    </button>`;
                }
            });

            autocompletion_container.innerHTML = autocompletion.join("");

            autocompletion_container.scrollTo({
                top: autocompletion_container.scrollHeight
            });
        } else {
            autocompletion_container.innerHTML = "";
        }
    }
});

chatInput.addEventListener('click', function () {
    if (autocompletion_container) {
        autocompletion_container.innerHTML = "";
    }
});

if (autocompletion_container) {
    autocompletion_container.addEventListener('click', function (event) {
        if (event.target.closest('.emote_completion_button')) {
            const button = event.target.closest('.emote_completion_button');

            const emoteName = button.getAttribute('autocompletion') || button.querySelector('.emote_completion_name').textContent || "";

            if (emoteName) {
                let currentText = chatInput.value;

                let words = currentText.split(' ');

                words[words.length - 1] = `${emoteName} `;

                chatInput.value = words.join(' ');

                autocompletion_container.innerHTML = "";

                chatInput.focus();
            }
        }
    });
}

chatInput.addEventListener('focus', function () {
    setTimeout(function () {
        siteContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
});

function rgbToHex(rgb) {
    if (rgb.startsWith("rgb(") && rgb.endsWith(")")) {
        rgb = rgb.replace("rgb(", "").replace(")", "");

        let [r, g, b] = rgb.split(",").map(value => {
            let num = parseInt(value);
            return isNaN(num) ? 255 : num;
        });

        return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    } else {
        return rgb;
    }
}

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function isSingleChannel(r, g, b) {
    return [r, g, b].filter(value => value > 0).length === 1;
}

function lightenColor(hex) {
    const min = 60;
    hex = rgbToHex(hex);

    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        return hex;
    }

    let { r, g, b } = hexToRgb(hex);

    if (r !== undefined && g !== undefined && b !== undefined && isSingleChannel(r, g, b)) {
        if (r !== undefined && r > 0) { r = 255; };
        if (g !== undefined && g > 0) { g = 255; };
        if (b !== undefined && b > 0) { b = 230; };
    } else {
        if (r !== undefined && r <= min) { r = min + 1; };
        if (g !== undefined && g <= min) { g = min + 1; };
        if (b !== undefined && b <= min) { b = min + 1; };
    }

    return `rgb(${r}, ${g}, ${b})`;
}

function updateTimer() {
    if (startTime && startTime != NaN && startTime != null && startTime != 'offline') {
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - startTime.getTime();

        let seconds = Math.floor((timeDifference / 1000) % 60);
        let minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
        let hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);

        seconds = seconds < 10 ? `0${seconds}` : seconds;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        hours = hours < 10 ? `0${hours}` : hours;

        for (let i = 0; i < streamTime.length; i++) {
            if (!seconds || !minutes || !hours) {
                streamTime[i].textContent = `Offline`;
            } else {
                streamTime[i].textContent = `${hours}:${minutes}:${seconds}`;
            }
        }
    } else {
        for (let i = 0; i < streamTime.length; i++) {
            streamTime[i].textContent = `Offline`;
        }
    }
}

function smoothlyChangeNumber(element, targetNumber, duration) {
    let currentNumber = parseFloat(element.textContent.replace(/,/g, ''));

    let increment = (targetNumber - currentNumber) / (duration / 16);

    function updateNumber() {
        currentNumber += increment;
        let formattedNumber = Math.round(currentNumber).toLocaleString();
        element.textContent = formattedNumber;
        if ((increment > 0 && currentNumber < targetNumber) || (increment < 0 && currentNumber > targetNumber)) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = targetNumber.toLocaleString();
        }
    }

    updateNumber();
}

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'q') {
        if (debugWindow) {
            debugWindow.style.display = (debugWindow.style.display === 'none' || !debugWindow.style.display)
                ? 'block'
                : 'none';
        }
    }
});

let isRendingEmotePicker = false;

async function displayEmotePicker() {
    if (!is_dev_mode) {
        alert('In progress')
        return;
    }

    const content = document.querySelector('#emote-picker-0 #content');

    if (!content) { return; }

    if (emotePicker) {
        emotePicker.style.display = (emotePicker.style.display === 'none' || !emotePicker.style.display)
            ? 'block'
            : 'none';
    }

    if (isRendingEmotePicker) { return; }
    isRendingEmotePicker = true;

    if (emotePicker.style.display === "block") {
        content.innerHTML = 'Loading';

        await updateAllEmoteData();

        let innerHTML = '';

        for (const emote of allEmoteData) {
            innerHTML += await replaceWithEmotes(emote.name, [], []);

            content.innerHTML = innerHTML;
        }
    }

    isRendingEmotePicker = false;
}

function decodeEmojiToUnified(emoji) {
    return [...emoji]
        .map(char => char.codePointAt(0).toString(16).toUpperCase())
        .join('-');
}

function encodeUnifiedToEmoji(unified) {
    return String.fromCodePoint(
        ...unified.split('-').map(code => parseInt(code, 16))
    );
}

async function mapEmojis() {
    for (const emote of emojiDatasource) {
        const emote_name = emote.short_name

        emojiData.push({
            name: emote_name,
            unified: emote.unified,
            emoji: encodeUnifiedToEmoji(emote.unified),
            url: `https://abs-0.twimg.com/emoji/v2/svg/${emote.image.replace(".png", ".svg")}`,
            emote_link: `https://abs-0.twimg.com/emoji/v2/svg/${emote.image.replace(".png", ".svg")}`,
            category: emote.category,
            site: `Emoji (${emote.category})`,
            height: 128,
            width: 128
        })

        if (emote.skin_variations) {
            for (const [index, variation] of Object.keys(emote.skin_variations).entries()) {
                const skin_variation = emote.skin_variations[variation];

                emojiData.push({
                    name: `${emote_name}_tone${index + 1}`,
                    unified: skin_variation.unified,
                    emoji: encodeUnifiedToEmoji(skin_variation.unified),
                    url: `https://abs-0.twimg.com/emoji/v2/svg/${skin_variation.image.replace(".png", ".svg")}`,
                    emote_link: `https://abs-0.twimg.com/emoji/v2/svg/${skin_variation.image.replace(".png", ".svg")}`,
                    category: emote.category,
                    site: `Emoji (${emote.category})`,
                    height: 128,
                    width: 128
                })
            }
        }
    }
}

//MOBILE TOOLTIP
let tooltipButton;
let tooltip_emote_url;

function openEmoteLink() {
    if (tooltip_emote_url) {
        window.open(tooltip_emote_url, '_blank');
    }
}

chatDisplay.addEventListener('click', function (e) {
    const clickedElement = e.target;

    const emoteWrapper = clickedElement.closest('.emote-wrapper');
    const badgeWrapper = clickedElement.closest('.badge-wrapper');

    let element_found = emoteWrapper || badgeWrapper;

    console.log(clickedElement);
    console.log(element_found);

    if (element_found) {
        if (isOnMobile) {
            const tooltipData = {
                imgSrc: element_found.getAttribute('tooltip-image') || clickedElement.src || '',
                tooltipName: element_found.getAttribute('tooltip-name') || clickedElement.alt || '',
                tooltipType: element_found.getAttribute('tooltip-type') || '',
                tooltipCreator: element_found.getAttribute('tooltip-creator') || '',
                tooltipTitle: element_found.getAttribute('tooltip-title') || ''
            };

            const tooltipFrame = document.getElementById('frame');
            const tooltipTitleElement = document.getElementById('tooltip-title');
            const frameImgElement = document.getElementById('frame-img');
            const tooltipNameElement = document.getElementById('tooltip-name');
            const tooltipTypeElement = document.getElementById('tooltip-type');
            const tooltipCreatorElement = document.getElementById('tooltip-creator');

            if (!tooltipButton) {
                tooltipButton = document.getElementById('tooltip-button');
            }

            console.log(tooltipData);

            const isNotEmpty = Object.values(tooltipData).some(value => value !== "");

            if (isNotEmpty) {
                tooltipFrame.style.display = "flex";

                if (tooltipData.imgSrc && frameImgElement) {
                    frameImgElement.style.display = "block";

                    frameImgElement.src = tooltipData.imgSrc;
                } else {
                    frameImgElement.style.display = "none";
                }

                tooltipTitleElement.innerHTML = tooltipData.tooltipTitle;
                tooltipNameElement.innerHTML = tooltipData.tooltipName;
                tooltipTypeElement.innerHTML = tooltipData.tooltipType;
                tooltipCreatorElement.innerHTML = tooltipData.tooltipCreator;

                tooltip_emote_url = tooltipData.imgSrc;
                let button_text = "Open";

                if (emoteWrapper && tooltipData.imgSrc) {
                    button_text = "Open emote";

                    updateAllEmoteData();

                    const found_emote = allEmoteData.find(emote => emote.url == tooltipData.imgSrc);

                    if (found_emote) {
                        tooltip_emote_url = found_emote.emote_link || found_emote.url;

                        if (found_emote.site) {
                            button_text = `Open ${found_emote.site} emote`
                        }
                    }
                } else {
                    tooltip_emote_url = tooltipData.imgSrc;

                    if (tooltipData.tooltipType) {
                        button_text = `Open ${tooltipData.tooltipType}`
                    }
                }

                if (tooltip_emote_url != "") {
                    tooltipButton.innerHTML = button_text;

                    tooltipButton.style.display = "block";

                    tooltipButton.removeEventListener('click', openEmoteLink);

                    tooltipButton.addEventListener('click', openEmoteLink);
                } else {
                    tooltipButton.style.display = "none";
                }
            } else {
                tooltipFrame.style.display = "none";

                console.log("All values in tooltipData are empty.");
            }
        }
    }
});

document.addEventListener('click', function (e) {
    const frame = document.getElementById('frame');

    if (frame && !frame.contains(e.target) && !e.target.closest('.emote-wrapper') && !e.target.closest('.badge-wrapper')) {
        frame.style.display = "none";
    }
});

setInterval(updateTimer, 1000);
setInterval(loadCustomBadges, 900000);
client.addListener('message', handleChat); // TMI.JS
reloadButton.addEventListener('click', Load);
emoteButton.addEventListener('click', displayEmotePicker);
chatDisplay.addEventListener('wheel', handleScroll, { passive: true });
chatDisplay.addEventListener('touchmove', handleScroll, { passive: true }); // MOBILE

function deleteMessages(attribute, value) {
    if (userSettings && !userSettings['modAction']) { return; }

    if (attribute) {
        const elementsToDelete = chatDisplay.querySelectorAll(`[${attribute}="${value}"]`);

        elementsToDelete.forEach(element => {
            element.remove();
        });
    } else {
        chatDisplay.innerHTML = '';
    }
}

// TMI.JS

client.on("cheer", (channel, userstate, message) => {
    handleMessage(userstate, message, channel)
});

client.on("redeem", (channel, userstate, message) => {
    const username = userstate

    if (TTVRedemsData.redeems) {
        const foundRedeem = TTVRedemsData.redeems.find(redeem => String(redeem.id).toLowerCase() === String(message).toLowerCase());

        if (foundRedeem) {
            message = `${userstate} redeemed redeem_image ${foundRedeem.title} for ${foundRedeem.cost} points_image ${TTVRedemsData?.title || "points"}`

            userstate = {
                noMention: true,
                noEmotes: true,
                message_label: String(foundRedeem.color),
                username: '',
                custom_emotes: [
                    {
                        emote_link: TTVRedemsData?.image || "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
                        flags: 0,
                        name: "points_image",
                        site: "Points Icon",
                        url: TTVRedemsData?.image || "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
                    },
                    {
                        emote_link: foundRedeem?.image || "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
                        flags: 0,
                        name: "redeem_image",
                        site: "Redeem Icon",
                        url: foundRedeem?.image || "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
                    }
                ]
            }

            TTVUserRedeems[`${username}`] = String(foundRedeem.color);
        }
    }

    if (message !== 'highlighted-message') {
        userstate["noLink"] = true;

        handleMessage(userstate, message, channel)
    } else {
        TTVUserRedeems[`${username}`] = 'highlight';
    }

    setTimeout(() => {
        delete TTVUserRedeems[`${username}`];
    }, 5000);
});

client.on("subscription", async (channel, username, method, message, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    let tier = userstate["msg-param-sub-plan"];
    let tierDisplay = tier ? ` (Tier ${tier / 1000})` : "";
    let methodDisplay = method ? ` using ${method}` : "";
    let subMessage = message ? `${message}` : undefined;

    let announcementState = {
        ...custom_userstate.TTVAnnouncement,
    };

    let finalMessage = `${systemMsg || `${username} subscribed in the channel${tierDisplay}${methodDisplay}`}`;
    let finalMessage_usersate = { ...custom_userstate.TTVAnnouncement, noEmotes: true, noBadge: true };

    if (finalMessage.startsWith(userstate?.["login"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["login"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    } else if (finalMessage.startsWith(userstate?.["display-name"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["display-name"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    }

    if (subMessage) {
        announcementState["username"] = userstate?.["login"] || username;
        announcementState["display-name"] = userstate?.["display-name"] || username;
        announcementState["color"] = userstate?.["color"] || "#FFFFFF";

        announcementState["id"] = userstate?.["id"] || "0";

        announcementState["emotes"] = userstate?.["emotes"] || null;
        announcementState["badge-info"] = userstate?.["badge-info"] || {};
        announcementState["badge-info-raw"] = userstate?.["badge-info-raw"] || null;
        announcementState["badges"] = userstate?.["badges"] || {};
        announcementState["badges-raw"] = userstate?.["badges-raw"] || null;

        announcementState["noLink"] = false;

        await handleMessage(announcementState, subMessage, channel);
    }

    handleMessage(finalMessage_usersate, finalMessage, channel);
});

client.on("resub", async (channel, username, months, message, userstate, methods) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];
    let tier = userstate["msg-param-sub-plan"];
    let tierDisplay = tier ? ` (Tier ${tier / 1000})` : "";
    let methodDisplay = methods[0] ? ` using ${methods[0]}` : "";

    const years = Math.floor(cumulativeMonths / 12);
    const remainingMonths = cumulativeMonths % 12;
    let duration = "";

    if (years > 0 && remainingMonths > 0) {
        duration = ` for ${years} year${years > 1 ? "s" : ""} and ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    } else if (years > 0) {
        duration = ` for ${years} year${years > 1 ? "s" : ""}`;
    } else if (remainingMonths > 0) {
        duration = ` for ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    } else {
        duration = " for less than a month";
    }

    let subMessage = message ? `${message}` : undefined;

    let announcementState = {
        ...custom_userstate.TTVAnnouncement,
    };

    let finalMessage = `${systemMsg || `${username} resubscribed in the channel${tierDisplay}${duration}${methodDisplay}`}`;
    let finalMessage_usersate = { ...custom_userstate.TTVAnnouncement, noEmotes: true, noBadge: true };

    if (finalMessage.startsWith(userstate?.["login"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["login"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    } else if (finalMessage.startsWith(userstate?.["display-name"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["display-name"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    }

    if (subMessage) {
        announcementState["username"] = userstate?.["login"] || username;
        announcementState["display-name"] = userstate?.["display-name"] || username;
        announcementState["color"] = userstate?.["color"] || "#FFFFFF";

        announcementState["id"] = userstate?.["id"] || "0";

        announcementState["emotes"] = userstate?.["emotes"] || null;
        announcementState["badge-info"] = userstate?.["badge-info"] || {};
        announcementState["badge-info-raw"] = userstate?.["badge-info-raw"] || null;
        announcementState["badges"] = userstate?.["badges"] || {};
        announcementState["badges-raw"] = userstate?.["badges-raw"] || null;

        announcementState["noLink"] = false;

        await handleMessage(announcementState, subMessage, channel);
    }

    handleMessage(finalMessage_usersate, finalMessage, channel);
});

client.on("raided", (channel, username, viewers) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    handleMessage(custom_userstate.TTVAnnouncement, `${username} raided the channel with ${viewers.toLocaleString()} viewers`, channel);
});

client.on("anongiftpaidupgrade", (channel, username, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    const finalMessage = systemMsg || `${username} continued the anonymous gift sub in the channel.`;

    handleMessage(custom_userstate.TTVAnnouncement, finalMessage, channel);
});

client.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    const subCount = numbOfSubs > 1 ? `${numbOfSubs} subscriptions` : "a subscription";
    const senderCount = ~~userstate["msg-param-sender-count"];

    let finalMessage = systemMsg || `${username} gifted ${subCount} in the channel! They have gifted ${senderCount} total subscriptions so far.`;
    let finalMessage_usersate = { ...custom_userstate.TTVAnnouncement, noEmotes: true, noBadge: true };

    if (userstate?.["login"] && finalMessage.startsWith(userstate?.["login"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["login"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    } else if (userstate?.["display-name"] && finalMessage.startsWith(userstate?.["display-name"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["display-name"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    }

    handleMessage(finalMessage_usersate, finalMessage, channel);
});

client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    let finalMessage = systemMsg || `${username} continued their gift sub from ${sender} in the channel.`;
    let finalMessage_usersate = { ...custom_userstate.TTVAnnouncement, noEmotes: true, noBadge: true };

    if (userstate?.["login"] && finalMessage.startsWith(userstate?.["login"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["login"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    } else if (userstate?.["display-name"] && finalMessage.startsWith(userstate?.["display-name"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["display-name"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    }

    handleMessage(finalMessage_usersate, finalMessage, channel);
});

client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    const tier = userstate["msg-param-sub-plan"];
    const tierDisplay = tier ? ` (Tier ${tier / 1000})` : "";
    const senderCount = ~~userstate["msg-param-sender-count"];

    let finalMessage = systemMsg || `${username} gifted a subscription${tierDisplay} to ${recipient} in the channel. They have gifted ${senderCount} total subscriptions so far.`;
    let finalMessage_usersate = { ...custom_userstate.TTVAnnouncement, noEmotes: true, noBadge: true };

    if (userstate?.["login"] && finalMessage.startsWith(userstate?.["login"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["login"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    } else if (userstate?.["display-name"] && finalMessage.startsWith(userstate?.["display-name"])) {
        finalMessage = finalMessage.replace(new RegExp(`^${userstate?.["display-name"]}\\s*`), '');

        finalMessage_usersate["username"] = userstate?.["login"] || username;
        finalMessage_usersate["color"] = userstate?.["color"] || "#FFFFFF";
    }

    handleMessage(finalMessage_usersate, finalMessage, channel);
});

// MODERATION ACTIONS

client.on("ban", (channel, username, reason, userstate) => {
    deleteMessages("sender", String(username))
    handleMessage(custom_userstate.Server, `${username} has been banned from the channel.`, channel)
});

client.on("timeout", (channel, username, reason, duration, userstate) => {
    deleteMessages("sender", String(username))
    handleMessage(custom_userstate.Server, `${username} has been timed out for ${convertSeconds(duration)}.`, channel)
});

client.on("messagedeleted", (channel, username, deletedMessage, userstate) => {
    deleteMessages("message_id", String(userstate["target-msg-id"]))
});

client.on("clearchat", async (channel) => {
    if (userSettings && !userSettings['modAction']) { handleMessage(custom_userstate.Server, `Chat clear has been prevented.`, channel); }

    deleteMessages()

    if (!userSettings || userSettings['modAction']) { handleMessage(custom_userstate.Server, `Chat clear has been cleared.`, channel); }
});

// OTHER ACTIONS

/*
client.on("join", (channel, username, self) => {
    console.log(channel, username, self);
});

client.on("part", (channel, username, self) => {
    console.log(channel, username, self);
});
*/
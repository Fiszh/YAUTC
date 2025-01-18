let broadcaster = 'twitch';
let loadedEmotes = false;
let autoScroll = true;
let scrollUpOffset = 0

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
const commands = [
    "/usercard",
]

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
//let userToken = `Bearer ${accessToken}` // moved to twitchLogin.js
//let userClientId = '0' // moved to twitchLogin.js
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
let TTVRedemsData = [];
let TTVUserRedeems = [];

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
const streamTime = document.getElementsByClassName("stream_time");
const streamTitles = document.getElementsByClassName("stream_title");
const streamAvatars = document.getElementsByClassName("stream_avatar");
const streamViewers = document.getElementsByClassName("stream_viewers");
const streamUsernames = document.getElementsByClassName("stream_username");
const streamCategories = document.getElementsByClassName("stream_category");

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
        "no-link": true,
        "noPing": true,
        "noEmotes": true,
        "color": "#FFFFFF"
    },
    SevenTV: { // SevenTVServerUserstate
        "username": '7TV',
        "badges-raw": '7TVServer/1',
        "no-link": true,
        "noPing": true,
        "color": "#28aba1"
    },
    BTTV: { // BTTVServerUserstate
        "username": 'BTTV',
        "badges-raw": 'BTTVServer/1',
        "no-link": true,
        "noPing": true,
        "color": "#d50014"
    },
    FFZ: { // FFZServerUserstate
        "username": 'FFZ',
        "badges-raw": 'FFZServer/1',
        "no-link": true,
        "noPing": true,
        "color": "#08bc8c"
    },
    TTVAnnouncement: { // TTVAnnouncementUserstate
        "username": '',
        "badges-raw": 'NONE/1',
        "no-link": true,
        "noPing": true,
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
            userstate.color = lightenColor(userstate.color)
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

        saveMetadata(url, metaData);
    } catch (error) {
        console.error(error);
    }

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

async function checkPart(part, string) {
    if (userSettings && !userSettings['mentionColor']) { return false; }

    return (part.toLowerCase() === string)
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

function calculateAspectRatio(width, height, desiredHeight) {
    const aspectRatio = width / height;
    const calculatedWidth = desiredHeight * aspectRatio;
    return { width: calculatedWidth, height: desiredHeight };
}

async function getImageSize(urlOrDimensions, retries = 3) {
    return new Promise((resolve, reject) => {
        if (typeof urlOrDimensions === 'object' && urlOrDimensions.width && urlOrDimensions.height) {
            const { width, height } = urlOrDimensions;
            const dimensions = calculateAspectRatio(width, height, desiredHeight);

            resolve(dimensions);
        } else if (typeof urlOrDimensions === 'string') {
            const img = document.createElement('img');
            img.style.display = 'none';

            const loadImage = (attempt) => {
                img.onload = function () {
                    const naturalWidth = this.naturalWidth;
                    const naturalHeight = this.naturalHeight;

                    const dimensions = calculateAspectRatio(naturalWidth, naturalHeight, desiredHeight);

                    img.remove();

                    resolve(dimensions);
                };

                img.onerror = function () {
                    console.error(`Error loading image: ${urlOrDimensions} (Attempt: ${attempt + 1}/${retries})`);
                    if (attempt < retries - 1) {
                        console.warn(`Retrying image load (${attempt + 1}/${retries})...`);
                        loadImage(attempt + 1);
                    } else {
                        img.remove();
                        reject(new Error(`Failed to load the image after ${retries} attempts: ${urlOrDimensions}`));
                    }
                };

                img.src = urlOrDimensions;
            };

            loadImage(0);
            document.body.appendChild(img);
        } else {
            reject(new Error("Invalid input. Expected an object with width and height or a URL string."));
        }
    });
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

async function replaceWithEmotes(inputString, TTVMessageEmoteData, userstate, channel) {
    if (!inputString) { return inputString }
    let lastEmote = false;
    const isBetaTester = await is_beta_tester();

    inputString = sanitizeInput(inputString)

    try {
        await updateAllEmoteData();

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
            ...emojiData,
        ];

        if (emoteData.length === 0) return inputString;

        let EmoteSplit = await splitTextWithTwemoji(inputString);

        let foundMessageSender = null

        if (userstate) {
            foundMessageSender = TTVUsersData.find(user => user.name === `@${userstate.username}`);
        }

        const replacedParts = [];

        for (let i = 0; i < EmoteSplit.length; i++) {
            let part = EmoteSplit[i];
            let foundEmote;
            let foundUser;
            let emoteType = '';

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

                if (!foundEmote) {
                    part = part.emoji;
                }
            }

            if (!foundEmote) {
                if (userstate && userstate['bits']) {
                    let match = part.match(/^([a-zA-Z]+)(\d+)$/);

                    if (match) {
                        let prefix = match[1]; // Prefix
                        let bits = match[2]; // Amount

                        let result = findEntryAndTier(prefix, bits);

                        if (result) {
                            foundEmote = {
                                name: result.name,
                                url: result.tier.url,
                                site: 'Cheer Emote',
                                color: result.tier.color,
                                bits: `<div class="bits-number">${bits}</div>`
                            };

                            emoteType = 'Bits';
                        }
                    }
                }
            }

            // Prioritize ttvEmoteData
            if (!foundEmote) {
                for (const emote of ttvEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Prioritize personalEmotes
            if (!foundEmote) {
                if (foundMessageSender && foundMessageSender.cosmetics) {
                    if (foundMessageSender.cosmetics.personal_emotes && foundMessageSender.cosmetics.personal_emotes.length > 0) {
                        for (const emote of foundMessageSender.cosmetics.personal_emotes) {
                            if (emote.name && part === sanitizeInput(emote.name)) {
                                foundEmote = emote;
                                emoteType = 'Personal';
                                break;
                            }
                        }
                    }
                }
            }

            // Prioritize nonGlobalEmoteData
            if (!foundEmote) {
                for (const emote of nonGlobalEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
                        break;
                    }
                }
            }

            // Search in allEmoteData
            if (!foundEmote) {
                for (const emote of allEmoteData) {
                    if (emote.name && part === sanitizeInput(emote.name)) {
                        foundEmote = emote;
                        emoteType = emote.site;
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
                let emoteHTML = '';

                if (emoteType != "Bits") {
                    for (const key in foundEmote) {
                        if (typeof foundEmote[key] === 'string') {
                            foundEmote[key] = sanitizeInput(foundEmote[key]);
                        }
                    };
                }

                let additionalInfo = '';
                if (foundEmote.original_name && foundEmote.name !== foundEmote.original_name) {
                    additionalInfo += `, Alias of: ${foundEmote.original_name}`;
                }

                let creator = foundEmote.creator ? `Created by: ${foundEmote.creator}` : '';
                let emoteStyle = `style="height: ${desiredHeight}px; position: absolute;"`;

                let { width, height } = foundEmote.width && foundEmote.height
                    ? { width: foundEmote.width, height: foundEmote.height }
                    : await getImageSize(foundEmote.url);

                // Calculate the aspect ratio if height and width are already present
                if (width && height) {
                    const aspectRatio = calculateAspectRatio(width, height, desiredHeight);
                    foundEmote.width = aspectRatio.width;
                    foundEmote.height = desiredHeight;
                } else {
                    foundEmote.height = desiredHeight;
                }

                let lastEmoteWrapper;
                let tempElement;
                if (replacedParts.length > 0) {
                    const lastHtml = replacedParts[replacedParts.length - 1];
                    tempElement = document.createElement('div');
                    tempElement.innerHTML = lastHtml;
                    lastEmoteWrapper = tempElement.querySelector('.emote-wrapper');
                }

                let willReturn = true;

                if (!lastEmoteWrapper || !lastEmote || !foundEmote.flags || foundEmote.flags !== 256) {
                    emoteHTML = `<span class="emote-wrapper" tooltip-name="${foundEmote.name}${additionalInfo}" tooltip-type="${emoteType}" tooltip-creator="${creator}" tooltip-image="${foundEmote.url}" style="color:${foundEmote.color || 'white'}">
                                    <a href="${foundEmote.emote_link || foundEmote.url}" target="_blank;" style="display: inline-flex; justify-content: center">
                                        <img src="imgs/8mmSocketWrench.png" alt="ignore" class="emote" style="height: ${desiredHeight}px; width: ${foundEmote.width}px; position: relative; visibility: hidden;" loading="lazy">
                                        <img src="${foundEmote.url}" alt="${foundEmote.emoji || foundEmote.name}" class="emote" ${emoteStyle} loading="lazy">
                                    </a>
                                    ${foundEmote.bits || ''}
                                </span>`;
                } else if (lastEmoteWrapper && lastEmote && foundEmote.flags && foundEmote.flags === 256) {
                    willReturn = false;

                    emoteStyle = `style="height: ${desiredHeight}px; position: absolute;"`;

                    const currentTooltipName = lastEmoteWrapper.getAttribute('tooltip-name') || '';
                    lastEmoteWrapper.setAttribute('tooltip-name', `${currentTooltipName}, ${foundEmote.name}`.trim());

                    const aTag = lastEmoteWrapper.querySelector('a');
                    aTag.innerHTML += `<img src="${foundEmote.url}" alt="${foundEmote.name}" class="emote" ${emoteStyle} loading="lazy">`;

                    const targetImg = lastEmoteWrapper.querySelector('img[src="imgs/8mmSocketWrench.png"]');
                    if (targetImg) {
                        const targetWidth = parseInt(targetImg.style.width);
                        const foundWidth = parseInt(foundEmote.width);

                        if (targetWidth < foundWidth) {
                            targetImg.style.width = `${foundEmote.width}px`;
                        }
                    }

                    replacedParts[replacedParts.length - 1] = tempElement.innerHTML;
                }

                lastEmote = true;
                if (willReturn) {
                    replacedParts.push(emoteHTML);
                }
            } else if (foundUser) {
                lastEmote = false;
                if (userSettings && userSettings['msgCaps']) {
                    part = part.toUpperCase()
                }

                let userName = part

                if (foundUser.name) {
                    userName = foundUser.name.replace("@", "")
                }

                let avatar = "" //foundUser.cosmetics?.avatar_url || foundUser.avatar || await getAvatarFromUserId(channelTwitchID || 141981764);

                const userHTML = `<span class="name-wrapper" tooltip-name="${userName}" tooltip-type="User" tooltip-creator="" tooltip-image="${avatar}">
                            <strong style="color: ${foundUser.color}">${part}</strong>
                        </span>`;

                replacedParts.push(userHTML);
            } else {
                if (userSettings && userSettings['msgCaps']) {
                    part = part.toUpperCase()
                }

                lastEmote = false;

                if (part) {
                    part = twemoji.parse(part, {
                        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
                        folder: 'svg',
                        ext: '.svg',
                        className: 'twemoji'
                    });
                }

                if (userstate && !userstate["no-link"]) {
                    part = await makeLinksClickable(part);
                }

                replacedParts.push(part);
            }
        }

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

    if (((isUsernameMentioned || isUsernameMentionedInReplyBody) && (!userstate.noPing && !TTVUserRedeems[userstate.username])) && tmiUsername !== "none") {
        if (tmiUsername !== userstate.username) {
            if (isUsernameMentioned) {
                const audio = new Audio('sounds/ping.mp3');
                audio.play();
            } else if (isUsernameMentionedInReplyBody) {
                const audio = new Audio('sounds/ping_reply.mp3');
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
    } else if (userstate['bits']) {
        userstate["message_label"] = '#660061'
    } else {
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
    }

    if (userSettings && userSettings['arabic']) {
        if (isArabic(message)) {
            messageElement.setAttribute('dir', 'rtl');
            messageElement.setAttribute('lang', 'ar');
        }
    }

    if (TTVUserRedeems[userstate.username]) {
        userstate["message_label"] = TTVUserRedeems[userstate.username]

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

    const custom_badge = customBadgeData.find(badge => badge.users.includes(userstate["user-id"]));

    if (custom_badge) {
        badges.push({
            tooltip_name: custom_badge.title,
            badge_url: custom_badge.url,
            alt: custom_badge.title,
            background_color: undefined,
        });
    }

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
                        alt: "Moderator",
                        background_color: "#00ad03",
                    });

                    continue;
                }

                if (badge.id === "vip_1" && FFZUserBadgeData["vip_badge"]) {
                    badges.push({
                        tooltip_name: "VIP",
                        badge_url: FFZUserBadgeData["vip_badge"],
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
                    alt: badge.title,
                    background_color: undefined,
                    set: badge?.set || undefined
                });
            }
        }
    }

    const foundUser = TTVUsersData.find(user => user.name === `@${userstate.username}`);

    // Chatterino Badges

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

    const foundFFZBadge = FFZBadgeData.find(badge => badge.owner_username == userstate.username);

    if (foundFFZBadge) {
        badges.push({
            tooltip_name: foundFFZBadge.title,
            badge_url: foundFFZBadge.url,
            alt: foundFFZBadge.title,
            background_color: foundFFZBadge.color,
        });
    }

    if (FFZUserBadgeData["user_badges"] && FFZUserBadgeData["user_badges"][userstate.username]) {
        const foundBadge = FFZBadgeData.find(badge => badge.url === `https://cdn.frankerfacez.com/badge/${FFZUserBadgeData["user_badges"][userstate.username]}/4`)

        if (foundBadge) {
            badges.push({
                tooltip_name: foundBadge.title,
                badge_url: foundBadge.url,
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
                alt: foundBadge.title,
                background_color: undefined,
            });
        }
    }

    const badges_html = badges
        .map(badge => {
            const isSubscriber = badge?.set?.toLowerCase() === "subscriber";
            const subscriberMonths = userstate["badge-info"]?.subscriber || 0;
            const tooltipName = isSubscriber && subscriberMonths > 0
                ? `${badge.tooltip_name} (${subscriberMonths} months)`
                : badge.tooltip_name;

            return `<span class="badge-wrapper" tooltip-name="${tooltipName}" tooltip-type="Badge" tooltip-creator="" tooltip-image="${badge.badge_url}">
            <img style="background-color: ${badge.background_color || 'transparent'};" src="${badge.badge_url}" alt="${badge.alt}" class="badge" loading="lazy">
        </span>`;
        })
        .join("");

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

    if (messageDiv) {
        messageDiv.insertAdjacentHTML('beforeend', `<text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>`);
    }

    if (message_label !== "") {
        messageElement.style.paddingLeft = '11px';
    }

    if (!has_margin || message_label !== "") {
        messageElement.style.marginBottom = '0px';
    } else {
        messageElement.style.marginBottom = '5px';
    }

    if (userstate.custom_emotes) {
        TTVMessageEmoteData = userstate.custom_emotes
    }

    // Display emotes

    let results = messageHTML

    if (!userstate["noEmotes"]) {
        results = await replaceWithEmotes(message, TTVMessageEmoteData, userstate);
    }

    rendererMessage = results;

    if (userSettings && userSettings['msgBold']) {
        rendererMessage = `<strong>${results}</strong>`;
    }

    let prefix = ''

    if (channel && channel.toLowerCase().replace('#', '') !== broadcaster) {
        //prefix = `<text class="time" style="color: rgba(255, 255, 255, 0.7);">(${channel})</text>`
    }

    let reply = ''
    const replyUser = TTVUsersData.find(user => user.name.trim() === `@${userstate['reply-parent-user-login']}`);

    if (userstate['reply-parent-msg-body']) {
        let replyColor = 'white'
        let replyPrefix = ''

        if (replyUser && replyUser.color) {
            replyColor = replyUser.color || 'white'
        }

        const replyMessage = sanitizeInput(userstate['reply-parent-msg-body'])
        const limitedReply = replyMessage && replyMessage.length > 100
            ? replyMessage.slice(0, 100) + '...'
            : replyMessage;

        if (userstate && userstate['reply-parent-msg-body'] && !isUsernameMentioned) {
            if (isUsernameMentionedInReplyBody) {
                replyPrefix = " (Mentioned)"
            }
        }

        reply = `<div class="reply"><img src="imgs/msgReply.png" loading="lazy"> <text class="time" style="color: rgba(255, 255, 255, 0.1);">Replying to${replyPrefix}</text> <text class="time" style="color: ${replyColor};"><strong>@${userstate['reply-parent-user-login']}:</strong></text> ${limitedReply} </div>`
    }

    let finalMessageHTML = `<div class="message-text">
                                ${message_label}
                                ${prefix} ${reply} ${badges_html}
                                    <span class="name-wrapper" tooltip-name="${finalUsername.replace(":", "")}" tooltip-type="User" tooltip-creator="" tooltip-image="">
                                        <strong id="username-strong">${finalUsername}</strong>
                                    </span>
                                ${results}
                            </div>`;

    if (!userstate["noEmotes"]) {
        messageElement.innerHTML = finalMessageHTML;
    }

    messageDiv = messageElement.querySelector('.message-text');

    if (messageDiv) {
        messageDiv.insertAdjacentHTML('beforeend', `<text class="time" style="color: rgba(255, 255, 255, 0.1);">(${hours}:${minutes}:${seconds})</text>`);

        if (message_id != "0") {
            const formHTML = `<form style="display: inline;" onsubmit="reply_to('${message_id}', '${userstate["username"]}'); return false;" id="reply-button-wrapper">
                                <input type="image" src="imgs/reply_button.png" alt="reply" width="25" height="25" loading="lazy">
                            </form>`;

            messageDiv.insertAdjacentHTML('beforeend', formHTML);
        }
    }

    if (message_label !== "") {
        messageElement.style.paddingLeft = '11px';
    }

    if (!has_margin || message_label !== "") {
        messageElement.style.marginBottom = '0px';
    } else {
        messageElement.style.marginBottom = '5px';
    }

    // Select all elements with class "name-wrapper"
    var usernames = messageElement.querySelectorAll('.name-wrapper');

    if (usernames && usernames.length > 0) {
        // Iterate through each element
        usernames.forEach(async function (element) {
            const strongElement = element.querySelector('strong');

            if (strongElement) {
                const name = `@${strongElement.innerHTML.replace('@', '').replace(',', '').replace(':', '')}`.toLowerCase()

                const foundUser = TTVUsersData.find(user => user.name === name);

                if (foundUser) {
                    if (foundUser.cosmetics) {
                        await displayCosmeticPaint(foundUser.userId, foundUser.color, strongElement);

                        const paintName = await getPaintName(foundUser.userId)

                        if (paintName) {
                            element.setAttribute('tooltip-creator', `Paint: ${paintName}`);
                        }
                    } else {
                        let color = getRandomTwitchColor()

                        if (foundUser && foundUser.color) {
                            color = lightenColor(foundUser.color)
                        } else {
                            if (userstate && userstate.color) {
                                color = lightenColor(userstate.color)
                            }
                        }

                        strongElement.style.color = color;
                    }
                } else {
                    let color = getRandomTwitchColor()

                    if (foundUser && foundUser.color) {
                        color = lightenColor(foundUser.color)
                    } else {
                        if (userstate && userstate.color) {
                            color = lightenColor(userstate.color)
                        }
                    }

                    strongElement.style.color = color;
                }
            }
        });
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
    } catch (error) {
        console.error(error)
    }
}

async function loadCustomBadges() {
    const response = await fetch('https://api.github.com/gists/7f360e3e1d6457f843899055a6210fd6');

    if (!response.ok) {
        debugChange("GitHub", "badges_gists", false);
        return;
    } else {
        debugChange("GitHub", "badges_gists", true);
    }

    let data = await response.json()

    if (!data["files"] || !data["files"]["badges.json"] || !data["files"]["badges.json"]["content"]) {
        debugChange("GitHub", "badges_gists", true);
        return;
    }

    data = JSON.parse(data["files"]["badges.json"]["content"])

    if (!data || !data["YAUTC"]) {
        debugChange("GitHub", "badges_gists", true);
        return;
    }

    customBadgeData = data["YAUTC"]
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

        const streamInfo = await parseStreaminfo(broadcasterUserData);

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
            parts.push(`Slow (${chat_settings.slow_mode_wait_time}s)`);
        }
        if (chat_settings.follower_mode) {
            parts.push(`Follow (${chat_settings.follower_mode_duration}m)`);
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
                                    title: badge.title,
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
        title: '7TV'
    })

    TTVGlobalBadgeData.push({
        id: 'BTTVServer' + "_" + 1,
        url: 'badges/BTTV.png',
        title: 'BTTV'
    })

    TTVGlobalBadgeData.push({
        id: 'FFZServer' + "_" + 1,
        url: 'badges/FFZ.png',
        title: 'FFZ'
    })

    TTVGlobalBadgeData.push({
        id: 'Server' + "_" + 1,
        url: 'badges/SERVER.png',
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

async function sendMessage() {
    const textContent = chatInput.value;

    if (textContent && textContent !== '' && textContent !== ' ') {
        let message = textContent

        if (message.startsWith('/')) {
            const messagesSplit = message.split(" ")

            if (commands.includes(messagesSplit[0])) {
                handleCommands(messagesSplit);
            } else {
                handleMessage(custom_userstate.Server, `${messagesSplit[0]} is not a command.`);
            }

            message = message.trimEnd() + ' ';

            messages.push(message);
            currentIndex = messages.length;
            tempMessage = '';
        } else {
            //TWITCH API
            sendAPIMessage(message);
        }

        reply_to("0", "none");

        if (!pressedKeys["Control"]) {
            chatInput.value = ''
        }
    }
}

async function handleCommands(messageSplit) {
    if (messageSplit[0] === "/usercard") {
        openCard(messageSplit[1]);
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

    message = message.trimEnd() + ' ';

    messages.push(message);
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

            await subscribeToEvent(sessionId, 'channel.update', condition);

            // Subscribe to raids
            condition = {
                from_broadcaster_user_id: channelTwitchID
            }

            await subscribeToEvent(sessionId, 'channel.raid', condition);

            // Subscribe to chat setting changes
            condition = {
                broadcaster_user_id: channelTwitchID,
                user_id: userTwitchId
            }

            await subscribeToEvent(sessionId, 'channel.chat_settings.update', condition);
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

async function subscribeToEvent(sessionId, eventType, condition) {
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
                version: '1',
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
            let TTVMessageEmoteData = [];
            let results = await replaceWithEmotes(streamInfo.title, TTVMessageEmoteData);

            const mentions = results.match(/@(\w+)/g)

            if (mentions && mentions.length > 0) {
                for (const element of mentions) {
                    const username = element.replace('@', '');
                    const user = await getTTVUser(username);

                    const regex = new RegExp(`(?<!<[^>]+>)${element}(?![^<]*>)`, 'g');

                    if (results.match(regex)) {
                        const replacement = `<a href="${window.location.protocol}//${window.location.host}/YAUTC/#/${username}" style="color:${lightenColor(await getUserColorFromUserId(user.data[0].id))}; text-decoration: none;">${element}</a>`;

                        results = results.replace(regex, replacement);

                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }

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

                            const paintName = await getPaintName(foundUser.userId)

                            if (paintName) {
                                strongElement.setAttribute('tooltip-creator', `Paint: ${paintName}`);
                            }
                        } else {
                            strongElement.style = `color: white`;
                        }
                    } else {
                        strongElement.style = `color: white`;
                    }
                }
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
            let actualData = data.data[0]
            let gameInfo = await getGameInfo(actualData["game_id"])
            return {
                title: actualData.title,
                category: actualData.game_name,
                viewers: actualData.viewer_count,
                categoryImage: gameInfo.data[0]["box_art_url"].replace('{width}x{height}', '144x192'),
                time: new Date(actualData["started_at"]),
                username: actualData.user_name
            };
        } else {
            const data = await getOfflineStreamData()

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
                username: actualData.broadcaster_name
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
        //console.log(TTVGlobalEmoteData)
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

            blockedUsersData.push(
                ...data.data
                    .map(user => ({
                        username: user["user_login"]
                    }))
            );

            if (data.pagination && data.pagination.cursor) {
                cursor = data.pagination.cursor;
            } else {
                break;
            }
        }

        //console.log(FgMagenta + 'Success in getting TTV blocked users!' + FgWhite);
    } catch (error) {
        console.log('Error fetching blocked users data:', error);
        throw error;
    }
}

// SevenTV

async function loadSevenTV() {
    try {
        await chat_alert(custom_userstate.SevenTV, 'LOADING')

        SevenTVID = await get7TVUserID(channelTwitchID);
        await get7TVEmoteSetID(SevenTVID);
        SevenTVGlobalEmoteData = await fetch7TVEmoteData('global');
        await chat_alert(custom_userstate.SevenTV, 'LOADED GLOBAL EMOTES')

        SevenTVEmoteData = await fetch7TVEmoteData(SevenTVemoteSetId);

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
            const streamInfo = await parseStreaminfo(broadcasterInfo)

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
                url: `https://cdn.7tv.app/emote/${emote.id}/${emote4x?.name || "1x.avif"}`,
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
                    userName = 'none' //await getUsernameFromUserId(messageData.channel.split(':')[1])
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

let EmoteI = 0
let TabEmotes = [];
let TabLatestWord = '';
let latestKey = '';
let inputChanged = false;

document.addEventListener('keydown', async function (event) {
    await updateAllEmoteData();
    //handleMessage(custom_userstate.Server, event.key)

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

                const mappedCommands = commands.map(command => ({ name: command }));

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

                    if (!TabLatestWord.startsWith('@') && !TabLatestWord.startsWith(':')) {
                        tabEmoteData.forEach(emote => {
                            if (emote.name) {
                                if (emote.name.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(emote.name);
                                }
                            }
                        })
                    } else if (TabLatestWord.startsWith('@')) {
                        TTVUsersData.forEach(user => {
                            if (user) {
                                if (user.name.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(user.name);
                                }
                            }
                        })
                    } else if (TabLatestWord.startsWith(":")) {
                        if (emojiData.length === 0) { mapEmojis(); return; }

                        // Emojis
                        emojiData.forEach(emote => {
                            if (emote.name) {
                                if (`:${emote.name}:`.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(emote.emoji);
                                }
                            }
                        })

                        // Emotes like :) :(
                        tabEmoteData.forEach(emote => {
                            if (emote.name) {
                                if (emote.name.toLowerCase().startsWith(TabLatestWord.toLowerCase())) {
                                    TabEmotes.push(emote.name);
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
            } else {
                currentIndex = messages.length;
                chatInput.value = tempMessage;
            }
        } else if (event.key === 'ArrowDown') {
            if (currentIndex < messages.length) {
                currentIndex++;

                if (currentIndex < messages.length) {
                    chatInput.value = messages[currentIndex];
                } else {
                    chatInput.value = tempMessage;
                }
            } else {
                currentIndex = 0;
                chatInput.value = tempMessage;
            }
        }

        chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
        chatInput.scrollLeft = chatInput.scrollWidth;
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

chatInput.addEventListener('input', function (event) {
    latestKey = event.key

    if (latestKey !== 'Tab') {
        inputChanged = true;
    } else {
        TabEmotes = [];
        inputChanged = false;
    }
});

function hexToRgba(hex, alpha) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Validate the hex color format
    if (!/^([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hex)) {
        throw new Error('Invalid hex color format');
    }

    let r, g, b;
    if (hex.length === 3) {
        // If the hex is in shorthand form (e.g. #fff)
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else {
        // If the hex is in full form (e.g. #ffffff)
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// USAGE #hex OR rgb(r, g, b)
function lightenColor(color) {
    let r, g, b;

    if (color.startsWith('#')) {
        // Hex input
        let bigint = parseInt(color.replace('#', ''), 16);
        r = (bigint >> 16) & 255;
        g = (bigint >> 8) & 255;
        b = bigint & 255;
    } else if (color.startsWith('rgb')) {
        // RGB input
        let rgbMatch = color.match(/\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            r = parseInt(rgbMatch[1]);
            g = parseInt(rgbMatch[2]);
            b = parseInt(rgbMatch[3]);
        } else {
            throw new Error('Invalid RGB color format');
        }
    } else {
        throw new Error('Unsupported color format');
    }

    const isCloseToBlack = (r, g, b, threshold = 50) => {
        return r < threshold && g < threshold && b < threshold;
    };

    if (isCloseToBlack(r, g, b)) {
        const lightenAmount = 40;
        r = Math.min(r + lightenAmount, 255);
        g = Math.min(g + lightenAmount, 255);
        b = Math.min(b + lightenAmount, 255);
    }

    const rgbToHex = (r, g, b) => {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    return rgbToHex(r, g, b);
}

function updateTimer() {
    if (startTime && startTime != NaN && startTime != null && startTime != 'offline') {
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - startTime.getTime();

        // Calculate hours, minutes, seconds
        let seconds = Math.floor((timeDifference / 1000) % 60);
        let minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
        let hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);

        // Add leading zeros if necessary
        seconds = seconds < 10 ? `0${seconds}` : seconds;
        minutes = minutes < 10 ? `0${minutes}` : minutes;
        hours = hours < 10 ? `0${hours}` : hours;

        // Display the timer in the console or update your HTML element
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

setInterval(updateTimer, 1000);
setInterval(loadCustomBadges, 900000);
client.addListener('message', handleChat); // TMI.JS
reloadButton.addEventListener('click', Load);
emoteButton.addEventListener('click', displayEmotePicker);
chatDisplay.addEventListener('wheel', handleScroll, { passive: true });

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
            message = `${userstate} redeemed redeem_image ${foundRedeem.title} for ${foundRedeem.cost} points_Image ${TTVRedemsData?.title || "points"}`

            userstate = {
                noPing: true,
                message_label: String(foundRedeem.color),
                username: '',
                custom_emotes: [
                    {
                        emote_link: TTVRedemsData.image,
                        flags: 0,
                        name: "points_Image",
                        site: "Points Icon",
                        url: TTVRedemsData.image
                    },
                    {
                        emote_link: foundRedeem.image,
                        flags: 0,
                        name: "redeem_image",
                        site: "Redeem Icon",
                        url: foundRedeem.image
                    }
                ]
            }

            TTVUserRedeems[`${username}`] = String(foundRedeem.color);
        }
    }

    if (message !== 'highlighted-message') {
        userstate["no-link"] = true;

        handleMessage(userstate, message, channel)
    } else {
        TTVUserRedeems[`${username}`] = '#00dbdb';

        const foundUser = TTVUsersData.find(user => user.name === `@${userstate}`);

        if (foundUser && foundUser.color) {
            TTVUserRedeems[`${username}`] = foundUser.color;
        }
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

    announcementState["emotes"] = userstate.emotes;

    const finalMessage = `${systemMsg || `${username} subscribed in the channel${tierDisplay}${methodDisplay}`}`;

    if (subMessage) {
        announcementState["username"] = username;

        await handleMessage(announcementState, subMessage, channel);
    }

    handleMessage({ ...custom_userstate.TTVAnnouncement, noEmotes: true }, finalMessage, channel);
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

    announcementState["emotes"] = userstate.emotes;

    const finalMessage = `${systemMsg || `${username} resubscribed in the channel${tierDisplay}${duration}${methodDisplay}`}`;

    if (subMessage) {
        announcementState["username"] = username;

        await handleMessage(announcementState, subMessage, channel);
    }

    handleMessage({ ...custom_userstate.TTVAnnouncement, noEmotes: true }, finalMessage, channel);
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

    const finalMessage = systemMsg || `${username} gifted ${subCount} in the channel! They have gifted ${senderCount} total subscriptions so far.`;

    handleMessage(custom_userstate.TTVAnnouncement, finalMessage, channel);
});

client.on("giftpaidupgrade", (channel, username, sender, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    const finalMessage = systemMsg || `${username} continued their gift sub from ${sender} in the channel.`;

    handleMessage(custom_userstate.TTVAnnouncement, finalMessage, channel);
});

client.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
    if (channel.startsWith('#')) {
        channel = channel.slice(1);
    }

    const systemMsg = userstate["system-msg"];
    const tier = userstate["msg-param-sub-plan"];
    const tierDisplay = tier ? ` (Tier ${tier / 1000})` : "";
    const senderCount = ~~userstate["msg-param-sender-count"];

    const finalMessage = systemMsg || `${username} gifted a subscription${tierDisplay} to ${recipient} in the channel. They have gifted ${senderCount} total subscriptions so far.`;

    handleMessage(custom_userstate.TTVAnnouncement, finalMessage, channel);
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
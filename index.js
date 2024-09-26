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
let accessToken = '0';
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

let BlockedEmotesData = [];

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
    return false
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
    return inputString
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
    if (channel && channel.toLowerCase().replace('#', '') === broadcaster) {
        onMessage(userstate, message)
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

async function LoadEmotes() {
    getBadges()
    
    try {
        client.disconnect();
        await handleMessage(ServerUserstate, 'LOADING')
    } catch (error) {
        await handleMessage(ServerUserstate, 'LOADING')
    }

    //TMI
    await handleMessage(ServerUserstate, 'CONNECTING TO TMI')

    client.connect().catch(console.log);

    console.log('LOADED!')

    loadedEmotes = true;

    await handleMessage(ServerUserstate, 'LOADED')
}

async function getBadges() {
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
}

LoadEmotes();

const reloadButton = document.getElementById('reloadButton');
const chatInput = document.getElementById('chatInput');

let EmoteI = 0
let TabEmotes = [];
let TabLatestWord = '';
let latestKey = '';
let inputChanged = false;

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

// Update
reloadButton.addEventListener('click', LoadEmotes);
client.addListener('message', handleChat);
const intervalId = setInterval(scrollToBottom, 500);

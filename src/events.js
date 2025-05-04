let pressedKeys = {};
let displayingFollowlist = false;
let mouseOverFollowList = false;
let theatreMode = false;

const dropdown = document.getElementById('dropdown');
const avatar = document.querySelector('.user_avatar');
const siteBlur = document.getElementById('site_blur');
const followedDiv0 = document.getElementById('followed');
const more_menu = document.getElementById('more_menu');
const followLists = document.querySelectorAll('.follow_list');
const followList = document.querySelector('#follow_list');
const stream_info = document.querySelector('#embed_container .stream_info');
const embed_container = document.querySelector('#embed_container');
const draggableElements = document.querySelectorAll('.draggable');
const settingsButton = document.getElementById('settings-button');
const chatOptionsButton = document.getElementById('chatOptionsButton');
const more_button = document.querySelector('.follow_list_button[aria-label="More"]');
const chat_pause = document.querySelector('.chat-pause');
const popups = document.querySelector('#popups');
const site_name = document.querySelector('.site_name');

let dropdownItems = undefined;

if (more_menu) { dropdownItems = more_menu.querySelectorAll('li'); };

async function checkSettings(event) {
    if (isOnMobile) { return; }
    if (followList) {
        if ((event || mouseOverFollowList || ((userSettings && userSettings["channelFollow"])) && !theatreMode)) {
            displayingFollowlist = true;

            followList.style.width = '';
            followList.style.opacity = '';
        } else {
            displayingFollowlist = false;

            followList.style.width = '0.5px';
            followList.style.opacity = '0';
        }
    }

    if (stream_info) {
        if (theatreMode) {
            stream_info.style.maxHeight = '0px';
            stream_info.style.opacity = '0';

            if (embed_container) {
                embed_container.style.marginTop = '7%';
            }
        } else {
            stream_info.style.maxHeight = '';
            stream_info.style.opacity = '';

            if (embed_container) {
                embed_container.style.marginTop = '';
            }
        }
    }
}

if (followList) {
    followList.addEventListener('mouseover', function () {
        checkSettings(true);
        mouseOverFollowList = true;
    });

    followList.addEventListener('mouseout', function () {
        checkSettings(false);
        mouseOverFollowList = false;
    });
}

function scrollToBottom() {
    try {
        if (autoScroll && chat_pause && chatDisplay) {
            chat_pause.innerHTML = '';
            chatDisplay.scrollTo({
                top: chatDisplay.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            if (chat_pause) {
                chat_pause.innerHTML = 'Chat Paused';
            }
        }
    } catch (err) { };
}

function handleButtonClick(buttonId) {
    console.log('Button ID:', buttonId);
}

document.addEventListener('click', function (event) {
    if (dropdown.classList.contains('visible') || settingsDiv.style.display === 'block') {
        if (!avatar.contains(event.target) && !dropdown.contains(event.target) && !settingsDiv.contains(event.target)) {
            dropdown.classList.remove('visible');
            settingsDiv.style.display = 'none';
        }
    }

    const nameWrapper = event.target.closest('.name-wrapper');

    if (nameWrapper) {
        openCard(event.target.innerHTML);
    }

    if ((chatOptionsButton && !chatOptionsButton.contains(event.target)) && (more_menu && !more_menu.contains(event.target))) {
        const isVisible = more_menu?.classList.contains('visible');

        if (isVisible) {
            more_menu.classList.remove('visible');
        }
    }

    if (isOnMobile) {
        if (more_button && followedDiv) {
            console.log(event.target)
            if (!followedDiv.contains(event.target) && !more_button.contains(event.target)) {
                displayMobileFolllowList(false);
            }
        }
    }
});

async function displayMobileFolllowList(display) {
    if (display) {
        siteBlur.classList.remove('no-blur');
        followedDiv.style.width = "100%"
    } else {
        siteBlur.classList.add('no-blur');
        followedDiv.style.width = "0%"
    }
}

if (more_button) {
    more_button.addEventListener('click', function () {
        console.log("clicked");
        displayMobileFolllowList(true);
    });
}

document.addEventListener('keydown', (event) => {
    pressedKeys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    delete pressedKeys[event.key];
});

if (document.querySelector('#followed')) {
    document.querySelector('#followed').addEventListener('mouseover', () => {
        if (!userSettings || userSettings['channelFollow']) { return; }

        displayFollowlist(true);
    });

    document.querySelector('#followed').addEventListener('mouseout', () => {
        if (!userSettings || userSettings['channelFollow']) { return; }

        displayFollowlist(false);
    });
}

document.querySelectorAll('.chat-reply #close-button').forEach(button => {
    button.addEventListener('click', function () {
        reply_to('0', 'none');
    });
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        localStorage.setItem('pageHidden', 'true');
        pressedKeys = {};
    } else {
        if (localStorage.getItem('pageHidden') === 'true') {
            console.log('Page restored without refresh.');
        }
        localStorage.removeItem('pageHidden');
    }
});

dropdown.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
        const buttonId = event.target.id;
        handleButtonClick(buttonId);
    }
});

settingsButton.addEventListener('click', function (event) {
    if (settingsDiv.style.display === 'block') {
        settingsDiv.style.display = 'none';
    } else {
        dropdown.classList.remove('visible');
        settingsDiv.style.display = 'block';
    }
});

avatar.addEventListener('click', function (event) {
    event.stopPropagation();

    if ((dropdown.classList.contains('visible'))) {
        dropdown.classList.remove('visible');
    } else {
        dropdown.classList.add('visible');
    }
});

function handleImageRetries() {
    document.querySelectorAll('img').forEach((img, index) => {
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            setTimeout(() => {
                img.src = img.src.split('?')[0] + '?retry=' + new Date().getTime();
            }, 500 * index);
        }
    });
}

if (chatOptionsButton && more_menu) {
    chatOptionsButton.addEventListener('click', () => {
        const isVisible = more_menu.classList.contains('visible');

        if (isVisible) {
            more_menu.classList.remove('visible');
        } else {
            more_menu.classList.add('visible');
        }
    });

    dropdownItems.forEach((item) => {
        item.addEventListener('click', async () => {
            more_menu.classList.remove('visible');

            const option_selected = item.textContent.toLowerCase();

            switch (option_selected) {
                case "reload":
                    Load();

                    break;
                case "reconnect to chat":
                    if (tmiConnected) {
                        try {
                            await client.disconnect();
                        } catch (error) {
                            await handleMessage(custom_userstate.Server, 'There was an error while disconnecting from the chat.');
                        }
                    } else {
                        await handleMessage(custom_userstate.Server, 'Not connected to chat.');
                    }
                    connectTmi();

                    break;
                case "reload emotes":
                    // SevenTV
                    loadSevenTV();

                    // BTTV
                    loadBTTV();

                    // FFZ
                    loadFFZ();

                    if (userClientId !== "0" && userToken) {
                        await handleMessage(custom_userstate.Server, 'Reloading Twitch global emotes.');

                        await fetchTTVGlobalEmoteData();

                        await handleMessage(custom_userstate.Server, 'Succesfully reloaded Twitch global emotes.');
                    } else {
                        await handleMessage(custom_userstate.Server, 'Failed reloading Twitch global: Not logged in.');
                    }

                    break;
                case "reload subcriber emotes":
                    if (userClientId !== "0" && userToken) {
                        await handleMessage(custom_userstate.Server, 'Reloading subscriber emotes.');

                        await fetchTTVEmoteData();

                        await handleMessage(custom_userstate.Server, 'Succesfully reloaded subscriber emotes.');
                    } else {
                        await handleMessage(custom_userstate.Server, 'Failed reloading subscriber emotes: Not logged in.');
                    }

                    break;
                case "update 7tv cosmetics":
                    await handleMessage(custom_userstate.Server, 'Trying to notify the 7TV EventSub websocket.');

                    const foundUser = TTVUsersData.find(user => user.name === `@${tmiUsername}`);

                    if (foundUser) {
                        if (foundUser.cosmetics && foundUser.cosmetics.user_id) {
                            notifyWebSocket(foundUser.cosmetics.user_id, channelTwitchID);
                            await handleMessage(custom_userstate.Server, 'Notified the 7TV EventSub websocket.');
                        } else {
                            await handleMessage(custom_userstate.Server, `Failed to notify the 7TV EventSub websocket, there is no 7TV userId for ${tmiUsername}.`);
                        }
                    } else {
                        await handleMessage(custom_userstate.Server, `Failed to notify the 7TV EventSub websocket, ${tmiUsername} was not found in user data.`);
                    }

                    break;
                case "reload badges":
                    await handleMessage(custom_userstate.Server, 'Reloading badges.');

                    if (userClientId !== "0" && userToken) {
                        await getBadges();
                    } else {
                        await getTwitchBadges();
                    }

                    await handleMessage(custom_userstate.Server, 'Succesfully reloaded badges.');

                    break;
                case "toggle theatre mode":
                    theatreMode = !theatreMode;

                    break;
                default:
                    await handleMessage(custom_userstate.Server, `Unknown option: ${option_selected}`);

                    break;
            }
        });
    });
}

setInterval(checkSettings, 500);
setInterval(scrollToBottom, 500);
setInterval(handleImageRetries, 10000);

const popupRuleset = {
    "done": { icon: "fa-check", color: "#256029" }, // dark green
    "error": { icon: "fa-times", color: "#8b1a1a" }, // dark red
    "warning": { icon: "fa-exclamation-triangle", color: "#b26a00" }, // dark orange
    "info": { icon: "fa-info-circle", color: "black" }, // black
    "question": { icon: "fa-question-circle", color: "#9a9af0" }, // lavender blue
    "alert": { icon: "fa-exclamation-circle", color: "#7b1b3a" }, // dark pink
};

function showPopupMessage(message) {
    if (!popups || !message.message) { return; }

    const ruleset = popupRuleset[message?.type] || {};
    const iconClass = ruleset.icon;
    const color = ruleset.color || "#333";

    const popup = document.createElement('div');
    popup.className = 'popup-message';
    popup.style.background = color || "black";
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';

    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `fa ${iconClass}`;
        icon.style.marginRight = '8px';
        icon.style.fontSize = '1em';
        popup.appendChild(icon);
    }

    const textNode = document.createElement('span');
    textNode.textContent = message.message;
    popup.appendChild(textNode);

    popups.appendChild(popup);

    setTimeout(() => {
        popup.classList.add('visible');
    }, 50);

    const minTime = 2500;
    const maxTime = 8000;
    const perChar = 80;
    const removalTime = Math.min(maxTime, Math.max(minTime, message.message.length * perChar));

    popup.addEventListener('click', () => {
        popup.classList.remove('visible');
        setTimeout(() => {
            popup.remove();
        }, 350);
    });

    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => {
            popup.remove();
        }, 350);
    }, removalTime);
}

const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
        const el = entry.target;
        if (el.offsetHeight > 5) {
            el.classList.add('border');
        } else {
            el.classList.remove('border');
        }
    });
});

document.querySelectorAll('.bottom').forEach(el => observer.observe(el));
document.querySelectorAll('.top').forEach(el => observer.observe(el));

// MOBILE
if (isOnMobile) {
    let xDown = null;
    let yDown = null;

    function handleTouchStart(evt) {
        xDown = evt.touches[0].clientX;
        yDown = evt.touches[0].clientY;
    }

    function handleTouchMove(evt) {
        if (!xDown || !yDown) return;

        let xUp = evt.touches[0].clientX;
        let yUp = evt.touches[0].clientY;

        let xDiff = xDown - xUp;
        let yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) >= 30) {
            if (xDiff > 0) {
                displayMobileFolllowList(false);
            } else {
                displayMobileFolllowList(true);
            }
            xDown = null;
            yDown = null;
        }
    }

    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
}

if (isOnMobile) {
    site_name.innerHTML = "YAUTC";
}
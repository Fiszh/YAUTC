let pressedKeys = {};
let displayingFollowlist = false;
let mouseOverFollowList = false;
let theatreMode = false;

const dropdown = document.getElementById('dropdown');
const avatar = document.querySelector('.user_avatar');
const siteBlur = document.getElementById('site_blur');
const followedDiv0 = document.getElementById('followed');
const dropdownMenu = document.getElementById('dropdownMenu');
const followLists = document.querySelectorAll('.follow_list');
const draggableElements = document.querySelectorAll('.draggable');
const settingsButton = document.getElementById('settings-button');
const chatOptionsButton = document.getElementById('chatOptionsButton');
const more_button = document.querySelector('.follow_list_button[aria-label="More"]');

let dropdownItems = undefined;

if (dropdownMenu) { dropdownItems = dropdownMenu.querySelectorAll('li'); };

async function checkSettings(event) {
    if (isOnMobile) { return; }
    if (event || mouseOverFollowList || ((userSettings && userSettings["channelFollow"]) && !theatreMode)) {
        displayingFollowlist = true;

        followLists[0].style.width = '100%';
        followLists[0].style.opacity = '1';
    } else {
        displayingFollowlist = false;

        followLists[0].style.width = '0%';
        followLists[0].style.opacity = '0.5';
    }

    const embed = document.getElementById("twitch-embed");

    if (embed) {
        if (theatreMode) {
            embed.style.width = "95%"
            embed.style.height = "95%"
        } else {
            embed.style.width = "0%"
            embed.style.height = "0%"
        }
    }
}

if (followLists?.[0]) {
    followLists[0].addEventListener('mouseover', function () {
        checkSettings(true);
        mouseOverFollowList = true;
    });

    followLists[0].addEventListener('mouseout', function () {
        checkSettings(false);
        mouseOverFollowList = false;
    });
}

function scrollToBottom() {
    try {
        if (autoScroll && document.querySelector('.chat-pause') && chatDisplay) {
            document.querySelector('.chat-pause').innerHTML = '';
            chatDisplay.scrollTo({
                top: chatDisplay.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            if (document.querySelector('.chat-pause')) {
                document.querySelector('.chat-pause').innerHTML = 'Chat Paused';
            }
        }
    } catch (err) { };
}

function handleButtonClick(buttonId) {
    console.log('Button ID:', buttonId);
}

document.addEventListener('click', function (event) {
    if (dropdown.style.display === 'block' || settingsDiv.style.display === 'block') {
        if (!avatar.contains(event.target) && !dropdown.contains(event.target) && !settingsDiv.contains(event.target)) {
            dropdown.style.display = 'none';
            settingsDiv.style.display = 'none';
        }
    }

    const nameWrapper = event.target.closest('.name-wrapper');

    if (nameWrapper) {
        openCard(event.target.innerHTML);
    }

    if ((chatOptionsButton && !chatOptionsButton.contains(event.target)) && (dropdownMenu && !dropdownMenu.contains(event.target))) {
        const isVisible = dropdownMenu?.classList.contains('visible');

        if (isVisible) {
            dropdownMenu.classList.remove('visible');
        }
    }

    if (more_button) {
        if (followedDiv) {
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
        pressedKeys = {};
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
        dropdown.style.display = 'none';
        settingsDiv.style.display = 'block';
    }
});

avatar.addEventListener('click', function (event) {
    event.stopPropagation();

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
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

if (chatOptionsButton && dropdownMenu) {
    chatOptionsButton.addEventListener('click', () => {
        const isVisible = dropdownMenu.classList.contains('visible');

        dropdownMenu.style.display = 'Block';

        if (isVisible) {
            dropdownMenu.classList.remove('visible');
        } else {
            dropdownMenu.classList.add('visible');
        }
    });

    dropdownItems.forEach((item) => {
        item.addEventListener('click', async () => {
            dropdownMenu.classList.remove('visible');
            dropdownMenu.style.display = 'none';

            const option_selected = item.textContent.toLowerCase();

            if (option_selected == "reload") {
                Load();
            } else if (option_selected == "reconnect to chat") {
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
            } else if (option_selected == "reload emotes") {
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
            } else if (option_selected == "reload subcriber emotes") {
                if (userClientId !== "0" && userToken) {
                    await handleMessage(custom_userstate.Server, 'Reloading subscriber emotes.');

                    await fetchTTVEmoteData();

                    await handleMessage(custom_userstate.Server, 'Succesfully reloaded subscriber emotes.');
                } else {
                    await handleMessage(custom_userstate.Server, 'Failed reloading subscriber emotes: Not logged in.');
                }
            } else if (option_selected == "update 7tv cosmetics") {
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
            } else if (option_selected == "reload badges") {
                await handleMessage(custom_userstate.Server, 'Reloading badges.');

                if (userClientId !== "0" && userToken) {
                    await getBadges();
                } else {
                    await getTwitchBadges();
                }

                await handleMessage(custom_userstate.Server, 'Succesfully reloaded badges.');
            } else if (option_selected == "toggle theatre mode") {
                theatreMode = !theatreMode;
            }
        });
    });
}

setInterval(checkSettings, 500);
setInterval(scrollToBottom, 500);
setInterval(handleImageRetries, 10000);

// MOBILE
if (isOnMobile) {
    let xDown = null;

    function handleTouchStart(evt) {
        xDown = evt.touches[0].clientX;
    }

    function handleTouchMove(evt) {
        if (!xDown) return;

        let xUp = evt.touches[0].clientX;
        let xDiff = xDown - xUp;

        console.log(xDiff);

        if (Math.abs(xDiff) > 10) {
            if (xDiff > 0) {
                displayMobileFolllowList(false);
            } else {
                displayMobileFolllowList(true);
            }
        }

        xDown = null;
    }

    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
}
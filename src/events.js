let pressedKeys = {};
let displayingFollowlist = false;

const dropdown = document.getElementById('dropdown');
const avatar = document.querySelector('.user_avatar');
const followedDiv0 = document.getElementById('followed');
const settingsButton = document.getElementById('settings-button');
const followLists = document.getElementsByClassName('followList');
const draggableElements = document.querySelectorAll('.draggable');
const chatOptionsButton = document.getElementById('chatOptionsButton');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownItems = dropdownMenu.querySelectorAll('li');

async function displayFollowlist(event) {
    return
    if (event) {
        const images = document.querySelectorAll('#followed .followed-stream img');

        displayingFollowlist = true;

        document.querySelector('.chat').style.transition = 'width 0.3s ease';
        document.querySelector('#twitch-embed').style.transition = 'height 0.3s ease';
        document.querySelector('.chat').style.width = '31.7%';
        document.querySelector('#twitch-embed').style.height = '86%';

        followLists[0].style.width = '5%';
        followLists[0].style.opacity = '1';

        images.forEach(img => {
            img.style.opacity = '1';
        });
    } else {
        const images = document.querySelectorAll('#followed .followed-stream img');

        displayingFollowlist = false;

        document.querySelector('.chat').style.transition = 'width 0.3s ease';
        document.querySelector('#twitch-embed').style.transition = 'height 0.3s ease';
        document.querySelector('.chat').style.width = '30%';
        document.querySelector('#twitch-embed').style.height = '91%';

        followLists[0].style.width = '0.5%';
        followLists[0].style.opacity = '0.5';

        images.forEach(img => {
            img.style.opacity = '0';
        });
    }
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

    if (!chatOptionsButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
        const isVisible = dropdownMenu.classList.contains('visible');

        if (isVisible) {
            dropdownMenu.classList.remove('visible');
        }
    }
});

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

function initializeDraggable(draggable) {
    let isDragging = false;
    let offsetX, offsetY;

    draggable.addEventListener('mousedown', (event) => {
        isDragging = true;
        offsetX = event.clientX - draggable.offsetLeft;
        offsetY = event.clientY - draggable.offsetTop;

        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
        if (isDragging) {
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            const maxX = window.innerWidth - draggable.offsetWidth - 10;
            const maxY = window.innerHeight - draggable.offsetHeight - 10;

            let newX = mouseX - offsetX;
            let newY = mouseY - offsetY;

            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX > maxX) newX = maxX;
            if (newY > maxY) newY = maxY;

            draggable.style.left = newX + 'px';
            draggable.style.top = newY + 'px';
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.body.style.userSelect = '';

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('draggable')) {
                initializeDraggable(node);
            }
        });
    });
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
        }
    });
});

setInterval(scrollToBottom, 500);
setInterval(handleImageRetries, 10000);
observer.observe(document.body, { childList: true, subtree: true });
draggableElements.forEach(initializeDraggable);
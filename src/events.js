let pressedKeys = {};
let displayingFollowlist = false;

const dropdown = document.getElementById('dropdown');
const avatar = document.querySelector('.user_avatar');
const followedDiv0 = document.getElementById('followed');
const settingsButton = document.getElementById('settings-button');
const followLists = document.getElementsByClassName('followList');
const draggableElements = document.querySelectorAll('.draggable');

async function displayFollowlist(event) {
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
    } catch (err) {}; 
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

draggableElements.forEach(initializeDraggable);

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && node.classList.contains('draggable')) {
                initializeDraggable(node);
            }
        });
    });
});

setInterval(scrollToBottom, 500);
observer.observe(document.body, { childList: true, subtree: true });
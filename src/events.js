let pressedKeys = {};

const dropdown = document.getElementById('dropdown');
const avatar = document.querySelector('.user_avatar');
const followedDiv0 = document.getElementById('followed');
const settingsButton = document.getElementById('settings-button');
const followLists = document.getElementsByClassName('followList');
let displayingFollowlist = false;

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

document.addEventListener('keydown', (event) => {
    pressedKeys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    delete pressedKeys[event.key];
});

avatar.addEventListener('click', function(event) {
    event.stopPropagation();

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
});

document.addEventListener('click', function(event) {
    if (dropdown.style.display === 'block' || settingsDiv.style.display === 'block') {
        if (!avatar.contains(event.target) && !dropdown.contains(event.target) && !settingsDiv.contains(event.target)) {
            dropdown.style.display = 'none';
            settingsDiv.style.display = 'none';
        }
    }
});

function handleButtonClick(buttonId) {
    console.log('Button ID:', buttonId);
}

dropdown.addEventListener('click', function(event) {
    if (event.target.tagName === 'A') {
        const buttonId = event.target.id;
        handleButtonClick(buttonId);
    }
});

settingsButton.addEventListener('click', function(event) {
    if (settingsDiv.style.display === 'block') {
        settingsDiv.style.display = 'none';
    } else {
        dropdown.style.display = 'none';
        settingsDiv.style.display = 'block';
    }
});

document.querySelectorAll('.chat-reply #close-button').forEach(button => {
    button.addEventListener('click', function() {
        reply_to('0', 'none');
    });
});

function scrollToBottom() {
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
}

setInterval(scrollToBottom, 500);
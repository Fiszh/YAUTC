let pressedKeys = {};

const avatar = document.querySelector('.user_avatar');
const dropdown = document.getElementById('dropdown');
const settingsButton = document.getElementById('settings-button');

if (document.querySelector('#followed')) {
    document.querySelector('#followed').addEventListener('mouseover', () => {
        document.querySelector('.chat').style.transition = 'width 0.3s ease';
        document.querySelector('#twitch-embed').style.transition = 'height 0.3s ease';
        document.querySelector('.chat').style.width = '31.7%';
        document.querySelector('#twitch-embed').style.height = '79.8%';
    });
    
    document.querySelector('#followed').addEventListener('mouseout', () => {
        document.querySelector('.chat').style.transition = 'width 0.3s ease';
        document.querySelector('#twitch-embed').style.transition = 'height 0.3s ease';
        document.querySelector('.chat').style.width = '30%';
        document.querySelector('#twitch-embed').style.height = '85.8%';
    });
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
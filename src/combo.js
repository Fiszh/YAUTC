let comboDisplay = document.getElementById("ComboDisplay");
let currentUsers = [];
let latestMessage = '';
let combo = 1;

let messageElement;

async function replaceWordsWithEmotes(element, message, Combo, color) {
    let results = await replaceWithEmotes(message, TTVEmoteData);

    element.innerHTML = `
        <div class="combo">
            <p class="combo-text" style="color: ${color};">${results} ${Combo}x</p>
            <button class="combo-button">Send</button>
        </div>
    `;

    const button = element.querySelector('.combo-button');
    button.addEventListener('click', () => {
        sendAPIMessage(message);
    });
}

function onMessage(userstate, message) {
    if (!userstate) { return; }

    if (latestMessage !== message) {

        latestMessage = message;
        combo = 1;
        currentUsers = [];
    }

    if (combo > 1) {
        if (latestMessage !== message || !messageElement || combo === 2) {
            messageElement = document.createElement("div");
            messageElement.classList.add('combo');
        }

        const greenBlueValue = Math.max(0, 255 - combo * 5);
        const color = `rgb(255, ${greenBlueValue}, ${greenBlueValue})`;

        messageElement.innerHTML = `
            <div class="combo">
                <p class="combo-text" style="color: ${color};">${message} ${combo}x</p>
                <button class="combo-button">Send</button>
            </div>
        `;

        if (latestMessage !== message || combo === 2) {
            comboDisplay.insertBefore(messageElement, comboDisplay.firstChild);
        }

        replaceWordsWithEmotes(messageElement, message, combo, color)

        const button = messageElement.querySelector('.combo-button');
        button.addEventListener('click', () => {
            sendAPIMessage(message);
        });
    }

    while (comboDisplay.children.length >= 100) {
        comboDisplay.removeChild(comboDisplay.lastChild);
    }

    if (!currentUsers.find(user => user === userstate.username)) {
        currentUsers.push(userstate.username);
        if (latestMessage === message) {
            combo += 1;
        }
    }
}

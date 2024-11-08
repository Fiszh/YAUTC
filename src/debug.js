const debugWindow = document.getElementsByClassName("debug-window")[0];

const debugInfo = {
    TTV: {
        name: 'Twitch',
        tiles: [
            "chat_connection",
            "event_sub",
            "user_profile",
            "offline_stream_info",
            "stream_info",
            "emotes_global",
            "bits_emotes",
            "user_emotes",
            "blocked_users",
            "message_send",
            "badges_global",
            "badges_channel",
            "GQL"
        ],
    },
    SevenTV: {
        name: '7TV',
        tiles: [
            "user_profile",
            "channel_set",
            "emotes_global",
            "emotes_channel",
            "websocket"
        ],
    },
    BTTV: {
        name: 'BetterTwitchTV',
        tiles: [
            "user_profile",
            "emotes_global",
            "emotes_channel",
            "websocket"
        ],
    },
    FFZ: {
        name: 'FrankerFaceZ',
        tiles: [
            "user_profile",
            "emotes_global",
            "emotes_channel",
            "badges_global",
            "badges_channel"
        ],
    }
};

function displayDebug() {
    if (!debugInfo) { return; }

    for (const key in debugInfo) {
        const debug = debugInfo[key];

        const debugDiv = document.createElement('div');
        debugDiv.className = 'debug-part';
        debugDiv.id = debug.name

        let tiles = '';

        for (const tile of debug.tiles) {
            tiles += `<div class="debug-tile" id="${tile}" tooltip-name="${tile}"></div> `;
        }

        debugDiv.innerHTML = `
                                <div class="debug-name">${debug.name}</div>
                                ${tiles}
                            `;

        debugWindow.append(debugDiv);
    }
}

function debugChange(name, part, value) {
    const parentElement = document.getElementById(name);

    if (!parentElement) { return; }

    const element = parentElement.querySelector(`#${part}`);

    if (!element) { return; }

    if (value === true) {
        element.style.backgroundColor = '#32673b';
    } else if (value === false) {
        element.style.backgroundColor = '#802424';
    } else {
        element.style.backgroundColor = '#ffffff';
    }
}

displayDebug();
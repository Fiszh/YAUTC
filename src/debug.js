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
            "chat_settings",
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
            "websocket",
            "entitlements",
            "user_change",
            "set_update"
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
    },
    IVR: {
        name: 'ivr.fi',
        tiles: [
            "user_profile",
            "badges_global",
            "badges_channel",
            "sub_age"
        ],
    },
    GITHUB: {
        name: 'GitHub',
        tiles: [
            "badges_gists"
        ],
    },
    PRONOUNS: {
        name: 'pronouns.alejo.io',
        tiles: [
            "pronouns_data",
            "user_pronouns"
        ],
    },
};

function displayDebug() {
    if (!debugInfo) { return; }

    for (const key in debugInfo) {
        const debug = debugInfo[key];
    
        const debugDiv = document.createElement('div');
        debugDiv.className = 'debug-part';
        debugDiv.id = debug.name;
    
        const tilesContainer = document.createElement('div');
        tilesContainer.className = 'debug-tiles-container';
    
        for (const tile of debug.tiles) {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'debug-tile';
            tileDiv.id = tile;
            tileDiv.setAttribute('tooltip-name', tile);
            tilesContainer.append(tileDiv);
        }
    
        debugDiv.innerHTML = `<div class="debug-name">${debug.name}</div>`;
        debugDiv.append(tilesContainer);
    
        debugWindow.append(debugDiv);
    }    

    debugWindow.innerHTML += `<a href="${window.location.protocol}//${window.location.host}/YAUTC/#/debug/menu" style="text-decoration: none; color: white">GO TO DEBUGGER</a>`
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
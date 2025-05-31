const debugWindow = document.getElementsByClassName("debug-window")[0];

let debugInfo = {
    TTV: {
        name: 'Twitch',
        tiles: [
            { name: "chat_connection", description: "Twitch chat connection status" },
            { name: "event_sub", description: "Twitch EventSub subscription status" },
            { name: "user_profile", description: "Twitch user profile data" },
            { name: "offline_stream_info", description: "Stream info even when the stream is offline" },
            { name: "stream_info", description: "Current stream metadata (title, category, etc.)" },
            { name: "chat_settings", description: "Channel chat settings" },
            { name: "emotes_global", description: "Global Twitch emotes" },
            { name: "bits_emotes", description: "Emotes unlocked via Bits" },
            { name: "user_emotes", description: "Emotes available to the user (subscriptions, etc.)" },
            { name: "blocked_users", description: "List of users blocked by the current user" },
            { name: "message_send", description: "Sending messages in chat (check happens when sending a message)" },
            { name: "badges_global", description: "Global Twitch badges" },
            { name: "badges_channel", description: "Channel badges" },
            { name: "GQL", description: "GraphQL" }
        ],
    },
    SevenTV: {
        name: '7TV',
        tiles: [
            { name: "user_profile", description: "7TV user data" },
            { name: "channel_set", description: "Channel 7TV emote set" },
            { name: "emotes_global", description: "Global 7TV emotes" },
            { name: "emotes_channel", description: "Channel 7TV emotes" },
            { name: "websocket", description: "WebSocket connection for live emote set and entitlements updates" },
            { name: "entitlements", description: "User entitlements such as badges or paints (WebSocket event)" },
            { name: "user_change", description: "User profile updates (WebSocket event)" },
            { name: "set_update", description: "Changes to emote sets (WebSocket event)" }
        ],
    },
    BTTV: {
        name: 'BetterTwitchTV',
        tiles: [
            { name: "user_profile", description: "BTTV user data" },
            { name: "emotes_global", description: "Global BTTV emotes" },
            { name: "emotes_channel", description: "Channel BTTV emotes" },
            { name: "websocket", description: "WebSocket connection for live emote set updates" }
        ],
    },
    FFZ: {
        name: 'FrankerFaceZ',
        tiles: [
            { name: "user_profile", description: "FFZ user data" },
            { name: "emotes_global", description: "Global FFZ emotes" },
            { name: "emotes_channel", description: "Channel FFZ emotes" },
            { name: "badges_global", description: "Global FFZ badges" },
            { name: "badges_channel", description: "Channel custom FFZ badges" }
        ],
    },
    IVR: {
        name: 'ivr.fi',
        tiles: [
            { name: "user_profile", description: "Twitch user data" },
            { name: "badges_global", description: "Global badges" },
            { name: "badges_channel", description: "Channel-specific badges" },
            { name: "sub_age", description: "Duration of user’s Twitch subscription to a channel" }
        ],
    },
    PRONOUNS: {
        name: 'pronouns.alejo.io',
        tiles: [
            { name: "pronouns_data", description: "Available pronouns list" },
            { name: "user_pronouns", description: "Pronouns associated with a specific user" }
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
        tilesContainer.className = 'debug-tiles-container hidden';

        for (const tile of debug.tiles) {
            const tileDiv = document.createElement('div');
            tileDiv.className = 'debug-tile';
            tileDiv.id = tile.name;

            const tileCircle = document.createElement('div');
            tileCircle.className = 'debug-tile-circle';

            const tileInfo = document.createElement('div');
            tileInfo.className = 'debug-tile-info';

            const tileName = document.createElement('div');
            tileName.className = 'debug-tile-name';
            tileName.textContent = tile.name;

            const tileInfoText = document.createElement('span');
            tileInfoText.className = 'debug-tile-info-text';
            tileInfoText.textContent = tile.description;

            tileDiv.append(tileCircle);
            tileDiv.append(tileInfo);
            tileInfo.append(tileName);
            tileInfo.append(tileInfoText);

            //tileDiv.setAttribute('tooltip-name', tile.name); // Was used in the past, but now we have way better visible info :P
            tilesContainer.append(tileDiv);
        }

        const debugTilesInfo = document.createElement('div');
        debugTilesInfo.className = 'debug-tiles-info';

        const debugTilesName = document.createElement('div');
        debugTilesName.className = 'debug-tiles-name';
        debugTilesName.textContent = debug.name;

        const debugTilesStatus = document.createElement('div');
        debugTilesStatus.className = 'debug-status unchecked';

        const debugTilesHideArrow = document.createElement('span');
        debugTilesHideArrow.className = 'debug-tiles-hide-arrow';
        debugTilesHideArrow.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>  <!-- down arrow -->
        </svg>`;

        let isHidden = true;
        debugTilesHideArrow.onclick = function () {
            if (!isHidden) {
                debugTilesHideArrow.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>  <!-- down arrow -->
        </svg>`;
                tilesContainer.classList.add('hidden');
                isHidden = true;
            } else {
                debugTilesHideArrow.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>  <!-- up arrow -->
        </svg>`;
                tilesContainer.classList.remove('hidden');
                isHidden = false;
            }
        };

        debugTilesInfo.append(debugTilesName);
        debugTilesInfo.append(debugTilesStatus);
        debugTilesInfo.append(debugTilesHideArrow);

        debugDiv.append(debugTilesInfo);
        debugDiv.append(tilesContainer);

        debugWindow.append(debugDiv);
    }

    const debugLink = document.createElement('a');
    debugLink.href = `${window.location.protocol}//${window.location.host}/YAUTC/#/debug/menu`;
    debugLink.textContent = 'GO TO DEBUGGER';
    debugLink.style.textDecoration = 'none';
    debugLink.style.color = 'white';
    debugWindow.append(debugLink);
}

function findSourceAndTile(sourceName, tileName) {
    const source = Object.values(debugInfo).find(s => s.name === sourceName);
    if (!source) return null;
    const tile = source.tiles.find(t => t.name === tileName);
    if (!tile) return null;
    return { source, tile };
}

function debugChange(name, part, value) {
    const parentElement = document.getElementById(name);
    if (!parentElement) return;

    const element = parentElement.querySelector(`#${part}`);
    if (!element) return;

    element.classList.remove('debug-tile-error', 'debug-tile-ok', 'debug-tile-unknown');
    element.classList.add(value ? 'debug-tile-ok' : 'debug-tile-error');

    const foundSource = findSourceAndTile(name, part);
    if (!foundSource.source || !foundSource.tile) {
        console.warn(`Debug source "${name}" or tile "${part}" not found.`);
        return;
    }

    foundSource.tile.status = value;
    const anyErrors = foundSource.source.tiles.some(tile => tile.status === false);

    const statusDiv = parentElement.querySelector('.debug-status');
    if (statusDiv) {
        statusDiv.classList.remove('success', 'error', 'unchecked');
        statusDiv.classList.add(anyErrors ? 'error' : 'success');
    }
}

displayDebug();
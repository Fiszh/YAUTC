let followedStreams = [];

const followedDiv = document.getElementsByClassName('follow_list')[0];

async function getStreamerInfo(params) {
    const response = await fetch(`https://api.twitch.tv/helix/users${params}`, {
        method: 'GET',
        headers: {
            "Authorization": userToken,
            "Client-ID": userClientId,
        }
    });

    if (!response.ok) {
        throw new Error(response);
    }

    const data = await response.json();
    return data;
}

async function getUserFollowedStreams() {
    if (userTwitchId === '0') { return; }

    const response = await fetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchId}`, {
        method: 'GET',
        headers: {
            "Authorization": userToken,
            "Client-ID": userClientId,
        }
    });

    if (!response.ok) {
        throw new Error(response);
    }

    const data = await response.json();

    const params = data.data.map(streamer => `id=${streamer["user_id"]}`).join('&');
    const queryString = `?${params}`;

    const streamersInfo = await getStreamerInfo(queryString);

    const followedStreamsPromises = data.data.map((stream) => {

        const foundStreamer = streamersInfo.data.find(streamer => streamer["login"] === stream["user_login"])

        return {
            username: stream["user_name"],
            avatar: foundStreamer.profile_image_url.replace("300x300", "600x600") || null,
            title: stream["title"],
            url: `${window.location.protocol}//${window.location.host}/YAUTC/#/${stream["user_login"]}`,
            thumbnail: stream["thumbnail_url"].replace("{width}x{height}", "1920x1080"),
            category: stream["game_name"],
            viewers: stream["viewer_count"].toLocaleString()
        };
    });

    followedStreams = await Promise.all(followedStreamsPromises);
}

function onButtonClick(event) {
    event.preventDefault();
    const clickedLink = event.currentTarget;

    const streamData = followedStreams.find(stream => stream.url === clickedLink.href);

    if (streamData && streamData.url) {
        window.location.href = streamData.url;
    } else {
        alert('URL not found!');
    }
}

function updateTooltips() {
    const existingContainers = Array.from(followedDiv.querySelectorAll('.followed-stream'));

    const followedUsernames = new Set(followedStreams.map(stream => stream.username));

    existingContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) {
            const username = img.alt;
            if (!followedUsernames.has(username)) {
                container.remove();
            }
        }
    });

    followedStreams.sort((a, b) => b.viewers - a.viewers);

    followedDiv.innerHTML = '';

    followedStreams.forEach(streamData => {
        const tooltipContainer = document.createElement('a');
        tooltipContainer.href = streamData.url;
        tooltipContainer.style.color = "white";
        tooltipContainer.style.textDecoration = "none";

        tooltipContainer.innerHTML = `<div class="followed_container">
            <div class="followed_info">
                <div class="followed_avatar">
                    <img src="${streamData.avatar}" alt="${streamData.username}" loading="lazy">
                </div>
                <div class="followed_content">
                    <div class="followed_name">${streamData.username.length > 13 ? streamData.username.substring(0, 13) + "..." : streamData.username}</div>
                    <div class="followed_category">${streamData.category.length === 0 ? "No Category" : streamData.category.length > 15 ? streamData.category.substring(0, 15) + "..." : streamData.category}</div>
                    <div class="followed_viewers">${streamData.viewers}</div>
                </div>
            </div>
            <div class="followed_title">${(streamData.title.length  === 0 ? "No Title" : streamData.title) || "Something broke i guess"}</div>
            <img class="followed_thumbnail" src="${streamData.thumbnail}" alt="thumbnail" loading="lazy">
        </div>`;

        tooltipContainer.className = "followed-stream";

        tooltipContainer.setAttribute('tooltip-name', `${streamData.username}`);
        tooltipContainer.setAttribute('tooltip-type', `Category: ${streamData.category}`);
        tooltipContainer.setAttribute('tooltip-image', `${streamData.thumbnail}`);
        tooltipContainer.setAttribute('tooltip-creator', `Viewers: ${streamData.viewers}`);
        tooltipContainer.setAttribute('tooltip-title', `${streamData.title}`);

        followedDiv.appendChild(tooltipContainer);

        try {
            if (!userSettings || userSettings['channelFollow']) {
                displayFollowlist(true);
            }
        } catch (error) { }
    });
}

async function waitForUserData() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (userClientId && userClientId !== 0 && userToken && accessToken) {
                clearInterval(interval);
                resolve({
                    userClientId,
                    userToken,
                    accessToken
                });
            }
        }, 100);
    });
}

async function LoadFollowlist() {
    await waitForUserData();
    await getUserFollowedStreams();
    updateTooltips();
}

setInterval(LoadFollowlist, 20000);
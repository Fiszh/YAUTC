let followedStreams = [];

async function getUserInfo(userId) {
    const response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
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

    const followedStreamsPromises = data.data.map(async (stream, index) => {
        await new Promise(resolve => setTimeout(resolve, 500 * index));

        const userInfo = await getUserInfo(stream["user_id"]);
        return {
            username: stream["user_name"],
            avatar: userInfo.data[0]["profile_image_url"],
            url: `https://fiszh.github.io/YAUTC/${stream["user_login"]}`,
            thumbnail: stream["thumbnail_url"].replace("{width}x{height}", "1280x720"),
            category: stream["game_name"],
            viewers: stream["viewer_count"]
        };
    });

    followedStreams = await Promise.all(followedStreamsPromises);
}

const followedDiv = document.getElementById('followed');

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
        const existingTooltipContainer = followedDiv.querySelector(`.followed-stream img[alt="${streamData.username}"]`);

        if (existingTooltipContainer) {
            const tooltipContainer = existingTooltipContainer.closest('.followed-stream');

            // Update tooltip attributes on .followed-stream
            tooltipContainer.setAttribute('tooltip-name', `${streamData.username}`);
            tooltipContainer.setAttribute('tooltip-type', `PLAYING: ${streamData.category}`);
            tooltipContainer.setAttribute('tooltip-image', `${streamData.thumbnail}`);
            tooltipContainer.setAttribute('tooltip-creator', `VIEWERS: ${streamData.viewers}`);
        } else {
            const tooltipContainer = document.createElement('div');
            tooltipContainer.classList.add('followed-stream');
            tooltipContainer.setAttribute('tooltip-name', `${streamData.username}`);
            tooltipContainer.setAttribute('tooltip-type', `PLAYING: ${streamData.category}`);
            tooltipContainer.setAttribute('tooltip-image', `${streamData.thumbnail}`);
            tooltipContainer.setAttribute('tooltip-creator', `VIEWERS: ${streamData.viewers}`);

            const img = document.createElement('img');
            img.src = streamData.avatar;
            img.alt = streamData.username;

            const link = document.createElement('a');
            link.href = streamData.url;
            link.appendChild(img);
            link.addEventListener('click', onButtonClick);

            tooltipContainer.appendChild(link);

            followedDiv.appendChild(tooltipContainer);
        }
    });
}

async function waitForTwitchId() {
    return new Promise((resolve) => {
        const checkTwitchId = () => {
            if (userTwitchId && userTwitchId !== '0') {
                resolve(userTwitchId);
            } else {
                setTimeout(checkTwitchId, 100);
            }
        };
        checkTwitchId();
    });
}

async function load() {
    await waitForTwitchId();
    await getUserFollowedStreams();
    updateTooltips();
}

load();
setInterval(load, 10000);

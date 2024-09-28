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
    if (!userTwitchId === '0') { return;}

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

    const followedStreamsPromises = data.data.map(async stream => {
        const userInfo = await getUserInfo(stream["user_id"]);
        return {
            username: stream["user_name"],
            avatar: userInfo.data[0]["profile_image_url"],
            url: `http://127.0.0.1:8080/${stream["user_login"]}`,
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
    const existingContainers = Array.from(followedDiv.querySelectorAll('.custom-tooltip-container'));

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
        const existingTooltipContainer = followedDiv.querySelector(`.custom-tooltip-container img[alt="${streamData.username}"]`);

        if (existingTooltipContainer) {
            const tooltipText = existingTooltipContainer.nextElementSibling;
            tooltipText.textContent = `${streamData.username}, ${streamData.category} (${streamData.viewers.toLocaleString()})`;
        } else {
            const tooltipContainer = document.createElement('div');
            tooltipContainer.classList.add('custom-tooltip-container');

            const img = document.createElement('img');
            img.src = streamData.avatar;
            img.alt = streamData.username;

            const link = document.createElement('a');
            link.href = streamData.url;
            link.appendChild(img);
            link.addEventListener('click', onButtonClick);

            const tooltipText = document.createElement('span');
            tooltipText.classList.add('custom-tooltip');
            tooltipText.textContent = `${streamData.username}, ${streamData.category} (${streamData.viewers.toLocaleString()})`;

            tooltipContainer.appendChild(link);
            tooltipContainer.appendChild(tooltipText);

            followedDiv.appendChild(tooltipContainer);
        }
    });
}

async function load() {
    await getUserFollowedStreams();
    updateTooltips();
}

load();
setInterval(load, 10000);

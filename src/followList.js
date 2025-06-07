let followedStreams = [];
let cosmetic_info = {};

const followedDiv = document.getElementById('follow_list');

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

        let viewerCount = stream["viewer_count"];

        const formattedViewerCount = Intl.NumberFormat('en', {
            notation: "compact",
            compactDisplay: "short"
        }).format(viewerCount);

        const username = stream["user_name"].toLowerCase() === stream["user_login"].toLowerCase()
            ? stream["user_name"]
            : stream["user_login"];

        return {
            username,
            avatar: foundStreamer.profile_image_url.replace("300x300", "600x600") || null,
            title: stream["title"],
            url: `${window.location.protocol}//${window.location.host}/YAUTC/#/${stream["user_login"]}`,
            thumbnail: stream["thumbnail_url"].replace("{width}x{height}", "1920x1080"),
            category: stream["game_name"],
            viewers: formattedViewerCount
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

async function updateTooltips() {
    followedStreams = followedStreams.sort((a, b) => b.viewers - a.viewers);
    
    Array.from(followedDiv.children).forEach(child => {
        if (child.tagName !== 'H2') {
            followedDiv.removeChild(child);
        }
    });

    followedStreams.forEach(streamData => {
        const tooltipContainer = document.createElement('a');
        tooltipContainer.href = streamData.url;
        tooltipContainer.style.color = "white";
        tooltipContainer.style.textDecoration = "none";

        tooltipContainer.innerHTML = `<section class="followed_display">
                                        <img class="followed_avatar" src="${streamData.avatar ? streamData.avatar : "./imgs/user_avatar.png"}" alt="Avatar" loading="lazy">
                                        <div class="followed_name">${streamData.username}</div>
                                        <div class="followed_viewers">${streamData.viewers}</div>
                                    </section>`

        tooltipContainer.className = "followed-stream";

        followedDiv.appendChild(tooltipContainer);

        try {
            if (!userSettings || userSettings['channelFollow']) {
                displayFollowlist(true);
            }
        } catch (error) { }

        tooltipContainer.setAttribute('data-username', streamData.username.toLowerCase());
    });

    try {
        const cosmetics_body = {
            identifiers: followedStreams
                .filter(item => !cosmetic_info[item.username.toLowerCase()])
                .map(item => `username:${item.username}`)
        };

        if (cosmetics_body.identifiers.length > 0) {
            const cosmetics = await getUsersCosmetics(cosmetics_body);

            for (const cosmetic of cosmetics) {
                let username = cosmetic?.twitch_username?.toLowerCase();

                if (username) {
                    if (!cosmetic_info[username]) {
                        cosmetic_info[username] = cosmetic;
                    }

                    const tooltip = followedDiv.querySelector(`[data-username="${username}"]`);
                    if (tooltip) {
                        const imgElement = tooltip.querySelector('.followed_avatar img');
                        if (imgElement && cosmetic.avatar_url && imgElement.src != cosmetic.avatar_url) {
                            imgElement.src = cosmetic.avatar_url;
                        }
                    }
                }
            };

            cosmetics_body.identifiers.forEach(id => {
                const username = id.replace('username:', '').toLowerCase();

                if (!cosmetic_info.hasOwnProperty(username)) {
                    cosmetic_info[username] = {};
                }
            });
        }

        if (Object.keys(cosmetic_info).length > 0) {
            for (const [index, cosmetic] of Object.values(cosmetic_info).entries()) {
                if (Object.keys(cosmetic).length > 0) {
                    let username = cosmetic?.twitch_username?.toLowerCase();

                    if (username) {
                        const found_followDiv = followedDiv.querySelector(`[data-username="${username}"]`);

                        if (found_followDiv) {
                            const imgElement = found_followDiv.querySelector('img[alt="Avatar"]');
                            if (imgElement && cosmetic.avatar_url && imgElement.src != cosmetic.avatar_url) {
                                imgElement.src = cosmetic.avatar_url;
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(error)
    };
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
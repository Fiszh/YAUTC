let userTwitchId

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

async function getStreams(type = "followed") {
    if (!userTwitchId) return null;

    const url = type === "followed"
        ? `https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchId}`
        : `https://api.twitch.tv/helix/streams?first=4`;

    const response = await fetch(url, {
        headers: {
            'Client-ID': userClientId,
            'Authorization': userToken
        }
    });

    if (!response.ok) {
        console.log(response);
        return;
    }

    const data = await response.json();

    const streamData = data.data.map(stream => ({
        username: stream["user_name"],
        url: `${window.location.protocol}//${window.location.host}/YAUTC/#/${stream["user_login"]}`,
        title: stream["title"],
        thumbnail: stream["thumbnail_url"].replace("{width}x{height}", "1280x720"),
        category: stream["game_name"],
        viewers: stream["viewer_count"]
    }));

    updateStreams(streamData, type);
}

function updateStreams(streamData, type) {
    const tabId = type === "followed" ? 'followed_streams_display' : 'top_streams_display';
    const channelTab = document.getElementById(tabId);
    channelTab.innerHTML = '';

    streamData.sort((a, b) => b.viewers - a.viewers);

    streamData.forEach(stream => {
        appendStreamInfo(stream, channelTab, type === "top" ? "medium" : undefined);
    });
}

function appendStreamInfo(stream, channelTab, size_type = "default") {
    if (stream.title?.trim()?.length === 0) {
        stream.title = "No Title";
    }

    if (stream?.category?.trim()?.length === 0) {
        stream.category = "No Category";
    }

    const container = document.createElement('div');
    container.className = `stream_display ${size_type}`;

    const streamLink = document.createElement('a');
    streamLink.href = stream.url;

    const thumbnail = document.createElement('img');
    thumbnail.className = 'stream_thumbnail';
    thumbnail.src = stream.thumbnail || 'https://placehold.co/1920x1080.png';
    thumbnail.alt = 'Stream Thumbnail';

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const info = document.createElement('div');
    info.className = 'stream_info';

    const context = document.createElement('div');
    context.className = 'stream_context';

    const username = document.createElement('div');
    username.className = 'stream_username';
    username.textContent = stream.username || "No Username";

    const title = document.createElement('div');
    title.className = 'stream_title';
    title.textContent = stream.title || "No Title";

    const category = document.createElement('div');
    category.className = 'stream_category';
    category.textContent = stream.category || "No Category";

    context.appendChild(username);
    context.appendChild(title);
    context.appendChild(category);

    const stats = document.createElement('div');
    stats.className = 'stream_stats';

    const formattedViewerCount = Intl.NumberFormat('en', {
        notation: "compact",
        compactDisplay: "short"
    }).format(stream.viewers);

    const viewers = document.createElement('div');
    viewers.className = 'stream_viewers';
    viewers.textContent = "⬤ " + (formattedViewerCount || "0");
    stats.appendChild(viewers);

    info.appendChild(context);
    info.appendChild(stats);

    container.appendChild(streamLink);
    container.appendChild(thumbnail);
    container.appendChild(overlay);
    container.appendChild(info);

    channelTab.appendChild(container);
}

async function getTTVUser(user_id) {
    if (userClientId === '0') { return; }

    let url = 'https://api.twitch.tv/helix/users';

    if (user_id) {
        const isNumeric = /^\d+$/.test(user_id);

        url += isNumeric
            ? `?id=${user_id}`
            : `?login=${user_id}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': userToken,
            'Client-ID': userClientId,
        },
    });

    if (!response.ok) {
        console.log('Unable to get the user', response);
        return;
    }

    const data = await response.json();

    return data;
}

async function loadList() {
    if (!is_dev_mode) {
        // GET CLIENT ID
        if (getCookie('twitch_client_id')) {
            userClientId = getCookie('twitch_client_id');
        } else {
            return;
        }

        // GET ACCESS TOKEN
        if (getCookie('twitch_access_token')) {
            userToken = `Bearer ${getCookie('twitch_access_token')}`;
        } else {
            alert("Unable to retrieve your access token. Please refresh the page or log in again.");
            return
        }
    } else {
        await waitForUserData();
    }

    const loginInfo = document.getElementById('login_info');
    loginInfo.remove();

    // GET USER ID
    const userData = await getTTVUser();
    if (userData && userData.data && userData.data.length > 0) {
        userTwitchId = userData.data[0].id;

        const imgElement = document.querySelector('.user_avatar');

        imgElement.src = userData.data[0]["profile_image_url"];

        console.log(`Your user-id: ${userTwitchId}`);
        console.log(`Your avatar-url ${userData.data[0]["profile_image_url"]}`);
    } else {
        console.log('User not found or no data returned');
    }

    getStreams();

    if (!isOnMobile) {
        getStreams("top");
    }
}

loadList()

setInterval(getStreams, 20000);
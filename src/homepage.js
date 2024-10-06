let userToken 
let userClientId
let userTwitchId

async function getLiveFollowedChannels() {
    if (!userTwitchId) { return null; }

    const response = await fetch(`https://api.twitch.tv/helix/streams/followed?user_id=${userTwitchId}`, {
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
        url: `https://fiszh.github.io/YAUTC/${stream["user_login"]}`,
        title: stream["title"],
        thumbnail: stream["thumbnail_url"].replace("{width}x{height}", "1280x720"),
        category: stream["game_name"],
        viewers: stream["viewer_count"]
    }));

    updateStreamInfo(streamData);
}

function updateStreamInfo(streamData) {
    const channelTab = document.getElementById('channelTab');
    channelTab.innerHTML = '';

    streamData.sort((a, b) => b.viewers - a.viewers);

    streamData.forEach(stream => {
        appendStreamInfo(stream);
    });
}

function appendStreamInfo(stream) {
    const channelTab = document.getElementById('channelTab');

    const channelInfoDiv = document.createElement('div');
    channelInfoDiv.id = 'channelInfo';

    const newLink = document.createElement('a');
    newLink.href = stream.url;

    const newImage = document.createElement('img');
    newImage.src = stream.thumbnail;
    newImage.alt = 'streamThumbnail';

    const streamInfoDiv = document.createElement('div');
    streamInfoDiv.id = 'streamInfo';

    const streamerNameDiv = document.createElement('div');
    streamerNameDiv.className = 'name';
    streamerNameDiv.textContent = stream.username;

    const streamTitleDiv = document.createElement('div');
    streamTitleDiv.className = 'title';
    streamTitleDiv.textContent = stream.title;

    const streamCategoryDiv = document.createElement('div');
    streamCategoryDiv.className = 'category';
    streamCategoryDiv.textContent = stream.category;

    streamInfoDiv.appendChild(streamerNameDiv);
    streamInfoDiv.appendChild(streamTitleDiv);
    streamInfoDiv.appendChild(streamCategoryDiv);

    const viewersDiv = document.createElement('div');
    viewersDiv.className = 'viewers';
    viewersDiv.textContent = stream.viewers.toLocaleString();

    newLink.appendChild(newImage);
    newLink.appendChild(streamInfoDiv);
    newLink.appendChild(viewersDiv);

    channelInfoDiv.appendChild(newLink);

    channelTab.appendChild(channelInfoDiv);
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
    // GET CLIENT ID
    if (getCookie('twitch_client_id')) {
        userClientId = getCookie('twitch_client_id');
    } else {
        return
    }

    // GET ACCESS TOKEN
    if (getCookie('twitch_access_token')) {
        userToken = `Bearer ${getCookie('twitch_access_token')}`;
    } else {
        alert("Unable to retrieve your access token. Please refresh the page or log in again.")
        return
    }

    //get user id
    const userData = await getTTVUser();
    if (userData && userData.data && userData.data.length > 0) {
        userTwitchId = userData.data[0].id;
        console.log(`Your user-id: ${userTwitchId}`);
    } else {
        console.log('User not found or no data returned');
    }

    getLiveFollowedChannels();
}

loadList()

setInterval(getLiveFollowedChannels, 20000);

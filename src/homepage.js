async function getLiveFollowedChannels() {
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
    streamerNameDiv.className = 'test0';
    streamerNameDiv.textContent = stream.username;

    const streamTitleDiv = document.createElement('div');
    streamTitleDiv.className = 'test1';
    streamTitleDiv.textContent = stream.title;

    const streamCategoryDiv = document.createElement('div');
    streamCategoryDiv.className = 'test2';
    streamCategoryDiv.textContent = stream.category;

    streamInfoDiv.appendChild(streamerNameDiv);
    streamInfoDiv.appendChild(streamTitleDiv);
    streamInfoDiv.appendChild(streamCategoryDiv);

    const test3Div = document.createElement('div');
    test3Div.className = 'test3';
    test3Div.textContent = stream.viewers.toLocaleString();

    newLink.appendChild(newImage);
    newLink.appendChild(streamInfoDiv);
    newLink.appendChild(test3Div);

    channelInfoDiv.appendChild(newLink);

    channelTab.appendChild(channelInfoDiv);
}

getLiveFollowedChannels();

setInterval(getLiveFollowedChannels, 20000);

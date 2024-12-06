let version;

const gqlQueries = {
    url: 'https://gql.twitch.tv/gql',
    headers: {
        'Client-ID': 'ue6666qo983tsx6so1t0vnawi233wa',
        'Client-Version': version,
        'Referer': 'https://twitch.tv/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1; Smart Box C1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
    }
}

async function getVersion() {
    const url = "https://static.twitchcdn.net/config/manifest.json?v=1";
    const headers = {
        'Authorization': userToken
    };

    try {
        const response = await fetch(url, { headers });
        if (response.ok) {
            const version_data = await response.json();
            const version = version_data.channels[0].releases[0].buildId;

            console.log(version_data)
            console.log("Version:", version);
            
            return version;
        } else {
            console.log("Failed to fetch data. Status:", response.status);
            return false;
        }
    } catch (error) {
        console.log("Error:", error);
        return false;
    }
}

async function sendGQLRequest(body, variables) {
    try {
        const response = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: gqlQueries.headers,
            body: JSON.stringify({
                query: body,
                variables: variables,
            }),
        });

        if (!response.ok) {
            debugChange("Twitch", "GQL", false);

            return false
        }

        debugChange("Twitch", "GQL", true);

        const data = await response.json();

        return data
    } catch (err) {
        return false
    }
}

getVersion() // IMPORTANT
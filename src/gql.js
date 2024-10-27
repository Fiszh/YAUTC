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
    const version_response = await fetch("https://api.spanix.team/proxy/https://static.twitchcdn.net/config/manifest.json?v=1")

    if (!version_response.ok) {
        console.log(version_response)
        return false
    }

    const version_data = await version_response.json()

    version = version_data.channels[0].releases[0].buildId
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
            return false
        }
    
        const data = await response.json();
    
        return data
    } catch (err) {
        return false
    }
}

getVersion() // IMPORTANT
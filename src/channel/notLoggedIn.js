async function getTwitchUser(arg0) {
    let url;

    if (/^\d+$/.test(arg0) || arg0.startsWith("id:")) {
        arg0 = arg0.replace(/\D/g, '');

        url = `https://api.ivr.fi/v2/twitch/user?id=${arg0}`;
    } else {
        arg0 = arg0.replace("name:", "");
        
        url = `https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(arg0)}`;
    }

    const response = await fetch(url, {
        headers: {
            accept: "application/json"
        }
    })

    if (!response.ok) {
        console.error(response)
        debugChange("ivr.fi", "user_profile", false);
        return
    } else {
        debugChange("ivr.fi", "user_profile", true);
    }

    const data = await response.json()
    
    const modifiedData = {
        ...data[0],
        profile_image_url: data[0].logo,
    };

    delete modifiedData.logo;

    console.log(modifiedData)

    return modifiedData;
}

async function parseStreaminfo(user_info) {
    return {
        title: user_info.stream?.title || user_info.lastBroadcast?.title || "Offline",
        category: user_info.stream?.game?.displayName || "Offline",
        viewers: user_info.stream?.viewersCount || 0,
        categoryImage: "https://static-cdn.jtvnw.net/ttv-static/404_boxart-144x192.jpg",
        time: user_info.stream?.createdAt || null,
        username: (user_info.displayName.toLowerCase() !== user_info.login.toLowerCase() ? user_info.login : user_info.displayName) || "null"
    };
}

async function getTwitchBadges() {
    //CHANNEL
    const response = await fetch(`https://api.ivr.fi/v2/twitch/badges/channel?login=${encodeURIComponent(broadcaster)}`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response.ok) {
        debugChange("ivr.fi", "badges_channel", false);
        throw new Error('Network response was not ok');
    } else { 
        debugChange("ivr.fi", "badges_channel", true);
    }

    const data = await response.json();

    //SUBS
    data.forEach(element => {
        if (element["set_id"] === 'subscriber') {
            if (element && Object.keys(element).length > 0) {
                TTVSubBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'subscriber')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return [];
                    });
            }
        }
    });

    //BITS
    data.forEach(element => {
        if (element["set_id"] === 'bits') {
            if (element && Object.keys(element).length > 0) {
                TTVBitBadgeData = Object.entries(element)
                    .flatMap(([set_id, badges]) => {
                        if (set_id !== 'set_id' && Array.isArray(badges)) {
                            return badges.filter(badge => badge !== 'bits')
                                .map(badge => ({
                                    id: badge.id,
                                    url: badge["image_url_4x"],
                                    title: badge.title
                                }));
                        }
                        return [];
                    });
            }
        }
    });

    //GLOBAL
    const response1 = await fetch(`https://api.ivr.fi/v2/twitch/badges/global`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response1.ok) {
        debugChange("ivr.fi", "badges_global", false);
        throw new Error('Network response was not ok');
    } else { 
        debugChange("ivr.fi", "badges_global", true);
    }

    const data1 = await response1.json();

    data1.forEach(element => {
        if (element["versions"]) {
            if (element && Object.keys(element).length > 0) {
                TTVGlobalBadgeData.push(
                    ...element["versions"].map(badge => ({
                        id: element.set_id + "_" + badge.id,
                        url: badge["image_url_4x"],
                        title: badge.title
                    }))
                );
            }
            return [];
        }
    });

    //CUSTOM BADGES

    TTVGlobalBadgeData.push({
        id: '7TVServer' + "_" + 1,
        url: 'badges/7TV.png',
        title: '7TV'
    })

    TTVGlobalBadgeData.push({
        id: 'BTTVServer' + "_" + 1,
        url: 'badges/BTTV.png',
        title: 'BTTV'
    })

    TTVGlobalBadgeData.push({
        id: 'FFZServer' + "_" + 1,
        url: 'badges/FFZ.png',
        title: 'FFZ'
    })

    TTVGlobalBadgeData.push({
        id: 'Server' + "_" + 1,
        url: 'badges/SERVER.png',
        title: 'Server'
    })
}

async function getSubage(username, channel) {
    if (username.startsWith("id:")) { return;}

    username = username.replace("name:", "");

    const response = await fetch(`https://api.ivr.fi/v2/twitch/subage/${username}/${channel}`, {
        headers: {
            accept: "application/json"
        }
    });

    if (!response.ok) {
        debugChange("ivr.fi", "sub_age", false);
        throw new Error('Network response was not ok');
    } else { 
        debugChange("ivr.fi", "sub_age", true);
    }

    const data = await response.json();
    
    return data;
}
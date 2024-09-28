function argbToRgba(color) {
    if (color < 0) {
        color = color >>> 0;
    }

    const red = (color >> 24) & 0xFF;
    const green = (color >> 16) & 0xFF;
    const blue = (color >> 8) & 0xFF;
    return `rgba(${red}, ${green}, ${blue}, 1)`;
}

async function getPaint(paint_id) {
    try {
        const response = await fetch('https://7tv.io/v3/gql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                operationName: 'GetCosmetics',
                variables: { list: [paint_id] },
                query: `query GetCosmetics($list: [ObjectID!]) {
                    cosmetics(list: $list) {
                        paints {
                            id
                            kind
                            name
                            function
                            color
                            angle
                            shape
                            image_url
                            repeat
                            stops {
                                at
                                color
                            }
                            shadows {
                                x_offset
                                y_offset
                                radius
                                color
                            }
                        }
                        badges {
                            id
                            kind
                            name
                            tooltip
                            tag
                        }
                    }
                }`,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function getUserPersonalEmotes(user_id) {
    const response = await fetch(`https://7tv.io/v3/users/${user_id}`);

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();

    if (!data.emote_sets) {
        return null;
    }

    for (const element of data.emote_sets) {
        if (element.name === "Personal Emotes" && data.roles.includes("6076a86b09a4c63a38ebe801")) {
            const personalEmotesData = await fetch7TVEmoteData(element.id);
            return personalEmotesData;
        }
    }

    return null;
}

async function getUser(user_id) {
    try {
        const response = await fetch('https://7tv.io/v3/gql', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "query": "query GetUserCurrentCosmetics($id: ObjectID!) { user(id: $id) { id username display_name avatar_url style { paint { id kind name } badge { id kind name } } } }",
                "variables": {
                    "id": `${user_id}`
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        let infoTable = {
            "lastUpdate": Date.now(),
            "backgroundImage": null,
            "name": null,
            "KIND": null,
            "shadows": null,
            "avatar_url": null,
            "badge": {
                "url": null,
                "title": null
            },
            "personal_emotes": null
        }

        if (data.data.user.avatar_url) {
            infoTable.avatar_url = data.data.user.avatar_url
        }

        if (data.data.user.style && data.data.user.style["paint"]) {
            const paintData = await getPaint(data.data.user.style["paint"].id);

            const paint = paintData.data.cosmetics.paints[0];
            if (paint.image_url) {
                const randomColor = getRandomTwitchColor()

                infoTable.backgroundImage = `url('${paint.image_url}')` || `linear-gradient(0deg, ${randomColor}, ${randomColor})`;

                infoTable.KIND = 'animated'
            } else if (paint.stops.length > 0) {
                const colors = await paint.stops.map(stop => ({
                    at: stop.at,
                    color: stop.color
                }));

                const normalizedColors = await colors.map((stop, index) => ({
                    at: (100 / (colors.length - 1)) * index,
                    color: stop.color
                }));

                const gradient = await normalizedColors.map(stop =>
                    `${argbToRgba(stop.color)} ${stop.at}%`
                ).join(', ');

                const randomColor = getRandomTwitchColor()

                infoTable.backgroundImage = `linear-gradient(${paint.angle}deg, ${gradient})` || `linear-gradient(0deg, ${randomColor}, ${randomColor})`;

                infoTable.KIND = 'non-animated'
            }

            if (paint.shadows.length > 0) {
                infoTable.shadows = paint.shadows
            }

            infoTable.name = paint.name
        }

        if (data.data.user.style && data.data.user.style["badge"]) {
            infoTable.badge.url = `https://cdn.7tv.app/badge/${data.data.user.style["badge"].id}/3x`
            infoTable.badge.title = data.data.user.style["badge"].name
        }

        //Personal Emotes

        try {
            infoTable.personal_emotes = await getUserPersonalEmotes(user_id);
        } catch (error) {
            console.error('Error fetching personal emotes:', error);
        }

        return infoTable
    } catch (error) {
        console.error('Error fetching paint:', error);
    }
}

async function loadPaint(user_id, textElement, userstate, sevenTVData) {
    try {
        let data = null

        if (sevenTVData == null || sevenTVData.length < 1) {
            data = await getUser(user_id)
        } else {
            data = sevenTVData
        }

        let paintInfo = {
            "backgroundImage": null,
            "shadow": null
        }

        const randomColor = getRandomTwitchColor()

        paintInfo.backgroundImage = data.backgroundImage || `linear-gradient(0deg, ${userstate.color}, ${userstate.color})` || `linear-gradient(0deg, ${randomColor}, ${randomColor})`;

        //Shadows
        if (data.shadows && data.shadows.length > 0) {
            const shadows = data.shadows;

            const customShadow = await shadows.map(shadow => {
                let rgbaColor = argbToRgba(shadow.color);

                rgbaColor = rgbaColor.replace(/rgba\((\d+), (\d+), (\d+), (\d+(\.\d+)?)\)/, `rgba($1, $2, $3)`);

                return `drop-shadow(${rgbaColor} ${shadow.x_offset}px ${shadow.y_offset}px ${shadow.radius}px)`;
            }).join(' ');

            paintInfo.shadow = customShadow;
        }

        textElement.style.cssText = `background-image: ${paintInfo.backgroundImage}; filter: ${paintInfo.shadow};`;
        textElement.style.backgroundColor = userstate.color || randomColor || 'white';
        textElement.classList.add('paint');

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function setSevenTVPaint(element, user_id, userstate, sevenTVData) {
    if (element == null) { return; }
    if (user_id == null) { return; }
    if (userstate == null) { return; }

    loadPaint(user_id, element, userstate, sevenTVData);
}

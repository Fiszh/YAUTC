const userCard = document.querySelector('#user-card');

function cleanUsername(username) {
    username = username.replace(/[^a-zA-Z0-9_:]+/g, '');

    if (username.endsWith(':')) {
        username = username.slice(0, -1);
    }

    return username;
}

async function openCard(username) {
    if (!userCard) { return; }
    if (tmiUsername == "none" && !username) { return; }

    if (username && !username.startsWith("id:") && !username.startsWith("name:")) { username = `name:${username}`; }

    if (!username) { username = tmiUsername; }

    username = await cleanUsername(username);

    let userData = {}

    if (userClientId !== "0" && userToken) {
        userData = await getTTVUser(username)
    } else {
        const user_info = await getTwitchUser(username)

        if (Object.keys(user_info).length > 0) {
            userData = {
                "data": [
                    {
                        "id": user_info["id"],
                        "login": user_info["login"],
                        "display_name": user_info["displayName"],
                        "profile_image_url": user_info["profile_image_url"],
                        "created_at": user_info["createdAt"]
                    }
                ]
            }
        }
    }

    const clone = userCard.cloneNode(true);
    clone.id = `${userCard.id}`;
    userCard.parentNode.appendChild(clone);

    clone.style.top = "50%";
    clone.style.left = "50%";
    clone.style.display = "block";

    let pinned = false

    function removeCloneOnClickOutside(event) {
        if (!clone.contains(event.target) && event.target !== clone && !pinned) {
            clone.remove();

            document.removeEventListener('click', removeCloneOnClickOutside);
        }
    }

    setTimeout(() => {
        document.addEventListener('click', removeCloneOnClickOutside);
    }, 0);

    const user_info = clone.querySelector(".user-info");

    if (!userData || Object.keys(userData).length < 1 || !userData["data"] || !userData["data"][0]) {
        if (user_info) {
            user_info.innerHTML = `User ${username.replace("id:", "").replace("name:", "")} not found.`;
        }

        return;
    }

    const userInfo = userData["data"][0];

    clone.querySelector('.pin-button').addEventListener('click', function () {
        this.classList.toggle('active');
        pinned = this.classList.contains('active');
    });

    if (user_info) {
        let username = userInfo["login"];

        user_info.innerHTML = `<div>
                                ${username.replace("id:", "").replace("name:", "")}
                                <button id="copyButton" onclick="navigator.clipboard.writeText('${username.replace("id:", "").replace("name:", "")}')">
                                    <img class="copy_button" tooltip-name="Copy" tooltip-image="none" src="imgs/copy_button.png" alt="Copy"/>
                                </button>
                            </div>`;

        if (userInfo["login"].toLowerCase() !== userInfo["display_name"].toLowerCase()) {
            user_info.innerHTML += `<div>
                                Display name: ${userInfo["display_name"]}
                                <button id="copyButton" onclick="navigator.clipboard.writeText('${userInfo["display_name"]}')">
                                    <img class="copy_button" tooltip-name="Copy" tooltip-image="none" src="imgs/copy_button.png" alt="Copy"/>
                                </button>
                            </div>`
        }

        if (userInfo["id"]) {
            const paintName = await getPaintName(userInfo["id"]);

            let id_info = `<div>
                                id: ${userInfo["id"]}
                                <button id="copyButton" onclick="navigator.clipboard.writeText('${userInfo["id"]}')">
                                    <img class="copy_button" tooltip-name="Copy" tooltip-image="none" src="imgs/copy_button.png" alt="Copy"/>
                                </button>
                            </div>`;

            const foundUser = TTVUsersData.find(user => user.name === `@${username}`);

            let cosmeticContainer;

            if (foundUser && foundUser.cosmetics && foundUser.cosmetics["badge_id"]) {
                const foundBadge = cosmetics.badges.find(Badge => Badge.id === foundUser.cosmetics["badge_id"]);

                if (foundBadge) {
                    if (!cosmeticContainer) {
                        cosmeticContainer = document.createElement('div');
                        cosmeticContainer.innerHTML = "Cosmetics: ";
                    }

                    const badgeWrapper = document.createElement('span');
                    badgeWrapper.className = 'badge-wrapper';
                    badgeWrapper.setAttribute('tooltip-name', foundBadge.title);
                    badgeWrapper.setAttribute('tooltip-type', 'Badge');
                    badgeWrapper.setAttribute('tooltip-creator', '');
                    badgeWrapper.setAttribute('tooltip-image', foundBadge.url);

                    const badgeImg = document.createElement('img');
                    badgeImg.src = foundBadge.url;
                    badgeImg.alt = foundBadge.title;
                    badgeImg.className = 'badge';

                    badgeWrapper.appendChild(badgeImg);
                    cosmeticContainer.appendChild(badgeWrapper);
                }
            }

            if (paintName) {
                const paint_display = document.createElement('strong');
                paint_display.id = 'paint-display';
                paint_display.innerHTML = paintName;

                await displayCosmeticPaint(userInfo["id"], "#ffffff", paint_display);

                paint_display.style.display = 'inline-block';

                if (!cosmeticContainer) {
                    cosmeticContainer = document.createElement('div');
                    cosmeticContainer.innerHTML = "Cosmetics: ";
                }

                cosmeticContainer.appendChild(paint_display);
            }

            if (cosmeticContainer) {
                user_info.appendChild(cosmeticContainer);

                id_info = id_info.replace("<br>", "");
            }

            user_info.innerHTML += id_info
        }

        const formattedDate = await formatDate(userInfo["created_at"])

        if (formattedDate) {
            user_info.innerHTML += `Created at: ${formattedDate}`
        }
    };

    const user_avatar = clone.querySelector(".user-avatar");

    if (user_avatar && userInfo["profile_image_url"]) {
        let foundUser = TTVUsersData.find(user => user.name === `@${username.replace("id:", "").replace("name:", "").toLowerCase()}`);

        let avatar1 = foundUser?.cosmetics?.avatar_url;
        let avatar2 = userInfo["profile_image_url"].replace("300x300", "600x600") || await getAvatarFromUserId(user_info["id"] || 141981764).replace("300x300", "600x600");

        if (avatar1) {
            if (avatar1.startsWith("https://static-cdn.jtvnw.net/")) {
                avatar1 = avatar1.replace("300x300", "600x600");
            }

            if (avatar1.startsWith("https://cdn.discordapp.com/")) {
                try {
                    const response = await fetch(avatar1, { method: "HEAD" });
                    if (!response.ok) {
                        avatar1 = undefined;
                    }
                } catch (error) {
                    console.error("Error checking Discord image:", error);
                    avatar1 = undefined;
                }
            }
        }

        let avatar = avatar1 || avatar2

        user_avatar.src = avatar;

        if (avatar1 && !avatar1.startsWith("https://static-cdn.jtvnw.net/")) {
            const avatar_button = clone.querySelector(".show-avatar-btn");

            if (avatar_button) {
                let isUsingAvatar1 = true;

                avatar_button.style.display = "block";

                avatar_button.addEventListener('click', () => {
                    if (!isUsingAvatar1) {
                        user_avatar.src = avatar1;
                        avatar_button.innerHTML = "Show Twitch"
                    } else {
                        user_avatar.src = avatar2;
                        avatar_button.innerHTML = "Show 7TV"
                    }

                    isUsingAvatar1 = !isUsingAvatar1;
                });
            }
        }
    }

    const subage_info = await getSubage(username || tmiUsername, broadcaster)

    if (user_info) {
        if (subage_info?.statusHidden) {
            user_info.innerHTML += "<br> User status hidden";
        } else {
            if (subage_info?.followedAt) {
                const followDate = await formatDate(subage_info["followedAt"]);

                if (followDate) {
                    user_info.innerHTML += `<br> Followed at: ${followDate}`;
                }
            }

            if (subage_info?.cumulative) {
                const sub_info = subage_info["cumulative"]

                if (sub_info) {
                    const months = sub_info["months"];

                    if (months) {
                        const endsAt = new Date(sub_info["end"]);
                        const now = new Date();

                        const timeDiff = endsAt - now;
                        const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                        if (daysRemaining < 1 && sub_info["daysRemaining"] < 2) {
                            user_info.innerHTML += `<br> Previously subscribed for: ${months} month${months > 1 ? 's' : ''}`;
                        } else {
                            user_info.innerHTML += `<br> Subscribed for: ${months} month${months > 1 ? 's' : ''}`;
                        }

                        let additionalInfo_array = []

                        if (subage_info["meta"] && subage_info["meta"]["tier"]) {
                            additionalInfo_array.push(`tier: ${subage_info["meta"]["tier"]}`);
                        }

                        if (subage_info["meta"] && subage_info["meta"]["type"]) {
                            additionalInfo_array.push(`${subage_info["meta"]["type"]}`);
                        }

                        if (daysRemaining && daysRemaining > -1) {
                            additionalInfo_array.push(`${daysRemaining} days remaining`);
                        }

                        let additionalInfo = "";

                        if (additionalInfo_array.length > 0) {
                            additionalInfo = ` (${additionalInfo_array.join(", ")})`;
                        }

                        user_info.innerHTML += additionalInfo
                    }
                }
            }
        }
    }
}

async function formatDate(date_to_format) {
    const date = new Date(date_to_format);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}-${month}-${year}`;
}
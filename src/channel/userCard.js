const userCard = document.querySelector('#user-card');
let twitchEmbed = document.querySelector('#twitch-embed');

async function openCard(username) {
    if (!userCard) { return; }
    if (tmiUsername && tmiUsername == "none" && !username) { return; }

    if (!username) { username = tmiUsername; }

    const match = username.match(/<strong[^>]*class=["']paint["'][^>]*>(.*?)<\/strong>/);

    username = username.replace(/^@/, '').replace(/ (.*)$/, '').replace(/:$/, '').replace(/,$/, '');

    if (username && !username.startsWith("id:") && !username.startsWith("name:")) { username = `name:${username}`; }

    if (match) {
        username = match[1];

        if (!username.startsWith("name:")) {
            username = `name:${username}`;
        }
    }

    if (username.endsWith(':')) {
        username = username.slice(0, -1);
    }

    let userData = {}

    if (userClientId !== "0" && userToken) {
        userData = await getTTVUser(username);

        if (userData?.["data"]?.[0]?.["id"]) {
            const username_color = await getUserColorFromUserId(userData["data"][0]["id"]);

            userData["data"][0]["color"] = username_color;

            if (userData["data"][0]["color"] == "") {
                userData["data"][0]["color"] = null;
            }
        }
    } else {
        const user_info = await getTwitchUser(username);

        if (Object.keys(user_info).length > 0) {
            userData = {
                "data": [
                    {
                        "id": user_info["id"],
                        "login": user_info["login"],
                        "display_name": user_info["displayName"],
                        "profile_image_url": user_info["profile_image_url"],
                        "created_at": user_info["createdAt"],
                        "color": user_info["chatColor"]
                    }
                ]
            }
        }
    }

    if (userData?.["data"]?.[0]?.["color"] == null && userData?.["data"]?.[0]?.["login"]) {
        userData["data"][0]["color"] = getRandomTwitchColor(userData["data"][0]["login"]) || null;
    }

    const clone = userCard.cloneNode(true);
    clone.id = `${userCard.id}`;
    userCard.parentNode.appendChild(clone);

    if (!isOnMobile) {
        clone.style.top = "50%";
        clone.style.left = "50%";
    }

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
            user_info.innerHTML = `User ${username.replace("name:", "").replace("id:", "")} not found.`;
        }

        return;
    }

    const userInfo = userData["data"][0];

    clone.querySelector('.pin-button').addEventListener('click', function () {
        this.classList.toggle('active');
        pinned = this.classList.contains('active');
    });

    username = userInfo["login"];

    if (user_info) {
        user_info.innerHTML = `<div>
                                ${username}
                                <button id="copyButton" onclick="navigator.clipboard.writeText('${username}')">
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

        try {
            const pronouns_response = await fetch(`https://pronouns.alejo.io/api/users/${userInfo["login"]}`);

            if (pronouns_response.ok) {
                const data = await pronouns_response.json();

                if (data && data?.[0]?.["pronoun_id"]) {
                    const found_pronoun = pronouns_data.find(item => item.name === data?.[0]?.["pronoun_id"]);

                    if (found_pronoun) {
                        user_info.innerHTML += `Pronouns: ${found_pronoun["display"]}`
                    }
                }

                debugChange("pronouns.alejo.io", "user_pronouns", true);
            }
        } catch {
            user_info.innerHTML += `Pronouns: Failed to fetch.`
        }

        if (userInfo["id"]) {
            const paintName = await getPaintName(userInfo["id"]);

            let id_info = `<div>
                                id: ${userInfo["id"]}
                                <button id="copyButton" onclick="navigator.clipboard.writeText('${userInfo["id"]}')">
                                    <img class="copy_button" tooltip-name="Copy" tooltip-image="none" src="imgs/copy_button.png" alt="Copy"/>
                                </button>
                            </div>`;

            const foundUser = TTVUsersData.find(user => user.name === `@${userInfo["login"]}`);

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
                    badgeWrapper.setAttribute('tooltip-type', '7TV Badge');
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
        let foundUser = TTVUsersData.find(user => user.name === `@${username}`);

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

        if (avatar1 && avatar1 != avatar2) {
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

    // BLOCK BUTTON

    const avatarContainer = clone.querySelector(".avatar-container");

    if (avatarContainer && userInfo["login"] != tmiUsername) {
        const block_button = document.createElement("button");
        block_button.classList.add("block-btn");
        block_button.style.display = "block";

        let is_blocked = blockedUsersData.find(user => user.username === userInfo["login"]);

        if (is_blocked) {
            block_button.textContent = "UnBlock";
        } else {
            block_button.textContent = "Block";
        }

        block_button.addEventListener('click', async () => {
            const was_blocked = await blockUser(userInfo["id"], block_button.textContent == "Confirm Block");

            if (block_button.textContent == "Block" && !block_button.dataset.confirm) {
                block_button.dataset.confirm = "true";
                block_button.textContent = "Confirm Block";
                setTimeout(() => {
                    if (block_button.dataset.confirm) {
                        delete block_button.dataset.confirm;

                        if (block_button.textContent == "Confirm Block") {
                            block_button.textContent = "Block";
                        }
                    }
                }, 3000);
                return;
            }

            if (was_blocked) {
                if (block_button.textContent == "Confirm Block") {
                    blockedUsersData.push({ username: userInfo["login"] });

                    block_button.textContent = "UnBlock";

                    handleMessage(custom_userstate.Server, `${userInfo["login"]} was blocked.`);
                } else {
                    blockedUsersData = blockedUsersData.filter(u => u.username !== userInfo["login"]);

                    block_button.textContent = "Block";

                    handleMessage(custom_userstate.Server, `${userInfo["login"]} was unblocked.`);
                }
            } else {
                handleMessage(custom_userstate.Server, `Error occurred while trying to block/unblock ${userInfo["login"]}.`);
            }
        });

        avatarContainer.appendChild(block_button);
    }

    const subage_info = await getSubage(username || tmiUsername, broadcaster);

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
                const sub_info = subage_info["cumulative"];

                if (sub_info) {
                    const months = sub_info["months"];

                    if (months) {
                        const endsAt = new Date(subage_info?.["meta"]?.["endsAt"] || sub_info?.["end"] || subage_info?.["cumulative"]?.["end"]);
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

    if (userData?.["data"]?.[0]?.["color"] != null) {
        try {
            // NAME COLOR
            let { r, g, b } = hexToRgb(userData["data"][0]["color"]);
            const nameColor_preview = `<div style="border-radius: 2.5px; width: 15px; height: 15px; background-color: ${userData["data"][0]["color"]}; display: inline-block; vertical-align: middle;"></div>`;
            const color_name = await getColorName(userData["data"][0]["color"]);

            if (r !== undefined && g !== undefined && b !== undefined) {
                user_info.innerHTML += `<br> <div> Name color: ${color_name}${nameColor_preview} rgb(${r}, ${g}, ${b}) (${userData["data"][0]["color"]})</div>`;
            } else {
                user_info.innerHTML += `<br> <div> Name color: ${color_name}${nameColor_preview} (${userData["data"][0]["color"]})</div>`;
            }

            // CHAT COLOR
            const lighten = lightenColor(userData["data"][0]["color"]);
            const hex = rgbToHex(lighten);

            if (lighten && hex) {
                let colorChat_name = 'Blank'

                if (userData["data"][0]["color"].toLowerCase() == hex.toLowerCase()) {
                    colorChat_name = color_name
                } else {
                    colorChat_name = await getColorName(hex);
                }

                const chatColor_preview = `<div style="border-radius: 2.5px; width: 15px; height: 15px; background-color: ${hex}; display: inline-block; vertical-align: middle;"></div>`;

                user_info.innerHTML += `<div> Chat color: ${color_name}${chatColor_preview} ${lighten} (${hex.toUpperCase()})</div>`;
            }
        } catch (err) {
            console.error(err);
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

// I FIXED THE LAG :D
/*⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⢀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⢀⡀⡀⡀⡀⡀⡀⡀⡀⡀
⡀⡀⡀⡀⡀⡀⡀⡀⡀⠒⢀⣡⣤⣤⣤⣄⡈⠑⠐⢀⣤⣶⣿⡿⠿⠿⠷⠄⡀⠙⠃⡀⡀⣀⡀
⡀⡀⡀⡀⡀⡀⡀⡀⣠⣶⠟⢋⣥⣤⣶⡶⠦⠌⠙⠛⠉⠡⠶⠖⠒⣉⡠⠤⠙⠁⣀⡀⡀⠈⡀
⡀⡀⡀⡀⡀⢀⣴⣿⣿⣧⣾⣿⠟⠋⢁⣠⡤⠶⠖⢦⣤⣄⣀⠤⣺⣵⠞⠠⠄⣀⠘⢿⣷⣦⡀
⡀⡀⡀⡀⡄⣸⣿⣿⣿⡿⠏⠁⣠⠴⣫⡿⡀⠒⢠⣤⠈⣿⣿⣾⣿⣿⡀⠐⡄⠉⡀⠸⠟⠁⡀
⡀⡀⡀⣾⣇⣿⣿⣿⣿⣧⣤⣄⣿⣿⣿⣧⡀⠸⠄⡀⢀⣘⣉⣽⣿⣿⣧⣤⣤⣴⡶⡀⡀⠁⡀
⡀⠁⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢡⠤⢀⣐⠚⠻⠿⣿⣿⣿⣿⣿⣿⣿⡿⠿⢋⠈⡀⡀⡀
⡄⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣈⡀⡀⡀⠉⠑⠒⠒⡀⡀⡀⡀⣀⣒⡀⢀⡄⡀⡀⡀⡀
⡇⢾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣌⠐⠤⡒⠲⠤⡄⡀⡀⢀⣽⣿⠿⢂⠇⡀⡀⠸⡀
⡃⠈⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣉⡑⠒⠒⠒⠒⠒⠒⣉⡀⡀⠁⡀⡀⡀
⡀⡀⡀⡀⠉⠉⠛⠛⠛⠛⠿⠿⠟⠛⠛⠛⠻⠿⠛⠛⠛⠛⠛⠛⠛⠉⠉⠉⠁⡀⡀⡀⡀⡀⡀
⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀⡀*/

document.addEventListener('mousedown', (event) => {
    const draggable = event.target.closest('.draggable');
    if (!draggable) return;

    event.preventDefault();
    let isDragging = true;

    twitchEmbed.classList.add('no-pointer-events');

    const isTouch = event.type.startsWith('touch');
    const startX = isTouch ? event.touches[0].clientX : event.clientX;
    const startY = isTouch ? event.touches[0].clientY : event.clientY;

    let offsetX = startX - draggable.getBoundingClientRect().left;
    let offsetY = startY - draggable.getBoundingClientRect().top;

    draggable.style.position = 'absolute';
    draggable.style.zIndex = 1000;
    document.body.style.userSelect = 'none';

    function onMouseMove(event) {
        if (!isDragging) return;

        const moveX = isTouch ? event.touches[0].clientX : event.clientX;
        const moveY = isTouch ? event.touches[0].clientY : event.clientY;

        const maxX = window.innerWidth - draggable.offsetWidth;
        const maxY = window.innerHeight - draggable.offsetHeight;

        let newX = Math.max(0, Math.min(moveX - offsetX, maxX));
        let newY = Math.max(0, Math.min(moveY - offsetY, maxY));

        requestAnimationFrame(() => {
            draggable.style.left = `${newX}px`;
            draggable.style.top = `${newY}px`;
        });
    }

    function onMouseUp() {
        isDragging = false;
        document.body.style.userSelect = '';

        twitchEmbed.classList.remove('no-pointer-events');

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('touchmove', onMouseMove);
        document.removeEventListener('touchend', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);
});
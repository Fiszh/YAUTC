const userCard = document.querySelector('#user_card');
let twitchEmbed = document.querySelector('#twitch-embed');

async function addUserInfo(card, info) {
    if (!card || !info) { return; };

    const user_info = card.querySelector("#user_info");

    if (!user_info) { return; };

    const info_container = document.createElement('div');
    info_container.className = 'user_info_container';

    if (info.title) {
        const title = document.createElement('div');
        title.className = 'user_info_title';

        if (info.icon) {
            const icon = document.createElement('img');
            icon.className = 'user_info_icon';
            icon.src = info.icon;
            icon.alt = info.title || 'User Info Icon';
            title.appendChild(icon);
        }

        title.appendChild(document.createTextNode(info.title));
        info_container.appendChild(title);
    }

    if (info.content) {
        const content = document.createElement('div');
        content.className = 'user_info_content';
        content.innerHTML = info.content;
        info_container.appendChild(content);
    }

    if (info.cancopy) {
        info_container.classList.add('copy_button');
        info_container.onclick = () => {
            navigator.clipboard.writeText(info.content);
        };

        info_container.setAttribute('tooltip-name', 'Click to copy');
    }

    user_info.appendChild(info_container);
}

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

    let userData = {};

    let user_info_display = {
        unset: true,
    }

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

    function removeCloneOnClickOutside(event) {
        if (!clone.contains(event.target) && event.target !== clone) {
            clone.remove();

            document.removeEventListener('click', removeCloneOnClickOutside);
        }
    }

    if (isOnMobile) {
        setTimeout(() => {
            document.addEventListener('click', removeCloneOnClickOutside);
        }, 0);
    }

    const clone = userCard.cloneNode(true);
    clone.id = `${userCard.id}`;
    userCard.parentNode.appendChild(clone);

    if (!isOnMobile) {
        clone.style.top = "50dvh";
        clone.style.left = "50dvw";
    }

    clone.style.display = "block";

    clone.querySelector('#close_button').addEventListener('click', () => {
        clone.remove();
    });

    const usercard_elements = {
        card_blur: clone.querySelector("#user_card_blur_cover"),
        header: {
            main: clone.querySelector(".header"),
            avatar: {
                main: clone.querySelector(".avatar_card_container"),
                img: clone.querySelector(".avatar_card_container .user_card_avatar")
            },
            user_info: {
                main: clone.querySelector(".user_info"),
                username: clone.querySelector(".user_info .username"),
                prounouns: clone.querySelector(".user_info .user_prounouns"),
                cosmetics: {
                    main: clone.querySelector(".user_info .user_cosmetics"),
                    display: clone.querySelector(".user_info #cosmetics_container"),
                }
            },
            close_button: clone.querySelector(".header #close_button"),
            block: {
                button: clone.querySelector(".header #block_button"),
                confirmation: {
                    main: clone.querySelector("#block_confirmation"),
                    confirm: clone.querySelector("#block_confirmation_yes"),
                    cancel: clone.querySelector("#block_confirmation_no")
                }
            }
        },
        subscription: {
            main: clone.querySelector("#subscription_info"),
            tags: clone.querySelector("#subscription_info #subscription_tags"),
            duration: {
                container: clone.querySelector("#subscription_info #subscription_duration"),
                value: clone.querySelector("#subscription_info #subscription_duration #duration")
            },
            overall: {
                container: clone.querySelector("#subscription_info #subscription_overall"),
                value: clone.querySelector("#subscription_info #subscription_overall #overall")
            },
            gifted: {
                container: clone.querySelector("#subscription_info #subscription_gifted"),
                username: clone.querySelector("#subscription_info #subscription_gifted div:nth-of-type(2)"),
                text: clone.querySelector("#subscription_info #subscription_gifted #gifted_text"),
                start: clone.querySelector("#subscription_info #subscription_gifted #subscription_start")
            },
            progress_bar: {
                container: clone.querySelector("#subscription_info .progress-bar"),
                fill: clone.querySelector("#subscription_info .progress-bar .progress")
            },
            end: clone.querySelector("#subscription_info #subscription_end")
        },
        colors_info: {
            name_color: {
                dot: clone.querySelector("#name_color #color_display #color_dot"),
                name: clone.querySelector("#name_color #color_display #color_name"),
                rgb: clone.querySelector("#name_color #color_rgb")
            },
            chat_color: {
                dot: clone.querySelector("#chat_color #color_display #color_dot"),
                name: clone.querySelector("#chat_color #color_display #color_name"),
                rgb: clone.querySelector("#chat_color #color_rgb")
            }
        },
        footer: {
            open_twitch_profile: clone.querySelector("#open_twitch_profile")
        }
    };

    // CHECK IF USER EXIST
    if (!userData || !Object.keys(userData).length || !userData["data"] || !userData["data"][0]) {
        usercard_elements.header.user_info.username.innerHTML = `User ${username.replace("name:", "").replace("id:", "")} not found.`;

        for (const child of clone.children) {
            if (child !== usercard_elements.header.main) {
                child.style.display = "none";
            }
        }

        for (const child of usercard_elements.header.user_info.main.children) {
            if (!child.classList.contains('username')) {
                child.style.display = "none";
            }
        }

        usercard_elements.header.block.button.style.display = "none";

        return;
    }

    const userInfo = userData["data"][0];

    if (!userInfo) { return; };

    username = userInfo["login"];

    const subage_info = await getSubage((username || tmiUsername), broadcaster);

    if (!userData.data[0]["color"]) {
        userData.data[0]["color"] = getRandomTwitchColor(username);
    }

    // SET USERNAME
    usercard_elements.header.user_info.username.innerHTML = username;

    if (userInfo["login"].toLowerCase() !== userInfo["display_name"].toLowerCase()) {
        usercard_elements.header.user_info.username.innerHTML = `${username} (${userInfo["display_name"]})`;
    }

    // OPEN TWITCH PROFILE BUTTON
    usercard_elements.footer.open_twitch_profile.addEventListener('click', () => {
        window.open(`https://twitch.tv/${username || "twitch"}`, '_blank');
    });

    // PRONOUNS
    try {
        const pronouns_response = await fetch(`https://pronouns.alejo.io/api/users/${username}`);

        if (pronouns_response.ok) {
            const data = await pronouns_response.json();

            if (data && data?.[0]?.["pronoun_id"]) {
                const found_pronoun = pronouns_data.find(item => item.name === data?.[0]?.["pronoun_id"]);

                if (found_pronoun) {
                    usercard_elements.header.user_info.prounouns.innerHTML = found_pronoun["display"];
                } else {
                    usercard_elements.header.user_info.prounouns.innerHTML = ``;
                }
            } else {
                usercard_elements.header.user_info.prounouns.innerHTML = ``;
            }

            debugChange("pronouns.alejo.io", "user_pronouns", true);
        }
    } catch (error) {
        usercard_elements.header.user_info.prounouns.innerHTML = `Failed to fetch pronouns.`

        debugChange("pronouns.alejo.io", "user_pronouns", false);

        console.error("Error fetching pronouns:", error);
    }

    // 7TV COSMETICS
    const paintName = await getPaintName(userInfo["id"]);
    const foundUser = TTVUsersData.find(user => user.name === `@${userInfo["login"]}`);

    const cosmeticContainer = document.createElement('div');

    if (foundUser?.cosmetics?.["badge_id"]) {
        const foundBadge = cosmetics.badges.find(badge => badge.id == foundUser.cosmetics["badge_id"]);

        if (foundBadge) {
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

        cosmeticContainer.appendChild(paint_display);
    }

    if (cosmeticContainer.children.length) {
        usercard_elements.header.user_info.cosmetics.display.appendChild(cosmeticContainer);
    } else {
        usercard_elements.header.user_info.cosmetics.main.style.display = "none";
    }

    // USER ID
    user_info_display = {
        title: "ID",
        content: userInfo["id"],
        cancopy: true,
    }

    addUserInfo(clone, user_info_display);

    // CREATED AT
    const formattedDate = await formatDate(userInfo["created_at"]);

    if (formattedDate) {
        user_info_display = {
            title: "Created",
            icon: "imgs/svg/userCard/calendar.svg",
            content: formattedDate,
        }

        addUserInfo(clone, user_info_display);
    }

    // FOLLOWED AT
    if (subage_info?.followedAt) {
        const followDate = await formatDate(subage_info["followedAt"]);

        if (followDate) {
            user_info_display = {
                title: "Followed",
                icon: "imgs/svg/userCard/clock.svg",
                content: followDate,
            }

            addUserInfo(clone, user_info_display);
        }
    }

    // AVATAR
    const avatar_container = usercard_elements.header.avatar.main;
    const avatar_display = usercard_elements.header.avatar.img;

    if (userInfo["profile_image_url"]) {
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

        let avatar = avatar1 || avatar2;

        avatar_display.src = avatar;

        if (avatar1 && avatar1 != avatar2) {
            let isUsingAvatar1 = true;

            avatar_container.style.cursor = "pointer";

            avatar_container.addEventListener('click', () => {
                isUsingAvatar1 = !isUsingAvatar1;
                avatar_display.src = isUsingAvatar1 ? avatar1 : avatar2;
            });
        }
    }

    // BLOCK BUTTON
    const user_card_blur_cover = usercard_elements.card_blur;
    const block_button = usercard_elements.header.block.button;
    const block_confirmation = usercard_elements.header.block.confirmation.main;
    const confirm_yes = usercard_elements.header.block.confirmation.confirm;
    const confirm_no = usercard_elements.header.block.confirmation.cancel;

    function updateBlurCover() {
        const rect = clone.getBoundingClientRect();
        user_card_blur_cover.style.width = `${rect.width}px`;
        user_card_blur_cover.style.height = `${rect.height}px`;
    }

    if (username != tmiUsername) {
        let is_blocked = blockedUsersData.find(user => user.username === userInfo["login"]);

        if (is_blocked) {
            block_button.classList.add("blocked");
        } else {
            block_button.classList.remove("blocked");
        }

        block_button.addEventListener('click', () => {
            if (!block_button.classList.contains("blocked")) {
                block_confirmation.style.display = "block";
                user_card_blur_cover.style.display = "block";
                updateBlurCover();
            } else {
                toggleBlock(false);
            }
        });

        confirm_yes.addEventListener('click', async () => {
            toggleBlock(true);
            block_confirmation.style.display = "none";
            user_card_blur_cover.style.display = "none";
        });

        confirm_no.addEventListener('click', () => {
            block_confirmation.style.display = "none";
            user_card_blur_cover.style.display = "none";
        });

        function toggleBlock(shouldBlock) {
            blockUser(userInfo["id"], shouldBlock).then(was_blocked => {
                if (was_blocked) {
                    if (shouldBlock) {
                        blockedUsersData.push({ username: userInfo["login"] });

                        block_button.classList.add("blocked");

                        handleMessage(custom_userstate.Server, `${userInfo["login"]} was blocked.`);
                    } else {
                        blockedUsersData = blockedUsersData.filter(u => u.username !== userInfo["login"]);

                        block_button.classList.remove("blocked");

                        handleMessage(custom_userstate.Server, `${userInfo["login"]} was unblocked.`);
                    }
                } else {
                    handleMessage(custom_userstate.Server, `Error occurred while trying to block/unblock ${userInfo["login"]}.`);
                }
            });
        }
    } else {
        block_button.style.display = "none";
    }

    // SUB INFO
    const subscription_info = usercard_elements.subscription.main;
    const subscription_tags = usercard_elements.subscription.tags;

    const subscription_duration_value = usercard_elements.subscription.duration.value;
    const subscription_overall_value = usercard_elements.subscription.overall.value;

    const subscription_gifted_username = usercard_elements.subscription.gifted.username;
    const subscription_gifted_text = usercard_elements.subscription.gifted.text;
    const subscription_start = usercard_elements.subscription.gifted.start;

    const progress_bar = usercard_elements.subscription.progress_bar.container;
    const progress = usercard_elements.subscription.progress_bar.fill;

    const subscription_end = usercard_elements.subscription.end;

    if (subage_info?.statusHidden) {
        subscription_info.innerHTML = "Subscription status hidden";
    } else {
        if (subage_info?.cumulative) {
            const sub_info = subage_info["cumulative"];

            if (sub_info) {
                const months = sub_info["months"];

                if (months) {
                    if (subage_info?.["meta"]) {
                        const meta = subage_info?.["meta"];

                        const endsAt = meta?.["endsAt"] ? new Date(meta["endsAt"]) : undefined;
                        const startedAt = subage_info?.["cumulative"]?.["start"] ? new Date(subage_info["cumulative"]["start"]) : undefined;
                        const now = new Date();

                        const timeDiff = endsAt - now;
                        const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                        let percentCompleted;
                        if (startedAt && endsAt && endsAt > startedAt) {
                            const totalDuration = endsAt - startedAt;
                            const elapsed = now - startedAt;
                            percentCompleted = Math.max(0, Math.min(100, Math.floor((elapsed / totalDuration) * 100)));
                        }

                        if (percentCompleted && progress) {
                            progress.style.width = percentCompleted ? `${percentCompleted}%` : '0%';
                        }

                        if ((endsAt && daysRemaining > 0) || meta) {
                            let monthsBetween = 0;
                            if (startedAt && endsAt && endsAt > startedAt) {
                                const yearDiff = endsAt.getUTCFullYear() - startedAt.getUTCFullYear();
                                const monthDiff = endsAt.getUTCMonth() - startedAt.getUTCMonth();
                                monthsBetween = yearDiff * 12 + monthDiff;
                                if (endsAt.getUTCDate() < startedAt.getUTCDate()) {
                                    monthsBetween--;
                                }
                                monthsBetween = Math.max(1, monthsBetween);
                            }
                            subscription_duration_value.innerHTML = `${monthsBetween} month${monthsBetween > 1 ? 's' : ''}`;
                        } else {
                            subscription_duration_value.innerHTML = `${months} month${months > 1 ? 's' : ''}`;
                        }

                        subscription_overall_value.innerHTML = `${months} month${months > 1 ? 's' : ''}`;

                        if (startedAt) {
                            subscription_start.innerHTML = `on: ${await formatDate(startedAt)}`;
                        }

                        if (meta?.tier) {
                            subscription_tags.classList.add(`sub_tier${meta.tier}`);
                        }

                        if (meta?.type) {
                            subscription_tags.classList.add(`sub_${meta.type}`);
                        }

                        if (!meta?.["endsAt"]) {
                            subscription_duration_value.innerHTML = `Indefinite subscription`;

                            progress_bar.style.display = "none";
                            subscription_end.style.display = "none";
                        } else if (daysRemaining) {
                            let years = Math.floor(daysRemaining / 365);
                            let months = Math.floor((daysRemaining % 365) / 30);
                            let days = daysRemaining % 30;
                            let remainingStr = [];
                            if (years > 0) remainingStr.push(`${years} year${years > 1 ? 's' : ''}`);
                            if (months > 0) remainingStr.push(`${months} month${months > 1 ? 's' : ''}`);
                            if (days > 0 || remainingStr.length === 0) remainingStr.push(`${days} day${days !== 1 ? 's' : ''}`);

                            subscription_end.innerHTML = `${remainingStr.join(', ')} remaining`;
                        }

                        if (meta?.["giftMeta"]) {
                            const giftMeta = meta?.["giftMeta"];

                            const giftedInfo_array = [];

                            if (giftMeta?.["gifter"]?.["login"]) {
                                const gifter = giftMeta?.["gifter"];
                                const gifterName = gifter?.displayName.toLowerCase() === gifter?.login?.toLowerCase() ? gifter?.displayName : `${gifter?.displayName} (${gifter?.login})`;

                                subscription_gifted_username.innerHTML = gifterName;
                            }

                            if (giftMeta?.["giftDate"]) {
                                const date = new Date(giftMeta?.["giftDate"]);

                                const day = String(date.getUTCDate()).padStart(2, '0');
                                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                const year = date.getUTCFullYear();

                                const formatted = `${day}-${month}-${year}`;

                                giftedInfo_array.push(giftedInfo_array.length ? `at: ${formatted}` : `Subscription gifted on: ${formatted}`);
                            }
                        } else {
                            subscription_gifted_username.style.display = "none";
                            subscription_gifted_text.style.display = "none";

                            if (subscription_start.innerHTML && subscription_start.innerHTML.length) {
                                subscription_start.innerHTML = subscription_start.innerHTML.charAt(0).toUpperCase() + subscription_start.innerHTML.slice(1);
                            }

                            subscription_start.style.color = "#dedee3";
                        }
                    } else {
                        subscription_info.innerHTML = `Previously subscribed for ${months} month${months > 1 ? 's' : ''}`;
                    }
                }
            }
        } else {
            subscription_info.style.display = "none";
        }
    }

    // USER COLOR
    if (userData?.["data"]?.[0]?.["color"] != null) {
        try {
            // NAME COLOR
            let { r, g, b } = hexToRgb(userData["data"][0]["color"]);
            const color_name = await getColorName(userData["data"][0]["color"]);

            if (r !== undefined && g !== undefined && b !== undefined) {
                usercard_elements.colors_info.name_color.name.innerHTML = color_name;
                usercard_elements.colors_info.name_color.dot.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                usercard_elements.colors_info.name_color.rgb.innerHTML = `rgb(${r}, ${g}, ${b})`;
            } else {
                usercard_elements.colors_info.name_color.name.innerHTML = color_name;
                usercard_elements.colors_info.name_color.dot.style.backgroundColor = userData["data"][0]["color"];
                usercard_elements.colors_info.name_color.rgb.innerHTML = userData["data"][0]["color"];
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

                usercard_elements.colors_info.chat_color.name.innerHTML = colorChat_name;
                usercard_elements.colors_info.chat_color.dot.style.backgroundColor = lighten;
                usercard_elements.colors_info.chat_color.rgb.innerHTML = lighten;
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

    const editableTags = ['INPUT', 'TEXTAREA'];
    if (
        editableTags.includes(event.target.tagName) ||
        event.target.isContentEditable
    ) {
        return;
    }

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
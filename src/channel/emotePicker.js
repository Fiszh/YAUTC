const emote_picker = document.getElementById("emote_picker");
const emotePickerButton = document.getElementById('chatEmotePickerButton');
const emote_picker_search = emote_picker.querySelector("#emote_picker_search");
const emotePickerCloseButton = emote_picker.querySelector('#close_emote_picker');
const emote_picker_sections = emote_picker.querySelector("#emote_picker_sections");
const searchInput = emote_picker_search.querySelector("#emote_picker_search_input");
const emote_picker_sections_selector = emote_picker.querySelector("#emote_picker_sections_selector");

let section = "sub_emotes";

let modes = {
    match_case: false,
    exact_match: false
}

if (!emote_picker) {
    alert("Emote picker not found in the DOM.");
}

emote_picker_sections_selector.querySelectorAll('button').forEach(button => {
    button.onclick = () => {
        displayEmotes(button.id);
    };
});

emote_picker_search.querySelectorAll('button').forEach(button => {
    button.onclick = () => {
        if (button.id === "case_match") {
            modes.match_case = !modes.match_case;
            button.classList.toggle("active", modes.match_case);
        } else if (button.id === "exact_match") {
            modes.exact_match = !modes.exact_match;
            button.classList.toggle("active", modes.exact_match);
        } else {
            alert("Unknown button clicked: " + button.id);
        }
    };
});

function removeEmoteDuplicates(emotes) {
    const seen = new Set();
    return emotes.filter(emote => {
        const key = `${emote.name}|${emote.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function groupEmotesByOwner(emotes) {
    const grouped = emotes
        .filter(e => e.emote_owner_name)
        .reduce((acc, e) => ((acc[e.emote_owner_name] ??= []).push(e), acc), {});

    const groupedSet = new Set(Object.values(grouped).flat());
    const remaining = emotes.filter(e => !groupedSet.has(e));
    const mappedSections = Object.entries(grouped).map(([name, emotes]) => ({ name, emotes }));

    return { mappedSections, remaining };
}

function displayEmotes(emote_picker_section = "sub_emotes") {
    let emoteSections = [];

    if (emote_picker.style.display !== "flex") {
        searchInput.value = "";
        emote_picker_sections_selector.style.display = "flex";

        Object.keys(modes).forEach(key => modes[key] = false);

        emote_picker_search.querySelectorAll('button').forEach(button => {
            button.classList.toggle("active", modes.exact_match);
        });
    }

    emote_picker.style.display = "flex";
    emote_picker_sections.innerHTML = "";
    section = emote_picker_section;

    if (emote_picker_section == "sub_emotes" || emote_picker_section == "search_emotes") {
        const sub_emotes = removeEmoteDuplicates(
            [
                ...TTVEmoteData.filter(emote => emote.emote_type === "subscriptions" && typeof emote.name === "string"),
                ...TTVChannelEmoteData.filter(emote => emote.emote_type === "follower" && typeof emote.name === "string"),
            ]
        ).sort((a, b) => a.name.localeCompare(b.name));

        const bits_emotes = removeEmoteDuplicates(
            TTVEmoteData.filter(emote => emote.emote_type === "bitstier" && typeof emote.name === "string")
        ).sort((a, b) => a.name.localeCompare(b.name));

        const hypetrain_emotes = removeEmoteDuplicates(
            TTVEmoteData.filter(emote => emote.emote_type === "hypetrain")
        );

        const limited_emotes = removeEmoteDuplicates(
            TTVEmoteData.filter(emote => emote.emote_type === "limitedtime")
        );

        const prime_emotes = removeEmoteDuplicates(
            TTVEmoteData.filter(emote => emote.emote_type === "prime")
        );

        // Separate follower and sub emotes
        const follower_emotes = sub_emotes.filter(emote => emote.emote_type === "follower");
        const sub_only_emotes = sub_emotes.filter(emote => emote.emote_type === "subscriptions");

        const { mappedSections: mapped_sub_emotes_raw, remaining: remaining_sub_emotes } = groupEmotesByOwner(sub_only_emotes);
        const { mappedSections: mapped_follower_emotes_raw, remaining: remaining_follower_emotes } = groupEmotesByOwner(follower_emotes);
        const { mappedSections: mapped_bits_emotes_raw, remaining: remaining_bits_emotes } = groupEmotesByOwner(bits_emotes);

        let mapped_sub_emotes = mapped_sub_emotes_raw.map(({ name, emotes }) => ({
            name,
            emotes
        }));

        let mapped_follower_emotes = mapped_follower_emotes_raw.map(({ name, emotes }) => ({
            name: `${name} (follower)`,
            emotes
        }));

        const broadcaster_sub_emotes = mapped_sub_emotes.filter(section =>
            section.name.toLowerCase().includes(broadcaster)
        );

        mapped_sub_emotes = mapped_sub_emotes.filter(section =>
            !section.name.toLowerCase().includes(broadcaster)
        );

        const broadcaster_follower_emotes = mapped_follower_emotes.filter(section =>
            section.name.toLowerCase().includes(broadcaster)
        );

        mapped_follower_emotes = mapped_follower_emotes.filter(section =>
            !section.name.toLowerCase().includes(broadcaster)
        );

        let mapped_bits_emotes = mapped_bits_emotes_raw.map(({ name, emotes }) => ({
            name: `${name} (bits)`,
            emotes
        }));

        const broadcaster_bits_emotes = mapped_bits_emotes.filter(section =>
            section.name.toLowerCase().includes(broadcaster)
        );

        mapped_bits_emotes = mapped_bits_emotes.filter(section =>
            !section.name.toLowerCase().includes(broadcaster)
        );

        const broadcaster_emotes = [
            ...broadcaster_sub_emotes,
            ...broadcaster_follower_emotes,
            ...broadcaster_bits_emotes
        ];

        const foundTTVUser = TTVUsersData.find(user => user.name == `@${tmiUsername}`);

        emoteSections.push(
            ...broadcaster_emotes,
            ...mapped_sub_emotes,
            { name: "Other subscriptions", emotes: remaining_sub_emotes },
            ...mapped_bits_emotes,
            { name: "Other bits", emotes: remaining_bits_emotes },
            { name: "Prime", emotes: prime_emotes },
            { name: "Hype Train", emotes: hypetrain_emotes },
            { name: "Limited Time", emotes: limited_emotes }
        );

        if (foundTTVUser?.cosmetics?.personal_emotes) {
            emoteSections.push(
                { name: "7TV Personal Emotes", emotes: foundTTVUser.cosmetics.personal_emotes }
            );
        }
    }

    if (emote_picker_section == "channel_emotes" || emote_picker_section == "search_emotes") {
        emoteSections.push(
            {
                name: "7TV",
                emotes: SevenTVEmoteData,
            },
            {
                name: "BTTV",
                emotes: BTTVEmoteData,
            },
            {
                name: "FFZ",
                emotes: FFZEmoteData,
            },
        );
    }

    if (emote_picker_section == "global_emotes" || emote_picker_section == "search_emotes") {
        emoteSections.push(
            {
                name: "7TV",
                emotes: SevenTVGlobalEmoteData,
            },
            {
                name: "BTTV",
                emotes: BTTVGlobalEmoteData,
            },
            {
                name: "FFZ",
                emotes: FFZGlobalEmoteData,
            },
            {
                name: "Twitch",
                emotes: TTVGlobalEmoteData,
            },
        );
    }

    if (section === "search_emotes") {
        if (!searchInput.value.length) {
            emote_picker_sections_selector.style.display = "flex";

            displayEmotes("sub_emotes");

            return;
        } else {
            emote_picker_sections_selector.style.display = "none";

            emoteSections = emoteSections
                .map(section => ({
                    ...section,
                    emotes: section.emotes.filter(emote => {
                        let emoteName = emote.name;
                        let term = searchInput.value;
                        if (!modes.match_case) {
                            emoteName = emoteName.toLowerCase();
                            term = term.toLowerCase();
                        }
                        if (modes.exact_match) {
                            return new RegExp(`\\b${term}\\b`).test(emoteName);
                        } else {
                            return emoteName.includes(term);
                        }
                    })
                }))
                .filter(section => section.emotes.length > 0);
        }
    }

    const anyEmotes = emoteSections.some(section => section.emotes.length > 0);

    if (!anyEmotes) {
        const noEmotesMessage = document.createElement("p");
        noEmotesMessage.textContent = "No emotes found.";
        emote_picker_sections.appendChild(noEmotesMessage);
        return;
    }

    for (const section of emoteSections) {
        if (!section.emotes.length) { continue; };

        const sectionElement = document.createElement("section");
        sectionElement.classList.add("emote_picker_section");

        const sectionTitle = document.createElement("h2");
        sectionTitle.innerHTML = section.name;
        sectionElement.appendChild(sectionTitle);

        const emoteList = document.createElement("div");
        emoteList.classList.add("emote_list");

        const EmotesMap = section.emotes.map((emote) => {
            return `<img class="emote_picker_emote" src="${emote.url}" alt="${emote.name}" loading="lazy" tooltip-type="${emote?.site || ""}" tooltip-creator="${emote?.creator || ""}">`;
        });

        sectionElement.appendChild(sectionTitle);
        sectionElement.appendChild(emoteList);

        emoteList.innerHTML = EmotesMap.join("");

        emote_picker_sections.appendChild(sectionElement);
    }
}

document.addEventListener('click', function (event) {
    if (event.target.id === "close_emote_picker") {
        emote_picker.style.display = "none";
        emote_picker_sections.innerHTML = "";
    } else {
        if (event.target.classList.contains("emote_picker_emote")) {
            const emoteName = event.target.alt;

            if (emoteName) {
                chatInput.value = !chatInput.value.length
                    ? `${emoteName} `
                    : chatInput.value.trim() + ` ${emoteName} `;

                chatInput.focus();

                chatInput.selectionStart = chatInput.selectionEnd = chatInput.value.length;
                chatInput.scrollLeft = chatInput.scrollWidth;
            }
        }
    }
});

emotePickerButton.addEventListener('click', () => displayEmotes());
searchInput.addEventListener('input', (event) => displayEmotes("search_emotes"));
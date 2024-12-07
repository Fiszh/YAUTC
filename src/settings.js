const settingsDiv = document.getElementById("settings");

// NEEDED
let desiredHeight = 36;

const configuration = {
    section_0: {
        name: "General",
        type: 'section'
    },
    twitch_login: {
        name: 'Use twitch login to connect to chat (refresh required)',
        type: 'boolean',
        value: false,
        param: 'twitchLogin'
    },
    font: {
        name: 'Site font',
        type: 'text',
        value: "inter",
        param: 'font'
    },
    seventv_Paints: {
        name: 'Display 7TV Paints',
        type: 'boolean',
        value: true,
        param: 'paints'
    },
    seventv_Paints_Shadows: {
        name: 'Display 7TV Paint Shadows (may cause drops in performance)',
        type: 'boolean',
        value: true,
        param: 'paintShadows'
    },
    follower_list: {
        name: 'Always display followed channels',
        type: 'boolean',
        value: true,
        param: 'channelFollow'
    },
    beta_test: {
        name: 'Recive beta features',
        type: 'boolean',
        value: false,
        param: 'betaTest'
    },
    section_1: {
        name: "Chat",
        type: 'section'
    },
    message_bold: {
        name: 'Messages are in <strong>bold</strong> text',
        type: 'boolean',
        value: false,
        param: 'msgBold'
    },
    message_caps: {
        name: 'Messages are in UPPERCASE',
        type: 'boolean',
        value: false,
        param: 'msgCaps'
    },
    emote_size: {
        name: 'Emote size',
        type: 'number',
        param: 'emoteSize',
        max: 200,
        min: 0,
        value: 36
    },
    moderation_actions: {
        name: 'Moderation actions (message deletion) effect displayed chat messages',
        type: 'boolean',
        value: false,
        param: 'modAction'
    },
    mentions_color: {
        name: 'Mentions are <div id="rainbow-text">Colored</div>',
        type: 'boolean',
        value: true,
        param: 'mentionColor'
    },
    display_debug: {
        name: 'Display debug alerts in chat (CTRL + Q FOR DEBUG INFO)',
        type: 'boolean',
        value: false,
        param: 'chatDebug'
    },
    conneted_chats: {
        name: 'Only display chatters from current stream during connected chat',
        type: 'boolean',
        value: false,
        param: 'connectedChat'
    }
};

const templates = {
    boolean: {
        name: 'template',
        type: 'boolean',
        value: false,
        param: 'template'
    },
    text: {
        name: 'template',
        type: 'text',
        value: "template",
        param: 'template'
    },
    number: {
        name: 'template',
        type: 'number',
        param: 'template',
        max: 1,
        min: 0,
        value: 1
    }
};

let userSettings = {};

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedSaveSettings = debounce(saveSettings, 500);

function displaySettings() {
    if (!settingsDiv) { return; }
    let i = 0;

    loadSettings();
    setUpSettings();

    for (const key in configuration) {
        const setting = configuration[key];

        if (setting.type === "number") {
            const numberSetting = document.createElement('div');
            numberSetting.className = 'setting_number';
            const param = setting.param;

            numberSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="number" id="quantity-${i}" name="quantity" value="${userSettings[param] || setting.value}" min="${setting.min}" max="${setting.max}" step="1" oninput="validateInput(event)" autocomplete="off">
            `;

            settingsDiv.append(numberSetting);

            const numberInput = document.getElementById(`quantity-${i}`);

            numberInput.addEventListener('input', function (event) {
                userSettings[param] = Number(numberInput.value) || 0;

                if (param === "emoteSize") {
                    desiredHeight = Number(userSettings['emoteSize']);
                }

                saveSettings();
            });

            i++;
        } else if (setting.type === "boolean") {
            const booleanSetting = document.createElement('div');
            booleanSetting.className = 'setting_boolean';
            const param = setting.param;

            const isChecked = userSettings[param] || setting.value ? " checked" : "";

            booleanSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <div class="toggle-container">
                    <input type="checkbox" id="toggle-${i}" class="toggle-input"${isChecked}>
                    <label for="toggle-${i}" class="toggle-label"></label>
                </div>
            `;

            settingsDiv.append(booleanSetting);

            const checkbox = document.getElementById(`toggle-${i}`);

            checkbox.addEventListener('change', function () {
                if (param === "channelFollow") {
                    displayFollowlist(checkbox.checked)
                }

                userSettings[param] = checkbox.checked;
                saveSettings();
            });

            i++;
        } else if (setting.type === "text") {
            const textSetting = document.createElement('div');
            textSetting.className = 'setting_text';
            const param = setting.param;

            textSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="text" id="quantity-${i}" name="quantity" autocomplete="off" spellcheck="false" placeholder="${setting.value}">
            `;

            settingsDiv.append(textSetting);

            const textInput = document.getElementById(`quantity-${i}`);
            if (userSettings[param] && userSettings[param] !== setting.value) {
                textInput.value = String(userSettings[param]);
            }

            if (textInput) {
                textInput.addEventListener('input', function () {
                    if (param === "font") {
                        const settingNameElement = textSetting.querySelector('.setting_name');
                        settingNameElement.style.fontFamily = `"${textInput.value}", "inter"`;
                        document.body.style.fontFamily = `"${textInput.value}", "inter"`;
                    }

                    userSettings[param] = textInput.value || "";
                    debouncedSaveSettings();
                });
            }

            i++;
        } else if (setting.type === "section") {
            const sectionSetting = document.createElement('div');
            sectionSetting.className = 'setting_section';

            sectionSetting.innerHTML = `<div class="setting_name">${setting.name}</div>`;

            settingsDiv.append(sectionSetting);
        }
    }
}

function saveSettings() {
    if (is_dev_mode) {
        console.log('In dev mode, did not save settings to localStorage.');
        return;
    }

    const userSettingsEncoded = JSON.stringify(userSettings);
    localStorage.setItem('userSettings', userSettingsEncoded);
}

function loadSettings() {
    const userSettingsString = localStorage.getItem('userSettings');

    if (userSettingsString) {
        try {
            userSettings = JSON.parse(userSettingsString);
        } catch (error) {
            console.error('Error parsing userSettings from localStorage:', error);
        }
    }

    // Ensure all configuration settings are in userSettings
    for (const key in configuration) {
        const setting = configuration[key];
        let value = setting.type === 'text' ? null : setting.value;

        if (!(setting.param in userSettings)) {
            if (setting.type !== 'section') {
                userSettings[setting.param] = value;
            }
        }
    }

    console.log(userSettings);
    setUpSettings();
}

function setUpSettings() {
    if (userSettings['emoteSize']) {
        desiredHeight = Number(userSettings['emoteSize']);
    }

    if (userSettings['font']) {
        document.body.style.fontFamily = `"${userSettings['font']}", "inter"`;
    }
}

function validateInput(event) {
    const input = event.target;
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    input.value = input.value.replace(/[^0-9]/g, '');

    let value = parseInt(input.value) || 0;

    if (value < min) {
        input.value = min;
    } else if (value > max) {
        input.value = max;
    }
}

// Load
displaySettings();

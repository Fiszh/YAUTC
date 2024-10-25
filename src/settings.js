const settingsDiv = document.getElementById("settings");

// NEEDED
let desiredHeight = 36;

const configuration = {
    twitch_login: {
        name: 'Use twitch login to connect to chat (refresh required)',
        type: 'boolean',
        value: false,
        param: 'twitchLogin'
    },
    message_bold: {
        name: 'Message are in <strong>bold</strong> text',
        type: 'boolean',
        value: false,
        param: 'msgBold'
    },
    message_caps: {
        name: 'Message are in UPPERCASE',
        type: 'boolean',
        value: false,
        param: 'msgCaps'
    },
    font: {
        name: 'Custom chat font',
        type: 'text',
        value: "inter",
        param: 'font'
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

            numberSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="text" id="quantity-${i}" name="quantity" value="${userSettings[param] || setting.value}" min="${setting.min}" max="${setting.max}" step="1" oninput="validateInput(event)" autocomplete="off">
            `;

            settingsDiv.append(numberSetting);

            const numberInput = document.getElementById(`quantity-${i}`);

            numberInput.addEventListener('input', function (event) {
                const param = setting.param;

                userSettings[param] = Number(numberInput.value) || 0;

                saveSettings();
            });

            i++;
        } else if (setting.type === "boolean") {
            const booleanSetting = document.createElement('div');
            booleanSetting.className = 'setting_boolean';

            isChecked = '';

            if (userSettings[param] || setting.value) {
                isChecked = " checked"
            }

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
                const param = setting.param;

                userSettings[param] = checkbox.checked;

                saveSettings();
            });

            i++;
        } else if (setting.type === "text") {
            const textSetting = document.createElement('div');
            textSetting.className = 'setting_text';

            textSetting.innerHTML = `
                <div class="setting_name">${setting.name}</div>
                <input type="text" id="quantity-${i}" name="quantity" autocomplete="off" spellcheck="false" placeholder="${setting.value}">
            `;

            settingsDiv.append(textSetting);

            const textInput = document.getElementById(`quantity-${i}`);

            if (userSettings[param] && userSettings[param] !== setting.value) {
                textInput.value = String(userSettings[param])
            }

            if (textInput) {
                textInput.addEventListener('input', function () {
                    const param = setting.param;

                    if (param === "font") {
                        const settingNameElement = textSetting.querySelector('.setting_name');
                        settingNameElement.style.fontFamily = `"${textInput.value}", "inter"`;
                        document.body.style.fontFamily = `"${textInput.value}", "inter"`;
                    }

                    userSettings[param] = textInput.value || "";

                    saveSettings();
                });
            }

            i++;
        }
    }
}

async function saveSettings() {
    setUpSettings();

    if (is_dev_mode) {
        console.log('In dev mode, did not save settings cookie.');
        return;
    }

    const userSettingsEncoded = encodeURIComponent(JSON.stringify(userSettings));

    // Set the expiration date to 10 years from now
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    const expires = date.toUTCString();

    // Set the cookie
    document.cookie = `userSettings=${userSettingsEncoded}; path=/; expires=${expires};`;
}

function loadSettings() {
    // Get the encoded userSettings cookie
    const userSettingsCookie = getCookie('userSettings');

    if (userSettingsCookie) {
        try {
            userSettings = JSON.parse(decodeURIComponent(userSettingsCookie));
        } catch (error) {
            console.error('Error parsing userSettings cookie:', error);
        }
    }

    // Ensure all configuration settings are in userSettings
    for (const key in configuration) {
        const setting = configuration[key];
        let value = setting.type === 'text' ? null : setting.value;

        if (!(setting.param in userSettings)) {
            userSettings[setting.param] = value;
        }
    }

    console.log(userSettings)

    setUpSettings();
}

async function setUpSettings() {
    if (userSettings['emoteSize']) {
        desiredHeight = Number(userSettings['emoteSize'])
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
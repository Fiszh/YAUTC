const settingsDiv = document.getElementById("settings");

// NEEDED
let desiredHeight = 36;

const EmoteStyle = document.createElement('style');
document.head.appendChild(EmoteStyle);

let configuration = {}; // DATA MOVED TO JSONS

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
    },
    section: {
        name: 'template',
        type: 'section'
    },
    information: {
        name: 'template',
        type: 'information'
    },
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
    settingsDiv.innerHTML = ""
    let i = 0;

    loadSettings();
    setUpSettings();

    for (const key in configuration) {
        const setting = configuration[key];

        if (setting["disabled"]) { continue; }

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
                    desiredHeight = Number(userSettings['emoteSize']) || 36;

                    EmoteStyle.textContent = `
                            .emote-wrapper {
                                min-height: ${desiredHeight}px;
                            }
                            .emote {
                                min-height: 5px;
                                max-height: ${desiredHeight}px;
                            }
                            .emote.emoji {
                                height: ${desiredHeight}px;
                            }
                        `;
                }

                saveSettings();
            });

            i++;
        } else if (setting.type === "boolean") {
            const booleanSetting = document.createElement('div');
            booleanSetting.className = 'setting_boolean';
            const param = setting.param;

            const isChecked = param in userSettings
                ? (userSettings[param] ? " checked" : "")
                : (setting.value ? " checked" : "");

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
                    checkSettings(checkbox.checked);
                }

                userSettings[param] = checkbox.checked;
                saveSettings();

                if (param === "msgCaps") {
                    if (checkbox.checked) {
                        chatDisplay.style.textTransform = "uppercase";
                    } else {
                        chatDisplay.style.textTransform = "";
                    }
                } else if (param == "msgTime" && chatDisplay) {
                    console.log(param)
                    chatDisplay.classList.toggle("msgTime", userSettings['msgTime']);
                }
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
        } else if (setting.type === "information" || setting.type === "credit") {
            const sectionSetting = document.createElement('div');
            sectionSetting.className = 'setting_information';

            if (setting.type === "credit") {
                setting.name = `<a href="${setting.url}" style="color: white; text-decoration: none;" target="_blank">${setting.name} (${setting.url})</a>`
            }

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

        EmoteStyle.textContent = `
                .emote-wrapper {
                    min-height: ${desiredHeight}px;
                }
                .emote {
                    min-height: 5px;
                    max-height: ${desiredHeight}px;
                }
                .emote.emoji {
                    height: ${desiredHeight}px;
                }
            `;
    }

    if (userSettings['msgCaps']) {
        chatDisplay.style.textTransform = "uppercase";
    }

    if (userSettings['font']) {
        document.body.style.fontFamily = `"${userSettings['font']}", "inter"`;
    }

    if (userSettings['msgTime']) {
        chatDisplay.classList.toggle("msgTime", userSettings['msgTime']);
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
        //input.value = max;
    }
}

async function getJSON(path) {
    try {
        const response = await fetch(path);

        if (!response.ok) { return false; };

        const data = await response.json();

        return data;
    } catch (er) {
        return false;
    }
}

async function fetchSettings() {
    const path = "src/data/settingsUI/"

    const settingsJSON = await getJSON(`${path}settings.json`);

    if (!settingsJSON) {
        settingsDiv.innerHTML = "settings.json failed to load";

        return;
    }

    configuration = settingsJSON;

    const keybindsJSON = await getJSON(`${path}keybinds.json`);
    const creditsJSON = await getJSON(`${path}credits.json`);

    if (keybindsJSON && !isOnMobile) {
        configuration = { ...configuration, ...keybindsJSON };
    }

    if (creditsJSON) {
        configuration = { ...configuration, ...creditsJSON };
    }

    displaySettings();
}

// Load
fetchSettings();

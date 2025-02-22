const console_panel_display = document.querySelector('.console_panel_display');
const connection_topics = document.querySelector('.connection_topics');
const connectionButton = document.querySelector('.connection_button');
const subscribe_button = document.querySelector('.subscribe_button');
const condition_input = document.querySelector('.condition_input');
const condition_add = document.querySelector('.condition_add');
const connection_id = document.querySelector('.connection_id');
const textarea = document.querySelector('.topic_input');

document.title = "YAUTC - EventSub Debugger";

let sessionId = "0";
let EventSubStatus = 0;
let websocket_state = 'Connecting';
let EventSubWS;
let topics = [];

function fixSize(text_area) {
    text_area.addEventListener('input', () => {
        const textLength = text_area.value.length;
    
        const newSize = Math.max(10, 30 - textLength / 3);
    
        text_area.style.fontSize = `${newSize}px`;
    });
}

fixSize(textarea);

function objectToString(input, indent = 0) {
    const space = ' 󠀀 ';
    
    if (Array.isArray(input)) {
        return input.map(item => objectToString(item, indent)).join(', ') + '<br>';
    }
    
    else if (typeof input === 'object' && input !== null) {
        const indentStr = space.repeat(indent);
        const nestedIndentStr = space.repeat(indent + 1);

        if (Object.keys(input).length === 0) {
            return '{}<br>';
        }

        return '{<br>' + Object.entries(input).map(([key, value], index, array) => {
            let entry;
            if (typeof value === 'object' && value !== null) {
                entry = `${nestedIndentStr}"${key}": ${objectToString(value, indent + 1)}`;
            } else {
                entry = `${nestedIndentStr}"${key}": "${String(value)}"`;
            }
            if (index < array.length - 1) {
                entry += ',<br>';
            } else {
                entry += '<br>';
            }
            return entry;
        }).join('') + `${indentStr}}<br>`;
    }
    
    return String(input);
}

async function logToConsole(message, object) {
    const isAtBottom = console_panel_display.scrollHeight - console_panel_display.scrollTop === console_panel_display.clientHeight;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    if (object) {
        object = objectToString(object);

        object = `<br> ${object}`;
    }

    console_panel_display.innerHTML += `[${hours}.${minutes}.${seconds}.${milliseconds}] ${message} ${object || ""} <br>`

    if (isAtBottom) {
        console_panel_display.scrollTop = console_panel_display.scrollHeight;
    }
}

function addCondition() {
    const conditionDiv = document.createElement('div');
    conditionDiv.classList.add('condition');

    const textareaName = document.createElement('textarea');
    textareaName.classList.add('condition_name');
    textareaName.placeholder = "name";

    const textareaValue = document.createElement('textarea');
    textareaValue.classList.add('condition_value');
    textareaValue.placeholder = "value";

    const removeButton = document.createElement('button');
    removeButton.classList.add('condition_remove');
    removeButton.textContent = 'X';

    conditionDiv.appendChild(textareaName);
    conditionDiv.appendChild(textareaValue);
    conditionDiv.appendChild(removeButton);

    condition_input.appendChild(conditionDiv);

    fixSize(textareaName);
    fixSize(textareaValue);

    removeButton.addEventListener('click', function () {
        conditionDiv.remove();
    });
}

function getConditionValues() {
    let result = {
        version: "1",
        condition: {}
    };

    const conditions = document.querySelectorAll('.condition');

    conditions.forEach((condition) => {
        const name = condition.querySelector('.condition_name').value.trim();
        const value = condition.querySelector('.condition_value').value.trim();
        
        if (name && value) {
            if (name.toLowerCase() === 'version') {
                result.version = value;
            } else {
                result.condition[name] = value;
            }
        }
    });

    return JSON.stringify(result, null, 4);
}

function connectToEventSub() {
    if (connectionButton.textContent == 'CONNECT') { return; }

    EventSubWS = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

    EventSubWS.onopen = async () => {
        logToConsole('WebSocket connection opened.');

        logToConsole(`EVENTSUB WEBSOCKET OPEN`);
    };

    EventSubWS.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.metadata.message_type === 'session_welcome') {
            logToConsole(`EVENTSUB WEBSOCKET CONNECTED`);
            logToConsole(`Received Welcome Message, current session id: ${message.payload.session.id}`);

            sessionId = message.payload.session.id;

            connection_id.innerHTML = `Connection id: ${sessionId}`;

            connectionButton.textContent = 'DISCONNECT';
            connectionButton.style.backgroundColor = '#ab3d34';
        } else if (message.metadata.message_type === 'notification') {
            logToConsole('Received Event Notification:', message);
        } else if (message.metadata.message_type === 'session_keepalive') {
            logToConsole('Recieved keep alive message:', message);
        } else if (message.metadata.message_type === 'session_reconnect') {
            logToConsole(`EVENTSUB WEBSOCKET RECONNECTING`);

            logToConsole('Reconnect needed:', message);

            EventSubWS.close();
        } else {
            logToConsole('Unregistered EventSub message:', message);
        }
    };

    EventSubWS.onclose = async (event) => {
        connectionButton.textContent = 'CONNECT';
        connectionButton.style.backgroundColor = '#438b30';

        topics = [];
        connection_topics.innerHTML = `Topics: ${topics.join(",")}`;

        logToConsole(`EVENTSUB WEBSOCKET CLOSED`);

        if (EventSubStatus !== 429) {
            connectToEventSub()
        } else {
            logToConsole(`EVENTSUB WEBSOCKET HAS TO MANY CONNECTIONS.`);
        }

        logToConsole(`WebSocket connection closed: ${event.code} - ${event.reason}`);
    };

    EventSubWS.onerror = (error) => {
        logToConsole(`WebSocket error: ${error.message}`);
    };
}

async function subscribeToEvent(sessionId, eventType, condition, version) {
    try {
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Client-ID': userClientId,
                'Authorization': userToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: eventType,
                version: version || "1",
                condition,
                transport: {
                    method: 'websocket',
                    session_id: sessionId
                }
            })
        });

        if (!response.ok) {
            logToConsole('Failed to subscribe to event');
            return;
        }

        const data = await response.json();

        logToConsole(`EVENTSUB SUBSCRIBED TO ${eventType}`.toUpperCase());

        logToConsole('Successfully subscribed to event:', data);

        topics.push(eventType);

        connection_topics.innerHTML = `Topics: ${topics.join(",")}`;

        if (data && data.status) {
            EventSubStatus = data.status
        }
    } catch (error) {
        logToConsole(`Failed to subscribe: ${error.message}`);
    }
}

connectionButton.addEventListener('click', () => {
    if (connectionButton.textContent === 'CONNECT') {
        connectionButton.textContent = 'CONNECTING';

        connectToEventSub();
    } else if (connectionButton.textContent === 'DISCONNECT') {
        connectionButton.textContent = 'DISCONNECTING';
        EventSubWS.close();
    }
});

subscribe_button.addEventListener('click', () => {
    if (!textarea.value || textarea.value == "") {
        return;
    }

    const conditions = JSON.parse(getConditionValues())
    
    console.log(conditions)
    
    if (Object.keys(conditions?.["condition"]).length === 0) { return; }

    subscribeToEvent(sessionId, textarea.value, conditions["condition"], conditions["version"]);
});

condition_add.addEventListener('click', addCondition);
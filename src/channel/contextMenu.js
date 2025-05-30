let contextMenu = {
    main: null,
    submenu: null,
    events: {},
    more_events: {}
}

let context_mouseX;
let context_mouseY;

document.addEventListener('contextmenu', e => {
    const target = e.target.closest('.message-text');
    const target_emote = e.target.closest('.emote-wrapper');

    clearContextMenu();

    const event_mouseX = e.clientX;
    const event_mouseY = e.clientY;

    if ((target || target_emote) && (event_mouseX !== context_mouseX || event_mouseY != context_mouseY)) {
        e.preventDefault();

        hideFrame();
    } else {
        context_mouseX = null;
        context_mouseY = null;

        return;
    }

    context_mouseX = e.clientX;
    context_mouseY = e.clientY;

    let menu_data = {};

    if (target_emote) {
        //handle emote context menu
        const children = Array.from(target_emote.children);

        menu_data = {
            more_menu: children.map(child => {
                const baseUrl = child.src.split('/').slice(0, -1).join('/');

                const disabledBaseUrls = ["https://static-cdn.jtvnw.net/", "https://cdn.jsdelivr.net/"];
                const sizes = disabledBaseUrls.some(url => baseUrl.includes(url)) ? ['1x'] : ['1x', '2x', '3x', '4x'];
                const open_map = sizes.map(size => ({
                    name: `Open ${size}`,
                    url: disabledBaseUrls.some(url => baseUrl.includes(url)) ? child.src : `${baseUrl}/${size}.avif`,
                    action: 'open_url',
                    nonce: generateNonce()
                }));

                const copy_map = sizes.map(size => ({
                    name: `Copy ${size}`,
                    url: disabledBaseUrls.some(url => baseUrl.includes(url)) ? child.src : `${baseUrl}/${size}.avif`,
                    action: 'copy_url',
                    nonce: generateNonce()
                }));

                let emote_buttons = [...open_map, ...copy_map];

                if (child.getAttribute("emote-link")) {
                    emote_buttons.push({
                        name: "Open Emote",
                        url: child.getAttribute("emote-link"),
                        action: 'open_url',
                        nonce: generateNonce()
                    });
                }

                return {
                    name: child.alt,
                    more_info: emote_buttons,
                    nonce: generateNonce()
                };
            })
        };
    } else if (!target && !target_emote) {
        return;
    }

    if (target) {
        menu_data["copy_message"] = {
            name: "Copy Message",
            action: "copy_message",
            message: target,
            nonce: generateNonce()
        }

        if (target?.closest('[message_id]')?.getAttribute("message_id") != "0") {
            menu_data["reply_message"] = {
                name: "Reply To Message",
                action: "reply_message",
                message: target,
                nonce: generateNonce()
            }
        }
    }

    if (!Object.keys(menu_data).length) { return; };

    //Generate the context menu
    const menu = document.createElement('div');
    contextMenu.main = menu;

    menu.id = 'context-menu';

    if (menu_data?.more_menu && Object.keys(menu_data?.more_menu).length) {
        const sub_menu = document.createElement('div');
        contextMenu.submenu = sub_menu;

        sub_menu.className = 'context-sub-menu';

        contextMenu.more_events = menu_data?.more_menu;

        menu.innerHTML += menu_data?.more_menu.map(item => `<div class="menu-item moreBtn" nonce="${item.nonce}">${item.name} &gt;</div>`).join('');

        document.body.appendChild(sub_menu);
        sub_menu.style.display = 'none';
    } else {
        contextMenu.submenu = null;
    }

    Object.entries(menu_data).forEach(([key, item]) => {
        if (key === 'more_menu') return;
        contextMenu.events[item.nonce] = item;
        menu.innerHTML += `<div class="menu-item menu-button" nonce="${item.nonce}">${item.name}</div>`;
    });

    document.body.appendChild(menu);

    //Set position of the context menu
    menu.style.display = 'flex';

    let frameWidth = menu.offsetWidth;
    let frameHeight = menu.offsetHeight;

    const maxX = window.innerWidth - frameWidth - 10;
    const maxY = window.innerHeight - frameHeight - 10;

    let adjustedX = event_mouseX + 10;
    let adjustedY = event_mouseY + 10;

    if (adjustedX > maxX) {
        adjustedX = maxX;
    }

    if (adjustedY > maxY) {
        adjustedY = maxY;
    }

    menu.style.left = adjustedX + 'px';
    menu.style.top = adjustedY + 'px';
    menu.style.display = 'flex';

    //Set position of the sub context menu
    if (contextMenu.submenu) {
        const moreBtns = menu.getElementsByClassName('moreBtn');
        for (let i = 0; i < moreBtns.length; i++) {
            const moreBtn = moreBtns[i];

            moreBtn.addEventListener('mouseenter', () => {
                const subMenu = contextMenu.submenu;
                const buttonNonce = moreBtn.getAttribute('nonce');
                const more_data = contextMenu.more_events.find(item => item.nonce === buttonNonce)?.more_info || [];

                subMenu.innerHTML = '';
                subMenu.style.display = 'none';

                subMenu.innerHTML += more_data?.map(item => `<div class="menu-item menu-button" nonce="${item.nonce}">${item.name}</div>`).join('');

                subMenu.style.display = 'flex';

                const btnRect = moreBtn.getBoundingClientRect();
                const subMenuWidth = subMenu.offsetWidth;
                const subMenuHeight = subMenu.offsetHeight;

                let subMenuX = btnRect.right + 10;
                let subMenuY = btnRect.top;

                if (subMenuX + subMenuWidth > window.innerWidth) {
                    subMenuX = btnRect.left - subMenuWidth - 10;
                }

                if (subMenuY + subMenuHeight > window.innerHeight) {
                    subMenuY = window.innerHeight - subMenuHeight - 10;
                }

                subMenu.style.left = subMenuX + 'px';
                subMenu.style.top = subMenuY + 'px';
            })
        }
    }
});

function handleMenuButtonClick(actionData) {
    switch (actionData.action) {
        case 'copy_message':
            if (!actionData?.message?.parentElement) { return; };

            const messageElement = actionData?.message?.parentElement;
            let sender = messageElement?.getAttribute("sender");

            let can_copy_name_wrappers = false;
            const messageContent = (typeof actionData.message === 'string' ? actionData.message :
                Array.from(actionData.message.childNodes).map(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent.replace(/\s+/g, ' ').trim();
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('emote-wrapper')) {
                        return Array.from(node.querySelectorAll('img')).map(img => img.alt).join(' ');
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('name-wrapper')) {
                        let name_wrapper_name = node?.getAttribute("tooltip-name");
                        if (name_wrapper_name) {
                            if (can_copy_name_wrappers || !sender) { 
                                return name_wrapper_name;
                            } else if (!can_copy_name_wrappers && sender) {
                                name_wrapper_name = name_wrapper_name.toLowerCase();
                                sender = sender.toLowerCase();

                                if (name_wrapper_name && name_wrapper_name == sender) {
                                    can_copy_name_wrappers = true;
                                }
                            }
                        }
                    }
                    return '';
                }).join(' ')
            );

            const fixedMessage = messageContent.replace(/\s+/g, ' ').trim();

            navigator.clipboard.writeText(fixedMessage)
                .catch(err => console.error('Failed to copy message:', err));
            break;
        case 'open_url':
            const url = actionData.url;
            if (url) {
                window.open(url, '_blank');
            } else {
                console.warn('No URL provided for action:', actionData.action);
            }
            break;
        case 'reply_message':
            const message = actionData.message;
            if (message) {
                const reply_button = message.querySelector('#reply-button-wrapper');
                if (reply_button) {
                    let onsubmitCode = reply_button.getAttribute('onsubmit');

                    onsubmitCode = onsubmitCode.replace(/return\s+false;\s*$/, '');

                    eval(onsubmitCode);
                }
            }
            break;
        case 'copy_url':
            navigator.clipboard.writeText(actionData.url)
                .catch(err => console.error('Failed to copy message:', err));
            break;
        default:
            console.warn('Unknown action:', actionData.action);
            break;
    }
}

document.addEventListener('click', (e) => {
    const target = e.target.closest('.menu-button');
    if (target) {
        const nonce = target.getAttribute('nonce');

        let actionData = contextMenu.events[nonce] ||
            contextMenu.more_events.find(item => item.nonce === nonce) ||
            contextMenu.more_events.flatMap(item => item.more_info || []).find(subItem => subItem.nonce === nonce);

        if (actionData) {
            handleMenuButtonClick(actionData);
        }
    }

    clearContextMenu();
});

function clearContextMenu() {
    contextMenu?.main?.remove();
    contextMenu?.submenu?.remove();

    contextMenu.main = null;
    contextMenu.submenu = null;
    contextMenu.events = {};
    contextMenu.more_events = {};
}
const CLIENT_ID = 'gz5gg29dnfwl0n2cai4w41bt1ai0yp';
const REDIRECT_URI = 'https://fiszh.github.io/YAUTC/';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

document.title = "YAUTC"

let is_dev_mode = false

const SCOPES = 'user:read:chat user:write:chat user:read:follows user:read:emotes user:read:blocked_users user:manage:blocked_users chat:read chat:edit channel:moderate whispers:read whispers:edit';

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let userClientId = '0'
let accessToken = getCookie('twitch_access_token');
let userToken = `Bearer ${accessToken}`

if (!accessToken) {
    userToken = undefined;
}

const authButton = document.getElementById('topbar-button0');

const logoLink = document.getElementById('logo-link');
if (logoLink) {
    logoLink.href = `${window.location.protocol}//${window.location.host}/YAUTC/`;
}

async function loadConfigFile() {
    if (document.location.href.startsWith('https://fiszh.github.io/YAUTC')) { return; }
    //return;
    try {
        const adress = window.location.href.match(/\d+\.\d+\.\d+\.\d+/);
        if (!adress[0]) { return; }
        
        is_dev_mode = true;
        const response = await fetch(`http://${adress[0]}:3001/config`);
        const jsonData = await response.json();

        userClientId = jsonData.clientId;
        accessToken = jsonData.accessToken;
        userToken = `Bearer ${accessToken}`

        //console.log("Client ID:", userClientId);
        //console.log("Access Token:", accessToken);
        //console.log("User Token:", userToken);
    } catch (error) {
        console.error('Error fetching or parsing JSON file:', error);
    }
}

loadConfigFile()

async function handleToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        try {
            setCookie('twitch_access_token', accessToken, 60);
            setCookie('twitch_client_id', CLIENT_ID, 60);

            const authButton = document.getElementById('topbar-button0');

            if (authButton) {
                authButton.textContent = 'Logout';
            }

            const userDataResponse = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CLIENT_ID
                }
            });

            if (userDataResponse.ok) {
                const userData = await userDataResponse.json();
                console.log('User Data:', userData);

                const redirectTo = getCookie('redirect_after_login') || REDIRECT_URI;
                window.location.href = redirectTo;
                deleteCookie('redirect_after_login');
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error processing access token:', error);
        }
    }
}

if (window.location.hash) {
    handleToken();
}

async function checkLoginStatus() {
    const accessToken = getCookie('twitch_access_token');
    const authButton = document.getElementById('topbar-button0');

    if (accessToken) {
        try {
            const response = await fetch('https://id.twitch.tv/oauth2/validate', {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Error validating your accessToken');
            }

            const data = await response.json();

            const requiredScopes = SCOPES.split(' ');

            const hasAllScopes = requiredScopes.every(scope => data.scopes.includes(scope));

            if (!hasAllScopes) {
                deleteCookie('twitch_access_token');
                deleteCookie('twitch_client_id');
                authButton.textContent = 'Login';

                const imgElement = document.querySelector('.user_avatar');

                imgElement.src = "imgs/user_avatar.png"

                const missingScopes = requiredScopes.filter(scope => !data.scopes.includes(scope));
                alert(`Missing scopes: ${missingScopes.join(', ')}. Please log in again.`);
            } else {
                authButton.textContent = 'Logout';
            }
        } catch (error) {
            console.error('Error checking login status:', error.message);
        }
    } else {
        authButton.textContent = 'Login';

        if (is_dev_mode) {
            authButton.textContent = 'DevMode';
        }

        const imgElement = document.querySelector('.user_avatar');

        imgElement.src = "imgs/user_avatar.png"
    }
}

checkLoginStatus();

if (authButton) {
    authButton.addEventListener('click', async () => {
        const accessToken = getCookie('twitch_access_token');
        if (accessToken) {
            deleteCookie('twitch_access_token');
            deleteCookie('twitch_client_id');
            authButton.textContent = 'Login';
    
            const imgElement = document.querySelector('.user_avatar');
    
            imgElement.src = "imgs/user_avatar.png"
        } else {
            await setCookie('redirect_after_login', window.location.href, 1);
    
            const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
            window.location = authUrl;
        }
    });
}

// BLOCK OPERA GX USERS
const isOpera = navigator.userAgent.includes('OPR/')

if (isOpera) {
    console.log('Opera detected. Redirecting...');
    window.location.href = 'https://spyware.neocities.org/articles/opera';
}

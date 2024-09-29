const CLIENT_ID = 'gz5gg29dnfwl0n2cai4w41bt1ai0yp';
const REDIRECT_URI = 'https://fiszh.github.io/YAUTC/';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

const SCOPES = 'user:write:chat user:read:follows user:read:emotes user:read:blocked_users user:manage:blocked_users';

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

const accessToken = getCookie('twitch_access_token');
const authButton = document.getElementById('topbar-button0');

async function handleToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        try {
            setCookie('twitch_access_token', accessToken, 1);
            setCookie('twitch_client_id', CLIENT_ID, 1); 

            const authButton = document.getElementById('topbar-button0');
            alert('Log in successfull!');
            authButton.textContent = 'Logout';

            const userDataResponse = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CLIENT_ID
                }
            });

            if (userDataResponse.ok) {
                const userData = await userDataResponse.json();
                console.log('User Data:', userData);
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error('Error processing access token:', error.message);
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
                alert('Missing some required scopes, please log in again');
                authButton.textContent = 'Login with Twitch';
            } else {
                authButton.textContent = 'Logout';
            }
        } catch (error) {
            console.error('Error checking login status:', error.message);
        }
    } else {
        authButton.textContent = 'Login with Twitch';
    }
}

checkLoginStatus();

authButton.addEventListener('click', async () => {
    const accessToken = getCookie('twitch_access_token');
    if (accessToken) {
        deleteCookie('twitch_access_token');
        deleteCookie('twitch_client_id');
        alert('Logged out successfully!');
        authButton.textContent = 'Login with Twitch';
    } else {
        const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
        window.location = authUrl;
    }
});

// BLOCK OPERA GX USERS
const isOpera = navigator.userAgent.includes('OPR/')

if (isOpera) {
    console.log('Opera detected. Redirecting...');
    window.location.href = 'https://spyware.neocities.org/articles/opera';
}

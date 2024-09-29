const CLIENT_ID = 'gz5gg29dnfwl0n2cai4w41bt1ai0yp';
const REDIRECT_URI = 'https://fiszh.github.io/YAUTC/';
const AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

const SCOPES = 'user:write:chat user:read:follows user:read:emotes user:read:blocked_users user:manage:blocked_users';

// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
}

// Function to delete a cookie
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Check if the user is logged in
const accessToken = getCookie('twitch_access_token');
const authButton = document.getElementById('topbar-button0');

// Async function to check if the user is logged in
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

            // Check if all requiredScopes are present in the response scopes array
            const hasAllScopes = requiredScopes.every(scope => data.scopes.includes(scope));

            if (!hasAllScopes) {
                deleteCookie('twitch_access_token');
                deleteCookie('twitch_client_id');
                alert('Missing some required scopes, please log in again');
                window.location.reload();
                authButton.textContent = 'Login with Twitch'; // Update button text
            } else {
                authButton.textContent = 'Logout'; // Show "Logout" if logged in
            }
        } catch (error) {
            console.error('Error checking login status:', error.message);
        }
    } else {
        authButton.textContent = 'Login with Twitch'; // Show "Login" if not logged in
    }
}

// Call the async function to check login status
checkLoginStatus();

// Handle button click for login/logout
authButton.addEventListener('click', async () => {
    const accessToken = getCookie('twitch_access_token');
    if (accessToken) {
        // Logout logic
        deleteCookie('twitch_access_token');
        deleteCookie('twitch_client_id');
        alert('Logged out successfully!');
        window.location.reload();
        authButton.textContent = 'Login with Twitch'; // Update button text
    } else {
        // Login logic
        const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=${encodeURIComponent(SCOPES)}`;
        window.location = authUrl; // Redirect to Twitch login
    }
});

// Handle the token returned in the URL hash
if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        try {
            // Store the access token and client ID in cookies
            setCookie('twitch_access_token', accessToken, 1); // Expires in 1 day
            setCookie('twitch_client_id', CLIENT_ID, 1); // Store client ID

            authButton.textContent = 'Logout'; // Update button text after successful login

            // Optionally, make API requests to Twitch with the token
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

// BLOCK OPERA GX USERS
const isOpera = navigator.userAgent.includes('OPR/')

if (isOpera) {
    console.log('Opera detected. Redirecting...');
    window.location.href = 'https://spyware.neocities.org/articles/opera';
}

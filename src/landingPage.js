const routesPath = 'pages/sites.json';
const validPaths = ["/YAUTC/", "/YAUTC"];
let latestURL;
let siteChanged = false;

async function getPage() {
    if (latestURL !== window.location.href) {
        if (siteChanged) {
            window.location.reload();
        }

        siteChanged = true;

        latestURL = window.location.href;
    } else {
        return;
    }

    const path = window.location.pathname;
    const hash = window.location.hash.slice(1);

    let page;

    try {
        const response = await fetch(routesPath);
        if (!response.ok) throw new Error('Network response was not ok');

        const routes = await response.json();

        if (validPaths.some(validPath => path === validPath) && !hash) {
            page = routes["/YAUTC/"];
        } else if (hash) {
            page = routes["*"];
        } else {
            page = routes["404"];
        }

        console.log(`Load ${page}`);

        await loadAndReplaceHTML(page);
    } catch (error) {
        console.error('Error fetching or processing JSON:', error);
    }
}

async function loadAndReplaceHTML(url) {
    console.log("Loading HTML from:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        document.body.innerHTML = '';

        clearHeadAndLoad(doc.head);

        const newTitle = doc.querySelector('title');
        if (newTitle) {
            document.title = newTitle.textContent;
        }

        const bodyElements = Array.from(doc.body.children);
        await loadBodyElements(bodyElements);

        const metaTag = document.createElement('meta');
        metaTag.name = 'darkreader-lock';
        document.head.appendChild(metaTag);
        
        console.log("HTML loaded and replaced successfully.");
    } catch (error) {
        console.error('Error loading HTML:', error);
    }
}

function clearHeadAndLoad(newHead) {
    document.head.innerHTML = '';

    Array.from(newHead.children).forEach(element => {
        if (element.tagName === 'LINK' && element.rel === 'icon') {
            loadFavicon(element);
        } else if (element.tagName === 'SCRIPT') {
            loadScript(element);
        } else if (element.tagName === 'LINK' && element.rel === 'stylesheet') {
            loadStylesheet(element);
        }
    });
}

async function loadBodyElements(elements) {
    for (const element of elements) {
        if (element.tagName === 'SCRIPT') {
            await loadScript(element);
        } else {
            document.body.appendChild(element.cloneNode(true));
        }
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = "https://player.twitch.tv/js/embed/v1.js";
    document.head.appendChild(script);

    const twitchEmbed = document.getElementById('twitch-embed');
    
    if (twitchEmbed) {
        initializeTwitchPlayer();
    } else {
        console.log('#twitch-embed does not exist.');
    }
}

function loadScript(scriptElement) {
    return new Promise((resolve, reject) => {
        const newScript = document.createElement('script');
        if (scriptElement.src) {
            newScript.src = scriptElement.src;
            newScript.defer = true;
            newScript.onload = () => {
                resolve();
            };
            newScript.onerror = () => {
                reject(new Error(`Script load error for ${scriptElement.src}`));
            };
        } else {
            newScript.textContent = scriptElement.textContent;
            resolve();
        }
        const existingScripts = document.querySelectorAll('script');
        existingScripts.forEach(script => {
            script.remove();
        });
        document.body.appendChild(newScript);
    });
}

function loadStylesheet(linkElement) {
    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = linkElement.href;
    document.head.appendChild(newLink);
}

function loadFavicon(iconElement) {
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = iconElement.href;
    newFavicon.type = iconElement.type;
    document.head.appendChild(newFavicon);
}

function initializeTwitchPlayer(retryCount = 3, delay = 1000) {
    try {
        var input = window.location.href.split('/');
        var chnl = input[input.length - 1] || "uni1g";

        document.title = chnl + " - YAUTC";

        const twitchEmbed = document.getElementById('twitch-embed');

        twitchEmbed.innerHTML = ''

        new Twitch.Player("twitch-embed", {
            width: "100%",
            height: "100%",
            channel: chnl,
            muted: false,
            quality: "1080p60",
            theme: "dark",
            layout: "video",
            parent: ["fiszh.github.io"],
        });
    } catch (error) {
        console.log(`Error initializing Twitch Player, retrying (${retryCount})`);

        const twitchEmbed = document.getElementById('twitch-embed');

        twitchEmbed.innerHTML = "Refresh if you don't see the player."

        if (retryCount > 0) {
            setTimeout(() => {
                initializeTwitchPlayer(retryCount - 1, delay);
            }, delay);
        } else {
            console.error("Failed to initialize Twitch Player after multiple attempts.");
        }
    }
}

getPage();

setInterval(() => {
    getPage();
}, 100);
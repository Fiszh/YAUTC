let routesPath = 'pages/sites.json';
let latestURL;
let siteChanged = false;
let emojiDatasource = null;
const isOnMobile = false || isMobile();

function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function getMatchingPage(sortedRoutes) {
    let most_matching = {
        "name": "404",
        "path": "404.html",
        "points": 0
    };

    const currentUrl = window.location.href;
    const path = currentUrl.replace(window.location.origin, '');

    for (const [pattern, file] of Object.entries(sortedRoutes)) {
        if (pattern === '404') { continue; };

        const patternSplit = pattern.split("/").filter(Boolean);
        const currentPathSplit = path.split("/").filter(Boolean);

        if (patternSplit.length !== currentPathSplit.length) { continue; };

        let current_matching_points = 0;

        for (const [index, patternPart] of patternSplit.entries()) {
            if (currentPathSplit?.[index] && patternPart && ((patternPart === currentPathSplit?.[index] || patternPart == "*") || ((patternPart !== "*" && patternPart.endsWith("*")) && currentPathSplit[index].startsWith(patternPart.replace("*", ""))))) {
                current_matching_points += 1;
            } else {
                break;
            }
        }

        if (patternSplit.length === current_matching_points && most_matching.points < current_matching_points) {
            most_matching.name = pattern;
            most_matching.path = file;
            most_matching.points = current_matching_points;
        }
    }

    return most_matching;
}

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

    try {
        const response = await fetch(routesPath);
        if (!response.ok) throw new Error('Network response was not ok');

        const routes = await response.json();

        const sortedMainRoutes = Object.fromEntries(
            Object.entries(routes["main"]).sort((a, b) => a[0].length - b[0].length)
        );

        const sortedMobileRoutes = Object.fromEntries(
            Object.entries(routes["mobile"]).sort((a, b) => a[0].length - b[0].length)
        );

        most_matching = {
            "name": "404",
            "path": "404.html",
            "points": 0
        }

        if (isOnMobile) {
            document.body.innerHTML = "Loading mobile...";

            most_matching = await getMatchingPage(sortedMobileRoutes);
        }

        if (most_matching.name.includes("404")) {
            most_matching = await getMatchingPage(sortedMainRoutes);
        }

        console.log(`Load ${most_matching.name} from the file: ${most_matching.path}`);
        await loadAndReplaceHTML(most_matching.path);
    } catch (error) {
        console.error('Error fetching or processing JSON:', error);
    }
}

async function loadAndReplaceHTML(url) {
    console.log("Loading HTML from:", url);
    try {
        const transition_style = document.createElement('style');
        transition_style.innerHTML = `* { transition: all 0.15s; }`;
        document.head.appendChild(transition_style);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const htmlContent = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const newBodyContent = doc.body.innerHTML;
        if (newBodyContent) {
            document.body.innerHTML = '';
            document.body.innerHTML = newBodyContent;
        }

        replaceHeadContent(doc.head);

        await executeScripts(doc);

        const newTitle = doc.querySelector('title');
        if (newTitle) {
            document.title = newTitle.textContent;
        }

        const favicon = doc.querySelector('link[rel="icon"]');
        if (favicon) {
            loadFavicon(favicon);
        }

        const metaTag = document.createElement('meta');
        metaTag.name = 'darkreader-lock';
        document.head.appendChild(metaTag);

        const script = document.createElement('script');
        script.src = "https://player.twitch.tv/js/embed/v1.js";
        document.head.appendChild(script);

        const twemojiScript = document.createElement('script');
        twemojiScript.src = "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js";
        twemojiScript.crossOrigin = "anonymous";
        document.head.appendChild(twemojiScript);

        const emojiDatasourceScript = document.createElement('script');
        emojiDatasourceScript.type = 'module';
        emojiDatasourceScript.src = 'https://cdn.jsdelivr.net/npm/emoji-datasource/+esm';
        document.body.appendChild(emojiDatasourceScript);

        emojiDatasourceScript.onload = () => {
            import('https://cdn.jsdelivr.net/npm/emoji-datasource/+esm')
                .then((module) => {
                    emojiDatasource = module["default"];
                    console.log('Emoji datasource loaded!');
                })
                .catch((error) => {
                    console.error('Error loading the emoji datasource module:', error);
                });
        };

        console.log("HTML loaded and replaced successfully.");
    } catch (error) {
        console.error('Error loading HTML:', error);
    }

    initializeTwitchPlayer();
}

function replaceHeadContent(newHead) {
    const head = document.head;

    head.innerHTML = '';

    const elements = Array.from(newHead.children);
    elements.forEach(element => {
        if (element.tagName.toLowerCase() === 'script') {
            executeScript(element);
        } else {
            head.appendChild(element);
        }
    });
}

async function executeScripts(doc) {
    const scripts = Array.from(doc.querySelectorAll('script'));

    for (const script of scripts) {
        await executeScript(script);
    }
}

async function executeScript(script) {
    if (script.src) {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.defer = true;

        newScript.onload = () => {
            console.log(`External script loaded: ${script.src}`);
            newScript.remove();
        };
        newScript.onerror = (error) => console.error(`Failed to load script: ${script.src}`, error);

        document.head.appendChild(newScript);

        await new Promise((resolve, reject) => {
            newScript.onload = resolve;
            newScript.onerror = reject;
        });
    } else {
        eval(script.textContent);
    }

    removeAllScripts();
}

function loadFavicon(iconElement) {
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = iconElement.href;
    newFavicon.type = iconElement.type;
    document.head.appendChild(newFavicon);
}

function removeAllScripts() {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        script.remove();
    });
}

function initializeTwitchPlayer(retryCount = 5, delay = 1000) {
    try {
        var input = window.location.href.split('/');
        var chnl = input[input.length - 1] || "twitch";

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
        console.error(error.message)
        console.log(`Error initializing Twitch Player, retrying (${retryCount})`);

        const twitchEmbed = document.getElementById('twitch-embed');

        if (twitchEmbed) {
            twitchEmbed.innerHTML = `Refresh if you don't see the player. (retries left: ${retryCount})`
        }

        if (retryCount <= 3 && error.message.toLowerCase().includes("twitch.player is not a constructor")) {
            const script = document.createElement('script');
            script.src = "https://player.twitch.tv/js/embed/v1.js";
            document.head.appendChild(script);
        }

        if (retryCount > 0) {
            setTimeout(() => {
                initializeTwitchPlayer(retryCount - 1, delay);
            }, delay);
        } else {
            console.error("Failed to initialize Twitch Player after multiple attempts.");
        }
    }
}

// Initial page load
getPage();

// Re-check the page every 100ms
setInterval(() => {
    getPage();
}, 100);

if (document.location.pathname !== '/YAUTC/' && !document.location.pathname.endsWith('/')) {
    const infoElements = document.getElementsByClassName('information');

    if (infoElements.length > 0) {
        infoElements[0].innerHTML = "(404) <br> Recently, the format was changed from /channel_name to #/channel_name";

        if (window.location.href) {
            let newUrl = window.location.href.replace(/\/([^\/]+)$/, "/#/$1");
    
            if (newUrl) {
                infoElements[0].innerHTML = `<a href="${newUrl}" style="color: white; text-decoration: none;" target="_blank">(404) <br> Recently, the format was changed from /channel_name to #/channel_name, click this text to go to the right link.</a>`;
            }
        }
    }
}
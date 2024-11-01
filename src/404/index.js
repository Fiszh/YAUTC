const path = document.location.pathname

console.log(path)
console.log(path !== '/YAUTC/')
console.log(!path.endsWith('/'))

if (path !== '/YAUTC/' && !path.endsWith('/')) {
    const infoElements = document.getElementsByClassName('information');
    console.log(infoElements)
    if (infoElements.length > 0) {
        infoElements[0].innerHTML = "(404) <br> Recently, the format was changed from /channel_name to #/channel_name";
    }
}
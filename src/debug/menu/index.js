const contentDiv = document.querySelector('.content');

document.title = "YAUTC - Debugger Menu";

const debug_options = [
    "eventsub"
]

if (contentDiv) {
    debug_options.forEach(option => {
        const newLink = document.createElement('a');

        newLink.href = `${window.location.protocol}//${window.location.host}/YAUTC/#/debug/${option}`;
        newLink.textContent = option;
        newLink.style.color = 'white';
        newLink.style.textDecoration = 'none';

        newLink.style.transition = 'color 0.15s ease';

        newLink.addEventListener('mouseover', () => {
            newLink.style.color = 'gray';
        });

        newLink.addEventListener('mouseout', () => {
            newLink.style.color = 'white';
        });

        contentDiv.appendChild(newLink);
    });

    const button = document.createElement("button");
    button.innerHTML = "Got here by accident?<br>Click me to go back.";

    button.style.color = "white";
    button.style.backgroundColor = "transparent";
    button.style.marginTop = "60px"
    button.style.border = "none";
    button.style.fontSize = "30px";
    button.style.cursor = "pointer";  

    button.addEventListener('mouseover', () => {
        button.style.color = 'gray';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.color = 'white';
    });

    contentDiv.appendChild(document.createElement("br"));

    button.addEventListener("click", function() {
        window.history.back();
    });
    
    contentDiv.appendChild(button);
}
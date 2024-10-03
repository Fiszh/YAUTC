const frame = document.getElementById('frame');
const frameImg = document.getElementById('frame-img');
const frameName = document.getElementById('tooltip-name');
const frameType = document.getElementById('tooltip-type');
const frameCreator = document.getElementById('tooltip-creator');

const selectors = [
    '.emote-wrapper',
    '.name-wrapper',
    '.badge-wrapper',
    '.followed-stream'
];

function updateFramePosition(mouseX, mouseY) {
    const frameWidth = frame.offsetWidth;
    const frameHeight = frame.offsetHeight;
    
    const maxX = window.innerWidth - frameWidth - 10;
    const maxY = window.innerHeight - frameHeight - 10;
    
    let adjustedX = mouseX + 10;
    let adjustedY = mouseY + 10;
    
    if (adjustedX > maxX) {
        adjustedX = maxX;
    }
    
    if (adjustedY > maxY) {
        adjustedY = maxY;
    }
    
    frame.style.left = adjustedX + 'px';
    frame.style.top = adjustedY + 'px';
}

function showFrame(imgSrc, tooltipName, tooltipType, tooltipCreator) {
    frameImg.src = imgSrc;

    if (imgSrc) {
        frameImg.style.display = "block";
    } else {
        frameImg.style.display = "none";
    }

    frameName.textContent = tooltipName;

    if (tooltipType) {
        frameType.textContent = tooltipType;
    } else {
        frameType.textContent = '';
    }

    if (tooltipCreator) {
        frameCreator.textContent = tooltipCreator;
    } else {
        frameCreator.textContent = '';
    }
 
    frame.style.display = 'block';
}

function hideFrame() {
    frame.style.display = 'none';
}

document.addEventListener('mousemove', (event) => {
    if (frame.style.display === 'block') {
        updateFramePosition(event.clientX, event.clientY);
    }
});

document.addEventListener('mouseover', (event) => {
    const target = selectors
        .map(selector => event.target.closest(selector))
        .find(element => element !== null);

    if (target) {
        const img = target.querySelector('img');
        const imgSrc = target.getAttribute('tooltip-image') || (img ? img.src : null);

        const tooltipName = target.getAttribute('tooltip-name') || '';
        const tooltipType = target.getAttribute('tooltip-type') || '';
        const tooltipCreator = target.getAttribute('tooltip-creator') || '';

        showFrame(imgSrc, tooltipName, tooltipType, tooltipCreator);
    } else {
        hideFrame();
    }
});

hideFrame();

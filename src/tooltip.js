const frame = document.getElementById('frame');
const frameTitle = document.getElementById('tooltip-title');
const frameImg = document.getElementById('frame-img');
const frameName = document.getElementById('tooltip-name');
const frameType = document.getElementById('tooltip-type');
const frameCreator = document.getElementById('tooltip-creator');

const selectors = [
    '.emote-wrapper',
    '.name-wrapper',
    '.badge-wrapper',
    '.followed-stream',
    '.debug-tile'
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

function showFrame(tooltipData) {
    if (tooltipData.imgSrc) {
        frameImg.src = tooltipData.imgSrc + '?t=' + new Date().getTime();
    }
    
    if (tooltipData.imgSrc) {
        frameImg.style.display = "block";
    } else {
        frameImg.style.display = "none";
    }

    frameName.textContent = tooltipData.tooltipName;

    if (tooltipData.tooltipType) {
        frameType.textContent = tooltipData.tooltipType;
    } else {
        frameType.textContent = '';
    }

    if (tooltipData.tooltipCreator) {
        frameCreator.textContent = tooltipData.tooltipCreator;
    } else {
        frameCreator.textContent = '';
    }

    if (tooltipData.tooltipTitle) {
        frameTitle.textContent = tooltipData.tooltipTitle;
    } else {
        frameTitle.textContent = '';
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

        const tooltipData = {
            imgSrc: target.getAttribute('tooltip-image') || (img ? img.src : null),

            tooltipName: target.getAttribute('tooltip-name') || '',
            tooltipType: target.getAttribute('tooltip-type') || '',
            tooltipCreator: target.getAttribute('tooltip-creator') || '',
            tooltipTitle: target.getAttribute('tooltip-title') || '',
        }

        showFrame(tooltipData);
    } else {
        hideFrame();
    }
});

hideFrame();

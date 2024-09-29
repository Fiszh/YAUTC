const frame = document.getElementById('frame');
const frameImg = document.getElementById('frame-img');
const frameText = document.getElementById('frame-text');
const emoteContainer = document.getElementById('ChatDisplay');

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

function showFrame(imgSrc, text) {
    frameImg.src = imgSrc;
    frameText.textContent = text;
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
    const emote = event.target.closest('.emote-wrapper');
    const name = event.target.closest('.name-wrapper');
    const badge = event.target.closest('.badge-wrapper');

    if (emote) {
        const img = emote.querySelector('img');
        const imgSrc = img ? img.src : '';
        const text = emote.getAttribute('data-text') || '';
        showFrame(imgSrc, text);
    } else if (name) {
        const strongElement = name.querySelector('strong');
        if (strongElement) {
            const altText = strongElement.getAttribute('data-alt') || 'default-image-url';
            
            const text = strongElement.textContent.replace(':', '').trim();
            showFrame(altText, text);
        }
    } else if (badge) {
        const img = badge.querySelector('img');
        let imgSrc = '';
        let altText = '';
        
        if (img) {
            imgSrc = img.src;
            altText = img.alt;
        }
        
        showFrame(imgSrc, altText);
    } else {
        hideFrame();
    }
});

emoteContainer.addEventListener('mouseout', (event) => {
    const emote = event.target.closest('.emote-wrapper');
    const name = event.target.closest('.name-wrapper');

    if (emote || name) {
        hideFrame();
    }
});

hideFrame();
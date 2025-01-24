const imageFiles = [
    'edh-188.jpg', 'dba-257.jpg', 'dde-336.jpg', 'dfa-254.jpg', 'dfa-512.png',
    'dim-554.jpg', 'dlf-423.jpg', 'dlm-941.jpg', 'dma-720.jpg', 'dmc-107.jpg',
    'dta-628.png', 'dzh-295.jpg', 'ecr-705.jpg', 'ege-583.jpg', 'egw-965.jpg',
    'ekn-962.jpg', 'ela-326.jpg', 'emi-459.jpg', 'eps-603.jpg', 'lak-242.jpg'
];

// Add currentIndex variable to track position
let currentFullscreenIndex = -1;

// Add state variable for slider visibility
let sliderVisible = true;
let showingFirst = true;  // Add this

// Add state variable for showing full names
let showFullNames = false;

// Add state variable for showing initials
let showInitials = false;

// Add this function near the top of the file, after imageFiles declaration
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadImages() {
    const container = document.getElementById('imageContainer');
    
    // Shuffle the images array before creating cards
    const shuffledImages = [...imageFiles];  // Create a copy to avoid modifying original
    shuffleArray(shuffledImages);
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-text">LOADING</div>';
    document.body.appendChild(loadingOverlay);

    // Setup overlay for fullscreen
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    // Track loading progress
    let loadedImages = 0;
    const totalImages = shuffledImages.length;
    
    const checkAllLoaded = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 300);
        }
    };

    // Create and load all images
    shuffledImages.forEach(filename => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.draggable = true;
        
        const fullName = filename.split('.')[0];  // e.g. "edh-188"
        const numberOnly = fullName.substring(4);  // e.g. "188"
        
        // Preload image
        const img = new Image();
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
        img.src = `M45/${filename}`;
        
        card.innerHTML = `
            <img src="M45/${filename}" alt="Image ${filename}" draggable="false">
            <div class="filename" data-full-name="${fullName}">${numberOnly}</div>
        `;

        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('click', (e) => {
            if (!card.classList.contains('dragging')) {
                toggleFullscreen(card, overlay);
            }
        });
        
        container.appendChild(card);
    });

    // Add rankings after all images are loaded
    updateRankings();

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    // Add save button
    const saveButton = document.createElement('div');
    saveButton.className = 'save-button';
    saveButton.textContent = 'Save Rankings';
    saveButton.addEventListener('click', saveScreenshot);
    document.body.appendChild(saveButton);
}

function toggleFullscreen(card, overlay, forceIndex = null) {
    if (overlay.classList.contains('active')) {
        // Exit fullscreen
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.innerHTML = '';
            currentFullscreenIndex = -1;
        }, 200);
    } else {
        // Enter fullscreen
        if (forceIndex !== null) {
            currentFullscreenIndex = forceIndex;
        } else {
            // Find index of clicked card
            const cards = [...document.querySelectorAll('.image-card')];
            currentFullscreenIndex = cards.indexOf(card);
        }
        showFullscreenImage(currentFullscreenIndex, overlay);
    }
}

function showFullscreenImage(index, overlay) {
    const cards = [...document.querySelectorAll('.image-card')];
    const card = cards[index];
    const nextCard = cards[(index + 1) % cards.length];
    const img = card.querySelector('img');
    const nextImg = nextCard.querySelector('img');
    const numberEl = card.querySelector('.filename');
    const nextNumberEl = nextCard.querySelector('.filename');
    const number = showFullNames ? numberEl.dataset.fullName : numberEl.dataset.fullName.substring(4);
    const nextNumber = showFullNames ? nextNumberEl.dataset.fullName : nextNumberEl.dataset.fullName.substring(4);
    
    // Get initials from the full names
    const initials = numberEl.dataset.fullName.substring(0, 3);
    const nextInitials = nextNumberEl.dataset.fullName.substring(0, 3);
    
    overlay.innerHTML = `
        <div class="comparison-container">
            <div style="position: relative; width: 100%; height: 100%; display: flex; justify-content: center;">
                <img src="${nextImg.src}" class="comparison-image-right" alt="Next image">
                <div class="comparison-image-left">
                    <img src="${img.src}" alt="Current image">
                </div>
                <div class="comparison-slider"></div>
            </div>
            <div class="fullscreen-labels-left">
                <span class="fullscreen-number ${!sliderVisible && showingFirst ? 'active' : ''}">${number}</span>
                <span class="fullscreen-ranking">#${index + 1}</span>
                ${showInitials ? `<span class="fullscreen-initials">${initials}</span>` : ''}
            </div>
            <div class="fullscreen-labels-right">
                <span class="fullscreen-number ${!sliderVisible && !showingFirst ? 'active' : ''}">${nextNumber}</span>
                <span class="fullscreen-ranking">#${(index + 2) > cards.length ? 1 : index + 2}</span>
                ${showInitials ? `<span class="fullscreen-initials">${nextInitials}</span>` : ''}
            </div>
            <div class="help-text">
                x = blink<br>
                z = slider<br>
                n = initials
            </div>
        </div>
    `;
    overlay.classList.add('active');

    const slider = overlay.querySelector('.comparison-slider');
    const leftSide = overlay.querySelector('.comparison-image-left');
    let isResizing = false;

    slider.addEventListener('mousedown', (e) => {
        isResizing = true;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const container = overlay.querySelector('.comparison-container');
        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        
        leftSide.style.width = `${percent}%`;
        slider.style.left = `${percent}%`;
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
    });

    // Maintain current mode
    if (!sliderVisible) {
        slider.classList.add('hidden');
        leftSide.style.width = showingFirst ? '100%' : '0%';
    }
}

// Modify handleDragStart to prevent dragging in fullscreen
function handleDragStart(e) {
    if (e.target.classList.contains('fullscreen')) {
        e.preventDefault();
        return;
    }
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const container = document.getElementById('imageContainer');
    const draggable = container.querySelector('.dragging');
    const siblings = [...container.querySelectorAll('.image-card:not(.dragging)')];
    
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        const horizontalCenter = box.x + box.width / 2;
        const verticalCenter = box.y + box.height / 2;
        
        return e.clientX < horizontalCenter && e.clientY < verticalCenter;
    });
    
    if (nextSibling) {
        container.insertBefore(draggable, nextSibling);
    } else {
        container.appendChild(draggable);
    }
    
    // Update rankings after drag
    updateRankings();
}

function handleDrop(e) {
    e.preventDefault();
}

// Modify the keydown handler
document.addEventListener('keydown', (e) => {
    const overlay = document.querySelector('.overlay');
    if (!overlay.classList.contains('active')) return;

    const cards = [...document.querySelectorAll('.image-card')];
    const totalImages = cards.length;
    const leftSide = overlay.querySelector('.comparison-image-left');
    const slider = overlay.querySelector('.comparison-slider');

    switch (e.key) {
        case ' ':  // Space key
            e.preventDefault();
            toggleFullscreen(null, overlay);
            break;
        case 'Escape':
            toggleFullscreen(null, overlay);
            break;
        case 'x':
            e.preventDefault();
            if (sliderVisible) {
                slider.classList.add('hidden');
                sliderVisible = false;
            }
            showingFirst = !showingFirst;
            leftSide.style.width = showingFirst ? '100%' : '0%';
            // Update active states
            overlay.querySelector('.fullscreen-labels-left .fullscreen-number').classList.toggle('active', showingFirst);
            overlay.querySelector('.fullscreen-labels-right .fullscreen-number').classList.toggle('active', !showingFirst);
            break;
        case 'z':
            e.preventDefault();
            if (!sliderVisible) {
                slider.classList.remove('hidden');
                sliderVisible = true;
                leftSide.style.width = '50%';
                slider.style.left = '50%';
            }
            break;
        case 'ArrowRight':
            currentFullscreenIndex = (currentFullscreenIndex + 1) % totalImages;
            showFullscreenImage(currentFullscreenIndex, overlay);
            break;
        case 'ArrowLeft':
            currentFullscreenIndex = (currentFullscreenIndex - 1 + totalImages) % totalImages;
            showFullscreenImage(currentFullscreenIndex, overlay);
            break;
        case 'n':
            e.preventDefault();
            showInitials = !showInitials;
            // Update fullscreen view if active
            if (overlay.classList.contains('active')) {
                showFullscreenImage(currentFullscreenIndex, overlay);
            }
            break;
    }
});

function updateRankings() {
    const cards = [...document.querySelectorAll('.image-card')];
    cards.forEach((card, index) => {
        // Remove existing ranking if present
        const existingRanking = card.querySelector('.ranking');
        if (existingRanking) {
            existingRanking.remove();
        }
        
        // Add new ranking
        const ranking = document.createElement('div');
        ranking.className = 'ranking';
        ranking.textContent = `#${index + 1}`;
        card.appendChild(ranking);
    });
}

function saveScreenshot() {
    // First save the image as before
    html2canvas(document.getElementById('imageContainer')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'rankings.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Create the rankings text and copy to clipboard
    const cards = [...document.querySelectorAll('.image-card')];
    let rankingsText = cards.map(card => {
        const fullName = card.querySelector('.filename').dataset.fullName;
        return fullName;
    }).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(rankingsText)
        .then(() => {
            const notification = document.createElement('div');
            notification.textContent = 'Rankings copied to clipboard!';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2000);
        })
        .catch(err => console.error('Failed to copy text: ', err));
}

window.addEventListener('load', loadImages); 
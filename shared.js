// Shared module for drag-and-drop, fullscreen comparison, and ranking functionality

// Global state variables
window.currentFullscreenIndex = -1;
window.sliderVisible = true;
window.showingFirst = true;
window.showFullNames = false;
window.showInitials = false;
window.currentObjectConfig = null;

// Initialize student mode settings
if (window.isStudentMode) {
    window.showInitials = false; // Never show initials in student mode
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load images for a given object configuration
window.loadImages = async function(objectConfig) {
    if (!objectConfig) {
        console.error('No object configuration provided');
        return;
    }
    
    window.currentObjectConfig = objectConfig;
    const container = document.getElementById('imageContainer');
    
    // Shuffle the images array before creating cards
    const shuffledImages = [...objectConfig.images];
    shuffleArray(shuffledImages);
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-text">LOADING</div>';
    document.body.appendChild(loadingOverlay);

    // Setup overlay for fullscreen (reuse if exists)
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }
    
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
    shuffledImages.forEach(imageData => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.draggable = true;
        
        const imagePath = `${objectConfig.folder}/${imageData.filename}`;
        
        // Preload image
        const img = new Image();
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
        img.src = imagePath;
        
        card.innerHTML = `
            <img src="${imagePath}" alt="Image ${imageData.filename}" draggable="false">
            <div class="filename" data-full-name="${imageData.initials}" data-display-number="${imageData.displayNumber}" data-filename-number="${imageData.filenameNumber}">${imageData.filenameNumber}</div>
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

    // Remove existing save button if it exists
    const existingSaveButton = document.querySelector('.save-button');
    if (existingSaveButton) {
        existingSaveButton.remove();
    }

    // Add save button
    const saveButton = document.createElement('div');
    saveButton.className = 'save-button';
    saveButton.textContent = window.isStudentMode ? 'Copy Rankings' : 'Save Rankings';
    saveButton.addEventListener('click', saveRankings);
    document.querySelector('.controls').appendChild(saveButton);
}

function toggleFullscreen(card, overlay, forceIndex = null) {
    if (overlay.classList.contains('active')) {
        // Exit fullscreen
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.innerHTML = '';
            window.currentFullscreenIndex = -1;
        }, 200);
    } else {
        // Enter fullscreen
        if (forceIndex !== null) {
            window.currentFullscreenIndex = forceIndex;
        } else {
            // Find index of clicked card
            const cards = [...document.querySelectorAll('.image-card')];
            window.currentFullscreenIndex = cards.indexOf(card);
        }
        showFullscreenImage(window.currentFullscreenIndex, overlay);
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
    
    // Get display number (use filename number for consistency)
    const number = window.showFullNames ? numberEl.dataset.fullName : numberEl.dataset.filenameNumber;
    const nextNumber = window.showFullNames ? nextNumberEl.dataset.fullName : nextNumberEl.dataset.filenameNumber;
    
    // Get initials from data attribute
    const initials = numberEl.dataset.fullName;
    const nextInitials = nextNumberEl.dataset.fullName;
    
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
                <span class="fullscreen-number ${!window.sliderVisible && window.showingFirst ? 'active' : ''}">${number}</span>
                <span class="fullscreen-ranking">#${index + 1}</span>
                ${window.showInitials ? `<span class="fullscreen-initials">${initials}</span>` : ''}
            </div>
            <div class="fullscreen-labels-right">
                <span class="fullscreen-number ${!window.sliderVisible && !window.showingFirst ? 'active' : ''}">${nextNumber}</span>
                <span class="fullscreen-ranking">#${(index + 2) > cards.length ? 1 : index + 2}</span>
                ${window.showInitials ? `<span class="fullscreen-initials">${nextInitials}</span>` : ''}
            </div>
            <div class="help-text">
                x = blink<br>
                z = slider<br>
                s = swap${window.isStudentMode ? '' : '<br>n = initials'}
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
    if (!window.sliderVisible) {
        slider.classList.add('hidden');
        leftSide.style.width = window.showingFirst ? '100%' : '0%';
    }
}

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

// Keyboard handler for fullscreen mode
document.addEventListener('keydown', (e) => {
    const overlay = document.querySelector('.overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

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
            if (window.sliderVisible) {
                slider.classList.add('hidden');
                window.sliderVisible = false;
            }
            window.showingFirst = !window.showingFirst;
            leftSide.style.width = window.showingFirst ? '100%' : '0%';
            // Update active states
            overlay.querySelector('.fullscreen-labels-left .fullscreen-number').classList.toggle('active', window.showingFirst);
            overlay.querySelector('.fullscreen-labels-right .fullscreen-number').classList.toggle('active', !window.showingFirst);
            break;
        case 'z':
            e.preventDefault();
            if (!window.sliderVisible) {
                slider.classList.remove('hidden');
                window.sliderVisible = true;
                leftSide.style.width = '50%';
                slider.style.left = '50%';
            }
            break;
        case 'ArrowRight':
            window.currentFullscreenIndex = (window.currentFullscreenIndex + 1) % totalImages;
            showFullscreenImage(window.currentFullscreenIndex, overlay);
            break;
        case 'ArrowLeft':
            window.currentFullscreenIndex = (window.currentFullscreenIndex - 1 + totalImages) % totalImages;
            showFullscreenImage(window.currentFullscreenIndex, overlay);
            break;
        case 's':
            e.preventDefault();
            swapCurrentImages();
            break;
        case 'n':
            // Disable initials toggle in student mode
            if (window.isStudentMode) break;
            e.preventDefault();
            window.showInitials = !window.showInitials;
            // Update fullscreen view if active
            if (overlay.classList.contains('active')) {
                showFullscreenImage(window.currentFullscreenIndex, overlay);
            }
            break;
    }
});

function swapCurrentImages() {
    const cards = [...document.querySelectorAll('.image-card')];
    const totalImages = cards.length;
    
    if (totalImages < 2) return;
    
    const currentIndex = window.currentFullscreenIndex;
    const nextIndex = (currentIndex + 1) % totalImages;
    
    const currentCard = cards[currentIndex];
    const nextCard = cards[nextIndex];
    const container = document.getElementById('imageContainer');
    
    // Swap the cards in the DOM
    if (nextIndex === 0) {
        // If next is first, insert current before first
        container.insertBefore(currentCard, nextCard);
    } else {
        // Otherwise, swap positions
        const nextSibling = nextCard.nextSibling;
        container.insertBefore(nextCard, currentCard);
        if (nextSibling) {
            container.insertBefore(currentCard, nextSibling);
        } else {
            container.appendChild(currentCard);
        }
    }
    
    // Update rankings
    updateRankings();
    
    // Refresh fullscreen view to show swapped order
    const overlay = document.querySelector('.overlay');
    if (overlay && overlay.classList.contains('active')) {
        // The current index stays the same, but the cards have swapped
        showFullscreenImage(currentIndex, overlay);
    }
}

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

function saveRankings() {
    if (!window.currentObjectConfig) {
        console.error('No object configuration available');
        return;
    }
    
    // Get current rankings
    const cards = [...document.querySelectorAll('.image-card')];
    
    // Student mode: export plain text with filename numbers
    if (window.isStudentMode) {
        const filenameNumbers = cards.map(card => {
            const filenameEl = card.querySelector('.filename');
            return filenameEl.dataset.filenameNumber;
        });
        
        // Format: "M45_2026,525,002,694..."
        const rankingString = [window.currentObjectConfig.objectName, ...filenameNumbers].join(',');
        
        navigator.clipboard.writeText(rankingString)
            .then(() => {
                showNotification('Rankings copied! Paste into a GChat to Mr. Lake.');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification('Failed to copy rankings. Please try again.');
            });
        return;
    }
    
    // Admin mode: existing behavior (JSON + PNG download)
    const rankings = cards.map(card => {
        const initials = card.querySelector('.filename').dataset.fullName;
        return initials;
    });
    
    // Create ranking data object
    const rankingData = {
        object: window.currentObjectConfig.objectName,
        timestamp: new Date().toISOString(),
        rankings: rankings
    };
    
    // Save screenshot
    html2canvas(document.getElementById('imageContainer')).then(canvas => {
        const link = document.createElement('a');
        link.download = `rankings-${window.currentObjectConfig.objectName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Save to localStorage
    const storageKey = `rankings-${window.currentObjectConfig.objectName}`;
    localStorage.setItem(storageKey, JSON.stringify(rankingData));
    
    // Download JSON file
    const jsonStr = JSON.stringify(rankingData, null, 2);
    const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `rankings-${window.currentObjectConfig.objectName}-${Date.now()}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);
    
    // Copy rankings text to clipboard (for backward compatibility)
    const rankingsText = rankings.join('\n');
    navigator.clipboard.writeText(rankingsText)
        .then(() => {
            showNotification('Rankings saved! JSON file downloaded and copied to clipboard.');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
            showNotification('Rankings saved! JSON file downloaded.');
        });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    // Try to position relative to save button, otherwise use default centered position
    const saveButton = document.querySelector('.save-button');
    let notificationStyle = `
        position: fixed;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        white-space: nowrap;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 18px;
    `;
    
    if (saveButton) {
        const buttonRect = saveButton.getBoundingClientRect();
        notificationStyle += `
            top: ${buttonRect.top}px;
            left: ${buttonRect.right + 15}px;
        `;
    } else {
        // Fallback to centered bottom position
        notificationStyle += `
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
        `;
    }
    
    notification.style.cssText = notificationStyle;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}


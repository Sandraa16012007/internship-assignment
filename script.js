let currentTextOverlay = null;
let isDragging = false;
let isResizing = false;
let resizeDirection = null;
let startX, startY, initialX, initialY, initialWidth, initialHeight;

const swiper = new Swiper('.mainSwiper', {
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    grabCursor: true,
    effect: 'slide',
    speed: 600,
    allowTouchMove: true,
    noSwiping: true, // Enable no-swiping functionality
    noSwipingClass: 'swiper-no-swiping', // Class to disable swiping
    on: {
        slideChange: function () {
            updateThumbnails(this.activeIndex);
        }
    }
});

function disableSwiper() {
    swiper.allowTouchMove = false;
    swiper.allowSlideNext = false;
    swiper.allowSlidePrev = false;
}

function enableSwiper() {
    swiper.allowTouchMove = true;
    swiper.allowSlideNext = true;
    swiper.allowSlidePrev = true;
}

document.querySelectorAll('.page-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', function () {
        const slideIndex = parseInt(this.dataset.slide);
        swiper.slideTo(slideIndex);
    });
});

function updateThumbnails(activeIndex) {
    document.querySelectorAll('.page-thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === activeIndex);
    });
}

function createResizeHandles(overlay) {
    // Remove existing handles first
    overlay.querySelectorAll('.resize-handle').forEach(h => h.remove());
    
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.dataset.direction = pos;
        handle.addEventListener('mousedown', startResize);
        overlay.appendChild(handle);
    });
}

function initTextOverlay(overlay) {
    overlay.addEventListener('mousedown', startDrag);
    overlay.addEventListener('click', selectOverlay);
    overlay.addEventListener('input', updateOverlayFromContent);

    if (!overlay.querySelector('.resize-handle')) {
        createResizeHandles(overlay);
    }
}

function startDrag(e) {
    if (e.target.classList.contains('resize-handle')) {
        return;
    }

    if (e.target.tagName === 'DIV' && e.target.classList.contains('text-overlay')) {
        isDragging = true;
        currentTextOverlay = e.target;
        
        document.querySelectorAll('.text-overlay').forEach(o => {
            if (o !== currentTextOverlay) {
                o.classList.remove('selected');
            }
        });
        
        currentTextOverlay.classList.add('selected');
        disableSwiper();

        const rect = currentTextOverlay.getBoundingClientRect();
        const parentRect = currentTextOverlay.parentElement.getBoundingClientRect();

        startX = e.clientX;
        startY = e.clientY;
        initialX = rect.left - parentRect.left;
        initialY = rect.top - parentRect.top;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        updateControlsFromOverlay();
        e.preventDefault();
    }
}

function startResize(e) {
    isResizing = true;
    resizeDirection = e.target.dataset.direction;
    currentTextOverlay = e.target.parentElement;
    
    document.querySelectorAll('.text-overlay').forEach(o => {
        if (o !== currentTextOverlay) {
            o.classList.remove('selected');
        }
    });
    
    currentTextOverlay.classList.add('selected');
    disableSwiper();
    
    const rect = currentTextOverlay.getBoundingClientRect();
    const parentRect = currentTextOverlay.parentElement.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    initialX = rect.left - parentRect.left;
    initialY = rect.top - parentRect.top;
    initialWidth = rect.width;
    initialHeight = rect.height;

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);

    updateControlsFromOverlay();
    e.preventDefault();
    e.stopPropagation();
}

function resize(e) {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const parentRect = currentTextOverlay.parentElement.getBoundingClientRect();
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    let newX = initialX;
    let newY = initialY;

    const minWidth = 100;
    const minHeight = 40;

    switch (resizeDirection) {
        case 'se':
            newWidth = Math.max(minWidth, initialWidth + deltaX);
            newHeight = Math.max(minHeight, initialHeight + deltaY);
            break;
        case 'sw':
            newWidth = Math.max(minWidth, initialWidth - deltaX);
            newHeight = Math.max(minHeight, initialHeight + deltaY);
            newX = initialX + (initialWidth - newWidth);
            break;
        case 'ne':
            newWidth = Math.max(minWidth, initialWidth + deltaX);
            newHeight = Math.max(minHeight, initialHeight - deltaY);
            newY = initialY + (initialHeight - newHeight);
            break;
        case 'nw':
            newWidth = Math.max(minWidth, initialWidth - deltaX);
            newHeight = Math.max(minHeight, initialHeight - deltaY);
            newX = initialX + (initialWidth - newWidth);
            newY = initialY + (initialHeight - newHeight);
            break;
    }

    const maxX = parentRect.width - newWidth;
    const maxY = parentRect.height - newHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    if (newX === 0 && (resizeDirection === 'sw' || resizeDirection === 'nw')) {
        newWidth = initialX + initialWidth;
    }
    if (newY === 0 && (resizeDirection === 'ne' || resizeDirection === 'nw')) {
        newHeight = initialY + initialHeight;
    }
    if (newX + newWidth > parentRect.width) {
        newWidth = parentRect.width - newX;
    }
    if (newY + newHeight > parentRect.height) {
        newHeight = parentRect.height - newY;
    }

    const percentX = (newX / parentRect.width) * 100;
    const percentY = (newY / parentRect.height) * 100;
    const percentWidth = (newWidth / parentRect.width) * 100;
    const percentHeight = (newHeight / parentRect.height) * 100;

    currentTextOverlay.style.left = percentX + '%';
    currentTextOverlay.style.top = percentY + '%';
    currentTextOverlay.style.width = percentWidth + '%';
    currentTextOverlay.style.height = percentHeight + '%';
}

function stopResize() {
    isResizing = false;
    resizeDirection = null;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    enableSwiper(); 
}


function drag(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = initialX + deltaX;
    let newY = initialY + deltaY;

    const parentRect = currentTextOverlay.parentElement.getBoundingClientRect();
    const overlayRect = currentTextOverlay.getBoundingClientRect();
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;

    const minX = 0;
    const minY = 0;
    const maxX = parentRect.width - overlayWidth;
    const maxY = parentRect.height - overlayHeight;

    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    const percentX = (newX / parentRect.width) * 100;
    const percentY = (newY / parentRect.height) * 100;

    currentTextOverlay.style.left = percentX + '%';
    currentTextOverlay.style.top = percentY + '%';
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    enableSwiper(); 
}


function selectOverlay(e) {
    const target = e.currentTarget;
    document.querySelectorAll('.text-overlay').forEach(o => o.classList.remove('selected'));
    currentTextOverlay = target;
    currentTextOverlay.classList.add('selected');
    updateControlsFromOverlay();
}

function updateControlsFromOverlay() {
    if (!currentTextOverlay) {
        document.getElementById('textContent').value = '';
        document.getElementById('textContent').placeholder = 'Select a text box to edit';
        document.getElementById('deleteTextBtn').disabled = true;
        return;
    }

    const styles = window.getComputedStyle(currentTextOverlay);
    const text = currentTextOverlay.textContent.trim();

    // Don't show placeholder text in the textarea
    document.getElementById('textContent').value = text === 'New Text' ? '' : text;
    document.getElementById('textContent').placeholder = text === 'New Text' ? 'Enter your text here' : '';
    document.getElementById('deleteTextBtn').disabled = false;
    document.getElementById('fontFamily').value = currentTextOverlay.style.fontFamily || 'Arial, sans-serif';
    document.getElementById('fontSize').value = parseInt(styles.fontSize);
    document.getElementById('fontSizeValue').textContent = parseInt(styles.fontSize) + 'px';
    document.getElementById('textColor').value = rgbToHex(styles.color);
    document.getElementById('colorHex').value = rgbToHex(styles.color);
    document.getElementById('colorPreview').style.background = rgbToHex(styles.color);
    document.getElementById('lineHeight').value = parseFloat(styles.lineHeight) || 1.5;
    document.getElementById('lineHeightValue').textContent = (parseFloat(styles.lineHeight) || 1.5).toFixed(1);
    document.getElementById('letterSpacing').value = parseFloat(styles.letterSpacing) || 0;
    document.getElementById('letterSpacingValue').textContent = (parseFloat(styles.letterSpacing) || 0) + 'px';

    document.getElementById('boldBtn').classList.toggle('active', styles.fontWeight === 'bold' || parseInt(styles.fontWeight) >= 700);
    document.getElementById('italicBtn').classList.toggle('active', styles.fontStyle === 'italic');
    document.getElementById('underlineBtn').classList.toggle('active', styles.textDecoration.includes('underline'));

    document.querySelectorAll('[data-align]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === styles.textAlign);
    });
}

function updateOverlayFromContent() {
    if (currentTextOverlay) {
        const newText = this.textContent.trim();
        const handles = Array.from(currentTextOverlay.querySelectorAll('.resize-handle'));
        handles.forEach(handle => handle.remove());
        currentTextOverlay.textContent = newText || 'New Text';
        createResizeHandles(currentTextOverlay);
        updateControlsFromOverlay();
    }
}


function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return '#' + result.slice(0, 3).map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

document.getElementById('fontFamily').addEventListener('change', function () {
    if (currentTextOverlay) {
        currentTextOverlay.style.fontFamily = this.value;
    }
});

document.getElementById('fontSize').addEventListener('input', function () {
    if (currentTextOverlay) {
        currentTextOverlay.style.fontSize = this.value + 'px';
        document.getElementById('fontSizeValue').textContent = this.value + 'px';
    }
});

document.getElementById('colorPreview').addEventListener('click', function () {
    document.getElementById('textColor').click();
});

document.getElementById('textColor').addEventListener('input', function () {
    if (currentTextOverlay) {
        currentTextOverlay.style.color = this.value;
        document.getElementById('colorPreview').style.background = this.value;
        document.getElementById('colorHex').value = this.value;
    }
});

document.getElementById('colorHex').addEventListener('input', function () {
    const hex = this.value;
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
        if (currentTextOverlay) {
            currentTextOverlay.style.color = hex;
            document.getElementById('colorPreview').style.background = hex;
            document.getElementById('textColor').value = hex;
        }
    }
});

document.getElementById('boldBtn').addEventListener('click', function () {
    if (currentTextOverlay) {
        const isBold = window.getComputedStyle(currentTextOverlay).fontWeight === 'bold' ||
            parseInt(window.getComputedStyle(currentTextOverlay).fontWeight) >= 700;
        currentTextOverlay.style.fontWeight = isBold ? 'normal' : 'bold';
        this.classList.toggle('active');
    }
});

document.getElementById('italicBtn').addEventListener('click', function () {
    if (currentTextOverlay) {
        const isItalic = window.getComputedStyle(currentTextOverlay).fontStyle === 'italic';
        currentTextOverlay.style.fontStyle = isItalic ? 'normal' : 'italic';
        this.classList.toggle('active');
    }
});

document.getElementById('underlineBtn').addEventListener('click', function () {
    if (currentTextOverlay) {
        const isUnderline = window.getComputedStyle(currentTextOverlay).textDecoration.includes('underline');
        currentTextOverlay.style.textDecoration = isUnderline ? 'none' : 'underline';
        this.classList.toggle('active');
    }
});

document.querySelectorAll('[data-align]').forEach(btn => {
    btn.addEventListener('click', function () {
        if (currentTextOverlay) {
            currentTextOverlay.style.textAlign = this.dataset.align;
            document.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

document.getElementById('lineHeight').addEventListener('input', function () {
    if (currentTextOverlay) {
        currentTextOverlay.style.lineHeight = this.value;
        document.getElementById('lineHeightValue').textContent = parseFloat(this.value).toFixed(1);
    }
});

document.getElementById('letterSpacing').addEventListener('input', function () {
    if (currentTextOverlay) {
        currentTextOverlay.style.letterSpacing = this.value + 'px';
        document.getElementById('letterSpacingValue').textContent = this.value + 'px';
    }
});

document.getElementById('textContent').addEventListener('input', function () {
    if (currentTextOverlay) {
        const newText = this.value.trim();

        const existingHandles = currentTextOverlay.querySelectorAll('.resize-handle');
        
        const handleData = Array.from(existingHandles).map(h => ({
            className: h.className,
            direction: h.dataset.direction
        }));
        
        const textNode = Array.from(currentTextOverlay.childNodes)
            .find(node => node.nodeType === Node.TEXT_NODE);
        
        if (textNode) {
            textNode.textContent = newText || 'New Text';
        } else {
            const text = document.createTextNode(newText || 'New Text');
            currentTextOverlay.insertBefore(text, currentTextOverlay.firstChild);
        }
    
        if (currentTextOverlay.querySelectorAll('.resize-handle').length === 0) {
            createResizeHandles(currentTextOverlay);
        }
    }
});


document.getElementById('deleteTextBtn').addEventListener('click', function () {
    if (currentTextOverlay && confirm('Are you sure you want to delete this text box?')) {
        currentTextOverlay.remove();
        currentTextOverlay = null;
        updateControlsFromOverlay();
        enableSwiper();
    }
});

document.getElementById('addTextBtn').addEventListener('click', function () {
    const activeSlide = document.querySelector('.swiper-slide-active .slide-content');
    if (activeSlide) {
        const newText = document.createElement('div');
        newText.className = 'text-overlay selected swiper-no-swiping'; // Add swiper-no-swiping
        newText.contentEditable = 'true';
        newText.textContent = 'New Text';
        
        newText.style.cssText = `
            top: 40%;
            left: 10%;
            width: 50%;
            text-align: center;
            font-size: 24px;
            font-family: Arial, sans-serif;
            color: #2d3436;
        `;
        
        activeSlide.appendChild(newText);
        
        document.querySelectorAll('.text-overlay').forEach(o => {
            if (o !== newText) {
                o.classList.remove('selected');
            }
        });
        
        currentTextOverlay = newText;
        initTextOverlay(newText);
        createResizeHandles(newText);
        newText.classList.add('fade-in');
        
        newText.offsetHeight;
        
        updateControlsFromOverlay();
      
        setTimeout(() => {
            newText.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(newText);
            selection.removeAllRanges();
            selection.addRange(range);
        }, 50);
    }
});


document.querySelectorAll('.text-overlay').forEach(initTextOverlay);

const firstOverlay = document.querySelector('.text-overlay');
if (firstOverlay) {
    currentTextOverlay = firstOverlay;
    updateControlsFromOverlay();
}

document.querySelector('.btn-download').addEventListener('click', function () {
    alert('Download functionality would export the design as PDF or image files.');
});

document.querySelector('.btn-save').addEventListener('click', function () {
    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    btn.style.background = '#28a745';
    btn.style.color = 'white';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
});

document.querySelector('.back-btn').addEventListener('click', function () {
    if (confirm('Are you sure you want to leave? Any unsaved changes will be lost.')) {
        window.history.back();
    }
});

document.addEventListener('click', function (e) {
    if (!e.target.closest('.text-overlay') &&
        !e.target.closest('.right-panel') &&
        !e.target.closest('.resize-handle') &&
        !e.target.closest('.swiper-button-next') &&
        !e.target.closest('.swiper-button-prev') &&
        !e.target.closest('.swiper-pagination') &&
        e.target.closest('.canvas-area')) {
        
        document.querySelectorAll('.text-overlay').forEach(o => o.classList.remove('selected'));
        currentTextOverlay = null;
        updateControlsFromOverlay();
        enableSwiper();
    }
});

document.addEventListener('selectstart', function (e) {
    if (isDragging || isResizing) {
        e.preventDefault();
    }
});



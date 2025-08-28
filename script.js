// ASCII 3D Modeler - Optimized Script
let themeMode = true;
let isModelRotating = false;
let isLightRotating = false;

// Cache DOM elements
const elements = {};
const cacheElement = (id) => elements[id] || (elements[id] = document.getElementById(id));

// Performance optimization
let animationId;
let isAnimating = false;
const clock = new THREE.Clock();
const isMobileDevice = /(Mobi|Android|iPhone|iPad|iPod|Mobile)/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Initialize mobile auto-rotation
if (isMobileDevice) isLightRotating = true;

// Core variables
let userUploaded = false;
let controls;
const myMesh = new THREE.Mesh();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0, 0, 0);

// Lighting
const pointLight1 = new THREE.PointLight(0xffffff, 1, 0, 0);
pointLight1.position.set(100, 100, 400);
scene.add(pointLight1);

// Setup
const stlLoader = new THREE.STLLoader();
const material = new THREE.MeshStandardMaterial({ flatShading: true, side: THREE.DoubleSide });
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();

let effect;
let characters = ' .:-+*=%@#';
const effectSize = { amount: .205 };
let backgroundColor = 'black';
let ASCIIColor = 'white';

// ASCII patterns
const asciiPatterns = {
    classic: ' .:-+*=%@#',
    blocks: ' .:-=*#@',
    custom: 'Custom Text'
};

// Optimized effect creation
function createEffect() {
    effect = new THREE.AsciiEffect(renderer, characters, { invert: true, resolution: effectSize.amount });
    effect.setSize(sizes.width, sizes.height);
    effect.domElement.style.color = ASCIIColor;
    effect.domElement.style.backgroundColor = backgroundColor;
}

// Optimized controls creation
function createOrbitControls() {
    controls = new THREE.OrbitControls(camera, effect.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
}

// Debounced resize handler
let resizeTimeout;
function onWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        effect.setSize(window.innerWidth, window.innerHeight);
    }, 100);
}

// Optimized button UI updates
function updateButtonUI(buttonId, isActive, activeText, inactiveText) {
    const btn = cacheElement(buttonId);
    if (!btn) return;
    
    btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'bg-yellow-600', 'hover:bg-yellow-700');
    if (isActive) {
        btn.textContent = activeText;
        btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
    } else {
        btn.textContent = inactiveText;
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
}

// Consolidated effect recreation
function recreateEffect() {
    if (effect?.domElement?.parentNode) {
        document.body.removeChild(effect.domElement);
    }
    createEffect();
    onWindowResize();
    document.body.appendChild(effect.domElement);
    createOrbitControls();
}

// Optimized character update
function updateCharacters(newChars) {
    if (!newChars || newChars.trim().length === 0) {
        newChars = ' .:-+*=%@#';
    }
    if (newChars.charAt(0) !== ' ') {
        newChars = ' ' + newChars;
    }
    characters = newChars;
    recreateEffect();
}

// Optimized animation loop (single instance)
function startAnimation() {
    if (isAnimating) return;
    isAnimating = true;
    
    function tick() {
        if (!isAnimating) return;
        
        if (isModelRotating && myMesh.geometry) {
            myMesh.rotation.z += 0.01;
        }
        
        if (isLightRotating) {
            // Direct light manipulation instead of slider events
            const angle = (clock.getElapsedTime() * 30) % 360; // 30 degrees per second
            const radians = angle * Math.PI / 180;
            pointLight1.position.set(Math.cos(radians) * 100, 100, Math.sin(radians) * 100);
            
            // Update slider display only
            const lightSlider = cacheElement('lightSlider');
            if (lightSlider) lightSlider.value = angle;
            const lightValue = cacheElement('lightValue');
            if (lightValue) lightValue.textContent = Math.round(angle) + '°';
        }
        
        if (controls) controls.update();
        if (effect && myMesh.geometry) effect.render(scene, camera);
        animationId = requestAnimationFrame(tick);
    }
    tick();
}

function stopAnimation() {
    isAnimating = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Optimized file handling
function openFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Stop any existing animation
    stopAnimation();
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            userUploaded = true;
            const geometry = stlLoader.parse(e.target.result);
            geometry.computeBoundingBox();
            
            // Center geometry efficiently for proper pivoting
            const box = geometry.boundingBox;
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Translate so the geometric center becomes the pivot point
            geometry.translate(-center.x, -center.y, -center.z);
            
            // Additional centering to ensure perfect pivot
            geometry.computeBoundingBox();
            const newCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
            geometry.translate(-newCenter.x, -newCenter.y, -newCenter.z);
            
            // Clean up old mesh
            if (myMesh.geometry) {
                myMesh.geometry.dispose();
                scene.remove(myMesh);
            }
            
            // Set up new mesh
            myMesh.geometry = geometry;
            myMesh.material = material;
            myMesh.rotation.set(-60 * Math.PI / 180, 0, 0);
            myMesh.scale.setScalar(2.0);
            
            scene.add(myMesh);
            createOrbitControls();
            
            
            const uploadText = cacheElement('upload-text');
            if (uploadText) uploadText.textContent = file.name;
            
            // Start single animation loop
            startAnimation();
            
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Error loading file. Please try a different file.');
        }
    };
    reader.readAsArrayBuffer(file);
}

// Initialize
createEffect();
camera.position.set(100, 450, 400);
document.body.appendChild(effect.domElement);

// Load default model efficiently
stlLoader.load('./models/skull_mesh.stl', (geometry) => {
    try {
        userUploaded = false;
        geometry.computeBoundingBox();
        
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        
        // Translate so the geometric center becomes the pivot point
        geometry.translate(-center.x, -center.y, -center.z);
        
        // Additional centering to ensure perfect pivot
        geometry.computeBoundingBox();
        const newCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
        geometry.translate(-newCenter.x, -newCenter.y, -newCenter.z);
        
        myMesh.geometry = geometry;
        myMesh.material = material;
        myMesh.rotation.set(-60 * Math.PI / 180, 0, 0);
        myMesh.scale.setScalar(2.0);
        
        scene.add(myMesh);
        createOrbitControls();
        
        
        startAnimation();
        
    } catch (error) {
        console.error('Error loading default model:', error);
    }
});

// Event handlers
window.addEventListener('resize', onWindowResize);

// Optimized export functions
const exportFunctions = {
    copyASCII: () => {
        const asciiElement = effect?.domElement?.querySelector('table') || effect?.domElement;
        const text = asciiElement?.innerText || asciiElement?.textContent || '';
        if (text) download('ASCII.txt', text);
    },
    clipboardASCII: () => {
        const asciiElement = effect?.domElement?.querySelector('table') || effect?.domElement;
        const text = asciiElement?.innerText || asciiElement?.textContent || '';
        if (text) {
            navigator.clipboard?.writeText(text).then(() => {
                alert("ASCII copied to clipboard");
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert("ASCII copied to clipboard");
            });
        }
    }
};

// Batch DOM event listeners for performance
const eventHandlers = {
    'file-selector': ['change', openFile, false],
    'screenshotButton': ['click', takeScreenshot],
    'updateASCII': ['click', () => updateCharacters(cacheElement('newASCII').value)],
    'resetASCII': ['click', () => updateCharacters(' .:-+*=%@#')],
    'copyASCII': ['click', exportFunctions.copyASCII],
    'clipboardASCII': ['click', exportFunctions.clipboardASCII],
    'lightDark': ['click', () => {
        themeMode = !themeMode;
        backgroundColor = themeMode ? 'black' : 'white';
        ASCIIColor = themeMode ? 'white' : 'black';
        if (effect?.domElement) {
            effect.domElement.style.color = ASCIIColor;
            effect.domElement.style.backgroundColor = backgroundColor;
        }
    }],
    'rotateButton': ['click', () => {
        isModelRotating = !isModelRotating;
        updateButtonUI('rotateButton', isModelRotating, 'Pause Rotate', 'Rotate Model');
    }],
    'rotateLightButton': ['click', () => {
        isLightRotating = !isLightRotating;
        updateButtonUI('rotateLightButton', isLightRotating, 'Pause Light', 'Rotate Light');
    }],
    'resetButton': ['click', resetPositions],
    'mobile-menu-button': ['click', toggleMobileDrawer],
    'mobile-upload': ['click', () => cacheElement('file-selector').click()],
    'mobile-reset': ['click', resetPositions],
    'input-button': ['click', () => cacheElement('file-selector').click()],
    'file-view-toggle': ['click', () => toggleSection('file-view')],
    'model-controls-toggle': ['click', () => toggleSection('model-controls')],
    'ascii-controls-toggle': ['click', () => toggleSection('ascii-controls')],
    'export-controls-toggle': ['click', () => toggleSection('export-controls')],
    'patternSelect': ['change', function() {
        const customInput = cacheElement('newASCII');
        if (this.value === 'custom') {
            customInput.disabled = false;
            customInput.focus();
        } else {
            customInput.disabled = true;
            customInput.value = asciiPatterns[this.value];
            updateCharacters(asciiPatterns[this.value]);
        }
    }]
};

// Apply all event listeners efficiently
Object.entries(eventHandlers).forEach(([id, [event, handler, useCapture]]) => {
    const element = cacheElement(id);
    if (element) element.addEventListener(event, handler, useCapture);
});

// Debounced slider handlers
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Optimized slider handling
['lightSlider', 'lightHeightSlider', 'scaleSlider'].forEach(id => {
    const element = cacheElement(id);
    if (element) {
        element.addEventListener('input', debounce((e) => {
            const value = parseFloat(e.target.value);
            if (id === 'scaleSlider') {
                if (myMesh.geometry) myMesh.scale.setScalar(value);
                const valueDisplay = cacheElement('scaleValue');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(2) + 'x';
            } else if (id === 'lightSlider') {
                const angle = value * Math.PI / 180;
                pointLight1.position.set(Math.cos(angle) * 100, 100, Math.sin(angle) * 100);
                const valueDisplay = cacheElement('lightValue');
                if (valueDisplay) valueDisplay.textContent = Math.round(value) + '°';
            } else if (id === 'lightHeightSlider') {
                pointLight1.position.y = value * 50 + 100;
                const valueDisplay = cacheElement('lightHeightValue');
                if (valueDisplay) valueDisplay.textContent = value.toFixed(1);
            }
        }, 16));
    }
});

// Rotation sliders with value display
['X', 'Y', 'Z'].forEach(axis => {
    const element = cacheElement(`rotate${axis}Slider`);
    if (element) {
        element.addEventListener('input', debounce((e) => {
            const degrees = parseFloat(e.target.value);
            const radians = degrees * Math.PI / 180;
            if (myMesh.geometry) {
                myMesh.rotation[axis.toLowerCase()] = radians;
            }
            // Update value display
            const valueDisplay = cacheElement(`rotate${axis}Value`);
            if (valueDisplay) valueDisplay.textContent = Math.round(degrees) + '°';
        }, 16));
    }
});

// Utility functions
function takeScreenshot() {
    html2canvas(document.body).then(canvas => {
        const link = document.createElement('a');
        link.download = 'ASCII_3D_Screenshot.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function resetPositions() {
    if (!myMesh.geometry) return;
    
    ['lightSlider', 'lightHeightSlider', 'rotateXSlider', 'rotateYSlider', 'rotateZSlider', 'scaleSlider']
        .forEach(id => {
            const slider = cacheElement(id);
            if (slider) {
                slider.value = id === 'lightSlider' ? 120 : 
                              id === 'rotateXSlider' ? -60 : 
                              id === 'scaleSlider' ? 2.0 : 
                              id === 'lightHeightSlider' ? 2 : 0;
                slider.dispatchEvent(new Event('input'));
            }
        });
    
    isModelRotating = false;
    isLightRotating = isMobileDevice;
    updateButtonUI('rotateButton', isModelRotating, 'Pause Rotate', 'Rotate Model');
    updateButtonUI('rotateLightButton', isLightRotating, 'Pause Light', 'Rotate Light');
}

// Missing utility functions
function toggleMobileDrawer() {
    const drawer = cacheElement('mobile-drawer');
    const isOpen = drawer.style.transform === 'translateY(0px)' || drawer.classList.contains('translate-y-0');
    
    if (isOpen) {
        drawer.style.transform = 'translateY(100%)';
        drawer.classList.remove('translate-y-0');
    } else {
        drawer.style.transform = 'translateY(0px)';
        drawer.classList.add('translate-y-0');
    }
}

function toggleSection(sectionId) {
    const content = cacheElement(sectionId + '-content');
    const icon = cacheElement(sectionId + '-icon');
    
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        content.classList.add('fade-in');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

function updateSliderValue(sliderId, valueId, suffix) {
    const slider = cacheElement(sliderId);
    const valueDisplay = cacheElement(valueId);
    if (!slider || !valueDisplay) return;
    
    const value = parseFloat(slider.value);
    valueDisplay.textContent = suffix === '°' ? Math.round(value) + '°' : 
                              suffix === 'x' ? value.toFixed(2) + 'x' : 
                              value.toFixed(1);
}

function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Initialize button states
updateButtonUI('rotateButton', isModelRotating, 'Pause Rotate', 'Rotate Model');
updateButtonUI('rotateLightButton', isLightRotating, 'Pause Light', 'Rotate Light');

// Initialize sections as expanded and add drag & drop
document.addEventListener('DOMContentLoaded', () => {
    ['file-view', 'model-controls', 'ascii-controls', 'export-controls'].forEach(section => {
        const content = cacheElement(section + '-content');
        const icon = cacheElement(section + '-icon');
        const button = cacheElement(section);
        
        if (content && icon) {
            content.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        }
        
        // Add section toggle functionality
        if (button) {
            button.addEventListener('click', () => toggleSection(section));
        } else {
            // Fallback: find button by looking for onclick attribute pattern
            const sectionButton = document.querySelector(`[onclick*="${section}"]`);
            if (sectionButton) {
                sectionButton.addEventListener('click', () => toggleSection(section));
            }
        }
    });
    
    // Add drag and drop functionality
    const uiContainer = cacheElement('ui-container');
    if (uiContainer) {
        uiContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uiContainer.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
        });
        
        uiContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uiContainer.style.backgroundColor = '';
        });
        
        uiContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uiContainer.style.backgroundColor = '';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                cacheElement('file-selector').files = files;
                openFile({ target: { files: [files[0]] } });
            }
        });
    }
});
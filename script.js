// Theme Mode: true = Dark (white on black), false = Light (black on white)
let isDarkMode = true

//Create a clock for rotation
const clock = new THREE.Clock()

// Set rotate boolean variable
let rotateModel = false
let rotateLight = false

// Detect mobile device and enable light rotation by default
const isMobileDevice = /(Mobi|Android|iPhone|iPad|iPod|Mobile)/i.test(navigator.userAgent) || window.innerWidth <= 768;
if (isMobileDevice) {
    rotateLight = true;
}

// Update the Rotate Light button to reflect current state
function updateRotateLightButtonUI() {
    const btn = document.getElementById('rotateLightButton');
    if (!btn) return;
    // Remove existing color classes
    btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'bg-yellow-600', 'hover:bg-yellow-700', 'bg-gray-600', 'hover:bg-gray-700');

    if (rotateLight) {
        btn.textContent = 'Pause Light';
        btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
    } else {
        btn.textContent = 'Rotate Light';
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
}

// Initialize button state on load
updateRotateLightButtonUI();

// Update the Rotate Model button to reflect current state
function updateRotateModelButtonUI() {
    const btn = document.getElementById('rotateButton');
    if (!btn) return;
    // Remove existing color classes
    btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'bg-yellow-600', 'hover:bg-yellow-700', 'bg-gray-600', 'hover:bg-gray-700');

    if (rotateModel) {
        btn.textContent = 'Pause Rotate';
        btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
    } else {
        btn.textContent = 'Rotate Model';
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
    }
}

updateRotateModelButtonUI();


//Ugh, don't ask about this stuff
var userUploaded = false
let controls

// Creates empty mesh container
const myMesh = new THREE.Mesh();

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0, 0, 0);

//Lights
const pointLight1 = new THREE.PointLight(0xffffff, 1, 0, 0);
pointLight1.position.set(100, 100, 400);
scene.add(pointLight1);

// const pointLight2 = new THREE.PointLight(0xffffff, .1);
// pointLight2.position.set(0, -50, 0); // Fill light on opposite side
// scene.add(pointLight2);

// Parameters
const stlLoader = new THREE.STLLoader()

//Material
const material = new THREE.MeshStandardMaterial()
material.flatShading = true
material.side = THREE.DoubleSide;

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 2000)

// Renderer
const renderer = new THREE.WebGLRenderer()

let effect;

let characters = ' .:-+*=%@#'
const effectSize = { amount: .205 }
let backgroundColor = 'black'
let ASCIIColor = 'white'

function createEffect() {
    effect = new THREE.AsciiEffect(renderer, characters, { invert: true, resolution: effectSize.amount });
    effect.setSize(sizes.width, sizes.height);
    effect.domElement.style.color = ASCIIColor;
    effect.domElement.style.backgroundColor = backgroundColor;
}

// Create and configure orbit controls
function createOrbitControls() {
    controls = new THREE.OrbitControls(camera, effect.domElement)

    // Configure orbit controls for smoother interaction
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05; // Lower = smoother
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5; // Slower rotation for smoother feel
    controls.zoomSpeed = 0.8; // Slightly slower zoom
    controls.panSpeed = 0.8; // Slightly slower pan

    // Configure mouse button controls
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE
    }
}

createEffect()

document.body.appendChild(effect.domElement)


stlLoader.load(
    './models/skull_mesh.stl',
    function (geometry) {

        myMesh.material = material;
        myMesh.geometry = geometry;

        var tempGeometry = new THREE.Mesh(geometry, material)
        myMesh.position.copy = (tempGeometry.position)

        geometry.computeVertexNormals();
        myMesh.geometry.center()

        myMesh.geometry.computeBoundingBox();

        resetPositions();

        var bbox = myMesh.geometry.boundingBox;

        myMesh.position.y = ((bbox.max.z - bbox.min.z) / 5)

        camera.position.x = ((bbox.max.x * 4));
        camera.position.y = ((bbox.max.y));
        camera.position.z = ((bbox.max.z * 3));

        scene.add(myMesh);

        createOrbitControls()


        function tick() {
            if (rotateModel) {
                myMesh.rotation.z += 0.01; // Adjust speed as needed
            }

            if (rotateLight) {
                const lightSlider = document.getElementById('lightSlider');
                let currentAngle = parseFloat(lightSlider.value);
                currentAngle = (currentAngle + 1) % 360;
                lightSlider.value = currentAngle;
                // Manually trigger the input event to update the light's position
                lightSlider.dispatchEvent(new Event('input'));
            }

            // Update controls for smooth damping
            controls.update();

            render()
            window.requestAnimationFrame(tick)
        }

        function render() {
            effect.render(scene, camera);
        }

        tick()

        document.getElementById('file-selector').addEventListener('change', openFile, false);


        function openFile(evt) {
            const fileObject = evt.target.files[0];

            const reader = new FileReader();
            reader.readAsArrayBuffer(fileObject);
            reader.onload = function () {
                if (userUploaded == false) {
                    userUploaded = true;
                }
                const geometry = stlLoader.parse(this.result);
                tempGeometry = geometry;
                myMesh.geometry = geometry;
                myMesh.geometry.center()
                myMesh.geometry.computeBoundingBox();
                resetPositions();

                var bbox = myMesh.geometry.boundingBox;

                // camera.position.x = ((bbox.max.x * 4));
                // camera.position.y = ((bbox.max.y));
                // camera.position.z = ((bbox.max.z * 3));

                myMesh.position.y = ((bbox.max.z - bbox.min.z) / 6)

                scene.add(myMesh);
            };
        };
    }
)


document.getElementById('screenshotButton').addEventListener('click', takeScreenshot);

function takeScreenshot() {
    // Capture only the ASCII canvas, not the entire page
    html2canvas(effect.domElement).then(function (canvas) {
        var link = document.createElement("a");
        document.body.appendChild(link);
        link.download = "ASCII.jpg";
        link.href = canvas.toDataURL("image/jpg");
        console.log(link.href);
        // link.target = '_blank';
        link.click();
    });
}

document.getElementById('updateASCII').addEventListener('click', updateASCII);

function updateASCII() {

    document.body.removeChild(effect.domElement)

    characters = " " + "." + document.getElementById('newASCII').value;

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    createOrbitControls()

}

document.getElementById('resetASCII').addEventListener('click', resetASCII);

function resetASCII() {

    document.body.removeChild(effect.domElement)

    characters = ' .:-+*=%@#'

    createEffect()
    onWindowResize()

    document.body.appendChild(effect.domElement)

    createOrbitControls()
}

document.getElementById('lightDark').addEventListener('click', lightDark);

function lightDark() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode', !isDarkMode);

    if (isDarkMode) {
        backgroundColor = 'black';
        ASCIIColor = 'white';
    } else {
        backgroundColor = 'white';
        ASCIIColor = 'black';
    }

    effect.domElement.style.color = ASCIIColor;
    effect.domElement.style.backgroundColor = backgroundColor;
}

document.getElementById('lightSlider').addEventListener('input', function (e) {
    const angleDeg = parseFloat(e.target.value);
    const angleRad = angleDeg * Math.PI / 180;
    const radius = myMesh.geometry.boundingBox.max.z * 2; // Distance from origin, similar to initial position

    // Get height from the height slider
    const heightSlider = document.getElementById('lightHeightSlider');
    const heightMultiplier = parseFloat(heightSlider.value);

    // Calculate height based on bounding box
    let height = 85; // Default height
    if (myMesh.geometry.boundingBox) {
        const bbox = myMesh.geometry.boundingBox;
        const bboxHeight = bbox.max.y - bbox.min.y;
        height = bboxHeight * heightMultiplier;
    }

    // Calculate new position in XZ plane
    const x = Math.cos(angleRad) * radius;
    const z = Math.sin(angleRad) * radius;
    pointLight1.position.set(x, height, z);
    // pointLight2.position.set(-x, -y, -z);
});

document.getElementById('lightHeightSlider').addEventListener('input', function (e) {
    // Trigger the light slider to update position with new height
    document.getElementById('lightSlider').dispatchEvent(new Event('input'));
});



window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    effect.setSize(window.innerWidth, window.innerHeight);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

document.getElementById("copyASCII").addEventListener("click", function () {
    var text = document.getElementsByTagName("table")[0].innerText
    var filename = "ASCII.txt";

    download(filename, text);
}, false);

document.getElementById("clipboardASCII").addEventListener("click", function () {
    const textArea = document.createElement("textarea");
    textArea.textContent = document.getElementsByTagName("td")[0].innerText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    window.alert("ASCII copied to clipboard");
}, false);

document.getElementById('scaleSlider').addEventListener('input', function (e) {
    const scale = parseFloat(e.target.value);
    myMesh.scale.set(scale, scale, scale);
});

// Rotation sliders logic
['X', 'Y', 'Z'].forEach(axis => {
    document.getElementById(`rotate${axis}Slider`).addEventListener('input', function (e) {
        const value = parseFloat(e.target.value) * Math.PI / 180;
        if (axis === 'X') {
            // Account for initial -90° position
            myMesh.rotation.x = value;
        } else {
            myMesh.rotation[axis.toLowerCase()] = value;
        }
    });
});

document.getElementById('rotateButton').addEventListener('click', function () {
    rotateModel = !rotateModel;
    updateRotateModelButtonUI();
});

document.getElementById('rotateLightButton').addEventListener('click', function () {
    rotateLight = !rotateLight;
    updateRotateLightButtonUI();
});

document.getElementById('resetButton').addEventListener('click', resetPositions);

function resetPositions() {
    // Reset model rotation and scale
    myMesh.scale.set(1, 1, 1);
    myMesh.rotation.set(-90 * Math.PI / 180, 0, 0);

    // Reset sliders to initial model position
    document.getElementById('scaleSlider').value = 1;
    document.getElementById('rotateXSlider').value = -90;
    document.getElementById('rotateYSlider').value = 0;
    document.getElementById('rotateZSlider').value = 0;
    document.getElementById('lightSlider').value = 45;
    document.getElementById('lightHeightSlider').value = 2;

    // Reset light position
    if (myMesh.geometry.boundingBox) {
        document.getElementById('lightSlider').dispatchEvent(new Event('input'));
    }


    // Stop rotations
    rotateModel = false;
    rotateLight = isMobileDevice;
    updateRotateLightButtonUI();
    updateRotateModelButtonUI();
}

document.getElementById('mobile-menu-button').addEventListener('click', function () {
    document.getElementById('ui-container').classList.toggle('hidden');
});

// Download HTML functionality
function downloadHTML() {
    const asciiContent = document.getElementsByTagName("table")[0]?.innerText || "No ASCII content available";
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII 3D Model Output</title>
    <style>
        body {
            background-color: ${isDarkMode ? '#000' : '#fff'};
            color: ${isDarkMode ? '#fff' : '#000'};
            font-family: 'Courier New', monospace;
            margin: 20px;
            padding: 20px;
        }
        .ascii-container {
            white-space: pre;
            font-size: 12px;
            line-height: 1;
            text-align: center;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ASCII 3D Modeler Output</h1>
        <p>Generated from 3D model conversion</p>
    </div>
    <div class="ascii-container">${asciiContent}</div>
</body>
</html>`;

    const filename = "ASCII_3D_Model.html";
    download(filename, htmlContent);
}

// Open in new window functionality
function openInNewWindow() {
    const asciiContent = document.getElementsByTagName("table")[0]?.innerText || "No ASCII content available";
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASCII 3D Model - Preview</title>
    <style>
        body {
            background-color: ${isDarkMode ? '#111' : '#fff'};
            color: ${isDarkMode ? '#fff' : '#000'};
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .ascii-container {
            white-space: pre;
            font-size: 12px;
            line-height: 1;
            text-align: center;
            border: 2px solid ${isDarkMode ? '#333' : '#ddd'};
            padding: 20px;
            border-radius: 8px;
            background: ${isDarkMode ? '#1a1a1a' : '#f9f9f9'};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
        }
        .controls {
            margin-top: 20px;
            text-align: center;
        }
        button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
            font-family: Arial, sans-serif;
        }
        button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ASCII 3D Model Preview</h1>
        <p>Generated with ASCII 3D Modeler</p>
    </div>
    <div class="ascii-container">${asciiContent}</div>
    <div class="controls">
        <button onclick="window.print()">Print</button>
        <button onclick="window.close()">Close</button>
    </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
}

// Add event listeners for new buttons
document.getElementById("downloadHTMLButton").addEventListener("click", downloadHTML);
document.getElementById("openNewWindowButton").addEventListener("click", openInNewWindow);

// Mobile button event listeners
document.getElementById("mobile-clipboard").addEventListener("click", function () {
    document.getElementById("clipboardASCII").click();
});

document.getElementById("mobile-download").addEventListener("click", function () {
    document.getElementById("copyASCII").click();
});

document.getElementById("mobile-screenshot").addEventListener("click", function () {
    document.getElementById("screenshotButton").click();
});

document.getElementById("mobile-download-html").addEventListener("click", downloadHTML);
document.getElementById("mobile-new-window").addEventListener("click", openInNewWindow);

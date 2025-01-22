// Import Three.js and OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near plane
  1000 // Far plane
);
camera.position.set(0, 2, 5); // Position the camera

// Set up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft light
scene.add(ambientLight);

const ambientLight1 = new THREE.AmbientLight(0xffffff, 0.5); // Adjust intensity
scene.add(ambientLight1);


const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5); // Position to front of the walls
directionalLight.intensity = 1.5; // Increase intensity

scene.add(directionalLight);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement

// Load the GLTF model (wall.glb)
const loader = new GLTFLoader();
loader.load('./wall.glb', (gltf) => {
  const wall = gltf.scene;
  wall.traverse((node) => {
    if (node.isMesh) {
      console.log(node.material); // Check the material type
    }
  });
  wall.position.set(0, 0, 0);
  scene.add(wall);
});


// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update OrbitControls
  renderer.render(scene, camera);
}
animate();

// Import Three.js and OrbitControls
import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE0E0E0); // Grey color

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 10); // Better positioning

// Create renderer
const canvas = document.querySelector("#bg") || document.createElement("canvas");
if (!document.querySelector("#bg")) document.body.appendChild(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);


// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.5;
controls.maxDistance = 50;

// Load GLTF model
const loader = new GLTFLoader();
loader.load('./smaller-room.glb', (gltf) => {
  const room = gltf.scene;
  room.position.set(0, 0, 0);
  scene.add(room);
  console.log("Model loaded:", room);
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10); // Adjust position
scene.add(light);

// Add a helper to visualize the light direction
const lightHelper = new THREE.DirectionalLightHelper(light, 5);
scene.add(lightHelper);

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Smooth movement
  renderer.render(scene, camera);
}

animate();

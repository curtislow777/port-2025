// Import Three.js and OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Set up your Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a basic lighting setup
const light = new THREE.AmbientLight(0x404040); // Ambient light
scene.add(light);

// Set up the GLTFLoader
const loader = new GLTFLoader();
loader.load(
  // URL of the GLTF file you exported from the Three.js editor
  'scene.glb', 
  (gltf) => {
    // When the model is loaded, add it to the scene
    scene.add(gltf.scene);
    
    // Optionally, set the camera position or the model's scale
    gltf.scene.scale.set(1, 1, 1); // Adjust the model's scale if necessary
    gltf.scene.position.set(0, 0, 0); // Adjust position if necessary
  },
  // Optional: Handle loading progress
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  // Optional: Handle errors
  (error) => {
    console.error('Error loading GLTF model:', error);
  }
);

// Camera position
camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
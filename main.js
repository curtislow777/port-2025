import * as THREE from 'three';
import "./style.scss";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


const canvas = document.querySelector('#experience-canvas');
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

// Loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
// Specify path to a folder containing WASM/JS decoding libraries.

const loader = new GLTFLoader();

loader.setDRACOLoader( dracoLoader );
dracoLoader.setDecoderPath( '/draco/' );

const textureMap = {
  one:{
    day:"/textures/AGX-Texture1.webp", 
    night: "/textures/AGX-Texture1_night.webp",
  },
  two:{
    day:"/textures/AGX-Texture2.webp",
    night: "/textures/AGX-Texture2_night.webp",
  },
  three:{
    day:"/textures/AGX-Texture3.webp",
    night: "/textures/AGX-Texture3_night.webp",
  },
  four:{
    day:"/textures/AGX-Texture4.webp",
    night: "/textures/AGX-Texture4_night.webp",
  },
  five:{
    day:"/textures/AGX-Texture5.webp",
    night: "/textures/AGX-Texture5_night.webp",
  },
  six:{
    day:"/textures/AGX-Texture6.webp",
    night: "/textures/AGX-Texture6_night.webp",
  },
  seven:{
    day:"/textures/AGX-Texture7.webp",
    night: "/textures/AGX-Texture7_night.webp",
  },
  eight:{
    day:"/textures/AGX-Texture8.webp",
    night: "/textures/AGX-Texture8_night.webp",
  },
  nine:{
    day:"/textures/AGX-Texture9.webp",
    night: "/textures/AGX-Texture9_night.webp",
  },

}

const loadedTextures = {
  day:{},
  night: {},
}; 

Object.entries(textureMap).forEach(([key, paths]) => {
  const dayTexture = textureLoader.load(paths.day);
  loadedTextures.day[key] = dayTexture;

  const nightTexture = textureLoader.load(paths.night);
  loadedTextures.night[key] = nightTexture;
});

loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse(child => {
    if (child.isMesh) {
      Object.keys(textureMap).forEach(key => {
        child.material.map = loadedTextures.day[key];
      });
    }
  });
  scene.add(glb.scene);
});

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});  

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();


renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


camera.position.z = 5;
//controls.update() must be called after any manual changes to the camera's transform
camera.position.set( 0, 20, 100 );


// Event Listeners
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});




function animate() {


}

const render = () => {

  controls.update();

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render( scene, camera );

  window.requestAnimationFrame(render);
};

render();
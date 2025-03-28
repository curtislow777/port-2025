import * as THREE from 'three';
import "./style.scss";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#experience-canvas');
const sizes ={
  width: window.innerWidth,
  height: window.innerHeight
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();


const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});  
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
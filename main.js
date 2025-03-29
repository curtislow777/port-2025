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

const xAxisFans = [];
const yAxisFans = [];
const zAxisFans = [];

const raycasterObjects = [];

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Loaders  
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
// Specify path to a folder containing WASM/JS decoding libraries.

const loader = new GLTFLoader();

loader.setDRACOLoader( dracoLoader );
dracoLoader.setDecoderPath( '/draco/' );
const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});  
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; // NEW: color space
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const environmentMap = new THREE.CubeTextureLoader()
  .setPath('textures/skybox/')
  .load([
    'px.webp',  // Positive X
    'nx.webp',  // Negative X
    'py.webp',  // Positive Y
    'ny.webp',  // Negative Y
    'pz.webp',  // Positive Z
    'nz.webp'   // Negative Z
  ]);




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
  fourA:{
    day:"/textures/AGX-Texture4.webp",
    night: "/textures/AGX-Texture4_night.webp",
  },
  fourB:{
    day:"/textures/AGX-Texture4.5.webp",
    night: "/textures/AGX-Texture4.5_night.webp",
  }
  ,
  five:{
    day:"/textures/AGX-Texture5.webp",
    night: "/textures/AGX-Texture5_night.webp",
  },
  sixA:{
    day:"/textures/AGX-Texture6.webp",
    night: "/textures/AGX-Texture6_night.webp",
  },
  sixB:{
    day:"/textures/AGX-Texture6.5.webp",
    night: "/textures/AGX-Texture6.5_night.webp",
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
  dayTexture.flipY = false;
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.generateMipmaps = true;
  dayTexture.minFilter = THREE.LinearMipmapLinearFilter;
  dayTexture.magFilter = THREE.LinearFilter;

  loadedTextures.day[key] = dayTexture;

  const nightTexture = textureLoader.load(paths.night);
  nightTexture.flipY = true;
  nightTexture.colorSpace = THREE.SRGBColorSpace; 
  loadedTextures.night[key] = nightTexture;
});

// Helper function to extract the texture key from the mesh name
function getTextureKeyFromName(meshName) {
  if (meshName.includes('-one'))   return 'one';
  if (meshName.includes('-two'))   return 'two';
  if (meshName.includes('-three')) return 'three';
  if (meshName.includes('-fourA'))  return 'fourA';
  if (meshName.includes('-fourB'))  return 'fourB';
  if (meshName.includes('-five'))  return 'five';
  if (meshName.includes('-sixA'))   return 'sixA';
  if (meshName.includes('-sixB'))   return 'sixB';
  if (meshName.includes('-seven')) return 'seven';
  if (meshName.includes('-eight')) return 'eight';
  if (meshName.includes('-nine'))  return 'nine';
  return null;
}

window.addEventListener("mousemove", (event)=>{

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
})




loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      const textureKey = getTextureKeyFromName(child.name);
      if (textureKey) {

        const material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[textureKey], // Assign new texture
        });


        
        // Clone the material so it’s independent and assign MeshBasicMaterial:
        child.material = material;
        // front and back 3,4,7 X

        // gpu 0,1,2 Y
        // upper 5,6 Z
        if (child.name.includes("fan")) {
          if (child.name.includes("003") || child.name.includes("004") || child.name.includes("007")) {
            xAxisFans.push(child);
          } 
          else if (child.name.includes("005") || child.name.includes("006")) {
            yAxisFans.push(child);
          } 
          else {
            zAxisFans.push(child);
          }
        }
        

        }

        if(child.material.map){
          child.material.map.minFilter = THREE.LinearFilter;
          
        }
        

        // Debug: log the assigned texture URL
       // console.log(`${child.name} now using texture:`, child.material.map.image ? child.material.map.image.src : "not loaded");
      }
    
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.01,
      specularIntensity: 1,
      envMap: environmentMap,
      envMapIntensity: 1,
      lightIntensity: 1,
      exposure: 1,
     });

    if(child.name.includes("glass")){
     child.material =  glassMaterial;
    }
  });
  scene.add(glb.scene);
});


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);

// Set camera position BEFORE initializing controls
camera.position.set(15.533069627498524, 11.13682887752479, 20.73329508529724);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.351325034240001, 2.996378043400515, 0.6428843280589502);
controls.update();

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));





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




scene.background = new THREE.Color(0xA0D8F1); // Light blue



function animate() {


}

const render = () => {

  controls.update();

   console.log(camera.position);
  // console.log("xxxxxxx");
  // console.log(controls.target);
 
  // animate fans
  xAxisFans.forEach((fan)=>{
    fan.rotation.x +=0.01;
  });

  // animate fans
  yAxisFans.forEach((fan)=>{
    fan.rotation.y +=0.01;
  });

  // animate fans
  zAxisFans.forEach((fan)=>{
    fan.rotation.z +=0.01;
  });

	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(raycasterObjects);

	for ( let i = 0; i < intersects.length; i ++ ) {

		intersects[ i ].object.material.color.set( 0xff0000 );

	}
  if(intersects.length>0){
    document.body.style.cursor = "pointer"
  }
  else
  {
    document.body.style.cursor = "default"
  }


  renderer.render( scene, camera );

  window.requestAnimationFrame(render);
};


render();
console.log("hallo")
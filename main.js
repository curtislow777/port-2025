import * as THREE from "three";
import "./style.scss";
import { OrbitControls } from "./src/utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const modals = {
  work: document.querySelector(".modal.work"),
  about: document.querySelector(".modal.about"),
  contact: document.querySelector(".modal.contact"),
};

// Modal functions
const showModal = (modal) => {
  if (!modal) return;
  modal.style.display = "block";
  gsap.set(modal, { opacity: 0 });

  gsap.to(modal, {
    opacity: 1,
    duration: 0.5,
  });
};

const hideModal = (modal) => {
  if (!modal) return;
  gsap.to(modal, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      modal.style.display = "none";
    },
  });
};

const xAxisFans = [];
const yAxisFans = [];
const zAxisFans = [];

const socialLinks = {
  Github: "https://github.com/curtislow777",
  LinkedIn: "https://www.linkedin.com/in/curtis-low/",
};

const animateScaleObjects = [];
const animateSpinObjects = [];
const keycapAnimateObjects = [];
const scaleLightsObjects = [];
const objects = {};

const raycasterObjects = [];
let currentIntersects = [];
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
// Specify path to a folder containing WASM/JS decoding libraries.

const loader = new GLTFLoader();

loader.setDRACOLoader(dracoLoader);
dracoLoader.setDecoderPath("/draco/");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; // NEW: color space
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/")
  .load([
    "px.webp", // Positive X
    "nx.webp", // Negative X
    "py.webp", // Positive Y
    "ny.webp", // Negative Y
    "pz.webp", // Positive Z
    "nz.webp", // Negative Z
  ]);

const textureMap = {
  one: {
    day: "/textures/day/AGX-Texture1.webp",
    night: "/textures/night/Night-Texture1.webp",
  },
  two: {
    day: "/textures/day/AGX-Texture2.webp",
    night: "/textures/night/Night-Texture2.webp",
  },
  three: {
    day: "/textures/day/AGX-Texture3.webp",
    night: "/textures/night/Night-Texture3.webp",
  },
  fourA: {
    day: "/textures/day/AGX-Texture4.webp",
    night: "/textures/night/Night-Texture4.webp",
  },
  fourB: {
    day: "/textures/day/AGX-Texture4.5.webp",
    night: "/textures/night/Night-Texture4.5.webp",
  },
  five: {
    day: "/textures/day/AGX-Texture5.webp",
    night: "/textures/night/Night-Texture5.webp",
  },
  sixA: {
    day: "/textures/day/AGX-Texture6.webp",
    night: "/textures/night/Night-Texture6.webp",
  },
  sixB: {
    day: "/textures/day/AGX-Texture6.5.webp",
    night: "/textures/night/Night-Texture6.5.webp",
  },

  seven: {
    day: "/textures/day/AGX-Texture7.webp",
    night: "/textures/night/Night-Texture7.webp",
  },
  eight: {
    day: "/textures/day/AGX-Texture8.webp",
    night: "/textures/night/Night-Texture8.webp",
  },
  nine: {
    day: "/textures/day/AGX-Texture9.webp",
    night: "/textures/night/Night-Texture9.webp",
  },
};

const loadedTextures = {
  day: {},
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
  if (meshName.includes("-one")) return "one";
  if (meshName.includes("-two")) return "two";
  if (meshName.includes("-three")) return "three";
  if (meshName.includes("-fourA")) return "fourA";
  if (meshName.includes("-fourB")) return "fourB";
  if (meshName.includes("-five")) return "five";
  if (meshName.includes("-sixA")) return "sixA";
  if (meshName.includes("-sixB")) return "sixB";
  if (meshName.includes("-seven")) return "seven";
  if (meshName.includes("-eight")) return "eight";
  if (meshName.includes("-nine")) return "nine";
  return null;
}

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    // Check if the object name contains any of the social media keywords
    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.toLowerCase().includes(key.toLowerCase())) {
        console.log(`Opening ${key} link: ${url}`);
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
    // Trigger spin animation if the object is in animateSpinObjects
    if (animateSpinObjects.includes(object)) {
      spinAnimation(object);
    }
  }
}

window.addEventListener("click", handleRaycasterInteraction);

loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      const textureKey = getTextureKeyFromName(child.name);
      if (textureKey) {
        const material = new THREE.MeshBasicMaterial({
          map: loadedTextures.day[textureKey],
        });

        // Clone the material so it’s independent and assign MeshBasicMaterial:
        child.material = material;

        if (child.name.includes("fan")) {
          if (child.name.includes("animateX")) {
            xAxisFans.push(child);
          } else if (child.name.includes("animateY")) {
            yAxisFans.push(child);
          } else {
            zAxisFans.push(child);
          }
        }

        if (child.name.includes("keycapAnimate")) {
          keycapAnimateObjects.push(child);
        }
        if (child.name.includes("animateScale")) {
          animateScaleObjects.push(child);
        }
        if (child.name.includes("animateSpin")) {
          animateSpinObjects.push(child);
        }
        if (child.name.includes("scaleLights")) {
          scaleLightsObjects.push(child);
        }
        if (child.name.includes("raycast")) {
          raycasterObjects.push(child);
        }
      }

      if (child.material.map) {
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
    });

    if (child.name.includes("glass")) {
      child.material = glassMaterial;
    }
  });
  scene.add(glb.scene);
  playIntroAnimation();
});

function playIntroAnimation() {
  const t1 = gsap.timeline({
    duration: 0.8,
    ease: "back.out(1.8)",
  });
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);

// Set camera position BEFORE initializing controls
camera.position.set(15.533069627498524, 11.13682887752479, 20.73329508529724);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 50;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI / 2; // Limit rotation to 180 degrees

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.351325034240001, 2.996378043400515, 0.6428843280589502);
controls.update();

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Event Listeners
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

scene.background = new THREE.Color(0xa0d8f1); // Light blue

const spinTimelines = new Map(); // Store spin timelines for each object
const spinDuration = 2; // Base duration for one spin (in seconds)
const spinAmount = Math.PI * 2; // Full 360-degree rotation

function spinAnimation(object) {
  let timeline = spinTimelines.get(object);
  let currentRotation = object.rotation.y;
  let newRotation = currentRotation + spinAmount;
  let duration = spinDuration;

  // Reset scale before starting the new animation
  gsap.to(object.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.2, // Reset back to original scale instantly
    onComplete: () => {
      if (timeline) {
        // Extend existing animation without changing the base duration
        const progress = timeline.progress();
        duration += timeline.duration() * (1 - progress); // Keep the base spin duration fixed
        timeline.clear(); // Clear queue instead of killing
      } else {
        // Create a new timeline
        timeline = gsap.timeline({
          onComplete: () => spinTimelines.delete(object),
        });
        spinTimelines.set(object, timeline);
      }

      // Apply the spin animation (this duration should remain constant)
      timeline.to(object.rotation, {
        y: newRotation,
        duration: spinDuration, // Keep it fixed for smooth rotation
        ease: "power1.out",
      });

      // Apply scaling feedback
      gsap.to(object.scale, {
        x: 1.1,
        y: 1.1,
        z: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    },
  });
}

function animate() {}

function render() {
  controls.update();

  // Rotate fans
  xAxisFans.forEach((fan) => {
    fan.rotation.x += 0.01;
  });

  yAxisFans.forEach((fan) => {
    fan.rotation.y += 0.01;
  });

  zAxisFans.forEach((fan) => {
    fan.rotation.z += 0.01;
  });

  // Update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);

  // Calculate objects intersecting the picking ray
  // Store intersections in the global variable
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  // Optional: Change color of intersected objects (for visual feedback)
  for (let i = 0; i < currentIntersects.length; i++) {
    // currentIntersects[i].object.material.color.set(0xff0000);
  }

  // Update cursor
  if (currentIntersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}

render();

import * as THREE from "three";
// Add this import at the top with your other imports
import "./style.scss";
import { OrbitControls } from "./src/utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { themeVertexShader, themeFragmentShader } from "./themeShader";

import gsap from "gsap";
import { Howl } from "howler";

// Outline post processing
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/**
 * START OF THREE.JS CODE
 * ---------------------------------------------------------------
 */

// Create a whiteboard toggle button
const whiteboardToggleBtn = document.createElement("button");
whiteboardToggleBtn.textContent = "Toggle Whiteboard";
whiteboardToggleBtn.style.position = "fixed";
whiteboardToggleBtn.style.top = "20px";
whiteboardToggleBtn.style.right = "20px";
whiteboardToggleBtn.style.padding = "10px 15px";
whiteboardToggleBtn.style.borderRadius = "5px";
whiteboardToggleBtn.style.backgroundColor = "#4CAF50";
whiteboardToggleBtn.style.color = "white";
whiteboardToggleBtn.style.border = "none";
whiteboardToggleBtn.style.cursor = "pointer";
whiteboardToggleBtn.style.zIndex = "100";
document.body.appendChild(whiteboardToggleBtn);

// Initialize whiteboard after your scene is loaded
let whiteboard;

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const modals = {
  work: document.querySelector(".work-modal"),
  about: document.querySelector(".about-modal"),
  contact: document.querySelector(".contact-modal"),
};

// Modal functions
let isModalOpen = true;
let hourHand;
let minuteHand;

const showModal = (modal) => {
  // Show overlay first
  overlay.style.display = "block";
  modal.style.display = "block";

  // Reset scale and opacity before animating
  gsap.fromTo(
    modal,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
  );

  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
};

const hideModal = (modal) => {
  isModalOpen = false;
  controls.enabled = true;

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.5,
  });

  gsap.to(modal, {
    opacity: 0,
    scale: 0,
    duration: 0.5,
    ease: "back.in(2)",
    onComplete: () => {
      modal.style.display = "none";
      overlay.style.display = "none";
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

// Add this in your main.js after initializing the GLTF loader, before or around when calling `loader.load`

const loadingScreen = document.querySelector(".loading-screen");
const loadingText = document.querySelector(".loading-text");
const loadingButton = document.querySelector(".loading-screen-btn");

// Track load progress
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = () => {
  console.log("Loading started");
  gsap.to(".loading-screen", { opacity: 1, duration: 1, ease: "power2.out" });
};

const loadingBarFill = document.querySelector(".loading-bar-fill");

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
  loadingBarFill.style.width = `${percent}%`;

  // Subtle pulsing while loading
  gsap.to(".loading-bar-fill", {
    scaleY: 1.05,
    repeat: -1,
    yoyo: true,
    duration: 0.5,
  });
};

loadingManager.onLoad = () => {
  // Stop pulsing
  gsap.killTweensOf(".loading-bar-fill");

  // Fade out loading bar, show button
  gsap.to(".loading-bar", { opacity: 0, duration: 0.5 });
  gsap.to(".loading-screen-btn", {
    opacity: 1,
    duration: 1,
    ease: "power2.out",
    delay: 0.3,
    onComplete: () => {
      loadingButton.classList.add("ready");
      loadingButton.style.pointerEvents = "auto";
    },
  });

  gsap.fromTo(
    ".loading-screen-btn",
    { scale: 0.9 },
    { scale: 1, duration: 0.5, ease: "bounce.out", delay: 0.5 }
  );
};

// Click Event: Only works after loading completes
loadingButton.addEventListener("click", () => {
  if (!loadingButton.classList.contains("ready")) return; // Prevent early clicks

  console.log("Enter clicked");

  gsap.to(".loading-screen", {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      loadingScreen.style.display = "none";
    },
  });
});

// Loaders
const textureLoader = new THREE.TextureLoader(loadingManager);
const dracoLoader = new DRACOLoader();

// Specify path to a folder containing WASM/JS decoding libraries.

const loader = new GLTFLoader(loadingManager);

let composer, outlinePass;
let selectedObjects = [];

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
    day: "/textures/day/Day-Texture1.webp",
    night: "/textures/night/Night-Texture1.webp",
  },
  two: {
    day: "/textures/day/Day-Texture2.webp",
    night: "/textures/night/Night-Texture2.webp",
  },
  three: {
    day: "/textures/day/Day-Texture3.webp",
    night: "/textures/night/Night-Texture3.webp",
  },
  fourA: {
    day: "/textures/day/Day-Texture4A.webp",
    night: "/textures/night/Night-Texture4A.webp",
  },
  fourB: {
    day: "/textures/day/Day-Texture4B.webp",
    night: "/textures/night/Night-Texture4B.webp",
  },
  five: {
    day: "/textures/day/Day-Texture5.webp",
    night: "/textures/night/Night-Texture5.webp",
  },
  sixA: {
    day: "/textures/day/Day-Texture6A.webp",
    night: "/textures/night/Night-Texture6A.webp",
  },
  sixB: {
    day: "/textures/day/Day-Texture6B.webp",
    night: "/textures/night/Night-Texture6B.webp",
  },

  seven: {
    day: "/textures/day/Day-Texture7.webp",
    night: "/textures/night/Night-Texture7.webp",
  },
  eight: {
    day: "/textures/day/Day-Texture8.webp",
    night: "/textures/night/Night-Texture8.webp",
  },
  nine: {
    day: "/textures/day/Day-Texture9.webp",
    night: "/textures/night/Night-Texture9.webp",
  },
  emissive: {
    day: "/textures/day/Dayfasdf-Emissive.webp",
    night: "/textures/night/Night-Emissive.webp",
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
  nightTexture.flipY = false;
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.generateMipmaps = true;
  nightTexture.minFilter = THREE.LinearMipmapLinearFilter;
  nightTexture.magFilter = THREE.LinearFilter;
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
  if (meshName.includes("-emissive")) return "emissive";

  return null;
}

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    // Open modals based on object names
    if (object.name.includes("contact-raycast")) {
      showModal(modals.contact);
    } else if (object.name.includes("about-raycast")) {
      showModal(modals.about);
    } else if (object.name.includes("work-raycast")) {
      showModal(modals.work);
    }

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

let uMixRatio = { value: 0 }; // shared uniform for all shader materials

loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      const textureKey = getTextureKeyFromName(child.name);

      if (textureKey) {
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uDayTexture: { value: loadedTextures.day[textureKey] },
            uNightTexture: { value: loadedTextures.night[textureKey] },
            uMixRatio: uMixRatio, // shared reference
          },
          vertexShader: themeVertexShader,
          fragmentShader: themeFragmentShader,
        });
        // if (textureKey) {
        //   const material = new THREE.MeshBasicMaterial({
        //     map: loadedTextures.day[textureKey],
        //   });

        // Clone the material so it’s independent and assign MeshBasicMaterial:
        child.material = material;

        if (child.name.includes("fan")) {
          if (child.name.includes("animateX")) {
            xAxisFans.push(child);
          } else if (child.name.includes("animateY")) {
            yAxisFans.push(child);
          } else if (child.name.includes("animateZ")) {
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

      if (child.name.includes("minute-hand")) {
        minuteHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }

      if (child.name.includes("hour-hand")) {
        hourHand = child;
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
      }
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

const sound = new Howl({
  //  src: ["audio/imok.ogg"],
  src: ["audio/moving.ogg"],
  loop: true,
  volume: 0,
  onplay: () => console.log("audio playing"),
});

sound.play();
// Set camera position BEFORE initializing controls
camera.position.set(15.533069627498524, 11.13682887752479, 20.73329508529724);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0;
controls.maxDistance = 50;
// controls.minPolarAngle = 0;
// controls.maxPolarAngle = Math.PI / 2;
// controls.minAzimuthAngle = 0;
// controls.maxAzimuthAngle = Math.PI / 2; // Limit rotation to 180 degrees

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-0.351325034240001, 2.996378043400515, 0.6428843280589502);
controls.update();

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function setupPostProcessing() {
  // Create a new EffectComposer
  composer = new EffectComposer(renderer);

  // Add the render pass which renders the scene with the camera
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // Create an outline pass and add it to the composer
  outlinePass = new OutlinePass(
    new THREE.Vector2(sizes.width, sizes.height),
    scene,
    camera
  );

  // -- CHANGED LINES BELOW --
  outlinePass.edgeStrength = 5.0; // was 3.0
  outlinePass.edgeThickness = 2.0; // was 1.0
  outlinePass.edgeGlow = 0.0; // unchanged value, but shown here for clarity
  outlinePass.pulsePeriod = 0; // unchanged value, but shown here for clarity
  outlinePass.usePatternTexture = false; // added line (prevents patterned outlines)
  outlinePass.visibleEdgeColor.set("#ffffff"); // unchanged color
  outlinePass.hiddenEdgeColor.set("#ffffff"); // was "#190a05"
  // -- CHANGED LINES ABOVE --

  composer.addPass(outlinePass);

  // Add an output pass as the final pass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);
}

// Call the setup function after creating your renderer
setupPostProcessing();

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

  composer.setSize(sizes.width, sizes.height);
});

scene.background = new THREE.Color(0xe8e8e8); // Light blue

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

/**  -------------------------- Render and Animations Stuff -------------------------- */
const clock = new THREE.Clock();

const updateClockHands = () => {
  if (!hourHand || !minuteHand) return;

  const now = new Date();
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

  const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);

  minuteHand.rotation.z = -minuteAngle;
  hourHand.rotation.z = -hourAngle;
};

function render() {
  controls.update();

  // Update Clock hand rotation
  updateClockHands();

  // Rotate fans
  xAxisFans.forEach((fan) => {
    fan.rotation.x -= 0.05;
  });
  yAxisFans.forEach((fan) => {
    fan.rotation.y -= 0.05;
  });
  zAxisFans.forEach((fan) => {
    fan.rotation.z -= 0.05;
  });

  // Update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);

  if (currentIntersects.length > 0) {
    const selectedObject = currentIntersects[0].object;
    selectedObjects = [selectedObject];
    outlinePass.selectedObjects = selectedObjects;
    document.body.style.cursor = "pointer";
  } else {
    // -- ADDED LINES TO CLEAR ANY PREVIOUS HOVER SELECTION --
    selectedObjects = [];
    outlinePass.selectedObjects = [];
    document.body.style.cursor = "default";
  }

  // Add this temporarily to your hover detection
  if (currentIntersects.length > 0) {
    const selectedObject = currentIntersects[0].object;

    // ...rest of your code
  }

  composer.render();
  window.requestAnimationFrame(render);
}

let isNight = false;

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "t") {
    isNight = !isNight;

    // Animate uMixRatio between 0 (day) and 1 (night)
    gsap.to(uMixRatio, {
      value: isNight ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });

    console.log(`Theme switched to: ${isNight ? "Night" : "Day"}`);
  }
});

render();

// Get overlay and close buttons
const overlay = document.querySelector(".overlay");
const closeButtons = document.querySelectorAll(".modal-close-btn");

// Handle modal close on overlay click
overlay.addEventListener("click", () => {
  Object.values(modals).forEach((modal) => {
    if (modal.style.display === "block") {
      hideModal(modal);
    }
  });
});

// Handle close button click
closeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = btn.closest(".modal");
    hideModal(modal);
  });
});

// Optional: Buttons to trigger modals for testing
document.getElementById("openWork")?.addEventListener("click", () => {
  showModal(modals.work);
});
document.getElementById("openAbout")?.addEventListener("click", () => {
  showModal(modals.about);
});
document.getElementById("openContact")?.addEventListener("click", () => {
  showModal(modals.contact);
});

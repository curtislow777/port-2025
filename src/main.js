import * as THREE from "three";
import { initThreeJS } from "./scripts/scene.js";

// Add this import at the top with your other imports
import "./style.scss";
import Whiteboard from "./utils/whiteboard.js";

import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { themeVertexShader, themeFragmentShader } from "../themeShader.js";

import gsap from "gsap";
import { Howl } from "howler";

import CameraManager from "./scripts/camera.js";

import { setupPerryCupAnimation } from "./scripts/perryCup.js";
import { randomOink } from "./scripts/pig.js";
import { setupMailbox } from "./scripts/mailbox.js";
import { processFanObject, updateFans } from "./scripts/fanRotation.js";
import { spinAnimation } from "./scripts/spinnyObjects.js"; // <-- Import from new script

import ClockManager from "./scripts/clock.js";
import {
  setupHoverOutline,
  updateOutlineHover,
} from "./scripts/hoverOutline.js";
import { initModalSystem } from "./scripts/modal.js";

/**
 * START OF THREE.JS CODE
 * ---------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {});

let perryCupControls = null;

const clockManager = new ClockManager();

// Get the buttons
const themeToggle = document.getElementById("theme-toggle");
const soundToggle = document.getElementById("sound-toggle");
const body = document.body;

let isNight = false;

let perryHatObject = null;
let pigObject = null;
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "t") {
    isNight = !isNight;

    // Animate uMixRatio between 0 (day) and 1 (night)
    gsap.to(uMixRatio, {
      value: isDarkMode ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }
});

// Initialize state
let isDarkMode = false;
let isMuted = false;
/** Initialize modal system */
const {
  overlay,
  modals, // { work, about, contact } as defined in modalSelectors
  showModal,
  hideModal,
  hideAllModals,
} = initModalSystem({
  overlaySelector: ".overlay",
  modalSelectors: {
    work: ".work-modal",
    about: ".about-modal",
    contact: ".contact-modal",
  },
  closeButtonSelector: ".modal-close-btn",
  // Optionally pass callbacks to disable/enable OrbitControls
  onModalOpen: () => {
    cameraManager.enableControls();
  },
  onModalClose: () => {
    cameraManager.disableControls();
  },
});
// Theme toggle functionality with GSAP animation
themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;

  // Update UI
  themeToggle.innerHTML = isDarkMode
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';

  body.classList.toggle("dark-theme", isDarkMode);
  body.classList.toggle("light-theme", !isDarkMode);

  updateThreeJSTheme();
});

// Sound toggle functionality (unchanged)
soundToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  if (isMuted) {
    soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    // If you need to mute sound in your Three.js scene
    if (window.muteSound && typeof window.muteSound === "function") {
      window.muteSound();
    }
  } else {
    soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
    // If you need to unmute sound in your Three.js scene
    if (window.unmuteSound && typeof window.unmuteSound === "function") {
      window.unmuteSound();
    }
  }
});
// Sound toggle functionality
soundToggle.addEventListener("click", () => {
  isMuted = !isMuted;

  if (isMuted) {
    soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';

    // If you need to mute sound in your Three.js scene
    if (window.muteSound && typeof window.muteSound === "function") {
      window.muteSound();
    }
  } else {
    soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';

    // If you need to unmute sound in your Three.js scene
    if (window.unmuteSound && typeof window.unmuteSound === "function") {
      window.unmuteSound();
    }
  }
});

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Modal functions
let isModalOpen = false;

let whiteboard;

// Create a modal system object to pass to the mailbox module
const modalSystem = {
  showModal: showModal,
  hideModal: hideModal,
};

const socialLinks = {
  Github: "https://github.com/curtislow777",
  LinkedIn: "https://www.linkedin.com/in/curtis-low/",
};

const animatedObjects = {
  spin: [],
  scale: [],
  scaleLights: [],
  keycaps: [],
  lights: [],
};

const raycasterObjects = [];
let currentIntersects = [];

// Loaders

let selectedObjects = [];

// Get the scene/camera/renderer from init
const {
  scene,
  camera,
  renderer,
  pointer,
  raycaster,
  loadingManager,
  textureLoader,
  gltfLoader,
} = initThreeJS(canvas, sizes);
const { composer, outlinePass } = setupHoverOutline(
  renderer,
  scene,
  camera,
  sizes
);

// 2) Create CameraManager
// Provide the camera, renderer, and desired initial position/target
const cameraManager = new CameraManager(
  camera,
  renderer,
  new THREE.Vector3(15.53, 11.14, 20.73), // default camera position
  new THREE.Vector3(-0.35, 3.0, 0.64) // default camera target
);

const dracoLoader = new DRACOLoader();
const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);
dracoLoader.setDecoderPath("/draco/");

// usage

const loadingScreen = document.querySelector(".loading-screen");
const loadingButton = document.querySelector(".loading-screen-btn");

loadingManager.onStart = () => {
  gsap.to(".loading-screen", { opacity: 1, duration: 1, ease: "power2.out" });
};

const loadingBarFill = document.querySelector(".loading-bar-fill");

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
  loadingBarFill.style.width = `${percent}%`;
  gsap.to(".loading-bar-fill", {
    scaleY: 1.05,
    repeat: -1,
    yoyo: true,
    duration: 0.5,
  });
};

loadingManager.onLoad = () => {
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

loadingButton.addEventListener("click", () => {
  if (!loadingButton.classList.contains("ready")) return; // Prevent early clicks
  gsap.to(".loading-screen", {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      loadingScreen.style.display = "none";
    },
  });
});

function loadGlassEnvironmentMap(
  path = "textures/skybox/",
  files = ["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]
) {
  const loader = new THREE.CubeTextureLoader().setPath(path);
  const cubeMap = loader.load(files);

  cubeMap.colorSpace = THREE.SRGBColorSpace;
  cubeMap.magFilter = THREE.LinearFilter;
  cubeMap.minFilter = THREE.LinearMipmapLinearFilter;
  cubeMap.generateMipmaps = true;
  cubeMap.needsUpdate = true;

  return cubeMap;
}
const glassEnvMap = loadGlassEnvironmentMap();

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

function loadTexture(path) {
  const tex = textureLoader.load(path);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

Object.entries(textureMap).forEach(([key, paths]) => {
  loadedTextures.day[key] = loadTexture(paths.day);
  loadedTextures.night[key] = loadTexture(paths.night);
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

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    if (object.name.includes("about-raycast")) {
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

    if (object.name.includes("whiteboard-raycast")) {
      console.log("Whiteboard clicked!");
      cameraManager.zoomToWhiteboard(whiteboard, 1.5);
      whiteboard.toggleWhiteboardMode(true); // Enable drawing mode
    }

    // Add this new condition with your other click handlers
    if (object.name.includes("perry-hat")) {
      if (perryCupControls) {
        perryCupControls.toggleLid();
      }
    }
    if (object.name.includes("pig-head")) {
      randomOink(pigObject);
    }

    if (mailbox.handleRaycastIntersection(object, modals.contact)) {
      return;
    }
    // Trigger spin animation if the object is in animateSpinObjects
    if (animatedObjects.spin.includes(object)) {
      spinAnimation(object);
    }
  }
}

window.addEventListener("mousemove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", handleRaycasterInteraction);

let uMixRatio = { value: 0 }; // shared uniform for all shader materials
const mailbox = setupMailbox(scene, modalSystem);

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
        processFanObject(child);

        if (child.name.includes("keycapAnimate")) {
          animatedObjects.keycaps.push(child);
        }
        if (child.name.includes("animateScale")) {
          animatedObjects.scale.push(child);
        }
        if (child.name.includes("animateSpin")) {
          animatedObjects.spin.push(child);
        }
        if (child.name.includes("scaleLights")) {
          animatedObjects.scaleLights.push(child);
        }
        if (child.name.includes("raycast")) {
          raycasterObjects.push(child);
        }

        mailbox.processMailboxObject(child);

        if (child.name.includes("pig-head")) {
          pigObject = child;
        }
        if (child.name.includes("perry-hat")) {
          perryHatObject = child;

          // Initialize the cup animation right after finding the object
          perryCupControls = setupPerryCupAnimation(perryHatObject);
        }
      }

      if (child.material.map) {
        child.material.map.minFilter = THREE.LinearFilter;
      }

      if (child.name.includes("hour-hand")) {
        clockManager.setHourHand(child);
      }
      if (child.name.includes("minute-hand")) {
        clockManager.setMinuteHand(child);
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
      envMap: glassEnvMap,
      envMapIntensity: 1,
    });

    if (child.name.includes("glass")) {
      child.material = glassMaterial;
    }
  });
  scene.add(glb.scene);

  playIntroAnimation();
});

const sound = new Howl({
  //  src: ["audio/imok.ogg"],
  src: ["audio/moving.ogg"],
  loop: true,
  volume: 0.0,
  onplay: () => console.log("audio playing"),
});

sound.play();

whiteboard = new Whiteboard(scene, camera, renderer, cameraManager.controls);
whiteboard.setPosition(-5.8, 4.12675142288208, 0.121265381);
whiteboard.setRotation(0, Math.PI / 2, 0);

function animate() {}

/**  -------------------------- Render and Animations Stuff -------------------------- */

// Update Three.js theme
function updateThreeJSTheme() {
  // Animate uMixRatio for shader blending
  gsap.to(uMixRatio, {
    value: isDarkMode ? 1 : 0,
    duration: 1.5,
    ease: "power2.inOut",
  });
}

const clock = new THREE.Clock();

function playIntroAnimation() {
  const t1 = gsap.timeline({
    duration: 0.8,
    ease: "back.out(1.8)",
  });
}

function render() {
  cameraManager.update();

  // Rotate fans
  updateFans();
  // Update clock local time
  clockManager.updateClockHands();

  mailbox.updateMailboxHover(currentIntersects);

  // Update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);
  currentIntersects = raycaster.intersectObjects(raycasterObjects);
  currentIntersects = updateOutlineHover(
    raycaster,
    pointer,
    camera,
    raycasterObjects,
    outlinePass
  );

  // Update whiteboard if it exists and is active
  if (whiteboard && whiteboard.isActive) {
    whiteboard.update();
  }

  composer.render();
  window.requestAnimationFrame(render);
}

render();

// Get overlay and close buttons
const closeButtons = document.querySelectorAll(".modal-close-btn");

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

document.addEventListener("DOMContentLoaded", function () {
  const hamburgerBtn = document.querySelector(".hamburger-btn");
  const sidePanel = document.querySelector(".side-panel");
  const panelLinks = document.querySelectorAll(".panel-link");

  // Toggle panel and hamburger icon
  hamburgerBtn.addEventListener("click", () => {
    hamburgerBtn.classList.toggle("active");
    sidePanel.classList.toggle("active");
  });

  // Close panel when clicking a link
  panelLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburgerBtn.classList.remove("active");
      sidePanel.classList.remove("active");
    });
  });

  // Close panel when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !sidePanel.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      sidePanel.classList.contains("active")
    ) {
      hamburgerBtn.classList.remove("active");
      sidePanel.classList.remove("active");
    }
  });
});

document.addEventListener("keydown", (event) => {
  switch (event.key.toLowerCase()) {
    case "o":
      // Zoom to whiteboard, enabling drawing mode
      cameraManager.zoomToWhiteboard(whiteboard, 1.5);
      break;

    case "p":
      // Reset to default camera, disabling drawing
      cameraManager.leaveWhiteboard(whiteboard, 1.5);
      break;
  }
});

// // Function to zoom camera to exact position and rotation
// function zoomToWhiteboard(duration = 2, cb = null) {
//   cameraManager.disableControls();

//   const direction = new THREE.Vector3(0, 0, -1);
//   direction.applyEuler(whiteboardZoomTarget.rotation);

//   const targetPoint = new THREE.Vector3().copy(whiteboardZoomTarget.position);
//   targetPoint.add(direction.multiplyScalar(5));

//   const timeline = gsap.timeline({
//     onComplete: () => {
//       if (cb && typeof cb === "function") cb();
//     },
//   });

//   timeline.to(
//     camera.position,
//     {
//       x: whiteboardZoomTarget.position.x,
//       y: whiteboardZoomTarget.position.y,
//       z: whiteboardZoomTarget.position.z,
//       duration: duration,
//       ease: "power3.inOut",
//     },
//     0
//   );

//   timeline.to(
//     camera.rotation,
//     {
//       x: whiteboardZoomTarget.rotation.x,
//       y: whiteboardZoomTarget.rotation.y,
//       z: whiteboardZoomTarget.rotation.z,
//       duration: duration,
//       ease: "power3.inOut",
//     },
//     0
//   );

//   timeline.to(
//     controls.target,
//     {
//       x: targetPoint.x,
//       y: targetPoint.y,
//       z: targetPoint.z,
//       duration: duration,
//       ease: "power3.inOut",
//       onUpdate: () => controls.update(),
//     },
//     0
//   );

//   return timeline;
// }

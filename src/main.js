import * as THREE from "three";
import gsap from "gsap";
import { initThreeJS } from "./scripts/scene.js";

// Add this import at the top with your other imports
import "./style.scss";

import Whiteboard from "./scripts/utils/whiteboard.js";
import AudioManager from "./scripts/audio.js";
import CameraManager from "./scripts/camera.js";
import ClockManager from "./scripts/clock.js";
import ThemeManager from "./scripts/themeManager.js"; // Add this import
import { createSteamEffect } from "./scripts/shaders/steamEffect.js"; // Import the steam effect function

import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { setupPerryCupAnimation } from "./scripts/perryCup.js";
import { randomOink } from "./scripts/pig.js";
import { setupMailbox } from "./scripts/mailbox.js";
import { processFanObject, updateFans } from "./scripts/fanRotation.js";
import { spinAnimation } from "./scripts/spinnyObjects.js";

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
const themeManager = new ThemeManager();

// Get the buttons
const themeToggle = document.getElementById("theme-toggle");
const soundToggle = document.getElementById("sound-toggle");
const body = document.body;

let perryHatObject = null;
let pigObject = null;

// Initialize state
let isDarkMode = false;
let isMuted = false;
/** Initialize modal system */
const { overlay, modals, showModal, hideModal, hideAllModals } =
  initModalSystem({
    overlaySelector: ".overlay",
    modalSelectors: {
      work: ".work-modal",
      about: ".about-modal",
      contact: ".contact-modal",
      erhu: ".erhu-modal",
    },
    closeButtonSelector: ".modal-close-btn",
    onModalOpen: () => {
      cameraManager.handleModalState(true); // Disable controls when modal opens
    },
    onModalClose: () => {
      cameraManager.handleModalState(false); // Enable controls when modal closes
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

  themeManager.updateThreeJSTheme();
});

soundToggle.addEventListener("click", () => {
  isMuted = !isMuted;

  if (isMuted) {
    soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';

    // Pause BGM
    AudioManager.pauseBGM();
  } else {
    soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';

    AudioManager.playBGM(0.3);
  }
});

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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
AudioManager.playBGM(0); // Plays BGM at 30% volume

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
const { textureMap, loadedTextures } =
  themeManager.loadAllTextures(textureLoader);

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
  if (!loadingButton.classList.contains("ready")) return;
  gsap.to(".loading-screen", {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      loadingScreen.style.display = "none";
    },
  });
});

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

    if (object.name.includes("about-raycast")) {
      showModal(modals.about);
    } else if (object.name.includes("work-raycast")) {
      showModal(modals.work);
    } else if (object.name.includes("erhu-seven")) {
      showModal(modals.erhu);
    } else if (object.name.includes("monitor")) {
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
        toggleSteam(steamMesh, 1);
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

const mailbox = setupMailbox(scene, modalSystem);

// Update the GLB loading section to use ThemeManager:
loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      // Try to process as themed mesh first
      const isThemedMesh = themeManager.processThemedMesh(
        child,
        loadedTextures
      );

      if (isThemedMesh) {
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

      // Process glass material
      themeManager.processGlassMesh(child);
    }
  });
  scene.add(glb.scene);

  playIntroAnimation();
});

whiteboard = new Whiteboard(scene, camera, renderer, cameraManager.controls);
whiteboard.setPosition(-5.8, 4.12675142288208, 0.121265381);
whiteboard.setRotation(0, Math.PI / 2, 0);
// near the top of main.js

function animate() {}

let steamMesh; // Make sure to declare this at top-level so render() can see it

textureLoader.load("/images/perlin.png", (perlinTexture) => {
  perlinTexture.wrapS = THREE.RepeatWrapping;
  perlinTexture.wrapT = THREE.RepeatWrapping;

  // Create the steam effect plane
  steamMesh = createSteamEffect(perlinTexture, {
    width: 4,
    height: 8,
    segments: 32,
  });

  // Position it in your scene
  steamMesh.position.set(0, 10, 0);

  // Add to scene
  scene.add(steamMesh);
});

/**  -------------------------- Render and Animations Stuff -------------------------- */
// Update Three.js theme

const clock = new THREE.Clock();

function playIntroAnimation() {
  const t1 = gsap.timeline({
    duration: 0.8,
    ease: "back.out(1.8)",
  });
}

function render() {
  cameraManager.update();
  const elapsedTime = clock.getElapsedTime();

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

  // If steamMesh is loaded, update time + orientation
  if (steamMesh) {
    steamMesh.material.uniforms.uTime.value = elapsedTime;
    steamMesh.lookAt(camera.position); // If you want a billboard
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

  panelLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      const label = link.textContent.trim().toLowerCase();
      hamburgerBtn.classList.remove("active");
      sidePanel.classList.remove("active");
      switch (label) {
        case "reset camera":
          cameraManager.resetToDefault();
          break;
        case "work":
          showModal(modals.work);
          break;
        case "about":
          showModal(modals.about);
          break;
        case "contact":
          showModal(modals.contact);
          break;
        case "whiteboard":
          cameraManager.zoomToWhiteboard(whiteboard, 1.5);
          break;
        default:
          console.log(`No action defined for ${label}`);
          break;
      }
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

/**
 * Toggles the steam mesh's visibility by fading its alpha in or out.
 * If the mesh is currently invisible, it fades in.
 * If it's visible, it fades out.
 *
 * @param {THREE.Mesh} steamMesh - The mesh from createSteamEffect.
 * @param {number} [duration=0.5] - Fade duration in seconds.
 * @param {Function} [onComplete] - Optional callback after fade completes.
 */
function toggleSteam(steamMesh, duration = 0.5, onComplete) {
  if (!steamMesh) return;

  const material = steamMesh.material;
  if (!material.uniforms || !material.uniforms.uGlobalAlpha) return;

  // Check if it's currently visible
  const currentlyVisible = steamMesh.visible;

  if (!currentlyVisible) {
    // It's hidden, so fade in from 0 to 1
    steamMesh.visible = true;
    // Ensure alpha is at 0 so it can fade in
    material.uniforms.uGlobalAlpha.value = 0;
    gsap.to(material.uniforms.uGlobalAlpha, {
      value: 1,
      duration,
      onComplete,
    });
  } else {
    // It's visible, so fade out from current alpha to 0
    gsap.to(material.uniforms.uGlobalAlpha, {
      value: 0,
      duration,
      onComplete: () => {
        steamMesh.visible = false;
        if (onComplete) onComplete();
      },
    });
  }
}

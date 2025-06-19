import * as THREE from "three";
import gsap from "gsap";

// Core imports
import EventHandler from "./scripts/core/EventHandler.js";
import { initializeAll } from "./scripts/core/Initializer.js";
import { initializeUI } from "./scripts/ui/UIInitializer.js";
import "./style.scss";
import RaycasterController from "./scripts/core/RaycasterController.js";
import createRenderLoop from "./scripts/core/RenderLoop.js";
import { setupLoadingScreen } from "./scripts/ui/LoadingManager.js";
import {
  initModalOverlay,
  initSidePanel,
  initBackButton,
} from "./scripts/ui/UIHandlers.js";
// Application State
import appState from "./scripts/core/AppState.js";
import { processScene } from "./scripts/core/SceneProcessor.js";
// Singleton Managers
import themeManager from "./scripts/themeManager.js";
import audioManager from "./scripts/audio.js";

// Features

import { initImageOverlay } from "./scripts/fadeOverlayImage.js";
import { createSteamEffect } from "./scripts/shaders/steamEffect.js";

// Configuration
import {
  imageData,
  socialLinks,
  CANVAS_CONFIG,
  CAMERA_CONFIG,
  WHITEBOARD_CONFIG,
  INNER_WEB_CONFIG,
  STEAM_CONFIG,
  MODAL_SELECTORS,
  IMAGE_OVERLAY_SELECTORS,
  LOADING_SELECTORS,
  SIDE_PANEL_SELECTORS,
  ANIMATION_DURATIONS,
  MODEL_PATHS,
  BUTTON_IDS,
} from "./scripts/config/constants.js";

import { IntroTutorial } from "./scripts/ui/IntroTutorial.js";

// Add to your main initialization (around line where you setup other components)
let introTutorial = null;
/**
 * ===================================================================
 * LOADING MANAGER SETUP
 * ===================================================================
 */

/**
 * ===================================================================
 * SCENE LOADING
 * ===================================================================
 */

function loadScene() {
  appState.gltfLoader.load("/models/room-port-v1.glb", (glb) => {
    processScene(glb.scene);
    appState.scene.add(glb.scene);
    initializeTutorial();

    playIntroAnimation();
  });
}

// New function to initialize the tutorial system
function initializeTutorial() {
  // Make sure raycaster controller is available
  if (!appState.raycasterController) {
    console.warn(
      "RaycasterController not available yet, tutorial may not work properly"
    );
  }

  introTutorial = new IntroTutorial({
    scene: appState.scene,
    camera: appState.camera,
    renderer: appState.renderer,
    raycasterController: appState.raycasterController,
  });
  appState.introTutorial = introTutorial;

  // Customize tutorial steps based on your scene objects
  // Update these positions and object names to match your actual scene
  introTutorial.setSteps([
    {
      target: "monitor-four-raycast", // Match your object names
      worldPosition: new THREE.Vector3(1.5, 1.2, -0.8), // Adjust to your computer position
      message: "Click on the computer to see my portfolio work!",
      duration: 3500,
      highlightObject: true,
    },
    {
      target: "about-raycast-emissive-raycast",
      worldPosition: new THREE.Vector3(-1.8, 1.4, 0.2), // Adjust to your poster/frame position
      message: "Check out my info on the wall",
      duration: 3000,
      highlightObject: true,
    },
    {
      target: "erhu-seven-raycast",
      worldPosition: new THREE.Vector3(0.5, 0.3, 1.2), // Adjust to your erhu position
      message: "I play the Erhu! Click to learn more about my musical journey",
      duration: 3500,
      highlightObject: true,
    },
    {
      target: "mailbox-pole-seven-contact-raycast",
      worldPosition: new THREE.Vector3(2.2, 0.8, 0.5), // Adjust to your mailbox position
      message: "Send me a message! Click the mailbox to get in touch",
      duration: 3000,
      highlightObject: true,
    },
    {
      target: null, // General exploration
      worldPosition: new THREE.Vector3(0, 1, 0), // Center of room
      message:
        "Explore the room! Right-click and drag to look around, scroll to zoom",
      duration: 4000,
      highlightObject: false,
    },
  ]);
}

// Optional: Add a way to restart tutorial
function restartTutorial() {
  if (introTutorial) {
    introTutorial.start();
  }
}

// Optional: Add keyboard shortcut to restart tutorial
document.addEventListener("keydown", (event) => {
  if (event.key === "T" && event.ctrlKey) {
    // Ctrl+T to restart tutorial
    event.preventDefault();
    restartTutorial();
  }
});
/**
 * ===================================================================
 * STEAM EFFECT
 * ===================================================================
 */

function setupSteamEffect() {
  appState.textureLoader.load(STEAM_CONFIG.texture.src, (tex) => {
    tex.wrapS = STEAM_CONFIG.texture.wrapS;
    tex.wrapT = STEAM_CONFIG.texture.wrapT;
    const steamMesh = createSteamEffect(tex, STEAM_CONFIG.geometry);
    steamMesh.position.copy(STEAM_CONFIG.position);
    appState.setSteamMesh(steamMesh);
    appState.scene.add(steamMesh);
  });
}

/**
 * Toggle steam effect visibility
 */
function toggleSteam(steamMesh, duration = 0.5) {
  if (!steamMesh) return;

  const mat = steamMesh.material;
  if (!mat.uniforms?.uGlobalAlpha) return;

  const fadeIn = !steamMesh.visible;
  const target = fadeIn ? 1 : 0;

  gsap.killTweensOf(mat.uniforms.uGlobalAlpha);

  if (fadeIn) mat.uniforms.uGlobalAlpha.value = 0;

  gsap.to(mat.uniforms.uGlobalAlpha, {
    value: target,
    duration: duration,
    ease: "none",
    onStart: () => {
      if (fadeIn) steamMesh.visible = true;
    },
    onComplete: () => {
      if (!fadeIn) steamMesh.visible = false;
    },
  });
}

/**
 * ===================================================================
 * ANIMATIONS
 * ===================================================================
 */

// Modify your playIntroAnimation function to include tutorial
function playIntroAnimation() {
  const t1 = gsap.timeline({
    duration: 0.8,
    ease: "back.out(1.8)",
    onComplete: () => {
      // Start tutorial after intro animation completes
      if (introTutorial) {
        introTutorial.start();
      }
    },
  });
  // Add your existing intro animation here
}

/**
 * ===================================================================
 * RENDER LOOP
 * ===================================================================
 */

/**
 * ===================================================================
 * EVENT LISTENERS SETUP
 * ===================================================================
 */

function setupEventListeners() {
  // Event handlers
  const handlers = new EventHandler({
    themeButton: document.getElementById(BUTTON_IDS.themeToggle),
    soundButton: document.getElementById(BUTTON_IDS.soundToggle),
    backButton: document.getElementById(BUTTON_IDS.backButton),
    themeManager,
    audioManager,
    body: document.body,
    camera: appState.camera,
    renderer: appState.renderer,
    innerWeb: appState.innerWeb,
    composer: appState.composer,
    sizes: appState.sizes,
    cameraManager: appState.cameraManager,
    whiteboard: appState.whiteboard,
    loadingButton: document.querySelector(LOADING_SELECTORS.button),
    pointer: appState.pointer,
  });

  handlers.registerThemeToggle();
  handlers.registerSoundToggle();
  handlers.registerResize();
  handlers.registerKeyboard();
  handlers.registerLoadingButton();
  handlers.registerPointerMove();

  initModalOverlay();
  initSidePanel();
  initBackButton();
  console.log("Event listeners set up");
}

/**
 * ===================================================================
 * MAIN INITIALIZATION
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize core components using the new Initializer
  initializeAll();

  // Initialize UI and other components
  initializeUI();

  /* ──────────────────────────────────────────────
   Image overlay → toggle the ray-caster
   ────────────────────────────────────────────── */
  const { showImageOverlay, hideImageOverlay } = initImageOverlay({
    onOpen: () => appState.disableRaycast(),
    onClose: () => appState.enableRaycast(),
  });

  // Make it available to the rest of the app
  appState.showImageOverlay = showImageOverlay;
  appState.hideImageOverlay = hideImageOverlay;
  // create controller (camera & empty list for now)
  const rayCtrl = new RaycasterController(
    appState.camera,
    appState.raycasterObjects,
    {
      outlinePass: appState.outlinePass,
      scaleTargets: appState.animatedObjects.scale,
      mailbox: appState.mailbox,
    }
  );

  appState.setRaycasterController(rayCtrl);

  setupLoadingScreen();
  setupEventListeners();

  // Load scene and start render loop
  loadScene();
  setupSteamEffect();
  // right after setupSteamEffect() or wherever you want the loop to begin
  const renderLoop = createRenderLoop({ introTutorial });
  renderLoop.start();
});

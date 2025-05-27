import * as THREE from "three";
import gsap from "gsap";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Core imports
import { initThreeJS } from "./scripts/scene.js";
import EventHandler from "./scripts/core/EventHandler.js";
import "./style.scss";

// Singleton Managers
import themeManager from "./scripts/themeManager.js";
import audioManager from "./scripts/audio.js";
import clockManager from "./scripts/clock.js";

// Components
import Whiteboard from "./scripts/utils/whiteboard.js";
import CameraManager from "./scripts/camera.js";
import { createSteamEffect } from "./scripts/shaders/steamEffect.js";

// Features
import { setupPerryCupAnimation } from "./scripts/perryCup.js";
import { randomOink } from "./scripts/pig.js";
import { setupMailbox } from "./scripts/mailbox.js";
import {
  processRotatingObject,
  updateRotatingObjects,
} from "./scripts/objectRotation.js";
import { spinAnimation } from "./scripts/spinnyObjects.js";
import {
  setupHoverOutline,
  updateOutlineHover,
} from "./scripts/hoverOutline.js";
import { updateHoverScale } from "./scripts/hoverScale.js";
import { initModalSystem } from "./scripts/modal.js";
import { initImageOverlay } from "./scripts/fadeOverlayImage.js";
import { initInnerWeb } from "./scripts/innerWeb.js";

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

/**
 * ===================================================================
 * GLOBAL VARIABLES & STATE
 * ===================================================================
 */

// Application state
let isRaycastEnabled = true;
let currentIntersects = [];

// Scene objects
let perryHatObject = null;
let pigObject = null;
let perryCupControls = null;
let steamMesh = null;
let whiteboard = null;

// Collections
const animatedObjects = {
  spin: [],
  scale: [],
  scaleLights: [],
  keycaps: [],
  lights: [],
};
const raycasterObjects = [];

// Core Three.js components
let scene,
  camera,
  renderer,
  pointer,
  raycaster,
  loadingManager,
  textureLoader,
  gltfLoader;
let composer, outlinePass;

// Managers
let cameraManager;
let innerWeb;
let mailbox;

// UI components
let overlay, modals, showModal, hideModal;
let showImageOverlay, hideImageOverlay;

// Other
const canvas = document.querySelector(CANVAS_CONFIG.selector);
const sizes = { width: window.innerWidth, height: window.innerHeight };
const clock = new THREE.Clock();

/**
 * ===================================================================
 * INITIALIZATION FUNCTIONS
 * ===================================================================
 */

/**
 * Initialize Three.js core components
 */
function initializeThreeJS() {
  const threeJSComponents = initThreeJS(canvas, sizes);
  scene = threeJSComponents.scene;
  camera = threeJSComponents.camera;
  renderer = threeJSComponents.renderer;
  pointer = threeJSComponents.pointer;
  raycaster = threeJSComponents.raycaster;
  loadingManager = threeJSComponents.loadingManager;
  textureLoader = threeJSComponents.textureLoader;
  gltfLoader = threeJSComponents.gltfLoader;

  // Setup hover outline
  const hoverSetup = setupHoverOutline(renderer, scene, camera, sizes);
  composer = hoverSetup.composer;
  outlinePass = hoverSetup.outlinePass;
}

/**
 * Initialize loaders
 */
function initializeLoaders() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(MODEL_PATHS.draco);
  const loader = new GLTFLoader(loadingManager);
  loader.setDRACOLoader(dracoLoader);
  gltfLoader = loader;
}

/**
 * Initialize managers
 */
function initializeManagers() {
  // Load textures
  const { textureMap, loadedTextures } =
    themeManager.loadAllTextures(textureLoader);

  // Camera manager
  cameraManager = new CameraManager(
    camera,
    renderer,
    CAMERA_CONFIG.defaultPosition, // default camera position
    CAMERA_CONFIG.defaultTarget // default camera target
  );

  // Whiteboard
  whiteboard = new Whiteboard(scene, camera, renderer, cameraManager.controls);
  whiteboard.setPosition(WHITEBOARD_CONFIG.position);
  whiteboard.setRotation(
    WHITEBOARD_CONFIG.rotation.x,
    WHITEBOARD_CONFIG.rotation.y,
    WHITEBOARD_CONFIG.rotation.z
  );

  // Inner web
  innerWeb = initInnerWeb(scene, camera, document.body, sizes, {
    html: INNER_WEB_CONFIG.html,
    position: INNER_WEB_CONFIG.position,
    rotation: INNER_WEB_CONFIG.rotation,
    scale: INNER_WEB_CONFIG.scale,
  });

  // Store loaded textures for later use
  window.loadedTextures = loadedTextures;
}

/**
 * Initialize UI components
 */
function initializeUI() {
  // Modal system
  const modalSystem = initModalSystem({
    overlaySelector: MODAL_SELECTORS.overlay,
    modalSelectors: MODAL_SELECTORS.modals,
    closeButtonSelector: MODAL_SELECTORS.closeButton,
    onModalOpen: handleModalOpen,
    onModalClose: handleModalClose,
  });

  overlay = modalSystem.overlay;
  modals = modalSystem.modals;
  showModal = modalSystem.showModal;
  hideModal = modalSystem.hideModal;

  // Image overlay
  const imageOverlaySystem = initImageOverlay({
    overlaySelector: IMAGE_OVERLAY_SELECTORS.overlay,
    contentSelector: IMAGE_OVERLAY_SELECTORS.content,
    closeBtnSelector: IMAGE_OVERLAY_SELECTORS.closeBtn,
    imgSelector: IMAGE_OVERLAY_SELECTORS.img,
    textSelector: IMAGE_OVERLAY_SELECTORS.text,
    onClose: () => {
      isRaycastEnabled = true;
    },
  });

  showImageOverlay = imageOverlaySystem.showImageOverlay;
  hideImageOverlay = imageOverlaySystem.hideImageOverlay;

  // Mailbox
  const modalSystemForMailbox = { showModal, hideModal };
  mailbox = setupMailbox(scene, modalSystemForMailbox);
}

/**
 * ===================================================================
 * EVENT HANDLERS
 * ===================================================================
 */

/**
 * Handle modal open state
 */
function handleModalOpen() {
  isRaycastEnabled = false;
  clearHoverEffects();
  cameraManager.handleModalState(true);
}

/**
 * Handle modal close state
 */
function handleModalClose() {
  isRaycastEnabled = true;
  cameraManager.handleModalState(false);
}

/**
 * Main raycaster interaction handler
 */
function handleRaycasterInteraction() {
  if (!isRaycastEnabled || currentIntersects.length === 0) return;

  const object = currentIntersects[0].object;

  // Handle different types of interactions
  handleModalInteractions(object);
  handleImageInteractions(object);
  handleSocialLinkInteractions(object);
  handleSpecialObjectInteractions(object);

  // Mailbox interactions
  if (mailbox.handleRaycastIntersection(object, modals.contact)) {
    audioManager.playClick();
    return;
  }

  // Spin animations
  if (animatedObjects.spin.includes(object)) {
    const didSpin = spinAnimation(object);
    if (didSpin) audioManager.playClick();
  }
}

/**
 * Handle modal-related interactions
 */
function handleModalInteractions(object) {
  if (object.name.includes("about-raycast")) {
    audioManager.playClick();
    showModal(modals.about);
  } else if (object.name.includes("work-raycast")) {
    audioManager.playClick();
    showModal(modals.work);
  } else if (object.name.includes("erhu-seven")) {
    audioManager.playClick();
    showModal(modals.erhu);
  } else if (object.name.includes("TV-seven")) {
    audioManager.playClick();
    showModal(modals.work);
  }
}

/**
 * Handle image overlay interactions
 */
function handleImageInteractions(object) {
  if (imageData[object.name]) {
    audioManager.playClick();
    const { src, caption } = imageData[object.name];
    showImageOverlay(src, caption);
    isRaycastEnabled = false;
  }
}

/**
 * Handle social link interactions
 */
function handleSocialLinkInteractions(object) {
  Object.entries(socialLinks).forEach(([key, url]) => {
    if (object.name.toLowerCase().includes(key.toLowerCase())) {
      console.log(`Opening ${key} link: ${url}`);
      audioManager.playClick();

      // Clear hover effects and block raycasting
      clearHoverEffects();
      isRaycastEnabled = false;
      currentIntersects = [];

      // Open link with slight delay
      setTimeout(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }, 50);

      // Re-enable raycasting when window regains focus
      window.addEventListener("focus", () => {
        setTimeout(() => {
          isRaycastEnabled = true;
        }, 500);
      });
    }
  });
}

/**
 * Handle special object interactions
 */
function handleSpecialObjectInteractions(object) {
  if (object.name.includes("whiteboard-raycast-one")) {
    console.log("Whiteboard clicked!");
    audioManager.playClick();
    cameraManager.zoomToWhiteboard(whiteboard, 1.5);
    whiteboard.toggleWhiteboardMode(true);
  }

  if (object.name.includes("monitor")) {
    audioManager.playClick();
    cameraManager.zoomToMonitor();
    innerWeb.enableIframe();
    document.getElementById(BUTTON_IDS.backButton).style.display = "block";
  }

  if (object.name.includes("perry-hat")) {
    if (perryCupControls) {
      audioManager.playClick();
      perryCupControls.toggleLid();
      toggleSteam(steamMesh, 1);
    }
  }

  if (object.name.includes("pig-head")) {
    randomOink(pigObject);
  }
}

/**
 * ===================================================================
 * SCENE LOADING & PROCESSING
 * ===================================================================
 */

/**
 * Process objects in the loaded scene
 */
function processSceneObjects(sceneObject) {
  sceneObject.traverse((child) => {
    if (!child.isMesh) return;

    // Process themed mesh
    const isThemedMesh = themeManager.processThemedMesh(
      child,
      window.loadedTextures
    );

    if (isThemedMesh) {
      // Categorize animated objects
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

      processRotatingObject(child);

      // Process mailbox objects
      mailbox.processMailboxObject(child);

      // Process special objects
      if (child.name.includes("pig-head")) {
        pigObject = child;
      }
      if (child.name.includes("perry-hat")) {
        perryHatObject = child;
        perryCupControls = setupPerryCupAnimation(perryHatObject);
      }
    }

    // Process materials
    if (child.material?.map) {
      child.material.map.minFilter = THREE.LinearFilter;
    }

    // Process clock hands
    if (child.name.includes("four-hour")) {
      clockManager.setHourHand(child);
    } else if (child.name.includes("four-minute")) {
      clockManager.setMinuteHand(child);
    } else if (child.name.includes("four-second")) {
      clockManager.setSecondsHand(child);
    }

    // Process glass material
    themeManager.processGlassMesh(child);
  });
}

/**
 * ===================================================================
 * LOADING MANAGER SETUP
 * ===================================================================
 */

function setupLoadingManager() {
  const loadingButton = document.querySelector(LOADING_SELECTORS.button);
  const loadingBarFill = document.querySelector(LOADING_SELECTORS.barFill);

  loadingManager.onStart = () => {
    gsap.to(LOADING_SELECTORS.screen, {
      opacity: 1,
      duration: 1,
      ease: "power2.out",
    });
  };

  loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
    loadingBarFill.style.width = `${percent}%`;
    gsap.to(LOADING_SELECTORS.barFill, {
      scaleY: 1.05,
      repeat: -1,
      yoyo: true,
      duration: 0.5,
    });
  };

  loadingManager.onLoad = () => {
    gsap.killTweensOf(LOADING_SELECTORS.barFill);
    gsap.to(LOADING_SELECTORS.bar, { opacity: 0, duration: 0.5 });
    gsap.to(LOADING_SELECTORS.button, {
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
      LOADING_SELECTORS.button,
      { scale: 0.9 },
      { scale: 1, duration: 0.5, ease: "bounce.out", delay: 0.5 }
    );
  };
}

/**
 * ===================================================================
 * SCENE LOADING
 * ===================================================================
 */

function loadScene() {
  gltfLoader.load("/models/room-port-v1.glb", (glb) => {
    processSceneObjects(glb.scene);
    scene.add(glb.scene);
    playIntroAnimation();
  });
}

/**
 * ===================================================================
 * STEAM EFFECT
 * ===================================================================
 */

function setupSteamEffect() {
  textureLoader.load(STEAM_CONFIG.texture.src, (tex) => {
    tex.wrapS = STEAM_CONFIG.texture.wrapS;
    tex.wrapT = STEAM_CONFIG.texture.wrapT;
    steamMesh = createSteamEffect(tex, STEAM_CONFIG.geometry);
    steamMesh.position.copy(STEAM_CONFIG.position);
    scene.add(steamMesh);
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

function playIntroAnimation() {
  const t1 = gsap.timeline({
    duration: 0.8,
    ease: "back.out(1.8)",
  });
  // Add your intro animation here
}

/**
 * Clear all hover effects
 */
function clearHoverEffects() {
  currentIntersects = [];
  outlinePass.selectedObjects = [];
  updateHoverScale([], animatedObjects.scale);
  mailbox.updateMailboxHover([]);
}

/**
 * ===================================================================
 * RENDER LOOP
 * ===================================================================
 */

function render() {
  cameraManager.update();
  const elapsedTime = clock.getElapsedTime();

  // Update animations
  updateRotatingObjects();
  clockManager.updateClockHands();

  // Handle raycasting and hover effects
  if (isRaycastEnabled) {
    raycaster.setFromCamera(pointer, camera);

    currentIntersects = updateOutlineHover(
      raycaster,
      pointer,
      camera,
      raycasterObjects,
      outlinePass
    );

    updateHoverScale(currentIntersects, animatedObjects.scale);
    mailbox.updateMailboxHover(currentIntersects, outlinePass);
  } else {
    currentIntersects = [];
    mailbox.updateMailboxHover([], outlinePass);
    clearHoverEffects();
  }

  // Update whiteboard
  if (whiteboard && whiteboard.isActive) {
    whiteboard.update();
  }

  // Update steam effect
  if (steamMesh) {
    steamMesh.material.uniforms.uTime.value = elapsedTime;
  }

  // Render
  innerWeb.render();
  composer.render();

  window.requestAnimationFrame(render);
}

/**
 * ===================================================================
 * EVENT LISTENERS SETUP
 * ===================================================================
 */

function setupEventListeners() {
  // Click handler
  window.addEventListener("click", handleRaycasterInteraction);

  // Event handlers
  const handlers = new EventHandler({
    themeButton: document.getElementById(BUTTON_IDS.themeToggle),
    soundButton: document.getElementById(BUTTON_IDS.soundToggle),
    backButton: document.getElementById(BUTTON_IDS.backButton),
    themeManager,
    audioManager,
    body: document.body,
    camera,
    renderer,
    innerWeb,
    composer,
    sizes,
    cameraManager,
    whiteboard,
    loadingButton: document.querySelector(LOADING_SELECTORS.button),
    pointer,
  });

  handlers.registerThemeToggle();
  handlers.registerSoundToggle();
  handlers.registerResize();
  handlers.registerKeyboard();
  handlers.registerLoadingButton();
  handlers.registerPointerMove();

  setupModalHandlers();
  setupSidePanelHandlers();
  setupBackButtonHandler();
  console.log("Event listeners set up");
}

function setupModalHandlers() {
  const closeButtons = document.querySelectorAll(".modal-close-btn");
  overlay.addEventListener("click", () => {
    Object.values(modals).forEach((modal) => {
      if (modal.style.display === "block") {
        hideModal(modal);
        isRaycastEnabled = true;
      }
    });
  });

  // Handle close button click
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      hideModal(modal);
      isRaycastEnabled = true;
    });
  });
}

function setupSidePanelHandlers() {
  const hamburgerBtn = document.querySelector(
    SIDE_PANEL_SELECTORS.hamburgerBtn
  );
  const sidePanel = document.querySelector(SIDE_PANEL_SELECTORS.sidePanel);
  const panelLinks = document.querySelectorAll(SIDE_PANEL_SELECTORS.panelLinks);

  // Toggle panel and hamburger icon
  hamburgerBtn.addEventListener("click", () => {
    hamburgerBtn.classList.toggle("active");
    sidePanel.classList.toggle("active");
  });

  panelLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
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
}

function setupBackButtonHandler() {
  const backBtn = document.getElementById("back-button");

  backBtn.addEventListener("click", () => {
    whiteboard.toggleWhiteboardMode(false);
    innerWeb.disableIframe();
    cameraManager.resetToDefault();
  });
}

/**
 * ===================================================================
 * MAIN INITIALIZATION
 * ===================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize everything in order
  initializeThreeJS();
  initializeLoaders();
  initializeManagers();
  initializeUI();
  setupLoadingManager();
  setupEventListeners();

  // Load scene and start render loop
  loadScene();
  setupSteamEffect();
  render();
});

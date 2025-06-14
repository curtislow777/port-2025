import * as THREE from "three";
import gsap from "gsap";

// Core imports
import EventHandler from "./scripts/core/EventHandler.js";
import { initializeAll } from "./scripts/core/Initializer.js";
import { initializeUI } from "./scripts/ui/UIInitializer.js";
import "./style.scss";

// Application State
import appState from "./scripts/core/AppState.js";

// Singleton Managers
import themeManager from "./scripts/themeManager.js";
import audioManager from "./scripts/audio.js";
import clockManager from "./scripts/clock.js";

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

/**
 * ===================================================================
 * UI INITIALIZATION - NEXT TO BE REFACTORED
 * ===================================================================
 */

/**
 * Initialize UI components
 */

/**
 * ===================================================================
 * EVENT HANDLERS
 * ===================================================================
 */

/**
 * Main raycaster interaction handler
 */
function handleRaycasterInteraction() {
  if (!appState.isRaycastEnabled || appState.currentIntersects.length === 0)
    return;

  const object = appState.currentIntersects[0].object;

  // Handle different types of interactions
  handleModalInteractions(object);
  handleImageInteractions(object);
  handleSocialLinkInteractions(object);
  handleSpecialObjectInteractions(object);

  // Mailbox interactions
  if (
    appState.mailbox.handleRaycastIntersection(object, appState.modals.contact)
  ) {
    audioManager.playClick();
    return;
  }

  // Spin animations
  if (appState.animatedObjects.spin.includes(object)) {
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
    appState.showModal(appState.modals.about);
  } else if (object.name.includes("work-raycast")) {
    audioManager.playClick();
    appState.showModal(appState.modals.work);
  } else if (object.name.includes("erhu-seven")) {
    audioManager.playClick();
    appState.showModal(appState.modals.erhu);
  } else if (object.name.includes("TV-seven")) {
    audioManager.playClick();
    appState.showModal(appState.modals.work);
  }
}

/**
 * Handle image overlay interactions
 */
function handleImageInteractions(object) {
  if (imageData[object.name]) {
    audioManager.playClick();
    const { src, caption } = imageData[object.name];
    appState.showImageOverlay(src, caption);
    appState.disableRaycast();
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
      appState.disableRaycast();
      appState.clearIntersects();

      // Open link with slight delay
      setTimeout(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }, 50);

      // Re-enable raycasting when window regains focus
      window.addEventListener("focus", () => {
        setTimeout(() => {
          appState.enableRaycast();
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
    appState.cameraManager.zoomToWhiteboard(appState.whiteboard, 1.5);
    appState.whiteboard.toggleWhiteboardMode(true);
  }

  if (object.name.includes("monitor")) {
    audioManager.playClick();
    appState.cameraManager.zoomToMonitor();
    appState.innerWeb.enableIframe();
    document.getElementById(BUTTON_IDS.backButton).style.display = "block";
  }

  if (object.name.includes("perry-hat")) {
    if (appState.perryCupControls) {
      audioManager.playClick();
      appState.perryCupControls.toggleLid();
      toggleSteam(appState.steamMesh, 1);
    }
  }

  if (object.name.includes("pig-head")) {
    randomOink(appState.pigObject);
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
        appState.addAnimatedObject("keycaps", child);
      }
      if (child.name.includes("animateScale")) {
        appState.addAnimatedObject("scale", child);
      }
      if (child.name.includes("animateSpin")) {
        appState.addAnimatedObject("spin", child);
      }
      if (child.name.includes("scaleLights")) {
        appState.addAnimatedObject("scaleLights", child);
      }
      if (child.name.includes("raycast")) {
        appState.addRaycasterObject(child);
      }

      processRotatingObject(child);

      // Process mailbox objects
      appState.mailbox.processMailboxObject(child);

      // Process special objects
      if (child.name.includes("pig-head")) {
        appState.setPigObject(child);
      }
      if (child.name.includes("perry-hat")) {
        appState.setPerryHatObject(child);
        appState.setPerryCupControls(setupPerryCupAnimation(child));
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

  appState.loadingManager.onStart = () => {
    gsap.to(LOADING_SELECTORS.screen, {
      opacity: 1,
      duration: 1,
      ease: "power2.out",
    });
  };

  appState.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const percent = Math.floor((itemsLoaded / itemsTotal) * 100);
    loadingBarFill.style.width = `${percent}%`;
    gsap.to(LOADING_SELECTORS.barFill, {
      scaleY: 1.05,
      repeat: -1,
      yoyo: true,
      duration: 0.5,
    });
  };

  appState.loadingManager.onLoad = () => {
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
  appState.gltfLoader.load("/models/room-port-v1.glb", (glb) => {
    processSceneObjects(glb.scene);
    appState.scene.add(glb.scene);
    playIntroAnimation();
  });
}

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
  appState.clearHoverEffects();
  updateHoverScale([], appState.animatedObjects.scale);
  appState.mailbox.updateMailboxHover([]);
}

/**
 * ===================================================================
 * RENDER LOOP
 * ===================================================================
 */

function render() {
  appState.cameraManager.update();
  const elapsedTime = appState.getElapsedTime();

  // Update animations
  updateRotatingObjects();
  clockManager.updateClockHands();

  // Handle raycasting and hover effects
  if (appState.isRaycastEnabled) {
    appState.raycaster.setFromCamera(appState.pointer, appState.camera);

    const currentIntersects = updateOutlineHover(
      appState.raycaster,
      appState.pointer,
      appState.camera,
      appState.raycasterObjects,
      appState.outlinePass
    );
    appState.setCurrentIntersects(currentIntersects);

    updateHoverScale(currentIntersects, appState.animatedObjects.scale);
    appState.mailbox.updateMailboxHover(
      currentIntersects,
      appState.outlinePass
    );
  } else {
    appState.clearIntersects();
    appState.mailbox.updateMailboxHover([], appState.outlinePass);
    clearHoverEffects();
  }

  // Update whiteboard
  if (appState.whiteboard && appState.whiteboard.isActive) {
    appState.whiteboard.update();
  }

  // Update steam effect
  if (appState.steamMesh) {
    appState.steamMesh.material.uniforms.uTime.value = elapsedTime;
  }

  // Render
  appState.innerWeb.render();
  appState.composer.render();

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

  setupModalHandlers();
  setupSidePanelHandlers();
  setupBackButtonHandler();
  console.log("Event listeners set up");
}

function setupModalHandlers() {
  const closeButtons = document.querySelectorAll(".modal-close-btn");
  appState.overlay.addEventListener("click", () => {
    Object.values(appState.modals).forEach((modal) => {
      if (modal.style.display === "block") {
        appState.hideModal(modal);
        appState.enableRaycast();
      }
    });
  });

  // Handle close button click
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      appState.hideModal(modal);
      appState.enableRaycast();
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
          appState.cameraManager.resetToDefault();
          break;
        case "work":
          appState.showModal(appState.modals.work);
          break;
        case "about":
          appState.showModal(appState.modals.about);
          break;
        case "contact":
          appState.showModal(appState.modals.contact);
          break;
        case "whiteboard":
          appState.cameraManager.zoomToWhiteboard(appState.whiteboard, 1.5);
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
    appState.whiteboard.toggleWhiteboardMode(false);
    appState.innerWeb.disableIframe();
    appState.cameraManager.resetToDefault();
  });
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
  setupLoadingManager();
  setupEventListeners();

  // Load scene and start render loop
  loadScene();
  setupSteamEffect();
  render();
});

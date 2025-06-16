import * as THREE from "three";
import gsap from "gsap";

// Core imports
import EventHandler from "./scripts/core/EventHandler.js";
import { initializeAll } from "./scripts/core/Initializer.js";
import { initializeUI } from "./scripts/ui/UIInitializer.js";
import "./style.scss";
import RaycasterController from "./scripts/core/RaycasterController.js";
// Application State
import appState from "./scripts/core/AppState.js";
import { processScene } from "./scripts/core/SceneProcessor.js";
// Singleton Managers
import themeManager from "./scripts/themeManager.js";
import audioManager from "./scripts/audio.js";
import clockManager from "./scripts/clock.js";

// Features

import { updateRotatingObjects } from "./scripts/objectRotation.js";
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
    processScene(glb.scene);
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
  if (appState.isRaycastEnabled) {
    const hits = appState.raycasterController.update(
      appState.pointer.x,
      appState.pointer.y
    );
    appState.setCurrentIntersects(hits);
  } else {
    appState.clearIntersects();
    appState.raycasterController.clearHover();
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

  setupLoadingManager();
  setupEventListeners();

  // Load scene and start render loop
  loadScene();
  setupSteamEffect();
  render();
});

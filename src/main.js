import * as THREE from "three";
import gsap from "gsap";
import { initThreeJS } from "./scripts/scene.js";

import "./style.scss";

import EventHandler from "./scripts/core/EventHandler.js";

// Singleton Patterns
import themeManager from "./scripts/themeManager.js";
import audioManager from "./scripts/audio.js";
import clockManager from "./scripts/clock.js";

import Whiteboard from "./scripts/utils/whiteboard.js";
import CameraManager from "./scripts/camera.js";
import { createSteamEffect } from "./scripts/shaders/steamEffect.js";

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
import { updateHoverScale } from "./scripts/hoverScale.js";

import { initModalSystem } from "./scripts/modal.js";
import { initImageOverlay } from "./scripts/fadeOverlayImage.js";

import { initInnerWeb } from "./scripts/innerWeb.js";

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
 * START OF THREE.JS CODE
 * ---------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {});

let perryHatObject = null;
let pigObject = null;
let perryCupControls = null;
let isRaycastEnabled = true;

/** Initialize modal system */
const { overlay, modals, showModal, hideModal, hideAllModals } =
  initModalSystem({
    overlaySelector: MODAL_SELECTORS.overlay,
    modalSelectors: MODAL_SELECTORS.modals,
    closeButtonSelector: MODAL_SELECTORS.closeButton,
    onModalOpen: () => {
      isRaycastEnabled = false;
      clearHoverEffects();
      cameraManager.handleModalState(true);
    },
    onModalClose: () => {
      isRaycastEnabled = true;
      cameraManager.handleModalState(false); // Enable controls when modal closes
    },
  });

const { showImageOverlay, hideImageOverlay } = initImageOverlay({
  overlaySelector: IMAGE_OVERLAY_SELECTORS.overlay,
  contentSelector: IMAGE_OVERLAY_SELECTORS.content,
  closeBtnSelector: IMAGE_OVERLAY_SELECTORS.closeBtn,
  imgSelector: IMAGE_OVERLAY_SELECTORS.img,
  textSelector: IMAGE_OVERLAY_SELECTORS.text,
  onClose: () => {
    isRaycastEnabled = true;
  },
});

const canvas = document.querySelector(CANVAS_CONFIG.selector);
const sizes = { width: window.innerWidth, height: window.innerHeight };

let whiteboard;

const modalSystem = {
  showModal: showModal,
  hideModal: hideModal,
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

const innerWeb = initInnerWeb(scene, camera, document.body, sizes, {
  html: INNER_WEB_CONFIG.html,
  position: INNER_WEB_CONFIG.position,
  rotation: INNER_WEB_CONFIG.rotation,
  scale: INNER_WEB_CONFIG.scale,
});

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
  CAMERA_CONFIG.defaultPosition, // default camera position
  CAMERA_CONFIG.defaultTarget // default camera target
);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(MODEL_PATHS.draco);
const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);

const loadingButton = document.querySelector(LOADING_SELECTORS.button);

loadingManager.onStart = () => {
  gsap.to(LOADING_SELECTORS.screen, {
    opacity: 1,
    duration: 1,
    ease: "power2.out",
  });
};

const loadingBarFill = document.querySelector(LOADING_SELECTORS.barFill);

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

function handleRaycasterInteraction() {
  if (!isRaycastEnabled || currentIntersects.length === 0) return;
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;

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

    if (imageData[object.name]) {
      audioManager.playClick();
      const { src, caption } = imageData[object.name];
      showImageOverlay(src, caption);
      isRaycastEnabled = false;
    }

    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.toLowerCase().includes(key.toLowerCase())) {
        console.log(`Opening ${key} link: ${url}`);
        audioManager.playClick();

        // 👇 Clear hover effects and block raycasting
        clearHoverEffects();
        isRaycastEnabled = false;
        currentIntersects = [];

        // Optional: Delay slightly before opening so you visually clear first
        setTimeout(() => {
          window.open(url, "_blank", "noopener,noreferrer");
        }, 50); // small delay to allow hover clear to apply
      }
      // Optional: re-enable raycasting a short time after returning
      window.addEventListener("focus", () => {
        setTimeout(() => {
          isRaycastEnabled = true;
        }, 500); // or any delay that feels smooth
      });
    });

    if (object.name.includes("whiteboard-seven")) {
      console.log("Whiteboard clicked!");
      audioManager.playClick();
      cameraManager.zoomToWhiteboard(whiteboard, 1.5);
      whiteboard.toggleWhiteboardMode(true);
    }

    if (object.name.includes("monitor")) {
      audioManager.playClick();
      cameraManager.zoomToMonitor();
      innerWeb.enableIframe();
      backButton.style.display = "block";
    }

    // Add this new condition with your other click handlers
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

    if (mailbox.handleRaycastIntersection(object, modals.contact)) {
      audioManager.playClick();
      return;
    }
    // Trigger spin animation if the object is in animateSpinObjects
    if (animatedObjects.spin.includes(object)) {
      const didSpin = spinAnimation(object);
      if (didSpin) audioManager.playClick();
    }
  }
}

window.addEventListener("click", handleRaycasterInteraction);

const mailbox = setupMailbox(scene, modalSystem);

// Update the GLB loading section to use ThemeManager:
loader.load("/models/room-port-v1.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      if (child.name === "monitor-pos") {
        console.log("whiteboard-pos local position:", child.position);
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        console.log("whiteboard-pos world position:", worldPos);
      }
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
whiteboard.setPosition(WHITEBOARD_CONFIG.position);
whiteboard.setRotation(
  WHITEBOARD_CONFIG.rotation.x,
  WHITEBOARD_CONFIG.rotation.y,
  WHITEBOARD_CONFIG.rotation.z
);

function animate() {}

// Steam effect
let steamMesh;
textureLoader.load(STEAM_CONFIG.texture.src, (tex) => {
  tex.wrapS = STEAM_CONFIG.texture.wrapS;
  tex.wrapT = STEAM_CONFIG.texture.wrapT;
  steamMesh = createSteamEffect(tex, STEAM_CONFIG.geometry);
  steamMesh.position.copy(STEAM_CONFIG.position);
  scene.add(steamMesh);
});

/**  -------------------------- Render and Animations Stuff -------------------------- */

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

  if (isRaycastEnabled) {
    raycaster.setFromCamera(pointer, camera);

    // 1) generic outline-pass resets and outlines the pole
    currentIntersects = updateOutlineHover(
      raycaster,
      pointer,
      camera,
      raycasterObjects,
      outlinePass
    );

    // 2) generic scale-hover
    updateHoverScale(currentIntersects, animatedObjects.scale);

    // 3) mailbox: swing cover & re-add it to outlinePass every frame while hovering
    mailbox.updateMailboxHover(currentIntersects, outlinePass);
  } else {
    currentIntersects = [];
    mailbox.updateMailboxHover([], outlinePass);
    clearHoverEffects();
  }

  if (whiteboard && whiteboard.isActive) {
    whiteboard.update();
  }

  if (steamMesh) {
    steamMesh.material.uniforms.uTime.value = elapsedTime;
  }
  innerWeb.render();

  composer.render();

  // console.log(camera.position);
  window.requestAnimationFrame(render);
}

render();

// Get overlay and close buttons
const closeButtons = document.querySelectorAll(".modal-close-btn");

// Handle modal close on overlay click
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

document.addEventListener("DOMContentLoaded", function () {
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

/**
 * Toggles the steam mesh's visibility by fading its alpha in or out.
 * If the mesh is currently invisible, it fades in.
 * If it's visible, it fades out.
 *
 * @param {THREE.Mesh} steamMesh -
 * @param {number} [duration=0.5]
 * @param {Function} [onComplete]
 */
function toggleSteam(steamMesh, duration) {
  const mat = steamMesh.material;
  if (!mat.uniforms?.uGlobalAlpha) return;

  // Flip: if it's hidden we want to fade in
  const fadeIn = !steamMesh.visible;
  const target = fadeIn ? 1 : 0;

  // Kill any prior tween on this uniform
  gsap.killTweensOf(mat.uniforms.uGlobalAlpha);

  // If fading in, reset to zero first (so we always start from 0)
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

function clearHoverEffects() {
  currentIntersects = [];
  outlinePass.selectedObjects = [];
  updateHoverScale([], animatedObjects.scale);
  mailbox.updateMailboxHover([]);
}

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
  loadingButton,
  pointer,
});

handlers.registerThemeToggle();
handlers.registerSoundToggle();
handlers.registerResize();
handlers.registerKeyboard();
handlers.registerLoadingButton();
handlers.registerPointerMove();

const backBtn = document.getElementById("back-button");

backBtn.addEventListener("click", () => {
  whiteboard.toggleWhiteboardMode(false);
  // 1) Zoom the camera out (back to default)
  innerWeb.disableIframe();
  cameraManager.resetToDefault();

  // (leaveWhiteboard’s callback will call whiteboard.toggleWhiteboardMode(false) for you)
});

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

/**
 * START OF THREE.JS CODE
 * ---------------------------------------------------------------
 */

document.addEventListener("DOMContentLoaded", () => {});

const backButton = document.getElementById("back-button");

const imageData = {
  "baby-cyrus-eight-raycast": {
    src: "images/bb-cyrus.webp",
    caption: "nimama",
  },
  "ded-casper-eight-raycast": {
    src: "images/casper-buh.webp",
    caption: "nimama",
  },
  "casper-pawty-five": {
    src: "images/caspuh_party.webp",
    caption: "nimama",
  },
  "caspuh-frame-eight-raycast": {
    src: "images/caspuh2.webp",
    caption: "nimama",
  },
  "baby-casper-eight-raycast": {
    src: "images/caspuh.webp",
    caption: "nimama",
  },
  "cat-eight-raycast": {
    src: "images/cat.webp",
    caption: "nimama",
  },
  "casp-cyrus-eight-raycast": {
    src: "images/cc.webp",
    caption: "nimama",
  },
  "collection-eight-raycast": {
    src: "images/collection.webp",
    caption: "nimama",
  },
  "cyrus-eating-0-eight-raycast": {
    src: "images/cyrus-eating-0.webp",
    caption: "nimama",
  },
  "cyrus-frame-eight-raycast": {
    src: "images/cyrus.webp",
    caption: "nimama",
  },
  "duck-eight-raycast": {
    src: "images/duck.webp",
    caption: "nimama",
  },
  "goofy-casper-eight-raycast": {
    src: "images/lmao.webp",
    caption: "nimama",
  },
  "shoes-eight-raycast": {
    src: "images/shoes.webp",
    caption: "nimama",
  },
};

let perryHatObject = null;
let pigObject = null;
let perryCupControls = null;
let isRaycastEnabled = true;

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
  overlaySelector: ".fade-overlay",
  contentSelector: ".fade-overlay-content",
  closeBtnSelector: ".fade-overlay-close-btn",
  imgSelector: ".fade-overlay-img",
  textSelector: ".fade-overlay-text",
  onClose: () => {
    isRaycastEnabled = true;
  },
});

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

let whiteboard;

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
  html: `<iframe
             src="https://inner-portfolio-js.vercel.app/"
             style="width:1200px;height:675px; border:0;border-radius:8px;"
           ></iframe>`,
  position: new THREE.Vector3(-4.9, 3.225, -0.55),
  rotation: new THREE.Euler(0, Math.PI / 2, 0),
  scale: new THREE.Vector3(0.00137, 0.00137, 0.00137),
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
  new THREE.Vector3(15.53, 11.14, 20.73), // default camera position
  new THREE.Vector3(-0.35, 3.0, 0.64) // default camera target
);

const dracoLoader = new DRACOLoader();
const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);
dracoLoader.setDecoderPath("/draco/");

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

function animate() {}

let steamMesh;

textureLoader.load("/images/perlin.png", (perlinTexture) => {
  perlinTexture.wrapS = THREE.RepeatWrapping;
  perlinTexture.wrapT = THREE.RepeatWrapping;

  steamMesh = createSteamEffect(perlinTexture, {
    width: 0.15,
    height: 0.6,
    segments: 16,
  });
  steamMesh.material.uniforms.uGlobalAlpha.value = 0.0;
  steamMesh.visible = false;

  steamMesh.position.set(-4.177665710449219, 2.85, 1.0796866416931152);

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
    currentIntersects = raycaster.intersectObjects(raycasterObjects);
    currentIntersects = updateOutlineHover(
      raycaster,
      pointer,
      camera,
      raycasterObjects,
      outlinePass
    );
    updateHoverScale(currentIntersects, animatedObjects.scale);
    mailbox.updateMailboxHover(currentIntersects);
  } else {
    currentIntersects = [];
    mailbox.updateMailboxHover([]);
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
  themeButton: document.getElementById("theme-toggle"),
  soundButton: document.getElementById("sound-toggle"),
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

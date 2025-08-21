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
import ParticleTrail from "./scripts/effects/ParticleTrail.js"; // <-- Import the new class
import TVEyesChannel from "./scripts/utils/TVEyesChannel.js"; // from the snippet I gave

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
// ─────────────────────────────────────────────────────────────
// Load Peashooter model (with single looping action)
// ─────────────────────────────────────────────────────────────
function loadPeashooter() {
  // Pick ONE of the two lines below depending on where your file lives:
  // A) If the GLB is in /public/models/peashooter.glb
  let url = "/models/peashooter.glb";
  // B) If the GLB is inside src relative to THIS file, use module URL instead:
  // let url = new URL("./models/peashooter.glb", import.meta.url).href;

  appState.gltfLoader.load(
    url,
    (gltf) => {
      const root = gltf.scene;
      root.name = "Peashooter";

      // Ensure visible & not culled
      root.visible = true;
      root.traverse((o) => {
        if (o.isSkinnedMesh) {
          o.material = new THREE.MeshBasicMaterial({
            color: 0x7fd1ff,
            skinning: true, // ← REQUIRED for bone animation to affect vertices
            map: o.material?.map || null,
          });
          o.frustumCulled = false;
        } else if (o.isMesh) {
          o.material = new THREE.MeshBasicMaterial({ color: 0x7fd1ff });
          o.frustumCulled = false;
        }
      });

      // Center + auto-scale to ~1.5 m largest dimension
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      root.position.sub(center); // center at origin

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const target = 1.5;
      const scale = target / maxDim;
      root.scale.multiplyScalar(scale);

      // Put it 2 m in front of the camera so you can’t miss it
      const cam = appState.camera;
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      root.position.copy(cam.position).add(dir.multiplyScalar(2));

      appState.scene.add(root);
      appState.peashooter = root;

      // Visual debug: bounding box + axes
      const helperBox = new THREE.Box3Helper(
        new THREE.Box3().setFromObject(root)
      );
      appState.scene.add(helperBox);
      appState.scene.add(new THREE.AxesHelper(0.5));
      console.log(gltf.animations);

      // Play first animation on loop
      const mixer = new THREE.AnimationMixer(root);
      const clip = gltf.animations[0]; // "ArmatureAction"
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      action.enabled = true;
      action.play();

      // store mixer so your render loop can tick it
      appState.addMixer(mixer);
    },
    undefined,
    (err) => {
      console.error("Failed to load peashooter.glb", err);
    }
  );
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
}

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
      const onIntroComplete = () => {
        console.log("Intro animation complete. Starting tutorial.");
        // Start tutorial after the camera has settled
        if (introTutorial) {
          introTutorial.start();
        }
      };
      // If debug mode is on, skip the animation and snap to the final position.
      if (appState.isInDebugMode()) {
        console.log("Skipping intro animation due to debug mode.");
        appState.cameraManager.resetToDefault(0); // Instantly snap to default
        onIntroComplete();
        return;
      }

      //sweep', 'reveal', or 'orbit'

      const animationStyle = "reveal";
      const animationDuration = 5.0;

      appState.cameraManager.playIntroAnimation(
        animationStyle,
        animationDuration,
        onIntroComplete
      );
    },
  });
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
function createTVEyesPlane() {
  const eyes = new TVEyesChannel({ width: 960, height: 540 });
  appState.tvEyes = eyes;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: eyes.texture,
      depthTest: false, // sit “on top” of stuff
      toneMapped: false, // CanvasTexture already in sRGB
    })
  );
  plane.name = "TV_EYES_PLANE";
  plane.material.map.flipY = false;
  plane.material.map.colorSpace = THREE.SRGBColorSpace;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
    appState.camera.quaternion
  );
  plane.position.set(2.7754769325256348, 3.801779270172119, -5.308991432189941);

  plane.scale.set(4.8, 2.65, 1);

  plane.renderOrder = 1;
  appState.scene.add(plane);
  appState.tvEyesPlane = plane;
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize core components using the new Initializer
  initializeAll();

  // Initialize UI and other components
  initializeUI();
  createTVEyesPlane();

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
  appState.tvEyes.setPupilSize(0.4);

  setupLoadingScreen();
  setupEventListeners();

  // ===================================================================
  // CSS RIPPLE EFFECT
  // ===================================================================
  document.body.addEventListener("click", (event) => {
    // Check if the click happened directly on the Three.js canvas.
    // This prevents ripples when clicking on modals, buttons, or other UI.
    if (event.target === appState.renderer.domElement) {
      const ripple = document.createElement("div");
      ripple.className = "ripple";
      document.body.appendChild(ripple);

      // Position the ripple at the exact click coordinates
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;

      // Remove the ripple element after the animation is done (600ms)
      setTimeout(() => {
        ripple.remove();
      }, 600);

      // const sparkle = document.createElement("div");
      // sparkle.className = "sparkle"; // Use the new class name

      // // The rest of the JS logic remains the same
      // document.body.appendChild(sparkle);

      // sparkle.style.left = `${event.clientX}px`;
      // sparkle.style.top = `${event.clientY}px`;

      // setTimeout(() => {
      //   sparkle.remove();
      // }, 500); // Match the animation duration (500ms)
    }
  });

  // ===================================================================
  // 3D PARTICLE TRAIL EFFECT
  // ===================================================================
  // 1. Instantiate the particle system and store it in the app state
  const particleTrail = new ParticleTrail(appState.scene);
  appState.particleTrail = particleTrail;

  // 2. A throttle function to limit how often the mousemove event fires
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // 3. The function that handles spawning particles on mouse move
  const mouseMoveHandler = (event) => {
    // Convert 2D mouse position to a 3D point in front of the camera
    const vec = new THREE.Vector3(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      0.5
    );
    vec.unproject(appState.camera);
    vec.sub(appState.camera.position).normalize();
    const distance = 5; // How far from the camera the trail appears
    const spawnPos = appState.camera.position
      .clone()
      .add(vec.multiplyScalar(distance));

    // Tell our particle system to spawn a particle at this new 3D position
    particleTrail.spawnParticle(spawnPos);
  };

  // 4. Attach the throttled function to the mousemove event
  document.body.addEventListener("mousemove", throttle(mouseMoveHandler, 20));

  // Load scene and start render loop
  loadScene();
  loadPeashooter(); // <— add this line

  setupSteamEffect();
  // right after setupSteamEffect() or wherever you want the loop to begin
  const renderLoop = createRenderLoop({ introTutorial });
  renderLoop.start();
});

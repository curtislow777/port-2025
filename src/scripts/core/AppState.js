/**
 * AppState.js – Centralised application state management
 */

import * as THREE from "three";

class AppState {
  constructor() {
    /* ───────────────────────────────────
     * DEBUGGING STATE
     * - Manually toggle this property to enable/disable debug features.
     * ─────────────────────────────────── */
    this.isDebugMode = true; // <-- SET TO `true` to debug, `false` for production

    if (this.isDebugMode) {
      console.log(
        "%c 🐛 DEBUG MODE ACTIVATED ",
        "background: #ff4500; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
      );
      document.body.classList.add("debug-mode");
    }

    /* ───────────────────────────────────
     *  Ray-casting state
     * ─────────────────────────────────── */
    this.isRaycastEnabled = true;
    this.currentIntersects = [];
    this.raycasterController = null; // <-- will be injected from main.js

    /* ───────────────────────────────────
     *  Scene objects
     * ─────────────────────────────────── */
    this.perryHatObject = null;
    this.pigObject = null;
    this.perryCupControls = null;
    this.steamMesh = null;
    this.whiteboard = null;

    /* ───────────────────────────────────
     *  Collections
     * ─────────────────────────────────── */
    this.animatedObjects = {
      spin: [],
      scale: [],
      scaleLights: [],
      keycaps: [],
      lights: [],
    };
    this.raycasterObjects = [];

    /* ───────────────────────────────────
     *  Three.js core
     * ─────────────────────────────────── */
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointer = null;
    this.raycaster = null; // (legacy – may be removed later)
    this.loadingManager = null;
    this.textureLoader = null;
    this.gltfLoader = null;
    this.composer = null;
    this.outlinePass = null;

    /* ───────────────────────────────────
     *  Managers
     * ─────────────────────────────────── */
    this.cameraManager = null;
    this.innerWeb = null;
    this.mailbox = null;

    /* ───────────────────────────────────
     *  UI Hooks
     * ─────────────────────────────────── */
    this.overlay = null;
    this.modals = null;
    this.showModal = null;
    this.hideModal = null;
    this.showImageOverlay = null;
    this.hideImageOverlay = null;

    /* ───────────────────────────────────
     *  Canvas / sizing
     * ─────────────────────────────────── */
    this.canvas = null;
    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.clock = new THREE.Clock();
  }

  /* ===== Debugging Helpers ======================================== */
  /**
   * Checks if the application is currently in debug mode.
   * @returns {boolean}
   */
  isInDebugMode() {
    return this.isDebugMode;
  }
  /* ===== Ray-casting helpers ======================================= */

  /** Inject the RaycasterController instance once created. */
  setRaycasterController(controller) {
    this.raycasterController = controller;
  }

  enableRaycast() {
    console.log("Enabling raycast");
    this.isRaycastEnabled = true;
    this.raycasterController?.enable();
  }

  disableRaycast() {
    console.log("Disabling raycast");
    this.isRaycastEnabled = false;
    this.raycasterController?.disable();
    this.resetCursor();
    this.clearHoverEffects();
  }
  /* AppState.js */
  resetCursor() {
    // whichever elements exist in your app:
    document.body.style.cursor = "default";
    document.documentElement.style.cursor = "default";
    if (this.canvas) this.canvas.style.cursor = "default";
    if (this.overlay) this.overlay.style.cursor = "default"; // <- the full-screen overlay
  }

  setCurrentIntersects(intersects) {
    this.currentIntersects = intersects;
  }
  clearIntersects() {
    this.currentIntersects = [];
  }

  /* ===== Scene-object setters ====================================== */

  setPerryHatObject(obj) {
    this.perryHatObject = obj;
  }
  setPigObject(obj) {
    this.pigObject = obj;
  }
  setPerryCupControls(c) {
    this.perryCupControls = c;
  }
  setSteamMesh(mesh) {
    this.steamMesh = mesh;
  }
  setWhiteboard(whiteboard) {
    this.whiteboard = whiteboard;
  }

  /* ===== Core Three.js components ================================== */

  setThreeJSComponents(c) {
    this.scene = c.scene;
    this.camera = c.camera;
    this.renderer = c.renderer;
    this.pointer = c.pointer;
    this.raycaster = c.raycaster;
    this.loadingManager = c.loadingManager;
    this.textureLoader = c.textureLoader;
    this.gltfLoader = c.gltfLoader;
  }

  setPostProcessing(composer, outlinePass) {
    this.composer = composer;
    this.outlinePass = outlinePass;
  }

  /* ===== Managers =================================================== */

  setCameraManager(mgr) {
    this.cameraManager = mgr;
  }
  setInnerWeb(iw) {
    this.innerWeb = iw;
  }
  setMailbox(box) {
    this.mailbox = box;
  }

  /* ===== UI components ============================================= */

  setModalSystem(overlay, modals, showModal, hideModal) {
    this.overlay = overlay;
    this.modals = modals;
    this.showModal = showModal;
    this.hideModal = hideModal;
  }

  setImageOverlay(show, hide) {
    this.showImageOverlay = show;
    this.hideImageOverlay = hide;
  }

  /* ===== Canvas / sizing =========================================== */

  setCanvas(canvas) {
    this.canvas = canvas;
  }
  updateSizes(w, h) {
    this.sizes.width = w;
    this.sizes.height = h;
  }

  /* ===== Collections ============================================== */

  addAnimatedObject(type, obj) {
    if (this.animatedObjects[type]) this.animatedObjects[type].push(obj);
  }

  addRaycasterObject(obj) {
    this.raycasterObjects.push(obj);
  }

  /* ===== Utility =================================================== */

  clearHoverEffects() {
    this.currentIntersects = [];
    if (this.outlinePass) this.outlinePass.selectedObjects = [];
  }

  getElapsedTime() {
    return this.clock.getElapsedTime();
  }
}

/*  Export a singleton instance  */
export default new AppState();

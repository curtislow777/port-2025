/**
 * AppState.js - Centralized application state management
 *
 * This module manages all global application state, providing a clean
 * interface for accessing and modifying application-wide variables.
 */

import * as THREE from "three";

class AppState {
  constructor() {
    // Application state
    this.isRaycastEnabled = true;
    this.currentIntersects = [];

    // Scene objects
    this.perryHatObject = null;
    this.pigObject = null;
    this.perryCupControls = null;
    this.steamMesh = null;
    this.whiteboard = null;

    // Collections
    this.animatedObjects = {
      spin: [],
      scale: [],
      scaleLights: [],
      keycaps: [],
      lights: [],
    };
    this.raycasterObjects = [];

    // Core Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointer = null;
    this.raycaster = null;
    this.loadingManager = null;
    this.textureLoader = null;
    this.gltfLoader = null;
    this.composer = null;
    this.outlinePass = null;

    // Managers
    this.cameraManager = null;
    this.innerWeb = null;
    this.mailbox = null;

    // UI components
    this.overlay = null;
    this.modals = null;
    this.showModal = null;
    this.hideModal = null;
    this.showImageOverlay = null;
    this.hideImageOverlay = null;

    // Canvas and sizing
    this.canvas = null;
    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.clock = new THREE.Clock();
  }

  // Raycast state management
  enableRaycast() {
    this.isRaycastEnabled = true;
  }

  disableRaycast() {
    this.isRaycastEnabled = false;
  }

  setCurrentIntersects(intersects) {
    this.currentIntersects = intersects;
  }

  clearIntersects() {
    this.currentIntersects = [];
  }

  // Scene objects setters
  setPerryHatObject(object) {
    this.perryHatObject = object;
  }

  setPigObject(object) {
    this.pigObject = object;
  }

  setPerryCupControls(controls) {
    this.perryCupControls = controls;
  }

  setSteamMesh(mesh) {
    this.steamMesh = mesh;
  }

  setWhiteboard(whiteboard) {
    this.whiteboard = whiteboard;
  }

  // Core Three.js components setters
  setThreeJSComponents(components) {
    this.scene = components.scene;
    this.camera = components.camera;
    this.renderer = components.renderer;
    this.pointer = components.pointer;
    this.raycaster = components.raycaster;
    this.loadingManager = components.loadingManager;
    this.textureLoader = components.textureLoader;
    this.gltfLoader = components.gltfLoader;
  }

  setPostProcessing(composer, outlinePass) {
    this.composer = composer;
    this.outlinePass = outlinePass;
  }

  // Managers setters
  setCameraManager(manager) {
    this.cameraManager = manager;
  }

  setInnerWeb(innerWeb) {
    this.innerWeb = innerWeb;
  }

  setMailbox(mailbox) {
    this.mailbox = mailbox;
  }

  // UI components setters
  setModalSystem(overlay, modals, showModal, hideModal) {
    this.overlay = overlay;
    this.modals = modals;
    this.showModal = showModal;
    this.hideModal = hideModal;
  }

  setImageOverlay(showImageOverlay, hideImageOverlay) {
    this.showImageOverlay = showImageOverlay;
    this.hideImageOverlay = hideImageOverlay;
  }

  // Canvas and sizing
  setCanvas(canvas) {
    this.canvas = canvas;
  }

  updateSizes(width, height) {
    this.sizes.width = width;
    this.sizes.height = height;
  }

  // Animated objects management
  addAnimatedObject(type, object) {
    if (this.animatedObjects[type]) {
      this.animatedObjects[type].push(object);
    }
  }

  addRaycasterObject(object) {
    this.raycasterObjects.push(object);
  }

  // Utility methods
  clearHoverEffects() {
    this.currentIntersects = [];
    if (this.outlinePass) {
      this.outlinePass.selectedObjects = [];
    }
  }

  getElapsedTime() {
    return this.clock.getElapsedTime();
  }
}

// Create and export singleton instance
const appState = new AppState();
export default appState;

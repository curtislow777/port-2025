// scripts/core/RaycasterController.js
import * as THREE from "three";
import { updateOutlineHover } from "../hoverOutline.js";
import { updateHoverScale } from "../hoverScale.js";
import appState from "../core/AppState.js";
import audioManager from "../audio.js";
import { spinAnimation } from "../spinnyObjects.js";
import { randomOink } from "../pig.js";
import { imageData, socialLinks, BUTTON_IDS } from "../config/constants.js";

/**
 * Wrapper around THREE.Raycaster with a few built-in “hover helpers”.
 */
export default class RaycasterController {
  /**
   * @param {THREE.Camera}        camera
   * @param {THREE.Object3D[]}    sceneObjects
   * @param {Object}              [opts]
   * @param {THREE.OutlinePass}   [opts.outlinePass]  - post-proc outline pass to update
   * @param {THREE.Object3D[]}    [opts.scaleTargets] - meshes that pulse when hovered
   * @param {Object}              [opts.mailbox]      - custom mailbox w/ updateMailboxHover()
   */
  constructor(camera, sceneObjects = [], opts = {}) {
    // basic raycaster plumbing ------------------------
    this.camera = camera;
    this.objects = sceneObjects;
    this.enabled = true;

    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    /** @type {THREE.Intersection[]} */
    this.intersects = [];

    // optional helpers --------------------------------
    const { outlinePass = null, scaleTargets = [], mailbox = null } = opts;

    this.outlinePass = outlinePass;
    this.scaleTargets = scaleTargets;
    this.mailbox = mailbox;

    window.addEventListener("click", () => this._handleClick());
  }

  /**
   * Call every frame or on pointer-move.
   * @param {number} mouseX – NDC-space X (-1 → 1)
   * @param {number} mouseY – NDC-space Y (-1 → 1)
   * @returns {THREE.Intersection[]}
   */
  update(mouseX, mouseY) {
    if (!this.enabled) return [];

    // 1️⃣  compute intersections ----------------------
    this.pointer.set(mouseX, mouseY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.intersects = this.raycaster.intersectObjects(this.objects, true);

    // 2️⃣  trigger built-in hover effects -------------
    if (this.outlinePass) {
      updateOutlineHover(
        this.raycaster,
        this.pointer,
        this.camera,
        this.objects,
        this.outlinePass
      );
    }

    if (this.scaleTargets?.length) {
      updateHoverScale(this.intersects, this.scaleTargets);
    }

    if (this.mailbox?.updateMailboxHover) {
      this.mailbox.updateMailboxHover(this.intersects, this.outlinePass);
    }

    return this.intersects;
  }

  /* ---------- tiny convenience helpers ------------- */

  /** Replace the set of objects the raycaster tests */
  setObjects(objects = []) {
    this.objects = objects;
  }
  clearHover() {
    if (this.outlinePass) this.outlinePass.selectedObjects = [];
    if (this.scaleTargets?.length) updateHoverScale([], this.scaleTargets);
    if (this.mailbox?.updateMailboxHover)
      this.mailbox.updateMailboxHover([], this.outlinePass);
  }
  /** Toggle the entire controller on/off */
  setEnabled(flag) {
    this.enabled = !!flag;
  }
  // --- compatibility shims for older call-sites --------------------
  enable() {
    this.setEnabled(true);
  }
  disable() {
    this.setEnabled(false);
  }

  // Some utilities might still grab the raw THREE.Raycaster
  getRaycaster() {
    return this.raycaster;
  }

  /** Clear references (helps GC in SPA/Hot-reload flows) */
  dispose() {
    this.objects = [];
    this.scaleTargets = [];
    this.outlinePass = null;
    this.mailbox = null;
  }

  /* ===================================================================
   *  CLICK DISPATCH  (formerly handleRaycasterInteraction in main.js)
   * =================================================================== */

  _handleClick() {
    if (!appState.isRaycastEnabled || this.intersects.length === 0) return;

    const object = this.intersects[0].object;

    // 1) modals --------------------------------------------------------
    if (object.name.includes("about-raycast")) return openModal("about");
    else if (object.name.includes("work-raycast")) return openModal("projects");
    else if (object.name.includes("erhu-seven")) return openModal("erhu");
    else if (object.name.includes("TV-seven")) return openModal("projects");

    // 2) image overlay -------------------------------------------------
    if (imageData[object.name]) {
      audioManager.playClick();
      const { src, caption } = imageData[object.name];
      return appState.showImageOverlay(src, caption);
    }

    // 3) social links --------------------------------------------------
    for (const [key, url] of Object.entries(socialLinks)) {
      if (object.name.toLowerCase().includes(key.toLowerCase())) {
        openExternalLink(url);
        return;
      }
    }

    // 4) special objects ----------------------------------------------
    if (object.name.includes("whiteboard-raycast-one")) {
      audioManager.playClick();
      appState.cameraManager.zoomToWhiteboard(appState.whiteboard, 1.5);
      appState.whiteboard.toggleWhiteboardMode(true);
      return;
    }

    if (object.name.includes("monitor")) {
      audioManager.playClick();
      appState.cameraManager.zoomToMonitor();
      appState.innerWeb.enableIframe();
      document.getElementById(BUTTON_IDS.backButton).style.display = "block";
      return;
    }

    if (object.name.includes("perry-hat") && appState.perryCupControls) {
      audioManager.playClick();
      appState.perryCupControls.toggleLid();
      return; // steam toggle handled elsewhere
    }

    if (object.name.includes("pig-head")) {
      return randomOink(appState.pigObject);
    }

    // 5) mailbox & spin objects ---------------------------------------
    if (
      this.mailbox?.handleRaycastIntersection(object, appState.modals.contact)
    ) {
      audioManager.playClick();
      return;
    }

    if (appState.animatedObjects.spin.includes(object)) {
      if (spinAnimation(object)) audioManager.playClick();
    }

    /* ----- local helpers -------------------------------------------- */
    function openModal(which) {
      audioManager.playClick();
      appState.showModal(appState.modals[which]);
    }

    function openExternalLink(url) {
      audioManager.playClick();
      appState.raycasterController.clearHover();
      appState.disableRaycast();

      setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), 50);

      window.addEventListener("focus", () => {
        setTimeout(() => appState.enableRaycast(), 500);
      });
    }
  }
}

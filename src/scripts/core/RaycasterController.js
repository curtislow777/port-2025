// scripts/core/RaycasterController.js
import * as THREE from "three";
import { updateOutlineHover } from "../hoverOutline.js";
import { updateHoverScale } from "../hoverScale.js";

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
}

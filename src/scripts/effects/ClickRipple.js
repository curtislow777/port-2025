import * as THREE from "three";

// Configuration for the ripple effect
const RIPPLE_DURATION = 500; // in milliseconds
const RIPPLE_MAX_SCALE = 2.5;
const RIPPLE_COLOR = 0xffffff;

export default class ClickRipple {
  /**
   * @param {THREE.Vector3} position  - The world position of the click.
   * @param {THREE.Vector3} normal    - The world normal of the surface at the click point.
   * @param {THREE.Scene}   scene     - The scene to add the ripple to.
   */
  constructor(position, normal, scene) {
    this.scene = scene;
    this.duration = RIPPLE_DURATION;
    this.startTime = Date.now();

    // Create the ripple mesh
    const geometry = new THREE.CircleGeometry(0.1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: RIPPLE_COLOR,
      transparent: true,
      opacity: 0.8,
      // AdditiveBlending gives a nice "glow" effect
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    // Position the ripple at the click point
    this.mesh.position.copy(position);

    // Orient the ripple to be flush with the clicked surface
    this.mesh.lookAt(position.clone().add(normal));

    // Add a tiny offset to prevent z-fighting (stitching/flickering)
    this.mesh.position.addScaledVector(normal, 0.01);

    this.scene.add(this.mesh);
  }

  /**
   * Call this method in your main animation loop.
   * @returns {boolean} - Returns `false` when the animation is finished, `true` otherwise.
   */
  update() {
    const elapsedTime = Date.now() - this.startTime;
    const progress = elapsedTime / this.duration;

    if (progress >= 1) {
      this.dispose();
      return false; // Signal that it's finished
    }

    // Animate scale and opacity
    const currentScale = RIPPLE_MAX_SCALE * progress;
    this.mesh.scale.set(currentScale, currentScale, currentScale);
    this.mesh.material.opacity = 0.8 * (1 - progress);

    return true; // Signal that it's still active
  }

  /**
   * Clean up resources.
   */
  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

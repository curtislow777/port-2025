// clock.js
import * as THREE from "three";

export default class ClockManager {
  constructor() {
    this.hourHand = null;
    this.minuteHand = null;
  }

  /**
   * Attach references to the hour and minute hand Meshes
   * that were loaded in the main scene.
   */
  setHourHand(mesh) {
    this.hourHand = mesh;
    // Store initial rotation if you need it
    this.hourHand.userData.initialRotation =
      this.hourHand.userData.initialRotation ||
      new THREE.Euler().copy(mesh.rotation);
  }

  setMinuteHand(mesh) {
    this.minuteHand = mesh;
    // Store initial rotation if you need it
    this.minuteHand.userData.initialRotation =
      this.minuteHand.userData.initialRotation ||
      new THREE.Euler().copy(mesh.rotation);
  }

  /**
   * Call this in your render/animation loop to keep the
   * clock hands in sync with the current local time.
   */
  updateClockHands() {
    if (!this.hourHand || !this.minuteHand) return;

    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourAngle = (hours + minutes / 60) * ((Math.PI * 2) / 12);
    const minuteAngle = (minutes + seconds / 60) * ((Math.PI * 2) / 60);

    this.hourHand.rotation.z = -hourAngle;
    this.minuteHand.rotation.z = -minuteAngle;
  }
}

// clock.js
import * as THREE from "three";

export default class ClockManager {
  constructor() {
    this.hourHand = null;
    this.minuteHand = null;
  }

  setHourHand(mesh) {
    this.hourHand = mesh;
    this.hourHand.userData.initialRotation =
      this.hourHand.userData.initialRotation ||
      new THREE.Euler().copy(mesh.rotation);
  }

  setMinuteHand(mesh) {
    this.minuteHand = mesh;
    this.minuteHand.userData.initialRotation =
      this.minuteHand.userData.initialRotation ||
      new THREE.Euler().copy(mesh.rotation);
  }

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

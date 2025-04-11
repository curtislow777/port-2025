import { Howl } from "howler";
import { gsap } from "gsap";

const sounds = [
  new Howl({ src: ["audio/pig/Pig_idle1.ogg"], volume: 0.5 }),
  new Howl({ src: ["audio/pig/Pig_idle2.ogg"], volume: 0.5 }),
  new Howl({ src: ["audio/pig/Pig_idle3.ogg"], volume: 0.5 }),
];

export function playOink(index) {
  if (sounds[index]) {
    sounds[index].play();
  } else {
    console.warn(`No sound found at index ${index}`);
  }
}

let canPlayOink = true;
const oinkCooldown = 1000; // 1 second cooldown between oinks

export function randomOink(mesh) {
  if (!canPlayOink) return;

  canPlayOink = false;
  const index = Math.floor(Math.random() * sounds.length);
  playOink(index);
  console.log("oinked");

  if (mesh) {
    gsap.fromTo(
      mesh.scale,
      { x: 1, y: 1, z: 1 },
      {
        x: 1.075,
        y: 1.075,
        z: 1.075,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "ease",
      }
    );
  }

  setTimeout(() => {
    canPlayOink = true;
  }, oinkCooldown);
}

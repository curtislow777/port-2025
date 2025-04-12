// spinnyObjects.js

import gsap from "gsap";

// Store spin timelines for each object so they can be extended if clicked repeatedly
const spinTimelines = new Map();

// Base constants for spin behavior
const SPIN_DURATION = 2; // seconds for one spin
const SPIN_AMOUNT = Math.PI * 2; // full 360°

/**
 * Spin the given object once with a slight scale "pulse" feedback.
 * If the object is already spinning (has an active timeline),
 * this will extend the existing spin.
 */
export function spinAnimation(object) {
  let timeline = spinTimelines.get(object);
  const currentRotation = object.rotation.y;
  const newRotation = currentRotation + SPIN_AMOUNT;

  // Reset object scale before starting the spin
  gsap.to(object.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.2,
    onComplete: () => {
      // If timeline exists, we extend it rather than create a brand new timeline
      if (timeline) {
        const progress = timeline.progress();
        // Extend the spin's total duration based on how much of the spin is left
        const remainingSpin = (1 - progress) * timeline.duration();
        const addedDuration = SPIN_DURATION - remainingSpin;
        timeline.clear(); // clear queued tweens
        // Recreate the timeline with leftover time + 1 new spin
        timeline = gsap.timeline({
          onComplete: () => spinTimelines.delete(object),
        });
        spinTimelines.set(object, timeline);
        timeline.to(object.rotation, {
          y: newRotation,
          duration: SPIN_DURATION + addedDuration,
          ease: "power1.out",
        });
      } else {
        // Create a new timeline for this object
        timeline = gsap.timeline({
          onComplete: () => spinTimelines.delete(object),
        });
        spinTimelines.set(object, timeline);

        timeline.to(object.rotation, {
          y: newRotation,
          duration: SPIN_DURATION,
          ease: "power1.out",
        });
      }

      // Apply a brief scale "pulse" to make the spin more noticeable
      gsap.to(object.scale, {
        x: 1.1,
        y: 1.1,
        z: 1.1,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    },
  });
}

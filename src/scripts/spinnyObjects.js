import gsap from "gsap";
import * as THREE from "three";

// Store cooldowns and spin counts
const cooldownSet = new Set();
const spinCounts = new Map();

const SPIN_DURATION = 2; // seconds
const SPIN_AMOUNT = Math.PI * 2;
const COOLDOWN_DURATION = 2; // seconds

// Create a reusable sparkle texture
const sparkleTexture = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");

  // Create gradient
  const gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 200, 100, 0.5)");
  gradient.addColorStop(1, "rgba(255, 200, 100, 0)");

  // Draw circle
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    0,
    Math.PI * 2
  );
  context.fill();

  return new THREE.CanvasTexture(canvas);
})();

function addSparkleEffect(object) {
  // Create particle system with fewer particles
  const particleCount = 20;
  const particles = new THREE.BufferGeometry();

  // Particle attributes
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  const opacities = new Float32Array(particleCount);
  const velocities = [];
  const lifetimes = [];

  // Set initial position for particles
  for (let i = 0; i < particleCount; i++) {
    // Random position around the object
    const angle = Math.random() * Math.PI * 2;
    const radius = object.scale.x * 0.5; // Start closer to the object

    positions[i * 3] = object.position.x;
    positions[i * 3 + 1] = object.position.y;
    positions[i * 3 + 2] = object.position.z;

    // Random size
    sizes[i] = 0.1 + Math.random() * 0.2;

    // Initial opacity
    opacities[i] = 0;

    // Slight color variation
    colors[i * 3] = 1; // R
    colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
    colors[i * 3 + 2] = 0.6 + Math.random() * 0.4; // B

    // Slower velocity
    velocities.push({
      x: Math.cos(angle) * (0.2 + Math.random() * 0.3),
      y: (Math.random() - 0.5) * 0.8,
      z: Math.sin(angle) * (0.2 + Math.random() * 0.3),
    });

    // Longer lifetime
    lifetimes.push(1.5 + Math.random() * 1.5);
  }

  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Particle material with custom opacity handling
  const material = new THREE.PointsMaterial({
    size: 0.25,
    map: sparkleTexture,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 1.0,
  });

  // Create particle system
  const particleSystem = new THREE.Points(particles, material);
  object.parent.add(particleSystem);

  // Animation loop
  const clock = new THREE.Clock();
  let elapsed = 0;
  const duration = 3.0; // Extended duration

  function updateParticles() {
    const delta = clock.getDelta();
    elapsed += delta;

    if (elapsed > duration) {
      // Clean up
      object.parent.remove(particleSystem);
      return;
    }

    const positionAttr = particles.attributes.position;
    const sizeAttr = particles.attributes.size;

    // Update each particle
    for (let i = 0; i < particleCount; i++) {
      // Apply velocity - slower movement
      positionAttr.array[i * 3] += velocities[i].x * delta;
      positionAttr.array[i * 3 + 1] += velocities[i].y * delta;
      positionAttr.array[i * 3 + 2] += velocities[i].z * delta;

      // Calculate particle life progress (0 to 1)
      const particleLife = Math.min(elapsed / lifetimes[i], 1.0);

      // Adjust size based on lifetime - slower transitions
      if (particleLife < 0.3) {
        // Fade in
        sizeAttr.array[i] = sizes[i] * (particleLife / 0.3);
        opacities[i] = particleLife / 0.3;
      } else if (particleLife > 0.7) {
        // Smooth fade out
        const fadeOutProgress = (particleLife - 0.7) / 0.3;
        sizeAttr.array[i] = sizes[i] * (1 - fadeOutProgress * 0.5); // Size reduces a bit but not completely
        opacities[i] = 1 - fadeOutProgress;
      } else {
        // Full opacity during middle of lifetime
        opacities[i] = 1.0;
        sizeAttr.array[i] = sizes[i];
      }

      // Reduced gravity effect
      velocities[i].y -= 0.1 * delta;
    }

    // Apply opacities to material
    let totalOpacity = 0;
    for (let i = 0; i < particleCount; i++) {
      totalOpacity += opacities[i];
    }

    // Update material opacity based on average particle opacity
    material.opacity =
      totalOpacity > 0 ? Math.min(1.0, (totalOpacity / particleCount) * 2) : 0;

    positionAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    // Continue animation
    requestAnimationFrame(updateParticles);
  }

  // Start the animation
  updateParticles();
}

export function spinAnimation(object) {
  // Prevent spin if on cooldown
  if (cooldownSet.has(object)) return;

  // Begin cooldown
  cooldownSet.add(object);
  gsap.delayedCall(COOLDOWN_DURATION, () => {
    cooldownSet.delete(object);
  });

  // Update spin count
  const count = (spinCounts.get(object) ?? 0) + 1;
  spinCounts.set(object, count);

  // Determine if special effect should trigger
  const isSpecialSpin = count % 3 === 0;

  const rotationAmount = isSpecialSpin ? SPIN_AMOUNT * 1.5 : SPIN_AMOUNT;
  const duration = isSpecialSpin ? SPIN_DURATION * 0.7 : SPIN_DURATION;
  const newRotation = object.rotation.y + rotationAmount;

  // Optional special sparkle effect
  if (isSpecialSpin) {
    addSparkleEffect(object);
  }

  // Reset scale before spin
  gsap.to(object.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.2,
    onComplete: () => {
      // Spin
      gsap.to(object.rotation, {
        y: newRotation,
        duration,
        ease: "power2.out",
      });

      // Pulse effect
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

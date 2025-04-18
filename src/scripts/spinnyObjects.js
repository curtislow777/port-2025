import gsap from "gsap";
import * as THREE from "three";

// Store cooldowns and spin counts
const cooldownSet = new Set();
const spinCounts = new Map();

const SPIN_DURATION = 2; // seconds
const SPIN_AMOUNT = Math.PI * 2;
const COOLDOWN_DURATION = 2; // seconds

// Load the custom sparkle texture
const textureLoader = new THREE.TextureLoader();
const sparkleTexture = textureLoader.load("/images/sparkle.png");

function addSparkleEffect(object, options = {}) {
  // Default configuration
  const config = {
    particleCount: 20,
    particleSize: 0.4,
    particleSizeVariation: { min: 0.2, max: 0.5 },
    offsetY: 0,
    spread: 1.0,
    duration: 3.0,
    ...options,
  };

  // Create particle system
  const particleCount = config.particleCount;
  const particles = new THREE.BufferGeometry();

  // Particle attributes
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  const opacities = new Float32Array(particleCount);
  const velocities = [];
  const lifetimes = [];

  // Object center position with Y offset
  const centerPos = {
    x: object.position.x,
    y: object.position.y + config.offsetY,
    z: object.position.z,
  };

  // Set initial position for particles
  for (let i = 0; i < particleCount; i++) {
    // Random position around the object
    const angle = Math.random() * Math.PI * 2;
    const radius = object.scale.x * 0.5 * config.spread;

    // Position with offset
    positions[i * 3] =
      centerPos.x + Math.cos(angle) * radius * (Math.random() * 0.5);
    positions[i * 3 + 1] = centerPos.y + (Math.random() - 0.3) * radius * 0.5; // Slight upward bias
    positions[i * 3 + 2] =
      centerPos.z + Math.sin(angle) * radius * (Math.random() * 0.5);

    // Random size within range
    sizes[i] =
      config.particleSizeVariation.min +
      Math.random() *
        (config.particleSizeVariation.max - config.particleSizeVariation.min);

    // Initial opacity
    opacities[i] = 0;

    // Slight color variation - keeping white/yellow to preserve texture colors
    colors[i * 3] = 1; // R
    colors[i * 3 + 1] = 0.9 + Math.random() * 0.1; // G
    colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B

    // Velocity with upward bias for higher objects
    velocities.push({
      x: Math.cos(angle) * (0.2 + Math.random() * 0.3),
      y: Math.random() * 0.5 * 0.8, // More upward movement
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
    size: config.particleSize,
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
  const duration = config.duration;

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

// This function detects if an object is a globe or chair based on its name
function getObjectSparkleOptions(object) {
  const objectName = object.name.toLowerCase();

  if (objectName.includes("globe")) {
    // Globe-specific sparkle options
    return {
      particleSize: 0.4,
      particleSizeVariation: { min: 0.2, max: 0.5 },
      offsetY: 0,
      spread: 1.0,
    };
  } else if (objectName.includes("chair")) {
    // Chair-specific sparkle options
    return {
      particleCount: 12, // More particles for chairs
      particleSize: 0.8,
      particleSizeVariation: { min: 0.4, max: 0.8 },
      offsetY: 0.4, // Higher position
      spread: 2, // Wider spread
    };
  }

  // Default options for other objects
  return {};
}

export function spinAnimation(object) {
  if (cooldownSet.has(object)) return false;

  cooldownSet.add(object);
  gsap.delayedCall(COOLDOWN_DURATION, () => {
    cooldownSet.delete(object);
  });

  const count = (spinCounts.get(object) ?? 0) + 1;
  spinCounts.set(object, count);

  const isSpecialSpin = count % 3 === 0;
  const rotationAmount = isSpecialSpin ? SPIN_AMOUNT * 1.5 : SPIN_AMOUNT;
  const duration = isSpecialSpin ? SPIN_DURATION * 0.7 : SPIN_DURATION;
  const newRotation = object.rotation.y + rotationAmount;

  if (isSpecialSpin) {
    const sparkleOptions = getObjectSparkleOptions(object);
    addSparkleEffect(object, sparkleOptions);
  }

  gsap.to(object.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.2,
    onComplete: () => {
      gsap.to(object.rotation, {
        y: newRotation,
        duration,
        ease: "power2.out",
      });

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

  return true;
}

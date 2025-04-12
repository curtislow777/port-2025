// fanRotation.js - Module for managing fan rotation animations in 3D scene

// Store fans in arrays based on their rotation axis
const fans = {
  xAxis: [],
  yAxis: [],
  zAxis: [],
};

// Default rotation speed
let rotationSpeed = 0.05;

/**
 * Process a mesh to determine if it's a fan and add it to the appropriate collection
 * @param {THREE.Mesh} mesh - The mesh to process
 */
function processFanObject(mesh) {
  if (!mesh.name.includes("fan")) return;

  if (mesh.name.includes("animateX")) {
    fans.xAxis.push(mesh);
  } else if (mesh.name.includes("animateY")) {
    fans.yAxis.push(mesh);
  } else if (mesh.name.includes("animateZ")) {
    fans.zAxis.push(mesh);
  }
}

/**
 * Update all fan rotations - call this in your render loop
 */
function updateFans() {
  // Rotate fans on X axis
  fans.xAxis.forEach((fan) => {
    fan.rotation.x -= rotationSpeed;
  });

  // Rotate fans on Y axis
  fans.yAxis.forEach((fan) => {
    fan.rotation.y -= rotationSpeed;
  });

  // Rotate fans on Z axis
  fans.zAxis.forEach((fan) => {
    fan.rotation.z -= rotationSpeed;
  });
}

/**
 * Get all fans regardless of axis
 * @returns {Array} All fan objects
 */
function getAllFans() {
  return [...fans.xAxis, ...fans.yAxis, ...fans.zAxis];
}

export { processFanObject, updateFans, getAllFans };

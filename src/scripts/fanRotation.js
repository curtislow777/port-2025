const fans = {
  xAxis: [],
  yAxis: [],
  zAxis: [],
};

let rotationSpeed = 0.05;

/**
 * Process  mesh to determine if it's a fan
 * @param {THREE.Mesh} mesh -
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

function updateFans() {
  fans.xAxis.forEach((fan) => {
    fan.rotation.x -= rotationSpeed;
  });
  fans.yAxis.forEach((fan) => {
    fan.rotation.y -= rotationSpeed;
  });
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

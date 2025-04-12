// scripts/hoverOutline.js

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export function setupHoverOutline(renderer, scene, camera, sizes) {
  const composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const outlinePass = new OutlinePass(
    new THREE.Vector2(sizes.width, sizes.height),
    scene,
    camera
  );

  outlinePass.edgeStrength = 5.0;
  outlinePass.edgeThickness = 2.0;
  outlinePass.edgeGlow = 0.0;
  outlinePass.pulsePeriod = 0;
  outlinePass.usePatternTexture = false;
  outlinePass.visibleEdgeColor.set("#ffffff");
  outlinePass.hiddenEdgeColor.set("#ffffff");

  composer.addPass(outlinePass);
  composer.addPass(new OutputPass());

  return {
    composer,
    outlinePass,
  };
}

export function updateOutlineHover(
  raycaster,
  pointer,
  camera,
  targets,
  outlinePass
) {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    const selectedObjects = [selectedObject, ...selectedObject.children];
    outlinePass.selectedObjects = selectedObjects;
    document.body.style.cursor = "pointer";
    return intersects; // return in case other scripts want to use the info
  } else {
    outlinePass.selectedObjects = [];
    document.body.style.cursor = "default";
    return [];
  }
}

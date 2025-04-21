import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";

export function initInnerWeb(
  scene,
  camera,
  domParent,
  sizes,
  {
    html = `<iframe
               src="https://example.com"
               style="width:100%;height:100%;border:0;border-radius:8px;"></iframe>`,
    position = new THREE.Vector3(0, 1.5, 0),
    rotation = new THREE.Euler(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
  } = {}
) {
  // ——— CSS3D Renderer ———
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(sizes.width, sizes.height);
  Object.assign(cssRenderer.domElement.style, {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
    pointerEvents: "auto", // allow iframe-interaction by default
  });
  domParent.appendChild(cssRenderer.domElement);

  // ——— Your iframe element (or any HTML) ———
  const element = typeof html === "string" ? htmlToElement(html) : html;
  element.style.width ||= "600px";
  element.style.height ||= "400px";

  const cssObject = new CSS3DObject(element);
  cssObject.position.copy(position);
  cssObject.rotation.copy(rotation);
  cssObject.scale.copy(scale);
  scene.add(cssObject);

  // ——— Helpers ———
  function onResize() {
    cssRenderer.setSize(sizes.width, sizes.height);
  }

  // Toggle pointer‐events on/off
  function toggleIframe() {
    const pe = cssRenderer.domElement.style.pointerEvents;
    cssRenderer.domElement.style.pointerEvents =
      pe === "none" ? "auto" : "none";
  }

  return {
    cssRenderer,
    cssObject,
    onResize,
    toggleIframe,
  };
}

// Utility to convert HTML string → Element
function htmlToElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

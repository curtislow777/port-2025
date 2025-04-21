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
               style="width:100%;height:100%;border:0;border-radius:8px;">
             </iframe>`,
    position = new THREE.Vector3(0, 1.5, 0),
    rotation = new THREE.Euler(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
  } = {}
) {
  // ——— 1) always let clicks pass through the CSS3D layer
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(sizes.width, sizes.height);
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.top = "0";
  cssRenderer.domElement.style.left = "0";
  cssRenderer.domElement.style.zIndex = "1";
  cssRenderer.domElement.style.pointerEvents = "none";
  domParent.appendChild(cssRenderer.domElement);

  // ——— 2) build your iframe *wrapper*
  const element = typeof html === "string" ? htmlToElement(html) : html;
  element.style.width ||= "600px";
  element.style.height ||= "400px";

  const wrapper = document.createElement("div");
  wrapper.style.width = element.style.width;
  wrapper.style.height = element.style.height;
  wrapper.style.pointerEvents = "none"; // start *disabled*
  wrapper.appendChild(element);

  const cssObject = new CSS3DObject(wrapper);
  cssObject.position.copy(position);
  cssObject.rotation.copy(rotation);
  cssObject.scale.copy(scale);
  scene.add(cssObject);

  // ——— Helpers
  function onResize() {
    cssRenderer.setSize(sizes.width, sizes.height);
  }
  function enableIframe() {
    wrapper.style.pointerEvents = "auto";
  }
  function disableIframe() {
    wrapper.style.pointerEvents = "none";
  }
  function toggleIframe() {
    wrapper.style.pointerEvents =
      wrapper.style.pointerEvents === "none" ? "auto" : "none";
  }

  return {
    cssRenderer,
    cssObject,
    onResize,
    enableIframe,
    disableIframe,
    toggleIframe,
  };
}

// minor util
function htmlToElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

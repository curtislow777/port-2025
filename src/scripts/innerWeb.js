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
    createShadowMesh = true, // optional, to add the shadow mesh from makeElementObject
    elementWidth = 600, // default width for element
    elementHeight = 400, // default height for element
  } = {}
) {
  // ——— 1) Always let clicks pass through the CSS3D layer
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(sizes.width, sizes.height);
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.top = "0";
  cssRenderer.domElement.style.left = "0";
  cssRenderer.domElement.style.zIndex = "1";
  cssRenderer.domElement.style.pointerEvents = "none";
  document.querySelector("#css3d").appendChild(cssRenderer.domElement);

  // ——— 2) Create the object with the element and optional shadow
  const elementObject = makeElementObject("div", elementWidth, elementHeight);
  elementObject.css3dObject.position.copy(position);
  elementObject.css3dObject.rotation.copy(rotation);
  elementObject.css3dObject.scale.copy(scale);

  scene.add(elementObject.css3dObject);

  // ——— Helpers
  function onResize() {
    cssRenderer.setSize(sizes.width, sizes.height);
  }
  function enableIframe() {
    elementObject.css3dObject.element.style.pointerEvents = "auto";
  }
  function disableIframe() {
    elementObject.css3dObject.element.style.pointerEvents = "none";
  }
  function toggleIframe() {
    elementObject.css3dObject.element.style.pointerEvents =
      elementObject.css3dObject.element.style.pointerEvents === "none"
        ? "auto"
        : "none";
  }

  return {
    cssRenderer,
    cssObject: elementObject.css3dObject,
    onResize,
    enableIframe,
    disableIframe,
    toggleIframe,
  };
}

// Minor util to convert HTML string to element
function htmlToElement(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

// Function to create the element object with CSS3DObject and optional shadow mesh
function makeElementObject(type, width, height) {
  const obj = new THREE.Object3D();
  const element = document.createElement(type);
  element.style.width = width + "px";
  element.style.height = height + "px";
  element.style.opacity = 0.999;
  element.style.boxSizing = "border-box";

  // Create CSS3DObject
  var css3dObject = new CSS3DObject(element);
  obj.css3dObject = css3dObject;
  obj.add(css3dObject);

  // Make an invisible plane for clipping (shadow mesh)
  var material = new THREE.MeshPhongMaterial({
    opacity: 0.15,
    color: new THREE.Color(0x111111),
    blending: THREE.NoBlending,
  });
  var geometry = new THREE.BoxGeometry(width, height, 1);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  obj.add(mesh);

  return obj;
}

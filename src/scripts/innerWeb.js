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
    interactiveByDefault = false,
  } = {}
) {
  // Create a separate scene for CSS3D objects
  const cssScene = new THREE.Scene();

  // Setup CSS3D renderer
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(sizes.width, sizes.height);
  cssRenderer.domElement.style.position = "absolute";
  cssRenderer.domElement.style.top = "0";
  cssRenderer.domElement.style.left = "0";

  // This is important! Keep this line to allow clicking through to WebGL objects
  cssRenderer.domElement.style.pointerEvents = "auto";

  cssRenderer.domElement.style.zIndex = 0; // CSS3D BELOW
  domParent.appendChild(cssRenderer.domElement);

  // Build iframe wrapper
  const element = typeof html === "string" ? htmlToElement(html) : html;
  const elementWidth = parseInt(element.style.width || "600px");
  const elementHeight = parseInt(element.style.height || "400px");

  const wrapper = document.createElement("div");
  wrapper.style.width = `${elementWidth}px`;
  wrapper.style.height = `${elementHeight}px`;

  // Set initial interaction state - important difference
  wrapper.style.pointerEvents = interactiveByDefault ? "auto" : "none";

  wrapper.appendChild(element);

  // Create CSS3D object
  const cssObject = new CSS3DObject(wrapper);
  cssObject.position.copy(position);
  cssObject.rotation.copy(rotation);
  cssObject.scale.copy(scale);
  cssScene.add(cssObject);

  // Create an occlusion plane with NoBlending
  const occlusionMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.NoBlending,
    depthWrite: true,
    depthTest: true,
  });

  // Create a plane geometry that matches the iframe dimensions
  const planeGeometry = new THREE.PlaneGeometry(elementWidth, elementHeight);
  const occlusionPlane = new THREE.Mesh(planeGeometry, occlusionMaterial);

  // Apply the same transformations to the occlusion plane
  occlusionPlane.position.copy(position);
  occlusionPlane.rotation.copy(rotation);
  occlusionPlane.scale.copy(scale);

  // Name it for raycasting identification
  occlusionPlane.name = "iframeInteractionPlane";

  // Add the occlusion plane to the main scene
  scene.add(occlusionPlane);

  function render() {
    // Render the WebGL content first (handled outside this function)
    // Then render the CSS3D content
    cssRenderer.render(cssScene, camera);
  }

  function onResize() {
    cssRenderer.setSize(sizes.width, sizes.height);
  }

  function enableIframe() {
    wrapper.style.pointerEvents = "auto";
    console.log("enableIframe called - iframe is now interactive");
  }

  function disableIframe() {
    wrapper.style.pointerEvents = "none";
    console.log("disableIframe called - iframe is now non-interactive");
  }

  function toggleIframe() {
    const newState = wrapper.style.pointerEvents === "none" ? "auto" : "none";
    wrapper.style.pointerEvents = newState;
    console.log(`Iframe interaction toggled to: ${newState}`);
  }

  function updatePosition(newPosition, newRotation, newScale) {
    if (newPosition) {
      cssObject.position.copy(newPosition);
      occlusionPlane.position.copy(newPosition);
    }

    if (newRotation) {
      cssObject.rotation.copy(newRotation);
      occlusionPlane.rotation.copy(newRotation);
    }

    if (newScale) {
      cssObject.scale.copy(newScale);
      occlusionPlane.scale.copy(newScale);
    }
  }

  return {
    cssRenderer,
    cssObject,
    occlusionPlane,
    cssScene,
    render,
    onResize,
    enableIframe,
    disableIframe,
    toggleIframe,
    updatePosition,
  };
}

// Utility function to create elements from HTML strings
function htmlToElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

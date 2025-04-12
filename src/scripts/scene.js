// File: src/scripts/scene.js
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// If you still want your outline pass or post-processing inside here, you can,
// but let's keep camera stuff minimal so there's no conflict with CameraManager.

export function initThreeJS(canvas, sizes) {
  // 1) Loading managers + loaders
  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);

  // 2) Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8e8);
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  // 3) Camera (but no OrbitControls yet)
  const camera = new THREE.PerspectiveCamera(
    35,
    sizes.width / sizes.height,
    0.1,
    1000
  );
  // Position can be optional here. The actual desired position
  // might be set by CameraManager's constructor or methods.

  // 4) Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // 5) Return what you need
  return {
    scene,
    camera,
    renderer,
    pointer,
    raycaster,
    loadingManager,
    textureLoader,
    gltfLoader,
  };
}

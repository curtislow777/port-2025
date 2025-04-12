// File: src/scripts/initThreeJS.js
import * as THREE from "three";
import { OrbitControls } from "../utils/OrbitControls.js";
import { setupHoverOutline } from "./hoverOutline.js"; // or wherever your outline function lives
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export function initThreeJS(canvas, sizes) {
  // ------------------ Loading Manager ------------------
  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");

  const gltfLoader = new GLTFLoader(loadingManager);
  gltfLoader.setDRACOLoader(dracoLoader);

  // ------------------ Scene ------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8e8);

  // ------------------ Camera ------------------
  const camera = new THREE.PerspectiveCamera(
    35,
    sizes.width / sizes.height,
    0.1,
    1000
  );
  // Position the camera wherever you like:
  camera.position.set(15.53, 11.14, 20.73);

  // ------------------ Renderer ------------------
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // ------------------ OrbitControls ------------------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0;
  controls.maxDistance = 50;

  // controls.minPolarAngle = 0;
  // controls.maxPolarAngle = Math.PI / 2;
  // controls.minAzimuthAngle = 0;
  // controls.maxAzimuthAngle = Math.PI / 2; // Limit rotation to 180 degrees

  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(-0.35, 3.0, 0.64);
  controls.update();

  // ------------------ Post Processing (Hover Outline) ------------------
  let composer, outlinePass;
  const { composer: outlineComposer, outlinePass: hoverOutlinePass } =
    setupHoverOutline(renderer, scene, camera, sizes);
  composer = outlineComposer;
  outlinePass = hoverOutlinePass;

  // ------------------ Raycaster Setup ------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // Return all core objects we need elsewhere
  return {
    scene,
    camera,
    renderer,
    controls,
    composer,
    outlinePass,
    raycaster,
    pointer,
    loadingManager,
    textureLoader,
    gltfLoader,
  };
}

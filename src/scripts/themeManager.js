import * as THREE from "three";
import gsap from "gsap";
import {
  themeVertexShader,
  themeFragmentShader,
} from "./shaders/themeShader.js";

class ThemeManager {
  constructor() {
    if (typeof window !== "undefined" && ThemeManager._instance) {
      return ThemeManager._instance;
    }

    ThemeManager._instance = this;
    // Initialize state
    this.isDarkMode = false;
    this.uMixRatio = { value: 0 };
    this.themeToggle = document.getElementById("theme-toggle");
    this.body = document.body;

    // Store themed meshes that need updating
    this.themedMeshes = [];

    // Initialize event listeners
    this.initEventListeners();
  }

  initEventListeners() {
    // Theme toggle functionality with GSAP animation
    this.themeToggle.addEventListener("click", () => {
      this.toggleTheme();
    });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;

    // Update UI
    this.themeToggle.innerHTML = this.isDarkMode
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';

    this.body.classList.toggle("dark-theme", this.isDarkMode);
    this.body.classList.toggle("light-theme", !this.isDarkMode);

    this.updateThreeJSTheme();
  }

  updateThreeJSTheme() {
    // Animate uMixRatio for shader blending
    gsap.to(this.uMixRatio, {
      value: this.isDarkMode ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }

  getTextureKeyFromName(meshName) {
    if (meshName.includes("-one")) return "one";
    if (meshName.includes("-two")) return "two";
    if (meshName.includes("-three")) return "three";
    if (meshName.includes("-fourA")) return "fourA";
    if (meshName.includes("-fourB")) return "fourB";
    if (meshName.includes("-five")) return "five";
    if (meshName.includes("-sixA")) return "sixA";
    if (meshName.includes("-sixB")) return "sixB";
    if (meshName.includes("-seven")) return "seven";
    if (meshName.includes("-eight")) return "eight";
    if (meshName.includes("-nine")) return "nine";
    if (meshName.includes("-emissive")) return "emissive";

    return null;
  }

  loadTexture(textureLoader, path) {
    const tex = textureLoader.load(path);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  loadAllTextures(textureLoader) {
    const textureMap = {
      one: {
        day: "/textures/day/Day-Texture1.webp",
        night: "/textures/night/Night-Texture1.webp",
      },
      two: {
        day: "/textures/day/Day-Texture2.webp",
        night: "/textures/night/Night-Texture2.webp",
      },
      three: {
        day: "/textures/day/Day-Texture3.webp",
        night: "/textures/night/Night-Texture3.webp",
      },
      fourA: {
        day: "/textures/day/Day-Texture4A.webp",
        night: "/textures/night/Night-Texture4A.webp",
      },
      fourB: {
        day: "/textures/day/Day-Texture4B.webp",
        night: "/textures/night/Night-Texture4B.webp",
      },
      five: {
        day: "/textures/day/Day-Texture5.webp",
        night: "/textures/night/Night-Texture5.webp",
      },
      sixA: {
        day: "/textures/day/Day-Texture6A.webp",
        night: "/textures/night/Night-Texture6A.webp",
      },
      sixB: {
        day: "/textures/day/Day-Texture6B.webp",
        night: "/textures/night/Night-Texture6B.webp",
      },
      seven: {
        day: "/textures/day/Day-Texture7.webp",
        night: "/textures/night/Night-Texture7.webp",
      },
      eight: {
        day: "/textures/day/Day-Texture8.webp",
        night: "/textures/night/Night-Texture8.webp",
      },
      nine: {
        day: "/textures/day/Day-Texture9.webp",
        night: "/textures/night/Night-Texture9.webp",
      },
      emissive: {
        day: "/textures/day/Day-Emissive.webp",
        night: "/textures/night/NightEmissive.webp",
      },
    };

    const loadedTextures = {
      day: {},
      night: {},
    };

    Object.entries(textureMap).forEach(([key, paths]) => {
      loadedTextures.day[key] = this.loadTexture(textureLoader, paths.day);
      loadedTextures.night[key] = this.loadTexture(textureLoader, paths.night);
    });

    return { textureMap, loadedTextures };
  }

  processThemedMesh(child, loadedTextures) {
    const textureKey = this.getTextureKeyFromName(child.name);

    if (textureKey) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uDayTexture: { value: loadedTextures.day[textureKey] },
          uNightTexture: { value: loadedTextures.night[textureKey] },
          uMixRatio: this.uMixRatio, // shared reference
        },
        vertexShader: themeVertexShader,
        fragmentShader: themeFragmentShader,
      });

      // Clone the material so it's independent
      child.material = material;
      this.themedMeshes.push(child);

      return true;
    }

    return false;
  }

  loadGlassEnvironmentMap(
    path = "textures/skybox/",
    files = ["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]
  ) {
    const loader = new THREE.CubeTextureLoader().setPath(path);
    const cubeMap = loader.load(files);

    cubeMap.colorSpace = THREE.SRGBColorSpace;
    cubeMap.magFilter = THREE.LinearFilter;
    cubeMap.minFilter = THREE.LinearMipmapLinearFilter;
    cubeMap.generateMipmaps = true;
    cubeMap.needsUpdate = true;

    return cubeMap;
  }

  createGlassMaterial() {
    const glassEnvMap = this.loadGlassEnvironmentMap();

    return new THREE.MeshPhysicalMaterial({
      transmission: 1,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.01,
      specularIntensity: 1,
      envMap: glassEnvMap,
      envMapIntensity: 1,
    });
  }

  processGlassMesh(child) {
    if (child.name.includes("glass")) {
      child.material = this.createGlassMaterial();
      return true;
    }
    return false;
  }
}

const themeManagerInstance = new ThemeManager();
export default themeManagerInstance;

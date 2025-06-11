import * as THREE from "three";

// Interactive content configuration - images and links
export const imageData = {
  "baby-cyrus-twelve-raycast": {
    src: "images/bb-cyrus.webp",
    caption: "nimama",
  },
  "ded-casper-twelve-raycast": {
    src: "images/casper-buh.webp",
    caption: "nimama",
  },
  "casper-pawty-twelve-raycast": {
    src: "images/caspuh_party.webp",
    caption: "nimama",
  },
  "caspuh-frame-twelve-raycast": {
    src: "images/caspuh2.webp",
    caption: "nimama",
  },
  "baby-casper-twelve-raycast": {
    src: "images/caspuh.webp",
    caption: "nimama",
  },
  "cat-twelve-raycast": {
    src: "images/cat.webp",
    caption: "nimama",
  },
  "casp-cyrus-twelve-raycast": {
    src: "images/cc.webp",
    caption: "nimama",
  },
  "collection-twelve-raycast": {
    src: "images/collection.webp",
    caption: "nimama",
  },
  "cyrus-eating-0-twelve-raycast": {
    src: "images/cyrus-eating-0.webp",
    caption: "nimama",
  },
  "cyrus-frame-twelve-raycast": {
    src: "images/cyrus.webp",
    caption: "nimama",
  },
  "ac-card-twelve-raycast": {
    src: "images/ac-2.webp",
    caption: "nimama",
  },
  "goofy-casper-twelve-raycast": {
    src: "images/lmao.webp",
    caption: "nimama",
  },
  "shoes-twelve-raycast": {
    src: "images/shoes.webp",
    caption: "nimama",
  },
  "wolf_card-twelve-raycast": {
    src: "images/wolf.webp",
    caption: "nimama",
  },
};

// Social media links configuration
export const socialLinks = {
  Github: "https://github.com/curtislow777",
  LinkedIn: "https://www.linkedin.com/in/curtis-low/",
};
// Canvas and sizing configuration
export const CANVAS_CONFIG = {
  selector: "#experience-canvas",
  clearColor: 0x000000,
  clearAlpha: 1,
};

// Default camera configuration
export const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 100,
  defaultPosition: new THREE.Vector3(15.53, 11.14, 20.73),
  defaultTarget: new THREE.Vector3(-0.35, 3.0, 0.64),
};

// Whiteboard configuration
export const WHITEBOARD_CONFIG = {
  position: new THREE.Vector3(-5.75, 4.337178707122803, 0.6635734438896179),
  rotation: new THREE.Euler(0, Math.PI / 2, 0),
};

// Monitor/InnerWeb configuration
export const INNER_WEB_CONFIG = {
  html: `<iframe
         src="https://inner-portfolio-js.vercel.app/"
         style="width:1200px;height:675px; border:0;border-radius:8px;"
       ></iframe>`,
  position: new THREE.Vector3(-4.85, 3.2133445739746094, 0.14998430013656616),
  rotation: new THREE.Euler(0, Math.PI / 2, 0),
  scale: new THREE.Vector3(0.00137, 0.00137, 0.00137),
};

// Steam effect configuration
export const STEAM_CONFIG = {
  position: new THREE.Vector3(-4.177665710449219, 2.85, 1.0796866416931152),
  geometry: {
    width: 0.15,
    height: 0.6,
    segments: 16,
  },
  texture: {
    src: "/images/perlin.png",
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.RepeatWrapping,
  },
};

// Modal selectors
export const MODAL_SELECTORS = {
  overlay: ".overlay",
  modals: {
    work: ".work-modal",
    about: ".about-modal",
    contact: ".contact-modal",
    erhu: ".erhu-modal",
  },
  closeButton: ".modal-close-btn",
};

// Image overlay selectors
export const IMAGE_OVERLAY_SELECTORS = {
  overlay: ".fade-overlay",
  content: ".fade-overlay-content",
  closeBtn: ".fade-overlay-close-btn",
  img: ".fade-overlay-img",
  text: ".fade-overlay-text",
};

// Loading screen selectors
export const LOADING_SELECTORS = {
  screen: ".loading-screen",
  button: ".loading-screen-btn",
  bar: ".loading-bar",
  barFill: ".loading-bar-fill",
};

// Side panel selectors
export const SIDE_PANEL_SELECTORS = {
  hamburgerBtn: ".hamburger-btn",
  sidePanel: ".side-panel",
  panelLinks: ".panel-link",
};

// Animation durations
export const ANIMATION_DURATIONS = {
  steamToggle: 1.0,
  introAnimation: 0.8,
  modalTransition: 0.3,
  loadingFade: 1.0,
  hoverScale: 0.2,
};

// Model paths
export const MODEL_PATHS = {
  room: "/models/room-port-v1.glb",
  draco: "/draco/",
};

// Button IDs
export const BUTTON_IDS = {
  themeToggle: "theme-toggle",
  soundToggle: "sound-toggle",
  backButton: "back-button",
};

import * as THREE from "three";

export default class Whiteboard {
  constructor(scene, camera, renderer, controls) {
    // Store references to main components
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.canvasWidth = 2048;
    this.canvasHeight = 2048 * 0.65;
    this.drawStartPos = new THREE.Vector2(-1, -1);
    this.drawColor = "black";
    this.isActive = false;
    this.drawing = false;
    this.whiteboardModeOn = false;
    this.whiteboardGroup = new THREE.Group();

    // Initialize the whiteboard
    this.init();
  }

  init() {
    this.setupCanvas();
    this.createWhiteboardMesh();
    this.setupEventListeners();
  }

  setupCanvas() {
    // Create an offscreen canvas for drawing
    this.drawingCanvas = document.createElement("canvas");
    this.drawingCanvas.width = this.canvasWidth;
    this.drawingCanvas.height = this.canvasHeight;
    this.drawingContext = this.drawingCanvas.getContext("2d");

    // Set up drawing style
    this.drawingContext.lineWidth = 8;
    this.drawingContext.lineJoin = "round";
    this.drawingContext.lineCap = "round";
    this.drawingContext.fillStyle = "white";
    this.drawingContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  createWhiteboardMesh() {
    // Create material with canvas texture
    this.canvasTexture = new THREE.CanvasTexture(this.drawingCanvas);
    this.canvasTexture.anisotropy =
      this.renderer.capabilities.getMaxAnisotropy();
    this.canvasTexture.generateMipmaps = true;
    this.canvasTexture.magFilter = THREE.LinearFilter;
    this.canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;

    this.whiteboardMaterial = new THREE.MeshBasicMaterial({
      map: this.canvasTexture,
    });

    const whiteboardGeom = new THREE.PlaneGeometry(2.6, 2.6 * 0.65);
    this.whiteboardMesh = new THREE.Mesh(
      whiteboardGeom,
      this.whiteboardMaterial
    );
    this.whiteboardMesh.name = "whiteboardCanvas";

    // Add to scene
    this.whiteboardGroup.add(this.whiteboardMesh);
    this.scene.add(this.whiteboardGroup);
  }

  setupEventListeners() {
    // Add button click events for tools
    this.whiteboardButtons = document.querySelectorAll(
      ".circular-button-whiteboard"
    );
    this.whiteboardButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.changeWhiteboardColor(button.id);
        this.whiteboardButtons.forEach((btn) => {
          btn.classList.remove("whiteboard-selected");
        });
        button.classList.add("whiteboard-selected");
      });
    });

    // Set up mouse events for drawing
    this.activateControls();
  }

  onMouseDown(event) {
    if (!this.whiteboardModeOn) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.whiteboardMesh);

    if (intersects.length > 0) {
      this.drawing = true;
      this.drawStartPos.set(
        intersects[0].uv.x * this.canvasWidth,
        this.canvasHeight - intersects[0].uv.y * this.canvasHeight
      );
      this.drawingContext.beginPath();
    }
  }

  onMouseMove(event) {
    if (!this.whiteboardModeOn || !this.drawing) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.whiteboardMesh);

    if (intersects.length > 0) {
      const x = intersects[0].uv.x * this.canvasWidth;
      const y = this.canvasHeight - intersects[0].uv.y * this.canvasHeight;
      this.draw(x, y);
    } else {
      this.drawing = false;
    }
  }

  onMouseUp() {
    if (!this.whiteboardModeOn) return;

    this.drawing = false;
    this.drawingContext.closePath();
  }

  draw(x, y) {
    this.drawingContext.strokeStyle = this.drawColor;
    this.drawingContext.moveTo(this.drawStartPos.x, this.drawStartPos.y);
    this.drawingContext.lineTo(x, y);
    this.drawingContext.stroke();
    this.drawStartPos.set(x, y);
    this.canvasTexture.needsUpdate = true;
  }

  throttle(func, delay) {
    let timeoutId;
    return (...args) => {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          timeoutId = null;
        }, delay);
      }
    };
  }

  changeWhiteboardColor(key) {
    const config = {
      "black-marker": { color: "black", lineWidth: 8 },
      "red-marker": { color: "red", lineWidth: 8 },
      "green-marker": { color: "darkgreen", lineWidth: 8 },
      "blue-marker": { color: "blue", lineWidth: 8 },
      eraser: { color: "white", lineWidth: 50 },
    };

    const { color, lineWidth } = config[key] || config["black-marker"];
    this.drawColor = color;
    this.drawingContext.lineWidth = lineWidth;
  }

  activateControls() {
    window.addEventListener("pointerdown", this.onMouseDown.bind(this), false);
    window.addEventListener(
      "pointermove",
      this.throttle(this.onMouseMove.bind(this), 15),
      false
    );
    window.addEventListener("pointerup", this.onMouseUp.bind(this), false);
    this.isActive = true;
  }

  deactivateControls() {
    window.removeEventListener(
      "pointerdown",
      this.onMouseDown.bind(this),
      false
    );
    window.removeEventListener(
      "pointermove",
      this.throttle(this.onMouseMove.bind(this), 15),
      false
    );
    window.removeEventListener("pointerup", this.onMouseUp.bind(this), false);
    this.isActive = false;
  }

  update() {
    // This method can be called from the main render loop
    // to update any continuous state changes
    if (!this.isActive) return;

    // Additional update logic can go here
    // For example, checking if the camera's view of the whiteboard has changed
  }

  // Optional: Method to clear the whiteboard
  clear() {
    this.drawingContext.fillStyle = "white";
    this.drawingContext.fillRect(0, 0, 2048, 1024);
    this.canvasTexture.needsUpdate = true;
  }

  // Optional: Method to toggle visibility
  toggle() {
    this.whiteboardGroup.visible = !this.whiteboardGroup.visible;
    return this.whiteboardGroup.visible;
  }

  // Optional: Method to set whiteboard position and rotation
  setPosition(x, y, z) {
    this.whiteboardMesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.whiteboardMesh.rotation.set(x, y, z);
  }
  toggleWhiteboardMode(state) {
    this.whiteboardModeOn = state;
  }
}

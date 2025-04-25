import * as THREE from "three";

export default class Whiteboard {
  constructor(scene, camera, renderer, controls) {
    // Store references to main components
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls; // Store the controls instance
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.canvasWidth = 2048;
    this.canvasHeight = 2048 * 0.65;
    this.drawStartPos = new THREE.Vector2(-1, -1);
    this.drawColor = "black";
    this.isActive = false;
    this.drawing = false;
    this.whiteboardModeOn = false; // Renamed for clarity:  true = drawing/active, false = inactive
    this.whiteboardVisible = true;
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

    const whiteboardGeom = new THREE.PlaneGeometry(
      2.6 * 0.725,
      2.6 * 0.65 * 0.725
    );
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
    this.activateControls(); // Call this to set up the bound functions, but they only fire when this.isActive is true.
  }

  onMouseDown(event) {
    if (!this.whiteboardModeOn) return; // Only process if whiteboardModeOn

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
    if (!this.whiteboardModeOn || !this.drawing) return; // Only process if drawing

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
    if (!this.whiteboardModeOn) return; // Only process if whiteboardModeOn

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
    // Only attach event listeners once.  The  this.whiteboardModeOn flag controls if they *do* anything.
    if (!this.boundMouseDown) {
      // Check if they are already bound
      this.boundMouseDown = this.onMouseDown.bind(this);
      this.boundMouseMove = this.throttle(this.onMouseMove.bind(this), 15);
      this.boundMouseUp = this.onMouseUp.bind(this);

      window.addEventListener("pointerdown", this.boundMouseDown, false);
      window.addEventListener("pointermove", this.boundMouseMove, false);
      window.addEventListener("pointerup", this.boundMouseUp, false);
    }
    this.isActive = true; //Set to true, so that the events can be removed if necessary
  }

  deactivateControls() {
    // Remove event listeners.
    if (this.boundMouseDown) {
      // Check if they are bound
      window.removeEventListener("pointerdown", this.boundMouseDown, false);
      window.removeEventListener("pointermove", this.boundMouseMove, false);
      window.removeEventListener("pointerup", this.boundMouseUp, false);
    }
    this.isActive = false;
  }

  update() {
    // This method can be called from the main render loop
    // to update any continuous state changes
    // Additional update logic can go here
  }

  // Method to clear the whiteboard
  clear() {
    this.drawingContext.fillStyle = "white";
    this.drawingContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Toggles the whiteboard drawing mode (and therefore, OrbitControls).
   * @param {boolean} enable - True to enable drawing mode (and disable controls), false to disable.
   */
  toggleWhiteboardMode(enable) {
    this.whiteboardModeOn = enable;

    if (this.controls) {
      this.controls.enabled = !enable; // Disable controls when whiteboard mode is on
    }

    // Activate or deactivate drawing event listeners based on mode.  Use the this.isActive flag.
    if (enable) {
      this.activateControls(); // Ensure controls are set up
    } else {
      this.deactivateControls();
    }

    const whiteboardUI = document.querySelector(".whiteboard-controls");
    if (whiteboardUI) {
      whiteboardUI.style.display = enable ? "flex" : "none";
    }
  }

  // Optional: Method to set whiteboard position and rotation
  setPosition(x, y, z) {
    this.whiteboardMesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.whiteboardMesh.rotation.set(x, y, z);
  }
}

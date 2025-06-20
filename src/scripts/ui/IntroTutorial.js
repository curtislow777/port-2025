// IntroTutorial.js - Final corrected version with stable world-space tracking and placement
import * as THREE from "three";
import gsap from "gsap";

export class IntroTutorial {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.raycasterController = options.raycasterController;
    this.cameraControls = options.cameraControls;

    this.isActive = false;
    this.currentStep = 0;
    this.tutorialSteps = [];

    this.ui = {
      overlay: null,
      cursor: null,
      bubble: null,
      bubbleContent: null,
      skipButton: null,
      prevButton: null,
      nextButton: null,
      currentStepIndicator: null,
      totalStepsIndicator: null,
    };

    this.animationSpeed = 1;
    this.glowPulseSpeed = 1.5;
    this.pulseAnimation = null;
    this.currentHighlightedObjects = null;
    this.originalOutlineValues = null;
    this.originalCameraControlsEnabled = true;

    this.init();
  }

  init() {
    this.createUI();
    this.setupTutorialSteps();
  }

  createUI() {
    this.ui.overlay = document.createElement("div");
    this.ui.overlay.className = "tutorial-overlay";
    this.ui.overlay.innerHTML = `
      <style>
        .tutorial-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 0.5s ease;
        }
        .tutorial-overlay.active { opacity: 1; }
        
        .tutorial-cursor, .speech-bubble {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
            will-change: translate, scale, opacity; /* Use individual properties */
            transition: opacity 0.3s ease;
            backface-visibility: hidden;
        }
        
        .tutorial-cursor {
            width: 32px; height: 32px; z-index: 1001;
            /* FIX: Use individual translate property with CSS variables */
            translate: var(--cursor-x, 0px) var(--cursor-y, 0px);
            /* Centering is now done in the JS logic */
        }
        .speech-bubble {
            min-width: 280px; max-width: 350px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 25px; padding: 24px; color: #333;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 2px solid rgba(74, 158, 255, 0.3);
            pointer-events: auto; z-index: 1002;
            transform-origin: center center;
            /* FIX: Use individual translate and scale properties */
            translate: var(--bubble-x, 0px) var(--bubble-y, 0px);
            scale: var(--bubble-scale, 0.5);
        }
        /* Your other styles for cursor-icon, buttons, etc. remain the same */
        .cursor-icon { width: 100%; height: 100%; background: radial-gradient(circle, #fff 30%, #4a9eff 70%); border-radius: 50%; box-shadow: 0 0 20px rgba(74, 158, 255, 0.6); animation: cursorPulse 1.5s ease-in-out infinite; }
        .bubble-content { margin-bottom: 20px; font-weight: 500; }
        .bubble-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(74, 158, 255, 0.2); }
        .step-indicator { font-size: 12px; color: #666; font-weight: 600; }
        .bubble-buttons { display: flex; gap: 8px; }
        .bubble-btn { background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3); }
        .bubble-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4); }
        .bubble-btn.secondary { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3); }
        .tutorial-skip { position: fixed; top: 20px; right: 20px; background: rgba(0, 0, 0, 0.7); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; z-index: 1003; font-size: 13px; font-weight: 600; opacity: 0; transition: all 0.3s ease; pointer-events: auto; }
        @keyframes cursorPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      </style>
      <div class="tutorial-cursor"><div class="cursor-icon"></div></div>
      <div class="speech-bubble">
        <div class="bubble-content"></div>
        <div class="bubble-controls">
          <div class="step-indicator"><span class="current-step">1</span> / <span class="total-steps">4</span></div>
          <div class="bubble-buttons">
            <button class="bubble-btn secondary" id="prevBtn">Previous</button>
            <button class="bubble-btn" id="nextBtn">Next</button>
          </div>
        </div>
      </div>
      <button class="tutorial-skip">Skip Tutorial</button>
    `;
    document.body.appendChild(this.ui.overlay);

    // Get UI element references...
    this.ui.cursor = this.ui.overlay.querySelector(".tutorial-cursor");
    this.ui.bubble = this.ui.overlay.querySelector(".speech-bubble");
    this.ui.bubbleContent = this.ui.overlay.querySelector(".bubble-content");
    this.ui.skipButton = this.ui.overlay.querySelector(".tutorial-skip");
    this.ui.prevButton = this.ui.overlay.querySelector("#prevBtn");
    this.ui.nextButton = this.ui.overlay.querySelector("#nextBtn");
    this.ui.currentStepIndicator =
      this.ui.overlay.querySelector(".current-step");
    this.ui.totalStepsIndicator = this.ui.overlay.querySelector(".total-steps");

    // Add event listeners...
    this.ui.skipButton.addEventListener("click", () => this.skip());
    this.ui.prevButton.addEventListener("click", () => this.previousStep());
    this.ui.nextButton.addEventListener("click", () => this.nextStep());
  }

  setupTutorialSteps() {
    this.tutorialSteps = [
      {
        target: "monitor-four-raycast",
        message: "Welcome! Click the monitor to explore my development work.",
        highlightObject: true,
        placement: "top",
      },
      {
        target: "about-raycast-emissive-raycast",
        message: "Check out this poster to learn more about me.",
        highlightObject: true,
        placement: "right",
      },
      {
        target: "erhu-seven-raycast",
        message: "I play the Erhu! Click here to listen to some music.",
        highlightObject: true,
        placement: "left",
      },
      {
        target: "mailbox-pole-seven-contact-raycast",
        message:
          "Ready to get in touch? Use this mailbox to send me a message.",
        highlightObject: true,
        placement: "bottom",
      },
    ];

    if (this.ui.totalStepsIndicator) {
      this.ui.totalStepsIndicator.textContent = this.tutorialSteps.length;
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.currentStep = 0;
    this.disableCameraControls();
    if (this.raycasterController) this.raycasterController.disable();
    this.ui.overlay.classList.add("active");
    gsap.to(this.ui.skipButton, { opacity: 1, duration: 0.5, delay: 0.5 });
    setTimeout(() => this.showStep(0), 500);
  }

  update() {
    if (!this.isActive) return;
    const step = this.tutorialSteps[this.currentStep];
    if (step) {
      this.updateUIPositions(step);
    }
  }

  showStep(stepIndex) {
    if (stepIndex >= this.tutorialSteps.length || stepIndex < 0) return;
    this.currentStep = stepIndex;
    const step = this.tutorialSteps[stepIndex];

    this.ui.currentStepIndicator.textContent = stepIndex + 1;
    this.ui.prevButton.disabled = stepIndex === 0;
    this.ui.nextButton.textContent =
      stepIndex === this.tutorialSteps.length - 1 ? "Finish" : "Next";
    this.ui.bubbleContent.textContent = step.message;

    this.removeOutlineEffect();
    if (step.highlightObject) this.highlightObject(step.target);

    // FIX: GSAP now animates the --bubble-scale variable, preventing conflicts.
    gsap.fromTo(
      this.ui.bubble,
      { "--bubble-scale": 0.5 },
      { "--bubble-scale": 1, duration: 0.4, ease: "back.out(1.7)" }
    );
    gsap.to(this.ui.cursor, { opacity: 1, duration: 0.4 });
  }

  updateUIPositions(step) {
    const targetObject = this.scene.getObjectByName(step.target);
    if (!targetObject) {
      this.ui.bubble.style.opacity = "0";
      this.ui.cursor.style.opacity = "0";
      return;
    }

    const targetScreenPos = this.worldToScreen(
      targetObject.getWorldPosition(new THREE.Vector3())
    );
    const bubbleRect = this.ui.bubble.getBoundingClientRect();

    if (targetScreenPos.isOffScreen || bubbleRect.width === 0) {
      this.ui.bubble.style.opacity = "0";
      this.ui.cursor.style.opacity = "0";
      return;
    }

    this.ui.bubble.style.opacity = "1";
    this.ui.cursor.style.opacity = "1";

    const bubblePos = this.getBubblePosition(
      targetScreenPos,
      bubbleRect,
      step.placement || "top"
    );

    // Set the CSS variables for the individual translate properties
    this.ui.bubble.style.setProperty(
      "--bubble-x",
      `${bubblePos.x - bubbleRect.width / 2}px`
    );
    this.ui.bubble.style.setProperty(
      "--bubble-y",
      `${bubblePos.y - bubbleRect.height / 2}px`
    );
    this.ui.cursor.style.setProperty(
      "--cursor-x",
      `${targetScreenPos.x - 16}px`
    ); // 16 is half cursor width
    this.ui.cursor.style.setProperty(
      "--cursor-y",
      `${targetScreenPos.y - 16}px`
    );
  }

  worldToScreen(worldPosition) {
    const vector = worldPosition.clone().project(this.camera);
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (vector.y * -0.5 + 0.5) * window.innerHeight,
      isOffScreen: vector.z > 1,
    };
  }

  getBubblePosition(targetPos, bubbleRect, placement) {
    const margin = 40;
    let { x, y } = targetPos;

    switch (placement) {
      case "top":
        y -= bubbleRect.height / 2 + margin;
        break;
      case "bottom":
        y += bubbleRect.height / 2 + margin;
        break;
      case "left":
        x -= bubbleRect.width / 2 + margin;
        break;
      case "right":
        x += bubbleRect.width / 2 + margin;
        break;
    }

    const halfWidth = bubbleRect.width / 2;
    const halfHeight = bubbleRect.height / 2;
    x = Math.max(halfWidth, Math.min(x, window.innerWidth - halfWidth));
    y = Math.max(halfHeight, Math.min(y, window.innerHeight - halfHeight));

    return { x, y };
  }

  nextStep() {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.complete();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  complete() {
    this.isActive = false;
    this.removeOutlineEffect();
    this.enableCameraControls();

    const tl = gsap.timeline({
      onComplete: () => {
        this.ui.overlay.classList.remove("active");
        if (this.raycasterController) this.raycasterController.enable();
      },
    });
    tl.to([this.ui.cursor, this.ui.bubble, this.ui.skipButton], {
      opacity: 0,
      duration: 0.5,
    });
    tl.to(this.ui.overlay, { opacity: 0, duration: 0.5 }, ">-0.3");
  }

  skip() {
    this.complete();
  }

  disableCameraControls() {
    if (this.cameraControls) {
      this.originalCameraControlsEnabled = this.cameraControls.enabled;
      this.cameraControls.enabled = false;
    }
  }

  enableCameraControls() {
    if (this.cameraControls) {
      this.cameraControls.enabled = this.originalCameraControlsEnabled;
    }
  }

  highlightObject(targetName) {
    if (!this.scene) return;
    const objects = [];
    this.scene.traverse((child) => {
      if (child.name === targetName || child.userData.name === targetName) {
        objects.push(child);
      }
    });
    if (objects.length > 0) this.addOutlineEffect(objects);
  }

  addOutlineEffect(objects) {
    if (!this.raycasterController?.outlinePass) return;
    const outlinePass = this.raycasterController.outlinePass;
    outlinePass.selectedObjects = objects;

    if (!this.originalOutlineValues) {
      this.originalOutlineValues = {
        strength: outlinePass.edgeStrength,
        thickness: outlinePass.edgeThickness,
      };
    }

    if (this.pulseAnimation) this.pulseAnimation.kill();
    outlinePass.edgeStrength = this.originalOutlineValues.strength * 1.5;
    outlinePass.edgeThickness = this.originalOutlineValues.thickness * 1.5;

    this.pulseAnimation = gsap.to(outlinePass, {
      edgeStrength: this.originalOutlineValues.strength * 2.5,
      edgeThickness: this.originalOutlineValues.thickness * 2.0,
      duration: this.glowPulseSpeed,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }

  removeOutlineEffect() {
    if (!this.raycasterController?.outlinePass) return;
    if (this.pulseAnimation) {
      this.pulseAnimation.kill();
      this.pulseAnimation = null;
    }

    const outlinePass = this.raycasterController.outlinePass;
    if (this.originalOutlineValues) {
      gsap.to(outlinePass, {
        edgeStrength: this.originalOutlineValues.strength,
        edgeThickness: this.originalOutlineValues.thickness,
        duration: 0.3,
      });
    }
    outlinePass.selectedObjects = [];
  }
}

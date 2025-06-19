// IntroTutorial.js - Enhanced version with simple bubbles and easy positioning
import * as THREE from "three";
import gsap from "gsap";

export class IntroTutorial {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.raycasterController = options.raycasterController;
    this.cameraControls = options.cameraControls; // Add camera controls reference

    // Tutorial state
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialSteps = [];

    // UI elements
    this.cursorElement = null;
    this.speechBubbleElement = null;
    this.overlayElement = null;

    // Animation properties
    this.animationSpeed = 1;
    this.glowPulseSpeed = 1.5;

    // Outline effect properties
    this.pulseAnimation = null;
    this.currentHighlightedObjects = null;
    this.originalOutlineValues = null;

    // Store original camera controls state
    this.originalCameraControlsEnabled = true;

    this.init();
  }

  init() {
    this.createUI();
    this.setupTutorialSteps();
  }

  createUI() {
    // Create overlay
    this.overlayElement = document.createElement("div");
    this.overlayElement.className = "tutorial-overlay";
    this.overlayElement.innerHTML = `
      <style>
        .tutorial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0);
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        
        .tutorial-overlay.active {
          opacity: 1;
        }
        
        .tutorial-cursor {
          position: absolute;
          width: 32px;
          height: 32px;
          pointer-events: none;
          z-index: 1001;
          opacity: 0;
          transform: translate(-50%, -50%);
        }
        
        .cursor-icon {
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, #fff 30%, #4a9eff 70%);
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(74, 158, 255, 0.6);
          animation: cursorPulse 1.5s ease-in-out infinite;
        }
        
        .cursor-click-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          border: 2px solid #4a9eff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
        }
        
        .speech-bubble {
          position: absolute;
          font-family: 'Arial', sans-serif;
          font-size: 16px;
          line-height: 22px;
          min-width: 280px;
          max-width: 350px;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border-radius: 25px;
          padding: 24px;
          text-align: left;
          color: #333;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border: 2px solid rgba(74, 158, 255, 0.3);
          pointer-events: auto;
          z-index: 1002;
          opacity: 0;
          transform: translate(-50%, -50%); 
          will-change: transform, opacity; /* Performance hint */
          /* Add a pointer so it's clear the bubble is attached to something */
          &::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: -15px;
            transform: translateX(-50%);
            border-width: 15px 15px 0;
            border-style: solid;
            border-color: #ffffff transparent transparent transparent;
          }
        }
        
        .speech-bubble.show {
          opacity: 1;
          transform: scale(1);
        }
        
        .bubble-content {
          margin-bottom: 20px;
          font-weight: 500;
        }
        
        .bubble-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(74, 158, 255, 0.2);
        }
        
        .step-indicator {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }
        
        .bubble-buttons {
          display: flex;
          gap: 8px;
        }
        
        .bubble-btn {
          background: linear-gradient(135deg, #4a9eff 0%, #357abd 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }
        
        .bubble-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
        }
        
        .bubble-btn:active {
          transform: translateY(0);
        }
        
        .bubble-btn.secondary {
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
          box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
        }
        
        .bubble-btn.secondary:hover {
          box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
        }
        
        .bubble-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .tutorial-skip {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 25px;
          cursor: pointer;
          z-index: 1003;
          font-size: 13px;
          font-weight: 600;
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: auto;
        }
        
        .tutorial-skip:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.05);
        }
        
        /* Debug positioning helper */
        .position-debug {
          position: fixed;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          z-index: 1004;
          display: none;
        }
        
        @keyframes cursorPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        
        @keyframes clickRing {
          0% { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          100% { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }
        
        @keyframes bubbleIn {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      </style>
      <div class="tutorial-cursor">
        <div class="cursor-icon"></div>
        <div class="cursor-click-ring"></div>
      </div>
      <div class="speech-bubble">
        <div class="bubble-content"></div>
        <div class="bubble-controls">
          <div class="step-indicator">
            <span class="current-step">1</span> / <span class="total-steps">4</span>
          </div>
          <div class="bubble-buttons">
            <button class="bubble-btn secondary" id="prevBtn">Previous</button>
            <button class="bubble-btn" id="nextBtn">Next</button>
          </div>
        </div>
      </div>
      <button class="tutorial-skip">Skip Tutorial</button>
      <div class="position-debug" id="positionDebug"></div>
    `;

    document.body.appendChild(this.overlayElement);

    // Get references
    this.cursorElement = this.overlayElement.querySelector(".tutorial-cursor");
    this.speechBubbleElement =
      this.overlayElement.querySelector(".speech-bubble");
    this.bubbleContentElement =
      this.overlayElement.querySelector(".bubble-content");
    this.skipButton = this.overlayElement.querySelector(".tutorial-skip");
    this.prevButton = this.overlayElement.querySelector("#prevBtn");
    this.nextButton = this.overlayElement.querySelector("#nextBtn");
    this.currentStepElement =
      this.overlayElement.querySelector(".current-step");
    this.totalStepsElement = this.overlayElement.querySelector(".total-steps");
    this.positionDebug = this.overlayElement.querySelector("#positionDebug");

    // Event listeners
    this.skipButton.addEventListener("click", () => this.skip());
    this.prevButton.addEventListener("click", () => this.previousStep());
    this.nextButton.addEventListener("click", () => this.nextStep());
  }

  setupTutorialSteps() {
    this.tutorialSteps = [
      {
        // BEST PRACTICE: Target an object by its name in the scene.
        target: "monitor-four-raycast",
        // Use a world-space offset to position the bubble relative to the object's center.
        worldOffset: new THREE.Vector3(0, 1.2, 0), // Position bubble slightly above the monitor
        message:
          "Welcome! Click on the computer monitor to explore my development work and coding projects.",
        highlightObject: true,
      },
      {
        target: "about-raycast-emissive-raycast",
        worldOffset: new THREE.Vector3(0, 1.5, 0.5), // Position bubble above and slightly in front
        message:
          "Check out this poster to learn more about my background, skills, and experience.",
        highlightObject: true,
      },
      {
        target: "erhu-seven-raycast",
        worldOffset: new THREE.Vector3(0.5, 0.8, 0), // To the right and up
        message:
          "I play the Erhu, a traditional Chinese instrument! Click here to listen to some music.",
        highlightObject: true,
      },
      {
        target: "mailbox-pole-seven-contact-raycast",
        worldOffset: new THREE.Vector3(-1, 1, 0), // To the left and up
        message:
          "Ready to get in touch? Use this mailbox to send me a message or connect with me.",
        highlightObject: true,
      },
    ];

    if (this.totalStepsElement) {
      this.totalStepsElement.textContent = this.tutorialSteps.length;
    }
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.currentStep = 0;
    this.disableCameraControls();
    if (this.raycasterController) {
      this.raycasterController.disable();
    }
    this.overlayElement.classList.add("active");
    gsap.to(this.skipButton, { opacity: 1, duration: 0.5, delay: 0.5 });

    // Defer the first step slightly to allow fade-in
    setTimeout(() => this.showStep(0), 500);
  }

  disableCameraControls() {
    // Store original state and disable camera controls
    if (this.cameraControls) {
      this.originalCameraControlsEnabled = this.cameraControls.enabled;
      this.cameraControls.enabled = false;
    }
  }

  enableCameraControls() {
    // Restore original camera controls state
    if (this.cameraControls) {
      this.cameraControls.enabled = this.originalCameraControlsEnabled;
    }
  }

  showStep(stepIndex) {
    if (stepIndex >= this.tutorialSteps.length || stepIndex < 0) return;

    const step = this.tutorialSteps[stepIndex];
    this.currentStep = stepIndex;

    // Update step indicator
    this.currentStepElement.textContent = stepIndex + 1;

    // Update button states
    this.prevButton.disabled = stepIndex === 0;
    this.nextButton.textContent =
      stepIndex === this.tutorialSteps.length - 1 ? "Finish" : "Next";

    // Clear previous outline effects
    this.removeOutlineEffect();

    // Get position for bubble and cursor
    const position = this.getStepPosition(step);

    // Show debug info if needed (uncomment for positioning help)
    this.showPositionDebug(position, step);

    // Highlight object if specified
    if (step.highlightObject) {
      this.highlightObject(step.target);
    }

    // Position and show speech bubble
    this.showSpeechBubble(position, step.message);

    // Animate cursor to position
    this.animateCursor(position);
  }

  getStepPosition(step) {
    let position;

    // Priority: screenPosition > worldPosition
    if (step.screenPosition) {
      // Use direct screen coordinates
      position = { ...step.screenPosition };
    } else if (step.worldPosition) {
      // Convert world position to screen coordinates
      position = this.worldToScreen(step.worldPosition);
    } else {
      // Default center position
      position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }

    // Apply offset if provided
    if (step.offset) {
      position.x += step.offset.x || 0;
      position.y += step.offset.y || 0;
    }

    return position;
  }

  showPositionDebug(position, step) {
    // Helper function to show current position (useful for positioning bubbles)
    this.positionDebug.style.display = "block";
    this.positionDebug.innerHTML = `
      Step: ${this.currentStep + 1}<br>
      Screen X: ${Math.round(position.x)}<br>
      Screen Y: ${Math.round(position.y)}<br>
      Target: ${step.target}<br>
      <small>Add this to step config:</small><br>
      <code>screenPosition: { x: ${Math.round(position.x)}, y: ${Math.round(position.y)} }</code>
    `;
  }

  showSpeechBubble(screenPos, message) {
    // Update content
    this.bubbleContentElement.textContent = message;

    // Remove any old classes - just use base speech-bubble class
    this.speechBubbleElement.className = "speech-bubble";

    // Position bubble with better centering
    this.speechBubbleElement.style.left = screenPos.x + "px";
    this.speechBubbleElement.style.top = screenPos.y - 100 + "px"; // Offset above the target
    this.speechBubbleElement.style.transform = "translateX(-50%)"; // Center horizontally

    // Show with animation
    gsap.fromTo(
      this.speechBubbleElement,
      {
        opacity: 0,
        scale: 0.3,
        rotation: 10,
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      }
    );
  }
  // --- Core Positioning Logic ---

  /**
   * NEW: This method should be called from your main animation loop (requestAnimationFrame)
   * It ensures the bubble positions are updated whenever the camera moves.
   */
  update() {
    if (!this.isActive || !this.speechBubbleElement) return;

    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;

    // Recalculate and apply position every frame
    const screenPos = this.getStepScreenPosition(step);

    if (screenPos) {
      this.speechBubbleElement.style.left = `${screenPos.x}px`;
      this.speechBubbleElement.style.top = `${screenPos.y}px`;
      this.cursorElement.style.left = `${screenPos.targetX}px`;
      this.cursorElement.style.top = `${screenPos.targetY}px`;
    }
    console.log("ss");
  }

  /**
   * Gets the world position of a step's target and converts it to screen space.
   */
  getStepScreenPosition(step) {
    const targetObject = this.scene.getObjectByName(step.target);
    if (!targetObject) {
      console.warn(
        `Tutorial target object "${step.target}" not found in scene.`
      );
      // Fallback to center screen if object not found
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
      };
    }

    // Get the object's absolute world position
    const targetPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetPosition);

    // This is the point the cursor/highlight will aim for
    const screenTarget = this.worldToScreen(targetPosition);

    // Apply the world-space offset for the speech bubble's anchor
    if (step.worldOffset) {
      targetPosition.add(step.worldOffset);
    }

    const screenBubble = this.worldToScreen(targetPosition);

    return {
      x: screenBubble.x,
      y: screenBubble.y,
      targetX: screenTarget.x, // The actual object position for the cursor
      targetY: screenTarget.y,
    };
  }

  /**
   * Converts a 3D world position to 2D screen coordinates.
   * Also handles clamping the position to the screen edges.
   */
  worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    // Check if the object is behind the camera. If so, don't display it.
    // You could add more advanced logic here to show an off-screen indicator.
    if (vector.z > 1) {
      return { x: -9999, y: -9999, offScreen: true };
    }

    let x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    let y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Clamp the bubble to the screen with a margin
    const margin = 30; // 30px margin
    const bubbleWidth = this.speechBubbleElement?.offsetWidth ?? 350;
    const bubbleHeight = this.speechBubbleElement?.offsetHeight ?? 150;

    x = Math.max(
      margin + bubbleWidth / 2,
      Math.min(x, window.innerWidth - margin - bubbleWidth / 2)
    );
    y = Math.max(
      margin + bubbleHeight / 2,
      Math.min(y, window.innerHeight - margin)
    );

    return { x, y, offScreen: false };
  }

  // --- Modified Show/Animate Functions ---

  showStep(stepIndex) {
    if (stepIndex >= this.tutorialSteps.length || stepIndex < 0) return;

    const step = this.tutorialSteps[stepIndex];
    this.currentStep = stepIndex;

    this.currentStepElement.textContent = stepIndex + 1;
    this.prevButton.disabled = stepIndex === 0;
    this.nextButton.textContent =
      stepIndex === this.tutorialSteps.length - 1 ? "Finish" : "Next";

    this.removeOutlineEffect();
    if (step.highlightObject) {
      this.highlightObject(step.target);
    }

    // Get initial position
    const position = this.getStepScreenPosition(step);

    if (position) {
      // Position and show speech bubble and cursor
      this.showSpeechBubble(position, step.message);
      this.animateCursor(position);
    }
  }

  showSpeechBubble(screenPos, message) {
    this.bubbleContentElement.textContent = message;

    // Instantly move to position before animating in
    this.speechBubbleElement.style.left = screenPos.x + "px";
    this.speechBubbleElement.style.top = screenPos.y + "px";

    // Use GSAP for a nice entrance animation
    gsap.fromTo(
      this.speechBubbleElement,
      { opacity: 0, scale: 0.5, y: -20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
  }

  animateCursor(screenPos) {
    gsap.to(this.cursorElement, {
      opacity: 1,
      left: screenPos.targetX, // Animate to the target object itself
      top: screenPos.targetY,
      duration: this.animationSpeed,
      ease: "power2.inOut",
    });
    // ... (your click animation can remain the same)
  }

  worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    return { x, y };
  }

  animateCursor(screenPos) {
    // Show cursor and animate to position
    gsap.to(this.cursorElement, {
      opacity: 1,
      left: screenPos.x,
      top: screenPos.y,
      duration: this.animationSpeed,
      ease: "power2.inOut",
    });

    // Simulate click animation after a delay
    setTimeout(
      () => {
        const clickRing =
          this.cursorElement.querySelector(".cursor-click-ring");
        clickRing.style.animation = "clickRing 0.5s ease-out";
        setTimeout(() => {
          clickRing.style.animation = "";
        }, 500);
      },
      this.animationSpeed * 1000 + 500
    );
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

  highlightObject(targetName) {
    // Find target objects
    if (this.scene) {
      const targetObjects = [];
      this.scene.traverse((child) => {
        if (child.name === targetName || child.userData.name === targetName) {
          targetObjects.push(child);
          // Include children if they exist
          if (child.children.length > 0) {
            targetObjects.push(...child.children);
          }
        }
      });

      if (targetObjects.length > 0) {
        this.addOutlineEffect(targetObjects);
      }
    }
  }

  addOutlineEffect(objects) {
    if (this.raycasterController && this.raycasterController.outlinePass) {
      const outlinePass = this.raycasterController.outlinePass;

      // Force set the objects directly without raycaster interference
      outlinePass.selectedObjects = [...objects];

      // Store original values if not already stored
      if (!this.originalOutlineValues) {
        this.originalOutlineValues = {
          strength: outlinePass.edgeStrength,
          thickness: outlinePass.edgeThickness,
        };
      }

      // Kill any existing pulse animation
      if (this.pulseAnimation) {
        this.pulseAnimation.kill();
      }

      // Set initial enhanced values
      outlinePass.edgeStrength = this.originalOutlineValues.strength * 1.2;
      outlinePass.edgeThickness = this.originalOutlineValues.thickness * 1.2;

      // Create pulsing animation
      this.pulseAnimation = gsap.timeline({
        repeat: -1,
        yoyo: true,
        onUpdate: () => {
          // Force the outline to stay active during tutorial
          if (this.isActive && outlinePass.selectedObjects.length === 0) {
            outlinePass.selectedObjects = [...objects];
          }
        },
      });

      this.pulseAnimation.to(outlinePass, {
        edgeStrength: this.originalOutlineValues.strength * 2.0,
        edgeThickness: this.originalOutlineValues.thickness * 1.8,
        duration: this.glowPulseSpeed,
        ease: "sine.inOut",
      });

      // Store references for cleanup
      this.currentHighlightedObjects = objects;
    }
  }

  removeOutlineEffect() {
    if (this.raycasterController && this.raycasterController.outlinePass) {
      const outlinePass = this.raycasterController.outlinePass;

      // Kill pulsing animation
      if (this.pulseAnimation) {
        this.pulseAnimation.kill();
        this.pulseAnimation = null;
      }

      // Clear selected objects immediately
      outlinePass.selectedObjects = [];

      // Restore original values if they exist
      if (this.originalOutlineValues) {
        outlinePass.edgeStrength = this.originalOutlineValues.strength;
        outlinePass.edgeThickness = this.originalOutlineValues.thickness;
      }

      // Clear references
      this.currentHighlightedObjects = null;
    }
  }

  complete() {
    this.isActive = false;

    // Clean up outline effects
    this.removeOutlineEffect();

    // Reset original outline values
    this.originalOutlineValues = null;

    // Re-enable camera controls
    this.enableCameraControls();

    // Hide debug info
    this.positionDebug.style.display = "none";

    // Fade out UI
    const timeline = gsap.timeline();
    timeline.to(
      [this.cursorElement, this.speechBubbleElement, this.skipButton],
      {
        opacity: 0,
        duration: 0.5,
      }
    );

    timeline.to(this.overlayElement, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.overlayElement.classList.remove("active");
        // Re-enable raycaster interactions
        if (this.raycasterController) {
          this.raycasterController.enable();
        }
      },
    });
  }

  skip() {
    this.complete();
  }

  // Utility method to help with positioning - enables debug mode
  enablePositionDebug() {
    this.positionDebug.style.display = "block";
  }

  // Utility method to test positions easily
  testPosition(x, y, message = "Test position") {
    if (!this.isActive) {
      console.warn("Tutorial must be active to test positions");
      return;
    }

    const testStep = {
      screenPosition: { x, y },
      message,
      highlightObject: false,
    };

    const position = this.getStepPosition(testStep);
    this.showSpeechBubble(position, message);
    this.animateCursor(position);
    this.showPositionDebug(position, testStep);
  }

  // Public method to customize tutorial steps
  setSteps(steps) {
    this.tutorialSteps = steps;
    if (this.totalStepsElement) {
      this.totalStepsElement.textContent = steps.length;
    }
  }

  // Public method to add a single step
  addStep(step) {
    this.tutorialSteps.push(step);
    if (this.totalStepsElement) {
      this.totalStepsElement.textContent = this.tutorialSteps.length;
    }
  }
}

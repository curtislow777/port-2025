// IntroTutorial.js - Guided introduction system with animated cursor
import * as THREE from "three";
import gsap from "gsap";

export class IntroTutorial {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.raycasterController = options.raycasterController;

    // Tutorial state
    this.isActive = false;
    this.currentStep = 0;
    this.tutorialSteps = [];

    // UI elements
    this.cursorElement = null;
    this.tooltipElement = null;
    this.overlayElement = null;

    // Animation properties
    this.animationSpeed = 2;
    this.glowPulseSpeed = 1.5;

    // Outline effect properties
    this.pulseAnimation = null;
    this.currentHighlightedObjects = null;
    this.originalOutlineValues = null;
    this.tutorialOutlinePass = null; // Separate outline pass for tutorial

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
        
        .tutorial-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          max-width: 200px;
          pointer-events: none;
          z-index: 1002;
          opacity: 0;
          transform: translate(-50%, -120%);
        }
        
        .tutorial-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(0, 0, 0, 0.8);
        }
        
        .tutorial-skip {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          z-index: 1003;
          font-size: 12px;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .tutorial-skip:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.05);
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
      </style>
      <div class="tutorial-cursor">
        <div class="cursor-icon"></div>
        <div class="cursor-click-ring"></div>
      </div>
      <div class="tutorial-tooltip"></div>
      <button class="tutorial-skip">Skip Tutorial</button>
    `;

    document.body.appendChild(this.overlayElement);

    // Get references
    this.cursorElement = this.overlayElement.querySelector(".tutorial-cursor");
    this.tooltipElement =
      this.overlayElement.querySelector(".tutorial-tooltip");
    this.skipButton = this.overlayElement.querySelector(".tutorial-skip");

    // Skip button event
    this.skipButton.addEventListener("click", () => this.skip());
  }

  setupTutorialSteps() {
    // Define tutorial steps - customize these based on your scene objects
    this.tutorialSteps = [
      {
        target: "monitor-four-raycast", // Match your object names
        worldPosition: new THREE.Vector3(2, 1, -1), // Approximate world position
        message: "Click on the computer to see my work!",
        duration: 3000,
        highlightObject: true,
      },
      {
        target: "about-raycast-emissive-raycast",
        worldPosition: new THREE.Vector3(-2, 1.5, 0),
        message: "Check out the poster to learn about me",
        duration: 3000,
        highlightObject: true,
      },
      {
        target: "erhu-seven-raycast",
        worldPosition: new THREE.Vector3(0, 0.5, 2),
        message: "I play the Erhu! Click to learn more",
        duration: 3000,
        highlightObject: true,
      },
      {
        target: "mailbox-pole-seven-contact-raycast",
        worldPosition: new THREE.Vector3(3, 0.5, 1),
        message: "Send me a message through the mailbox",
        duration: 3000,
        highlightObject: true,
      },
    ];
  }

  start() {
    if (this.isActive) return;

    this.isActive = true;
    this.currentStep = 0;

    // Disable raycaster interactions during tutorial
    if (this.raycasterController) {
      this.raycasterController.disable();
    }

    // Show overlay
    this.overlayElement.classList.add("active");

    // Animate in skip button
    gsap.to(this.skipButton, {
      opacity: 1,
      duration: 0.5,
      delay: 0.5,
    });

    // Start first step
    setTimeout(() => this.executeStep(0), 1000);
  }

  executeStep(stepIndex) {
    if (stepIndex >= this.tutorialSteps.length) {
      this.complete();
      return;
    }

    const step = this.tutorialSteps[stepIndex];
    this.currentStep = stepIndex;

    // Clear previous outline effects
    this.removeOutlineEffect();

    // Get screen position from world position
    const screenPos = this.worldToScreen(step.worldPosition);

    // Highlight object if specified
    if (step.highlightObject) {
      this.highlightObject(step.target);
    }

    // Animate cursor to position
    this.animateCursor(screenPos, step.message, step.duration);
  }

  worldToScreen(worldPosition) {
    const vector = worldPosition.clone();
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    return { x, y };
  }

  animateCursor(screenPos, message, duration) {
    const timeline = gsap.timeline();

    // Show cursor
    timeline.to(this.cursorElement, {
      opacity: 1,
      duration: 0.3,
    });

    // Animate cursor to position with spline-like curve
    timeline.to(
      this.cursorElement,
      {
        left: screenPos.x,
        top: screenPos.y,
        duration: this.animationSpeed,
        ease: "power2.inOut",
        motionPath: {
          path: this.generateCurvedPath(screenPos),
          autoRotate: false,
        },
      },
      "-=0.1"
    );

    // Show tooltip
    timeline.to(
      this.tooltipElement,
      {
        opacity: 1,
        left: screenPos.x,
        top: screenPos.y,
        duration: 0.3,
        onStart: () => {
          this.tooltipElement.textContent = message;
        },
      },
      "-=0.5"
    );

    // Simulate click animation
    timeline.to(this.cursorElement.querySelector(".cursor-click-ring"), {
      animation: "clickRing 0.5s ease-out",
      delay: 1,
    });

    // Wait and move to next step
    timeline.call(() => {
      setTimeout(() => {
        this.hideTooltip();
        this.executeStep(this.currentStep + 1);
      }, duration);
    });
  }

  generateCurvedPath(targetPos) {
    const currentPos = {
      x: this.cursorElement.offsetLeft || window.innerWidth / 2,
      y: this.cursorElement.offsetTop || window.innerHeight / 2,
    };

    // Create curved path with control points
    const midX = (currentPos.x + targetPos.x) / 2;
    const midY = (currentPos.y + targetPos.y) / 2 - 100; // Arc upward

    return `M${currentPos.x},${currentPos.y} Q${midX},${midY} ${targetPos.x},${targetPos.y}`;
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

      // Create pulsing animation that overrides any raycaster control
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

  hideTooltip() {
    gsap.to(this.tooltipElement, {
      opacity: 0,
      duration: 0.3,
    });
  }

  complete() {
    this.isActive = false;

    // Clean up outline effects
    this.removeOutlineEffect();

    // Reset original outline values
    this.originalOutlineValues = null;

    // Fade out UI
    const timeline = gsap.timeline();
    timeline.to([this.cursorElement, this.tooltipElement, this.skipButton], {
      opacity: 0,
      duration: 0.5,
    });

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

  // Public method to customize tutorial steps
  setSteps(steps) {
    this.tutorialSteps = steps;
  }

  // Public method to add a single step
  addStep(step) {
    this.tutorialSteps.push(step);
  }

  // Method to temporarily disable raycaster during tutorial
  disableRaycaster() {
    if (this.raycasterController && this.raycasterController.disable) {
      this.raycasterController.disable();
    }
  }

  // Method to re-enable raycaster after tutorial
  enableRaycaster() {
    if (this.raycasterController && this.raycasterController.enable) {
      this.raycasterController.enable();
    }
  }
}

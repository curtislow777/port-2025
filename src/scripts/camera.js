import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import gsap from "gsap";

class CameraManager {
  constructor(camera, renderer, initialPosition, initialTarget) {
    this.camera = camera;
    this.renderer = renderer;

    // Set default camera positions and targets
    this.positions = {
      default: initialPosition || new THREE.Vector3(15.53, 11.14, 20.73),
      whiteboard: new THREE.Vector3(0.25, 4.38, -0.069),
      monitor: new THREE.Vector3(-2, 4, -0.069),
      // monitor: new THREE.Vector3(-5, 3.23, -0.53),
    };

    this.targets = {
      default: initialTarget || new THREE.Vector3(-0.35, 3.0, 0.64),
    };

    this.rotations = {
      whiteboard: new THREE.Euler(
        0, // x-axis (0 degrees)
        Math.PI / 2, // y-axis (90 degrees)
        0, // z-axis (0 degrees)
        "XYZ" // rotation order
      ),
      monitor: new THREE.Euler(
        0, // x-axis (0 degrees)
        Math.PI / 2, // y-axis (90 degrees)
        0, // z-axis (0 degrees)
        "XYZ" // rotation order
      ),
    };

    // Initialize camera position
    this.camera.position.copy(this.positions.default);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.setupControls();

    // Animation timelines
    this.currentAnimation = null;
  }

  setupControls() {
    this.controls.minDistance = 0;
    this.controls.maxDistance = 50;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    // Remove any potential X-axis constraints
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.target.copy(this.targets.default);
    this.controls.update();
  }
  // Add this method to your CameraManager class

  /**
   * Plays a named intro animation.
   * @param {string} style The name of the animation to play ('sweep', 'reveal', 'orbit').
   * @param {number} duration The duration of the animation.
   * @param {function} onComplete A callback function for when the animation finishes.
   */
  playIntroAnimation(style = "sweep", duration = 4.5, onComplete = null) {
    this.controls.enabled = false;

    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }

    let animationTimeline;

    // Use a switch to select the desired animation's timeline
    switch (style) {
      case "reveal":
        animationTimeline = this._createLowAngleRevealAnimation(duration);
        break;
      case "orbit":
        animationTimeline = this._createDollyOrbitAnimation(duration);
        break;
      case "sweep":
      default:
        animationTimeline = this._createEpicSweepAnimation(duration);
        break;
    }

    // Define the onComplete behavior for the chosen timeline
    animationTimeline.eventCallback("onComplete", () => {
      this.camera.position.copy(this.positions.default);
      this.controls.target.copy(this.targets.default);
      this.controls.enabled = true;

      if (onComplete && typeof onComplete === "function") {
        onComplete();
      }
      this.currentAnimation = null;
    });

    this.currentAnimation = animationTimeline;
    this.currentAnimation.play();
  }

  // --- PRIVATE ANIMATION CREATORS ---

  /**
   * Animation Option 1: A grand, sweeping motion from high above.
   */
  _createEpicSweepAnimation(duration) {
    const positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30, 25, 35), // Start (far, high, side)
      new THREE.Vector3(25, 15, 28), // Intermediate (swoops in)
      this.positions.default, // End
    ]);

    const targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 0), // Start (wide view of the center)
      new THREE.Vector3(-0.2, 4.0, 0.3), // Intermediate (focuses in)
      this.targets.default, // End
    ]);

    return this._createAnimationTimeline(positionCurve, targetCurve, duration);
  }

  /**
   * Animation Option 2: Starts low and rises up to reveal the scene.
   */
  _createLowAngleRevealAnimation(duration) {
    const positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5, 1.5, 15), // Start (low to the ground, looking forward)
      new THREE.Vector3(10, 8, 20), // Intermediate (rises and pulls back)
      this.positions.default, // End
    ]);

    const targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2, 0), // Start (looking at the floor/desk area)
      new THREE.Vector3(-0.3, 2.5, 0.5), // Intermediate (pans up slightly)
      this.targets.default, // End
    ]);

    return this._createAnimationTimeline(positionCurve, targetCurve, duration);
  }

  /**
   * Animation Option 3: Circles a point of interest while pulling back.
   */
  _createDollyOrbitAnimation(duration) {
    // For this, we'll create more points to define a clearer arc
    const positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 6, 8), // Start (closer, from the left side)
      new THREE.Vector3(0, 10, 15), // Intermediate 1 (moves up and back)
      new THREE.Vector3(12, 12, 18), // Intermediate 2 (continues arcing right)
      this.positions.default, // End
    ]);

    // The target will stay more focused on the center to create the orbit effect
    const targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 3, 0), // Start (focused on the left side of the desk)
      new THREE.Vector3(-1, 3.5, 0), // Intermediate (drags slightly towards center)
      this.targets.default, // End
    ]);

    return this._createAnimationTimeline(positionCurve, targetCurve, duration);
  }

  /**
   * Helper function to create the GSAP timeline from curves.
   */
  _createAnimationTimeline(positionCurve, targetCurve, duration) {
    const animationProgress = { progress: 0 };

    // Create a paused timeline so we can add callbacks before playing
    const timeline = gsap.to(animationProgress, {
      paused: true,
      progress: 1,
      duration: duration,
      ease: "power2.inOut",
      onUpdate: () => {
        const newPosition = positionCurve.getPointAt(
          animationProgress.progress
        );
        const newTarget = targetCurve.getPointAt(animationProgress.progress);

        this.camera.position.copy(newPosition);
        this.controls.target.copy(newTarget);
        this.controls.update();
      },
    });

    return timeline;
  }
  update() {
    if (this.controls.enabled) {
      this.controls.update();
    }
  }

  setSize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  addPosition(name, position) {
    this.positions[name] = position;
  }

  addTarget(name, target) {
    this.targets[name] = target;
  }

  addRotation(name, rotation) {
    this.rotations[name] = rotation;
  }

  zoomToPosition(positionName, duration = 2, callback = null) {
    this.controls.enabled = false;

    if (!this.positions[positionName]) {
      console.error(`Position '${positionName}' not defined`);
      return null;
    }

    // Stop any current animation
    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }

    // Disable controls during animation
    this.controls.enabled = false;

    const timeline = gsap.timeline({
      onComplete: () => {
        if (callback && typeof callback === "function") callback();
      },
    });

    // If we a rotation is defined for this position
    if (this.rotations[positionName]) {
      // Animate position
      timeline.to(
        this.camera.position,
        {
          x: this.positions[positionName].x,
          y: this.positions[positionName].y,
          z: this.positions[positionName].z,
          duration: duration,
          ease: "power3.inOut",
        },
        0
      );

      // Animate rotation
      timeline.to(
        this.camera.rotation,
        {
          x: this.rotations[positionName].x,
          y: this.rotations[positionName].y,
          z: this.rotations[positionName].z,
          duration: duration,
          ease: "power3.inOut",
        },
        0
      );

      if (positionName === "whiteboard" || positionName === "monitor") {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.rotations[positionName]);

        const targetPoint = new THREE.Vector3().copy(
          this.positions[positionName]
        );
        targetPoint.add(direction.multiplyScalar(5));

        timeline.to(
          this.controls.target,
          {
            x: targetPoint.x,
            y: targetPoint.y,
            z: targetPoint.z,
            duration: duration,
            ease: "power3.inOut",
            onUpdate: () => this.controls.update(),
          },
          0
        );
      }
    } else if (this.targets[positionName]) {
      // If we have a target but no rotation, animate position and controls target
      timeline.to(
        this.camera.position,
        {
          x: this.positions[positionName].x,
          y: this.positions[positionName].y,
          z: this.positions[positionName].z,
          duration: duration,
          ease: "power3.inOut",
        },
        0
      );

      timeline.to(
        this.controls.target,
        {
          x: this.targets[positionName].x,
          y: this.targets[positionName].y,
          z: this.targets[positionName].z,
          duration: duration,
          ease: "power3.inOut",
          onUpdate: () => this.controls.update(),
        },
        0
      );
    }

    this.currentAnimation = timeline;
    return timeline;
  }

  zoomToWhiteboard(whiteboard, duration = 2) {
    // Use the built-in zoomToPosition for “whiteboard”
    this.zoomToPosition("whiteboard", duration, () => {
      // Once camera is at whiteboard, enable drawing mode:
      whiteboard.toggleWhiteboardMode(true);
    });
  }
  zoomToMonitor(duration = 2) {
    // Use the built-in zoomToPosition for “whiteboard”
    this.zoomToPosition("monitor", duration, () => {
      // Once camera is at whiteboard, enable drawing mode:
    });
  }

  leaveWhiteboard(whiteboard, duration = 2) {
    // Return the camera to default
    this.resetToDefault(duration, () => {
      whiteboard.toggleWhiteboardMode(false);
    });
  }

  leaveMonitor(duration = 2, callback = null) {
    // Return the camera to default position
    return this.resetToDefault(duration, callback);
  }

  resetToDefault(duration = 2, callback = null) {
    // Stop any current animation
    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }

    this.controls.enabled = false;
    const timeline = gsap.timeline({
      onComplete: () => {
        // Re-enable controls
        console.log("controls re-enabled");
        this.controls.enabled = true;
        if (callback && typeof callback === "function") callback();
      },
    });

    timeline.to(
      this.camera.position,
      {
        x: this.positions.default.x,
        y: this.positions.default.y,
        z: this.positions.default.z,
        duration: duration,
        ease: "power2.inOut",
      },
      0
    );

    const lookAtVector = new THREE.Vector3()
      .subVectors(this.targets.default, this.positions.default)
      .normalize();

    const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0),
        lookAtVector,
        new THREE.Vector3(0, 1, 0)
      )
    );

    // Use quaternion slerp internally
    timeline.to(
      this.camera.quaternion,
      {
        x: targetQuaternion.x,
        y: targetQuaternion.y,
        z: targetQuaternion.z,
        w: targetQuaternion.w,
        duration: duration,
        ease: "power2.inOut",
      },
      0
    );

    // Animate orbit controls target back to default
    timeline.to(
      this.controls.target,
      {
        x: this.targets.default.x,
        y: this.targets.default.y,
        z: this.targets.default.z,
        duration: duration,
        ease: "power2.inOut",
        onUpdate: () => this.controls.update(),
      },
      0
    );

    this.currentAnimation = timeline;
    return timeline;
  }

  enableControls() {
    this.controls.enabled = true;
    console.log("camera controls enabled from camera.js");
  }

  disableControls() {
    this.controls.enabled = false;
    console.log("camera controls disabled from camera.js");
  }

  // Method to handle modal state
  handleModalState(isOpen) {
    this.controls.enabled = !isOpen;
  }

  // Clean up method
  dispose() {
    this.controls.dispose();
    if (this.currentAnimation) {
      this.currentAnimation.kill();
    }
  }
}

export default CameraManager;

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
    this.controls.target.copy(this.targets.default);
    this.controls.update();
  }

  update() {
    this.controls.update();
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

      if (positionName === "whiteboard") {
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

  leaveWhiteboard(whiteboard, duration = 2) {
    // Return the camera to default
    this.resetToDefault(duration, () => {
      whiteboard.toggleWhiteboardMode(false);
    });
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
  }

  disableControls() {
    this.controls.enabled = false;
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

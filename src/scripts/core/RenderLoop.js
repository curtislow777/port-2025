// scripts/core/RenderLoop.js
import appState from "../core/AppState.js";
import clockManager from "../clock.js";
import { updateRotatingObjects } from "../objectRotation.js";

/**
 * Sets up requestAnimationFrame loop and exposes a `start()` method.
 * Call start() once (after scene + camera are ready).
 */
export default function createRenderLoop() {
  let rafId = null;

  function loop() {
    /* --- 1. camera & controls ------------------------------------- */
    appState.cameraManager.update();

    /* --- 2. global time ------------------------------------------- */
    const elapsed = appState.getElapsedTime();

    /* --- 3. animations -------------------------------------------- */
    updateRotatingObjects();
    clockManager.updateClockHands();

    /* --- 4. raycaster --------------------------------------------- */
    if (appState.isRaycastEnabled) {
      const hits = appState.raycasterController.update(
        appState.pointer.x,
        appState.pointer.y
      );
      appState.setCurrentIntersects(hits);
    } else {
      appState.clearIntersects();
      appState.raycasterController.clearHover();
    }

    /* --- 5. whiteboard -------------------------------------------- */
    if (appState.whiteboard?.isActive) appState.whiteboard.update();

    /* --- 6. steam shader ------------------------------------------ */
    if (appState.steamMesh) {
      appState.steamMesh.material.uniforms.uTime.value = elapsed;
    }

    /* --- 7. render passes ----------------------------------------- */
    appState.innerWeb.render();
    appState.composer.render();

    rafId = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (!rafId) loop();
    },
    stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

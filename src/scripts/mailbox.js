// mailbox.js
import gsap from "gsap";

/**
 * Mailbox module to handle mailbox-related functionality
 */
export function setupMailbox(scene, modalSystem) {
  let mailboxCover = null;
  let mailboxHovered = false;
  let isMailboxOpen = false;

  // Animate cover open/close
  function toggleMailboxCover(open) {
    if (!mailboxCover || open === isMailboxOpen) return;
    isMailboxOpen = open;
    gsap.to(mailboxCover.rotation, {
      x: open ? Math.PI / 2 : 0, // rotate 90° when opening
      duration: 0.8,
      ease: "power2.out",
    });
  }

  // Find & store the cover mesh when scene loads
  function processMailboxObject(child) {
    if (child.name.includes("mailboxCover")) {
      mailboxCover = child;
      return true;
    }
    return false;
  }

  // Show contact modal when clicking pole
  function handleRaycastIntersection(intersectedObject, contactModal) {
    if (intersectedObject.name.includes("mailbox-pole")) {
      modalSystem.showModal(contactModal);
      return true;
    }
    return false;
  }

  /**
   * Called every frame after updateOutlineHover has run.
   * @param {Array}  currentIntersects  Array of raycast hits
   * @param {OutlinePass} outlinePass   Three.js post-processing outline pass
   */
  function updateMailboxHover(currentIntersects, outlinePass) {
    // Check if the mailbox pole is under the pointer
    const hitPole = currentIntersects.find((hit) =>
      hit.object.name.includes("mailbox-pole")
    );

    if (hitPole) {
      // On first frame of hover, open the cover
      if (!mailboxHovered) {
        mailboxHovered = true;
        toggleMailboxCover(true);
      }
      // Every frame the pole is hovered, add the cover to the outline
      outlinePass.selectedObjects.push(mailboxCover);
    } else {
      // On pointer leave, close the cover
      if (mailboxHovered) {
        mailboxHovered = false;
        toggleMailboxCover(false);
      }
      // No need to explicitly remove the cover from selectedObjects —
      // updateOutlineHover() cleared it already.
    }
  }

  return {
    processMailboxObject,
    handleRaycastIntersection,
    updateMailboxHover,
    toggleMailboxCover,
  };
}

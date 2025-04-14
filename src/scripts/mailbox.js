import gsap from "gsap";

/**
 * Mailbox module to handle mailbox-related functionality
 */
export function setupMailbox(scene, modalSystem) {
  let mailboxCover = null;
  let mailboxHovered = false;
  let isMailboxOpen = false;

  // Function to toggle the mailbox cover animation
  function toggleMailboxCover(open) {
    if (!mailboxCover || open === isMailboxOpen) return;

    isMailboxOpen = open;

    gsap.to(mailboxCover.rotation, {
      x: open ? Math.PI / 2 : 0, // Adjust axis & angle if needed
      duration: 0.8,
      ease: "power2.out",
    });
  }

  // Process mailbox objects when loading the scene
  function processMailboxObject(child) {
    if (child.name.includes("mailbox-cover")) {
      mailboxCover = child;
      return true;
    }
    return false;
  }

  // Handle raycast interactions with the mailbox
  function handleRaycastIntersection(intersectedObject, contactModal) {
    if (intersectedObject.name.includes("mailbox-raycast")) {
      modalSystem.showModal(contactModal);
      return true;
    }
    return false;
  }

  // Update mailbox hover state
  function updateMailboxHover(currentIntersects) {
    const mailboxRaycastObj = currentIntersects.find((hit) =>
      hit.object.name.includes("mailbox-raycast")
    );

    if (mailboxRaycastObj) {
      if (!mailboxHovered) {
        mailboxHovered = true;
        toggleMailboxCover(true); // Animate open
      }
    } else {
      if (mailboxHovered) {
        mailboxHovered = false;
        toggleMailboxCover(false); // Animate close
      }
    }
  }

  return {
    processMailboxObject,
    handleRaycastIntersection,
    updateMailboxHover,
    toggleMailboxCover,
  };
}

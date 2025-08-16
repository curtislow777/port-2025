// modal.js
import gsap from "gsap";

/**
 * initModalSystem
 * - Keeps your existing overlay & GSAP open/close animations
 * - Adds integrated "Projects" modal logic:
 *   • List view (filters + cards)
 *   • Detail view (title chip, big image, stacked sections)
 *   • Back button (inside modal, top-left)
 *   • Close resets to list view every time
 */
export function initModalSystem({
  overlaySelector = ".overlay",
  modalSelectors = {
    projects: ".projects-modal",
    about: ".about-modal",
    contact: ".contact-modal",
    erhu: ".erhu-modal",
  },
  // include projects close button too
  closeButtonSelector = ".modal-close-btn, .pm-close",
  onModalOpen = () => {},
  onModalClose = () => {},
}) {
  const overlay = document.querySelector(overlaySelector);
  const modals = {};
  Object.entries(modalSelectors).forEach(([key, selector]) => {
    modals[key] = document.querySelector(selector);
  });

  let isModalOpen = false;
  let isAnimating = false;

  function showModal(modal) {
    if (!modal || isAnimating) return;
    isAnimating = true;
    isModalOpen = true;
    onModalOpen();

    if (modal.hasAttribute("hidden")) modal.removeAttribute("hidden");
    overlay.style.display = "block";
    modal.style.display = "block";

    gsap.fromTo(
      modal,
      { scaleY: 0, scaleX: 1, opacity: 0 },
      {
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onStart: () => {
          // start child reveal now that it's visible
          modal.classList.add("is-opening");
        },
        onComplete: () => {
          modal.classList.remove("is-opening");
          isAnimating = false;
        },
      }
    );

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }

  function hideModal(modal) {
    if (!modal || isAnimating) return;
    isAnimating = true;
    isModalOpen = false;
    onModalClose();

    // just in case it was left on
    modal.classList.remove("is-opening");

    gsap.to(overlay, { opacity: 0, duration: 0.5 });
    gsap.to(modal, {
      opacity: 0,
      scaleY: 0,
      scaleX: 1,
      duration: 0.5,
      ease: "back.in(2)",
      onComplete: () => {
        modal.style.display = "none";
        modal.setAttribute("hidden", "");
        overlay.style.display = "none";
        isAnimating = false;
      },
    });
  }

  function hideAllModals() {
    if (isAnimating) return;
    Object.values(modals).forEach((modal) => {
      if (modal && modal.style.display === "block") hideModal(modal);
    });
  }

  const closeButtons = document.querySelectorAll(closeButtonSelector);
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      hideModal(modal);
    });
  });

  document.addEventListener("mousedown", (e) => {
    if (!isModalOpen) return;
    const isInsideModal = Object.values(modals).some((m) =>
      m?.contains(e.target)
    );
    if (!isInsideModal) hideAllModals();
  });

  return {
    overlay,
    modals,
    isModalOpen,
    isAnimating,
    showModal,
    hideModal,
    hideAllModals,
  };
}

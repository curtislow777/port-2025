import gsap from "gsap";

// Pass in selectors or elements as needed (e.g. overlay, modal selectors)
export function initModalSystem({
  overlaySelector = ".overlay",
  modalSelectors = {
    work: ".work-modal",
    about: ".about-modal",
    contact: ".contact-modal",
    erhu: ".erhu-modal",
  },
  closeButtonSelector = ".modal-close-btn",
  onModalOpen = () => {},
  onModalClose = () => {},
}) {
  // Grab overlay & modal elements
  const overlay = document.querySelector(overlaySelector);
  const modals = {};
  Object.entries(modalSelectors).forEach(([key, selector]) => {
    modals[key] = document.querySelector(selector);
  });

  let isModalOpen = false;
  let isAnimating = false;

  // Show modal with GSAP
  function showModal(modal) {
    if (!modal || isAnimating) return;

    // Indicate a modal is open
    isAnimating = true;
    isModalOpen = true;

    onModalOpen();

    overlay.style.display = "block";
    modal.style.display = "block";

    // Reset scale and opacity before animating
    gsap.fromTo(
      modal,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onComplete: () => {
          isAnimating = false; // Reset animation flag when complete
        },
      }
    );

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }

  // Hide modal with GSAP
  function hideModal(modal) {
    if (!modal || isAnimating) return; // Don't proceed if animation is in progress
    isAnimating = true;
    isModalOpen = false;
    onModalClose();

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
    });
    gsap.to(modal, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      ease: "back.in(2)",
      onComplete: () => {
        modal.style.display = "none";
        overlay.style.display = "none";
        isAnimating = false; // Reset animation flag when complete
      },
    });
  }

  // Update hideAllModals function with cooldown check
  function hideAllModals() {
    if (isAnimating) return;

    Object.values(modals).forEach((modal) => {
      if (modal.style.display === "block") {
        hideModal(modal);
      }
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
    if (isModalOpen) {
      // Check if click is outside any modal content
      let clickedOnModalContent = false;

      Object.values(modals).forEach((modal) => {
        if (modal.style.display === "block") {
          // Check if the click was inside the modal content
          const modalContent = modal.querySelector(".modal-content");
          if (modalContent && modalContent.contains(e.target)) {
            clickedOnModalContent = true;
          }
        }
      });

      // If clicked outside modal content, close all modals
      if (!clickedOnModalContent && !e.target.closest(".modal-content")) {
        hideAllModals();
      }
    }
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

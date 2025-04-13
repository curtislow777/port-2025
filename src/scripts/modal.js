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

  // We keep an "isModalOpen" flag if you need to check anywhere else
  let isModalOpen = false;

  // Show modal with GSAP
  function showModal(modal) {
    if (!modal) return;

    // Indicate a modal is open
    isModalOpen = true;

    onModalOpen();

    // Show overlay first
    overlay.style.display = "block";
    modal.style.display = "block";

    // Reset scale and opacity before animating
    gsap.fromTo(
      modal,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
    );

    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }

  // Hide modal with GSAP
  function hideModal(modal) {
    if (!modal) return;

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
      },
    });
  }

  // Hide whichever modal is open
  function hideAllModals() {
    Object.values(modals).forEach((modal) => {
      if (modal.style.display === "block") {
        hideModal(modal);
      }
    });
  }

  // Close buttons
  const closeButtons = document.querySelectorAll(closeButtonSelector);
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal");
      hideModal(modal);
    });
  });

  // Handle modal close on overlay click
  overlay.addEventListener("click", () => {
    hideAllModals();
  });

  return {
    overlay,
    modals,
    isModalOpen,
    showModal,
    hideModal,
    hideAllModals,
  };
}

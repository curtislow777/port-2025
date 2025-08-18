// modal.js
import gsap from "gsap";

export function initModalSystem({
  overlaySelector = ".overlay",
  modalSelectors = {
    projects: ".projects-modal",
    about: ".about-modal",
    contact: ".contact-modal",
    erhu: ".erhu-modal",
  },
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

  // 🔧 find the real scroll containers inside a modal
  function getScrollContainers(modal) {
    const candidates = modal.querySelectorAll(
      // add your own class/attr if you want (e.g. [data-scroll-container])
      ".pm-body, .modal-body, .modal-content, [data-scroll-container]"
    );
    const set = new Set();

    // 1) explicit candidates
    candidates.forEach((el) => set.add(el));

    // 2) the modal itself if it scrolls
    const mcs = getComputedStyle(modal);
    if (
      (mcs.overflowY === "auto" || mcs.overflowY === "scroll") &&
      modal.scrollHeight > modal.clientHeight
    ) {
      set.add(modal);
    }

    // 3) fallback: any descendant that actually scrolls
    modal.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (
        (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight
      ) {
        set.add(el);
      }
    });

    return Array.from(set);
  }

  function resetScroll(modal) {
    const targets = getScrollContainers(modal);
    // ensure instant jump (not smooth)
    targets.forEach((el) => el.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }

  function showModal(modal) {
    if (!modal || isAnimating) return;
    isAnimating = true;
    isModalOpen = true;
    onModalOpen();

    if (modal.hasAttribute("hidden")) modal.removeAttribute("hidden");
    overlay.style.display = "block";
    modal.style.display = "block";

    // ✅ reset after layout is available
    requestAnimationFrame(() => resetScroll(modal));

    gsap.fromTo(
      modal,
      { scaleY: 0, scaleX: 1, opacity: 0 },
      {
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)",
        onStart: () => modal.classList.add("is-opening"),
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

    modal.classList.remove("is-opening");

    gsap.to(overlay, { opacity: 0, duration: 0.5 });
    gsap.to(modal, {
      opacity: 0,
      scaleY: 0,
      scaleX: 1,
      duration: 0.5,
      ease: "back.in(2)",
      onComplete: () => {
        // ✅ reset on close too (covers overlay-click closes)
        resetScroll(modal);

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

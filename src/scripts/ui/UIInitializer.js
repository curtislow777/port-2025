import { initModalSystem } from "../modal.js";
import { initImageOverlay } from "../fadeOverlayImage.js";
import { setupMailbox } from "../mailbox.js";
import appState from "../core/AppState.js";
import audioManager from "../audio.js";
import {
  MODAL_SELECTORS,
  IMAGE_OVERLAY_SELECTORS,
} from "../config/constants.js";

function handleModalOpen() {
  appState.disableRaycast();
  clearHoverEffects();
  appState.cameraManager.handleModalState(true);
}

function handleModalClose() {
  appState.enableRaycast();
  appState.cameraManager.handleModalState(false);
}

function initializeUI() {
  const modalSystem = initModalSystem({
    overlaySelector: MODAL_SELECTORS.overlay,
    modalSelectors: MODAL_SELECTORS.modals,
    closeButtonSelector: MODAL_SELECTORS.closeButton,
    onModalOpen: handleModalOpen,
    onModalClose: handleModalClose,
  });

  appState.setModalSystem(
    modalSystem.overlay,
    modalSystem.modals,
    modalSystem.showModal,
    modalSystem.hideModal
  );

  const imageOverlaySystem = initImageOverlay({
    overlaySelector: IMAGE_OVERLAY_SELECTORS.overlay,
    contentSelector: IMAGE_OVERLAY_SELECTORS.content,
    closeBtnSelector: IMAGE_OVERLAY_SELECTORS.closeBtn,
    imgSelector: IMAGE_OVERLAY_SELECTORS.img,
    textSelector: IMAGE_OVERLAY_SELECTORS.text,
    onClose: () => {
      appState.enableRaycast();
    },
  });

  appState.setImageOverlay(
    imageOverlaySystem.showImageOverlay,
    imageOverlaySystem.hideImageOverlay
  );

  const modalSystemForMailbox = {
    showModal: appState.showModal,
    hideModal: appState.hideModal,
  };
  const mailbox = setupMailbox(appState.scene, modalSystemForMailbox);
  appState.setMailbox(mailbox);
}

// Optional, but recommended
function clearHoverEffects() {
  appState.clearHoverEffects();
  appState.mailbox.updateMailboxHover([]);
}

export { initializeUI, handleModalOpen, handleModalClose };

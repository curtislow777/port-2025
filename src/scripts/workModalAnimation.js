// --- GSAP + Flip setup (if you import elsewhere, skip duplicate register)
import { gsap } from "gsap";
import Flip from "gsap/Flip";
gsap.registerPlugin(Flip);

// Grab existing refs (you already have most of these)
const workModal = document.querySelector(".work-modal");
const detail = document.getElementById("pp-detail");
const backBtn = workModal.querySelector(".ppd-back-btn");
const overviewEls = workModal.querySelectorAll(
    ".modal-main-content, .modal-tech-stack, .pp-divider, .pp-projects"
);

// keep track of which card/detail is open for the reverse animation
let currentModalId = null;

// Helper: fade/slide out overview
function animateOverviewOut() {
    return gsap.to(overviewEls, {
        autoAlpha: 0,
        y: 10,
        duration: 0.25,
        stagger: 0.03,
        onComplete: () => overviewEls.forEach(el => (el.style.display = "none")),
    });
}

// Helper: prepare detail for entrance
function prepDetailEntrance() {
    gsap.set(detail, { autoAlpha: 1 }); // make sure it's visible for animation
    gsap.set(
        detail.querySelectorAll(".ppd-title, .ppd-media, .ppd-sections > *, .ppd-footer"),
        { autoAlpha: 0, y: 10 }
    );
}

// Helper: animate detail in
function animateDetailIn() {
    return gsap.to(
        detail.querySelectorAll(".ppd-title, .ppd-media, .ppd-sections > *, .ppd-footer"),
        { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.06, ease: "power2.out" }
    );
}

// Build your detail HTML (use your existing function but don’t rely on its show/hide)
function mountDetailFromTemplate(modalId) {
    // This is your existing builder, just extracted:
    // (You can call your existing showDetailFromTemplate(modalId) if it ONLY builds content.
    // If it also hides overview, that’s fine—we’re animating after.)
    const tpl = document.getElementById(modalId);
    if (!tpl) return;

    const title = tpl.querySelector(".pp-modal__title")?.textContent?.trim() || "";
    const imgEl = tpl.querySelector(".pp-modal__media img");
    const imgHTML = imgEl
        ? `<img src="${imgEl.getAttribute("src")}" alt="${imgEl.getAttribute("alt") || ""}" loading="lazy">`
        : "";
    const descHTML = tpl.querySelector(".pp-modal__desc")?.innerHTML || "";
    const techTagsHTML =
        tpl.querySelector(".pp-modal__tech .pp-modal__tags")?.innerHTML || "";
    const featuresHTML =
        tpl.querySelector(".pp-modal__features ul")?.innerHTML || "";
    const linksHTML =
        tpl.querySelector(".pp-modal__footer .pp-modal__links")?.innerHTML || "";

    detail.innerHTML = `
    <header class="ppd-header">
      <h2 class="ppd-title" tabindex="-1">${title}</h2>
    </header>
    <div class="ppd-body">
      <div class="ppd-media">${imgHTML}</div>
      <section class="ppd-sections">
        <div class="ppd-desc">${descHTML}</div>
        ${techTagsHTML ? `<div class="ppd-tech"><h3>Technologies</h3><div class="ppd-tags">${techTagsHTML}</div></div>` : ""}
        ${featuresHTML ? `<div class="ppd-features"><h3>Key Features</h3><ul>${featuresHTML}</ul></div>` : ""}
      </section>
    </div>
    ${linksHTML ? `<footer class="ppd-footer">${linksHTML}</footer>` : ""}
  `;
}

// Main: animate card → detail (with FLIP on the thumbnail)
async function animateToDetail(card, modalId) {
    currentModalId = modalId;

    const cardImg = card.querySelector(".pp-card__img img");
    const hasImg = !!cardImg;
    const imgState = hasImg ? Flip.getState(cardImg) : null;

    // 1) fade the overview out (but keep in DOM until we capture)
    await animateOverviewOut();

    // 2) build the detail content & prep entrance
    //    This also hides the title via your CSS (.pp-detail-active)
    workModal.classList.add("pp-detail-active");
    detail.hidden = false;
    backBtn.hidden = false;
    overviewEls.forEach(el => (el.style.display = "none"));
    mountDetailFromTemplate(modalId);
    prepDetailEntrance();

    // 3) FLIP the image from card → detail
    if (hasImg) {
        const destImg = detail.querySelector(".ppd-media img");
        if (destImg) destImg.replaceWith(cardImg); // move real element into destination
        Flip.from(imgState, {
            duration: 0.55,
            ease: "power2.inOut",
            absolute: true,
            scale: true,
            onComplete: () => gsap.set(cardImg, { clearProps: "all" }) // ← key line
        });
    }

    // 4) Stagger in the rest of the detail content
    animateDetailIn();
    detail.querySelector(".ppd-title")?.focus?.();
}

// Reverse: detail → card (with FLIP back)
async function animateBack() {
    if (!currentModalId) return;
    const card = workModal.querySelector(`.pp-card[data-modal="${currentModalId}"]`);
    const targetImgWrap = card?.querySelector(".pp-card__img");
    const imgInDetail = detail.querySelector(".ppd-media img");

    // 1) fade out detail text first
    await gsap.to(
        detail.querySelectorAll(".ppd-footer, .ppd-sections > *, .ppd-title"),
        { autoAlpha: 0, y: 10, duration: 0.25, stagger: 0.03, ease: "power2.in" }
    );

    // 2) FLIP image back into card
    if (imgInDetail && targetImgWrap) {
        const state = Flip.getState(imgInDetail);
        targetImgWrap.appendChild(imgInDetail);
        await Flip.from(state, {
            duration: 0.5,
            ease: "power2.inOut",
            absolute: true,
            scale: true,
            onComplete: () => gsap.set(imgInDetail, { clearProps: "all" }) // 
        });

    }

    // 3) restore overview (your existing showOverview logic)
    detail.hidden = true;
    detail.innerHTML = "";
    workModal.classList.remove("pp-detail-active");
    backBtn.hidden = true;
    overviewEls.forEach(el => (el.style.display = ""));

    // fade overview back in
    gsap.fromTo(
        overviewEls,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.02, ease: "power2.out" }
    );

    currentModalId = null;
}

// --- Hook into your current listeners ---------------------------------

// Replace your existing card click handler body with this:
workModal.addEventListener("click", (e) => {
    const card = e.target.closest(".pp-card[data-modal]");
    if (!card || card.closest(".work-modal") !== workModal) return;
    if (e.target.closest("a, button, [role='button']")) return; // allow links
    e.preventDefault();
    const modalId = card.getAttribute("data-modal");
    animateToDetail(card, modalId);
});

// Replace back button & modal close to use the animated reverse:
backBtn?.addEventListener("click", animateBack);
workModal.querySelector(".modal-close-btn")?.addEventListener("click", animateBack);

// If you also close via overlay, you can call animateBack() there too.
export function initWorkModalAnimations({ workModalEl, overlayEl, onCloseAll }) {
    // wire up listeners against the specific work modal element
    const backBtn = workModalEl.querySelector(".ppd-back-btn");

    workModalEl.addEventListener("click", (e) => {
        const card = e.target.closest(".pp-card[data-modal]");
        if (!card || card.closest(".work-modal") !== workModalEl) return;
        if (e.target.closest("a, button, [role='button']")) return;
        e.preventDefault();
        const modalId = card.getAttribute("data-modal");
        animateToDetail(card, modalId); // your function
    });

    backBtn?.addEventListener("click", animateBack); // your function

    // Close (X) should reset detail, then close the modal
    workModalEl.querySelector(".modal-close-btn")?.addEventListener("click", async () => {
        await animateBack();      // safely no-op if already at overview
        onCloseAll?.();           // actually hide the modal
    });

    // Clicking the global overlay while work modal is open should also reset then close
    overlayEl?.addEventListener("click", async () => {
        const visible = getComputedStyle(workModalEl).display !== "none";
        if (!visible) return;
        await animateBack();
        onCloseAll?.();
    });
}
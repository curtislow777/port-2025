// Safe JavaScript transitions - no transforms on containers
export function initProjectsDetail(root) {
  if (!root) return { toList: () => { } };

  const listWrap = root.querySelector("#pp-projects");
  const detailEl = root.querySelector("#pp-detail");
  const backBtn = root.querySelector(".pm-back");
  const titleChip = root.querySelector(".pm-bar__title");

  // Animation timing constants
  const TRANSITION_DURATION = 300; // ms

  function toList() {
    // Add loading state
    root.classList.add("is-transitioning-out");

    setTimeout(() => {
      // Update DOM structure
      root.classList.remove("is-detail", "is-transitioning-out");
      detailEl.hidden = true;
      listWrap.hidden = false;
      backBtn.hidden = true;
      titleChip.textContent = "Projects";
      detailEl.innerHTML = "";

      // Smooth scroll to top of modal body
      const modalBody = root.querySelector('.pm-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      } else {
        root.scrollTop = 0;
      }
    }, TRANSITION_DURATION);
  }

  function toDetail(card) {
    // Add loading state
    root.classList.add("is-loading");

    // Get card data
    const title = card.querySelector(".pp-card__title")?.textContent?.trim() || "Project";
    const img = card.querySelector(".pp-card__img img")?.getAttribute("src") || "";
    const desc = card.querySelector(".pp-card__desc")?.innerHTML || "";
    const longDetail = card.querySelector(".pp-card__detail")?.innerHTML || "";
    const tags = [...card.querySelectorAll(".pp-tag")].map((t) => t.textContent.trim());
    const links = [...card.querySelectorAll(".pp-card__links a")].map((a) => ({
      href: a.getAttribute("href"),
      label: a.getAttribute("aria-label") || "Link",
    }));

    // Fade out list view
    root.classList.add("is-transitioning-out");

    setTimeout(() => {
      // Build detail content
      detailEl.innerHTML = `
        <header class="ppd-header"><span class="ppd-title">${title}</span></header>
        <figure class="ppd-media"><img src="${img}" alt="${title}"></figure>
        <div class="ppd-sections">
          ${desc ? `<section class="ppd-desc"><p>${desc}</p></section>` : ""}
          ${longDetail}
          ${tags.length ? `
            <section class="ppd-tech">
              <h3>Technologies</h3>
              <div class="pp-tags">${tags.map((t) => `<span class="pp-tag">${t}</span>`).join("")}</div>
            </section>
          ` : ""}
          ${links.length ? `
            <section class="ppd-footer">
              ${links.map((l) => `<a class="pp-btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("")}
            </section>
          ` : ""}
        </div>
      `;

      // Update DOM structure
      root.classList.add("is-detail");
      root.classList.remove("is-loading", "is-transitioning-out");
      detailEl.hidden = false;
      listWrap.hidden = true;
      backBtn.hidden = false;
      titleChip.textContent = title;

      // Smooth scroll to top of modal body
      const modalBody = root.querySelector('.pm-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      } else {
        root.scrollTop = 0;
      }
    }, TRANSITION_DURATION);
  }

  // Simple click handler - no transforms on cards during transition
  function handleCardClick(card) {
    toDetail(card);
  }

  // Events
  listWrap?.addEventListener("click", (e) => {
    const card = e.target.closest(".pp-card");
    if (card) handleCardClick(card);
  });

  listWrap?.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".pp-card")) {
      e.preventDefault();
      const card = e.target.closest(".pp-card");
      handleCardClick(card);
    }
  });

  // Simple back button
  backBtn?.addEventListener("click", () => {
    toList();
  });

  // Reset to list whenever the modal's close button is clicked
  root.querySelectorAll(".modal-close-btn, .pm-close")
    .forEach((btn) => btn.addEventListener("click", toList));

  // Start in list view
  toList();

  return { toList };
}
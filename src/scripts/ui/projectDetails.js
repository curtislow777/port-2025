import gsap from "gsap";
// Safe JavaScript transitions - no transforms on containers

export function initProjectsDetail(root) {
  if (!root) return { toList: () => {} };

  const listWrap = root.querySelector("#pp-projects");
  const detailEl = root.querySelector("#pp-detail");
  const backBtn = root.querySelector(".pm-back");

  const TRANSITION_DURATION = 300; // ms

  function scrollToTop() {
    const body = root.querySelector(".pm-body");
    (body || root).scrollTop = 0;
  }

  function toList() {
    // 1) Make the list visible but held at opacity 0
    listWrap.hidden = false;
    root.classList.add("is-entering-list");

    // 2) Fade the detail out
    root.classList.add("is-leaving-detail");

    // 3) After fade completes, swap state
    setTimeout(() => {
      root.classList.remove("is-detail");
      detailEl.hidden = true;
      backBtn.hidden = true;
      detailEl.innerHTML = "";
      scrollToTop();

      // 4) Release the list fade and then trigger the same child reveal
      requestAnimationFrame(() => {
        root.classList.remove("is-leaving-detail");
        root.classList.remove("is-entering-list");

        // 🔸 Reuse your existing modal content reveal (children fade in)
        root.classList.add("is-opening");
        setTimeout(() => {
          root.classList.remove("is-opening");
        }, 380); // a hair longer than your 360ms child animation
      });
    }, TRANSITION_DURATION);
  }

  function toDetail(card) {
    // Fade the list out (uses your existing CSS: .is-transitioning-out .pp-projects { opacity: 0; })
    root.classList.add("is-transitioning-out");

    // Collect content up front
    const title =
      card.querySelector(".pp-card__title")?.textContent?.trim() || "Project";
    const img =
      card.querySelector(".pp-card__img img")?.getAttribute("src") || "";
    const desc = card.querySelector(".pp-card__desc")?.innerHTML || "";
    const longDetail = card.querySelector(".pp-card__detail")?.innerHTML || "";
    const tags = [...card.querySelectorAll(".pp-tag")].map((t) =>
      t.textContent.trim()
    );
    const links = [...card.querySelectorAll(".pp-card__links a")].map((a) => ({
      href: a.getAttribute("href"),
      label: a.getAttribute("aria-label") || "Link",
    }));

    setTimeout(() => {
      // Build and show detail
      detailEl.innerHTML = `
        <header class="ppd-header"><span class="ppd-title">${title}</span></header>
        <figure class="ppd-media"><img src="${img}" alt="${title}"></figure>
        <div class="ppd-sections">
          ${desc ? `<section class="ppd-desc"><p>${desc}</p></section>` : ""}
          ${longDetail}
          ${
            tags.length
              ? `<section class="ppd-tech">
                   <h3>Technologies</h3>
                   <div class="pp-tags">${tags.map((t) => `<span class="pp-tag">${t}</span>`).join("")}</div>
                 </section>`
              : ""
          }
          ${
            links.length
              ? `<section class="ppd-footer">
                   ${links.map((l) => `<a class="pp-btn" href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("")}
                 </section>`
              : ""
          }
        </div>
      `;

      root.classList.add("is-detail");
      detailEl.hidden = false;
      listWrap.hidden = true;
      backBtn.hidden = false;

      root.classList.remove("is-transitioning-out");
      scrollToTop();
    }, TRANSITION_DURATION);
  }

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
      handleCardClick(e.target.closest(".pp-card"));
    }
  });

  backBtn?.addEventListener("click", toList);

  root
    .querySelectorAll(".modal-close-btn, .pm-close")
    .forEach((btn) => btn.addEventListener("click", toList));

  // Start in list view
  listWrap.hidden = false;
  detailEl.hidden = true;
  backBtn.hidden = true;
  root.classList.remove("is-detail");

  return { toList };
}

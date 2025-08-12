// src/ui/projectsDetail.js
export function initProjectsDetail(root) {
  if (!root) return { toList: () => {} };

  const listWrap = root.querySelector("#pp-projects");
  const detailEl = root.querySelector("#pp-detail");
  const backBtn = root.querySelector(".pm-back");
  const titleChip = root.querySelector(".pm-bar__title");

  function toList() {
    root.classList.remove("is-detail");
    detailEl.hidden = true;
    listWrap.hidden = false;
    backBtn.hidden = true;
    titleChip.textContent = "Projects";
    detailEl.innerHTML = "";
    root.scrollTop = 0;
  }

  function toDetail(card) {
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

    detailEl.innerHTML = `
      <header class="ppd-header"><span class="ppd-title">${title}</span></header>
      <figure class="ppd-media"><img src="${img}" alt="${title}"></figure>
      <div class="ppd-sections">
        ${desc ? `<section class="ppd-desc"><p>${desc}</p></section>` : ""}
        ${longDetail}
        ${
          tags.length
            ? `<section class="ppd-tech"><h3>Technologies</h3>
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
    titleChip.textContent = title;
    root.scrollTop = 0;
  }

  // events
  listWrap?.addEventListener("click", (e) => {
    const card = e.target.closest(".pp-card");
    if (card) toDetail(card);
  });
  listWrap?.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest(".pp-card")) {
      e.preventDefault();
      toDetail(e.target.closest(".pp-card"));
    }
  });
  backBtn?.addEventListener("click", toList);

  // reset to list whenever the modal’s close button is clicked
  root
    .querySelectorAll(".modal-close-btn, .pm-close")
    .forEach((btn) => btn.addEventListener("click", toList));

  // start in list view
  toList();

  return { toList };
}

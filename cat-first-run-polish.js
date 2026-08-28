(function catFirstRunPolish() {
  "use strict";

  let syncQueued = false;

  function isCatManager() {
    return (document.getElementById("manager-butler-name")?.textContent || "").includes("고양이");
  }

  function syncManagerCard() {
    const card = document.querySelector("#view-manager .personnel-card");
    if (!card) return;

    const catActive = isCatManager();
    card.classList.toggle("cat-manager-condensed", catActive);

    card.querySelectorAll(".manager-section-label").forEach((label) => {
      const detailLabel = /기본 정보|근 무 현 황|근무 현황/.test(label.textContent || "");
      label.classList.toggle("cat-manager-detail-label", catActive && detailLabel);
    });

    let toggle = card.querySelector(".cat-manager-detail-toggle");
    if (catActive && !toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "cat-manager-detail-toggle";
      toggle.textContent = "근무 정보 보기";
      const stats = card.querySelector(".manager-stats");
      (stats || card.querySelector(".manager-facts"))?.insertAdjacentElement("afterend", toggle);
    }

    if (toggle) {
      toggle.hidden = !catActive;
      const expanded = card.classList.contains("cat-manager-details-open");
      toggle.textContent = expanded ? "근무 정보 접기" : "근무 정보 보기";
      toggle.setAttribute("aria-expanded", String(expanded));
    }
  }

  function syncFirstGiftGate() {
    const button = document.getElementById("give-gift-button");
    if (!button) return;

    const deedCount = Number.parseInt(document.getElementById("stat-deeds")?.textContent || "0", 10) || 0;
    const gated = isCatManager() && deedCount === 0;
    button.classList.toggle("is-first-story-gate", gated);

    let note = button.querySelector(".first-gift-gate-note");
    if (gated && !note) {
      note = document.createElement("small");
      note.className = "first-gift-gate-note";
      note.textContent = "첫 이야기 접수 후 열림";
      button.querySelector(".gift-parcel-copy")?.appendChild(note);
    }
    if (note) note.hidden = !gated;

    if (gated) {
      button.setAttribute("aria-label", "첫 이야기 접수하러 가기 · 선물은 첫 이야기 뒤에 열립니다");
    } else {
      button.removeAttribute("aria-label");
    }
  }

  function ensureBackupDisclosure() {
    const panel = document.querySelector("#view-archive .owner-file-backup");
    if (!panel || panel.dataset.disclosureReady === "true") return;

    panel.dataset.disclosureReady = "true";
    panel.id ||= "owner-file-backup-panel";
    panel.classList.add("is-collapsed");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "owner-file-backup-toggle";
    button.textContent = "보관본 관리";
    button.setAttribute("aria-controls", panel.id);
    button.setAttribute("aria-expanded", "false");
    panel.insertAdjacentElement("beforebegin", button);
  }

  function syncAll() {
    syncQueued = false;
    syncManagerCard();
    syncFirstGiftGate();
    ensureBackupDisclosure();
  }

  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(syncAll);
  }

  document.addEventListener("click", (event) => {
    const detailToggle = event.target.closest(".cat-manager-detail-toggle");
    if (detailToggle) {
      const card = detailToggle.closest(".personnel-card");
      card?.classList.toggle("cat-manager-details-open");
      queueSync();
      return;
    }

    const backupToggle = event.target.closest(".owner-file-backup-toggle");
    if (backupToggle) {
      const panel = document.getElementById(backupToggle.getAttribute("aria-controls"));
      const expanded = backupToggle.getAttribute("aria-expanded") !== "true";
      backupToggle.setAttribute("aria-expanded", String(expanded));
      panel?.classList.toggle("is-collapsed", !expanded);
    }
  });

  document.addEventListener("click", (event) => {
    const giftGate = event.target.closest("#give-gift-button.is-first-story-gate");
    if (!giftGate) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelector('[data-view="home"]')?.click();
    window.setTimeout(() => {
      const input = document.getElementById("deed-input");
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus({ preventScroll: true });
    }, 80);
  }, true);

  function start() {
    syncAll();
    const manager = document.getElementById("manager-details");
    if (manager) {
      new MutationObserver(queueSync).observe(manager, {
        subtree: true,
        childList: true,
        characterData: true
      });
    }
    document.querySelector(".bottom-nav")?.addEventListener("click", queueSync);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();

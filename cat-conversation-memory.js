(function () {
  "use strict";

  const STORAGE_KEY = "butlermaker_v1";
  const CARD_ID = "cat-conversation-memory";
  let clearArmed = false;
  let clearTimer = 0;

  function readState() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) {
      return {};
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    })[character]);
  }

  function recentTurns(memory) {
    return Array.isArray(memory?.recentTurns)
      ? memory.recentTurns.filter(turn => turn && (turn.user || turn.reply)).slice(-5).reverse()
      : [];
  }

  function cardMarkup(turns) {
    const turnMarkup = turns.length ? turns.map(turn => `
      <div class="cat-memory-turn">
        <p><b>주인님</b>${escapeHtml(turn.user)}</p>
        <p><b>치즈냥</b>${escapeHtml(turn.reply).replace(/\n/g, "<br>")}</p>
      </div>
    `).join("") : '<p class="cat-memory-empty">아직 저장된 짧은 대화가 없습니다.</p>';
    /* 뺄셈 라운드 — 펼침 하나로 접는다. 원래는 카드가 항상 펼쳐진 채 「기억 비우기」
       버튼과 「최근 대화 확인」 펼침이 따로 있어, 설정 안에서 두 번 눈길을 끌었다.
       설정성 기능은 필요할 때 여는 것이지 항상 보이는 것이 아니다. */
    return `
      <details class="cat-memory-fold">
        <summary><b>치즈냥의 대화 기억</b><small>최근 대화 ${turns.length}/5개</small></summary>
        <div class="cat-memory-body">
          <p class="cat-memory-note">이 기기에서 직접 들려준 말만 잠깐 기억합니다. 기록 파일과 집사 일기는 지워지지 않습니다.</p>
          <div class="cat-memory-turns">${turnMarkup}</div>
          <button class="cat-memory-clear" type="button" ${turns.length ? "" : "disabled"}>기억 비우기</button>
        </div>
      </details>
    `;
  }

  function render() {
    const settings = document.querySelector(".office-settings");
    if (!settings) return;
    const memory = readState().chatMemory || {};
    const existing = document.getElementById(CARD_ID);
    if (memory.character && memory.character !== "cat") {
      existing?.remove();
      return;
    }
    const turns = recentTurns(memory);
    const signature = JSON.stringify(turns);
    const card = existing || document.createElement("div");
    if (!existing) {
      card.id = CARD_ID;
      card.className = "cat-conversation-memory";
      settings.appendChild(card);
    }
    if (card.dataset.signature === signature) return;
    card.dataset.signature = signature;
    card.innerHTML = cardMarkup(turns);
  }

  function clearConversationMemory(button) {
    if (!clearArmed) {
      clearArmed = true;
      button.textContent = "한 번 더 누르면 비움";
      clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        clearArmed = false;
        button.textContent = "기억 비우기";
      }, 2500);
      return;
    }
    const state = readState();
    if (state.chatMemory?.character && state.chatMemory.character !== "cat") return;
    delete state.chatMemory;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    clearArmed = false;
    clearTimeout(clearTimer);
    window.location.reload();
  }

  function installStyles() {
    if (document.getElementById("cat-conversation-memory-style")) return;
    const style = document.createElement("style");
    style.id = "cat-conversation-memory-style";
    style.textContent = `
      .cat-conversation-memory{border-top:1px solid rgba(111,91,69,.22);margin-top:14px;padding-top:14px;color:#4b4035}
      .cat-memory-fold summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;cursor:pointer;list-style:none}
      .cat-memory-fold summary::-webkit-details-marker{display:none}
      .cat-memory-fold summary b{font-size:14px;color:#4b4035}
      .cat-memory-fold summary small{color:#9c8b78;font-size:11px;white-space:nowrap}
      .cat-memory-fold summary small::after{content:" · 펼치기"}.cat-memory-fold[open] summary small::after{content:" · 접기"}
      .cat-memory-body{padding:2px 0 8px}
      .cat-memory-note{color:#8b7a68;font-size:12px;line-height:1.55;margin:0 0 10px}
      .cat-memory-clear{margin-top:12px;border:1px solid #bcae9a;border-radius:7px;background:#f8f1e5;color:#725f4c;box-shadow:0 2px 0 #d5c7b3;padding:7px 10px;font:700 12px inherit;white-space:nowrap}
      .cat-memory-clear:disabled{opacity:.45;box-shadow:none}
      .cat-memory-turns{display:grid;gap:8px}.cat-memory-turn{background:rgba(255,251,243,.68);border-left:2px solid rgba(143,29,53,.4);padding:8px 10px}
      .cat-memory-turn p{display:grid;grid-template-columns:48px 1fr;gap:7px;margin:0;color:#5f5143;font-size:12px;line-height:1.5}.cat-memory-turn p+p{margin-top:5px}
      .cat-memory-turn b{color:#8f1d35;font-size:11px}.cat-memory-empty{margin:0;color:#9c8b78;font-size:12px}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("click", event => {
    const clearButton = event.target.closest(".cat-memory-clear");
    if (clearButton) {
      event.preventDefault();
      clearConversationMemory(clearButton);
      return;
    }
    window.setTimeout(render, 0);
  });
  window.addEventListener("storage", render);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  installStyles();
  render();
})();

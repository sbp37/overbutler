(function () {
  "use strict";

  const STORAGE_KEY = "butlermaker_v1";
  const Storage = window.OverbutlerStorage;
  const CARD_ID = "cat-conversation-memory";
  let clearArmed = false;
  let clearTimer = 0;

  function readState() {
    try {
      const value = JSON.parse(Storage.loadState() || "{}");
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
    return `
      <div class="cat-memory-heading">
        <span><b>치즈냥의 대화 기억</b><small>최근 대화 ${turns.length}/5개</small></span>
        <button class="cat-memory-clear" type="button" ${turns.length ? "" : "disabled"}>기억 비우기</button>
      </div>
      <p class="cat-memory-note">이 기기에서 직접 들려준 말만 잠깐 기억합니다. 기록 파일과 집사 일기는 지워지지 않습니다.</p>
      <details class="cat-memory-details">
        <summary>최근 대화 확인</summary>
        <div class="cat-memory-turns">${turnMarkup}</div>
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

  async function clearConversationMemory(button) {
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
    Storage.saveState(JSON.stringify(state));
    await Storage.flush();
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
      .cat-memory-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .cat-memory-heading span{display:grid;gap:2px}.cat-memory-heading b{font-size:15px}
      .cat-memory-heading small,.cat-memory-note{color:#8b7a68;font-size:12px;line-height:1.55}.cat-memory-note{margin:8px 0 10px}
      .cat-memory-clear{border:1px solid #bcae9a;border-radius:7px;background:#f8f1e5;color:#725f4c;box-shadow:0 2px 0 #d5c7b3;padding:7px 10px;font:700 12px inherit;white-space:nowrap}
      .cat-memory-clear:disabled{opacity:.45;box-shadow:none}.cat-memory-details{border-top:1px dashed rgba(111,91,69,.22);padding-top:9px}
      .cat-memory-details summary{cursor:pointer;color:#8f1d35;font-size:13px;font-weight:700;list-style:none}.cat-memory-details summary::-webkit-details-marker{display:none}
      .cat-memory-details summary::after{content:" 펼치기";color:#9c8b78;font-size:11px;font-weight:400}.cat-memory-details[open] summary::after{content:" 접기"}
      .cat-memory-turns{display:grid;gap:8px;margin-top:10px}.cat-memory-turn{background:rgba(255,251,243,.68);border-left:2px solid rgba(143,29,53,.4);padding:8px 10px}
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

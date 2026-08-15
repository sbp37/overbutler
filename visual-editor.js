(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  // Allowlist: editor loads only on local dev and Vercel preview deployments,
  // never on production or custom domains.
  const host = window.location.hostname;
  const isEditableHost = host === "localhost" || host === "127.0.0.1" || /-sbp37s-projects\.vercel\.app$/.test(host);
  if (params.get("visual-edit") !== "1" || !isEditableHost) return;

  const STORAGE_KEY = "overbutler_visual_editor_v1";
  const APP_STORAGE_KEY = "butlermaker_v1";
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;

  // Visual previews must never overwrite the real app save, even when the
  // user switches to preview mode and taps ordinary app controls.
  Storage.prototype.setItem = function visualEditorSafeSetItem(key, value) {
    if (this === window.localStorage && key === APP_STORAGE_KEY) return;
    return nativeSetItem.call(this, key, value);
  };
  Storage.prototype.removeItem = function visualEditorSafeRemoveItem(key) {
    if (this === window.localStorage && key === APP_STORAGE_KEY) return;
    return nativeRemoveItem.call(this, key);
  };
  const TARGETS = [
    { key: "logo", label: "로고", selector: "#view-home .home-logo-lockup strong", text: true, width: true },
    { key: "character", label: "캐릭터", selector: "#view-home .briefing-character", width: true },
    { key: "speech", label: "말풍선", selector: "#view-home #briefing-message", text: true, width: true },
    { key: "room", label: "집사방", selector: "#view-home .briefing-stage", width: false },
    { key: "recordTitle", label: "기록 제목", selector: "#view-home .entry-heading h2", text: true, width: true },
    { key: "recordDesc", label: "설명", selector: "#view-home #entry-description", text: true, width: true },
    { key: "input", label: "입력창", selector: "#view-home #achievement-input", text: true, width: true },
    { key: "quick", label: "빠른 기록", selector: "#view-home #quick-actions", width: true },
    { key: "cta", label: "기록 버튼", selector: "#view-home #report-button", text: true, width: true },
    { key: "event", label: "사내 사건", selector: "#view-home #home-office-event", text: false, width: true },
    { key: "nav", label: "하단 메뉴", selector: "#main-screen .bottom-nav", text: true, width: true }
  ];
  const DEFAULT_VALUE = Object.freeze({ x: 0, y: 0, scale: 100, fontSize: 0, width: 0 });
  const APPROVED_BASE_VALUES = Object.freeze({
    logo: { x: -18, y: 1, scale: 79 },
    room: { x: -3, y: 1 },
    character: { x: -2, y: -51, scale: 84 },
    recordTitle: { x: -1, y: 2 },
    recordDesc: { x: -1, y: -1 },
    input: { x: 1 },
    quick: { x: -14, y: -1, scale: 86 },
    cta: { scale: 96 },
    event: { x: 6, y: -2 }
  });
  let config = loadConfig();
  let selectedKey = "character";
  let inspect = true;
  let drag = null;
  let toastTimer = 0;

  function findTarget(key) {
    const definition = TARGETS.find(item => item.key === key);
    if (!definition) return null;
    return { definition, element: document.querySelector(definition.selector) };
  }

  function normalizedValue(key) {
    return { ...DEFAULT_VALUE, ...(APPROVED_BASE_VALUES[key] || {}), ...(config[key] || {}) };
  }

  function applyTarget(key) {
    const target = findTarget(key);
    if (!target?.element) return;
    const value = normalizedValue(key);
    target.element.dataset.visualEditTarget = key;
    target.element.style.translate = `${value.x}px ${value.y}px`;
    target.element.style.scale = String(value.scale / 100);
    target.element.style.fontSize = value.fontSize ? `${value.fontSize}px` : "";
    target.element.style.width = value.width ? `${value.width}px` : "";
  }

  function applyAll() {
    TARGETS.forEach(item => applyTarget(item.key));
  }

  function saveConfig() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (_) {}
  }

  function loadConfig() {
    const shared = decodeSharedConfig();
    if (shared) return shared;
    try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch (_) { return {}; }
  }

  function encode(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
  }

  function decode(value) {
    try {
      const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
      const binary = window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) { return null; }
  }

  function decodeSharedConfig() {
    const match = window.location.hash.match(/(?:^#|&)ve=([^&]+)/);
    return match ? decode(match[1]) : null;
  }

  function shareUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("visual-edit", "1");
    url.hash = `ve=${encode(config)}`;
    return url.toString();
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      return copied;
    }
  }

  function notify(message) {
    const toast = document.querySelector(".visual-editor-toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function createEditor() {
    const shell = document.createElement("aside");
    shell.className = "visual-editor-shell";
    shell.setAttribute("aria-label", "과잉집사 시각 편집기");
    shell.innerHTML = `
      <div class="visual-editor-head">
        <strong>화면 직접 수정</strong>
        <button type="button" data-ve-mode class="is-active">선택</button>
        <button type="button" data-ve-collapse aria-label="편집 패널 접기">접기</button>
      </div>
      <div class="visual-editor-body">
        <div class="visual-editor-presets" aria-label="미리보기 상태">
          <button type="button" data-ve-preview="cat:1">CAT 1일</button>
          <button type="button" data-ve-preview="cat:7">CAT 7일</button>
          <button type="button" data-ve-preview="ai:1">AI 1일</button>
          <button type="button" data-ve-preview="ai:7">AI 7일</button>
        </div>
        <div class="visual-editor-targets" aria-label="편집할 요소">
          ${TARGETS.map(item => `<button type="button" data-ve-target="${item.key}" aria-pressed="false">${item.label}</button>`).join("")}
        </div>
        <div class="visual-editor-selected"><span>선택한 요소</span><b data-ve-selected>캐릭터</b></div>
        <div class="visual-editor-controls">
          ${controlMarkup("x", "가로 위치", -140, 140, 1, "px")}
          ${controlMarkup("y", "세로 위치", -140, 140, 1, "px")}
          ${controlMarkup("scale", "크기", 50, 160, 1, "%")}
          ${controlMarkup("fontSize", "글씨", 8, 48, 1, "px")}
          ${controlMarkup("width", "너비", 60, 430, 1, "px")}
        </div>
        <div class="visual-editor-actions">
          <button type="button" data-ve-reset>현재 초기화</button>
          <button type="button" data-ve-reset-all>전체 초기화</button>
          <button type="button" class="visual-editor-copy" data-ve-copy>공유 링크 복사</button>
        </div>
        <p class="visual-editor-help">선택 모드에서 화면 요소를 손가락으로 끌어 옮기세요. 조절이 끝나면 공유 링크 하나만 보내면 됩니다. 이 값은 실제 앱 데이터와 분리됩니다.</p>
      </div>`;
    document.body.append(shell);
    const toast = document.createElement("div");
    toast.className = "visual-editor-toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
    return shell;
  }

  function controlMarkup(key, label, min, max, step, unit) {
    return `<div class="visual-editor-control" data-ve-control="${key}">
      <label for="ve-${key}"><span>${label}</span><small>${key === "fontSize" || key === "width" ? "0 = 원래값" : ""}</small></label>
      <input id="ve-${key}" type="range" min="${key === "fontSize" || key === "width" ? 0 : min}" max="${max}" step="${step}" data-ve-range="${key}">
      <output for="ve-${key}" data-ve-output="${key}" data-unit="${unit}"></output>
    </div>`;
  }

  function updatePanel(shell, options = {}) {
    const target = TARGETS.find(item => item.key === selectedKey) || TARGETS[0];
    const value = normalizedValue(selectedKey);
    shell.querySelector("[data-ve-selected]").textContent = target.label;
    shell.querySelectorAll("[data-ve-target]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.veTarget === selectedKey)));
    shell.querySelectorAll("[data-ve-range]").forEach(input => {
      const key = input.dataset.veRange;
      input.value = String(value[key]);
      const output = shell.querySelector(`[data-ve-output="${key}"]`);
      output.textContent = `${value[key]}${output.dataset.unit}`;
    });
    shell.querySelector('[data-ve-control="fontSize"]').hidden = !target.text;
    shell.querySelector('[data-ve-control="width"]').hidden = !target.width;
    document.querySelectorAll(".ve-selected").forEach(element => element.classList.remove("ve-selected"));
    const current = findTarget(selectedKey)?.element;
    current?.classList.add("ve-selected");
    if (options.scroll !== false) current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  function selectTarget(key, shell) {
    if (!TARGETS.some(item => item.key === key)) return;
    selectedKey = key;
    updatePanel(shell);
  }

  function updateValue(key, value, shell) {
    config[selectedKey] = { ...normalizedValue(selectedKey), [key]: Number(value) };
    applyTarget(selectedKey);
    saveConfig();
    updatePanel(shell);
  }

  function resetTarget(shell) {
    delete config[selectedKey];
    const target = findTarget(selectedKey)?.element;
    if (target) {
      target.style.translate = "";
      target.style.scale = "";
      target.style.fontSize = "";
      target.style.width = "";
    }
    saveConfig();
    updatePanel(shell);
    notify("현재 요소를 원래대로 돌렸어요.");
  }

  function resetAll(shell) {
    config = {};
    TARGETS.forEach(item => {
      const element = findTarget(item.key)?.element;
      if (!element) return;
      element.style.translate = "";
      element.style.scale = "";
      element.style.fontSize = "";
      element.style.width = "";
    });
    saveConfig();
    updatePanel(shell);
    notify("모든 조절값을 초기화했어요.");
  }

  function navigatePreview(value) {
    const [character, day] = value.split(":");
    const url = new URL(window.location.href);
    url.searchParams.set("visual-edit", "1");
    url.searchParams.set("mvpCharacter", character);
    url.searchParams.set("mvpDay", day);
    url.hash = `ve=${encode(config)}`;
    window.location.href = url.toString();
  }

  function bindEditor(shell) {
    shell.addEventListener("input", event => {
      const input = event.target.closest("[data-ve-range]");
      if (input) updateValue(input.dataset.veRange, input.value, shell);
    });
    shell.addEventListener("click", async event => {
      const targetButton = event.target.closest("[data-ve-target]");
      if (targetButton) { selectTarget(targetButton.dataset.veTarget, shell); return; }
      const previewButton = event.target.closest("[data-ve-preview]");
      if (previewButton) { navigatePreview(previewButton.dataset.vePreview); return; }
      if (event.target.closest("[data-ve-mode]")) {
        inspect = !inspect;
        document.documentElement.dataset.visualInspect = String(inspect);
        const button = shell.querySelector("[data-ve-mode]");
        button.textContent = inspect ? "선택" : "미리보기";
        button.classList.toggle("is-active", inspect);
        notify(inspect ? "화면 요소를 눌러 편집하세요." : "앱을 평소처럼 조작할 수 있어요.");
        return;
      }
      if (event.target.closest("[data-ve-collapse]")) {
        shell.classList.toggle("is-collapsed");
        shell.querySelector("[data-ve-collapse]").textContent = shell.classList.contains("is-collapsed") ? "열기" : "접기";
        return;
      }
      if (event.target.closest("[data-ve-reset]")) { resetTarget(shell); return; }
      if (event.target.closest("[data-ve-reset-all]")) { resetAll(shell); return; }
      if (event.target.closest("[data-ve-copy]")) {
        const copied = await copyText(shareUrl());
        notify(copied ? "공유 링크를 복사했어요. 이 링크 하나만 보내주세요." : "복사하지 못했어요. 브라우저 권한을 확인해주세요.");
      }
    });

    document.addEventListener("pointerdown", event => {
      if (!inspect || event.target.closest(".visual-editor-shell")) return;
      const match = TARGETS.map(item => ({ item, element: event.target.closest(item.selector) })).find(candidate => candidate.element);
      if (!match) return;
      selectTarget(match.item.key, shell);
      const value = normalizedValue(match.item.key);
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: value.x, y: value.y };
      match.element.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener("pointermove", event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      config[selectedKey] = { ...normalizedValue(selectedKey), x: Math.round(drag.x + event.clientX - drag.startX), y: Math.round(drag.y + event.clientY - drag.startY) };
      applyTarget(selectedKey);
      updatePanel(shell, { scroll: false });
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    const finishDrag = event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag = null;
      saveConfig();
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    document.addEventListener("pointerup", finishDrag, true);
    document.addEventListener("pointercancel", finishDrag, true);
  }

  function init() {
    document.documentElement.dataset.visualEdit = "true";
    document.documentElement.dataset.visualInspect = "true";
    if (params.has("mvpCharacter") || params.has("mvpDay")) {
      const assignment = document.querySelector("#assignment-screen");
      const main = document.querySelector("#main-screen");
      if (assignment) assignment.hidden = true;
      if (main) main.hidden = false;
    }
    applyAll();
    const shell = createEditor();
    TARGETS.forEach(item => {
      const element = document.querySelector(item.selector);
      if (element) element.dataset.visualEditTarget = item.key;
    });
    bindEditor(shell);
    updatePanel(shell);
    notify("화면 요소를 눌러 직접 옮겨보세요.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();

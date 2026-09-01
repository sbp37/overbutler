import { Storage } from "./storage-adapter.js";

window.OverbutlerStorage = Storage;
await Storage.init();

await import("./message-interpreter.js?v=local-interpreter-1");
await import("./chat-engine.js?v=local-interpreter-1");
await import("./app.js?v=cat-weekly-return-final");
await import("./cat-first-run-polish.js?v=1");
await import("./cat-conversation-memory.js?v=1");

/* saveState는 즉시 반환하고 Preferences 쓰기는 큐에서 뒤따라간다. 앱이 백그라운드로
   내려가거나 종료되는 순간이 그 틈과 겹치면 마지막 접수가 안 남을 수 있다.
   화면이 가려질 때 밀린 쓰기를 밀어낸다 — 플러그인 없이 웹 API만 쓴다. */
const flushPending = () => { Storage.flush?.().catch(() => {}); };
window.addEventListener("pagehide", flushPending);
document.addEventListener("visibilitychange", () => { if (document.hidden) flushPending(); });

window.dispatchEvent(new CustomEvent("overbutler:ready"));

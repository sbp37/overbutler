import { Storage } from "./storage-adapter.js";

window.OverbutlerStorage = Storage;
await Storage.init();

await import("./message-interpreter.js?v=local-interpreter-1");
await import("./chat-engine.js?v=local-interpreter-1");
await import("./app.js?v=cat-weekly-return-final");
await import("./cat-first-run-polish.js?v=1");
await import("./cat-conversation-memory.js?v=1");

window.dispatchEvent(new CustomEvent("overbutler:ready"));

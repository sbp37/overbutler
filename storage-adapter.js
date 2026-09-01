(function () {
  "use strict";

  const STORAGE_KEY = "butlermaker_v1";
  const PREVIOUS_STORAGE_KEY = "overbutler-v2-state";

  function storageArea() {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  function read(key) {
    try {
      return storageArea()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  window.OverbutlerStorage = Object.freeze({
    platform: "web",
    init: async () => {},
    loadState: () => read(STORAGE_KEY),
    loadLegacyState: () => read(PREVIOUS_STORAGE_KEY),
    saveState(serialized) {
      const storage = storageArea();
      if (!storage) throw new Error("Web storage is unavailable");
      storage.setItem(STORAGE_KEY, serialized);
      return true;
    },
    flush: async () => {}
  });
})();

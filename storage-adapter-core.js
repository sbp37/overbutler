const STORAGE_KEY = "butlermaker_v1";
const PREVIOUS_STORAGE_KEY = "overbutler-v2-state";
const MIGRATION_CANDIDATE_KEY = `${STORAGE_KEY}__migration_candidate`;

function localStorageArea() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readLocal(key) {
  try {
    return localStorageArea()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeLocal(key, value) {
  const storage = localStorageArea();
  if (!storage) throw new Error("Web storage is unavailable");
  storage.setItem(key, value);
}

/* 저장값이 「주인님 파일」로 읽힐 만한 모양인지만 본다. 내용 검사는 앱의
   normalizeState 몫이고, 여기서는 잘린 문자열·깨진 JSON을 걸러내는 게 목적이다. */
function isPlausibleState(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
    const keys = Object.keys(parsed);
    const hasKnownStateKey = [
      "schemaVersion", "onboarded", "character", "records", "achievements",
      "username", "ownerName", "butlerName", "chatMemory"
    ].some(key => Object.prototype.hasOwnProperty.call(parsed, key));
    if (keys.length && !hasKnownStateKey) return false;
    if (Object.prototype.hasOwnProperty.call(parsed, "records") && !Array.isArray(parsed.records)) return false;
    if (Object.prototype.hasOwnProperty.call(parsed, "achievements") && !Array.isArray(parsed.achievements)) return false;
    return true;
  } catch {
    return false;
  }
}

function isValidStateRoundtrip(value, expected) {
  return value === expected && isPlausibleState(value);
}

export function createWebStorageAdapter() {
  return Object.freeze({
    platform: "web",
    init: async () => {},
    loadState: () => readLocal(STORAGE_KEY),
    loadLegacyState: () => readLocal(PREVIOUS_STORAGE_KEY),
    saveState(serialized) {
      writeLocal(STORAGE_KEY, serialized);
      return true;
    },
    flush: async () => {}
  });
}

export function createNativeStorageAdapter(Preferences) {
  let initPromise = null;
  let mode = "pending";
  let cachedState = null;
  let cachedLegacyState = null;
  let flushQueue = Promise.resolve();
  let lastFlushError = null;

  async function removeMigrationWrite(key) {
    try {
      await Preferences.remove({ key });
    } catch {
      // The localStorage source remains untouched. A later launch can retry cleanup.
    }
  }

  async function migrateFromWeb(serialized) {
    await Preferences.set({ key: MIGRATION_CANDIDATE_KEY, value: serialized });
    const candidate = await Preferences.get({ key: MIGRATION_CANDIDATE_KEY });
    if (!isValidStateRoundtrip(candidate.value, serialized)) {
      await removeMigrationWrite(MIGRATION_CANDIDATE_KEY);
      return false;
    }

    await Preferences.set({ key: STORAGE_KEY, value: serialized });
    const roundtrip = await Preferences.get({ key: STORAGE_KEY });
    if (!isValidStateRoundtrip(roundtrip.value, serialized)) {
      await removeMigrationWrite(STORAGE_KEY);
      await removeMigrationWrite(MIGRATION_CANDIDATE_KEY);
      return false;
    }

    cachedState = roundtrip.value;
    await removeMigrationWrite(MIGRATION_CANDIDATE_KEY);
    return true;
  }

  async function initialize() {
    const webState = readLocal(STORAGE_KEY);
    const webLegacyState = readLocal(PREVIOUS_STORAGE_KEY);
    try {
      const nativeState = await Preferences.get({ key: STORAGE_KEY });
      if (nativeState.value !== null) {
        if (isPlausibleState(nativeState.value)) {
          cachedState = nativeState.value;
          mode = "native";
          return;
        }
        /* 손상된 native 값. 정리(remove)가 실패한 채 끝난 마이그레이션이 대표적인
           경로다. 이걸 그대로 진실로 삼으면 멀쩡한 localStorage 사본이 영영 가려져,
           지우지 않았어도 주인님 눈에는 파일이 사라진 것과 같다.
           온전한 사본이 있으면 그것으로 native를 덮어써서 복구를 시도한다. */
        if (webState !== null && isPlausibleState(webState) && await migrateFromWeb(webState)) {
          mode = "native";
          return;
        }
        cachedState = webState !== null ? webState : nativeState.value;
        cachedLegacyState = webLegacyState;
        mode = webState !== null ? "web-fallback" : "native";
        return;
      }

      if (webState !== null) {
        const migrated = await migrateFromWeb(webState);
        if (!migrated) {
          cachedState = webState;
          cachedLegacyState = webLegacyState;
          mode = "web-fallback";
          return;
        }
        mode = "native";
        return;
      }

      // A pre-v1 legacy value can still be normalized by the existing app code.
      // Its first normal save promotes it to the native current key.
      cachedLegacyState = webLegacyState;
      mode = "native";
    } catch {
      cachedState = webState;
      cachedLegacyState = webLegacyState;
      mode = "web-fallback";
    }
  }

  function init() {
    initPromise ||= initialize();
    return initPromise;
  }

  function saveNative(serialized) {
    cachedState = serialized;
    flushQueue = flushQueue
      .catch(() => {})
      .then(() => Preferences.set({ key: STORAGE_KEY, value: serialized }))
      .then(() => { lastFlushError = null; })
      .catch(error => { lastFlushError = error; });
    return true;
  }

  return Object.freeze({
    platform: "native",
    init,
    loadState() {
      if (mode === "pending") throw new Error("Storage.init() must complete before loadState()");
      return mode === "web-fallback" ? readLocal(STORAGE_KEY) : cachedState;
    },
    loadLegacyState() {
      if (mode === "pending") throw new Error("Storage.init() must complete before loadLegacyState()");
      return mode === "web-fallback" ? readLocal(PREVIOUS_STORAGE_KEY) : cachedLegacyState;
    },
    saveState(serialized) {
      if (mode === "pending") throw new Error("Storage.init() must complete before saveState()");
      if (mode === "web-fallback") {
        writeLocal(STORAGE_KEY, serialized);
        cachedState = serialized;
        return true;
      }
      return saveNative(serialized);
    },
    async flush() {
      await flushQueue;
      if (lastFlushError) throw lastFlushError;
    }
  });
}

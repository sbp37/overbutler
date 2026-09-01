/* StorageAdapter 계약 — 「어떤 실패 경로에서도 주인님 파일이 사라지지 않는다」.
   5·6번은 2026-09-02 리뷰에서 실제로 뚫렸던 경로다: 마이그레이션 정리(remove)가
   실패해 남은 손상된 native 값이, 지워지지도 않은 멀쩡한 localStorage 사본을
   영구히 가렸다. 데이터를 안 지웠어도 주인님 눈에는 파일이 사라진 것과 같다. */
import { createNativeStorageAdapter } from "../storage-adapter-core.js";
import assert from "node:assert/strict";

function mockPrefs(initial = {}, opts = {}) {
  const store = { ...initial };
  return {
    store,
    async get({ key }) { return { value: key in store ? store[key] : null }; },
    async set({ key, value }) {
      if (opts.corruptOnSet && key === opts.corruptOnSet) { store[key] = value.slice(0, 10); return; }
      store[key] = value;
    },
    async remove({ key }) {
      if (opts.removeFails) throw new Error("remove failed");
      delete store[key];
    }
  };
}
function fakeLocal(values) {
  globalThis.localStorage = {
    getItem: k => (k in values ? values[k] : null),
    setItem: (k, v) => { values[k] = v; }
  };
  return values;
}
const GOOD = JSON.stringify({ onboarded: true, character: "cat", records: [{ id: "a" }], username: "테스트" });

// 시나리오 1 — native 우선
{
  fakeLocal({ butlermaker_v1: JSON.stringify({ onboarded: true, records: [] }) });
  const a = createNativeStorageAdapter(mockPrefs({ butlermaker_v1: GOOD }));
  await a.init();
  assert.equal(a.loadState(), GOOD, "1) native 값이 localStorage보다 우선");
}
// 시나리오 2 — 정상 승계
{
  const local = fakeLocal({ butlermaker_v1: GOOD });
  const p = mockPrefs();
  const a = createNativeStorageAdapter(p);
  await a.init();
  assert.equal(a.loadState(), GOOD, "2) byte 그대로 승계");
  assert.equal(p.store.butlermaker_v1, GOOD);
  assert.equal(local.butlermaker_v1, GOOD, "2) 원본 보존");
  assert.ok(!("butlermaker_v1__migration_candidate" in p.store), "2) 후보키 정리됨");
}
// 시나리오 3 — roundtrip 실패 시 fallback
{
  const local = fakeLocal({ butlermaker_v1: GOOD });
  const p = mockPrefs({}, { corruptOnSet: "butlermaker_v1__migration_candidate" });
  const a = createNativeStorageAdapter(p);
  await a.init();
  assert.equal(a.loadState(), GOOD, "3) 검증 실패 시 localStorage fallback");
  assert.equal(local.butlermaker_v1, GOOD, "3) 원본 보존");
}
// 시나리오 4 — 연속 저장 순서
{
  fakeLocal({});
  const p = mockPrefs();
  const a = createNativeStorageAdapter(p);
  await a.init();
  for (const v of ["1", "2", "3"]) a.saveState(JSON.stringify({ onboarded: true, records: [], n: v }));
  await a.flush();
  assert.equal(JSON.parse(p.store.butlermaker_v1).n, "3", "4) 마지막 값이 최종");
}
console.log("  1~4) native 우선·byte 승계·검증 실패 fallback·쓰기 순서: PASS");

// ── 여기부터 내가 새로 넣은 공격 시나리오 ──
// 5 — 최종 키 쓰기가 깨지고 정리(remove)까지 실패하면? 다음 실행에서 어떻게 되나
{
  const local = fakeLocal({ butlermaker_v1: GOOD });
  const p = mockPrefs({}, { corruptOnSet: "butlermaker_v1", removeFails: true });
  const a1 = createNativeStorageAdapter(p);
  await a1.init();
  // 다음 실행 — 같은 Preferences, 같은 localStorage
  const a2 = createNativeStorageAdapter(p);
  await a2.init();
  const survived = a2.loadState() === GOOD;
  assert.ok(survived, "5) 손상된 native 값이 온전한 사본을 가려서는 안 된다");
  console.log("  5) 손상된 native가 온전한 사본을 가리지 않음: PASS");
}

// 6 — 손상이 일시적이었다면 다음 실행에서 native가 스스로 복구되어야 한다
{
  const local = fakeLocal({ butlermaker_v1: GOOD });
  const p = mockPrefs({ butlermaker_v1: '{"onboarde' });   // 이전 실행이 남긴 쓰레기
  const a = createNativeStorageAdapter(p);
  await a.init();
  assert.equal(a.loadState(), GOOD, "6) 온전한 사본으로 읽힌다");
  assert.equal(p.store.butlermaker_v1, GOOD, "6) native도 온전한 값으로 복구된다");
  assert.equal(local.butlermaker_v1, GOOD, "6) 원본은 그대로");
  a.saveState(JSON.stringify({ onboarded: true, records: [], n: "after" }));
  await a.flush();
  assert.equal(JSON.parse(p.store.butlermaker_v1).n, "after", "6) 복구 후 저장은 native로 간다");
  console.log("  6) 일시적 손상 자가 복구: PASS");
}
console.log("storage-adapter: all scenarios passed");

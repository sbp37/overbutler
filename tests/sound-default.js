/* 사운드 기본값 계약 — 「기본은 켜짐, 직접 끈 선택은 존중」.

   2026-09-02에 기본값을 꺼짐→켜짐으로 뒤집었다(사유는 docs/NEXT-CODEX.md).
   뒤집으면서 지켜야 할 것이 네 가지 생겼고, 넷 다 여기서 잰다:

   1. 저장된 값이 없는 파일은 켜진 채로 시작한다.
   2. 명시적으로 저장된 false는 그대로 꺼진 채다 — 껐다가 새로고침했더니
      다시 켜져 있으면 사용자의 선택을 앱이 뒤집은 것이다.
   3. 켜져 있으면 화면을 처음 만지는 그 제스처 안에서 AudioContext가 열린다.
      자동재생 정책은 제스처 안에서 열렸는지만 보므로, 첫 터치를 놓치면 첫 소리를 놓친다.
   4. 꺼져 있으면 AudioContext를 아예 만들지 않는다(LOCKED · docs/CURRENT.md SOUND 행).

   fixture(브라우저 하네스)가 아니라 여기 있는 이유: AudioContext 생성 시점은
   실제 페이지에서 사용자 제스처를 흉내내야 잴 수 있다.

   실행: node tests/sound-default.js [base-url]
   기본 http://127.0.0.1:8210 — 로컬 서버가 떠 있어야 한다.
   playwright가 전역에만 있으면 NODE_PATH를 준다(ESM은 NODE_PATH를 안 보므로 CJS다).
*/
"use strict";
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:8210";
const SEED = extra => Object.assign({
  onboarded: true, username: "테스트", character: "cat", butlerName: "치즈냥",
  ownedButlers: ["cat"], records: [], briefings: [],
  diary: [], journalEntries: [], certificates: [], giftHistory: []
}, extra);

const failures = [];
const check = (ok, message) => { if (ok) console.log(`  ok  ${message}`); else failures.push(message); };

let browser = null;

/* 케이스마다 컨텍스트를 새로 판다. 같은 컨텍스트를 재사용하면 앞 케이스의
   localStorage가 다음 케이스로 새어 들어간다 — 이 테스트를 쓰면서 실제로,
   "새 파일"이 앞 케이스의 soundOn:false를 읽어 통과해버리는 사고가 났다. */
async function openPage(seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route(/googleapis|jsdelivr|gstatic/, route => route.abort());
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__audioContextCount = 0;
    const Real = window.AudioContext || window.webkitAudioContext;
    if (!Real) return;
    function Counted(...args) { window.__audioContextCount += 1; return new Real(...args); }
    Counted.prototype = Real.prototype;
    window.AudioContext = Counted;
    window.webkitAudioContext = Counted;
  });
  /* 이미 값이 있으면 덮지 않는다 — addInitScript는 reload에도 다시 도므로,
     덮어쓰면 "껐다가 새로고침" 왕복 검사가 자기 씨앗에 지워진다. */
  if (seed) {
    await page.addInitScript(value => {
      if (!localStorage.getItem("butlermaker_v1")) localStorage.setItem("butlermaker_v1", JSON.stringify(value));
    }, seed);
  }
  await page.goto(`${BASE}/index.html?fixture-no-overlay-observer=1`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  return page;
}

async function main() {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  });

  // A. 저장된 값이 없는 파일 — 켜진 채로 시작한다.
  {
    const page = await openPage(SEED({}));
    const seen = await page.evaluate(() => ({
      checked: document.querySelector("#sound-toggle").checked,
      normalized: window.OVERBUTLER_APP.migrateState({}).soundOn
    }));
    check(seen.checked === true, `A 저장값 없음 → 토글이 켜져 있다 (checked=${seen.checked})`);
    check(seen.normalized === true, `A normalizeState({}) → soundOn=true (${seen.normalized})`);
    await page.context().close();
  }

  // B. 직접 꺼둔 파일 — 그대로 꺼져 있다.
  {
    const page = await openPage(SEED({ soundOn: false }));
    const seen = await page.evaluate(() => ({
      checked: document.querySelector("#sound-toggle").checked,
      normalized: window.OVERBUTLER_APP.migrateState({ soundOn: false }).soundOn
    }));
    check(seen.checked === false, `B soundOn:false 저장 → 토글이 꺼져 있다 (checked=${seen.checked})`);
    check(seen.normalized === false, `B normalizeState({soundOn:false}) → false (${seen.normalized})`);
    await page.context().close();
  }

  // C. 껐다가 새로고침 — 꺼진 채로 남는다(왕복).
  {
    const page = await openPage(SEED({}));
    await page.click("[data-view='butler']").catch(() => {});
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      const toggle = document.querySelector("#sound-toggle");
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(200);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("butlermaker_v1")).soundOn);
    check(stored === false, `C 끄면 false가 저장된다 (${stored})`);
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => document.querySelector("#sound-toggle").checked);
    check(after === false, `C 새로고침해도 꺼진 채다 (checked=${after})`);
    await page.context().close();
  }

  // D. 켜져 있으면, 화면 아무 데나 처음 만지는 제스처 안에서 오디오가 열린다.
  {
    const page = await openPage(SEED({}));
    const before = await page.evaluate(() => window.__audioContextCount);
    check(before === 0, `D 로드만으로는 오디오를 열지 않는다 (${before})`);
    await page.mouse.click(195, 300);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => window.__audioContextCount);
    check(after >= 1, `D 첫 터치에 AudioContext가 열린다 (${after})`);
    await page.context().close();
  }

  // E. 꺼져 있으면 무엇을 만지든 오디오를 만들지 않는다(LOCKED).
  {
    const page = await openPage(SEED({ soundOn: false }));
    await page.mouse.click(195, 300);
    await page.waitForTimeout(200);
    await page.click("[data-view='butler']").catch(() => {});
    await page.waitForTimeout(300);
    const count = await page.evaluate(() => window.__audioContextCount);
    check(count === 0, `E 꺼져 있으면 AudioContext를 만들지 않는다 (${count})`);
    await page.context().close();
  }

  // F. 아직 온보딩도 안 한 완전 새 파일 — 저장되는 첫 값부터 켜짐이다.
  {
    const page = await openPage(null);
    const errors = [];
    page.on("pageerror", error => errors.push(String(error).split("\n")[0]));
    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem("butlermaker_v1");
      return raw ? JSON.parse(raw).soundOn : null;
    });
    check(stored !== false, `F 온보딩 전 새 파일의 저장값이 꺼짐이 아니다 (${stored})`);
    check(errors.length === 0, `F 페이지 오류 없음 (${errors[0] || ""})`);
    await page.context().close();
  }

  await browser.close();
  if (failures.length) {
    failures.forEach(message => console.error(`FAIL ${message}`));
    process.exit(1);
  }
  console.log("sound-default: 기본 켜짐 · 명시적 꺼짐 존중 · 첫 제스처에 오디오 개방 · 꺼짐이면 미개방");
}

main().catch(error => { console.error(error); process.exit(1); });

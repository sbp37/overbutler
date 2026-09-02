/* 뺄셈 라운드 계약 — 「감춘 것은 조건 뒤에 다시 나타나고, 코드는 남아 있다」.

   docs/SUBTRACTION-2026-09-02.md의 딱지(핵심 노출 / 조건부 노출 / 뒤로 이동 / 삭제 후보)를
   실제 브라우저에서 잰다. 눈이 아니라 getBoundingClientRect로.

   성공 기준 하나: 처음 온 사람도 10일 쓴 사람도 홈에서 해야 할 행동이 하나로 보인다.
   여기서는 그 기준을 탭별로 쪼개 계약으로 만든다.

   실행: node tests/subtraction-surfaces.js [base-url]
   기본 http://127.0.0.1:8210 — 로컬 서버가 떠 있어야 한다. CJS(NODE_PATH).
*/
"use strict";
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:8210";
const iso = date => date.toISOString().slice(0, 10);
const record = (index, daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: `r${index}`, deed: ["침대에서 일어남", "물 한 잔 마심", "씻음", "답장 보냄", "산책함"][index % 5],
    story: "오늘 일어나서 물 마셨어", title: "기상 대업", grade: "국가적 성취",
    report: "침대에서 일어남 확인했다냥.", date: iso(date), createdAt: date.toISOString(),
    character: "cat", butler: { character: "cat", name: "치즈냥" }, points: 10
  };
};
const BASE_STATE = {
  onboarded: true, username: "테스트", character: "cat", butlerName: "치즈냥",
  ownedButlers: ["cat"], briefings: [], diary: [], journalEntries: [], certificates: [], giftHistory: []
};
const STATES = {
  "D1 기록 0": { ...BASE_STATE, records: [] },
  "D1 기록 1": { ...BASE_STATE, records: [record(0, 0)] },
  "D10 기록 10": { ...BASE_STATE, records: Array.from({ length: 10 }, (_, i) => record(i, 9 - i)) }
};

const failures = [];
const check = (ok, message) => { if (ok) console.log(`  ok  ${message}`); else failures.push(message); };

let browser = null;
async function openState(seed, view) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route(/googleapis|jsdelivr|gstatic/, route => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(String(error).split("\n")[0]));
  await page.addInitScript(value => localStorage.setItem("butlermaker_v1", JSON.stringify(value)), seed);
  await page.goto(`${BASE}/index.html?fixture-no-overlay-observer=1`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  if (view !== "home") {
    await page.click(`.bottom-nav [data-view='${view}']`);
    await page.waitForTimeout(500);
  }
  return { page, errors, close: () => context.close() };
}

/* 페이지 안에서 쓰는 가시성 판정. 닫힌 <details> 안의 요소는 Chromium이
   rect를 돌려주지만 그리지는 않으므로 보이지 않는 것으로 친다. */
const probe = `
  const visible = el => {
    if (!el || el.hidden || el.closest("[hidden]") || el.closest("details:not([open])") && !el.matches("summary") && !el.closest("summary")) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };
  const box = selector => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { exists: true, visible: visible(el), top: Math.round(rect.top + scrollY), bottom: Math.round(rect.bottom + scrollY) };
  };
`;

async function managerContract(label, seed) {
  const { page, errors, close } = await openState(seed, "manager");
  const seen = await page.evaluate(`(() => { ${probe}
    return {
      height: document.documentElement.scrollHeight,
      recruit: box("#recruit-note"), roster: box(".butler-roster-card"), work: box(".manager-work-card"),
      gift: box("#give-gift-button"), change: box("#manager-change-button"),
      settings: box(".office-settings"), footer: box(".app-information"),
      memoryClear: box(".cat-memory-clear"), memoryFold: box(".cat-memory-fold summary"),
      card: box(".personnel-card"), relationship: box(".manager-obsession")
    };
  })()`);
  console.log(`\n[집사 · ${label}] 높이 ${seen.height}`);
  check(errors.length === 0, `페이지 오류 없음 ${errors[0] || ""}`);
  // 핵심 노출
  check(seen.card?.visible, "집사 카드가 보인다");
  check(seen.relationship?.visible, "관계 결재란이 보인다");
  check(seen.settings?.visible, "사무국 설정이 보인다");
  // 조건부 노출 — 다중 캐릭터 판매 전까지 플래그 뒤. DOM은 남아 있어야 한다(되돌릴 수 있게).
  for (const [name, item] of [["신규 지원서", seen.recruit], ["집사 목록", seen.roster], ["근무 기록 카드", seen.work]]) {
    check(item?.exists, `${name} DOM은 남아 있다 (플래그로 되돌릴 수 있다)`);
    check(item && !item.visible, `${name}은 화면에 없다`);
  }
  // 선물 — 첫 기록 뒤부터. 0건 비활성 카드는 없다.
  const hasRecord = seed.records.length > 0;
  check(seen.gift?.visible === hasRecord, hasRecord ? "첫 기록 뒤에는 선물 카드가 열린다" : "기록 0건에는 선물 카드가 없다(비활성 카드도 없다)");
  // 뒤로 이동 — 담당·대기 발령 관리는 설정 아래 조용한 줄. 대화 기억은 접힘 하나.
  check(seen.change?.visible, "담당·대기 발령 관리는 여전히 닿을 수 있다");
  check(seen.change && seen.settings && seen.change.top >= seen.settings.bottom, "담당·대기 발령 관리는 사무국 설정 아래에 있다");
  check(seen.footer && seen.change && seen.footer.top >= seen.change.bottom, "앱 정보 footer가 맨 아래다");
  check(seen.memoryFold?.visible && !seen.memoryClear?.visible, "대화 기억은 접혀 있고 「기억 비우기」는 펼쳐야 보인다");
  // 높이 — 뺄셈 전 1,916. 다시 자라면 여기서 걸린다.
  check(seen.height <= 1300, `집사 탭 높이 ${seen.height} ≤ 1300 (뺄셈 전 1,916)`);
  await close();
  return seen.height;
}

async function main() {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  });
  const heights = {};
  for (const [label, seed] of Object.entries(STATES)) heights[label] = await managerContract(label, seed);
  await browser.close();

  console.log("");
  Object.entries(heights).forEach(([label, height]) => console.log(`  집사 탭 ${label}: ${height}px`));
  if (failures.length) {
    failures.forEach(message => console.error(`FAIL ${message}`));
    process.exit(1);
  }
  console.log("subtraction-surfaces: 집사 탭 계약 통과");
}

main().catch(error => { console.error(error); process.exit(1); });

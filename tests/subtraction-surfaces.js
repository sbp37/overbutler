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

/* 홈 — 해야 할 행동이 하나로 보인다. 어떤 상태에서도 보이는 조작 요소의 집합이 같고,
   그 안의 주 행동은 접수 버튼 하나다. 도장 n/5·과몰입 심사·빈 브리핑 카드는 없다. */
async function homeContract(label, seed) {
  const { page, errors, close } = await openState(seed, "home");
  const seen = await page.evaluate(`(() => { ${probe}
    const controls = [...document.querySelectorAll("#view-home button, #view-home a, #view-home input, #view-home textarea")]
      .filter(el => visible(el) && !el.closest(".bottom-nav") && !el.closest("#cat-home-world"))
      .map(el => el.id || el.className.split(" ")[0] || el.tagName)
      .filter(name => name !== "diary-open-note");
    return {
      height: document.documentElement.scrollHeight,
      controls: [...new Set(controls)].sort(),
      footnote: box(".entry-footnote"), formNote: box(".form-note"), stampCount: box("#stamp-count"),
      briefing: box("#daily-briefing"), briefingAdd: box("#daily-briefing-add"), memo: box("#daily-briefing-memo"),
      report: box("#report-button"), input: box("#achievement-input")
    };
  })()`);
  console.log(`\n[홈 · ${label}] 높이 ${seen.height} · 조작 요소 ${seen.controls.length}개`);
  check(errors.length === 0, `페이지 오류 없음 ${errors[0] || ""}`);
  check(seen.report?.visible && seen.input?.visible, "이야기 입력과 접수 버튼이 보인다");
  check(seen.footnote && !seen.footnote.visible, "도장 진행도 카드(n/5)는 홈에 없다");
  check(seen.formNote && !seen.formNote.visible, "도장 규칙 각주는 홈에 없다");
  check(seen.stampCount?.exists, "도장 진행도 DOM은 남아 있다(파일 표지가 같은 값을 쓴다)");
  const hasSchedule = (seed.briefings || []).length > 0;
  if (hasSchedule) {
    check(seen.briefing?.visible && seen.memo?.visible, "일정이 있으면 메모 한 줄이 보인다");
    check(seen.briefingAdd && !seen.briefingAdd.visible, "메모 상태에서는 「+ 일정 적기」가 없다(펼쳐야 나온다)");
  } else {
    check(seen.briefing && !seen.briefing.visible, "일정이 없으면 브리핑은 홈에 아예 없다");
  }
  await close();
  return seen;
}

async function memoRoundTrip(seed) {
  const { page, close } = await openState(seed, "home");
  const read = () => page.evaluate(`(() => { ${probe}
    return { memo: box("#daily-briefing-memo")?.visible, add: box("#daily-briefing-add")?.visible, list: box(".daily-briefing-item")?.visible, toggle: box("#daily-briefing-toggle")?.visible };
  })()`);
  const before = await read();
  await page.click("#daily-briefing-memo");
  await page.waitForTimeout(200);
  const opened = await read();
  await page.click("#daily-briefing-toggle");
  await page.waitForTimeout(200);
  const closed = await read();
  console.log("\n[홈 · 메모 왕복]");
  check(before.memo && !before.list, "처음엔 메모만");
  check(!opened.memo && opened.list && opened.add, "메모를 누르면 카드가 펼쳐지고 목록·「+ 일정 적기」가 나온다");
  check(closed.memo && !closed.list, "「목록 접기」로 다시 메모 한 줄");
  await close();
}

/* 결과서 — 칭호 + 대업 + 치즈냥 한마디가 주인공. 지표 세 칸(NO. · 판정 · n/5)은 없고,
   관계 줄에는 숫자가 없다. 첫 기록에는 증서 버튼이 없다(LOCKED · 5건). */
async function resultContract() {
  const { page, errors, close } = await openState(STATES["D1 기록 0"], "home");
  await page.fill("#achievement-input", "씻었어");
  await page.click("#report-button");
  await page.waitForSelector("#praise-result-overlay:not([hidden])", { timeout: 8000 });
  await page.waitForTimeout(400);
  const seen = await page.evaluate(`(() => { ${probe}
    const doc = document.querySelector(".praise-result-document");
    return {
      title: box("#result-title"), deed: box("#result-deed"), report: box("#result-report"), stamp: box("#result-stamp"),
      metrics: box(".praise-result-metrics"), share: box("#result-share"), closeButton: box("#result-close"),
      certificate: box("#result-certificate-button"),
      kicker: document.querySelector("#result-relationship-kicker")?.textContent.trim() || "",
      percentDisplay: getComputedStyle(document.querySelector("#analysis-percent")).display,
      height: doc ? Math.round(doc.getBoundingClientRect().height) : 0
    };
  })()`);
  console.log(`\n[결과서 · 첫 기록] 문서 높이 ${seen.height} · 관계 줄 「${seen.kicker}」`);
  check(errors.length === 0, `페이지 오류 없음 ${errors[0] || ""}`);
  check(seen.title?.visible && seen.deed?.visible && seen.report?.visible && seen.stamp?.visible, "칭호 · 대업 · 한마디 · 도장이 보인다");
  check(seen.metrics?.exists && !seen.metrics.visible, "지표 세 칸(NO. · 판정 · n/5)은 결과서에 없다(DOM은 남는다)");
  check(!/\d/.test(seen.kicker), "관계 줄에 숫자가 없다");
  check(seen.share?.visible && seen.closeButton?.visible, "내보내기와 돌아가기는 그대로다");
  check(seen.certificate && !seen.certificate.visible, "첫 기록에는 증서 버튼이 없다(5건 LOCKED)");
  check(seen.percentDisplay === "none", "심사표의 % 숫자는 없다(막대만)");
  await close();
  return seen.height;
}

async function main() {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  });
  const heights = {};
  for (const [label, seed] of Object.entries(STATES)) heights[label] = await managerContract(label, seed);

  const homes = {};
  for (const [label, seed] of Object.entries(STATES)) homes[label] = await homeContract(label, seed);
  const todayKey = iso(new Date());
  const scheduled = { ...STATES["D1 기록 1"], briefings: [
    { id: "b1", date: todayKey, title: "치과 예약", time: "14:00", completed: false, completedAt: null, askAfter: false, createdAt: new Date().toISOString() }
  ] };
  homes["D1 일정 1"] = await homeContract("D1 일정 1", scheduled);
  await memoRoundTrip(scheduled);
  const resultHeight = await resultContract();

  // 성공 기준 — 기록 0건·1건·10건의 홈에서 보이는 조작 요소 집합이 같다.
  const sets = Object.entries(homes).filter(([label]) => !label.includes("일정")).map(([label, seen]) => [label, seen.controls.join(",")]);
  const distinct = new Set(sets.map(([, key]) => key));
  console.log("\n[홈 · 성공 기준]");
  sets.forEach(([label, key]) => console.log(`  ${label}: ${key}`));
  check(distinct.size === 1, "처음 온 사람도 10일 쓴 사람도 홈에서 보이는 조작 요소가 같다");
  const first = homes["D1 기록 0"].height;
  Object.entries(homes).forEach(([label, seen]) => {
    if (label.includes("일정")) return;
    check(Math.abs(seen.height - first) <= 80, `${label} 홈 높이 ${seen.height} ≈ 기록 0건 ${first} (±80, 인사말 길이 차)`);
  });

  await browser.close();

  console.log("");
  Object.entries(heights).forEach(([label, height]) => console.log(`  집사 탭 ${label}: ${height}px`));
  Object.entries(homes).forEach(([label, seen]) => console.log(`  홈 ${label}: ${seen.height}px`));
  console.log(`  결과서 문서: ${resultHeight}px`);
  if (failures.length) {
    failures.forEach(message => console.error(`FAIL ${message}`));
    process.exit(1);
  }
  console.log("subtraction-surfaces: 집사 탭·홈·결과서 계약 통과");
}

main().catch(error => { console.error(error); process.exit(1); });

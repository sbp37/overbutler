/* 첫 화면 뷰포트 계약 — 「첫 접수 버튼이 스크롤 없이 보인다」.

   회귀 fixture(cat-home-first-screen.html)의 iframe은 hidden이라 레이아웃이 없어서
   getBoundingClientRect()가 전부 0이다. 그래서 저쪽은 "접힘을 만드는 구조"만 지키고,
   진짜 계약인 픽셀은 여기서 실제 브라우저 뷰포트로 잰다.

   픽셀값은 하드코딩하지 않는다 — 폰트·기기에 따라 움직이는 숫자를 계약으로 박으면
   멀쩡한 화면이 떨어진다. 지키는 것은 하나다: 접수 버튼이 하단 네비를 침범하지 않는다.

   첫 만남 인사는 5줄 풀에서 무작위로 뽑히고 제일 긴 줄은 360px에서 세 줄을 차지한다.
   말풍선 높이가 그만큼 달라져 여유가 흔들리므로, 한 번이 아니라 여러 번 띄워
   **제일 나쁜 경우**를 계약으로 삼는다.

   실행: node tests/viewport-first-screen.js [base-url]
   기본 http://127.0.0.1:8210 — 로컬 서버가 떠 있어야 한다.
   playwright가 전역에만 있으면 NODE_PATH를 준다(ESM은 NODE_PATH를 안 보므로 CJS다).
*/
"use strict";
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:8210";
const WIDTHS = [360, 390, 430];
const SAMPLES = 8;
const SEED = {
  onboarded: true, username: "테스트", character: "cat", butlerName: "치즈냥",
  ownedButlers: ["cat"], records: [], briefings: [],
  diary: [], journalEntries: [], certificates: [], giftHistory: []
};

function readLayout(page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    const foldTop = nav ? nav.getBoundingClientRect().top : window.innerHeight;
    const box = selector => {
      const element = document.querySelector(selector);
      if (!element || element.hidden || element.offsetParent === null) return null;
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
    };
    return {
      firstRun: document.documentElement.hasAttribute("data-home-first-run"),
      foldTop: Math.round(foldTop),
      input: box("#achievement-input"),
      button: box("#report-button"),
      scrolled: Math.round(window.scrollY),
      greeting: (document.querySelector("#cat-home-speech-text")?.textContent || "").replace(/\s+/g, " ").trim()
    };
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
  });
  const failures = [];
  const rows = [];

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    // 폰트 CDN은 이 환경에서 막혀 있다. 막힌 채로 재는 편이 보수적이다.
    await context.route(/googleapis|jsdelivr|gstatic/, route => route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(String(error).split("\n")[0]));
    await page.addInitScript(seed => localStorage.setItem("butlermaker_v1", JSON.stringify(seed)), SEED);
    await page.goto(`${BASE}/index.html?fixture-no-overlay-observer=1`, { waitUntil: "load" });
    await page.waitForTimeout(700);

    let worst = null;
    let worstSlack = Infinity;
    for (let sample = 0; sample < SAMPLES; sample += 1) {
      if (sample) {
        await page.reload({ waitUntil: "load" });
        await page.waitForTimeout(600);
      }
      const layout = await readLayout(page);
      const slack = layout.button ? layout.foldTop - layout.button.bottom : -Infinity;
      if (slack < worstSlack) { worstSlack = slack; worst = layout; }
    }

    const check = (condition, message) => { if (!condition) failures.push(`${width}px · ${message}`); };
    check(worst.firstRun, "an empty CAT file should open the first-screen home");
    check(Boolean(worst.input), "the story input should be rendered");
    check(Boolean(worst.button), "the submit button should be rendered");
    check(worst.scrolled === 0, "the first screen should not need scrolling to start");
    if (worst.input) check(worst.input.bottom <= worst.foldTop, `story input runs under the navigation (${worst.input.bottom} > ${worst.foldTop})`);
    if (worst.button) check(worst.button.bottom <= worst.foldTop, `submit button runs under the navigation (${worst.button.bottom} > ${worst.foldTop})`);
    check(errors.length === 0, `page errors: ${errors[0] || ""}`);

    rows.push({
      width,
      fold: worst.foldTop,
      input: worst.input ? `${worst.input.top}→${worst.input.bottom}` : "없음",
      button: worst.button ? `${worst.button.top}→${worst.button.bottom}` : "없음",
      slack: worstSlack,
      greeting: worst.greeting.slice(0, 26)
    });
    await context.close();
  }

  await browser.close();

  for (const row of rows) {
    console.log(`  ${row.width}px  네비 ${row.fold} | 입력 ${row.input} | 버튼 ${row.button} | 최악 여유 ${row.slack}px  ← "${row.greeting}…"`);
  }
  if (failures.length) {
    failures.forEach(message => console.error(`FAIL ${message}`));
    process.exit(1);
  }
  console.log(`viewport-first-screen: submit button stays above the navigation at ${WIDTHS.join("/")}px (worst of ${SAMPLES} greetings)`);
}

main().catch(error => { console.error(error); process.exit(1); });

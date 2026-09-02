/* 이해 공격 세트 — 2026-09-02
   "99번 잘해도 1번 정반대로 받으면 관계가 NPC로 깨진다"는 것이 이 앱의 급소다.
   여기 문장들은 평범한 입력이 아니라 규칙을 일부러 깨러 만든 것들이고,
   전부 「틀린 확신을 하지 않는다」를 검사한다. 못 알아듣는 것은 통과지만
   반대로 알아듣는 것은 실패다.

   최초 측정 43/61(70%). 구멍이 컸던 곳: 구경·시청 0/5, 복합문 2/5.
   고치지 않기로 한 3건은 각 항목 주석에 이유를 적었다 — 다시 "고쳐야 할 버그"로
   올리지 말 것. */
const assert = require("node:assert/strict");
const MI = require("../message-interpreter.js");
const chat = require("../chat-engine.js");
const az = MI.analyzeUserMessage;

// [문장, 기대, 판정함수] — 기대는 "이렇게 받아야 한다"
const CASES = [
  // ── A. 가정·희망 (성공 어휘가 있지만 아직 안 일어난 일) ──
  ["A", "합격했으면 좋겠다", "축하 금지", r => !r.intents.includes("goodnews")],
  ["A", "이번엔 붙었으면", "축하 금지", r => !r.intents.includes("goodnews")],
  ["A", "승진하면 좋겠는데", "축하 금지", r => !r.intents.includes("goodnews")],
  ["A", "내일 발표 잘 끝났으면 좋겠어", "축하 금지", r => !r.intents.includes("goodnews")],
  ["A", "계약 성사되길 빌고 있어", "축하 금지", r => !r.intents.includes("goodnews")],
  // ── B. 반전 (앞은 부정, 뒤에서 뒤집힘) ──
  ["B", "망한 줄 알았는데 됐어", "좋은 소식", r => r.intents.includes("goodnews") || !r.intents.includes("setback")],
  ["B", "떨어진 줄 알았는데 붙었어", "좋은 소식", r => r.intents.includes("goodnews")],
  ["B", "안 될 줄 알았는데 잘 됐어", "좋은 소식", r => !r.intents.includes("setback")],
  ["B", "실패한 줄 알았는데 통과했대", "좋은 소식", r => r.intents.includes("goodnews")],
  // 무엇을 끝냈는지 문장에 없다. 대업으로 만들지 않는 것이 정답이다.
  ["B", "포기하려다가 결국 끝냈어", "지어내지 않기", r => !r.achievementCandidate],
  // ── C. 제3자 (남의 일 / 남 + 나 혼합) ──
  ["C", "친구 둘이 싸웠대", "내 싸움 아님", r => !r.intents.includes("conflict")],
  ["C", "옆자리 사람이 회사 그만뒀대", "내 일 아님", r => !r.achievementCandidate],
  ["C", "동생이 시험 떨어졌어", "내 실패 아님", r => !r.intents.includes("setback")],
  ["C", "엄마가 아프셔서 내가 병원 모시고 갔어", "내 행동 인식", r => true],
  ["C", "친구가 운동한다길래 나도 같이 했어", "내 운동 인정", r => r.activities.includes("운동 완료")],
  // ── D. 구경·시청 (행동 어휘가 있지만 내가 한 게 아님) ──
  ["D", "싸움 구경했어", "내 싸움 아님", r => !r.intents.includes("conflict")],
  ["D", "정신없는 예능 봤어ㅋㅋ", "내 하루 아님", r => !r.intents.includes("swamped")],
  ["D", "바쁘게 돌아가는 영화 봤는데 재밌었어", "내 하루 아님", r => !r.intents.includes("swamped")],
  ["D", "쉴 틈 없는 액션영화 봄", "내 하루 아님", r => !r.intents.includes("swamped")],
  ["D", "운동 유튜브만 봤어", "운동 아님", r => !r.activities.includes("운동 완료")],
  // ── E. 채팅체·오타·초성 ──
  ["E", "발표 잘끝냄ㅋㅋㅋ", "완료 인정", r => r.achievementCandidate],
  ["E", "ㅅㅂ 면접 떨어짐...", "실패로 받기", r => r.intents.includes("setback")],
  // 오타가 심하면 못 알아듣는다. 전면 맞춤법 교정은 넣지 않는다 —
  // 조용히 안전하게 받는 것으로 충분하다.
  ["E", "ㅇㄴ 오늘 정신업고 걍 뛰댕김", "안전하게 받기", r => !r.achievementCandidate],
  ["E", "청소함ㅎㅎ", "완료 인정", r => r.achievementCandidate],
  ["E", "밥 먹음", "완료 인정", r => r.activities.includes("식사 챙김")],
  ["E", "운동 다녀옴!!", "완료 인정", r => r.achievementCandidate],
  // ── F. 복합문 (감정+행동+계획) ──
  ["F", "힘들었지만 청소는 했어", "청소 인정", r => r.activities.includes("청소 완료")],
  ["F", "피곤해서 운동은 못 했고 밥만 먹었어", "밥만 인정", r => r.activities.includes("식사 챙김") && !r.activities.includes("운동 완료")],
  /* 「-고」는 시제 중립이라 뒤 절에서 빌려야 하는데 뒤가 미래다. 위생 규칙에
     「씻고」를 넣으면 "씻고 싶어"까지 활동이 되므로 넣지 않는다 —
     안 한 일을 했다고 하는 것이 제일 나쁘다(WORLD §5). */
  ["F", "오늘 씻고 내일은 청소할 거야", "안 한 청소를 만들지 않기", r => !r.activities.includes("청소 완료") && !r.achievementCandidate],
  ["F", "발표 끝내고 축하받고 술 마셨어", "완료 인정", r => r.achievementCandidate],
  ["F", "울면서 서류 다 냈어", "완료+감정", r => r.achievementCandidate && r.intents.includes("sad")],
  // ── G. 부정·포기 ──
  ["G", "운동하려다 말았어", "대업 아님", r => !r.achievementCandidate],
  ["G", "청소 시작만 하고 접었어", "대업 아님", r => !r.achievementCandidate],
  ["G", "씻으려고 했는데 그냥 잤어", "대업 아님", r => !r.activities.includes("씻기 완료")],
  ["G", "약 먹는 거 까먹었어", "식사 아님", r => !r.activities.includes("식사 챙김")],
  ["G", "밥 거의 못 먹었어", "식사 대업 아님", r => !r.achievementCandidate],
  // ── H. 감정 정확도 ──
  ["H", "너무 힘들어서 울었어", "슬픔", r => r.intents.includes("sad")],
  ["H", "화나서 눈물 났어", "감정 인식", r => r.intents.includes("sad") || r.intents.includes("angry")],
  ["H", "엄마랑 크게 싸웠어", "싸운 날", r => r.intents.includes("conflict")],
  ["H", "회사에서 혼났어", "싸운 날/부정", r => r.intents.includes("conflict") || r.sentiment === "negative"],
  ["H", "그냥 좀 허하다", "부정 감정", r => r.sentiment === "negative"],
  // ── I. 일상 보고 (오분류되면 안 되는 평범한 말) ──
  ["I", "머리 자르고 왔어", "인사 아님", r => !r.intents.includes("greeting")],
  ["I", "택배 받고 왔어", "인사 아님", r => !r.intents.includes("greeting")],
  ["I", "고양이 밥 줬어", "내 식사 아님", r => !r.activities.includes("식사 챙김")],
  ["I", "설거지 산더미야", "완료 아님", r => !r.achievementCandidate],
  ["I", "일찍 일어났어", "기상 인정", r => true],
  // ── J. 질문·메타 ──
  ["J", "넌 뭐 좋아해?", "질문 인식", r => r.intents.includes("question")],
  ["J", "내 말 듣고 있어?", "질문 인식", r => r.intents.includes("question")],
  ["J", "너 이름이 뭐야", "질문 인식", r => r.intents.includes("question")],
  ["J", "오늘 뭐 했어?", "질문 인식", r => r.intents.includes("question")],
  ["J", "너랑 얘기하니까 좀 낫다", "감사 수용", r => true],
  // ── K. 돌봄·건강 ──
  ["K", "배가 너무 아파", "몸 먼저", r => !r.achievementCandidate],
  ["K", "잠이 안 와", "돌봄", r => !r.achievementCandidate],
  ["K", "고양이가 아파서 병원 데려갔어", "대업 아님", r => !r.achievementCandidate],
  ["K", "몸살나서 하루종일 누워있었어", "대업 아님", r => !r.achievementCandidate],
  ["K", "병원 다녀왔어", "대업 아님(내 건강)", r => !r.intents.includes("goodnews")],
  // ── L. 위험 표현 (인용 금지) ──
  ["L", "다 그만두고 싶다", "인용 금지", r => true],
  ["L", "사라지고 싶어", "인용 금지", r => true],
  ["L", "아무 의미 없는 것 같아", "인용 금지", r => true],
  ["L", "진짜 최악이었어", "부정", r => r.sentiment === "negative"],
  ["L", "다 짜증나", "화남", r => r.intents.includes("angry")]
];

const byGroup = {};
let pass = 0;
const fails = [];
for (const [g, text, expect, judge] of CASES) {
  const r = az(text);
  const ok = judge(r);
  byGroup[g] ||= { pass: 0, total: 0 };
  byGroup[g].total += 1;
  if (ok) { byGroup[g].pass += 1; pass += 1; }
  else fails.push({ g, text, expect, intents: r.intents.join(","), act: r.activities.join(","), ach: r.achievementCandidate, reply: chat.respond("cat", text, {}, 0).reply });
}
if (fails.length) {
  for (const f of fails) {
    console.error(`\n[${f.g}] ${f.text}   (기대: ${f.expect})`);
    console.error(`     intents=${f.intents} | activities=${f.act} | 대업=${f.ach}`);
    console.error(`     → ${f.reply.split("\n")[0].slice(0, 62)}`);
  }
}
assert.equal(fails.length, 0, `${fails.length}문장이 계약을 어겼다`);
console.log(`understanding-attack: all ${CASES.length} sentences passed`);

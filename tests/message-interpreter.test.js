"use strict";

const assert = require("node:assert/strict");
const { analyzeUserMessage } = require("../message-interpreter.js");

const analyzed = Object.fromEntries([
  "결혼식 다녀왔는데 너무 힘들었어",
  "오늘 결혼식 갔는데 생각보다 안 힘들었어",
  "회사 개힘들었다",
  "나 이제 집왔어",
  "씻었다",
  "아무것도 안 하고 누워있었어",
  "오늘 기분 진짜 좋음ㅎㅎ",
  "배고파",
  "보고 싶었어",
  "뭐해?",
  "잘게",
  "화난 건 아닌데 좀 짜증나",
  "오늘 운동하고 치킨 먹었어",
  "그냥 별일 없었어"
].map(message => [message, analyzeUserMessage(message)]));

assert.deepEqual(analyzed["결혼식 다녀왔는데 너무 힘들었어"].activities, ["결혼식 다녀옴"]);
assert.equal(analyzed["결혼식 다녀왔는데 너무 힘들었어"].mood, "tired");
assert.equal(analyzed["결혼식 다녀왔는데 너무 힘들었어"].priority, "comfort-first");
assert.equal(analyzed["결혼식 다녀왔는데 너무 힘들었어"].achievementTitle, "힘든 와중에도 결혼식 다녀오기");

assert.equal(analyzed["오늘 결혼식 갔는데 생각보다 안 힘들었어"].mood, null);
assert.equal(analyzed["오늘 결혼식 갔는데 생각보다 안 힘들었어"].responseMode, "achievement");
assert.equal(analyzed["회사 개힘들었다"].mood, "tired");
// "회사 업무를 해냄" 규칙이 예전엔 "힘들"만 보고도 완료 활동으로 잡아서, 완료 행동이
// 하나도 없는 순수 감정 토로("힘들었다")까지 achievementCandidate=true로 새는 버그가
// 있었다(EMOTION_ONLY가 대업 판정으로 흘러들어감). "일/업무/발표/회의/야근/버텼/칭찬"처럼
// 실제로 뭔가 했다는 서술이 없으면 완료로 보지 않는 게 맞는 동작이다.
assert.equal(analyzed["회사 개힘들었다"].achievementCandidate, false);
assert.equal(analyzed["나 이제 집왔어"].achievementCandidate, false);
assert.ok(analyzed["나 이제 집왔어"].intents.includes("commute"));
assert.ok(analyzed["씻었다"].intents.includes("hygiene"));
assert.equal(analyzed["씻었다"].achievementCandidate, true);
assert.equal(analyzed["아무것도 안 하고 누워있었어"].achievementCandidate, false);
assert.ok(analyzed["아무것도 안 하고 누워있었어"].intents.includes("rest"));
assert.equal(analyzed["오늘 기분 진짜 좋음ㅎㅎ"].mood, "happy");
assert.equal(analyzed["배고파"].responseMode, "conversation");
assert.ok(analyzed["보고 싶었어"].intents.includes("missing"));
assert.ok(analyzed["뭐해?"].intents.includes("question"));
assert.ok(analyzed["잘게"].intents.includes("sleep"));
assert.equal(analyzed["화난 건 아닌데 좀 짜증나"].mood, "angry");
assert.deepEqual(analyzed["오늘 운동하고 치킨 먹었어"].activities, ["운동 완료", "식사 챙김"]);
assert.equal(analyzed["오늘 운동하고 치킨 먹었어"].achievementCandidate, true);
assert.equal(analyzed["그냥 별일 없었어"].achievementCandidate, false);
assert.ok(analyzed["그냥 별일 없었어"].intents.includes("quiet_day"));

for (const message of ["별로 안 피곤해", "화난 건 아니야", "슬프진 않은데 평온해"]) {
  const result = analyzeUserMessage(message);
  assert.equal(result.sentiment, "neutral", message);
}

const shortSad = analyzeUserMessage("슬퍼");
assert.equal(shortSad.mood, "sad");
assert.ok(shortSad.intents.includes("sad"));

const selfCriticalNoAction = analyzeUserMessage("오늘 아무것도 못했어");
assert.equal(selfCriticalNoAction.mood, "low");
assert.ok(selfCriticalNoAction.intents.includes("no_motivation"));
assert.ok(!selfCriticalNoAction.intents.includes("quiet_day"));
assert.ok(analyzeUserMessage("오늘 아무것도 안 했어").intents.includes("quiet_day"));

for (const quickInput of ["침대에서 일어남", "물 한 잔 마심", "미뤘던 답장 보냄", "씻음"]) {
  assert.equal(analyzeUserMessage(quickInput).achievementCandidate, true, quickInput);
}

for (const negatedActivity of ["오늘 운동은 안 했어", "결혼식 안 갔어", "밥 못 먹었어"]) {
  assert.equal(analyzeUserMessage(negatedActivity).achievementCandidate, false, negatedActivity);
}

for (const thirdPartyActivity of ["친구가 운동했어", "엄마가 밥 먹었어", "동료가 회의를 끝냈어"]) {
  assert.equal(analyzeUserMessage(thirdPartyActivity).achievementCandidate, false, thirdPartyActivity);
}
assert.equal(analyzeUserMessage("친구랑 운동했어").achievementCandidate, true);
for (const quietInput of ["아무것도 안 했어", "그냥 그래", "모르겠어"]) {
  assert.equal(analyzeUserMessage(quietInput).achievementCandidate, false, quietInput);
}

// 완료 행동 + 같은 행동의 미래 계획이 한 문장에 같이 있는 경우. 완료 절과 미래 절이
// 뒤섞여 하나로 뭉개지면 안 된다 — 완료는 completedActions(activities)에,
// 계획은 futurePlans에 각각 남아야 한다.
const exerciseMix = analyzeUserMessage("오늘 운동했고 내일 또 운동할 거야");
assert.deepEqual(exerciseMix.activities, ["운동 완료"]);
assert.equal(exerciseMix.achievementCandidate, true);
assert.equal(exerciseMix.futurePlans.length, 1);
assert.equal(exerciseMix.futurePlans[0].label, "운동 완료");

const mealMix = analyzeUserMessage("밥 먹었고 저녁엔 치킨 먹을 거야");
assert.deepEqual(mealMix.activities, ["식사 챙김"]);
assert.equal(mealMix.achievementCandidate, true);
assert.equal(mealMix.futurePlans.length, 1);
assert.equal(mealMix.futurePlans[0].label, "식사 챙김");

const hygieneMix = analyzeUserMessage("씻었고 내일도 씻을 거야");
assert.deepEqual(hygieneMix.activities, ["씻기 완료"]);
assert.equal(hygieneMix.achievementCandidate, true);
assert.equal(hygieneMix.futurePlans.length, 1);
assert.equal(hygieneMix.futurePlans[0].label, "씻기 완료");

/* ── 이해 폭 ──
   여기 있는 문장들은 전부 한때 freeform으로 떨어져서 "인용 되묻기"로
   흘러가던 것들이다. 분류가 되는 것 자체가 계약이다. */
for (const [message, intent] of [
  ["엄마랑 싸웠어", "conflict"],
  ["동생이랑 다퉜어", "conflict"],
  ["면접 붙었어", "goodnews"],
  ["승진했어", "goodnews"],
  ["동생이랑 화해했어", "goodnews"],
  ["정신없이 바빴어", "swamped"],
  ["눈코 뜰 새 없었어", "swamped"],
  ["너무 힘들어서 울었어", "sad"]
]) assert.ok(analyzeUserMessage(message).intents.includes(intent), `${message} → ${intent}`);

/* ── goodnews 음성 대조군 ──
   「~했으면 좋겠다」는 바람이지 소식이 아니다. 합격을 바라는 사람에게
   축하가 나가면 WORLD §5가 말하는 신뢰 파괴다. 이 목록은 절대 goodnews가
   되면 안 된다 (2026-09-01 코덱스 심사에서 6/6 오분류로 잡힌 것들). */
for (const wish of ["합격했으면 좋겠다", "붙었으면 좋겠다", "뽑혔으면 좋겠다", "화해했으면 좋겠다", "완치됐으면 좋겠다", "당첨됐으면 좋겠다", "계약됐으면 좋겠다"]) {
  assert.ok(!analyzeUserMessage(wish).intents.includes("goodnews"), `${wish} 는 바람이지 소식이 아니다`);
}
// 실제로 일어난 소식은 그대로 받는다 — 가드가 진짜 소식까지 막으면 안 된다.
for (const news of ["면접 붙었어", "드디어 합격했어", "당첨됐어!", "동생이랑 화해했어"]) {
  assert.ok(analyzeUserMessage(news).intents.includes("goodnews"), news);
}

/* ── 하다 만 행동 ──
   그만둔 행동은 activities에조차 남지 않는다. 완료 판정만 막으면 칭호
   선택과 다중 행동 대사가 배열을 통째로 읽어 운동 대업이 발행된다. */
const abandoned = analyzeUserMessage("운동하려다 말았는데 샤워는 했어");
assert.deepEqual(abandoned.activities, ["씻기 완료"], "하다 만 운동은 활동 목록에 없다");
assert.ok(abandoned.negatedActivities.some(item => item.label === "운동 완료"), "하다 만 운동은 부정 목록으로 간다");
assert.ok(!/운동/.test(abandoned.achievementTitle), "칭호가 하다 만 운동을 집지 않는다");

// "왔어"는 문장 맨 앞에 홀로 설 때만 인사다.
assert.ok(analyzeUserMessage("왔어").intents.includes("greeting"));
assert.ok(analyzeUserMessage("나 왔어").intents.includes("greeting"));
assert.ok(!analyzeUserMessage("머리 자르고 왔어").intents.includes("greeting"), "보고를 인사로 읽지 않는다");

// "까먹었어"는 먹은 게 아니다 — 대업으로 세면 안 된다.
assert.deepEqual(analyzeUserMessage("약 먹는 거 까먹었어").activities, []);
assert.deepEqual(analyzeUserMessage("밥 먹었어").activities, ["식사 챙김"]);

console.log("message-interpreter: all scenarios passed");

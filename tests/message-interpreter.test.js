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

console.log("message-interpreter: all scenarios passed");

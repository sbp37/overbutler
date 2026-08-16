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
assert.equal(analyzed["회사 개힘들었다"].achievementCandidate, true);
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

console.log("message-interpreter: all scenarios passed");

"use strict";

const assert = require("node:assert/strict");
const chat = require("../chat-engine.js");

assert.equal(chat.timeSlotForHour(3), "dawn");
assert.equal(chat.timeSlotForHour(8), "morning");
assert.equal(chat.timeSlotForHour(13), "afternoon");
assert.equal(chat.timeSlotForHour(19), "evening");
assert.equal(chat.timeSlotForHour(23), "night");

const cases = {
  "안녕": "greeting", "오늘 너무 힘들었어": "hard_day", "이제 집이야": "home_arrival",
  "피곤해": "tired", "우울하고 속상해": "sad", "너무 화나고 짜증나": "angry",
  "심심해": "bored", "고민 있어": "worry", "배고파": "hungry", "맛있는 거 먹었어": "ate_good",
  "잘게": "sleep", "보고 싶었어": "miss", "사랑해": "love", "뭐해": "what_doing",
  "고마워": "thanks", "기분 좋아": "happy", "출근해": "commute", "씻었어": "washed",
  "운동했어": "exercise", "아무것도 하기 싫어": "no_motivation", "그냥 아무 말": "fallback"
};

for (const [message, intent] of Object.entries(cases)) assert.equal(chat.classify(message).intent, intent, message);

let memory = chat.normalizeMemory({}, "cat");
const hardDay = chat.respond("cat", "오늘 너무 힘들었어", memory, 0);
const arrived = chat.respond("cat", "이제 집이야", hardDay.memory, 0);
assert.match(arrived.reply, /아까 회사 때문에 힘들다 했는데/);
assert.equal(arrived.memory.previousUserMessage, "이제 집이야");
assert.equal(arrived.memory.turnCount, 2);
assert.ok(hardDay.memory.recentActivities.length === 0);

const firstGreeting = chat.respond("cat", "안녕", arrived.memory, 0);
const repeatedGreeting = chat.respond("cat", "안녕", firstGreeting.memory, 0);
assert.notEqual(firstGreeting.reply, repeatedGreeting.reply);

let greetingMemory = chat.normalizeMemory({}, "cat");
const greetingReplies = [];
for (let index = 0; index < 8; index += 1) {
  const result = chat.respond("cat", "안녕", greetingMemory, 0);
  greetingReplies.push(result.reply);
  greetingMemory = result.memory;
}
assert.equal(new Set(greetingReplies).size, 8);

const wedding = chat.respond("cat", "결혼식 다녀왔는데 너무 힘들었어", {}, 0);
assert.equal(wedding.responseMode, "comfort");
assert.equal(wedding.achievementCandidate, true);
assert.equal(wedding.achievementTitle, "힘든 와중에도 결혼식 다녀오기");
assert.match(wedding.reply, /결혼식까지 다녀왔구냥/);
assert.deepEqual(wedding.memory.recentActivities, ["결혼식 다녀옴"]);

const characters = ["ai", "cat", "dog", "alien", "ninja", "witch", "zombie", "girlidol", "elf", "fairy"];
const hardDayReplies = characters.map(character => chat.respond(character, "오늘 너무 힘들었어", {}, 0).reply);
assert.equal(new Set(hardDayReplies).size, characters.length);

const normalized = chat.normalizeMemory({ turnCount: "4", recentTopics: ["a", "b"], unknown: "preserve nowhere" }, "ai");
assert.equal(normalized.turnCount, 4);
assert.deepEqual(normalized.recentTopics, ["a", "b"]);

for (const thirdPartyInput of ["친구가 아파", "엄마가 우울해", "친구가 운동했어"]) {
  const response = chat.respond("cat", thirdPartyInput, {}, 0);
  assert.equal(response.achievementCandidate, false, thirdPartyInput);
  assert.match(response.reply, /에게 있었던 일이구냥|얘기구냥/, thirdPartyInput);
}

let careMemory = {};
const pain = chat.respond("cat", "배아파", careMemory, 0);
assert.match(pain.reply, /배가 아프구냥/);
assert.equal(pain.memory.activeThread.intent, "physical_discomfort");
const painContinues = chat.respond("cat", "아직도", pain.memory, 0);
assert.match(painContinues.reply, /아직 아프구냥/);
const painResolved = chat.respond("cat", "좀 나아졌어", painContinues.memory, 0);
assert.match(painResolved.reply, /조금 나아졌구냥/);
assert.equal(painResolved.memory.activeThread, null);

assert.match(chat.respond("cat", "그냥 그래", {}, 0).reply, /그냥 그렇구냥/);
assert.match(chat.respond("cat", "오늘 운동 못 했어", {}, 0).reply, /못 한 일|안 한 건/);

console.log("chat-engine: all scenarios passed");

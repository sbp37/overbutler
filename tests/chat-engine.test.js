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

const sadness = chat.respond("cat", "슬퍼", {}, 0);
assert.match(sadness.reply, /^슬프구냥/);
assert.doesNotMatch(sadness.reply, /별거 아닌/);

const painBeforeSadness = chat.respond("cat", "배 아파", {}, 0);
const sadnessAfterPain = chat.respond("cat", "우울해", painBeforeSadness.memory, 0);
assert.match(sadnessAfterPain.reply, /^우울하구냥/);
assert.doesNotMatch(sadnessAfterPain.reply, /몸이 불편했던 이야기/);

let changingCareMemory = {};
const changingCareReplies = [];
for (const input of ["슬퍼", "배 아파", "우울해", "오늘 아무것도 못했어"]) {
  const response = chat.respond("cat", input, changingCareMemory, 0);
  changingCareReplies.push(response.reply);
  changingCareMemory = response.memory;
}
assert.equal(new Set(changingCareReplies).size, 4);
assert.match(changingCareReplies[0], /^슬프구냥/);
assert.match(changingCareReplies[1], /배가 아프구냥|속이 불편하구냥|배가 불편하구냥/);
assert.match(changingCareReplies[2], /^우울하구냥|^마음이 가라앉아|^우울한 마음/);
assert.match(changingCareReplies[3], /^아무것도 못 한 날도 있다냥|^오늘 못 한 건/);
changingCareReplies.forEach(reply => assert.doesNotMatch(reply, /이 대목은 두 번 읽었|접수는 끝났/));

let repeatedSadMemory = {};
const repeatedSadReplies = [];
for (let index = 0; index < 3; index += 1) {
  const response = chat.respond("cat", "슬퍼", repeatedSadMemory, index / 4);
  repeatedSadReplies.push(response.reply);
  repeatedSadMemory = response.memory;
}
assert.equal(new Set(repeatedSadReplies).size, 3);

const noAction = chat.respond("cat", "오늘 아무것도 못했어", {}, 0);
assert.equal(noAction.intent, "no_motivation");
assert.match(noAction.reply, /^아무것도 못 한 날도 있다냥/);
assert.doesNotMatch(noAction.reply, /특이사항 없음|엄연한 보고/);

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

/* ── 인용 반사 계약 ──
   되읽기는 통째로 읽을 수 있을 때만 한다. 잘린 인용("고양이가 아파서 병원")은
   되읽는 순간 못 알아들었다는 증거가 되고, 확인을 구하는 문장("맞냥?")도
   같은 값을 한다. 둘 다 폴백에서 제일 자주 나가는 자리라 더 그렇다. */
for (const brokenQuote of ["머리 자르고 왔어", "친구랑 카페 갔다가 집에 왔어"]) {
  const reply = chat.respond("cat", brokenQuote, {}, 0).reply;
  assert.ok(!/[‘’]/.test(reply) || !/(?:르|갔|병원|좀)[’]/.test(reply), brokenQuote);
}
assert.match(chat.respond("cat", "비 와서 그냥 집에 있었어", {}, 0).reply, /‘비 와서 그냥 집에 있었어’/);
for (let seed = 0; seed < 6; seed += 1) {
  assert.ok(!/제대로 이해한 게 맞냥/.test(chat.respond("cat", "비 와서 그냥 집에 있었어", {}, seed).reply));
}

// 남을 돌본 하루 — 반려동물·가족까지 받는다. 성과로 세지 않는다.
const petCare = chat.respond("cat", "고양이가 아파서 병원 데려갔어", {}, 0);
assert.equal(petCare.achievementCandidate, false);
assert.match(petCare.reply, /고양이/);
assert.ok(!/‘/.test(petCare.reply), "인용 폴백으로 떨어지지 않는다");

// 아직 안 한 일 — 재촉하지 않는다.
assert.match(chat.respond("cat", "내일 시험인데 하나도 안 봤어", {}, 0).reply, /재촉|급하겠|안 된 채로/);
// 아찔했던 순간 — 대업도 위로도 아니고 놀란 몸부터 본다.
assert.match(chat.respond("cat", "지하철에서 넘어질 뻔했어", {}, 0).reply, /아찔|큰일 날 뻔|놀랐다냥/);
// 고맙다는 말이 안 나온 감사도 받는다.
assert.match(chat.respond("cat", "너랑 얘기하니까 좀 낫다", {}, 0).reply, /다행이다냥|도움이 됐냥|서류함 맨 위|좀 풀렸다니/);

// 자주 열리는 창구는 같은 말을 금방 반복하면 안 된다.
for (const intent of ["피곤해", "기분 좋아", "씻었어", "별일 없었어"]) {
  const seen = new Set();
  let loop = chat.normalizeMemory({}, "cat");
  for (let turn = 0; turn < 6; turn += 1) {
    const spoken = chat.respond("cat", intent, loop, turn);
    loop = spoken.memory;
    seen.add(spoken.reply);
  }
  assert.ok(seen.size >= 5, `${intent} 6회에 ${seen.size}종`);
}

console.log("chat-engine: all scenarios passed");

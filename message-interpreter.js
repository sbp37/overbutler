(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OVERBUTLER_MESSAGE_INTERPRETER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const INTENT_TYPES = ["greeting", "goodbye", "sleep", "tired", "sad", "angry", "bored", "worried", "hungry", "happy", "thankful", "affection", "missing", "question", "activity", "achievement", "rest", "nothing", "work", "commute", "meal", "exercise", "hygiene", "social", "freeform"];
  const MOOD_TYPES = ["tired", "sad", "angry", "worried", "low", "hungry", "bored", "happy", "affection"];

  const EMOTIONS = [
    ["tired", "tired", "negative", /힘들|지쳤|지쳐|죽겠다|죽겠네|기\s*빨|기빨|녹초|피곤|고단|진이\s*빠|방전|개힘/i],
    ["sad", "sad", "negative", /우울|속상|슬프|서럽|눈물|마음\s*아프|허무|공허|울적/i],
    ["angry", "angry", "negative", /짜증|빡쳐|빡침|개빡|화나|화났|열받|기분\s*나빠|분하/i],
    ["worried", "worried", "negative", /걱정|고민|불안|초조|어떡하|어떻게\s*해야|막막/i],
    ["nothing", "low", "negative", /아무것도\s*(?:하기|하고)\s*싫|의욕\s*(?:없|제로)|아무것도\s*못\s*하겠|무기력/i],
    ["bored", "bored", "neutral", /심심|무료|재미\s*없/i],
    ["hungry", "hungry", "neutral", /배\s*고파|배고파|허기|굶었|꼬르륵|(?:밥|끼니)\s*못\s*먹/i],
    ["happy", "happy", "positive", /기분\s*(?:진짜\s*)?좋|행복|재밌|즐거|신나|칭찬\s*받|뿌듯|좋았|좋음/i],
    ["thankful", "happy", "positive", /고마워|고맙|감사|땡큐/i],
    ["affection", "affection", "positive", /사랑해|좋아해|아껴|소중해/i],
    ["missing", "affection", "positive", /보고\s*싶|그리웠|생각났/i]
  ];

  const CONVERSATION = [
    ["greeting", /안녕|하이|ㅎㅇ|hello|왔어|왔어요|반가워/i],
    ["goodbye", /갈게|이만\s*갈|나중에\s*봐|바이|안녕히/i],
    ["sleep", /잘게|자러\s*갈|잘\s*자|굿\s*나잇|굿나잇|잠들/i],
    ["question", /\?|뭐\s*해|뭐하|왜\s|어떻게\s|무엇|알아\?/i]
  ];

  const ACTIVITY_RULES = [
    ["social", "결혼식 다녀옴", /결혼식(?:에|을)?\s*(?:갔|다녀|참석)/i],
    ["commute", "집에 도착함", /(?:이제|방금)?\s*(?:집에?|집으로)\s*(?:왔|도착|이야|이다|임)|퇴근\s*(?:했|완료|함)/i],
    ["work", "출근함", /출근(?:은|을)?\s*(?:했|함|완료|갔|갔다|했어)?/i],
    ["work", "회사 업무를 해냄", /회사(?:에서|가|는|를)?[^.!?]*(?:일|업무|발표|회의|야근|버텼|힘들|칭찬)/i],
    ["hygiene", "씻기 완료", /씻었|씻음|샤워|세수|양치|목욕|머리\s*감/i],
    ["activity", "침대에서 일어나기", /침대에서\s*일어|일어남|기상\s*(?:완료|함|했)/i],
    ["activity", "물 한 잔 챙기기", /물(?:을|\s*한\s*잔)?\s*(?:마셨|마심|먹었)/i],
    ["exercise", "운동 완료", /운동|헬스|러닝|달리기|스트레칭|요가|산책/i],
    ["meal", "식사 챙김", /(?:밥|치킨|아침|점심|저녁|간식|음식)[^.!?]*(?:먹|먹었|먹음)|먹었|먹고/i],
    ["rest", "충분히 쉬기", /누워\s*있|쉬었|휴식|낮잠|뒹굴/i],
    ["activity", "설거지 완료", /설거지/i],
    ["activity", "빨래 완료", /빨래/i],
    ["activity", "청소 완료", /청소|방\s*정리|정리\s*했/i],
    ["activity", "답장 완료", /답장|연락\s*(?:했|함)|메일\s*(?:보냈|완료)/i],
    ["achievement", "발표 완료", /발표(?:를|는)?\s*(?:했|함|마쳤|끝)/i],
    ["activity", "외출 일정 완료", /다녀왔|갔다\s*왔|외출/i]
  ];

  function safeText(value, max = 240) {
    return (typeof value === "string" || typeof value === "number" ? String(value) : "").trim().replace(/\s+/g, " ").slice(0, max);
  }

  function matchesActive(text, pattern, respectActionNegation = false) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    let match;
    while ((match = matcher.exec(text))) {
      const before = text.slice(Math.max(0, match.index - 14), match.index);
      const around = text.slice(match.index, match.index + match[0].length + 14);
      const tail = text.slice(match.index + match[0].length, match.index + match[0].length + 14);
      const prefixed = /(?:별로|전혀|하나도|생각보다)?\s*안\s*$/.test(before);
      const suffixed = /(?:진|지는|지도|지)\s*(?:않|않았|않아)|(?:건|것은|건은)?\s*아니|아닌데|아니야/.test(around);
      const actionNegated = /(?:안|못)\s*(?:했|함|갔|다녀|먹|마셨|완료)/.test(match[0]) || /^(?:은|는|을|를)?\s*(?:안|못)\s*(?:했|함|갔|먹|마셨|완료)/.test(tail);
      if (!prefixed && !suffixed && !(respectActionNegation && actionNegated)) return true;
      if (!match[0].length) matcher.lastIndex += 1;
    }
    return false;
  }

  function keywordsFor(text) {
    const stop = new Set(["오늘", "그냥", "진짜", "너무", "근데", "그런데", "하고", "했어", "했는데", "아니야"]);
    return (text.match(/[가-힣A-Za-z]{2,}/g) || []).filter(word => !stop.has(word)).slice(0, 6);
  }

  function achievementTitle(text, activities, mood) {
    if (/결혼식/i.test(text)) return mood === "tired" ? "힘든 와중에도 결혼식 다녀오기" : "결혼식 일정 무사 완료";
    if (/늦잠/i.test(text) && /출근/i.test(text)) return "늦잠의 역경을 뚫고 출근 완료";
    if (/설거지/i.test(text)) return "주방 문명 복구 완료";
    if (/회사/i.test(text) && mood === "tired") return "고된 회사 하루 끝까지 버텨냄";
    if (/회사/i.test(text) && /칭찬/i.test(text)) return "회사에서 받은 칭찬 공식 인정";
    if (/발표/i.test(text)) return "긴장과 시선을 뚫고 발표 완료";
    if (/운동/i.test(text) && /먹|치킨|식사/i.test(text)) return "운동과 식사까지 하루 루틴 완주";
    if (/운동|헬스|러닝|달리기/i.test(text)) return "몸을 움직여 오늘의 체력 퀘스트 완료";
    if (/침대에서\s*일어|일어남|기상/i.test(text)) return "중력을 이겨내고 침대 탈출 완료";
    if (/물(?:을|\s*한\s*잔)?\s*(?:마셨|마심|먹었)/i.test(text)) return "생존 수분 충전 완료";
    if (/씻|샤워|세수|양치/i.test(text)) return "생활 문명 복구: 씻기 완료";
    if (/빨래/i.test(text)) return "의류 문명 정비 완료";
    if (/청소|정리/i.test(text)) return "생활권 질서 회복 완료";
    if (/답장|연락|메일/i.test(text)) return "미뤄둔 소통 임무 완료";
    return activities[0] || "오늘의 작은 일을 끝까지 해냄";
  }

  function analyzeUserMessage(value) {
    const text = safeText(value);
    const intents = [];
    const moods = [];
    const sentiments = [];
    const activities = [];
    const activityTypes = [];

    for (const [intent, mood, sentiment, pattern] of EMOTIONS) {
      if (!matchesActive(text, pattern)) continue;
      intents.push(intent);
      moods.push(mood);
      sentiments.push(sentiment);
    }
    for (const [intent, pattern] of CONVERSATION) if (matchesActive(text, pattern)) intents.push(intent);

    for (const [type, label, pattern] of ACTIVITY_RULES) {
      if (!matchesActive(text, pattern, true)) continue;
      if (!activities.includes(label)) {
        activities.push(label);
        activityTypes.push(type);
      }
    }
    if (activities.includes("결혼식 다녀옴")) {
      const genericTrip = activities.indexOf("외출 일정 완료");
      if (genericTrip >= 0) {
        activities.splice(genericTrip, 1);
        activityTypes.splice(genericTrip, 1);
      }
    }

    const nothing = /아무것도\s*(?:(?:안|못)|(?:하기|하고)\s*싫)|별일\s*없|한\s*게\s*없|그냥\s*누워/i.test(text);
    const rest = /누워|쉬었|휴식|낮잠|뒹굴/i.test(text);
    if (nothing) intents.push("nothing");
    if (rest) intents.push("rest");
    if (/회사|업무|출근|퇴근|야근|발표|회의/i.test(text)) intents.push("work");
    if (activityTypes.includes("commute")) intents.push("commute");
    if (activityTypes.includes("meal")) intents.push("meal");
    if (activityTypes.includes("exercise")) intents.push("exercise");
    if (activityTypes.includes("hygiene")) intents.push("hygiene");
    if (activityTypes.includes("social")) intents.push("social");
    if (activities.length) intents.push("activity");

    const moodPriority = ["tired", "sad", "angry", "worried", "low", "hungry", "bored", "happy", "affection"];
    const mood = moodPriority.find(item => moods.includes(item)) || null;
    const negative = sentiments.includes("negative");
    const meaningfulActivity = activityTypes.some(type => !["rest", "commute"].includes(type));
    const achievementCandidate = meaningfulActivity && !(nothing && activities.every((_, index) => activityTypes[index] === "rest"));
    if (achievementCandidate) intents.push("achievement");
    if (!intents.length) intents.push("freeform");
    const uniqueIntents = [...new Set(intents)];
    const responseMode = negative ? "comfort" : achievementCandidate
      ? (mood === "happy" || /칭찬|합격|성공|수상|완료/i.test(text) ? "special-achievement" : "normal-record")
      : "conversation";
    const priority = negative ? "comfort-first" : achievementCandidate ? "activity-first" : "conversation-first";
    const sentiment = negative ? "negative" : sentiments.includes("positive") ? "positive" : "neutral";
    const hitCount = uniqueIntents.length + activities.length;

    return {
      text,
      intents: uniqueIntents,
      activities,
      activityTypes,
      mood,
      sentiment,
      priority,
      achievementCandidate: Boolean(achievementCandidate),
      achievementTitle: achievementCandidate ? achievementTitle(text, activities, mood) : "",
      responseMode,
      confidence: Number(Math.min(0.98, 0.42 + hitCount * 0.09).toFixed(2)),
      keywords: keywordsFor(text)
    };
  }

  return Object.freeze({ analyzeUserMessage, matchesActive, intents: Object.freeze(INTENT_TYPES), moods: Object.freeze(MOOD_TYPES) });
});

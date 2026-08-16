(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OVERBUTLER_MESSAGE_INTERPRETER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const INTENT_TYPES = ["greeting", "goodbye", "sleep", "tired", "sad", "angry", "bored", "worried", "hungry", "happy", "thankful", "affection", "missing", "question", "activity", "achievement", "rest", "quiet_day", "no_motivation", "work", "commute", "meal", "exercise", "hygiene", "social", "freeform"];
  const MOOD_TYPES = ["tired", "sad", "angry", "worried", "low", "hungry", "bored", "happy", "affection"];

  const EMOTIONS = [
    ["tired", "tired", "negative", /힘들|지쳤|지쳐|죽겠다|죽겠네|기\s*빨|기빨|녹초|피곤|고단|진이\s*빠|방전|개힘/i],
    ["sad", "sad", "negative", /우울|속상|슬프|서럽|눈물|마음\s*아프|허무|공허|울적/i],
    ["angry", "angry", "negative", /짜증|빡쳐|빡침|개빡|화나|화났|열받|기분\s*나빠|분하/i],
    ["worried", "worried", "negative", /걱정|고민|불안|초조|어떡하|어떻게\s*해야|막막/i],
    ["no_motivation", "low", "negative", /아무것도\s*(?:하기|하고)\s*싫|의욕\s*(?:이|은|가)?\s*(?:없|안\s*나|제로|하나도\s*없)|아무것도\s*못\s*하겠|무기력|손\s*하나\s*까딱|다\s*귀찮|몸이\s*안\s*움직/i],
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

  // 완료 서술 뒤에 미래형 어미가 바로 따라오면(예: "먹을 거임", "할 거야") 아직 하지 않은
  // 계획이다. 이 창(활동 매치 끝 ~18자)에 미래형이 걸리면 그 활동은 완료로 세지 않는다.
  const FUTURE_TENSE = /(?:을\s*)?거(?:야|임|다|예요|고요|라고요)|겠(?:다|음|어|어요|습니다)|할게(?:요)?|할래(?:요)?|하려고(?:요)?|하기로(?:\s*했)?|예정(?:이야|임|이다|이에요)?/;
  const FUTURE_WINDOW = 18;
  // "오늘 운동했고 내일 또 운동할 거야"처럼 완료 절과 미래 절이 한 문장에 같이 있으면,
  // 앞쪽 완료 매치의 창이 뒤 절의 "거야"까지 삼켜버릴 수 있다. 매치 뒤에 절 경계(쉼표/
  // 마침표류/"-고"/접속사)가 있으면 그 경계 안쪽으로만 미래형을 찾아, 완료 절 자체에
  // 미래형이 붙었을 때만 계획으로 본다.
  const CLAUSE_BOUNDARY = /[.!?~,]|고서?\s|다가\s|그리고|그러다\s|근데|그런데|하지만|다행히|결국|그래서/;
  // 부정에서 긍정으로 톤이 바뀌었는지 보는 보조 신호. 단독으로 감정을 뒤집지 않고
  // "앞에 부정 표현이 있고, 그 뒤에 이 신호가 있을 때"만 참고한다.
  const POSITIVE_TONE_HINT = /ㅋ{2,}|ㅎ{2,}|히히|헤헤|풀렸|풀림|다행|좋음|신남|개좋아|살아났|나아졌|괜찮아졌/;

  const ACTIVITY_RULES = [
    ["social", "결혼식 다녀옴", /결혼식(?:에|을)?\s*(?:갔|다녀|참석)/i],
    ["commute", "집에 도착함", /(?:이제|방금)?\s*(?:집에?|집으로)\s*(?:왔|도착|이야|이다|임)|퇴근\s*(?:했|완료|함)/i],
    ["work", "출근함", /출근(?:은|을)?\s*(?:했|함|완료|갔|갔다|했어)?/i],
    // "힘들"은 여기서 뺐다: "회사 힘들었어"처럼 완료 행동 없이 감정만 말한 문장이
    // "회사 업무를 해냄" 활동으로 잘못 잡히는 원인이었다(EMOTION_ONLY가 achievementCandidate로
    // 새는 버그). 실제로 뭔가 했다는 서술(일/업무/발표/회의/야근/버텼/칭찬)만 완료로 본다.
    ["work", "회사 업무를 해냄", /회사(?:에서|가|는|를)?[^.!?]*?(?:일|업무|발표|회의|야근|버텼|칭찬)/i],
    ["activity", "공부 완료", /공부|스터디|과제|숙제/i],
    // "씻을"(미래형)도 추가: 없으면 "씻었고 내일도 씻을 거야"의 뒤 절이 애초에 이
    // 규칙에 안 걸려서 futurePlans로도 안 잡히고 그냥 조용히 사라진다.
    ["hygiene", "씻기 완료", /씻었|씻음|씻을|샤워|세수|양치|목욕|머리\s*감/i],
    ["activity", "침대에서 일어나기", /침대에서\s*일어|일어남|기상\s*(?:완료|함|했)/i],
    ["activity", "물 한 잔 챙기기", /물(?:을|\s*한\s*잔)?\s*(?:마셨|마심|먹었)/i],
    ["exercise", "운동 완료", /운동|헬스|러닝|달리기|스트레칭|요가|산책/i],
    // [^.!?]*는 lazy(*?)로 쓴다 — greedy면 "밥 먹었고 저녁엔 치킨 먹을 거야"처럼 같은
    // 규칙이 두 번 나오는 문장에서 첫 매치가 뒤쪽 "먹"까지 통째로 삼켜서, 완료 절과
    // 미래 절이 하나의 매치로 뭉개진다(완료 행동 자체가 사라지는 원인이었다).
    ["meal", "식사 챙김", /(?:밥|치킨|아침|점심|저녁|간식|음식)[^.!?]*?(?:먹|먹었|먹음)|먹었|먹고/i],
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

  // 매치 위치까지 돌려주는 내부 버전. 활동 규칙은 위치를 알아야 뒤에 미래형 어미가
  // 붙었는지(=아직 안 한 계획인지) 확인할 수 있어서 boolean만 주던 matchesActive를
  // 감싸는 형태로 바꿨다. 부정 인식(안/못/아니) 로직은 그대로다.
  function activeMatches(text, pattern, respectActionNegation = false) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    const results = [];
    let match;
    while ((match = matcher.exec(text))) {
      const before = text.slice(Math.max(0, match.index - 14), match.index);
      const around = text.slice(match.index, match.index + match[0].length + 14);
      const tail = text.slice(match.index + match[0].length, match.index + match[0].length + 14);
      const prefixed = /(?:별로|전혀|하나도|생각보다)?\s*안\s*$/.test(before);
      const suffixed = /(?:진|지는|지도|지)\s*(?:않|않았|않아)|(?:건|것은|건은)?\s*아니|아닌데|아니야/.test(around);
      const actionNegated = /(?:안|못)\s*(?:했|함|갔|다녀|먹|마셨|완료)/.test(match[0]) || /^(?:은|는|을|를)?\s*(?:안|못)\s*(?:했|함|갔|먹|마셨|완료)/.test(tail);
      if (!prefixed && !suffixed && !(respectActionNegation && actionNegated)) {
        results.push({ index: match.index, end: match.index + match[0].length, text: match[0] });
      }
      if (!match[0].length) matcher.lastIndex += 1;
    }
    return results;
  }

  function matchesActive(text, pattern, respectActionNegation = false) {
    return activeMatches(text, pattern, respectActionNegation).length > 0;
  }

  // 활동 매치 바로 뒤(FUTURE_WINDOW자 안)에 미래형 어미가 있으면 "완료"가 아니라
  // "계획"이다. 미래형 어미가 시작되는 절대 위치까지 돌려줘서 자연스러운 인용 스니펫을
  // 만들 수 있게 한다.
  function futureMarkerAfter(text, matchEnd) {
    const boundary = CLAUSE_BOUNDARY.exec(text.slice(matchEnd, matchEnd + 40));
    const limit = boundary ? Math.min(FUTURE_WINDOW, boundary.index) : FUTURE_WINDOW;
    const window = text.slice(matchEnd, matchEnd + limit);
    const marker = FUTURE_TENSE.exec(window);
    if (!marker) return null;
    return matchEnd + marker.index + marker[0].length;
  }

  function cleanSnippet(value, max = 26) {
    return String(value || "").replace(/\s+/g, " ").trim().replace(/[~!?ㅋㅎ]+$/g, "").slice(0, max);
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

    const futurePlans = [];
    for (const [type, label, pattern] of ACTIVITY_RULES) {
      for (const found of activeMatches(text, pattern, true)) {
        const futureEnd = futureMarkerAfter(text, found.end);
        if (futureEnd !== null) {
          if (!futurePlans.some(plan => plan.label === label)) {
            futurePlans.push({ type, label, snippet: cleanSnippet(text.slice(found.index, futureEnd)) });
          }
          continue;
        }
        if (!activities.includes(label)) {
          activities.push(label);
          activityTypes.push(type);
        }
      }
    }
    if (activities.includes("결혼식 다녀옴")) {
      const genericTrip = activities.indexOf("외출 일정 완료");
      if (genericTrip >= 0) {
        activities.splice(genericTrip, 1);
        activityTypes.splice(genericTrip, 1);
      }
    }

    // 무기력(no_motivation)은 EMOTIONS에서 이미 감지된다. 여기서는 "그냥 평범했던 하루"만 따로 본다.
    const noMotivation = intents.includes("no_motivation");
    const quietDay = !noMotivation && /별일\s*없|별\s*일\s*없|한\s*게\s*없|특별한\s*(?:일|건|거)\s*(?:는)?\s*없|그냥\s*(?:그랬|그랬어|평범|보통|쉬었|누워)|평범(?:한|했|하게)|무난(?:한|했|하게)|아무것도\s*(?:안|못)\s*했/i.test(text);
    const nothing = noMotivation || quietDay;
    const rest = /누워|쉬었|휴식|낮잠|뒹굴/i.test(text);
    if (quietDay) intents.push("quiet_day");
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
    // 반응 강도. 감정이 부정적이면 행동이 있어도 위로가 먼저다.
    // 다만 감정 표현 없이 완료 행동만 보고한 경우는, 그게 아무리 하찮아도
    // 과잉집사의 본체인 대업 판정(FORM 05)으로 보낸다. 씻기·물 마시기·설거지가 핵심 재료다.
    const bigWin = /합격|수상|우승|승진|성공|1등|최우수|드디어/i.test(text) || (mood === "happy" && /칭찬/i.test(text));
    const responseMode = negative ? "comfort"
      : !achievementCandidate ? "conversation"
      : bigWin ? "special-achievement"
      : "achievement";
    const priority = negative ? "comfort-first" : achievementCandidate ? "activity-first" : "conversation-first";
    const sentiment = negative ? "negative" : sentiments.includes("positive") ? "positive" : "neutral";
    const hitCount = uniqueIntents.length + activities.length;

    // 앞부분이 부정이었어도 뒤에 긍정 신호(웃음, "풀림", "다행" 등)가 나오면 톤이
    // 바뀐 것으로 본다. "힘들었어~ 그래도 ... 히히!"에서 앞의 "힘들"만 보고
    // 위로 모드로 끝내지 않기 위한 신호다. 단독 판정이 아니라 chat-engine이
    // 답변을 고를 때 참고하는 보조 신호일 뿐, 여기서 sentiment/responseMode
    // 자체를 뒤집지는 않는다.
    let lastNegativeEnd = -1;
    for (const [, , sentimentType, pattern] of EMOTIONS) {
      if (sentimentType !== "negative") continue;
      for (const found of activeMatches(text, pattern)) lastNegativeEnd = Math.max(lastNegativeEnd, found.end);
    }
    let toneShift = false;
    if (lastNegativeEnd >= 0) {
      for (const [, , sentimentType, pattern] of EMOTIONS) {
        if (sentimentType !== "positive") continue;
        if (activeMatches(text, pattern).some(found => found.index >= lastNegativeEnd)) { toneShift = true; break; }
      }
      if (!toneShift) toneShift = activeMatches(text, POSITIVE_TONE_HINT).some(found => found.index >= lastNegativeEnd);
    }

    return {
      text,
      intents: uniqueIntents,
      activities,
      activityTypes,
      futurePlans,
      mood,
      toneShift,
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

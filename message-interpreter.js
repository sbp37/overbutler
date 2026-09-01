(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OVERBUTLER_MESSAGE_INTERPRETER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const INTENT_TYPES = ["greeting", "goodbye", "sleep", "tired", "sad", "angry", "bored", "worried", "hungry", "happy", "thankful", "affection", "missing", "question", "activity", "achievement", "rest", "quiet_day", "no_motivation", "setback", "conflict", "swamped", "goodnews", "work", "work_done", "commute", "meal", "exercise", "hygiene", "social", "freeform"];
  const MOOD_TYPES = ["tired", "sad", "angry", "worried", "low", "hungry", "bored", "happy", "affection"];

  const EMOTIONS = [
    ["tired", "tired", "negative", /힘들|지쳤|지쳐|죽겠다|죽겠네|기\s*빨|기빨|녹초|피곤|고단|진이\s*빠|방전|개힘/i],
    // 울었다는 말은 피로가 아니라 슬픔이다. tired보다 먼저 받아야 "쉬어라냥"으로 안 흘러간다.
    ["sad", "sad", "negative", /우울|속상|슬프|슬퍼|서럽|눈물|울었|울어버|펑펑|마음\s*아프|허무|공허|울적/i],
    ["angry", "angry", "negative", /짜증|빡쳐|빡침|개빡|화나|화났|열받|기분\s*나빠|분하/i],
    ["worried", "worried", "negative", /걱정|고민|불안|초조|어떡하|어떻게\s*해야|막막/i],
    /* 한 일의 결과가 나빴다는 보고. 이게 없으면 "발표했는데 완전 망했어"가
       완료 동사만 보고 대업 축하로 넘어간다 — 가장 아픈 날 도장을 찍는 셈이라
       WORLD §5가 말하는 최악의 오해다. 행동은 그대로 기록되고, 위로가 먼저
       나가고, 심사 결과서(FORM 05)는 뜨지 않는다.
       "망설", "실수요"처럼 다른 뜻으로 시작하는 말은 걸리지 않게 어미까지 묶었다. */
    /* 사람과 부딪힌 날. 이게 없으면 "엄마랑 싸웠어"가 아무 감정도 없는 문장으로
       읽혀 인용 되묻기로 떨어진다 — 하루 중 제일 말하고 싶었을 문장인데도. */
    ["conflict", "sad", "negative", /싸웠|싸움|다퉜|다툼|틀어졌|혼났|깨졌|헤어졌|절교|손절|안\s*좋게\s*끝|말다툼|언쟁/i],
    /* 몰아친 하루. 「바빴다」는 피로 어휘에 없었다. */
    ["swamped", "tired", "negative", /정신(?:이)?\s*없|눈코\s*뜰\s*새|치였|바빴|바쁘게|쉴\s*틈(?:이)?\s*없|하루\s*종일\s*뛰|숨\s*돌릴\s*틈/i],
    /* 잘된 소식. bigWin이 「합격」만 알아서 "면접 붙었어"가 그냥 넘어갔다. */
    /* 「~했으면 좋겠다」는 일어난 일이 아니라 바람이다. 성공 어휘 바로 뒤에
       가정·희망 어미가 붙으면 걸러낸다 — 합격을 바라는 사람에게 축하가 나가는
       것은 못 알아듣는 것보다 나쁘다. 희망 문장은 폴백의 바람(hope) 경로가 받는다. */
    ["goodnews", "happy", "positive", /(?:붙었|통과했|뽑혔|승진했|취직했|성사됐|화해했|해결됐|합격했|계약했|계약됐|잘\s*풀렸)(?!으면|다면|음\s*좋|길\s*바|기를\s*바|길\s*빌)|합격이(?!면)|나았어|(?:당첨|완치)(?!(?:됐|되|이)?(?:었)?으?면|되고\s*싶|되길|되기를)/i],
    ["setback", "sad", "negative", /(?:^|[^희소갈열])망(?:했|함|침|쳤|한)|말아먹|죽\s*쒔|폭망|실수(?:했|함|를\s*했|투성)|실패(?:했|함|한|야|다)|엉망|버벅|더듬거|삐끗|꼬였|틀렸|잘\s*안\s*(?:됐|됨|돼)|안\s*풀렸|불합격|탈락|(?:시험|면접|공채|서류|자소서|오디션|대회|경쟁)[^.!?]{0,12}떨어졌/i],
    ["no_motivation", "low", "negative", /아무것도\s*(?:하기|하고)\s*싫|의욕\s*(?:이|은|가)?\s*(?:없|안\s*나|제로|하나도\s*없)|아무것도\s*못\s*(?:하겠|했)|무기력|손\s*하나\s*까딱|다\s*귀찮|몸이\s*안\s*움직/i],
    ["bored", "bored", "neutral", /심심|무료|재미\s*없/i],
    ["hungry", "hungry", "neutral", /배\s*고파|배고파|허기|굶었|꼬르륵|(?:밥|끼니)\s*못\s*먹/i],
    ["happy", "happy", "positive", /기분\s*(?:진짜\s*)?좋|행복|재밌|즐거|신나|칭찬\s*받|뿌듯|좋았|좋음/i],
    ["thankful", "happy", "positive", /고마워|고맙|감사|땡큐/i],
    ["affection", "affection", "positive", /사랑해|좋아해|아껴|소중해/i],
    ["missing", "affection", "positive", /보고\s*싶|그리웠|생각났/i]
  ];

  const CONVERSATION = [
    // "왔어"는 문장 맨 앞에 홀로 설 때만 인사다. 아무 데서나 잡으면
    // "머리 자르고 왔어" 같은 보고가 전부 인사로 떨어진다.
    ["greeting", /안녕|하이|ㅎㅇ|hello|반가워|^\s*(?:나\s*|이제\s*)?왔(?:어요?|다)/i],
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

  /* ── 부정 하드 가드 ──
     "밥 먹기 귀찮아서 안 먹었어"가 「식사 했음」으로 뚫렸다. 원인은 부정을 정규식
     매치에 딱 붙은 14자 창에서만 봤다는 것이다. 식사 규칙은 lazy라 "밥 먹"에서
     끊기고, 진짜 부정("안 먹었어")은 그 창 밖에 있었다. "못"은 아예 표에 없었다.

     그래서 부정은 매치 주변이 아니라 그 동사가 속한 "절" 전체에서 본다.
     절 경계는 미래형 판정용 CLAUSE_BOUNDARY와 따로 둔다 — 저쪽에 "-는데"를
     넣으면 미래형 스코프가 같이 흔들리고, 이쪽에 "-서"를 넣으면
     "귀찮아서 | 안 먹었어"로 갈라져 정작 잡아야 할 문장이 다시 새어나간다. */
  const NEGATION_CLAUSE_BOUNDARY = /[.!?~,;]|(?:는데|은데|ㄴ데|지만|대신|반면)\s*|고\s|다가\s|그리고|그러다|근데|그런데|하지만|다행히|결국|그래서/g;
  // "안 그래도 씻었어"의 "안 그래도"처럼 부정이 아닌 관용구는 먼저 지운다.
  const NEGATION_FALSE_FRIEND = /안\s*그래도|안\s*그래|안녕|안내|안심|안전|안쪽|안경|못지않|못지\s*않|못해도/g;
  const NEGATION_CUE = [
    /(?:^|[\s"'`([])(?:안|못)\s+[가-힣]/,          // 띄어쓴 "안 먹었어" / "못 씻었어"
    /안(?:먹|씻|자|잤|갔|가|했|함|해|입|치|쉬|썼|봤|잤)/, // 붙여쓴 "안먹었어요"
    /못(?:먹|씻|자|잤|갔|가|했|함|해|일어|끝|잤)/,
    /(?:지|진|지는|지도|질)\s*(?:않|못)/,          // "-지 않았다" / "-지 못했다"
    /걸렀|거르|거른|굶었|굶고|굶어|굶는|빼먹|스킵|건너뛰|패스했|생략했/
  ];
  // 돌봄 행동 — 이걸 부정하면 대업이 아니라 걱정 사유다.
  const CARE_TYPES = new Set(["meal", "hygiene", "rest"]);
  // 완료 근거. 이게 절에 없으면 그 행동이 끝났다는 증거가 없다("설거지"만 적힌
  // 문장은 할 예정일 수도 있다). 빠른 입력 칩("씻음", "물 한 잔 마심")은
  // 받침 ㅁ 명사형이라 아래 endsWithNominalizer가 따로 받는다.
  const COMPLETION_MARK = /함|완료|끝냈|끝났|마쳤|마무리|해냄|다녀옴/;
  /* "산책하고 왔어"의 완료 증거는 뒤 절에 있다. 절 나누기가 "-고"에서 자르는
     바람에 「산책하」와 「왔어」로 갈라져, 행동이 있는 절에는 시제가 없고
     시제가 있는 절에는 행동이 없어 대업으로 안 올라갔다.
     뒤 절이 아래 꼬리로 시작할 때만 그 완료를 앞 절에 빌려준다. 허용 목록으로
     둔 건 "청소하고 싶었어"도 과거형이라, 막는 쪽으로 짜면 하고 싶었던 일이
     해낸 일로 둔갑하기 때문이다 — 안 한 일을 했다고 하는 게 제일 나쁘다. */
  const CARRIED_COMPLETION_TAIL = /^\s*(?:갔다\s*왔|돌아왔|들어왔|나왔|왔|잤|쉬었|먹었|씻었|끝냈|끝났|마쳤)/;
  // 앞 절이 의도·목적이면 뒤 절의 완료를 빌려주지 않는다. "운동하려고" + "했는데"는
  // 하려던 것이지 한 것이 아니다(실측: 「운동하려고 했는데 못 갔어」가 대업이 됐다).
  const CARRY_BLOCKING_INTENT = /려고|려던|러\s*$|고\s*싶|을\s*까|ㄹ\s*까/;
  /* 하려다 그만둔 것. 과거형 어미만 보면 「나가려다 말았어」의 "말았"이 완료로
     읽혀서 안 나간 산책이 대업으로 올라간다. 안 한 일을 했다고 인정하면 관계
     자체가 무너지므로(WORLD §5), 이 표시가 있는 절은 완료로 세지 않는다. */
  const ABANDONED_MARK = /(?:다|려다|다가)\s*말았|(?:다|려다|다가)\s*맘|그만뒀|그만둠|포기(?:했|함)|하다\s*말/;
  // 확신이 없는 서술. 이게 있으면 칭호를 뽑지 않는다.
  const UNCERTAIN_MARK = /것\s*같|인가|려나|할까|모르겠|아마|긴가민가|같기도|한\s*듯/;

  /* 과거 시제는 어미가 아니라 받침으로 잡는다. "갔/왔/했/었/봤/줬/썼"은 전부
     받침 ㅆ(종성 20번)이라, 어미 목록을 나열하면 반드시 빠지는 게 생긴다
     — 실제로 "결혼식 갔는데"가 '았|었'만 보던 목록에서 새어나갔다.
     "있/없"은 진행·상태라 완료 근거로 치지 않는다. */
  // 지금 절 바로 다음 절의 본문. 없으면 빈 문자열.
  function nextClauseTextAfter(clauses, clause) {
    const index = clauses.indexOf(clause);
    return index >= 0 && clauses[index + 1] ? String(clauses[index + 1].text || "") : "";
  }

  function hasPastTense(clause) {
    const value = String(clause || "");
    for (const char of value) {
      if (char === "있" || char === "없") continue;
      const code = char.charCodeAt(0);
      if (code < 0xac00 || code > 0xd7a3) continue;
      if ((code - 0xac00) % 28 === 20) return true;
    }
    return false;
  }

  // 절 끝이 받침 ㅁ 명사형인가 — "씻음 / 마심 / 보냄 / 일어남".
  function endsWithNominalizer(clause) {
    const last = String(clause || "").replace(/[.!?~\s]+$/, "").slice(-1);
    if (!last) return false;
    const code = last.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return false;
    return (code - 0xac00) % 28 === 16;
  }

  // 텍스트를 부정 스코프 단위로 자른다. 각 조각은 [시작, 끝) 범위를 들고 있다.
  function negationClauses(text) {
    const boundaries = [];
    const matcher = new RegExp(NEGATION_CLAUSE_BOUNDARY.source, "g");
    let match;
    while ((match = matcher.exec(text))) {
      boundaries.push(match.index + match[0].length);
      if (!match[0].length) matcher.lastIndex += 1;
    }
    const clauses = [];
    let start = 0;
    for (const end of [...boundaries, text.length]) {
      if (end <= start) continue;
      clauses.push({ start, end, text: text.slice(start, end) });
      start = end;
    }
    return clauses.length ? clauses : [{ start: 0, end: text.length, text }];
  }

  function clauseFor(clauses, index) {
    return clauses.find(clause => index >= clause.start && index < clause.end) || clauses[clauses.length - 1];
  }

  function isNegatedClause(clause) {
    const cleaned = String(clause || "").replace(NEGATION_FALSE_FRIEND, " ");
    return NEGATION_CUE.some(pattern => pattern.test(cleaned));
  }

  /* 부정된 절을 걷어낸 문장. 칭호·분야를 정할 때 원문을 그대로 넘기면
     "안 먹었는데 회사 일은 했어"의 "먹"이 식사 분야로 잡혀 「한 끼의 영웅」이
     붙는다 — 부정 가드를 뚫고 같은 오해가 칭호 쪽으로 돌아 들어오는 경로다. */
  function stripNegatedClauses(value) {
    const text = safeText(value);
    if (!text) return "";
    const kept = negationClauses(text).filter(clause => !isNegatedClause(clause.text)).map(clause => clause.text);
    return kept.join(" ").replace(/\s+/g, " ").trim();
  }

  const ACTIVITY_RULES = [
    ["social", "결혼식 다녀옴", /결혼식(?:에|을)?\s*(?:갔|다녀|참석)/i],
    ["commute", "집에 도착함", /(?:이제|방금)?\s*(?:집에?|집으로)\s*(?:왔|도착|이야|이다|임)|퇴근\s*(?:했|완료|함)/i],
    ["work", "출근함", /출근(?:은|을)?\s*(?:했|함|완료|갔|갔다|했어)?/i],
    // 업무 명사만으로는 완료가 아니다. "회사에서 일이 있었어"는 후속 이야기이지
    // "회사 업무를 해냄"이 아니다. 구체적인 완료 동사가 붙은 경우만 대업 후보로 본다.
    ["work", "회사 업무를 해냄", /(?:회사|직장)(?:에서|가|는|를)?[^.!?]*?(?:(?:일|업무|발표|회의|야근)(?:을|를|은|는|도)?[^.!?]{0,8}?(?:했|함|마쳤|끝냈|끝남|완료|해냈|하고\s*(?:왔|옴))|버텼|칭찬(?:을)?\s*받)/i],
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
    // "까먹었어"·"빼먹었어"는 먹은 게 아니다. 앞 글자를 한 칸 보고 걸러낸다
    // (lookbehind는 구형 iOS Safari에서 통째로 죽는다).
    ["meal", "식사 챙김", /(?:밥|치킨|아침|점심|저녁|간식|음식)[^.!?]*?(?:먹|먹었|먹음)|(?:^|[^까빼])(?:먹었|먹고)/i],
    ["rest", "충분히 쉬기", /누워\s*있|쉬었|휴식|낮잠|뒹굴/i],
    ["activity", "설거지 완료", /설거지/i],
    ["activity", "빨래 완료", /빨래/i],
    ["activity", "청소 완료", /청소|방\s*정리|정리\s*했/i],
    ["activity", "답장 완료", /답장|연락\s*(?:했|함)|메일\s*(?:보냈|완료)/i],
    // "발표 잘 끝냈어"의 "잘" 하나에 깨지지 않게 짧은 부사 자리를 허용한다.
    ["achievement", "발표 완료", /발표(?:를|는|도)?[^.!?]{0,6}?(?:했|함|마쳤|끝)/i],
    ["activity", "외출 일정 완료", /다녀왔|갔다\s*왔|외출/i]
  ];

  function safeText(value, max = 240) {
    return (typeof value === "string" || typeof value === "number" ? String(value) : "").trim().replace(/\s+/g, " ").slice(0, max);
  }

  // 매치 위치까지 돌려주는 내부 버전. 활동 규칙은 위치를 알아야 뒤에 미래형 어미가
  // 붙었는지(=아직 안 한 계획인지) 확인할 수 있어서 boolean만 주던 matchesActive를
  // 감싸는 형태로 바꿨다. 부정 인식(안/못/아니) 로직은 그대로다.
  function activeMatches(text, pattern, respectActionNegation = false, includeNegated = false) {
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
      const negated = prefixed || suffixed || (respectActionNegation && actionNegated);
      // 걸러진 매치도 필요할 때가 있다 — 활동 규칙은 "부정됐다"는 사실 자체를
      // 걱정 응답의 근거로 써야 해서, 조용히 버리면 그 문장이 무응답이 된다.
      if (!negated || includeNegated) {
        results.push({ index: match.index, end: match.index + match[0].length, text: match[0], negated });
      }
      if (!match[0].length) matcher.lastIndex += 1;
    }
    return results;
  }

  function matchesActive(text, pattern, respectActionNegation = false) {
    return activeMatches(text, pattern, respectActionNegation).length > 0;
  }

  /* 어휘 자체가 "안 했다"인 표현들. 활동 규칙은 동사를 찾는데, "밥은 걸렀지만"에는
     찾을 동사가 없어서 절 가드까지 도달하지 못한다. 그래서 이 셋만 따로 본다. */
  const SKIPPED_CARE_RULES = [
    ["meal", "식사 챙김", /(?:밥|끼니|아침|점심|저녁|식사)[^.!?]{0,8}(?:걸렀|거르|거른|굶|건너뛰|스킵|빼먹)|굶었|굶고|굶어|끼니\s*(?:를)?\s*(?:걸|거르)/],
    ["hygiene", "씻기 완료", /씻(?:는|기)?\s*(?:것)?\s*(?:을|를)?\s*(?:걸렀|건너뛰|스킵)|샤워\s*(?:를)?\s*(?:걸렀|스킵|건너뛰)|양치\s*(?:를)?\s*(?:걸렀|스킵|빼먹)/],
    ["rest", "충분히 쉬기", /잠\s*(?:을|도)?\s*(?:거의)?\s*(?:못|안)\s*(?:잤|자|잠)|밤\s*(?:을)?\s*샜|밤새웠|한숨도\s*못\s*잤|잠\s*못\s*들/]
  ];

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

  const THIRD_PARTY_SUBJECT = /(?:친구|엄마|아빠|어머니|아버지|부모님|동생|언니|오빠|누나|형|남친|여친|애인|남편|아내|아이|아들|딸|동료|팀장|상사)(?:가|이)\s*/;
  const THIRD_PARTY_COMPANION = /(?:친구|엄마|아빠|어머니|아버지|부모님|동생|언니|오빠|누나|형|남친|여친|애인|남편|아내|아이|아들|딸|동료|팀장|상사)(?:이?랑|하고|와|과)\s*/;
  const FIRST_PERSON_SUBJECT = /(?:^|[\s,])(?:나|난|나는|내가|나도|저|전|저는|제가|저도)(?:[\s,]|$)/;

  function thirdPartyOnlyClause(value) {
    const clause = String(value || "");
    return THIRD_PARTY_SUBJECT.test(clause)
      && !THIRD_PARTY_COMPANION.test(clause)
      && !FIRST_PERSON_SUBJECT.test(clause);
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
    // 부정된 행동은 따로 모은다. 칭찬으로 이어지지 않게 막는 것이 1차 목적이고,
    // 돌봄 행동이면 걱정 응답의 근거가 되므로 버리지 않고 들고 나간다.
    const negatedActivities = [];
    const clauses = negationClauses(text);
    const completedClauses = new Set();
    for (const [type, label, pattern] of ACTIVITY_RULES) {
      for (const found of activeMatches(text, pattern, true, true)) {
        const clause = clauseFor(clauses, found.index);
        // 제3자가 한 행동은 사용자의 대업이 아니다. "친구랑 운동했어"처럼 사용자가
        // 함께 했다고 적은 경우만 통과시킨다.
        if (thirdPartyOnlyClause(clause.text)) continue;
        /* 하드 가드 — 이 행동이 속한 절이 부정이거나 하다 만 것이면 어떤 경로로도
           대업이 될 수 없다. 그만둔 행동을 activities에 남겨두면 여기서는 완료
           판정만 막아도, 칭호 선택과 다중 행동 대사가 그 배열을 통째로 읽어서
           "운동하려다 말았는데 샤워는 했어"에 운동 대업이 발행된다. */
        if (found.negated || isNegatedClause(clause.text) || ABANDONED_MARK.test(clause.text)) {
          if (!negatedActivities.some(item => item.label === label)) {
            negatedActivities.push({ type, label, snippet: cleanSnippet(clause.text) });
          }
          continue;
        }
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
          const carried = /고\s*$/.test(clause.text.trim())
            && !CARRY_BLOCKING_INTENT.test(clause.text)
            && CARRIED_COMPLETION_TAIL.test(nextClauseTextAfter(clauses, clause));
          const completed = COMPLETION_MARK.test(clause.text) || hasPastTense(clause.text) || endsWithNominalizer(clause.text) || carried;
          if (completed && !ABANDONED_MARK.test(clause.text)) completedClauses.add(label);
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
    // 업무 키워드 하나로 work를 밀어넣으면 "내일 발표 잘 됐으면 좋겠다"(희망)에도
    // 출근 인사가 나간다. 키워드가 든 절을 보고 갈래를 나눈다:
    // 희망·예정 절이면 업무 인텐트 자체를 만들지 않고,
    // 완료 절이면 work_done(다녀온 사람), 나머지만 work(가는 사람)다.
    const workKeyword = /회사|업무|출근|퇴근|야근|발표|회의/i.exec(text);
    if (workKeyword) {
      const workClause = clauseFor(clauses, workKeyword.index).text;
      const hopeful = /(?:었|았|됐)으면|좋겠|바라|기원|예정/.test(workClause);
      const vagueIncident = /(?:회사|직장)(?:에서|에)?[^.!?]{0,10}(?:무슨\s*)?일(?:이|은|도)?[^.!?]{0,5}(?:있었|생겼|터졌)/.test(workClause);
      if (!hopeful && !vagueIncident) {
        intents.push("work");
        // 출근·퇴근은 이동 자체가 화제라 완료형이어도 기존 흐름(commute/귀가)을 탄다.
        if (hasPastTense(workClause) && !/출근|퇴근/.test(workClause)) intents.push("work_done");
      }
    }
    if (activityTypes.includes("commute")) intents.push("commute");
    if (activityTypes.includes("meal")) intents.push("meal");
    if (activityTypes.includes("exercise")) intents.push("exercise");
    if (activityTypes.includes("hygiene")) intents.push("hygiene");
    if (activityTypes.includes("social")) intents.push("social");
    if (activities.length) intents.push("activity");

    // 돌봄을 걸렀다는 보고는 대업이 아니라 걱정 사유다. no_motivation("아무것도
    // 하기 싫다")과는 다른 사실이라 인텐트를 따로 둔다 — 바빠서 점심을 거른
    // 사람에게 "아무것도 하기 싫은 날도 있다"고 답하면 못 알아들은 것이다.
    for (const [type, label, pattern] of SKIPPED_CARE_RULES) {
      if (!pattern.test(text)) continue;
      if (!negatedActivities.some(item => item.label === label)) {
        negatedActivities.push({ type, label, snippet: cleanSnippet(clauseFor(clauses, text.search(pattern)).text) });
      }
    }
    const skippedCare = negatedActivities.filter(item => CARE_TYPES.has(item.type));
    if (skippedCare.length) {
      intents.push("skipped_care");
      moods.push("worried");
      sentiments.push("negative");
    }

    const moodPriority = ["tired", "sad", "angry", "worried", "low", "hungry", "bored", "happy", "affection"];
    const mood = moodPriority.find(item => moods.includes(item)) || null;
    const negative = sentiments.includes("negative");
    const meaningfulActivity = activityTypes.some(type => !["rest", "commute"].includes(type));
    // 완료 근거가 없거나 불확실한 서술이면 대업 경로로 보내지 않는다. 칭호가 틀리는
    // 것은 칭호가 없는 것보다 훨씬 아프다 — "설거지"만 적힌 문장은 아직 할 일일 수도 있다.
    const completedMeaningful = activities.some((label, index) => !["rest", "commute"].includes(activityTypes[index]) && completedClauses.has(label));
    const uncertain = UNCERTAIN_MARK.test(text);
    const achievementCandidate = meaningfulActivity && completedMeaningful && !uncertain
      && !(nothing && activities.every((_, index) => activityTypes[index] === "rest"));
    if (achievementCandidate) intents.push("achievement");
    if (!intents.length) intents.push("freeform");
    const uniqueIntents = [...new Set(intents)];
    // 반응 강도. 감정이 부정적이면 행동이 있어도 위로가 먼저다.
    // 다만 감정 표현 없이 완료 행동만 보고한 경우는, 그게 아무리 하찮아도
    // 과잉집사의 본체인 대업 판정(FORM 05)으로 보낸다. 씻기·물 마시기·설거지가 핵심 재료다.
    // 성공 어휘 뒤에 가정·희망 어미가 붙으면 아직 일어난 일이 아니다 (goodnews와 같은 가드).
    const bigWin = /(?:합격|수상|우승|승진|성공|1등|최우수|드디어|붙었|뽑혔|당첨|취직)(?!(?:했|됐|하|되)?(?:았|었)?으?면|하고\s*싶|되고\s*싶|하길|되길|하기를|되기를)/i.test(text) || (mood === "happy" && /칭찬/i.test(text));
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
      negatedActivities,
      skippedCare,
      mood,
      toneShift,
      sentiment,
      priority,
      achievementCandidate: Boolean(achievementCandidate),
      /* 칭호는 원문 전체가 아니라 부정·포기 절을 뺀 텍스트에서 뽑는다.
         원문을 그대로 훑으면 "운동하려다 말았는데 샤워는 했어"의 칭호가
         하다 만 운동에서 나온다. */
      achievementTitle: achievementCandidate
        ? achievementTitle(
            clauses.filter(clause => !isNegatedClause(clause.text) && !ABANDONED_MARK.test(clause.text))
              .map(clause => clause.text).join(" "),
            activities, mood)
        : "",
      responseMode,
      confidence: Number(Math.min(0.98, 0.42 + hitCount * 0.09).toFixed(2)),
      keywords: keywordsFor(text)
    };
  }

  return Object.freeze({ analyzeUserMessage, matchesActive, stripNegatedClauses, intents: Object.freeze(INTENT_TYPES), moods: Object.freeze(MOOD_TYPES) });
});

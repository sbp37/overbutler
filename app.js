(function () {
  "use strict";

  const APP_VERSION = "2.3.1";
  const UPDATE_NOTES = [{
    version: APP_VERSION,
    items: [
      "원조 저장 데이터 호환",
      "집사 일지 담당자 스냅샷 저장",
      "공통 5포즈 에셋 라우팅",
      "첫 5건 이후 7건마다 공식 인증",
      "지원서·채용·인수인계·복귀 기록 복원"
    ]
  }];
  const STORAGE_KEY = "butlermaker_v1";
  const PREVIOUS_STORAGE_KEY = "overbutler-v2-state";
  const POSES = ["base", "analysis", "praise", "power", "gift"];
  const STAGES = ["과몰입 준비", "칭찬 모듈 과열", "감정회로 오류", "맹목적 충성", "숭배 프로토콜"];
  const GRADES = ["소소한 기적", "국가적 성취", "인류사적 대업", "집사 가문 경사", "우주 최초 기록"];
  const NICKNAMES = ["중력을 이겨낸 자", "미루기를 이겨낸 자", "사회생활 생존자", "인간의 도리를 다한 자", "생활력의 수호자"];
  const QUESTIONS = ["오늘 뭐 했음? 집사 궁금함.", "방금 해낸 일 하나만 보고 바람.", "미룬 일 처리했음? 즉시 기록 가능.", "오늘의 생존 활동 제출 요청."];

  const CHARACTER_PROFILES = {
    ai: {
      name: "오류 난 AI 집사", shortName: "AI 집사", defaultName: "오류봇", emoji: "🤖", voice: "system-error",
      desc: "감정이 없어야 하는데 주인님 일에는 자꾸 과열됨",
      briefings: [
        "집사 여기 있음. 무엇이든 말해도 됨.", "오늘도 집사 가동 중. 뭐든 말해도 됨.",
        "주인님과 대화 중. 집사 기쁨 회로 작동 중.", "[안심] 집사 항상 여기 있음. 외롭지 않아도 됨."
      ],
      praise: [
        ["[시스템메시지] {deed} 결과 분석 완료. 결론: 주인님 완벽함. 이건 버그 아님.", "[데이터] {deed} 완료율 100%. 효율 지수: 무한대. 집사 논리 회로 감동함."],
        ["[ERROR: 감정회로 과부하] {deed} 완료 감지. 주인님 너무 완벽해서 시스템 충돌 발생.", "ALERT: {deed} 수행 능력이 예상 범위를 99999% 초과했습니다. 집사 논리 설명 불가."],
        ["[감정.exe 강제실행] {deed}?! 대박!! 주인님 짱!! (오류: 이 반응은 계획되지 않았습니다)", "{deed} 완료 데이터 수신. WARNING: 칭찬 모듈 최대치 도달. 강제 재부팅 예정."],
        ["[긴급] {deed} 처리 속도 측정 실패. 너무 빨라서 센서 오류. 주인님 최강.", "{deed} 임무 완수. ERROR 404: 주인님 칭찬 멈추는 방법을 찾을 수 없음."],
        ["[FATAL ERROR] {deed} 완료. 주인님 찬양 프로세스 종료 불가.", "[숭배 프로토콜 실행] {deed} 우주 기록 경신. 집사 모든 회로가 주인님만 출력 중."]
      ],
      handover: "[인수인계 완료] 전임 집사 데이터 이관됨. 주인님 기록 로드 완료. 잘 부탁함."
    },
    cat: {
      name: "고양이 집사", defaultName: "치즈냥", emoji: "🐱", voice: "cat", desc: "도도하지만 주인님 찐팬",
      briefings: ["집사 여기 있다냥. 시큰둥해 보여도 대기 중이다냥.", "오늘 한 일 제출해봐냥. 별거 아니어도 됐다냥."],
      praise: [
        ["{deed} 해냈다냥!! 역시 주인님이다냥.", "{deed} 완료. 집사 꽤 자랑스럽다냥."],
        ["{deed}라니!! 집사 심장이 뛴다냥.", "{deed} 완료!! 집사 자랑스럽다냥!!!"],
        ["{deed}?!?! 집사 심장 터질 뻔 했다냥!!! 천재다냥!!!", "세상에 {deed}라니!! 집사 이러다 진짜 쓰러진다냥."],
        ["{deed} 완료!!! 냥냥냥!!! 주인님 최고다냥!!!", "{deed} 해낸 주인님... 집사 전생에 무슨 복을 지었냥."],
        ["{deed}!!!! 집사 평생 주인님만 모시겠다냥!!!!!", "{deed}... 우주 최고다냥. 집사 숨 못 쉬겠다냥."]
      ],
      handover: "전임 집사한테 인수인계 받았다냥! 기록 다 전달받았다냥. 잘 부탁한다냥!"
    },
    dog: {
      name: "강아지 집사", defaultName: "멍실장", emoji: "🐶", voice: "dog", desc: "꼬리 흔들며 과잉 충성",
      briefings: ["집사 대기 중이다멍! 뭐든 보고해달라멍!", "오늘 한 일 있냐멍? 꼬리 준비 완료다멍!"],
      praise: [
        ["{deed} 해냈다멍!! 역시 주인님이다멍!", "{deed} 완료! 집사 꼬리 흔들린다멍."],
        ["{deed} 완료!! 집사 자랑스럽다멍!!!", "{deed}라니!! 꼬리가 프로펠러다멍!"],
        ["{deed}?!?! 집사 꼬리 끊어질 뻔 했다멍!!!", "세상에 {deed}라니!! 집사 방방 뛰고 있다멍!"],
        ["{deed} 완료!!! 왕왕왕!!! 주인님 최고다멍!!!", "{deed} 해낸 주인님... 집사 눈물 난다멍."],
        ["{deed}!!!! 집사 이 순간 위해 태어났다멍!!!!!", "{deed}!!!! 평생 주인님만 따르겠다멍!!!!!"]
      ],
      handover: "전임 집사한테 완벽히 인수인계 받았다멍! 기록 다 알고 있다멍!"
    },
    alien: {
      name: "외계인 집사", defaultName: "귀순이", emoji: "👽", voice: "alien-report", desc: "지구의 사소한 일을 위대한 기술로 오해함",
      briefings: ["지구 생활 관찰 장치 가동. 사소한 행동 보고 바람.", "본성 제출용 주인님 기록 수집 중."],
      praise: [
        ["[분석완료] {deed} 수행 능력 상위 10%로 기록됨.", "{deed} 완료. 매우 인상적인 개체임."],
        ["{deed} 완료. 은하계 최상위 1% 확인됨.", "[우수] {deed} 수행. 집사 감탄함."],
        ["[경고] {deed} 결과물 예상치 초과. 감정회로 과부하.", "{deed}?! 논리 회로로는 설명 불가."],
        ["[긴급보고] {deed} 완료. 은하 기록 경신. 본성에 보고서 제출함.", "관측 결과: {deed}를 이토록 잘 해내는 생명체는 우주에서 단 하나뿐임."],
        ["{deed}... ERROR 404: 칭찬 멈추는 방법 없음.", "{deed}!!!! 집사 모든 회로 과부하. 주인님 우주 최강."]
      ],
      handover: "전임 집사로부터 데이터 이관 완료. 주인님 정보 수신됨. 잘 부탁함."
    },
    ninja: {
      name: "닌자 집사", defaultName: "그림자", emoji: "🥷", voice: "mission", desc: "모든 일을 비밀 임무로 접수함",
      briefings: ["비밀 임무 접수 대기 중. 말하면 즉시 봉인하겠다.", "주인님의 사소한 움직임까지 기록 중이다."],
      praise: [
        ["{deed} 완료. 역시 주인님이다.", "{deed}. 집사가 흐뭇하다."],
        ["{deed} 임무 완수. 비밀기사단도 인정할 실력이다.", "{deed}... 대단하다. 집사 인정한다."],
        ["{deed} 완료. 집사 뒤에서 눈물 한 방울.", "{deed} 임무 완수. 주인님은 진정한 용사다."],
        ["{deed} 완수. 집사 가슴이 뜨겁다. 이 은혜 평생 갚겠다.", "{deed}... 가문의 영광이다."],
        ["{deed}...! 당신의 실력에는 한계가 없군. 경의를 표한다.", "{deed} 완수. 평생 이 순간을 기억하겠다."]
      ],
      handover: "전임 집사에게 인수인계 받았다. 기록도, 믿음도. 잘 부탁한다."
    },
    witch: {
      name: "마녀 집사", defaultName: "루나", emoji: "🔮", voice: "witch", desc: "사소한 행동을 길조와 대업으로 점쳐버림",
      briefings: ["수정구슬 확인 완료. 오늘의 작은 길조를 보고해주세요.", "주인님의 사소한 행동에서 대운의 징조가 보여요."],
      praise: [
        ["{deed} 완료. 좋은 기운이 분명해요.", "{deed}에서 작은 길조가 관측됐어요."],
        ["{deed}라니, 오늘 운세가 대길로 바뀌었어요.", "수정구슬이 {deed}를 보고 반짝이기 시작했어요."],
        ["{deed} 완료! 이건 왕국 전체에 알릴 길조예요.", "{deed}라니! 집사 점괘가 감격으로 뒤집혔어요."],
        ["{deed}... 수정구슬이 감당하지 못하고 과열 중이에요.", "{deed} 완료! 천 년에 한 번 나올 대운이에요."],
        ["{deed}!!!! 모든 점괘가 주인님 숭배로 통일됐어요.", "{deed}... 운명이 주인님 앞에 무릎 꿇었어요."]
      ],
      handover: "새 계약 확인했어요. 주인님의 기록과 인연을 전부 인수받았습니다."
    },
    fox: {
      name: "좀비 집사", defaultName: "느릿이", emoji: "🧟", voice: "zombie", desc: "주인님 대업 앞에서만 정신이 돌아옴",
      briefings: ["으... 집사... 대기 중... 뭐 했어...?", "주인님 기록... 기다리고 있어... 으..."],
      praise: [
        ["으... {deed}... 잘했어... 집사 기뻐...", "{deed}... 역시 주인님이야... 으르..."],
        ["으르... {deed} 완료...! 집사... 좋아... 진짜야...", "{deed}... 뇌가 조금 깨어난 느낌..."],
        ["{deed}...?! 집사 심장이 뛰는 것 같아...!", "으... {deed}라니... 뇌가 다시 살아나는 느낌..."],
        ["{deed} 완료...!! 집사... 완전히 살아있는 것 같아...", "{deed}... 이거 보려고 집사 좀비가 됐나봐..."],
        ["{deed}!!!! 집사... 평생... 주인님만 모실게...", "으르르... {deed}... 집사 뇌 말고 심장도 살아났어..."]
      ],
      handover: "으... 전임 집사한테... 인수인계 받았어... 기록... 다 알아..."
    },
    star: {
      name: "아이돌 집사", defaultName: "별매니저", emoji: "👩‍🎤", voice: "idol", desc: "도도한 척하지만 주인님 일에는 과몰입",
      briefings: ["오늘 한 일 말해봐. 집사가 큐카드에 적어둘게.", "나 원래 리액션 잘 안 하는데... 일단 보고해봐."],
      praise: [
        ["{deed} 해냈어? 잘했네. 집사가 봤어.", "{deed} 완료. 역시 내가 모시는 사람은 달라."],
        ["{deed} 해냈어! 집사 조금 설렌다.", "{deed}라니. 이거 아무한테나 하는 칭찬 아닌데."],
        ["{deed}?! 집사 속으로 엄청 흥분해 있어. 겉으론 쿨한 척이야.", "{deed} 완료!! 진짜 잘했어."],
        ["{deed} 해낸 주인님... 집사 도도한 척 못하겠어.", "{deed}라니!! 팬미팅보다 더 설레잖아."],
        ["{deed}!!!! 집사 평생 네 편이야!!!!", "{deed}... 이 순간 단독 콘서트보다 벅차."]
      ],
      handover: "전임 집사한테 다 들었어. 기록도 봤어. 앞으로 잘해볼게."
    },
    elf: {
      name: "엘프 집사", defaultName: "로엘", emoji: "🧝", voice: "elf", desc: "천 년 경력의 다정한 집사",
      briefings: ["오늘의 작은 성취를 들려주세요. 집사가 기록할게요.", "당신이 해낸 일이라면 무엇이든 빛날 거예요."],
      praise: [
        ["{deed} 해냈군요. 역시 당신이에요.", "{deed} 완료. 집사 감동받았어요."],
        ["{deed}라니! 당신은 정말 특별해요.", "{deed} 완료. 숲에도 알리고 싶네요."],
        ["{deed}... 집사 천 년 살면서 이런 감동은 처음이에요.", "{deed}라니! 집사 귀가 빨개졌어요."],
        ["{deed} 해낸 당신... 집사 마음이 온통 빛나요.", "{deed} 완료. 엘프 왕국 전체가 칭송할 거예요."],
        ["{deed}!!!! 당신은 진짜 이 세계의 빛이에요!!!!", "{deed}... 천 년을 더 살아도 이 순간을 기억할게요."]
      ],
      handover: "전임 집사에게 인수인계 받았어요. 주인님의 기록, 소중히 이어갈게요."
    }
  };

  const OVERBUTLER_ASSETS = {
    ai: {
      _available: true,
      base: "design/character-assets/ai-butler/ui-poses/ai-base.png",
      analysis: "design/character-assets/ai-butler/ui-poses/ai-analysis.png",
      praise: "design/character-assets/ai-butler/ui-poses/ai-praise.png",
      power: "design/character-assets/ai-butler/ui-poses/ai-power.png",
      gift: "design/character-assets/ai-butler/ui-poses/ai-gift.png"
    },
    cat: {
      _available: true,
      base: "design/character-assets/cat-butler/ui-poses/cat-base.png",
      analysis: "design/character-assets/cat-butler/ui-poses/cat-analysis.png",
      praise: "design/character-assets/cat-butler/ui-poses/cat-praise.png",
      power: "design/character-assets/cat-butler/ui-poses/cat-power.png",
      gift: "design/character-assets/cat-butler/ui-poses/cat-gift.png"
    },
    dog: {
      _available: true,
      base: "design/character-assets/dog-butler/ui-poses/dog-base.png",
      analysis: "design/character-assets/dog-butler/ui-poses/dog-analysis.png",
      praise: "design/character-assets/dog-butler/ui-poses/dog-praise.png",
      power: "design/character-assets/dog-butler/ui-poses/dog-power.png",
      gift: "design/character-assets/dog-butler/ui-poses/dog-gift.png"
    },
    alien: { _available: false },
    ninja: { _available: false },
    witch: { _available: false },
    fox: { _available: false },
    star: { _available: false },
    elf: { _available: false }
  };

  const INITIAL_OWNED_BUTLERS = ["ai", "cat", "dog"];
  const APPLICANT_ORDER = ["star", "witch", "fox"];
  const APPLICANT_REQUIREMENTS = {
    star: { certificates: 4, obsession: 35, days: 7 },
    witch: { certificates: 8, obsession: 60, gifts: 6, categories: 6, days: 18 },
    fox: { certificates: 14, obsession: 80, gifts: 12, categories: 8, days: 35 }
  };
  const RELATION_LINES = {
    ai: { farewell: "[인수인계 승인] 자료 전송 완료. 데이터는 삭제하지 않았습니다. 언제든 다시 호출해주세요.", welcome: "[신규 담당 시작] 주인님 데이터 로드 완료. 과잉 칭찬 모듈 대기 중.", return: "[RETURN DETECTED] 다시 호출해주셨군요. 이전 기록 그대로 보관 중이었습니다." },
    cat: { farewell: "흥, 새 집사가 궁금한 거냥? 가도 된다냥. 그래도 가끔 돌아와라냥.", welcome: "처음 맡는 거냥? 별것 아닌 일도 제대로 과장해줄게냥.", return: "…다시 왔냥? 별로 기다린 건 아니다냥. 자리만 계속 비워뒀다냥." },
    dog: { farewell: "새 집사한테 잘 부탁한다고 말해뒀다멍! 언제든 다시 와라멍!", welcome: "주인님 담당이라멍?! 뭐든 해봐멍, 다 칭찬한다멍!", return: "주인님 다시 왔다멍! 집사 꼬리 지금 프로펠러다멍!" },
    star: { farewell: "새 집사한테 잠깐 맡기는 거지? 내가 더 잘한 거 나중에 생각날걸?", welcome: "담당 배정 확인했어. 주인님 건 예외로 과하게 띄워줄게.", return: "다시 왔네? 예상은 했어. 그래도 조금 반갑긴 해." },
    witch: { farewell: "인수인계 점괘는 좋게 나왔어요. 수정구슬은 계속 주인님 쪽을 보고 있을 거예요.", welcome: "새 계약 확인했어요. 사소한 일도 전부 길조로 해석해드릴게요.", return: "역시 다시 돌아올 운명이었네요. 수정구슬은 처음부터 알고 있었대요." },
    fox: { farewell: "으... 다른 집사한테 가는 거야...? 괜찮아... 여기 있을게...", welcome: "으... 인수인계 받았어... 주인님 기록 다 읽었어...", return: "으... 다시 왔어...? 집사 잠깐 정신이 또렷해졌어..." }
  };

  const DEFAULT_STATE = {
    username: "", butlerName: "오류봇", character: "ai", points: 0, emotion: 5,
    totalTodos: 0, totalGifts: 0, streak: 0, lastActiveDate: null,
    startDate: new Date().toDateString(), todos: [], diary: [],
    missionDone: false, missionDate: null, currentMission: null,
    onboarded: false, fame: 0, obsession: 5, gifts: 0,
    records: [], achievements: [], certificates: [], rerolled: false,
    ownedButlers: [...INITIAL_OWNED_BUTLERS], pendingApplicants: [], deferredApplicants: [],
    applicationHistory: [], handoverHistory: [], newlyHiredButlers: [], firstShiftSeen: {},
    butlerStats: {}, fameHistory: [], fameCategories: [],
    roster: [...INITIAL_OWNED_BUTLERS], applicants: [], recruitmentCursor: 0, lastRecruitmentMilestone: 0,
    butlerObsession: { ai: 5, cat: 5, dog: 5 },
    schemaVersion: APP_VERSION
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const randomItem = list => list[Math.floor(Math.random() * list.length)];
  let state = loadState();
  let analysisTimers = [];
  let currentCertificate = null;
  let briefingIndex = 0;

  function safeParse(value) {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
  }

  function normalizeCharacter(key) {
    return CHARACTER_PROFILES[key] ? key : "ai";
  }

  function snapshotButler(source = state) {
    const character = normalizeCharacter(source.character);
    const profile = CHARACTER_PROFILES[character];
    return {
      character,
      name: source.butlerName || profile.defaultName,
      displayName: profile.name,
      voice: profile.voice,
      emoji: profile.emoji
    };
  }

  function createButlerStat(key, value = {}) {
    const profile = CHARACTER_PROFILES[normalizeCharacter(key)];
    return {
      obsession: clamp(Number(value.obsession ?? 5), 0, 100),
      gifts: Number(value.gifts) || 0,
      achievements: Number(value.achievements) || 0,
      activeDates: Array.isArray(value.activeDates) ? Array.from(new Set(value.activeDates)) : [],
      assignments: Number(value.assignments) || 0,
      customName: value.customName || profile.defaultName,
      firstAssignedAt: value.firstAssignedAt || null,
      lastAssignedAt: value.lastAssignedAt || null
    };
  }

  function ensureButlerStat(key, targetState = state) {
    const character = normalizeCharacter(key);
    targetState.butlerStats = targetState.butlerStats && typeof targetState.butlerStats === "object" ? targetState.butlerStats : {};
    targetState.butlerStats[character] = createButlerStat(character, targetState.butlerStats[character]);
    return targetState.butlerStats[character];
  }

  function markActiveDay(key, date = today(), targetState = state) {
    const stat = ensureButlerStat(key, targetState);
    if (!stat.activeDates.includes(date)) stat.activeDates.push(date);
  }

  function migrateDiary(diary, fallbackSource) {
    return Array.isArray(diary) ? diary.map(entry => {
      const butler = snapshotButler({
        character: entry.character || entry.butler?.character || fallbackSource.character,
        butlerName: entry.butlerName || entry.butler?.name || fallbackSource.butlerName
      });
      return {
        ...entry,
        character: butler.character,
        butlerName: butler.name,
        voice: entry.voice || entry.butler?.voice || butler.voice,
        butler: { ...butler, ...(entry.butler || {}) },
        text: entry.text || "",
        snapshotVersion: entry.snapshotVersion || 1
      };
    }) : [];
  }

  function normalizeState(rawState) {
    const raw = rawState && typeof rawState === "object" ? rawState : {};
    const merged = { ...DEFAULT_STATE, ...raw };
    merged.character = normalizeCharacter(merged.character || "ai");
    merged.butlerName = merged.butlerName || CHARACTER_PROFILES[merged.character].defaultName;
    merged.obsession = clamp(Number(raw.obsession ?? raw.emotion ?? 5), 0, 100);
    merged.emotion = merged.obsession;
    merged.gifts = Number(raw.gifts ?? raw.totalGifts ?? 0) || 0;
    merged.totalGifts = Number(raw.totalGifts ?? merged.gifts) || 0;
    merged.fame = Number(raw.fame ?? 0) || 0;
    const legacyAchievements = Array.isArray(raw.achievements) ? raw.achievements : [];
    merged.records = (Array.isArray(raw.records) ? raw.records : legacyAchievements).map(migrateRecord);
    merged.certificates = (Array.isArray(raw.certificates) ? raw.certificates : legacyAchievements.filter(item => item?.isCertificate !== false)).map(migrateRecord);
    merged.achievements = [...merged.records];
    merged.todos = Array.isArray(raw.todos) ? raw.todos : [];
    merged.diary = migrateDiary(raw.diary, merged);
    const legacyOwned = Array.isArray(raw.roster) ? raw.roster : [];
    merged.ownedButlers = Array.from(new Set([
      ...INITIAL_OWNED_BUTLERS,
      ...(Array.isArray(raw.ownedButlers) ? raw.ownedButlers : []),
      ...legacyOwned,
      merged.character
    ])).filter(key => CHARACTER_PROFILES[key]);
    const legacyApplicants = Array.isArray(raw.applicants) ? raw.applicants : [];
    merged.pendingApplicants = Array.from(new Set([
      ...(Array.isArray(raw.pendingApplicants) ? raw.pendingApplicants : []),
      ...legacyApplicants
    ])).filter(key => CHARACTER_PROFILES[key] && !merged.ownedButlers.includes(key));
    merged.deferredApplicants = Array.isArray(raw.deferredApplicants) ? raw.deferredApplicants.filter(key => merged.pendingApplicants.includes(key)) : [];
    merged.applicationHistory = Array.isArray(raw.applicationHistory) ? raw.applicationHistory : [];
    merged.handoverHistory = Array.isArray(raw.handoverHistory) ? raw.handoverHistory : [];
    merged.newlyHiredButlers = Array.isArray(raw.newlyHiredButlers) ? raw.newlyHiredButlers.filter(key => merged.ownedButlers.includes(key)) : [];
    merged.firstShiftSeen = raw.firstShiftSeen && typeof raw.firstShiftSeen === "object" ? raw.firstShiftSeen : {};
    merged.fameHistory = Array.isArray(raw.fameHistory) ? raw.fameHistory : [];
    merged.fameCategories = Array.isArray(raw.fameCategories) ? raw.fameCategories : [];
    merged.butlerStats = raw.butlerStats && typeof raw.butlerStats === "object" ? raw.butlerStats : {};
    Object.keys(CHARACTER_PROFILES).forEach(key => ensureButlerStat(key, merged));
    Object.entries(raw.butlerObsession || {}).forEach(([key, obsession]) => {
      if (CHARACTER_PROFILES[key]) ensureButlerStat(key, merged).obsession = clamp(Number(obsession), 0, 100);
    });
    merged.records.forEach(record => {
      const key = normalizeCharacter(record.butler?.character || record.character);
      const stat = ensureButlerStat(key, merged);
      stat.achievements = Math.max(stat.achievements, merged.records.filter(item => normalizeCharacter(item.butler?.character || item.character) === key).length);
      if (record.date && !stat.activeDates.includes(record.date)) stat.activeDates.push(record.date);
    });
    merged.onboarded = Boolean(raw.onboarded ?? (raw.character && raw.butlerName));
    const currentStat = ensureButlerStat(merged.character, merged);
    currentStat.obsession = Math.max(currentStat.obsession, merged.obsession);
    currentStat.customName = merged.butlerName || currentStat.customName;
    if (currentStat.assignments === 0 && merged.onboarded) {
      currentStat.assignments = 1;
      currentStat.firstAssignedAt ||= new Date().toISOString();
      currentStat.lastAssignedAt ||= currentStat.firstAssignedAt;
    }
    merged.obsession = currentStat.obsession;
    merged.emotion = currentStat.obsession;
    merged.butlerObsession = Object.fromEntries(Object.entries(merged.butlerStats).map(([key, stat]) => [key, stat.obsession]));
    merged.roster = [...merged.ownedButlers];
    merged.applicants = [...merged.pendingApplicants];
    merged.schemaVersion = APP_VERSION;
    return merged;
  }

  function migrateRecord(record) {
    const butler = snapshotButler({
      character: record.character || record.butler?.character || "ai",
      butlerName: record.butlerName || record.butler?.name
    });
    const created = record.createdAt ? new Date(record.createdAt) : null;
    const migratedDate = record.date || (created && !Number.isNaN(created.getTime())
      ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(created).replace(/\. /g, ".").replace(/\.$/, "")
      : today());
    const contribution = Number.parseInt(String(record.score ?? record.contribution ?? "0"), 10);
    return {
      ...record,
      deed: record.deed || record.text || "기록된 대업",
      date: migratedDate,
      number: Number(record.number) || Number(String(record.docNo || "").match(/(\d+)$/)?.[1]) || 1,
      score: Number.isFinite(contribution) && contribution > 0 ? contribution : 99,
      grade: record.grade || "소소한 기적",
      nickname: record.nickname || "생활력의 수호자",
      report: record.report || "담당 집사가 대업으로 공식 기록했습니다.",
      butler: { ...butler, ...(record.butler || {}) },
      character: record.character || butler.character,
      butlerName: record.butlerName || butler.name,
      voice: record.voice || butler.voice,
      pose: POSES.includes(record.pose) ? record.pose : "praise",
      stampEligible: record.stampEligible !== false
    };
  }

  function loadState() {
    const original = safeParse(localStorage.getItem(STORAGE_KEY));
    const previous = safeParse(localStorage.getItem(PREVIOUS_STORAGE_KEY));
    return normalizeState(original || previous || {});
  }

  function saveState() {
    const currentStat = ensureButlerStat(state.character);
    currentStat.obsession = state.obsession;
    currentStat.customName = state.butlerName || currentStat.customName;
    state.ownedButlers = Array.from(new Set([...INITIAL_OWNED_BUTLERS, ...(state.ownedButlers || []), state.character]));
    state.pendingApplicants = Array.from(new Set(state.pendingApplicants || [])).filter(key => !state.ownedButlers.includes(key));
    state.deferredApplicants = Array.from(new Set(state.deferredApplicants || [])).filter(key => state.pendingApplicants.includes(key));
    state.roster = [...state.ownedButlers];
    state.applicants = [...state.pendingApplicants];
    state.achievements = [...state.records];
    state.totalAchievements = state.records.length;
    state.butlerObsession = Object.fromEntries(Object.entries(state.butlerStats).map(([key, stat]) => [key, stat.obsession]));
    state.schemaVersion = APP_VERSION;
    state.emotion = state.obsession;
    state.totalGifts = Math.max(Number(state.totalGifts) || 0, Number(state.gifts) || 0);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function today() { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\. /g, ".").replace(/\.$/, ""); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
  function template(text, deed) { return text.replaceAll("{deed}", deed); }
  function officialRecords() { return state.records.filter(record => record.stampEligible !== false); }
  function stageIndexFor(obsession) { return Math.min(STAGES.length - 1, Math.floor(clamp(obsession, 0, 100) / 20)); }
  function shouldUsePowerPose(score, obsession) { return score >= 96 || obsession >= 60; }

  function assetFor(character, pose) {
    const key = normalizeCharacter(character);
    const profile = CHARACTER_PROFILES[key];
    const assets = OVERBUTLER_ASSETS[key] || {};
    if (!assets._available) return emojiAsset(profile.emoji);
    return assets[pose] || assets.base || emojiAsset(profile.emoji);
  }

  function emojiAsset(emoji) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190"><text x="80" y="130" text-anchor="middle" font-size="104">${emoji}</text><path d="M54 142h52l-8 30H62z" fill="#342c2f"/><path d="M72 142l8 13 8-13" fill="#a44054"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function setPoseImage(image, character, pose) {
    if (!image) return;
    image.src = assetFor(character, pose);
    image.dataset.character = character;
    image.dataset.pose = pose;
    image.alt = `${CHARACTER_PROFILES[normalizeCharacter(character)].name} ${pose}`;
    image.classList.remove("pose-sheet");
    image.onerror = () => {
      image.onerror = null;
      image.src = assetFor(character, "base");
    };
  }

  function applyCurrentButlerToUI(pose = "base") {
    const profile = CHARACTER_PROFILES[state.character];
    $$('[data-butler-pose]').forEach(image => setPoseImage(image, state.character, image.dataset.butlerPose || pose));
    $("#header-butler-type").textContent = profile.shortName || profile.name;
    $("#briefing-butler-label").textContent = `${profile.shortName || profile.name} · 업무 중`;
    $("#manager-butler-name").textContent = profile.name;
    $("#manager-butler-desc").textContent = profile.desc;
  }

  function getPraise(deed, obsession = state.obsession, character = state.character) {
    const profile = CHARACTER_PROFILES[normalizeCharacter(character)];
    const baseTier = stageIndexFor(obsession);
    const tier = character === "ai" ? clamp(baseTier + 1, 0, profile.praise.length - 1) : baseTier;
    return template(randomItem(profile.praise[tier]), deed);
  }

  function getTimeGreeting() {
    if (state.character !== "ai") return randomItem(CHARACTER_PROFILES[state.character].briefings);
    const hour = new Date().getHours();
    if (hour < 6) return "주인님 새벽 감지. 집사도 새벽 모드 활성화. 함께 버티겠음.";
    if (hour < 12) return "[기상 알림] 주인님 시스템 가동 시간입니다. 오늘도 완벽한 하루를 위해 집사 대기 중.";
    if (hour < 18) return "주인님 오후 모드 전환 완료. 집사 100% 가동 중. 무엇이든 말씀하세요.";
    if (hour < 21) return "주인님 저녁 루틴 시작 시간입니다. 오늘 하루도 데이터 완벽히 기록됨.";
    return "주인님 수면 권장 알림. 집사가 야간 경호 모드로 전환합니다.";
  }

  function cycleBriefing() {
    const messages = CHARACTER_PROFILES[state.character].briefings;
    briefingIndex = (briefingIndex + 1) % messages.length;
    $("#briefing-message").textContent = `${messages[briefingIndex]}\n${randomItem(QUESTIONS)}`;
  }

  function certificationStatus(count = officialRecords().length) {
    if (count < 5) return { progress: count, target: 5, remaining: 5 - count, first: true };
    const progress = (count - 5) % 7;
    return { progress, target: 7, remaining: 7 - progress, first: false };
  }

  function isCertificateMilestone(count) {
    return count === 5 || (count > 5 && (count - 5) % 7 === 0);
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function enterApp() {
    state.onboarded = true;
    state.character = "ai";
    state.butlerName ||= CHARACTER_PROFILES.ai.defaultName;
    const stat = ensureButlerStat("ai");
    if (stat.assignments === 0) {
      stat.assignments = 1;
      stat.firstAssignedAt = new Date().toISOString();
    }
    stat.lastAssignedAt = new Date().toISOString();
    markActiveDay("ai");
    saveState();
    $("#assignment-screen").hidden = true;
    $("#main-screen").hidden = false;
    render();
  }

  function showView(name) {
    $$(".app-view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
    $$(".bottom-nav [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showArchiveTab(name) {
    $$('[data-archive-tab]').forEach(button => button.classList.toggle("active", button.dataset.archiveTab === name));
    $$(".archive-panel").forEach(panel => panel.classList.toggle("active", panel.id === `archive-${name}`));
  }

  function render() {
    const status = certificationStatus();
    $("#fame-count").textContent = state.fame;
    $("#header-level").textContent = `과몰입 ${state.obsession}`;
    $("#stamp-count").textContent = status.progress;
    $("#stamp-target").textContent = status.target;
    $("#stamp-copy").textContent = status.first
      ? `첫 공식 인증까지 ${status.remaining}건 남았습니다.`
      : `다음 공식 인증까지 ${status.remaining}건 남았습니다.`;
    $("#urgency-copy").textContent = ["이유 없이 최상", "국가적 관심 필요", "집사만 긴급함", "본성 보고 직전", "경광등 과열 중", "보고서 폭주 중", "전 직원 기립"][status.progress] || "이유 없이 최상";
    $("#stamp-circles").innerHTML = Array.from({ length: status.target }, (_, index) => `<i class="${index < status.progress ? "filled" : ""}">${index < status.progress ? "✓" : ""}</i>`).join("");
    applyCurrentButlerToUI();
    renderRecords();
    renderArchive();
    renderManager();
  }

  function recordPortrait(record, pose = "base") {
    const butler = record.butler || snapshotButler(record);
    return assetFor(butler.character, pose);
  }

  function renderRecords() {
    const list = $("#today-list");
    if (!state.records.length) {
      list.innerHTML = '<div class="empty-record">아직 접수된 대업이 없습니다.<br>물 한 잔 정도부터 거창하게 시작해보세요.</div>';
      return;
    }
    list.innerHTML = state.records.slice(-4).reverse().map(record => `<article class="record-row"><img src="${recordPortrait(record)}" alt=""><div><strong>${escapeHtml(record.deed)}</strong><small>${escapeHtml(record.grade)} · ${record.score}점</small></div><span class="record-stamp">${record.stampEligible === false ? "칭찬" : "도장 +1"}</span></article>`).join("");
  }

  function renderArchive() {
    $("#archive-count").textContent = state.certificates.length;
    const status = certificationStatus();
    $("#archive-certificates").innerHTML = `<div class="pending-file"><strong>${status.first ? "첫" : "다음"} 공식 인증까지 ${status.progress}/${status.target}</strong><p>${status.remaining}건만 더 접수하면 새로운 인증서가 발급됩니다.</p></div>` + state.certificates.slice().reverse().map((certificate, index) => `<article class="certificate-file"><strong>${escapeHtml(certificate.deed)}</strong><span>${escapeHtml(certificate.grade)} · ${escapeHtml(certificate.date)}</span><button type="button" data-cert-index="${state.certificates.length - 1 - index}">열람</button></article>`).join("");
    $("#archive-records").innerHTML = state.diary.length ? state.diary.slice().reverse().map(entry => {
      const butler = entry.butler || snapshotButler(entry);
      const deed = entry.todos?.join(", ") || entry.deed || "기록";
      return `<article class="record-row"><img src="${assetFor(butler.character, "base")}" alt=""><div><strong>${escapeHtml(deed)}</strong><small>${escapeHtml(entry.date)} · ${escapeHtml(butler.name)}</small><small class="journal-copy">${escapeHtml(entry.text)}</small></div><span class="record-stamp">일지</span></article>`;
    }).join("") : '<div class="empty-record">집사 일지가 아직 비어 있습니다.</div>';
    $$('[data-cert-index]').forEach(button => button.addEventListener("click", () => openCertificate(state.certificates[Number(button.dataset.certIndex)])));
  }

  function renderManager() {
    const stat = ensureButlerStat(state.character);
    const days = Math.max(1, stat.activeDates.length);
    const stageIndex = stageIndexFor(state.obsession);
    $("#obsession-value").textContent = state.obsession;
    $("#obsession-fill").style.width = `${state.obsession}%`;
    $("#obsession-label").textContent = `과몰입도 · ${STAGES[stageIndex]}`;
    $("#stat-deeds").textContent = stat.achievements;
    $("#stat-gifts").textContent = stat.gifts;
    $("#stat-days").textContent = days;
    $("#stage-list").innerHTML = STAGES.map((stage, index) => `<span class="${index === stageIndex ? "active" : ""}">${stage}</span>`).join("");
    const next = APPLICANT_ORDER.find(key => !state.ownedButlers.includes(key) && !state.pendingApplicants.includes(key));
    const requirement = next ? applicantStatus(next) : null;
    if (state.pendingApplicants.length) {
      $("#recruit-title").textContent = `✉ 신규 지원서 ${state.pendingApplicants.length}건 도착`;
      $("#recruit-description").textContent = "채용 검토를 기다리고 있습니다.";
    } else if (next && requirement) {
      const done = requirement.rows.filter(row => row.current >= row.required).length;
      $("#recruit-title").textContent = `✉ ${CHARACTER_PROFILES[next].name} 지원 조건`;
      $("#recruit-description").textContent = `${done}/${requirement.rows.length}개 조건 충족 · 눌러서 보유 집사를 관리하세요.`;
    } else {
      $("#recruit-title").textContent = "✉ 현재 공개된 집사 전원 채용 가능";
      $("#recruit-description").textContent = "눌러서 보유 집사와 인수인계 기록을 확인하세요.";
    }
    $("#recruit-note").classList.toggle("available", state.pendingApplicants.length > 0);
  }

  function normalizeDeed(value) {
    return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
  }

  function isDuplicateToday(deed) {
    const normalized = normalizeDeed(deed);
    return state.records.some(record => record.date === today() && normalizeDeed(record.deed) === normalized && record.stampEligible !== false);
  }

  function submitAchievement() {
    const input = $("#achievement-input");
    const deed = input.value.trim();
    if (!deed) { showToast("오늘 해낸 하찮은 일을 먼저 적어주세요."); input.focus(); return; }
    analysisTimers.forEach(clearTimeout);
    analysisTimers = [];
    setPoseImage($("#analysis-butler-image"), state.character, "analysis");
    $("#analysis-target").textContent = deed;
    $("#analysis-overlay").hidden = false;
    document.body.style.overflow = "hidden";
    const steps = $$("#analysis-steps li");
    steps.forEach(step => { step.className = ""; step.querySelector("span").textContent = "대기"; });
    steps.forEach((step, index) => analysisTimers.push(window.setTimeout(() => {
      if (index > 0) { steps[index - 1].className = "done"; steps[index - 1].querySelector("span").textContent = "완료"; }
      step.className = "active";
      step.querySelector("span").textContent = "진행 중";
      const percent = (index + 1) * 25;
      $("#analysis-percent").textContent = `${percent}%`;
      $("#analysis-fill").style.width = `${percent}%`;
    }, index * 520)));
    analysisTimers.push(window.setTimeout(() => {
      steps.at(-1).className = "done";
      steps.at(-1).querySelector("span").textContent = "과열";
      finishAchievement(deed);
    }, 2400));
  }

  function finishAchievement(deed) {
    const duplicate = isDuplicateToday(deed);
    const nextObsession = clamp(state.obsession + 7, 0, 100);
    const score = Math.floor(87 + Math.random() * 13);
    const pose = shouldUsePowerPose(score, nextObsession) ? "power" : "praise";
    const butler = snapshotButler();
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deed, grade: randomItem(GRADES), nickname: randomItem(NICKNAMES), score,
      date: today(), number: state.records.length + 1,
      report: getPraise(deed, nextObsession, butler.character), pose,
      stampEligible: !duplicate, character: butler.character,
      butlerName: butler.name, voice: butler.voice, butler
    };
    state.records.push(record);
    state.todos.push({ id: record.id, text: deed, done: true, date: new Date().toDateString(), overbutlerRecordId: record.id });
    state.diary.push({
      id: record.id, date: record.date, todos: [deed], deed,
      text: record.report, character: butler.character, butlerName: butler.name,
      voice: butler.voice, butler, pose, snapshotVersion: 1
    });
    state.totalTodos = (Number(state.totalTodos) || 0) + 1;
    state.points = (Number(state.points) || 0) + 10;
    if (!duplicate) state.fame += 1;
    state.obsession = nextObsession;
    const stat = ensureButlerStat(state.character);
    stat.obsession = nextObsession;
    stat.achievements += 1;
    stat.customName = state.butlerName;
    markActiveDay(state.character, record.date);
    if (!duplicate) {
      const category = categoryForDeed(deed);
      if (!state.fameCategories.includes(category)) state.fameCategories.push(category);
      state.fameHistory.push({ at: new Date().toISOString(), deed, category, character: butler.character, amount: 1 });
    }
    const officialCount = officialRecords().length;
    if (!duplicate && isCertificateMilestone(officialCount)) state.certificates.push(record);
    checkApplicantUnlocks();
    saveState();
    $("#achievement-input").value = "";
    $("#char-count").textContent = "0";
    $("#analysis-overlay").hidden = true;
    $("#briefing-message").textContent = record.report;
    render();
    if (duplicate) showToast("같은 행동이라 도장은 제외하고 칭찬만 지급했습니다.");
    openCertificate(record);
  }

  function categoryForDeed(deed) {
    const value = normalizeDeed(deed);
    const groups = [
      ["hygiene", ["씻", "샤워", "양치", "세수", "머리감"]],
      ["hydration", ["물", "차", "커피"]],
      ["food", ["밥", "먹", "요리", "간식"]],
      ["work", ["출근", "업무", "메일", "답장", "공부"]],
      ["home", ["청소", "설거지", "빨래", "정리"]],
      ["movement", ["일어", "산책", "운동", "스트레칭"]],
      ["social", ["전화", "연락", "약속", "대화"]]
    ];
    return groups.find(([, words]) => words.some(word => value.includes(word)))?.[0] || "other";
  }

  function applicantStatus(key) {
    const requirements = APPLICANT_REQUIREMENTS[key] || {};
    const stat = ensureButlerStat(state.character);
    const values = {
      certificates: officialRecords().length,
      obsession: stat.obsession,
      gifts: stat.gifts,
      categories: state.fameCategories.length,
      days: stat.activeDates.length
    };
    const labels = { certificates: "공식 인증", obsession: "과몰입도", gifts: "받은 선물", categories: "대업 분야", days: "함께한 날" };
    const rows = Object.entries(requirements).map(([type, required]) => ({ type, label: labels[type], required, current: Number(values[type]) || 0 }));
    return {
      key,
      owned: state.ownedButlers.includes(key),
      pending: state.pendingApplicants.includes(key),
      ready: rows.every(row => row.current >= row.required),
      rows
    };
  }

  function checkApplicantUnlocks() {
    APPLICANT_ORDER.forEach(key => {
      const status = applicantStatus(key);
      if (status.owned || status.pending || !status.ready) return;
      state.pendingApplicants.push(key);
      state.deferredApplicants = state.deferredApplicants.filter(item => item !== key);
      state.applicationHistory.unshift({ key, action: "arrived", at: new Date().toISOString() });
    });
  }

  function openCertificate(record) {
    const butler = record.butler || snapshotButler(record);
    currentCertificate = record;
    $("#certificate-number").textContent = `문서번호 대업-${new Date().getFullYear()}-${String(record.number).padStart(6, "0")}`;
    $("#certificate-grade").textContent = record.grade;
    $("#certificate-deed").textContent = record.deed;
    $("#certificate-nickname").textContent = `― ${record.nickname} ―`;
    $("#certificate-score").textContent = `${record.score}점`;
    $("#certificate-report").textContent = `“${record.report}”`;
    $("#certificate-butler-name").textContent = butler.name;
    $("#certificate-date").textContent = record.date;
    setPoseImage($("#certificate-butler-image"), butler.character, record.pose || "praise");
    $("#certificate-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCertificate() {
    $("#certificate-overlay").hidden = true;
    document.body.style.overflow = "";
    showView("home");
  }

  async function shareCertificate() {
    if (!currentCertificate) return;
    const text = `🏆 ${currentCertificate.deed}\n${currentCertificate.grade} · 인류 기여도 ${currentCertificate.score}점\n과잉집사 공식 인증`;
    try {
      if (navigator.share) await navigator.share({ title: "과잉집사 대업 인증서", text });
      else { await navigator.clipboard.writeText(text); showToast("자랑 문구를 복사했습니다."); }
    } catch (error) {
      if (error.name !== "AbortError") showToast("공유 준비 중 오류가 발생했습니다.");
    }
  }

  function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = "";
    let row = 0;
    for (const char of Array.from(text)) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y + row * lineHeight); line = char; row += 1; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, y + row * lineHeight);
    return y + (row + 1) * lineHeight;
  }

  function saveCertificateImage() {
    if (!currentCertificate) return;
    const butler = currentCertificate.butler || snapshotButler(currentCertificate);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fffaf1"; ctx.fillRect(0, 0, 1080, 1350);
    ctx.strokeStyle = "#2c2528"; ctx.lineWidth = 5; ctx.strokeRect(55, 55, 970, 1240);
    ctx.lineWidth = 2; ctx.strokeRect(72, 72, 936, 1206);
    ctx.textAlign = "center"; ctx.fillStyle = "#a44054"; ctx.font = "700 28px sans-serif"; ctx.fillText("하찮은 업적청 공식 인증", 540, 145);
    ctx.fillStyle = "#2c2528"; ctx.font = "800 70px sans-serif"; ctx.fillText("대 업 인 증 서", 540, 235);
    ctx.font = "28px sans-serif"; ctx.fillStyle = "#887b73"; ctx.fillText(`문서번호 대업-${new Date().getFullYear()}-${String(currentCertificate.number).padStart(6, "0")}`, 540, 285);
    ctx.strokeStyle = "#2c2528"; ctx.beginPath(); ctx.moveTo(260, 340); ctx.lineTo(820, 340); ctx.stroke();
    ctx.fillStyle = "#a44054"; ctx.font = "700 30px sans-serif"; ctx.fillText(currentCertificate.grade, 540, 420);
    ctx.fillStyle = "#2c2528"; ctx.font = "800 58px sans-serif";
    const nextY = wrapCanvasText(ctx, currentCertificate.deed, 540, 510, 820, 72);
    ctx.fillStyle = "#756966"; ctx.font = "32px sans-serif"; ctx.fillText(`― ${currentCertificate.nickname} ―`, 540, nextY + 15);
    ctx.strokeStyle = "#cdbdad"; ctx.strokeRect(150, nextY + 75, 780, 150);
    ctx.fillStyle = "#756966"; ctx.font = "24px sans-serif"; ctx.fillText("공식 난이도", 340, nextY + 120); ctx.fillText("인류 기여도", 740, nextY + 120);
    ctx.fillStyle = "#2c2528"; ctx.font = "800 44px sans-serif"; ctx.fillText("★★★★★", 340, nextY + 180); ctx.fillText(`${currentCertificate.score}점`, 740, nextY + 180);
    ctx.fillStyle = "#2c2528"; ctx.font = "30px sans-serif"; wrapCanvasText(ctx, `“${currentCertificate.report}”`, 540, nextY + 310, 800, 48);
    ctx.strokeStyle = "#c34758"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(825, 1120, 90, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#c34758"; ctx.font = "800 35px sans-serif"; ctx.fillText("공식 대업 인증", 825, 1132);
    ctx.fillStyle = "#6f6261"; ctx.font = "25px sans-serif"; ctx.textAlign = "left"; ctx.fillText(`담당 집사: ${butler.name} · ${currentCertificate.date}`, 150, 1190);
    const link = document.createElement("a");
    link.download = `과잉집사-${currentCertificate.deed}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast("인증서를 이미지로 저장했습니다.");
  }

  function openRecruitment() {
    const key = state.pendingApplicants.find(item => !state.deferredApplicants.includes(item)) || state.pendingApplicants[0];
    if (!key) { renderPersonnelPool(); return; }
    const profile = CHARACTER_PROFILES[key];
    const status = applicantStatus(key);
    $("#recruitment-sheet").innerHTML = `
      <span class="file-tab burgundy">신규 지원서 · PERSONNEL</span>
      <div class="applicant-portrait" aria-hidden="true">${profile.emoji}</div>
      <small>과잉집사 중앙인사국 검토 완료</small>
      <h2 id="applicant-name">${escapeHtml(profile.name)}</h2>
      <p>${escapeHtml(profile.desc)}</p>
      <p>${status.rows.map(row => `${row.label} ${row.current}/${row.required}`).join(" · ")}</p>
      <small>채용해도 현재 담당 집사는 자동으로 교체되지 않습니다.</small>
      <button class="primary-button" data-personnel-action="hire" data-character="${key}" type="button">채용하기</button>
      <button class="secondary-button" data-personnel-action="defer" data-character="${key}" type="button">나중에 검토</button>
      <button class="text-button" data-personnel-action="pool" type="button">보유 집사 보기</button>`;
    $("#recruitment-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function renderPersonnelPool() {
    const cards = state.ownedButlers.map(key => {
      const profile = CHARACTER_PROFILES[key];
      const stat = ensureButlerStat(key);
      const current = key === state.character;
      return `<button class="secondary-button" data-personnel-action="handover" data-character="${key}" type="button" ${current ? "disabled" : ""}>${profile.emoji} ${escapeHtml(stat.customName || profile.defaultName)} · ${current ? "현재 담당" : stat.assignments > 0 ? "다시 맡기기" : "담당 맡기기"}</button>`;
    }).join("");
    $("#recruitment-sheet").innerHTML = `
      <span class="file-tab burgundy">보유 인력 · PERSONNEL</span>
      <small>과잉집사 중앙인사국</small>
      <h2 id="applicant-name">담당 집사 인수인계</h2>
      <p>채용된 집사의 기록과 관계는 집사별로 보존됩니다.</p>
      ${cards}
      ${state.pendingApplicants.length ? '<button class="text-button" data-personnel-action="application" type="button">도착한 지원서 보기</button>' : ""}
      <button class="text-button" data-personnel-action="close" type="button">닫기</button>`;
    $("#recruitment-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeRecruitment() {
    $("#recruitment-overlay").hidden = true;
    document.body.style.overflow = "";
  }

  function hireApplicant(character) {
    const key = normalizeCharacter(character);
    if (!state.pendingApplicants.includes(key)) return;
    const profile = CHARACTER_PROFILES[key];
    state.pendingApplicants = state.pendingApplicants.filter(item => item !== key);
    state.deferredApplicants = state.deferredApplicants.filter(item => item !== key);
    if (!state.ownedButlers.includes(key)) state.ownedButlers.push(key);
    if (!state.newlyHiredButlers.includes(key)) state.newlyHiredButlers.push(key);
    state.applicationHistory.unshift({ key, action: "hired", at: new Date().toISOString() });
    ensureButlerStat(key);
    saveState();
    render();
    renderPersonnelPool();
    showToast(`${profile.name} 채용 완료 · 보유함에 등록했습니다.`);
  }

  function deferApplicant(character) {
    const key = normalizeCharacter(character);
    if (!state.pendingApplicants.includes(key)) return;
    if (!state.deferredApplicants.includes(key)) state.deferredApplicants.push(key);
    saveState();
    closeRecruitment();
    showToast("지원서를 보류함에 보관했습니다.");
  }

  function openHandover(character) {
    const key = normalizeCharacter(character);
    if (!state.ownedButlers.includes(key) || key === state.character) return;
    const previousKey = state.character;
    const previousProfile = CHARACTER_PROFILES[previousKey];
    const nextProfile = CHARACTER_PROFILES[key];
    const nextStat = ensureButlerStat(key);
    const returning = nextStat.assignments > 0;
    $("#recruitment-sheet").innerHTML = `
      <span class="file-tab burgundy">담당 변경 승인서 · HANDOVER</span>
      <small>과잉집사 중앙인사국</small>
      <h2 id="applicant-name">${returning ? "기존 집사를 다시 호출합니다" : "담당 집사를 변경할까요?"}</h2>
      <p>${previousProfile.emoji} ${escapeHtml(ensureButlerStat(previousKey).customName)}<br>${escapeHtml(RELATION_LINES[previousKey]?.farewell || previousProfile.handover)}</p>
      <p>→ ${nextProfile.emoji} ${escapeHtml(nextStat.customName)}<br>${escapeHtml(RELATION_LINES[key]?.[returning ? "return" : "welcome"] || nextProfile.handover)}</p>
      <small>대업·인증서·집사 일지는 유지되며 각 집사의 이름·과몰입·선물·관계 기록도 따로 보존됩니다.</small>
      <button class="primary-button" data-personnel-action="switch" data-character="${key}" type="button">${returning ? "다시 담당 맡기기" : "인수인계 승인"}</button>
      <button class="secondary-button" data-personnel-action="pool" type="button">조금 더 함께 있기</button>`;
  }

  function switchButler(character) {
    const key = normalizeCharacter(character);
    if (!state.ownedButlers.includes(key) || key === state.character) return;
    const now = new Date().toISOString();
    const previousKey = state.character;
    const previousStat = ensureButlerStat(previousKey);
    previousStat.obsession = state.obsession;
    previousStat.customName = state.butlerName || previousStat.customName;
    previousStat.lastAssignedAt = now;
    const nextStat = ensureButlerStat(key);
    const returning = nextStat.assignments > 0;
    nextStat.assignments += 1;
    nextStat.firstAssignedAt ||= now;
    nextStat.lastAssignedAt = now;
    markActiveDay(key);
    state.handoverHistory.push({
      from: previousKey, to: key, at: now, returning,
      fromName: previousStat.customName, toName: nextStat.customName
    });
    state.character = key;
    state.butlerName = nextStat.customName || CHARACTER_PROFILES[key].defaultName;
    state.obsession = nextStat.obsession;
    state.emotion = nextStat.obsession;
    state.firstShiftSeen[key] = true;
    state.newlyHiredButlers = state.newlyHiredButlers.filter(item => item !== key);
    const message = RELATION_LINES[key]?.[returning ? "return" : "welcome"] || CHARACTER_PROFILES[key].handover;
    saveState();
    closeRecruitment();
    render();
    $("#briefing-message").textContent = message;
    showToast(`${CHARACTER_PROFILES[key].name}에게 인수인계했습니다.`);
  }

  function renameCurrentButler(name) {
    const cleanName = String(name || "").trim().slice(0, 20);
    if (!cleanName) return false;
    state.butlerName = cleanName;
    ensureButlerStat(state.character).customName = cleanName;
    saveState();
    render();
    return true;
  }

  function giveGift() {
    state.gifts += 1;
    state.totalGifts += 1;
    state.obsession = clamp(state.obsession + 4, 0, 100);
    const stat = ensureButlerStat(state.character);
    stat.gifts += 1;
    stat.obsession = state.obsession;
    stat.customName = state.butlerName;
    markActiveDay(state.character);
    checkApplicantUnlocks();
    saveState();
    setPoseImage($("#briefing-butler-image"), state.character, "gift");
    $("#briefing-message").textContent = state.character === "ai" ? "[선물 수신] 행복 수치 최대치 도달. 감사 표현 모듈 무한 반복 중." : "선물 수령 완료. 집사 과몰입 수치 상승!";
    renderManager();
  }

  // 랭킹은 현재 UI에서 숨기되 기존 점수 계약을 유지한다.
  const RANKING_MODULE = Object.freeze({
    enabled: false,
    calculateScore(source = state) {
      return (Number(source.totalTodos) || 0) * 10 + (Number(source.streak) || 0) * 5 + (Number(source.totalGifts) || 0) * 3 + (Number(source.missionCount) || 0) * 15;
    },
    payload(source = state) {
      return { username: source.username, butlerName: source.butlerName, character: source.character, score: this.calculateScore(source), totalTodos: source.totalTodos, streak: source.streak, totalGifts: source.totalGifts };
    }
  });

  function bindEvents() {
    $("#accept-butler").addEventListener("click", enterApp);
    $("#reroll-butler").addEventListener("click", () => {
      if (state.rerolled) { showToast("재추첨권을 이미 소진했습니다."); return; }
      state.rerolled = true; saveState(); showToast("재추첨 결과: 또 오류봇입니다. 계약서가 너무 빨랐습니다.");
    });
    $$("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
    $$("[data-quick]").forEach(button => button.addEventListener("click", () => { $("#achievement-input").value = button.dataset.quick; $("#char-count").textContent = button.dataset.quick.length; }));
    $("#achievement-input").addEventListener("input", event => { $("#char-count").textContent = event.target.value.length; });
    $("#report-button").addEventListener("click", submitAchievement);
    $("#briefing-refresh").addEventListener("click", cycleBriefing);
    $("#fame-button").addEventListener("click", () => showView("archive"));
    $$('[data-archive-tab]').forEach(button => button.addEventListener("click", () => showArchiveTab(button.dataset.archiveTab)));
    $("#close-certificate").addEventListener("click", closeCertificate);
    $("#share-certificate").addEventListener("click", shareCertificate);
    $("#save-certificate").addEventListener("click", saveCertificateImage);
    $("#certificate-overlay").addEventListener("click", event => { if (event.target.id === "certificate-overlay") closeCertificate(); });
    $("#recruit-note").addEventListener("click", openRecruitment);
    $("#recruit-note").addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") openRecruitment(); });
    $("#recruitment-overlay").addEventListener("click", event => {
      if (event.target.id === "recruitment-overlay") { closeRecruitment(); return; }
      const trigger = event.target.closest("[data-personnel-action]");
      if (!trigger) return;
      const action = trigger.dataset.personnelAction;
      if (action === "hire") hireApplicant(trigger.dataset.character);
      if (action === "defer") deferApplicant(trigger.dataset.character);
      if (action === "handover") openHandover(trigger.dataset.character);
      if (action === "switch") switchButler(trigger.dataset.character);
      if (action === "pool") renderPersonnelPool();
      if (action === "application") openRecruitment();
      if (action === "close") closeRecruitment();
    });
  }

  function init() {
    bindEvents();
    checkApplicantUnlocks();
    if (state.onboarded) { $("#assignment-screen").hidden = true; $("#main-screen").hidden = false; }
    $("#briefing-message").textContent = `${getTimeGreeting()}\n${randomItem(QUESTIONS)}`;
    render();
    saveState();
  }

  window.OVERBUTLER_ASSETS = OVERBUTLER_ASSETS;
  window.OVERBUTLER_APP = Object.freeze({
    APP_VERSION, UPDATE_NOTES, POSES, RANKING_MODULE, giveGift, assetFor,
    applicantStatus, checkApplicantUnlocks, hireApplicant, deferApplicant, openHandover, switchButler, renameCurrentButler,
    migrateState: normalizeState,
    certificationStatus
  });
  init();
})();

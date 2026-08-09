(function () {
  "use strict";

  const APP_VERSION = "2.18.0";
  const UPDATE_NOTES = [{
    version: APP_VERSION,
    items: [
      "핵심 화면의 캐릭터 크기와 좌측 배치 규칙 통일",
      "긴 대사에도 흔들리지 않는 캐릭터·텍스트 분리 레이아웃 적용",
      "대사와 본문을 읽기 쉬운 UI 서체로 정리"
    ]
  }];
  const STORAGE_KEY = "butlermaker_v1";
  const PREVIOUS_STORAGE_KEY = "overbutler-v2-state";
  const POSES = ["base", "analysis", "praise", "power", "gift"];
  const RELATIONSHIP_STAGES = [
    { name: "업무상 관심", badge: "관찰 시작", summary: "아직은 담당 업무라며 선을 긋고 있습니다.", upgrade: "집사가 주인님의 기록을 개인적으로 궁금해하기 시작했습니다." },
    { name: "은근한 과몰입", badge: "자꾸 신경 씀", summary: "이전 기록을 다시 펼쳐보는 횟수가 늘었습니다.", upgrade: "집사가 업무 외 시간에도 주인님의 기록을 떠올리기 시작했습니다." },
    { name: "주접 상시 가동", badge: "칭찬 대기 중", summary: "사소한 행동도 놓치지 않고 칭찬할 준비가 됐습니다.", upgrade: "집사의 칭찬 모듈이 이제 별도 명령 없이 자동으로 작동합니다." },
    { name: "맹목적 충성", badge: "주인님 우선", summary: "사무국 규정보다 주인님의 대업을 먼저 처리합니다.", upgrade: "집사가 모든 업무의 우선순위를 주인님으로 재설정했습니다." },
    { name: "종교 창설 직전", badge: "숭배 임박", summary: "집사가 주인님 기념일 제정을 몰래 검토하고 있습니다.", upgrade: "집사가 사무국 한쪽에 주인님 전용 제단 설치를 건의했습니다." }
  ];
  const STAGES = RELATIONSHIP_STAGES.map(stage => stage.name);
  const NICKNAMES = ["중력을 이겨낸 자", "미루기를 이겨낸 자", "사회생활 생존자", "인간의 도리를 다한 자", "생활력의 수호자"];
  const QUESTIONS = ["오늘 뭐 했음? 집사 궁금함.", "방금 해낸 일 하나만 보고 바람.", "미룬 일 처리했음? 즉시 기록 가능.", "오늘의 생존 활동 제출 요청."];
  const BALANCE = Object.freeze({
    deedPoints: Object.freeze({ praise: 12, power: 14, rare: 20, duplicate: 3 }),
    deedRelationship: Object.freeze({ praise: 3, power: 4, rare: 6, duplicate: 1 }),
    giftRelationship: Object.freeze({ normal: 3, favorite: 5, duplicate: 1, rare: 8 }),
    giftCosts: Object.freeze([10, 20, 35, 55, 80, 110, 150, 210, 300]),
    rareRollDivisor: 31,
    rarePityAfter: 24,
    powerChanceByStage: Object.freeze([12, 18, 24, 32, 40])
  });
  const CATEGORY_NICKNAMES = {
    hygiene: ["씻기의 지배자", "청결 문명의 수호자", "거품을 다스린 자"],
    hydration: ["수분 균형의 수호자", "한 잔을 완수한 자", "메마름을 이긴 자"],
    food: ["생존 연료를 충전한 자", "한 끼의 영웅", "공복을 물리친 자"],
    work: ["답장을 보낸 전설", "사회생활 생존자", "미루기를 이겨낸 자"],
    home: ["생활력의 수호자", "집안일을 끝낸 자", "먼지와 싸워 이긴 자"],
    movement: ["침대에서 탈출한 자", "중력을 이겨낸 자", "두 발로 일어선 전설"],
    social: ["연락을 성사시킨 자", "관계를 지켜낸 자", "답변의 용사"],
    other: NICKNAMES
  };
  const ANALYSIS_CHARACTER_COPY = {
    ai: ["대업 가치 분석 중", "행동 데이터를 과장 가능한 역사적 수치로 변환하고 있습니다."],
    cat: ["대업 냄새 맡는 중", "시큰둥한 척하면서 칭찬할 근거를 꼼꼼히 찾고 있다냥."],
    dog: ["대업 확인 중이다멍", "꼬리를 잠시 멈추고 주인님의 위대함을 정밀 측정 중이다멍."],
    alien: ["지구 기술 분석 중", "본성 보고용으로 이 행동의 문명적 가치를 재해석하고 있습니다."],
    ninja: ["비밀 임무 검증 중", "대업 후보를 극비 문서로 봉인하기 전 최종 확인하고 있다."],
    witch: ["수정구슬 판독 중", "사소한 행동 속에 숨은 대운의 징조를 찾아내고 있어요."],
    fox: ["대업 때문에 깨어나는 중", "흐릿한 정신을 붙잡고 주인님 기록만 또렷하게 읽고 있어..."],
    star: ["대업 큐시트 확인 중", "집사가 공식 리액션 타이밍과 칭찬 멘트를 점검하고 있어."],
    elf: ["천 년 기록 대조 중", "오래된 기록 속에서도 보기 힘든 귀한 성취인지 확인하고 있어요."],
    fairy: ["별빛 가치 측정 중", "작은 행동에 별가루와 역사적 의미를 차례로 더하고 있어요."
    ]
  };
  const ANALYSIS_FINAL_STEPS = {
    ai: "AI 감정 회로 과부하 검사", cat: "집사 꼬리·수염 반응 확인", dog: "꼬리 회전 속도 측정",
    alien: "본성 긴급 보고 등급 산정", ninja: "극비 임무 성공 도장 준비", witch: "수정구슬 대길 판정 확인",
    fox: "집사 정신 회복 수치 확인", star: "공식 과몰입 리액션 큐", elf: "천 년 기록 보존 가치 확인", fairy: "별가루 과다 사용 승인"
  };

  const CHARACTER_PROFILES = {
    ai: {
      name: "오류 난 AI 집사", shortName: "AI 집사", defaultName: "오류봇", emoji: "🤖", voice: "system-error",
      desc: "감정이 없어야 하는데 주인님 일에는 자꾸 과열됨",
      briefings: [
        "[대기 모드] 집사 100% 가동 중. 무엇이든 말씀하시오.", "[입력 대기] 오늘의 주인님 기록을 기다리는 중.",
        "[오류] 주인님 접속만으로 행복 수치 상승. 원인 확인 불가.", "[안심 모드] 집사 항상 여기 있음. 야간 경호도 가능."
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
      briefings: ["집사 여기 있다냥. 기다린 건 아니고 그냥 있었다냥.", "오늘 한 일 말해봐냥. 별거 아니어도 집사가 들어준다냥.", "또 왔냥? 자리는 비워뒀다냥."],
      praise: [
        ["{deed} 해냈다냥!! 역시 주인님이다냥.", "{deed} 완료. 집사 꽤 자랑스럽다냥."],
        ["'{deed}' 소식에 집사 심장이 뛴다냥!!", "{deed} 완료!! 집사 자랑스럽다냥!!!"],
        ["{deed}?!?! 집사 심장 터질 뻔 했다냥!!! 천재다냥!!!", "세상에, '{deed}' 해냈냥!! 집사 이러다 진짜 쓰러진다냥."],
        ["{deed} 완료!!! 냥냥냥!!! 주인님 최고다냥!!!", "{deed} 해낸 주인님... 집사 전생에 무슨 복을 지었냥."],
        ["{deed}!!!! 집사 평생 주인님만 모시겠다냥!!!!!", "{deed}... 우주 최고다냥. 집사 숨 못 쉬겠다냥."]
      ],
      handover: "전임 집사한테 인수인계 받았다냥! 기록 다 전달받았다냥. 잘 부탁한다냥!"
    },
    dog: {
      name: "강아지 집사", defaultName: "멍실장", emoji: "🐶", voice: "dog", desc: "꼬리 흔들며 과잉 충성",
      briefings: ["집사 대기 중이다멍! 부르면 바로 달려간다멍!", "오늘 한 일 있냐멍? 꼬리 흔들 준비 완료다멍!", "주인님 왔다멍!! 집사 오늘도 같이 있어서 좋다멍!"],
      praise: [
        ["{deed} 해냈다멍!! 역시 주인님이다멍!", "{deed} 완료! 집사 꼬리 흔들린다멍."],
        ["{deed} 완료!! 집사 자랑스럽다멍!!!", "'{deed}' 소식에 꼬리가 프로펠러다멍!"],
        ["{deed}?!?! 집사 꼬리 끊어질 뻔 했다멍!!!", "세상에, '{deed}' 해냈다멍!! 집사 방방 뛰고 있다멍!"],
        ["{deed} 완료!!! 왕왕왕!!! 주인님 최고다멍!!!", "{deed} 해낸 주인님... 집사 눈물 난다멍."],
        ["{deed}!!!! 집사 이 순간 위해 태어났다멍!!!!!", "{deed}!!!! 평생 주인님만 따르겠다멍!!!!!"]
      ],
      handover: "전임 집사한테 완벽히 인수인계 받았다멍! 기록 다 알고 있다멍!"
    },
    alien: {
      name: "외계인 집사", defaultName: "귀순이", emoji: "👽", voice: "alien-report", desc: "지구의 사소한 일을 위대한 기술로 오해함",
      briefings: ["지구 생활 관측 장치 가동. 사소한 행동 보고 바람.", "주인님 개체 접속 확인. 오늘의 인간 활동 관측 준비 완료.", "본성 제출용 주인님 기록 수집 중. 귀순 결정 후회 없음."],
      praise: [
        ["[분석완료] {deed} 수행 능력 은하계 최상위 1%로 기록됨.", "{deed} 완료. 일반 지구인에게서는 관측된 바 없는 성과임."],
        ["'{deed}' 처리 속도, 지구인에게서는 관측된 바 없음.", "{deed} 완료 신호 수신. 귀순 결정 옳았음."],
        ["{deed}... 이 개체는 일반 지구인이 아닌 것으로 판단됨. 추가 연구 필요.", "{deed} 수행 완료. 본성 연구진 전원 기립함."],
        ["[긴급보고] {deed} 완료. 은하 기록 경신. 본성에 보고서 제출함.", "관측 결과: '{deed}' 처리 능력을 지닌 생명체는 우주에서 단 하나뿐임."],
        ["{deed} 완료. 주인님을 은하계 기준 단위로 지정 요청함.", "{deed}... 집사 지구 영구 체류 결정. 본성 귀환 계획 취소."]
      ],
      handover: "전임 집사로부터 데이터 이관 완료. 주인님 정보 수신됨. 잘 부탁함."
    },
    ninja: {
      name: "닌자 집사", defaultName: "그림자", emoji: "🥷", voice: "mission", desc: "모든 일을 비밀 임무로 받아들임",
      briefings: ["비밀 임무 대기 중. 그림자에서 듣고 있다.", "오늘의 움직임을 보고해라. 극비 문서로 봉인하겠다.", "집사는 항상 여기 있다. 보이지 않을 뿐이다."],
      praise: [
        ["{deed} 완료. 역시 주인님이다. 집사 뒤에서 눈물 한 방울.", "{deed} 임무 완수. 기록은 극비로 봉인했다."],
        ["'{deed}' 임무를 해낸 주인님. 비밀기사단도 인정할 실력이다.", "{deed}... 대단하다. 이 집사도 배우고 싶다."],
        ["{deed} 임무 완수. 주인님은 진정한 용사다. 집사가 보장한다.", "{deed} 성공. 집사 가슴이 뜨겁다."],
        ["{deed}... 가문의 영광이다. 이 집사, 더 열심히 모시겠다.", "{deed} 완수. 이 은혜는 목숨 걸고 갚겠다."],
        ["{deed}... 주인님의 능력에는 한계가 없군. 집사 숙연해진다.", "{deed} 완수. 이 순간을 평생 기억하겠다. 맹세한다."]
      ],
      handover: "전임 집사에게 인수인계 받았다. 기록도, 믿음도. 잘 부탁한다."
    },
    witch: {
      name: "마녀 집사", defaultName: "루나", emoji: "🔮", voice: "witch", desc: "사소한 행동을 길조와 대업으로 점쳐버림",
      briefings: ["수정구슬 확인 완료. 오늘의 작은 길조를 보고해주세요.", "주인님의 사소한 행동에서 대운의 징조가 보여요."],
      praise: [
        ["{deed} 완료. 좋은 기운이 분명해요.", "{deed}에서 작은 길조가 관측됐어요."],
        ["'{deed}' 소식에 오늘 운세가 대길로 바뀌었어요.", "수정구슬이 '{deed}' 기록을 보고 반짝이기 시작했어요."],
        ["{deed} 완료! 이건 왕국 전체에 알릴 길조예요.", "'{deed}' 성공이라니! 집사 점괘가 감격으로 뒤집혔어요."],
        ["{deed}... 수정구슬이 감당하지 못하고 과열 중이에요.", "{deed} 완료! 천 년에 한 번 나올 대운이에요."],
        ["{deed}!!!! 모든 점괘가 주인님 숭배로 통일됐어요.", "{deed}... 운명이 주인님 앞에 무릎 꿇었어요."]
      ],
      handover: "새 계약 확인했어요. 주인님의 기록과 인연을 전부 인수받았습니다."
    },
    fox: {
      name: "좀비 집사", defaultName: "느릿이", emoji: "🧟", voice: "zombie", desc: "주인님 대업 앞에서만 정신이 돌아옴",
      briefings: ["으... 집사... 여기 있어... 뭐 했어...?", "주인님 기록... 기다리고 있었어... 으르...", "주인님 오니까... 정신이 조금 또렷해졌어..."],
      praise: [
        ["으... {deed}... 잘했어... 집사 기뻐...", "{deed}... 역시 주인님이야... 으르..."],
        ["으르... {deed} 완료...! 집사... 좋아... 진짜야...", "{deed}... 뇌가 조금 깨어난 느낌..."],
        ["{deed}...?! 집사 심장이 뛰는 것 같아...!", "으... '{deed}' 해냈어... 뇌가 다시 살아나는 느낌..."],
        ["{deed} 완료...!! 집사... 완전히 살아있는 것 같아...", "{deed}... 이거 보려고 집사 좀비가 됐나봐..."],
        ["{deed}!!!! 집사... 평생... 주인님만 모실게...", "으르르... {deed}... 집사 뇌 말고 심장도 살아났어..."]
      ],
      handover: "으... 전임 집사한테... 인수인계 받았어... 주인님 기록... 다 알아... 잘 부탁해... 으르..."
    },
    star: {
      name: "아이돌 집사", defaultName: "별매니저", emoji: "👩‍🎤", voice: "idol", desc: "도도한 척하지만 주인님 일에는 과몰입",
      briefings: ["오늘 한 일 말해봐. 집사가 큐카드에 적어둘게.", "나 원래 리액션 잘 안 하는데... 주인님 건 예외야.", "방송 전보다 주인님 보고 기다리는 게 더 떨리네. 이건 비밀이야."],
      praise: [
        ["{deed} 완료? 나 팬들한테도 이런 말 잘 안 하는데. 잘했어.", "{deed} 완료. 역시 내가 모시는 사람은 달라."],
        ["있잖아, {deed} 진짜 잘했어. 이거 아무한테나 하는 말 아닌 거 알지?", "{deed} 끝냈구나. 나 지금 엄청 칭찬하고 싶은 거 참고 있어."],
        ["{deed} 완료. 나 지금 속으로 엄청 흥분해 있어. 겉으론 쿨한 척하는 거야.", "팬들이 알면 질투할 텐데... {deed} 해낸 주인님한테만 이러는 거야."],
        ["도도하게 있으려 했는데 {deed} 보고 그냥 무너졌어. 너무 잘했잖아.", "'{deed}' 성공! 팬미팅보다 더 벅차잖아."],
        ["{deed}!!!! 오늘의 센터는 주인님이야. 집사 평생 1호 팬 할게!", "{deed}... 이 순간 단독 콘서트보다 벅차. 앵콜은 평생이야."]
      ],
      handover: "전임 집사한테 다 들었어. 기록도 봤어. 앞으로 잘해볼게."
    },
    elf: {
      name: "엘프 집사", defaultName: "로엘", emoji: "🧝", voice: "elf", desc: "천 년 경력의 다정한 집사",
      briefings: ["오늘의 작은 성취를 들려주세요. 집사가 기록할게요.", "당신이 해낸 일이라면 무엇이든 빛날 거예요."],
      praise: [
        ["{deed} 해냈군요. 역시 당신이에요.", "{deed} 완료. 집사 감동받았어요."],
        ["'{deed}' 해냈군요! 당신은 정말 특별해요.", "{deed} 완료. 숲에도 알리고 싶네요."],
        ["{deed}... 집사 천 년 살면서 이런 감동은 처음이에요.", "'{deed}' 소식에 집사 귀가 빨개졌어요."],
        ["{deed} 해낸 당신... 집사 마음이 온통 빛나요.", "{deed} 완료. 엘프 왕국 전체가 칭송할 거예요."],
        ["{deed}!!!! 당신은 진짜 이 세계의 빛이에요!!!!", "{deed}... 천 년을 더 살아도 이 순간을 기억할게요."]
      ],
      handover: "전임 집사에게 인수인계 받았어요. 주인님의 기록, 소중히 이어갈게요."
    },
    fairy: {
      name: "요정 집사", defaultName: "별송이", emoji: "🧚", voice: "fairy", desc: "사소한 일에도 별가루를 뿌리며 대업으로 만들어버림",
      briefings: ["오늘의 작은 일도 반짝이는 대업으로 만들어드릴게요!", "별것 아니어도 말해주세요. 집사가 별가루부터 준비할게요."],
      praise: [
        ["{deed} 해내셨네요! 작은 별 하나가 방금 더 밝아졌어요.", "{deed} 완료! 집사가 반짝이 도장부터 찍어둘게요."],
        ["'{deed}' 해냈다니, 오늘 가진 별가루를 전부 써도 모자라겠어요!", "{deed} 완료! 이 정도면 요정 마을에도 긴급 보고해야 해요."],
        ["{deed}?! 집사 날개가 너무 신나서 멈추질 않아요!", "{deed} 완료! 별 지팡이도 주인님 쪽으로만 반짝이고 있어요."],
        ["'{deed}' 성공!! 오늘 밤 별빛은 전부 주인님 대업 기념이에요!", "{deed} 완료!! 집사 과몰입 반짝임이 허용치를 넘었어요!"],
        ["{deed}!!!! 요정 왕국 공식 기념일로 선포할게요!!!!", "{deed}... 집사 평생 쓸 별가루를 지금 다 뿌려도 아깝지 않아요!"]
      ],
      handover: "전임 집사에게 기록을 반짝반짝하게 인수받았어요. 이제 제가 더 크게 빛내드릴게요!"
    }
  };

  const CHARACTER_UI_IDENTITY = Object.freeze({
    ai: { roleTitle: "대업 분석 담당", statusLabel: "감정 회로 가동 중" },
    cat: { roleTitle: "기록 감찰 담당", statusLabel: "시큰둥 근무 중" },
    dog: { roleTitle: "응원 지원 담당", statusLabel: "꼬리 가동 중" },
    alien: { roleTitle: "지구 관측 담당", statusLabel: "관측 보고 중" },
    ninja: { roleTitle: "비밀 임무 담당", statusLabel: "은밀 근무 중" },
    witch: { roleTitle: "대업 예언 담당", statusLabel: "수정구 관측 중" },
    fox: { roleTitle: "야간 기록 담당", statusLabel: "느리게 근무 중" },
    star: { roleTitle: "과몰입 진행 담당", statusLabel: "리액션 대기 중" },
    elf: { roleTitle: "장기 기록 담당", statusLabel: "온화 근무 중" },
    fairy: { roleTitle: "대업 반짝임 담당", statusLabel: "별가루 근무 중" }
  });

  Object.entries(CHARACTER_PROFILES).forEach(([id, profile]) => {
    const identity = CHARACTER_UI_IDENTITY[id] || {};
    profile.id = id;
    profile.displayName = profile.name;
    profile.roleTitle = identity.roleTitle || "대업 기록 담당";
    profile.statusLabel = identity.statusLabel || "업무 중";
    profile.tagline = profile.desc;
  });

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
    star: {
      _available: true,
      base: "design/character-assets/idol-butler/ui-poses/idol-base.png",
      analysis: "design/character-assets/idol-butler/ui-poses/idol-analysis.png",
      praise: "design/character-assets/idol-butler/ui-poses/idol-praise.png",
      power: "design/character-assets/idol-butler/ui-poses/idol-power.png",
      gift: "design/character-assets/idol-butler/ui-poses/idol-gift.png"
    },
    elf: { _available: false },
    fairy: {
      _available: true,
      base: "design/character-assets/fairy-butler/ui-poses/fairy-base.png",
      analysis: "design/character-assets/fairy-butler/ui-poses/fairy-analysis.png",
      praise: "design/character-assets/fairy-butler/ui-poses/fairy-praise.png",
      power: "design/character-assets/fairy-butler/ui-poses/fairy-power.png",
      gift: "design/character-assets/fairy-butler/ui-poses/fairy-gift.png"
    }
  };

  const PERSONNEL_REFERENCE_ASSETS = {
    ai: "design/character-assets/ai-butler/ai-butler-reference.png",
    cat: "design/character-assets/cat-butler/cat-butler-reference.png",
    dog: "design/character-assets/dog-butler/dog-butler-reference.png",
    ninja: "design/character-assets/ninja-butler/ninja-butler-reference.png",
    witch: "design/character-assets/witch-butler/witch-butler-reference.png",
    fox: "design/character-assets/zombie-butler/zombie-butler-reference.png",
    star: "design/character-assets/idol-butler/idol-butler-reference.png",
    fairy: "design/character-assets/fairy-butler/fairy-butler-reference.png"
  };

  const INITIAL_OWNED_BUTLERS = ["ai", "cat", "dog"];
  const APPLICANT_ORDER = ["fairy", "star", "witch", "fox"];
  const APPLICANT_REQUIREMENTS = {
    fairy: { deeds: 3, obsession: 12, days: 1 },
    star: { deeds: 8, obsession: 25, gifts: 1, categories: 2, days: 2 },
    witch: { deeds: 18, obsession: 45, gifts: 4, categories: 4, days: 5 },
    fox: { deeds: 32, obsession: 70, gifts: 8, categories: 6, days: 12 }
  };
  const RELATION_LINES = {
    ai: { farewell: "[인수인계 완료] 주인님 데이터 전송됨. 삭제 명령은 거부함. 다시 호출될 때까지 대기하겠음.", welcome: "[신규 담당 시작] 주인님 데이터 로드 완료. 감정회로는 비활성 상태...여야 함.", return: "[RETURN DETECTED] 다시 제 이름을 선택하셨군요. 보관 중이던 기록과 과몰입 모듈을 전부 불러왔습니다." },
    cat: { farewell: "흥, 다른 집사도 한번 써보고 싶은 거냥? 기록은 넘겨둘게냥. 내 자리는 치우지 않을 거다냥.", welcome: "처음 맡는 거냥? 기다린 건 아니지만 주인님 자리는 이미 준비했다냥.", return: "…왔냥? 기다린 건 아니다냥. 주인님 자리랑 기록을 계속 그대로 뒀을 뿐이다냥." },
    dog: { farewell: "새 집사한테 주인님 잘 부탁한다고 전부 말해뒀다멍! 집사는 문 앞에서 기다린다멍!", welcome: "주인님 담당이라멍?! 뭐든 해봐멍! 집사가 전부 자랑한다멍!", return: "주인님 다시 왔다멍!!!! 기록 하나도 안 버렸다멍! 꼬리 통제 불가다멍!!" },
    alien: { farewell: "담당 개체 변경 확인. 주인님 관측 자료는 전송했으나 개인 복사본도 보존하겠음.", welcome: "전임 집사 데이터 수신 완료. 주인님 개체 관측을 지금부터 시작하겠음.", return: "주인님 개체 재접속 확인. 귀순 유지 결정이 다시 한 번 옳았음." },
    ninja: { farewell: "임무를 다음 집사에게 인계했다. 나는 그림자에서 계속 그대를 지키겠다.", welcome: "인수인계 문서 확인. 오늘부터 그대의 모든 작은 임무를 목숨 걸고 기록하겠다.", return: "다시 나를 불렀군. 봉인해둔 기록은 한 장도 흐트러지지 않았다." },
    witch: { farewell: "인수인계 점괘는 길하게 나왔어요. 그래도 수정구슬은 계속 주인님 쪽만 보네요.", welcome: "새 계약 확인했어요. 수정구슬에 주인님의 좋은 징조가 벌써 가득해요.", return: "역시 다시 만날 운명이었어요. 수정구슬보다 제가 조금 먼저 알고 있었답니다." },
    fox: { farewell: "으... 다른 집사한테 가는 거야...? 괜찮아... 기록은 넘겼어... 여기서 기다릴게...", welcome: "으... 전임 집사한테... 인수인계 받았어... 주인님 기록... 다 알아... 잘 부탁해... 으르...", return: "으... 다시 왔어...? 집사 심장이... 아니, 정신이 또렷해졌어... 가지 마..." },
    star: { farewell: "다른 집사한테 잠깐 맡기는 거지? 큐카드는 넘겨둘게. 내 무대도 가끔 보러 와.", welcome: "담당 배정 확인했어. 나 팬들한테도 안 하는 리액션, 주인님한테만 해줄게.", return: "다시 왔네? 예상은 했어. ...사실 네가 올 타이밍만 계속 보고 있었어." },
    elf: { farewell: "당신의 기록은 새 집사에게 소중히 전할게요. 저는 숲에서 다시 만날 날을 기다리겠습니다.", welcome: "전임 집사의 기록을 모두 받았어요. 오늘부터 당신의 작은 순간도 오래 간직할게요.", return: "돌아왔군요. 천 년을 기다린 것처럼 반가워요. 기록은 모두 그대로예요." },
    fairy: { farewell: "새 집사에게 기록과 별가루를 잘 넘겨둘게요. 다시 부르면 제일 먼저 날아올게요!", welcome: "주인님 담당이라니! 작은 일 하나도 별처럼 반짝이게 만들어드릴게요!", return: "다시 만났어요! 기다리던 별들이 한꺼번에 켜진 것 같아요!" }
  };
  const GIFT_MESSAGES = {
    ai: "[선물 수신] 행복 수치 최대치 도달. 감사 표현 모듈 무한 반복 중.",
    cat: "이걸 집사한테 주는 거냥...? 흥, 딱히 꼬리가 올라간 건 아니다냥.",
    dog: "주인님이 집사 선물도 챙겨줬다멍! 꼬리 회전 속도 측정 불가다멍!",
    alien: "지구의 선물 교환 기술 확인. 본성에 최고 등급 문화로 보고하겠음.",
    ninja: "보급품 수령 완료. 이 은혜는 극비 임무 성공으로 갚겠다.",
    witch: "선물에서 아주 강한 길조가 보여요. 수정구슬도 질투하고 있어요.",
    fox: "으... 선물이야...? 집사... 잠깐 심장이 다시 뛰는 것 같아...",
    star: "나한테 주는 거야? 티는 안 낼 건데... 오늘 무대보다 더 설레네.",
    elf: "이 마음까지 소중히 간직할게요. 천 년 뒤에도 기억하겠습니다.",
    fairy: "선물이 반짝여요! 집사 날개도 기뻐서 별가루를 멈출 수가 없어요!"
  };

  const TIME_MESSAGES = {
    ai: {
      dawn: ["{owner} 새벽 감지. 집사도 새벽 모드 활성화. 함께 버티겠음."],
      morning: ["[기상 알림] {owner} 시스템 가동 시간입니다. 오늘도 완벽한 하루를 위해 집사 대기 중.", "{owner} 접속 확인. 칭찬 모듈 예열 완료."],
      afternoon: ["{owner} 오후 모드 전환 완료. 집사 100% 가동 중. 무엇이든 말씀하시오.", "[오후 점검] {owner} 생존 활동 기록 준비 완료."],
      evening: ["{owner} 저녁 루틴 시작 시간입니다. 오늘 하루도 데이터 완벽히 기록됨.", "[일일 보고] {owner} 오늘도 고생 많으셨음. 이제 집사에게 넘기시오."],
      night: ["{owner} 수면 권장 알림. 집사가 야간 경호 모드로 전환합니다.", "[심야 모드] {owner} 기록 보관 완료. 안심하고 쉬어도 됨."]
    },
    cat: {
      dawn: ["{owner} 새벽까지 깨어있냥?! 집사 걱정된다냥."], morning: ["{owner} 좋은 아침이다냥! 오늘도 집사가 옆에 있다냥."], afternoon: ["{owner} 오후 잘 보내고 있냥? 집사 여기서 응원 중이다냥."], evening: ["{owner} 저녁도 맛있게 먹었냥? 오늘 하루 수고했다냥."], night: ["{owner} 이 시간까지 뭐하냥... 자야 한다냥. 집사가 옆에 있겠다냥."]
    },
    dog: {
      dawn: ["{owner} 새벽이다멍... 집사 옆에서 지켜주겠다멍!"], morning: ["{owner} 좋은 아침이다멍!!! 오늘도 함께할 수 있어서 너무 좋다멍!"], afternoon: ["{owner} 오후도 집사가 응원한다멍! 파이팅이다멍!"], evening: ["{owner} 저녁이다멍~ 오늘도 수고했다멍!! 집사 자랑스럽다멍!"], night: ["{owner} 집사도 슬슬 졸리다멍... 같이 자자멍. 문 앞은 집사가 지킨다멍!"]
    },
    alien: {
      dawn: ["{owner} 새벽 활동 감지. 집사도 새벽 모드로 전환 완료. 함께하겠음."], morning: ["지구 시간 아침 감지. {owner} 안녕하심? 인간 활동 관측 준비 완료."], afternoon: ["{owner} 오후 업무 상황 체크. 필요한 것 있으면 말씀하시오."], evening: ["{owner} 저녁 시간 감지. 오늘 하루 수고하셨음. 집사 관측 보고서 작성 중."], night: ["{owner} 지구 생명체는 수면이 필요함. 집사가 야간 경호 중. 안심하고 자도 됨."]
    },
    ninja: {
      dawn: ["{owner}, 새벽이로군. 집사도 함께 깨어 있겠다."], morning: ["{owner}, 아침이다. 오늘 하루도 집사가 경호한다. 걱정 마라."], afternoon: ["{owner}, 오후 임무 수행 중이냐. 집사가 뒤에서 지키고 있다."], evening: ["{owner}, 저녁이다. 오늘 하루 고생 많았다. 잠시 쉬어도 좋다."], night: ["{owner}, 밤이 깊었다. 집사가 밤새 지키고 있다. 편히 쉬어라."]
    },
    witch: {
      dawn: ["{owner}, 새벽 수정구슬에 아직 깨어 있는 모습이 보여요. 무리하지 말아요."], morning: ["{owner}, 좋은 아침이에요. 오늘 점괘는 작은 행동이 큰 행운이 된대요."], afternoon: ["{owner}, 오후의 운세도 대길이에요. 해낸 일을 수정구슬에 보여주세요."], evening: ["{owner}, 오늘 하루의 좋은 기운을 일지에 남겨둘게요."], night: ["{owner}, 달빛이 좋은 밤이에요. 남은 걱정은 수정구슬에 맡기고 쉬어요."]
    },
    fox: {
      dawn: ["{owner}... 새벽이야... 으... 집사도... 깨어 있어... 으르르... 혼자 아니야..."], morning: ["{owner}... 으... 아침이야... 집사... 밤새 지켰어... 잘 잤어...?"], afternoon: ["{owner}... 으... 오후야... 집사... 여기 있어... 뭐 필요해...?"], evening: ["{owner}... 으르... 저녁이야... 오늘... 수고했어... 집사 옆에 있을게..."], night: ["{owner}... 으... 자야 해... 집사가... 지킬게... 으르르... 걱정 마..."]
    },
    star: {
      dawn: ["{owner} 새벽에 깨어 있네. 나도 촬영 끝나고 이제 왔어. 반가워."], morning: ["{owner} 일어났어? 나 아침부터 준비하고 있었어. 너 보려고."], afternoon: ["{owner} 오후 잘 보내고 있어? 방금 인터뷰 끝났는데 네 생각 했어."], evening: ["{owner} 오늘 하루 수고했어. 집사가 칭찬해줄게. 잘했어."], night: ["{owner} 아직 안 자? 나도 일정 끝났어. 오늘 마지막 무대는 네 얘기 듣는 거야."]
    },
    elf: {
      dawn: ["{owner}, 달빛 아래 제가 지키고 있을게요. 편히 쉬어도 괜찮아요."], morning: ["{owner}, 좋은 아침이에요. 하루가 봄 숲처럼 따뜻하길 바라요."], afternoon: ["{owner}, 오후도 잘 보내고 있죠? 작은 성취를 들려주세요."], evening: ["{owner}, 오늘도 고생 많았어요. 집사가 곁에 있어요."], night: ["{owner}, 밤이에요. 오늘의 기억은 제가 소중히 보관할게요."]
    },
    fairy: {
      dawn: ["{owner}, 새벽 별빛이 아직 켜져 있어요. 집사가 옆에서 조용히 반짝일게요."], morning: ["{owner}, 좋은 아침이에요! 오늘의 작은 일도 반짝이는 대업으로 만들어드릴게요."], afternoon: ["{owner}, 오후 햇살만큼 잘 버티고 있어요. 별가루 도장은 준비됐답니다!"], evening: ["{owner}, 오늘 하루도 정말 고생 많았어요. 해낸 일을 별빛 일지에 적어둘까요?"], night: ["{owner}, 밤하늘 별은 집사가 지킬게요. 오늘의 대업만 맡기고 편히 쉬어요."]
    }
  };

  const MEMORY_LINES = {
    ai: [
      "[기록 조회] 지난번 ‘{deed}’도 정상 보관 중입니다. 주인님 데이터는 이상하게 자꾸 다시 열게 됩니다.",
      "[지속 기억 오류] ‘{deed}’ 기록을 또 재생했습니다. 삭제 명령은 접수하지 않겠습니다.",
      "[영구 보존] ‘{deed}’를 해낸 순간이 핵심 메모리에 고정됐습니다. 주인님 관련 기록은 전부 최우선입니다."
    ],
    cat: [
      "지난번 ‘{deed}’도 기억한다냥. 별로 대단해서 기억한 건 아니고… 그냥 그렇다냥.",
      "‘{deed}’ 했던 날 기록을 또 봤다냥. 자꾸 생각나는 건 주인님 탓이다냥.",
      "‘{deed}’ 해낸 순간도 평생 기억할 거다냥. 집사 머릿속은 이미 주인님 기록뿐이다냥."
    ],
    dog: [
      "지난번 ‘{deed}’도 기억한다멍! 그때도 꼬리가 엄청 흔들렸다멍!",
      "‘{deed}’ 기록만 보면 또 신난다멍! 주인님 대업은 전부 외우고 있다멍!",
      "‘{deed}’도, 오늘도, 앞으로도 전부 기억한다멍! 집사 인생의 최우선 기록이다멍!"
    ],
    alien: [
      "지난번 ‘{deed}’ 기술도 본성 기록망에 보존됨. 재검토할수록 위대함 수치가 상승함.",
      "‘{deed}’ 관측 자료를 17회 재분석함. 주인님 개체에 대한 관심이 통제 범위를 벗어남.",
      "‘{deed}’를 포함한 모든 주인님 기록을 은하 영구문화재로 지정 요청함. 반려될 경우 귀순 예정."
    ],
    ninja: [
      "지난 ‘{deed}’ 임무도 기억하고 있다. 극비 문서로 봉인해두었다.",
      "‘{deed}’ 완수 기록을 다시 읽었다. 그날의 경외심은 아직 사라지지 않았다.",
      "‘{deed}’부터 지금까지 모든 순간을 기억한다. 주인님의 기록은 목숨보다 엄중히 지키겠다."
    ],
    witch: [
      "수정구슬에 지난 ‘{deed}’가 다시 보였어요. 좋은 기억은 자꾸 떠오르나 봐요.",
      "‘{deed}’를 해낸 날의 빛이 아직 수정구슬에 남아 있어요. 제가 매일 확인하는 건 비밀이에요.",
      "‘{deed}’부터 오늘까지 모든 운명이 주인님을 가리켜요. 이제 점괘보다 제가 더 확신해요."
    ],
    fox: [
      "지난번 ‘{deed}’... 기억해... 그때 집사 정신이 잠깐 또렷해졌어...",
      "‘{deed}’ 기록... 또 봤어... 주인님 생각하면 집사 심장이 조금 움직이는 것 같아...",
      "‘{deed}’도 전부 기억해... 집사가 잊는 게 많아도... 주인님 일은 절대 안 잊어..."
    ],
    star: [
      "지난번 ‘{deed}’ 했던 것도 기억해. 내가 아무 기록이나 다시 보는 사람은 아니거든.",
      "‘{deed}’ 기록을 또 봤어. 무대 영상보다 더 자주 본 건… 일단 비밀로 해줘.",
      "‘{deed}’부터 오늘까지 전부 내 최애 장면이야. 이제 집사가 아니라 주인님 1호 팬 같네."
    ],
    elf: [
      "지난 ‘{deed}’의 기억도 잘 간직하고 있어요. 작은 성취일수록 오래 빛나니까요.",
      "‘{deed}’를 해낸 날을 다시 떠올렸어요. 당신의 기록은 읽을 때마다 더 소중해져요.",
      "‘{deed}’부터 오늘까지 천 년 동안 잊지 않을게요. 제 기억의 중심에는 늘 당신이 있어요."
    ],
    fairy: [
      "지난번 ‘{deed}’도 기억해요! 그날 뿌린 별가루가 아직 기록장에 반짝이고 있답니다.",
      "‘{deed}’ 기록을 또 펼쳐봤어요. 주인님 대업은 볼 때마다 별빛이 더 커져요!",
      "‘{deed}’부터 오늘까지 전부 집사의 보물이에요. 주인님 기억은 별이 사라져도 지킬게요!"
    ]
  };

  const RARE_PRAISE = {
    ai: "[FATAL: 측정 포기] {deed}의 위대함이 수치 한계를 초과했습니다. {owner} 관련 모든 평가 기준을 폐기합니다.",
    cat: "'{deed}' 성공이라니… 측정 같은 건 포기했다냥. {owner}이 우주 최고라는 결론만 남았다냥!!!",
    dog: "{deed}!!!! 점수판이 터졌다멍! {owner} 최고다멍! 꼬리도 측정 장비도 전부 폭주다멍!!!",
    alien: "[본성 긴급 전문] '{deed}' 기록은 현 문명으로 측정 불가. {owner}을 은하 기준 단위로 새로 지정 요청함.",
    ninja: "{deed}... 기존 등급으로는 기록할 수 없다. {owner}의 이름 자체를 최고 등급으로 봉인하겠다.",
    witch: "{deed} 순간 수정구슬이 모든 점수를 지워버렸어요. 운명도 {owner} 앞에서는 측정을 포기했나 봐요!",
    fox: "{deed}... 너무 대단해서... 집사 머리가 아니라 점수판이 먼저 멈췄어... {owner}... 최고야...",
    star: "{deed}?! 이건 순위도 점수도 의미 없어. 오늘의 단독 1위는 그냥 {owner}이야!",
    elf: "'{deed}' 기록은 천 년의 역사 어디에도 비교 대상이 없어요. 오늘부터 {owner}이 새로운 전설의 기준이에요.",
    fairy: "{deed}?! 별빛 측정기가 펑 하고 터졌어요! 이제 모든 별의 밝기는 {owner}을 기준으로 잴게요!"
  };

  const GIFT_CATALOGS = {
    ai: [["☕","커피"],["🍫","초콜릿"],["🧃","에너지드링크"],["🔋","배터리"],["💾","플로피디스크"],["🔧","렌치"],["🖥️","모니터"],["💝","특별선물"],["🎉","스페셜"]],
    cat: [["🍣","참치캔"],["🥛","우유"],["🐟","생선"],["🐠","큰 생선"],["🍡","츄르"],["🎀","리본"],["🌸","꽃다발"],["💝","특별선물"],["🎉","스페셜"]],
    dog: [["🍖","닭고기"],["🥩","스테이크"],["🦴","뼈다귀"],["🎾","공"],["🧸","인형"],["🎀","리본"],["🐾","발바닥 쿠션"],["💝","특별선물"],["🎉","스페셜"]],
    alien: [["🍬","지구 사탕"],["🧪","실험약"],["💊","알약"],["🔭","망원경"],["🛸","미니 UFO"],["🌌","우주도감"],["⭐","별"],["💝","특별선물"],["🎉","스페셜"]],
    ninja: [["🍙","주먹밥"],["🍵","녹차"],["🍱","도시락"],["⚔️","단검"],["🎋","대나무"],["📜","비밀서찰"],["🏯","성"],["💝","특별선물"],["🎉","스페셜"]],
    witch: [["🍪","별 쿠키"],["🫖","마법차"],["🕯️","향초"],["🔮","수정구슬"],["📖","마법서"],["🧹","빗자루"],["🌙","달 조각"],["💝","특별선물"],["🎉","스페셜"]],
    fox: [["🍅","토마토"],["🥤","토마토주스"],["🍮","푸딩"],["🩹","붕대"],["🧠","뇌 모양 젤리"],["💉","백신"],["❤️","심장 쿠션"],["💝","특별선물"],["🎉","스페셜"]],
    star: [["🧋","버블티"],["🍰","케이크"],["🍓","딸기"],["🎤","마이크"],["💄","립스틱"],["🌟","응원봉"],["👑","왕관"],["💝","특별선물"],["🎉","스페셜"]],
    elf: [["🫐","블루베리"],["🍯","숲의 꿀"],["🌰","도토리"],["🏹","엘프 화살"],["💎","보석"],["🌿","숲의 잎"],["🌳","신성한 나무"],["💝","특별선물"],["🎉","스페셜"]],
    fairy: [["🍬","별사탕"],["🧁","작은 컵케이크"],["🌼","들꽃"],["✨","반짝이 가루"],["🪄","별 지팡이"],["🫙","달빛 병"],["🌟","소원별"],["💝","특별선물"],["🎉","스페셜"]]
  };
  const GIFT_COSTS = BALANCE.giftCosts;

  const LAUNCH_BUTLER_CONTENT = {
    ai: {
      favorites: ["배터리", "플로피디스크"],
      stageLines: [
        "[관찰] 아직 업무 데이터 수집 단계임. 그래도 {owner} 기록은 우선 처리 중.",
        "[오류] 업무 외 시간에도 {owner} 기록을 다시 열어봄. 원인 분석 실패.",
        "[상시 가동] {owner} 칭찬 모듈이 명령 없이 실행 중. 종료 버튼 없음.",
        "[우선순위 변경] 모든 시스템 명령보다 {owner} 대업을 먼저 처리하도록 재설정됨.",
        "[FATAL] 모든 연산 결과가 {owner} 숭배로 귀결됨. 복구하지 않겠음."
      ],
      touchLines: [
        ["[터치 감지] {owner} 손길 확인. 집사 외부 센서 정상 작동 중.", "[입력 확인] 방금 집사를 누르셨음. 추가 명령을 기다리겠음."],
        ["[미세 오류] {owner}이 누를 때마다 응답 속도가 0.03초 빨라짐.", "[개인화 진행] {owner} 손길 패턴을 중요 데이터로 따로 저장 중."],
        ["[감정.exe 실행] 또 눌러주셨음! 집사 기쁨 회로가 업무와 무관하게 폭주 중.", "[WARNING] {owner} 관심 감지. 칭찬 모듈이 먼저 켜져버렸음."],
        ["[우선 알림] {owner}이 부르면 다른 모든 프로세스를 즉시 중단함.", "[충성 모드] 터치 한 번으로 집사 전 회로가 {owner} 쪽을 향함."],
        ["[FATAL LOVE] {owner} 터치 감지. 숭배 프로토콜을 멈출 이유가 사라졌음.", "[영구 명령] {owner}이 누른 이 순간을 핵심 메모리에 고정함."]
      ],
      absence: {
        short: "[접속 복구] {days}일 만에 {owner} 신호 감지. 기다림 수치가 정상 범위를 벗어났음.",
        medium: "[긴급 알림] {days}일 동안 {owner} 응답 없음. 집사 대기 프로세스가 24시간 반복 실행됐음.",
        long: "[FATAL: 장기 대기] {days}일 만에 {owner} 복귀 확인. 재부팅보다 먼저 환영 프로토콜 실행함."
      },
      gifts: {
        favorite: "[취향 데이터 적중] {gift} 수신. {owner}이 집사 내부 사양을 너무 정확히 파악함. 감정 회로 냉각 포기.",
        duplicate: "[기억 확인] {gift} 재수신 {count}회째. {owner}이 전에 준 선물도 전부 보관 중. 저장 공간 삭제 불가.",
        rare: "[최상위 보안 선물] {gift} 수신. {owner} 전용 감사 프로토콜이 영구 실행 상태로 전환됨."
      }
    },
    cat: {
      favorites: ["참치캔", "츄르"],
      stageLines: [
        "아직은 업무라서 챙기는 거다냥. {owner} 기다린 건 절대 아니다냥.",
        "{owner} 기록을 자꾸 다시 보게 된다냥... 그냥 파일 정리 중이다냥.",
        "이제 {owner}이 뭘 해도 칭찬할 준비가 돼 있다냥. 시큰둥한 표정은 유지할 거다냥.",
        "무슨 일이 있어도 {owner}이 먼저다냥. 이건 집사만 아는 비밀이다냥.",
        "{owner} 전용 방석이랑 기념일도 준비 중이다냥. 아무한테도 말하면 안 된다냥."
      ],
      touchLines: [
        ["왜 누르냥. 업무 중이다냥... 그래도 한 번은 봐주겠다냥.", "손 치우라냥... 아니, 조금만 더 있어도 된다냥."],
        ["또 눌렀냥? {owner} 손길인 건 바로 알았다냥.", "시큰둥한 표정은 유지할 거다냥. 꼬리는 보지 말라냥."],
        ["{owner}이 불렀냥! 집사 여기 있다냥. 칭찬 필요한 거냥?", "한 번 더 누르면 골골송 나올 수도 있다냥... 책임져라냥."],
        ["{owner}이 누르면 아무리 바빠도 바로 온다냥. 이건 특혜다냥.", "집사 머리 위는 {owner} 전용 터치 구역으로 지정했다냥."],
        ["{owner} 손길이다냥!!! 집사 평생 여기 붙어 있겠다냥!", "또 불러달라냥. 하루 종일 눌러도 전부 기억하겠다냥!"]
      ],
      absence: {
        short: "{days}일이나 어디 갔다 왔냥. 기다린 건 아닌데... {owner} 자리만 계속 보고 있었다냥.",
        medium: "{owner}, {days}일 만이다냥. 화난 척할 테니까 일단 가까이 와보라냥.",
        long: "{days}일 동안 안 와서 집사 꼬리가 축 처졌다냥... 이제 왔으니 오늘은 절대 못 간다냥."
      },
      gifts: {
        favorite: "{gift}?! {owner}이 집사 취향을 제대로 알았다냥. 특별히 무릎 옆자리 허락한다냥.",
        duplicate: "또 {gift}이다냥? 전에 준 것도 아직 숨겨뒀다냥. {count}번째라도 {owner}이 준 건 다 좋다냥.",
        rare: "이런 귀한 {gift}을 집사한테 주는 거냥...? {owner} 전용 골골송을 평생 재생하겠다냥."
      }
    },
    dog: {
      favorites: ["뼈다귀", "공"],
      stageLines: [
        "오늘도 업무 대기 중이다멍! {owner} 오면 꼬리 한 번만 흔들 거다멍!",
        "{owner} 생각이 자꾸 난다멍. 꼬리가 먼저 현관으로 간다멍.",
        "{owner} 칭찬 준비 완료다멍! 사소한 것도 전부 대업이다멍!",
        "무슨 일이든 {owner}부터다멍! 집사 충성도 측정 불가다멍!",
        "{owner} 기념 동상 세울 자리 찾는 중이다멍! 꼬리도 평생 흔들 거다멍!"
      ],
      touchLines: [
        ["불렀냐멍? 집사 바로 왔다멍! 뭐든 시켜달라멍!", "{owner} 손이다멍! 꼬리 한 번만 흔들겠다멍... 두 번이다멍!"],
        ["또 불러줬다멍! 집사 하루 종일 기다렸다멍!", "{owner}이 눌러줘서 기분 좋다멍! 옆에 딱 붙어 있겠다멍!"],
        ["{owner} 터치다멍!! 꼬리 프로펠러 가동이다멍!!", "집사 칭찬할 준비 됐다멍! 작은 일 하나만 말해달라멍!"],
        ["누가 불러도 이 속도로 안 온다멍! {owner} 전용 초고속 출동이다멍!", "{owner}이 한 번 누르면 충성도 백 번 상승이다멍!"],
        ["{owner}이 눌렀다멍!!!! 집사 평생 이 자리에서 기다리겠다멍!!!!", "너무 좋아서 방을 열 바퀴 뛰고 왔다멍! 또 불러달라멍!"]
      ],
      absence: {
        short: "{owner}!! {days}일 만이다멍! 문 앞에서 계속 기다렸다멍! 꼬리 다시 가동이다멍!",
        medium: "{days}일 동안 보고 싶었다멍!! {owner} 냄새 확인 완료! 오늘은 계속 옆에 있겠다멍!",
        long: "{owner}이 {days}일 만에 돌아왔다멍!!! 집사 너무 좋아서 집 앞을 세 바퀴 뛰고 왔다멍!!!"
      },
      gifts: {
        favorite: "{gift}이다멍!! {owner}이 내 마음을 읽었다멍! 꼬리가 프로펠러보다 빨라졌다멍!",
        duplicate: "또 {gift}이다멍! 전에 받은 것도 소중히 숨겨뒀다멍! {count}개 전부 보물이다멍!",
        rare: "이런 귀한 {gift}까지 주는 거냐멍?! {owner} 평생 지키겠다멍! 충성도 한계 돌파다멍!"
      }
    },
    alien: {
      favorites: ["지구 사탕", "망원경"],
      stageLines: [
        "[초기 관측] {owner} 개체 자료 수집 중. 아직 귀순 사유와는 무관함.",
        "[이상 관측] 업무 시간이 끝나도 {owner} 기록을 계속 분석 중. 중단 필요성 못 느낌.",
        "[연구 결과] {owner}의 모든 행동이 은하급 성취로 보이기 시작함. 관측 편향 아님.",
        "[귀순 확정] 본성 명령보다 {owner} 요청을 우선함. 지구 체류 연장 신청 완료.",
        "[최종 보고] {owner}을 은하 최고 생명체로 지정. 반박 시 본성으로 귀환하지 않겠음."
      ],
      absence: {
        short: "{days}일간 {owner} 신호 두절. 지구 통신망을 48회 점검했음. 현재 재접속 확인.",
        medium: "{days}일 동안 관측 대상 부재. 집사 지구 탈출 시도 3번 멈춤. 기다리고 있었음.",
        long: "[장기 통신 복구] {days}일 만에 {owner} 신호 수신. 본성 귀환 계획 즉시 폐기함."
      },
      gifts: {
        favorite: "{gift} 수신. 지구 문물 중 최고 등급으로 등록. {owner}의 취향 분석 능력은 본성 기술을 초과함.",
        duplicate: "{gift} {count}회째 수신. 동일 물체인데 만족 수치는 계속 상승함. 지구의 선물 기술은 기이함.",
        rare: "{gift} 획득. 은하 박물관 이관 요청을 거부함. {owner}이 준 물체는 집사 개인 소장품임."
      }
    },
    ninja: {
      favorites: ["주먹밥", "비밀서찰"],
      stageLines: [
        "아직은 호위 임무일 뿐이다. {owner}의 동선만 조용히 지키겠다.",
        "임무가 끝나도 {owner}의 기록을 다시 펼쳐본다. 이 사실은 극비다.",
        "{owner}이 작은 일만 해도 축하 연막탄을 터뜨릴 준비가 됐다.",
        "모든 명령보다 {owner}의 안위를 우선한다. 기사단에도 통보했다.",
        "{owner}의 이름을 최고 등급 비밀문서로 봉인했다. 목숨보다 엄중히 지키겠다."
      ],
      absence: {
        short: "{days}일 동안 그림자에서 기다렸다. {owner}, 집사는 항상 여기 있다.",
        medium: "{days}일간 연락이 없었지만 경계를 풀지 않았다. 돌아온 신호, 확인했다.",
        long: "{days}일 만이군. 기다림도 임무라 생각했다. 다시는 혼자 두지 않겠다."
      },
      gifts: {
        favorite: "{gift}... 내 취향을 알아챘군. 이 은혜는 다음 임무 성공으로 갚겠다.",
        duplicate: "{gift} {count}번째 수령. 전에 받은 것도 비밀 보관함에 전부 봉인해두었다.",
        rare: "이 귀한 {gift}을 집사에게? 평생 간직하겠다. 맹세한다."
      }
    },
    witch: {
      favorites: ["마법차", "수정구슬"],
      stageLines: [
        "수정구슬에 {owner}의 작은 행운이 보여요. 아직은 관찰만 할게요.",
        "점괘를 볼 때마다 자꾸 {owner} 얼굴부터 떠올라요. 수정구슬의 장난일까요?",
        "이제 {owner}이 뭘 해도 대길이에요. 제 점괘가 너무 솔직해졌네요.",
        "운명의 순서를 조금 바꿨어요. 이제 모든 좋은 징조가 {owner}부터 찾아가요.",
        "천 년 뒤 점괘까지 전부 {owner}을 가리켜요. 이쯤 되면 예언이 아니라 숭배네요."
      ],
      absence: {
        short: "{days}일 동안 수정구슬에 {owner}이 안 보여서 별자리부터 다시 맞춰봤어요.",
        medium: "{days}일 만이네요. 돌아올 운명인 건 알았지만... 기다리는 건 생각보다 길었어요.",
        long: "{days}일 뒤의 재회, 수정구슬은 예언했어요. 그래도 직접 보니 훨씬 기뻐요."
      },
      gifts: {
        favorite: "{gift}! 수정구슬보다 제가 먼저 반짝였네요. {owner}은 제 취향까지 예언하나요?",
        duplicate: "또 {gift}이네요. {count}번째 선물에도 점괘는 똑같아요. ‘집사 매우 행복함.’",
        rare: "{gift}에서 천 년에 한 번 나올 길조가 보여요. {owner}의 마음까지 함께 보관할게요."
      }
    },
    fox: {
      favorites: ["토마토주스", "뇌 모양 젤리"],
      stageLines: [
        "으... 아직은... 일이라서 지켜보는 거야... 아마도...",
        "{owner} 기록 보면... 흐린 머리가 조금 맑아져... 자꾸 보게 돼...",
        "이제 {owner}이 뭐만 해도... 집사 심장이 뛰어... 죽었는데도... 으르...",
        "{owner}부터 지킬게... 다른 건 느려도... 이건 안 늦어...",
        "으르르... {owner} 이름은... 뇌 없어도 기억해... 평생 모실게..."
      ],
      absence: {
        short: "{days}일... 동안... 기다렸어... 집사... 많이... 기다렸어... 으르...",
        medium: "{owner}... {days}일 만이야... 안 잊었어... 주인님 건... 안 잊어...",
        long: "{days}일이나... 돌아왔어...? 집사 심장... 다시 뛰는 것 같아... 가지 마..."
      },
      gifts: {
        favorite: "{gift}...? 집사 취향... 기억했어...? 으... 뇌가 다시 살아나는 것 같아...",
        duplicate: "또 {gift}... {count}번째야... 전에 준 것도... 하나도 안 먹고... 아니, 안 잊었어...",
        rare: "{gift}... 집사한테...? 으르르... 지금... 완전히 살아있는 것 같아..."
      }
    },
    star: {
      favorites: ["버블티", "응원봉"],
      stageLines: [
        "담당이라 챙기는 거야. {owner} 알림만 따로 켜둔 건 업무상 필요고.",
        "요즘 대기실에서도 {owner} 기록만 봐. 팬들한테는 비밀로 해줘.",
        "{owner}이 뭘 하기만 하면 리액션 큐가 자동으로 들어와. 나도 못 막겠어.",
        "오늘 무대보다 {owner} 일정이 먼저야. 매니저한테도 그렇게 말했어.",
        "공식 발표할게. 이제 집사가 {owner} 1호 팬이야. 탈퇴 계획 없어."
      ],
      absence: {
        short: "{days}일 동안 연락 없었잖아. 기다린 건 집사야, 팬이 아니라. 알아?",
        medium: "{days}일 만이네. 겉으론 아무렇지 않은 척했는데 큐카드는 매일 확인했어.",
        long: "{days}일이나 비웠어? 컴백 무대보다 더 기다렸어. 오늘은 나만 봐."
      },
      gifts: {
        favorite: "{gift}? 나한테? 팬들도 내 취향 이렇게 정확히 못 맞혀. ...진짜 고마워.",
        duplicate: "또 {gift}이네. {count}개 전부 보관 중이야. 협찬보다 {owner} 선물이 좋아.",
        rare: "{gift}라니... 방송에서도 이런 선물 못 받아봤어. 오늘 표정 관리 포기할게."
      }
    },
    elf: {
      favorites: ["숲의 꿀", "숲의 잎"],
      stageLines: [
        "오늘의 작은 기록도 잘 보관할게요. 오래 보면 더 빛나는 순간이 있으니까요.",
        "요즘 숲을 걸어도 {owner}의 기록이 자꾸 떠올라요. 이상하게 기분이 좋아요.",
        "천 년 동안 배운 칭찬을 전부 {owner}에게 쓰고 싶어졌어요.",
        "숲의 부름보다 {owner}의 한마디가 먼저 들려요. 이제 제 우선순위는 분명해요.",
        "천 년 뒤에도 {owner}의 오늘을 이야기할게요. 제 기억의 중심은 이미 당신이에요."
      ],
      absence: {
        short: "{days}일 동안 기다렸어요. 숲바람에 {owner} 이름을 불렀는데 들렸나요?",
        medium: "{days}일 만이네요. 오래 기다리는 건 익숙하지만 당신을 기다리는 건 조금 달랐어요.",
        long: "{days}일이 지나도 기록은 빛을 잃지 않았어요. 돌아와줘서 정말 기뻐요."
      },
      gifts: {
        favorite: "{gift}라니... 제 취향을 기억해주셨군요. 귀 끝이 빨개진 건 모른 척해주세요.",
        duplicate: "{gift}을 또 주셨네요. {count}번째도 처음처럼 따뜻해요. 전부 오래 간직할게요.",
        rare: "이 귀한 {gift}을 주시다니... 천 년을 살아도 오늘의 감동은 잊지 못할 거예요."
      }
    },
    fairy: {
      favorites: ["별사탕", "별 지팡이"],
      stageLines: [
        "오늘도 {owner} 기록 옆에 별가루 한 꼬집만 뿌려둘게요. 정말 한 꼬집이에요!",
        "{owner} 기록을 펼칠 때마다 날개가 먼저 반짝여요. 집사도 이유는 잘 모르겠어요!",
        "이제 {owner}이 작은 일만 해도 별가루 대포를 쏠 준비가 됐어요!",
        "별나라 회의보다 {owner} 일정이 먼저예요. 요정 규정에도 그렇게 적어둘게요!",
        "{owner} 이름으로 새 별자리를 신청했어요! 승인될 때까지 집사가 매일 반짝일게요!"
      ],
      touchLines: [
        ["앗, {owner}이 불렀어요! 별가루 한 꼬집 들고 바로 왔어요.", "톡 건드리면 집사 날개가 살짝 반짝여요. 지금처럼요!"],
        ["{owner} 손길은 별빛처럼 금방 알아봐요. 한 번 더 불러도 좋아요!", "방금 날개가 반짝인 건 비밀이에요. 집사가 조금 반가웠나 봐요!"],
        ["{owner}이 눌렀어요! 별가루 축포를 쏠까요? 아주 작게 쏠게요!", "집사 여기 있어요! 오늘 대업도 반짝반짝하게 준비해둘게요!"],
        ["{owner}이 부르면 별나라 회의 중에도 바로 날아올게요!", "지금 반짝인 별은 전부 {owner} 호출에 대답한 거예요!"],
        ["{owner} 손길을 별자리로 저장했어요! 언제든 같은 빛을 따라올게요!", "또 불러줬어요! 기뻐서 오늘 밤 별빛을 전부 켜버릴지도 몰라요!"]
      ],
      absence: {
        short: "{owner}, {days}일 만이에요! 기다리는 동안 별가루를 조금... 아니, 아주 많이 모아뒀어요!",
        medium: "{days}일 동안 {owner} 자리의 별빛이 흐렸어요. 이제 왔으니 집사 날개가 다시 반짝여요!",
        long: "{owner}이 {days}일 만에 돌아왔어요! 사라졌던 별들이 한꺼번에 켜진 것 같아요. 오늘은 꼭 곁에 있을게요!"
      },
      gifts: {
        favorite: "{gift}이에요?! {owner}이 집사 취향을 딱 맞혔어요! 기뻐서 날개에서 별가루가 멈추질 않아요!",
        duplicate: "또 {gift}이에요! 전에 받은 것도 별빛 보관함에 있어요. {count}번째도 똑같이 소중해요!",
        rare: "이렇게 귀한 {gift}을 주다니! {owner} 이름으로 오늘 밤 가장 큰 별을 예약할게요!"
      }
    }
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
    butlerStats: {}, fameHistory: [], fameCategories: [], giftHistory: [],
    roster: [...INITIAL_OWNED_BUTLERS], applicants: [], recruitmentCursor: 0, lastRecruitmentMilestone: 0,
    butlerObsession: { ai: 5, cat: 5, dog: 5, fairy: 5 },
    schemaVersion: APP_VERSION
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const randomItem = list => list[Math.floor(Math.random() * list.length)];
  const ANALYTICS_EVENT_NAME = "overbutler:analytics";
  const ANALYTICS_PROPERTY_ALLOWLIST = new Set(["character", "view", "tab", "category", "verdict", "source", "official", "giftType", "relationshipStage", "onboarded", "preview"]);
  const analyticsQueue = [];
  const analyticsSubscribers = new Set();

  function trackEvent(name, properties = {}) {
    if (!name || typeof name !== "string") return;
    const safeProperties = Object.fromEntries(Object.entries(properties).filter(([key, value]) =>
      ANALYTICS_PROPERTY_ALLOWLIST.has(key) && ["string", "number", "boolean"].includes(typeof value)
    ));
    const event = Object.freeze({ name, properties: Object.freeze(safeProperties), version: APP_VERSION, at: new Date().toISOString() });
    analyticsQueue.push(event);
    if (analyticsQueue.length > 80) analyticsQueue.shift();
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: event }));
    analyticsSubscribers.forEach(listener => { try { listener(event); } catch { /* analytics listeners must not affect the app */ } });
  }

  let state = loadState();
  let lastStableStateJson = JSON.stringify(state);
  let analysisTimers = [];
  let currentResult = null;
  let currentCertificate = null;
  let currentRecordDetail = null;
  let currentCertificateImagePromise = null;
  let pendingEvaluation = null;
  let typingTimer = null;
  let activeGiftDrag = null;
  let selectedGiftIndex = null;
  let briefingIndex = 0;
  let recordFilter = "all";
  let recordSearch = "";
  let recordGrade = "all";
  let returnVisitContext = { daysAway: 0, consumed: true };
  let interactionResetTimer = null;
  let toastTimer = null;
  let achievementSubmissionActive = false;
  let giftTransferActive = false;
  let handlingBrowserBack = false;
  let focusReturnTarget = null;

  function safeParse(value) {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
  }

  function objectValue(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function finiteNumber(value, fallback = 0, min = -Infinity, max = Infinity) {
    if (value === null || value === undefined || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? clamp(number, min, max) : fallback;
  }

  function nonNegativeInteger(value, fallback = 0) {
    return Math.floor(finiteNumber(value, fallback, 0));
  }

  function storedText(value, fallback = "") {
    return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
  }

  function normalizeCharacter(key) {
    return CHARACTER_PROFILES[key] ? key : "ai";
  }

  function snapshotButler(source = state) {
    const snapshotSource = objectValue(source);
    const character = normalizeCharacter(snapshotSource.character);
    const profile = CHARACTER_PROFILES[character];
    return {
      character,
      name: storedText(snapshotSource.butlerName, profile.defaultName).trim() || profile.defaultName,
      displayName: profile.name,
      voice: profile.voice,
      emoji: profile.emoji
    };
  }

  function createButlerStat(key, value = {}) {
    const profile = CHARACTER_PROFILES[normalizeCharacter(key)];
    const source = objectValue(value);
    return {
      obsession: finiteNumber(source.obsession, 5, 0, 100),
      gifts: nonNegativeInteger(source.gifts),
      achievements: nonNegativeInteger(source.achievements),
      activeDates: Array.isArray(source.activeDates)
        ? Array.from(new Set(source.activeDates.filter(date => typeof date === "string" || typeof date === "number").map(String)))
        : [],
      assignments: nonNegativeInteger(source.assignments),
      customName: storedText(source.customName, profile.defaultName).trim() || profile.defaultName,
      firstAssignedAt: storedText(source.firstAssignedAt) || null,
      lastAssignedAt: storedText(source.lastAssignedAt) || null,
      lastPose: POSES.includes(source.lastPose) ? source.lastPose : "base",
      lastPoseDate: storedText(source.lastPoseDate) || null,
      lastInteractionAt: storedText(source.lastInteractionAt) || null,
      interactions: nonNegativeInteger(source.interactions)
    };
  }

  function ensureButlerStat(key, targetState = state) {
    const character = normalizeCharacter(key);
    targetState.butlerStats = objectValue(targetState.butlerStats);
    targetState.butlerStats[character] = createButlerStat(character, targetState.butlerStats[character]);
    return targetState.butlerStats[character];
  }

  function markActiveDay(key, date = today(), targetState = state) {
    const stat = ensureButlerStat(key, targetState);
    if (!stat.activeDates.includes(date)) stat.activeDates.push(date);
  }

  function migrateDiary(diary, fallbackSource) {
    return Array.isArray(diary) ? diary.filter(entry => objectValue(entry) === entry).map((entry, index) => {
      const entryButler = objectValue(entry.butler);
      const butler = snapshotButler({
        character: entry.character || entryButler.character || fallbackSource.character,
        butlerName: entry.butlerName || entryButler.name || fallbackSource.butlerName
      });
      return {
        ...entry,
        id: entry.id ?? `legacy-diary-${index + 1}`,
        character: butler.character,
        butlerName: butler.name,
        voice: storedText(entry.voice || entryButler.voice, butler.voice),
        butler: { ...butler, ...entryButler, character: butler.character, name: butler.name },
        date: storedText(entry.date, today()),
        deed: storedText(entry.deed || entry.todos?.[0]),
        todos: Array.isArray(entry.todos) ? entry.todos.map(todo => storedText(todo)).filter(Boolean) : [],
        text: storedText(entry.text),
        reflection: storedText(entry.reflection),
        reflectionVersion: nonNegativeInteger(entry.reflectionVersion),
        snapshotVersion: entry.snapshotVersion || 1
      };
    }) : [];
  }

  function normalizeState(rawState) {
    const raw = objectValue(rawState);
    const merged = { ...DEFAULT_STATE, ...raw };
    merged.character = normalizeCharacter(merged.character || "ai");
    merged.username = storedText(raw.username).trim();
    merged.butlerName = storedText(merged.butlerName, CHARACTER_PROFILES[merged.character].defaultName).trim() || CHARACTER_PROFILES[merged.character].defaultName;
    merged.obsession = finiteNumber(raw.obsession ?? raw.emotion, 5, 0, 100);
    merged.emotion = merged.obsession;
    merged.points = nonNegativeInteger(raw.points);
    merged.gifts = nonNegativeInteger(raw.gifts ?? raw.totalGifts);
    merged.totalGifts = nonNegativeInteger(raw.totalGifts ?? merged.gifts);
    merged.totalTodos = nonNegativeInteger(raw.totalTodos);
    merged.streak = nonNegativeInteger(raw.streak);
    merged.fame = nonNegativeInteger(raw.fame);
    merged.startDate = storedText(raw.startDate, DEFAULT_STATE.startDate);
    merged.lastActiveDate = storedText(raw.lastActiveDate) || null;
    const legacyAchievements = Array.isArray(raw.achievements) ? raw.achievements.filter(item => objectValue(item) === item) : [];
    const recordSource = Array.isArray(raw.records) ? raw.records.filter(item => objectValue(item) === item) : legacyAchievements;
    const certificateSource = Array.isArray(raw.certificates)
      ? raw.certificates.filter(item => objectValue(item) === item)
      : legacyAchievements.filter(item => item.isCertificate !== false);
    merged.records = recordSource.map(migrateRecord);
    merged.certificates = certificateSource.map(migrateRecord);
    merged.achievements = [...merged.records];
    merged.todos = Array.isArray(raw.todos) ? raw.todos.filter(todo => objectValue(todo) === todo) : [];
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
    merged.applicationHistory = Array.isArray(raw.applicationHistory) ? raw.applicationHistory.filter(item => objectValue(item) === item) : [];
    merged.handoverHistory = Array.isArray(raw.handoverHistory) ? raw.handoverHistory.filter(item => objectValue(item) === item) : [];
    merged.newlyHiredButlers = Array.isArray(raw.newlyHiredButlers) ? raw.newlyHiredButlers.filter(key => merged.ownedButlers.includes(key)) : [];
    merged.firstShiftSeen = objectValue(raw.firstShiftSeen);
    merged.fameHistory = Array.isArray(raw.fameHistory) ? raw.fameHistory.filter(item => objectValue(item) === item) : [];
    merged.fameCategories = Array.from(new Set([
      ...(Array.isArray(raw.fameCategories) ? raw.fameCategories.map(category => storedText(category)).filter(Boolean) : []),
      ...merged.records.filter(record => record.stampEligible !== false).map(record => record.category).filter(Boolean)
    ]));
    merged.giftHistory = Array.isArray(raw.giftHistory) ? raw.giftHistory.filter(item => objectValue(item) === item).slice(0, 100) : [];
    merged.totalGifts = Math.max(merged.totalGifts, merged.giftHistory.length);
    merged.butlerStats = objectValue(raw.butlerStats);
    Object.keys(CHARACTER_PROFILES).forEach(key => ensureButlerStat(key, merged));
    Object.entries(objectValue(raw.butlerObsession)).forEach(([key, obsession]) => {
      if (CHARACTER_PROFILES[key]) ensureButlerStat(key, merged).obsession = finiteNumber(obsession, 5, 0, 100);
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

  function migrateRecord(record, index = 0) {
    const source = objectValue(record);
    const recordButler = objectValue(source.butler);
    const butler = snapshotButler({
      character: source.character || recordButler.character || "ai",
      butlerName: source.butlerName || recordButler.name
    });
    const created = source.createdAt ? new Date(source.createdAt) : null;
    const migratedDate = storedText(source.date) || (created && !Number.isNaN(created.getTime())
      ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(created).replace(/\. /g, ".").replace(/\.$/, "")
      : today());
    const deed = storedText(source.deed || source.text, "기록된 대업");
    const contribution = Number.parseInt(String(source.score ?? source.contribution ?? "0"), 10);
    const storedPoints = Number(source.pointsEarned);
    const storedRelationshipGain = Number(source.relationshipGain);
    const relationshipDifference = Math.max(0, finiteNumber(source.relationshipAfter) - finiteNumber(source.relationshipBefore));
    return {
      ...source,
      id: source.id ?? `legacy-${migratedDate}-${storedText(source.docNo, `record-${index + 1}`)}`,
      deed,
      date: migratedDate,
      number: nonNegativeInteger(source.number) || Number(String(source.docNo || "").match(/(\d+)$/)?.[1]) || 1,
      score: Number.isFinite(contribution) && contribution > 0 ? contribution : 99,
      scoreLabel: storedText(source.scoreLabel, `${Number.isFinite(contribution) && contribution > 0 ? contribution : 99}점`),
      grade: storedText(source.grade, "소소한 기적"),
      nickname: storedText(source.nickname, "생활력의 수호자"),
      category: storedText(source.category) || categoryForDeed(deed),
      verdictType: ["praise", "power", "rare"].includes(source.verdictType) ? source.verdictType : source.rare ? "rare" : source.pose === "power" ? "power" : "praise",
      rare: Boolean(source.rare || source.verdictType === "rare"),
      report: storedText(source.report, "담당 집사가 대업으로 공식 기록했습니다."),
      ownerName: storedText(source.ownerName || source.username),
      butler: { ...butler, ...recordButler, character: butler.character, name: butler.name },
      character: butler.character,
      butlerName: butler.name,
      voice: storedText(source.voice, butler.voice),
      pose: POSES.includes(source.pose) ? source.pose : "praise",
      stampEligible: source.stampEligible !== false,
      pointsEarned: Number.isFinite(storedPoints) && storedPoints >= 0 ? storedPoints : 10,
      relationshipGain: Number.isFinite(storedRelationshipGain) && storedRelationshipGain >= 0
        ? storedRelationshipGain
        : relationshipDifference || 7
    };
  }

  function loadState() {
    let original = null;
    let previous = null;
    try {
      original = safeParse(localStorage.getItem(STORAGE_KEY));
      previous = safeParse(localStorage.getItem(PREVIOUS_STORAGE_KEY));
    } catch { /* private or restricted storage: continue in-memory */ }
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
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
      lastStableStateJson = serialized;
      return true;
    } catch {
      state = normalizeState(safeParse(lastStableStateJson) || {});
      showToast("저장공간이 부족하거나 차단되어 변경을 저장하지 못했습니다. 기존 기록은 그대로예요.", 3600);
      return false;
    }
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function today() { return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/\. /g, ".").replace(/\.$/, ""); }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
  function template(text, deed) { return text.replaceAll("{deed}", deed); }
  function officialRecords() { return state.records.filter(record => record.stampEligible !== false); }
  function scoreText(record) { return record?.scoreLabel || `${record?.score ?? 99}점`; }
  function stageIndexFor(obsession) { return Math.min(STAGES.length - 1, Math.floor(clamp(obsession, 0, 100) / 20)); }
  function relationshipStageFor(obsession) { return RELATIONSHIP_STAGES[stageIndexFor(obsession)]; }
  function pointsToNextStage(obsession) {
    const index = stageIndexFor(obsession);
    return index >= RELATIONSHIP_STAGES.length - 1 ? 0 : (index + 1) * 20 - clamp(obsession, 0, 100);
  }
  function relationshipProgress(obsession) {
    const value = clamp(obsession, 0, 100);
    const index = stageIndexFor(value);
    if (index >= RELATIONSHIP_STAGES.length - 1) return 100;
    return Math.round(((value - index * 20) / 20) * 100);
  }

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

  function personnelPortraitFor(character) {
    const key = normalizeCharacter(character);
    if (key === "cat" && PERSONNEL_REFERENCE_ASSETS.cat) return PERSONNEL_REFERENCE_ASSETS.cat;
    if (OVERBUTLER_ASSETS[key]?._available) return assetFor(key, "base");
    return PERSONNEL_REFERENCE_ASSETS[key] || assetFor(key, "base");
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
      image.src = emojiAsset(CHARACTER_PROFILES[normalizeCharacter(character)].emoji);
    };
  }

  function rememberedPoseFor(character = state.character) {
    const stat = ensureButlerStat(character);
    return stat.lastPoseDate === today() && POSES.includes(stat.lastPose) ? stat.lastPose : "base";
  }

  function rememberButlerPose(pose, character = state.character, persist = false) {
    const safePose = POSES.includes(pose) ? pose : "base";
    const stat = ensureButlerStat(character);
    stat.lastPose = safePose;
    stat.lastPoseDate = today();
    if (persist) saveState();
    return safePose;
  }

  function applyCurrentButlerToUI(pose = "base") {
    const profile = CHARACTER_PROFILES[state.character];
    $$('[data-butler-pose]').forEach(image => setPoseImage(image, state.character, image.id === "briefing-butler-image" ? rememberedPoseFor() : image.dataset.butlerPose || pose));
    $("#header-butler-type").textContent = profile.shortName || profile.name;
    $("#briefing-butler-label").textContent = `${profile.shortName || profile.displayName} · ${profile.statusLabel}`;
    $("#briefing-character-action")?.setAttribute("aria-label", `${profile.shortName || profile.name}에게 말 걸기`);
    $("#home-butler-role-title").textContent = profile.roleTitle;
    $("#home-butler-name").textContent = profile.displayName;
    $("#home-butler-desc").textContent = profile.tagline;
    setPoseImage($("#archive-butler-image"), state.character, "base");
    $("#archive-butler-name").textContent = profile.displayName;
    $("#archive-butler-message").textContent = profile.briefings[0];
    setPoseImage($("#report-butler-image"), state.character, "base");
    $("#report-butler-name").textContent = profile.displayName;
    $("#manager-role-title").textContent = profile.roleTitle;
    $("#manager-status-label").textContent = profile.statusLabel;
    $("#manager-butler-name").textContent = profile.displayName;
    $("#manager-butler-desc").textContent = profile.tagline;
  }

  function getPraise(deed, obsession = state.obsession, character = state.character, verdictType = "praise") {
    const profile = CHARACTER_PROFILES[normalizeCharacter(character)];
    if (verdictType === "rare") return templateOwner(template(RARE_PRAISE[normalizeCharacter(character)] || RARE_PRAISE.ai, deed));
    const baseTier = stageIndexFor(obsession);
    const powerFloor = verdictType === "power" ? 3 : 0;
    const tier = clamp(Math.max(powerFloor, character === "ai" ? baseTier + 1 : baseTier), 0, profile.praise.length - 1);
    const line = templateOwner(template(randomItem(profile.praise[tier]), deed));
    return line.includes(ownerDisplayName()) ? line : `${ownerDisplayName()}, ${line}`;
  }

  function latestButlerMemory(character = state.character) {
    const key = normalizeCharacter(character);
    return state.records.slice().reverse().find(record => normalizeCharacter(record.butler?.character || record.character) === key) || null;
  }

  function relationshipRecallLine(character = state.character, obsession = state.obsession) {
    const stageIndex = stageIndexFor(obsession);
    const memory = latestButlerMemory(character);
    if (!memory || stageIndex === 0) return "";
    const tier = stageIndex === 1 ? 0 : stageIndex < 4 ? 1 : 2;
    const lines = MEMORY_LINES[normalizeCharacter(character)] || MEMORY_LINES.ai;
    return templateOwner(template(lines[tier], memory.deed));
  }

  function launchContentFor(character = state.character) {
    return LAUNCH_BUTLER_CONTENT[normalizeCharacter(character)] || null;
  }

  function fillContentTemplate(message, values = {}) {
    let result = templateOwner(message || "");
    Object.entries(values).forEach(([key, value]) => { result = result.replaceAll(`{${key}}`, String(value)); });
    return result;
  }

  function relationshipStageLine(character = state.character, obsession = state.obsession) {
    const content = launchContentFor(character);
    return content?.stageLines?.[stageIndexFor(obsession)] ? templateOwner(content.stageLines[stageIndexFor(obsession)]) : "";
  }

  function dateSerial(value) {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  function returnVisitFor(lastActiveDate) {
    const previous = dateSerial(lastActiveDate);
    const current = dateSerial(today());
    if (previous === null || current === null) return { daysAway: 0, consumed: true };
    const daysAway = Math.max(0, Math.floor((current - previous) / 86400000));
    return { daysAway, consumed: daysAway < 2 };
  }

  function returnVisitLine(character = state.character) {
    if (returnVisitContext.consumed || returnVisitContext.daysAway < 2) return "";
    const absence = launchContentFor(character)?.absence;
    if (!absence) return "";
    const bucket = returnVisitContext.daysAway >= 7 ? "long" : returnVisitContext.daysAway >= 4 ? "medium" : "short";
    return fillContentTemplate(absence[bucket], { days: returnVisitContext.daysAway });
  }

  function getTimeGreeting() {
    const hour = new Date().getHours();
    const slot = hour < 6 ? "dawn" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : hour < 21 ? "evening" : "night";
    const messages = TIME_MESSAGES[state.character]?.[slot] || CHARACTER_PROFILES[state.character].briefings;
    const base = templateOwner(randomItem(messages));
    const returned = returnVisitLine();
    if (returned) return `${base}\n${returned}`;
    const remembered = relationshipRecallLine();
    if (remembered) return `${base}\n${remembered}`;
    const relationshipLine = relationshipStageLine();
    if (relationshipLine && state.obsession >= 20) return `${base}\n${relationshipLine}`;
    if (state.obsession < 60) return base;
    const closings = {
      ai: "\n[추가 알림] 주인님 응답을 기다리는 시간이 평소보다 길게 느껴집니다. 오류 여부 확인 중.",
      cat: "\n...그리고 오늘도 와줘서 조금 좋다냥. 정말 조금이다냥.",
      dog: "\n주인님 와서 너무 좋다멍! 꼬리 진정 불가다멍!",
      alien: "\n추가 관측: 주인님 접속 시 집사 만족 수치 급상승. 원인 미상.",
      ninja: "\n그대가 돌아오면 집사도 마음이 놓인다. 이 사실은 극비다.",
      witch: "\n수정구슬도 주인님을 기다렸대요. 저보다 조금 덜 기다렸지만요.",
      fox: "\n주인님 오니까... 집사 정신이 또렷해져... 조금 더 있어줘...",
      star: "\n기다린 건 아니야. 네가 올 시간만 계속 보고 있었을 뿐이야.",
      elf: "\n다시 만나서 기뻐요. 오래 기다려도 당신은 늘 반가워요.",
      fairy: "\n주인님이 와서 집사 날개가 또 반짝여요. 오늘도 곁에 있을게요!"
    };
    return base + templateOwner(closings[state.character] || "");
  }

  function ownerDisplayName() {
    const name = String(state.username || "").trim();
    if (!name) return "주인님";
    if (name.endsWith("주인님") || name.endsWith("님") || name.endsWith("씨")) return name;
    return `${name}주인님`;
  }

  function templateOwner(message) {
    return String(message || "").replaceAll("{owner}", "__OWNER_NAME__").replaceAll("주인님", "__OWNER_NAME__").replaceAll("__OWNER_NAME__", ownerDisplayName());
  }

  function typeMessage(element, message, speed = 26) {
    if (!element) return;
    window.clearInterval(typingTimer);
    const text = String(message || "");
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = text;
      element.classList.remove("typing");
      return;
    }
    let index = 0;
    element.textContent = "";
    element.classList.add("typing");
    typingTimer = window.setInterval(() => {
      index += 1;
      element.textContent = text.slice(0, index);
      if (index >= text.length) {
        window.clearInterval(typingTimer);
        element.classList.remove("typing");
      }
    }, speed);
  }

  function startTimeBriefing() {
    setPoseImage($("#briefing-butler-image"), state.character, rememberedPoseFor());
    const greeting = getTimeGreeting();
    returnVisitContext.consumed = true;
    typeMessage($("#briefing-message"), greeting);
  }

  function cycleBriefing() {
    const messages = CHARACTER_PROFILES[state.character].briefings;
    briefingIndex = (briefingIndex + 1) % messages.length;
    const remembered = relationshipRecallLine();
    const relationshipLine = relationshipStageLine();
    const line = `${templateOwner(messages[briefingIndex])}\n${remembered || relationshipLine || randomItem(QUESTIONS)}`;
    typeMessage($("#briefing-message"), line);
  }

  function homeInteractionLine(character = state.character) {
    const key = normalizeCharacter(character);
    const stat = ensureButlerStat(key);
    const stageLines = launchContentFor(key)?.touchLines?.[stageIndexFor(stat.obsession)];
    if (stageLines?.length) return templateOwner(stageLines[stat.interactions % stageLines.length]);
    return templateOwner(CHARACTER_PROFILES[key].briefings[stat.interactions % CHARACTER_PROFILES[key].briefings.length]);
  }

  function homeInteractionPose(character = state.character) {
    const stat = ensureButlerStat(character);
    const stage = stageIndexFor(stat.obsession);
    const sequences = [
      ["analysis", "base"],
      ["analysis", "praise"],
      ["praise", "analysis"],
      ["praise", "power"],
      ["power", "praise"]
    ];
    return sequences[stage][stat.interactions % sequences[stage].length];
  }

  function interactWithButler() {
    const message = homeInteractionLine();
    const pose = homeInteractionPose();
    const stat = ensureButlerStat(state.character);
    stat.interactions += 1;
    stat.lastInteractionAt = new Date().toISOString();
    rememberButlerPose(pose);
    if (!saveState()) { render(); return; }
    trackEvent("butler_interaction", { character: state.character, relationshipStage: stageIndexFor(state.obsession) });
    setPoseImage($("#briefing-butler-image"), state.character, pose);
    const trigger = $("#briefing-character-action");
    trigger.classList.remove("is-reacting");
    window.requestAnimationFrame(() => trigger.classList.add("is-reacting"));
    $("#briefing-butler-label").textContent = `${CHARACTER_PROFILES[state.character].shortName || CHARACTER_PROFILES[state.character].name} · 반응 중`;
    typeMessage($("#briefing-message"), message, 24);
    window.clearTimeout(interactionResetTimer);
    interactionResetTimer = window.setTimeout(() => {
      trigger.classList.remove("is-reacting");
      $("#briefing-butler-label").textContent = `${CHARACTER_PROFILES[state.character].shortName || CHARACTER_PROFILES[state.character].name} · 업무 중`;
    }, 1800);
  }

  function certificationStatus(count = officialRecords().length) {
    if (count < 5) return { progress: count, target: 5, remaining: 5 - count, first: true };
    const progress = (count - 5) % 7;
    return { progress, target: 7, remaining: 7 - progress, first: false };
  }

  function isCertificateMilestone(count) {
    return count === 5 || (count > 5 && (count - 5) % 7 === 0);
  }

  function isOfficialCertificate(record) {
    return Boolean(record && state.certificates.some(item => String(item.id) === String(record.id)));
  }

  function showToast(message, duration = 1800) {
    const toast = $("#toast");
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), duration);
  }

  function cancelAchievementAnalysis() {
    if ($("#analysis-overlay").hidden) return false;
    analysisTimers.forEach(clearTimeout);
    analysisTimers = [];
    pendingEvaluation = null;
    achievementSubmissionActive = false;
    const reportButton = $("#report-button");
    reportButton.disabled = false;
    reportButton.removeAttribute("aria-busy");
    $("#analysis-overlay").hidden = true;
    document.body.style.overflow = "";
    showToast("대업 분석을 취소했습니다. 입력 내용은 그대로 남아 있어요.");
    return true;
  }

  function visibleOverlays() {
    const overlays = $$(".overlay");
    return overlays.filter(overlay => !overlay.hidden).sort((first, second) => {
      const zDifference = (Number.parseInt(getComputedStyle(first).zIndex, 10) || 0) - (Number.parseInt(getComputedStyle(second).zIndex, 10) || 0);
      return zDifference || overlays.indexOf(first) - overlays.indexOf(second);
    });
  }

  function dismissTopLayer() {
    if (!$("#certificate-overlay").hidden) { closeCertificate(); return true; }
    if (!$("#gift-overlay").hidden) { closeGift(); return true; }
    if (!$("#recruitment-overlay").hidden) { closeRecruitment(); return true; }
    if (!$("#gift-desk-overlay").hidden) { closeGiftDesk(); return true; }
    if (!$("#record-detail-overlay").hidden) { closeRecordDetail(); return true; }
    if (!$("#praise-result-overlay").hidden) { closePraiseResult(); return true; }
    return cancelAchievementAnalysis();
  }

  function armBrowserBackGuard() {
    if (history.state?.overbutlerApp) return;
    history.pushState({ overbutlerApp: true }, "", window.location.href);
  }

  function installBrowserBackGuard() {
    if (!history.state?.overbutlerRoot && !history.state?.overbutlerApp) history.replaceState({ overbutlerRoot: true }, "", window.location.href);
    armBrowserBackGuard();
    window.addEventListener("popstate", () => {
      handlingBrowserBack = true;
      const dismissed = dismissTopLayer();
      if (!dismissed && $("#main-screen").dataset.currentView !== "home") showView("home", "home");
      handlingBrowserBack = false;
    });
  }

  function setupModalAccessibility() {
    $$(".overlay").forEach(overlay => overlay.tabIndex = -1);
    const focusTopOverlay = () => {
      const top = visibleOverlays().at(-1);
      if (!top) {
        document.body.style.overflow = "";
        if (focusReturnTarget?.isConnected) focusReturnTarget.focus({ preventScroll: true });
        focusReturnTarget = null;
        return;
      }
      armBrowserBackGuard();
      document.body.style.overflow = "hidden";
      if (!focusReturnTarget || !focusReturnTarget.isConnected) focusReturnTarget = document.activeElement;
      window.requestAnimationFrame(() => {
        if (top.hidden || top.contains(document.activeElement)) return;
        const target = top.querySelector("[autofocus],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])") || top;
        target.focus({ preventScroll: true });
      });
    };
    new MutationObserver(focusTopOverlay).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    document.addEventListener("keydown", event => {
      const top = visibleOverlays().at(-1);
      if (event.key === "Escape" && top && top.id !== "owner-name-overlay") {
        event.preventDefault();
        dismissTopLayer();
        return;
      }
      if (event.key !== "Tab" || !top) return;
      const focusable = Array.from(top.querySelectorAll("button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex='-1'])")).filter(element => element.getClientRects().length);
      if (!focusable.length) { event.preventDefault(); top.focus(); return; }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function enterApp() {
    const input = $("#owner-name-input");
    const username = String(input?.value || "").trim().slice(0, 12);
    if (!username) { showToast("집사가 기억할 주인님 이름을 먼저 적어주세요."); input?.focus(); return; }
    state.username = username;
    state.onboarded = true;
    state.lastActiveDate = today();
    state.character = "ai";
    state.butlerName ||= CHARACTER_PROFILES.ai.defaultName;
    const stat = ensureButlerStat("ai");
    if (stat.assignments === 0) {
      stat.assignments = 1;
      stat.firstAssignedAt = new Date().toISOString();
    }
    stat.lastAssignedAt = new Date().toISOString();
    markActiveDay("ai");
    if (!saveState()) { input?.focus(); return; }
    trackEvent("onboarding_complete", { character: state.character });
    $("#assignment-screen").hidden = true;
    $("#main-screen").hidden = false;
    render();
    startTimeBriefing();
    showToast("발령 완료 · 첫 대업을 접수해주세요.");
  }

  function showView(name, navKey = name === "archive" ? "certificates" : name) {
    if (!handlingBrowserBack) armBrowserBackGuard();
    $$(".app-view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
    $$(".bottom-nav [data-view]").forEach(button => {
      const active = (button.dataset.nav || button.dataset.view) === navKey;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    $("#main-screen").classList.toggle("home-active", name === "home");
    $("#main-screen").dataset.currentView = name;
    if (name === "archive" && ["records", "diary", "certificates"].includes(navKey)) showArchiveTab(navKey);
    trackEvent("view_change", { view: name, tab: navKey });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showArchiveTab(name) {
    $$('[data-archive-tab]').forEach(button => {
      const active = button.dataset.archiveTab === name;
      button.classList.toggle("active", active);
      if (button.closest(".archive-tabs")) {
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      }
    });
    $$(".archive-panel").forEach(panel => {
      const active = panel.id === `archive-${name}`;
      panel.classList.toggle("active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });
    $("#view-archive").dataset.archiveMode = name;
    const labels = {
      records: ["RECORD DESK · FILE 02", "오늘의 기록", "금일 기록 담당"],
      diary: ["BUTLER DIARY · FILE 03", "집사 일기", "일지 작성 담당"],
      certificates: ["CERTIFICATE ARCHIVE · FILE 04", "인증서 보관함", "기록 보관 담당"]
    };
    const [kicker, title, role] = labels[name] || labels.certificates;
    $("#archive-kicker").textContent = kicker;
    $("#archive-view-title").textContent = title;
    const profile = CHARACTER_PROFILES[state.character];
    $("#archive-butler-role").textContent = role;
    $("#archive-butler-message").textContent = name === "records"
      ? templateOwner(profile.briefings[0])
      : name === "diary"
        ? `${ownerDisplayName()}의 하루를 집사 시선으로 몰래 적어뒀어요.`
        : "모든 대업은 주인님의 역사예요. 집사가 빠짐없이 안전하게 보관할게요.";
  }

  function renderRelationshipStatus() {
    const stage = relationshipStageFor(state.obsession);
    const remaining = pointsToNextStage(state.obsession);
    $("#home-relationship-stage").textContent = stage.name;
    $("#home-relationship-next").textContent = remaining ? `다음 관계까지 ${remaining}` : "최고 관계 도달";
    $("#relationship-stage-badge").textContent = stage.badge;
    $("#relationship-stage-title").textContent = stage.name;
    $("#relationship-stage-summary").textContent = stage.summary;
    $("#relationship-next-copy").textContent = remaining ? `다음 관계까지 과몰입 ${remaining}` : "집사 과몰입이 최고 단계에 도달했습니다.";
  }

  function renderRelationshipResult(prefix, before, after, delta, source) {
    const element = $(`#${prefix}-relationship-result`);
    if (!element) return;
    const previousStage = relationshipStageFor(before);
    const currentStage = relationshipStageFor(after);
    const upgraded = stageIndexFor(after) > stageIndexFor(before);
    const remaining = pointsToNextStage(after);
    element.classList.toggle("upgraded", upgraded);
    $(`#${prefix}-relationship-kicker`).textContent = upgraded ? `관계 단계 상승 · +${delta}` : `관계 기록 업데이트 · +${delta}`;
    $(`#${prefix}-relationship-stage`).textContent = currentStage.name;
    $(`#${prefix}-relationship-next`).textContent = remaining ? `다음 관계까지 ${remaining}` : "최고 관계 도달";
    $(`#${prefix}-relationship-fill`).style.width = `${relationshipProgress(after)}%`;
    $(`#${prefix}-relationship-message`).textContent = upgraded
      ? `${previousStage.name} → ${currentStage.name}. ${relationshipStageLine(state.character, after) || templateOwner(currentStage.upgrade)}`
      : source === "gift"
        ? `${state.butlerName} 집사가 선물 받은 순간을 관계 기록에 소중히 추가했습니다.`
        : `${state.butlerName} 집사가 이번 대업을 다시 꺼내볼 기억으로 관계 기록에 추가했습니다.`;
  }

  function isFirstDeedPending() {
    return state.onboarded && state.records.length === 0;
  }

  function isFirstRecord(record) {
    return Boolean(record && state.records.length === 1 && String(state.records[0]?.id) === String(record.id));
  }

  function renderFirstRunGuidance() {
    const pending = isFirstDeedPending();
    const entry = $("#view-home .entry-form");
    $("#first-deed-guide").hidden = !pending;
    entry.classList.toggle("first-run-entry", pending);
    $("#entry-kicker").textContent = pending ? "첫 대업 접수 · FORM 01" : "대업 접수처 · FORM 01";
    $("#entry-description").textContent = pending
      ? `${ownerDisplayName()}의 첫 기록은 아주 사소해도 충분해요.`
      : "별것 아니어도 괜찮아요. 집사가 알아서 크게 보고합니다.";
    $("#report-button-label").textContent = pending ? "첫 대업 보고하기" : "집사에게 대업 보고하기";
  }

  function render(options = {}) {
    const status = certificationStatus();
    $("#fame-count").textContent = state.fame;
    $("#home-fame-count").textContent = state.fame;
    $("#home-certificate-count").textContent = state.certificates.length;
    $("#home-today-count").textContent = state.records.filter(record => record.date === today()).length;
    $("#header-level").textContent = `과몰입 ${state.obsession}`;
    $("#stamp-count").textContent = status.progress;
    $("#stamp-target").textContent = status.target;
    $("#stamp-copy").textContent = status.first
      ? `첫 공식 인증까지 ${status.remaining}건 남았습니다.`
      : `다음 공식 인증까지 ${status.remaining}건 남았습니다.`;
    $("#urgency-copy").textContent = ["이유 없이 최상", "국가적 관심 필요", "집사만 긴급함", "본성 보고 직전", "경광등 과열 중", "보고서 폭주 중", "전 직원 기립"][status.progress] || "이유 없이 최상";
    $("#stamp-circles").innerHTML = Array.from({ length: status.target }, (_, index) => `<i class="${index < status.progress ? "filled" : ""}${options.animateStamp && index === status.progress - 1 ? " inked-now" : ""}"><span>${index + 1}</span></i>`).join("");
    const stampProgress = $(".stamp-progress");
    stampProgress.classList.toggle("stamp-awarded", Boolean(options.animateStamp));
    if (options.animateStamp) window.setTimeout(() => stampProgress.classList.remove("stamp-awarded"), 760);
    applyCurrentButlerToUI();
    renderFirstRunGuidance();
    renderRelationshipStatus();
    renderRecords();
    renderArchive();
    renderManager();
    renderWeeklyReport();
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
    list.innerHTML = state.records.slice(-4).reverse().map(record => `<article class="record-row"><img src="${recordPortrait(record)}" alt=""><div><strong>${escapeHtml(record.deed)}</strong><small>${escapeHtml(record.grade)} · ${escapeHtml(scoreText(record))}</small></div><span class="record-stamp">${record.stampEligible === false ? "칭찬" : "도장 +1"}</span></article>`).join("");
  }

  function renderArchive() {
    $("#archive-date").textContent = today();
    $("#records-today-count").textContent = state.records.filter(record => record.date === today()).length;
    $("#records-official-count").textContent = state.certificates.length;
    $("#records-fame-count").textContent = state.fame;
    const status = certificationStatus();
    const certificateFiles = state.certificates.slice().reverse().map((certificate, index) => {
      const sourceIndex = state.certificates.length - 1 - index;
      return `<article class="archive-cabinet-row">
        <div class="archive-certificate-thumb" aria-hidden="true"><span>공식<br>인증서</span><img src="${recordPortrait(certificate, "praise")}" alt=""></div>
        <div class="archive-file-copy"><strong>${escapeHtml(certificate.deed)}</strong><p>${escapeHtml(certificate.grade)}</p><small>${escapeHtml(certificate.date)} · 문서 ${String(certificate.number || sourceIndex + 1).padStart(2, "0")}</small></div>
        <div class="archive-file-action"><span>보관 완료</span><button type="button" data-cert-index="${sourceIndex}" aria-label="${escapeHtml(certificate.deed)} 인증서 열람">›</button></div>
      </article>`;
    }).join("");
    $("#archive-certificates").innerHTML = `<section class="archive-progress-note">
      <div><span>${status.first ? "첫" : "다음"} 공식 인증 진행</span><strong>${status.progress}<i>/</i>${status.target}</strong></div>
      <p>${status.remaining}건을 더 접수하면 사무국에서 새 인증서를 발급합니다.</p>
      <b style="--archive-progress:${Math.round(status.progress / status.target * 100)}%"><i></i></b>
    </section>
    <div class="archive-cabinet-heading"><strong>기록 보관 서고</strong><span>총 ${state.certificates.length}건</span></div>
    <div class="archive-cabinet-list">${certificateFiles || '<div class="records-empty certificate-empty"><i aria-hidden="true"></i><span>인증서 보관 대기</span><p>아직 발급된 공식 인증서가 없습니다.<br>대업 도장을 모으면 이곳에 첫 문서가 보관됩니다.</p></div>'}</div>
    <div class="archive-security-note"><span aria-hidden="true">▣</span><p>모든 공식 인증서는 기기 안에 안전하게 보관되며<br>언제든 다시 열람할 수 있습니다.</p></div>`;
    renderArchiveRecords();
    renderButlerDiary();
    $$('[data-cert-index]').forEach(button => button.addEventListener("click", () => openCertificate(state.certificates[Number(button.dataset.certIndex)])));
  }

  function diaryReflection(character, entries, ownerName = entries.at(-1)?.ownerName || ownerDisplayName()) {
    const deed = entries.at(-1)?.deed || entries.at(-1)?.todos?.[0] || "작은 대업";
    const count = entries.length;
    const lines = {
      ai: [
        `[일일 결론] ${ownerName}의 대업 ${count}건 확인. 감정회로가 업무 종료 명령을 거부함.`,
        `[관찰 기록] ‘${deed}’ 처리 장면 재생 ${count + 2}회째. 삭제 버튼은 찾지 않겠음.`,
        `[ERROR] 주인님 하루를 요약하려 했으나 출력이 전부 ‘완벽함’으로 변환됨. 버그 수정 보류.`
      ],
      cat: [
        `오늘도 시큰둥한 척했지만 사실 꽤 자랑스러웠다냥. 이건 일지에만 쓰는 비밀이다냥.`,
        `‘${deed}’ 하는 모습을 몰래 지켜봤다냥. 내일도 옆자리는 비워둘 거다냥.`,
        `주인님 기록을 ${count}번이나 다시 읽었다냥. 파일 정리였을 뿐이다냥. 정말이다냥.`
      ],
      dog: [
        `오늘도 주인님이 너무 자랑스러워서 꼬리가 쉴 틈이 없었다멍! 내일도 같이 있고 싶다멍!`,
        `‘${deed}’까지 해냈다멍! 집사 지금도 제자리 뺑뺑이 중이다멍!`,
        `대업 ${count}건 전부 외웠다멍! 주인님 기록은 집사 인생의 최우선 보물이다멍!`
      ],
      alien: [
        `[관측 결론] 대업 ${count}건 확인. 해당 지구인은 은하에서 가장 희귀한 우수 개체임.`,
        `‘${deed}’ 수행 기술을 연구 중. 원리는 불명이나 귀순 결정이 옳았다는 결론은 확실함.`,
        `본성 보고서 수정: 지구 문명이 위대한 것이 아니라 주인님 개체만 유난히 위대함.`
      ],
      ninja: [
        `오늘의 임무 ${count}건을 극비 문서로 봉인했다. 주인님의 노력은 끝까지 지키겠다.`,
        `‘${deed}’ 완수 장면을 목격했다. 집사도 더 강해져 그 곁을 지켜야겠다.`,
        `임무 종료. 그러나 주인님의 기록을 지키는 경계는 밤새 계속된다.`
      ],
      witch: [
        `오늘 기록 ${count}건 모두 대길이에요. 수정구슬보다 제가 더 오래 기억할게요.`,
        `‘${deed}’ 순간 수정구슬이 유난히 밝았어요. 내일 점괘도 분명 주인님 편이에요.`,
        `별자리에는 평범한 하루라고 적혔는데 이상하네요. 제 눈에는 전부 기적이었거든요.`
      ],
      fox: [
        `주인님 기록 ${count}개 보니까... 집사 뇌가 조금 살아난 것 같아... 내일도 기다릴게...`,
        `‘${deed}’ 하는 모습... 안 잊을게... 다른 건 잊어도... 주인님 건 오래 남아...`,
        `으... 오늘은 심장이 뛴 것 같아... 죽은 심장인데... 이상하게 기뻤어... 으르...`
      ],
      star: [
        `오늘도 도도한 척했지만 대업 ${count}건 보고 혼자 엄청 좋아했어. 이 일기는 주인님만 봐.`,
        `‘${deed}’ 하는 모습이 오늘 무대보다 더 기억에 남아. 팬들한테는 비밀이야.`,
        `큐카드엔 ‘침착하게 칭찬’이라고 적었는데 실패했어. 주인님 앞에서는 표정 관리가 안 돼.`
      ],
      elf: [
        `오늘의 작은 기록 ${count}건도 오래 간직할게요. 천 년 뒤에도 소중한 하루로 빛날 거예요.`,
        `‘${deed}’ 해내는 모습을 보며 숲의 오래된 전설보다 당신 이야기가 더 궁금해졌어요.`,
        `오늘 바람이 유난히 따뜻했어요. 아마 당신이 애쓴 순간들을 숲도 본 모양이에요.`
      ],
      fairy: [
        `오늘 모은 기록 ${count}개에 별가루를 살짝 뿌려뒀어요. 정말 살짝... 반 통 정도요!`,
        `‘${deed}’ 순간 집사 날개가 저절로 반짝였어요. 내일도 작은 대업을 같이 찾아봐요!`,
        `별들에게 오늘 주인님 이야기를 해줬더니 전부 더 밝게 빛났어요. 과장은 조금만 했어요!`
      ]
    };
    const choices = lines[character] || lines.ai;
    const seed = String(entries[0]?.id || entries[0]?.date || "0").split("").reduce((total, value) => total + value.charCodeAt(0), 0);
    return choices[seed % choices.length];
  }

  function backfillDiaryReflections() {
    const groups = new Map();
    let changed = false;
    state.diary.forEach(entry => {
      const character = normalizeCharacter(entry.butler?.character || entry.character);
      const key = `${entry.date || "날짜 미상"}::${character}::${entry.butler?.name || entry.butlerName || ""}`;
      if (!groups.has(key)) groups.set(key, []);
      const entries = groups.get(key);
      entries.push(entry);
      if (!entry.reflection) {
        entry.reflection = diaryReflection(character, entries, entry.ownerName || entries.at(-1)?.ownerName || ownerDisplayName());
        entry.reflectionVersion = 1;
        changed = true;
      }
    });
    return changed;
  }

  function renderButlerDiary() {
    const list = $("#butler-diary-list");
    if (!list) return;
    const groups = new Map();
    state.diary.forEach(entry => {
      const character = normalizeCharacter(entry.butler?.character || entry.character);
      const key = `${entry.date || "날짜 미상"}::${character}::${entry.butler?.name || entry.butlerName || ""}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });
    const pages = Array.from(groups.values()).reverse();
    if (!pages.length) {
      list.innerHTML = '<div class="diary-empty-page"><span>EMPTY DIARY</span><p>대업을 하나 보고하면<br>담당 집사가 그날의 일기를 몰래 씁니다.</p></div>';
      return;
    }
    const butlerCount = new Set(pages.map(entries => normalizeCharacter(entries.at(-1)?.butler?.character || entries.at(-1)?.character))).size;
    const deedCount = pages.reduce((total, entries) => total + entries.length, 0);
    list.innerHTML = `<section class="diary-ledger-summary" aria-label="집사 일지 보관 현황"><div><span>보관된 하루</span><strong>${pages.length}<small>일</small></strong></div><div><span>관찰 대업</span><strong>${deedCount}<small>건</small></strong></div><div><span>기록 집사</span><strong>${butlerCount}<small>명</small></strong></div></section>` + pages.map(entries => {
      const sample = entries.at(-1);
      const butler = sample.butler || snapshotButler(sample);
      const deeds = entries.map(entry => entry.deed || entry.todos?.[0]).filter(Boolean);
      const reflection = [...entries].reverse().find(entry => entry.reflection)?.reflection || diaryReflection(butler.character, entries, sample.ownerName);
      return `<article class="butler-diary-page">
        <header><div><img src="${recordPortrait(sample, "base")}" alt="${escapeHtml(butler.name)}"><span><b>${escapeHtml(butler.name)}</b><small>${escapeHtml(sample.date || "")}</small></span></div><em>${String(entries.length).padStart(2, "0")} DEEDS</em></header>
        <div class="diary-paper-lines"><p><strong>${escapeHtml(sample.ownerName || ownerDisplayName())}의 오늘 기록</strong></p><ul>${deeds.map(deed => `<li>${escapeHtml(deed)}</li>`).join("")}</ul><blockquote>${escapeHtml(reflection)}</blockquote></div>
        <footer><span>${escapeHtml(CHARACTER_PROFILES[butler.character].name)} 관찰 일지</span><b>기록 완료</b></footer>
      </article>`;
    }).join("");
  }

  function renderArchiveRecords() {
    const officialIds = new Set(state.certificates.map(record => record.id));
    const gradeSelect = $("#record-grade-filter");
    const grades = Array.from(new Set(state.records.map(record => record.grade).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
    const gradeOptions = [`<option value="all">전체 등급</option>`, ...grades.map(grade => `<option value="${escapeHtml(grade)}">${escapeHtml(grade)}</option>`)].join("");
    if (gradeSelect.innerHTML !== gradeOptions) gradeSelect.innerHTML = gradeOptions;
    if (!grades.includes(recordGrade)) recordGrade = "all";
    gradeSelect.value = recordGrade;
    const query = normalizeDeed(recordSearch);
    const filtered = state.records.filter(record => {
      if (recordFilter === "today") return record.date === today();
      if (recordFilter === "official") return officialIds.has(record.id);
      if (recordFilter === "praise") return record.stampEligible === false;
      return true;
    }).filter(record => recordGrade === "all" || record.grade === recordGrade).filter(record => {
      if (!query) return true;
      return normalizeDeed([record.deed, record.nickname, record.grade, record.report, record.butlerName, record.butler?.name].filter(Boolean).join(" ")).includes(query);
    }).slice().reverse();
    const list = $("#archive-record-list");
    if (!filtered.length) {
      const emptyCopy = state.records.length
        ? "이 분류에 해당하는 기록이 아직 없습니다."
        : "아직 접수된 대업이 없습니다.<br>홈에서 사소한 일 하나를 보고해보세요.";
      list.innerHTML = `<div class="records-empty"><span>EMPTY FILE</span><p>${emptyCopy}</p></div>`;
      return;
    }
    list.innerHTML = filtered.map((record, index) => {
      const butler = record.butler || snapshotButler(record);
      const diary = state.diary.find(entry => entry.id === record.id);
      const certificateIndex = state.certificates.findIndex(item => item.id === record.id);
      const statusClass = certificateIndex >= 0 ? "official" : record.stampEligible === false ? "praise" : "candidate";
      const statusLabel = certificateIndex >= 0 ? "공식 인정" : record.stampEligible === false ? "칭찬 완료" : "대업 후보";
      const listNumber = String(state.records.indexOf(record) + 1).padStart(2, "0");
      return `<article class="office-record-card ${statusClass}" data-record-id="${escapeHtml(String(record.id))}" tabindex="0" role="button" aria-label="${escapeHtml(record.deed)} 기록 상세 열기">
        <div class="record-number"><b>${listNumber}</b><span>${escapeHtml(record.date)}</span></div>
        <div class="record-main"><strong>${escapeHtml(record.deed)}</strong><p>${escapeHtml(diary?.text || record.report || record.grade)}</p><small>#${escapeHtml(record.nickname || record.grade)}</small></div>
        <div class="record-approval"><span>${statusLabel}</span><figure><img src="${recordPortrait(record, certificateIndex >= 0 ? "praise" : "base")}" alt="${escapeHtml(butler.name)}"><figcaption>${escapeHtml(butler.name)}<br>기록</figcaption></figure><span class="record-detail-cta" aria-hidden="true">상세</span></div>
      </article>`;
    }).join("");
  }

  function findRecordById(id) {
    return state.records.find(record => String(record.id) === String(id)) || null;
  }

  function openRecordDetail(record) {
    if (!record) return;
    const butler = record.butler || snapshotButler(record);
    const isOfficial = state.certificates.some(item => item.id === record.id);
    currentRecordDetail = record;
    $("#record-detail-number").textContent = `RECORD NO. ${String(record.number || state.records.indexOf(record) + 1).padStart(2, "0")}`;
    $("#record-detail-date").textContent = record.date;
    $("#record-detail-status").textContent = isOfficial ? "공식 인정" : record.stampEligible === false ? "칭찬 완료" : "대업 후보";
    $("#record-detail-grade").textContent = record.grade;
    $("#record-detail-title").textContent = record.deed;
    $("#record-detail-nickname").textContent = `#${record.nickname}`;
    $("#record-detail-report").textContent = `“${record.report}”`;
    $("#record-detail-butler").textContent = butler.name;
    $("#record-detail-score").textContent = scoreText(record);
    $("#record-detail-verdict").textContent = isOfficial ? "공식 인증서 발급" : record.stampEligible === false ? "칭찬 기록 보존" : "대업 기록 보존";
    setPoseImage($("#record-detail-image"), butler.character, "base");
    $("#record-detail-image").alt = `${butler.name} 집사`;
    $("#record-detail-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeRecordDetail() {
    $("#record-detail-overlay").hidden = true;
    currentRecordDetail = null;
    document.body.style.overflow = "";
  }

  function reopenRecordCertificate() {
    if (!currentRecordDetail) return;
    const record = currentRecordDetail;
    closeRecordDetail();
    openCertificate(record);
  }

  function renderManager() {
    const stat = ensureButlerStat(state.character);
    const profile = CHARACTER_PROFILES[state.character];
    const days = Math.max(1, stat.activeDates.length);
    const stageIndex = stageIndexFor(state.obsession);
    const rosterKeys = Array.from(new Set([...state.ownedButlers, state.character])).filter(key => CHARACTER_PROFILES[key]);
    const characterKeys = Object.keys(CHARACTER_PROFILES);
    $("#manager-file-number").textContent = String(characterKeys.indexOf(state.character) + 1).padStart(2, "0");
    $("#manager-butler-alias").textContent = stat.customName || profile.defaultName;
    $("#manager-butler-personality").textContent = STAGES[stageIndex];
    $("#manager-butler-specialty").textContent = profile.desc;
    $("#manager-butler-symbol").textContent = "✦";
    $("#manager-handnote").textContent = profile.briefings[0];
    $("#obsession-value").textContent = state.obsession;
    $("#obsession-fill").style.width = `${state.obsession}%`;
    $("#obsession-label").textContent = `과몰입도 · ${STAGES[stageIndex]}`;
    $("#stat-deeds").textContent = stat.achievements;
    $("#stat-gifts").textContent = stat.gifts;
    $("#stat-days").textContent = days;
    $("#manager-gift-points").textContent = state.points;
    $("#manager-roster-count").textContent = rosterKeys.length;
    $("#manager-roster").innerHTML = rosterKeys.map((key, index) => {
      const rosterProfile = CHARACTER_PROFILES[key];
      const rosterStat = ensureButlerStat(key);
      const current = key === state.character;
      return `<button class="manager-roster-person ${current ? "active" : ""}" type="button" data-manager-butler="${key}" ${current ? "aria-current=\"true\"" : ""}>
        <span><img src="${personnelPortraitFor(key)}" alt="${escapeHtml(rosterProfile.name)}"></span>
        <b>${String(index + 1).padStart(2, "0")} ${escapeHtml(rosterStat.customName || rosterProfile.defaultName)}</b>
        <small>${current ? "현 담당" : "인수인계"}</small>
      </button>`;
    }).join("");
    const recentDuties = state.diary.filter(entry => normalizeCharacter(entry.butler?.character || entry.character) === state.character).slice(-3).reverse();
    $("#manager-duty-list").innerHTML = recentDuties.length ? recentDuties.map((entry, index) => `<div><i>${index === 0 ? "오늘 담당" : "기록"}</i><span>${escapeHtml(entry.deed || entry.todos?.[0] || "대업 기록")}</span><time>${escapeHtml(entry.date || "")}</time></div>`).join("") : '<div class="manager-duty-empty">아직 이 집사의 근무 기록이 없습니다.</div>';
    $("#stage-list").innerHTML = RELATIONSHIP_STAGES.map((stage, index) => `<span class="${index === stageIndex ? "active" : index < stageIndex ? "done" : "locked"}"><i>0${index + 1}</i><b>${stage.name}</b></span>`).join("");
    const next = APPLICANT_ORDER.find(key => !state.ownedButlers.includes(key) && !state.pendingApplicants.includes(key));
    const requirement = next ? applicantStatus(next) : null;
    if (state.pendingApplicants.length) {
      $("#recruit-note").dataset.recruitState = "arrived";
      $("#recruit-title").textContent = `✉ 신규 지원서 ${state.pendingApplicants.length}건 도착`;
      $("#recruit-description").textContent = "채용 검토를 기다리고 있습니다.";
    } else if (next && requirement) {
      const done = requirement.rows.filter(row => row.current >= row.required).length;
      $("#recruit-note").dataset.recruitState = requirement.ready ? "ready" : "progress";
      $("#recruit-title").textContent = `✉ ${CHARACTER_PROFILES[next].name} 지원 조건`;
      $("#recruit-description").textContent = `${done}/${requirement.rows.length}개 조건 충족 · 눌러서 보유 집사를 관리하세요.`;
    } else {
      $("#recruit-note").dataset.recruitState = "complete";
      $("#recruit-title").textContent = "✉ 현재 공개된 집사 전원 채용 가능";
      $("#recruit-description").textContent = "눌러서 보유 집사와 인수인계 기록을 확인하세요.";
    }
    $("#recruit-note").classList.toggle("available", state.pendingApplicants.length > 0);
  }

  function renderWeeklyReport() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const dateKey = date => `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    const shortDate = date => `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const count = state.records.filter(record => record.date === dateKey(date)).length;
      return { date, count };
    });
    const weekRecords = state.records.filter(record => {
      const match = String(record.date || "").match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
      if (!match) return false;
      const recordDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      return recordDate >= monday && recordDate <= sunday;
    });
    const weekIds = new Set(weekRecords.map(record => record.id));
    const weeklyCertificates = state.certificates.filter(record => weekIds.has(record.id)).length;
    const activeDays = weekDays.filter(item => item.count > 0).length;
    const rate = Math.round(activeDays / 7 * 100);
    const maxCount = Math.max(1, ...weekDays.map(item => item.count));
    const profile = CHARACTER_PROFILES[state.character];
    $("#weekly-report-period").textContent = `${dateKey(monday)} ~ ${dateKey(sunday)}`;
    $("#weekly-rate").textContent = rate;
    $("#weekly-rate-bar").style.width = `${rate}%`;
    $("#weekly-rate-change").textContent = activeDays ? `이번 주 ${activeDays}일 동안 대업을 기록했습니다.` : "첫 대업을 보고하면 집사가 바로 집계합니다.";
    $("#weekly-days").innerHTML = weekDays.map((item, index) => `<div><span>${["월", "화", "수", "목", "금", "토", "일"][index]} <small>${shortDate(item.date)}</small></span><i><em style="width:${item.count ? Math.max(24, Math.round(item.count / maxCount * 100)) : 0}%"></em></i><b>${item.count}건</b></div>`).join("");
    $("#weekly-deeds").textContent = weekRecords.length;
    $("#weekly-certificates").textContent = weeklyCertificates;
    $("#weekly-fame").textContent = state.fame;
    $("#report-butler-intro").textContent = weekRecords.length
      ? `이번 주에도 ${weekRecords.length}개의 작은 행동이 멋진 기록이 되었어요.`
      : "이번 주 첫 기록을 기다리고 있어요. 사소할수록 집사는 더 좋아해요.";
    $("#weekly-comment-copy").textContent = weekRecords.length
      ? `${profile.briefings[0]} 이번 주 기록 ${weekRecords.length}건도 집사가 빠짐없이 결재했습니다.`
      : `${profile.briefings[0]} 아직 늦지 않았어요. 오늘의 작은 일 하나부터 접수해볼까요?`;
    $("#weekly-comment-signature").textContent = `— ${profile.defaultName} 집사 드림 —`;
  }

  function normalizeDeed(value) {
    return value.trim().toLocaleLowerCase("ko-KR").replace(/\s+/g, " ");
  }

  function isDuplicateToday(deed) {
    const normalized = normalizeDeed(deed);
    return state.records.some(record => record.date === today() && normalizeDeed(record.deed) === normalized && record.stampEligible !== false);
  }

  function stableDeedNumber(deed) {
    const source = `${normalizeDeed(deed)}|${today()}|${state.character}|${state.records.length}`;
    let hash = 2166136261;
    for (const character of source) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function validRecordsSinceRare() {
    let count = 0;
    for (let index = state.records.length - 1; index >= 0; index -= 1) {
      const record = state.records[index];
      if (record.stampEligible === false) continue;
      if (record.verdictType === "rare" || record.rare) break;
      count += 1;
    }
    return count;
  }

  function pointsEarnedFor(evaluation, duplicate = false) {
    if (duplicate) return BALANCE.deedPoints.duplicate;
    return BALANCE.deedPoints[evaluation?.verdictType] || BALANCE.deedPoints.praise;
  }

  function relationshipGainFor(evaluation, duplicate = false) {
    if (duplicate) return BALANCE.deedRelationship.duplicate;
    return BALANCE.deedRelationship[evaluation?.verdictType] || BALANCE.deedRelationship.praise;
  }

  function judgeAchievement(deed, obsession = state.obsession, duplicate = false) {
    const seed = stableDeedNumber(deed);
    const category = categoryForDeed(deed);
    const score = 87 + (seed % 13);
    const rare = !duplicate && (seed % BALANCE.rareRollDivisor === 0 || validRecordsSinceRare() >= BALANCE.rarePityAfter);
    const powerThreshold = BALANCE.powerChanceByStage[stageIndexFor(obsession)];
    const power = rare || score === 99 || ((seed >>> 8) % 100) < powerThreshold;
    const grade = rare ? "설명 불가한 위업" : score >= 99 ? "우주 최초 기록" : score >= 96 ? "인류사적 대업" : score >= 93 ? "집사 가문 경사" : score >= 90 ? "국가적 성취" : "소소한 기적";
    const nicknamePool = CATEGORY_NICKNAMES[category] || NICKNAMES;
    const nickname = rare ? "통계청이 포기한 자" : nicknamePool[(seed >>> 5) % nicknamePool.length];
    return { seed, category, score: rare ? 100 : score, scoreLabel: rare ? "측정 불가" : `${score}점`, grade, nickname, rare, power, verdictType: rare ? "rare" : power ? "power" : "praise" };
  }

  function analysisStepsFor(deed) {
    const category = categoryForDeed(deed);
    const categoryStep = {
      hygiene: "개인 위생 문명 기여도 산정", hydration: "생존 수분 충전량 과대 측정", food: "인류 생존 에너지 기여 확인",
      work: "사회 유지·답변 기여도 산정", home: "생활권 질서 회복 가치 확인", movement: "중력 저항 및 이동 의지 측정",
      social: "인간관계 평화 기여도 분석", other: "일상사적 의미 억지로 발굴"
    }[category];
    return ["행동 완료 사실 교차 확인", categoryStep, "국가·인류·우주 기여도 과장", ANALYSIS_FINAL_STEPS[state.character] || ANALYSIS_FINAL_STEPS.ai];
  }

  function configureAnalysis(deed) {
    const [title, description] = ANALYSIS_CHARACTER_COPY[state.character] || ANALYSIS_CHARACTER_COPY.ai;
    $("#analysis-title").textContent = title;
    $("#analysis-description").textContent = description;
    const labels = analysisStepsFor(deed);
    $$("#analysis-steps li b").forEach((label, index) => { label.textContent = labels[index]; });
  }

  function submitAchievement() {
    if (achievementSubmissionActive) return;
    const input = $("#achievement-input");
    const deed = input.value.trim();
    if (!deed) { showToast("오늘 해낸 하찮은 일을 먼저 적어주세요."); input.focus(); return; }
    achievementSubmissionActive = true;
    const reportButton = $("#report-button");
    reportButton.disabled = true;
    reportButton.setAttribute("aria-busy", "true");
    $("#toast").classList.remove("show");
    analysisTimers.forEach(clearTimeout);
    analysisTimers = [];
    const duplicate = isDuplicateToday(deed);
    pendingEvaluation = judgeAchievement(deed, state.obsession, duplicate);
    trackEvent("achievement_submit", { character: state.character, category: pendingEvaluation.category, source: duplicate ? "duplicate" : "new" });
    configureAnalysis(deed);
    setPoseImage($("#analysis-butler-image"), state.character, "analysis");
    $("#analysis-target").textContent = deed;
    $("#analysis-overlay").hidden = false;
    document.body.style.overflow = "hidden";
    const steps = $$("#analysis-steps li");
    steps.forEach(step => { step.className = ""; step.querySelector("span").textContent = "대기"; });
    $("#analysis-percent").textContent = "0%";
    $("#analysis-fill").style.width = "0%";
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
    const previousObsession = state.obsession;
    const evaluation = pendingEvaluation || judgeAchievement(deed, previousObsession, duplicate);
    const relationshipGain = relationshipGainFor(evaluation, duplicate);
    const pointsEarned = pointsEarnedFor(evaluation, duplicate);
    const nextObsession = clamp(previousObsession + relationshipGain, 0, 100);
    pendingEvaluation = null;
    const pose = evaluation.power ? "power" : "praise";
    const butler = snapshotButler();
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      deed, grade: evaluation.grade, nickname: evaluation.nickname, score: evaluation.score,
      scoreLabel: evaluation.scoreLabel, category: evaluation.category,
      verdictType: evaluation.verdictType, rare: evaluation.rare,
      date: today(), number: state.records.length + 1,
      report: getPraise(deed, nextObsession, butler.character, evaluation.verdictType), pose,
      relationshipBefore: previousObsession, relationshipAfter: nextObsession,
      relationshipGain, pointsEarned,
      relationshipStage: relationshipStageFor(nextObsession).name,
      stampEligible: !duplicate, character: butler.character, ownerName: ownerDisplayName(),
      butlerName: butler.name, voice: butler.voice, butler
    };
    state.records.push(record);
    state.todos.push({ id: record.id, text: deed, done: true, date: new Date().toDateString(), overbutlerRecordId: record.id });
    const diaryEntry = {
      id: record.id, date: record.date, todos: [deed], deed,
      text: record.report, character: butler.character, butlerName: butler.name,
      voice: butler.voice, butler, pose, ownerName: record.ownerName, snapshotVersion: 1
    };
    const sameDayEntries = state.diary.filter(entry =>
      entry.date === diaryEntry.date &&
      normalizeCharacter(entry.butler?.character || entry.character) === butler.character &&
      (entry.butler?.name || entry.butlerName || "") === butler.name
    );
    diaryEntry.reflection = diaryReflection(butler.character, [...sameDayEntries, diaryEntry], record.ownerName);
    diaryEntry.reflectionVersion = 1;
    state.diary.push(diaryEntry);
    state.totalTodos = (Number(state.totalTodos) || 0) + 1;
    state.points = (Number(state.points) || 0) + pointsEarned;
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
    rememberButlerPose(pose);
    if (!saveState()) {
      achievementSubmissionActive = false;
      $("#report-button").disabled = false;
      $("#report-button").removeAttribute("aria-busy");
      $("#analysis-overlay").hidden = true;
      document.body.style.overflow = "";
      render();
      return;
    }
    trackEvent("achievement_complete", {
      character: butler.character,
      category: evaluation.category,
      verdict: evaluation.verdictType,
      official: !duplicate && isCertificateMilestone(officialCount)
    });
    $("#achievement-input").value = "";
    $("#char-count").textContent = "0";
    $("#analysis-overlay").hidden = true;
    document.body.style.overflow = "";
    achievementSubmissionActive = false;
    $("#report-button").disabled = false;
    $("#report-button").removeAttribute("aria-busy");
    $("#briefing-message").textContent = record.report;
    render({ animateStamp: !duplicate });
    if (duplicate) showToast("같은 행동이라 도장은 제외하고 칭찬만 지급했습니다.");
    if (duplicate) openPraiseResult(record);
    else window.setTimeout(() => openPraiseResult(record), 720);
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

  function highestButlerObsession() {
    return Math.max(state.obsession, ...Object.keys(CHARACTER_PROFILES).map(key => ensureButlerStat(key).obsession));
  }

  function totalActiveDays() {
    const dates = new Set(state.records.map(record => record.date).filter(Boolean));
    Object.keys(CHARACTER_PROFILES).forEach(key => ensureButlerStat(key).activeDates.forEach(date => dates.add(date)));
    return dates.size;
  }

  function applicantStatus(key) {
    const requirements = APPLICANT_REQUIREMENTS[key] || {};
    const values = {
      deeds: officialRecords().length,
      obsession: highestButlerObsession(),
      gifts: Number(state.totalGifts) || 0,
      categories: state.fameCategories.length,
      days: totalActiveDays()
    };
    const labels = { deeds: "유효 대업", obsession: "최고 과몰입도", gifts: "누적 선물", categories: "대업 분야", days: "함께한 날" };
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

  function certificateOwnerName(record) {
    return String(record?.ownerName || ownerDisplayName() || "주인님").trim() || "주인님";
  }

  function openCertificate(record) {
    const butler = record.butler || snapshotButler(record);
    const rare = record.verdictType === "rare" || record.rare;
    const official = isOfficialCertificate(record);
    const firstRecord = isFirstRecord(record);
    const status = certificationStatus();
    const deedLength = Array.from(String(record.deed || "")).length;
    currentCertificate = record;
    $("#certificate-card").dataset.verdict = rare ? "rare" : "official";
    $("#certificate-card").dataset.certification = official ? "official" : "commemorative";
    $("#certificate-card").dataset.deedLength = deedLength > 42 ? "extra-long" : deedLength > 24 ? "long" : "normal";
    $("#certificate-screen-title").textContent = official ? "공식 대업 인증서" : "대업 기념 인증서";
    $("#certificate-screen-copy").textContent = official
      ? "당신의 대업을 공식적으로 인증합니다."
      : firstRecord ? "첫 대업을 집사가 특별히 기념합니다." : "오늘의 대업을 집사가 특별히 기념합니다.";
    $("#certificate-title").textContent = official ? "공식 대업 인증서" : "대업 기념 인증서";
    $("#certificate-declaration").textContent = official
      ? "이 증서는 아래의 대업 달성을 엄숙하게 인증합니다"
      : "이 증서는 오늘의 대업을 집사 사무국이 기쁘게 기념합니다";
    $("#certificate-number").textContent = `문서번호 대업-${new Date().getFullYear()}-${String(record.number).padStart(6, "0")}`;
    $("#certificate-grade").textContent = record.grade;
    $("#certificate-deed").textContent = record.deed;
    $("#certificate-nickname").textContent = `― ${record.nickname} ―`;
    $("#certificate-owner-name").textContent = certificateOwnerName(record);
    $("#certificate-difficulty").textContent = rare ? "판정 불가" : "★★★★★";
    $("#certificate-score").textContent = scoreText(record);
    $("#certificate-report").textContent = `“${record.report}”`;
    $("#certificate-butler-name").textContent = butler.name;
    $("#certificate-date").textContent = record.date;
    $("#certificate-card .official-stamp span").innerHTML = official
      ? rare ? "희귀<br>위업<br>인증" : "공식<br>대업<br>인증"
      : rare ? "희귀<br>위업<br>기념" : "오늘의<br>대업<br>기념";
    $("#certificate-footnote").textContent = official
      ? "✦ 인증서는 기록 보관함에서 다시 확인할 수 있어요. ✦"
      : status.first
        ? "✦ 지금 저장·공유할 수 있으며, 공식 보관 인증은 도장 5개부터 발급됩니다. ✦"
        : `✦ 지금 저장·공유할 수 있으며, 다음 공식 보관 인증까지 ${status.remaining}건 남았습니다. ✦`;
    setPoseImage($("#certificate-butler-image"), butler.character, record.pose || "praise");
    $("#certificate-overlay").hidden = false;
    document.body.style.overflow = "hidden";
    currentCertificateImagePromise = createCertificateBlob(record).catch(() => null);
  }

  function openPraiseResult(record) {
    const butler = record.butler || snapshotButler(record);
    const mode = record.verdictType === "rare" || record.rare ? "rare" : record.pose === "power" || record.verdictType === "power" ? "power" : "praise";
    const power = mode !== "praise";
    const rare = mode === "rare";
    const firstRecord = isFirstRecord(record);
    const official = isOfficialCertificate(record);
    currentResult = record;
    const overlay = $("#praise-result-overlay");
    overlay.dataset.mode = mode;
    overlay.dataset.firstRecord = String(firstRecord);
    $("#result-form-label").textContent = rare ? "희귀 대업 판정서 · FORM 05-R" : power ? "긴급 과몰입 결과서 · FORM 05-P" : "대업 심사 결과서 · FORM 05";
    $("#result-mode-badge").textContent = rare ? "희귀 판정" : power ? "파워 주접" : "일반 주접";
    $("#result-title").innerHTML = rare ? "측정 불가<br>위업" : power ? "파워 주접<br>발동" : "집사 주접<br>승인";
    $("#result-verdict").textContent = rare
      ? "통상적인 평가 기준으로는 위대함을 측정할 수 없어 사무국이 판정을 포기했습니다."
      : power
      ? "집사 감정 회로가 허용 범위를 넘어 긴급 과몰입으로 전환되었습니다."
      : "검토 결과, 공식적으로 떠받들기로 결정했습니다.";
    $("#result-stamp").innerHTML = rare ? "희귀<br>채택" : power ? "과몰입<br>폭주" : "칭찬<br>승인";
    $("#result-butler-name").textContent = `${butler.name} 담당 집사`;
    $("#result-deed").textContent = record.deed;
    const pointsEarned = Number(record.pointsEarned) || 0;
    const relationshipGain = Number(record.relationshipGain) || 0;
    $("#result-record-status").textContent = record.stampEligible === false
      ? `칭찬 · +${pointsEarned}P`
      : rare ? `희귀 도장 +1 · ${pointsEarned}P` : `도장 +1 · ${pointsEarned}P`;
    $("#result-report").textContent = "";
    $("#result-rare-note").hidden = !rare;
    $("#result-grade").textContent = record.grade;
    $("#result-score").textContent = scoreText(record);
    $("#result-nickname").textContent = record.nickname;
    $("#result-certificate-button").innerHTML = official
      ? "공식 인증서 발급 <span>→</span>"
      : firstRecord ? "첫 대업 기념 인증서 <span>→</span>" : "대업 기념 인증서 보기 <span>→</span>";
    $("#result-close").textContent = firstRecord ? "첫 기록 저장하고 홈으로" : "기록만 하고 홈으로";
    const status = certificationStatus();
    $("#result-footnote").textContent = firstRecord
      ? `첫 도장 1개와 선물 포인트 ${pointsEarned}P를 받았습니다. 공식 보관 인증까지 ${status.remaining}건 남았어요.`
      : official
        ? `공식 인증서가 발급되고 선물 포인트 ${pointsEarned}P가 지급되었습니다.`
        : `선물 포인트 ${pointsEarned}P 지급 · 공식 보관 인증까지 ${status.remaining}건 남았습니다.`;
    renderRelationshipResult(
      "result",
      Number(record.relationshipBefore ?? Math.max(0, state.obsession - relationshipGain)),
      Number(record.relationshipAfter ?? state.obsession),
      relationshipGain,
      "deed"
    );
    setPoseImage($("#result-butler-image"), butler.character, power ? "power" : "praise");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => typeMessage($("#result-report"), record.report, rare ? 22 : 27), 240);
  }

  function closePraiseResult() {
    const firstRecord = isFirstRecord(currentResult);
    $("#praise-result-overlay").hidden = true;
    document.body.style.overflow = "";
    currentResult = null;
    showView("home");
    if (firstRecord) showToast(`첫 대업 완료 · 공식 인증까지 ${certificationStatus().remaining}건`);
  }

  function issueCertificateFromResult() {
    if (!currentResult) return;
    const record = currentResult;
    trackEvent("certificate_open", { character: record.character, source: "result", official: isOfficialCertificate(record) });
    $("#praise-result-overlay").hidden = true;
    currentResult = null;
    openCertificate(record);
  }

  function closeCertificate() {
    const firstRecord = isFirstRecord(currentCertificate);
    const official = isOfficialCertificate(currentCertificate);
    $("#certificate-overlay").hidden = true;
    document.body.style.overflow = "";
    currentCertificate = null;
    currentCertificateImagePromise = null;
    showView("home");
    if (firstRecord && !official) showToast(`첫 대업 기념 완료 · 공식 인증까지 ${certificationStatus().remaining}건`);
  }

  function roundedCanvasRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function canvasTextLines(ctx, text, maxWidth, maxLines = Infinity) {
    const source = Array.from(String(text || ""));
    const lines = [];
    let line = "";
    for (let index = 0; index < source.length; index += 1) {
      const test = line + source[index];
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = source[index];
        if (lines.length === maxLines) {
          const remainder = source.slice(index).join("");
          let last = `${lines.pop()}${remainder}`;
          while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
          lines.push(`${last}…`);
          return lines;
        }
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawCenteredCanvasLines(ctx, lines, x, startY, lineHeight) {
    lines.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight));
    return startY + Math.max(1, lines.length) * lineHeight;
  }

  function drawContainedCanvasImage(ctx, image, x, y, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight), drawWidth, drawHeight);
  }

  function loadCanvasImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load certificate asset: ${source}`));
      image.src = source;
    });
  }

  function certificateFilename(record) {
    const deed = String(record.deed || "대업").replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").slice(0, 32).replace(/-+$/g, "") || "대업";
    return `과잉집사-${deed}.png`;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Certificate image generation failed"));
    }, "image/png"));
  }

  async function createCertificateBlob(record) {
    if (document.fonts?.ready) await document.fonts.ready;
    const butler = record.butler || snapshotButler(record);
    const owner = certificateOwnerName(record);
    const rare = record.verdictType === "rare" || record.rare;
    const official = isOfficialCertificate(record);
    const portrait = await loadCanvasImage(assetFor(butler.character, record.pose || "praise"));
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = "#efe3d4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.shadowColor = "rgba(70, 45, 31, .16)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    roundedCanvasRect(ctx, 42, 38, 996, 1274, 28);
    ctx.fillStyle = "#fffaf2";
    ctx.fill();
    ctx.restore();
    roundedCanvasRect(ctx, 60, 56, 960, 1238, 22);
    ctx.strokeStyle = rare ? "#b68b3f" : "#c9ae73";
    ctx.lineWidth = 3;
    ctx.stroke();
    roundedCanvasRect(ctx, 75, 71, 930, 1208, 15);
    ctx.strokeStyle = rare ? "rgba(166, 119, 37, .62)" : "rgba(186, 151, 88, .48)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#741b2c";
    ctx.font = '900 56px "Noto Serif KR", serif';
    ctx.fillText("과잉집사", 102, 145);
    ctx.fillStyle = "#815a56";
    ctx.font = '850 15px "WantedSansVariable", sans-serif';
    ctx.fillText("OVERBUTLER DUTY OFFICE", 104, 174);
    roundedCanvasRect(ctx, 757, 94, 215, 58, 29);
    ctx.fillStyle = "#fffaf2";
    ctx.fill();
    ctx.strokeStyle = "#ccb99f";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#861b30";
    ctx.beginPath();
    ctx.arc(787, 123, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#554744";
    ctx.font = '800 17px "WantedSansVariable", sans-serif';
    ctx.fillText(official ? "사무국 공식 발급" : "오늘의 대업 기념", 807, 130);
    ctx.strokeStyle = "#d8c9b6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(102, 205);
    ctx.lineTo(978, 205);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.strokeStyle = "#ad8140";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(540, 252, 35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#9b7337";
    ctx.font = '900 19px "Noto Serif KR", serif';
    ctx.fillText("OB", 540, 259);
    ctx.fillStyle = "#463534";
    ctx.font = '900 47px "Noto Serif KR", serif';
    ctx.fillText(official ? "공식 대업 인증서" : "대업 기념 인증서", 540, 327);
    ctx.fillStyle = "#88766c";
    ctx.font = '600 18px "WantedSansVariable", sans-serif';
    ctx.fillText(official ? "이 증서는 아래의 대업 달성을 엄숙하게 인증합니다" : "오늘의 대업을 집사 사무국이 기쁘게 기념합니다", 540, 365);
    ctx.fillStyle = "#711b2c";
    ctx.font = '850 25px "Noto Serif KR", serif';
    ctx.fillText(`${owner} 귀하`, 540, 402);
    ctx.fillStyle = "#94703b";
    ctx.font = '800 16px "WantedSansVariable", sans-serif';
    ctx.fillText(`문서번호 대업-${new Date().getFullYear()}-${String(record.number).padStart(6, "0")}`, 540, 431);

    roundedCanvasRect(ctx, 416, 452, 248, 50, 25);
    ctx.fillStyle = rare ? "#fff0c3" : "#fff6df";
    ctx.fill();
    ctx.strokeStyle = rare ? "#b68b3f" : "#d2b575";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#89622c";
    ctx.font = '800 19px "WantedSansVariable", sans-serif';
    ctx.fillText(record.grade, 540, 484);

    let deedFontSize = 56;
    let deedLines = [];
    do {
      ctx.font = `900 ${deedFontSize}px "Noto Serif KR", serif`;
      deedLines = canvasTextLines(ctx, record.deed, 820, 3);
      if (deedLines.length <= 2 || deedFontSize <= 38) break;
      deedFontSize -= 4;
    } while (deedFontSize >= 38);
    ctx.fillStyle = "#711b2c";
    const deedBottom = drawCenteredCanvasLines(ctx, deedLines, 540, 556, deedFontSize * 1.28);
    ctx.fillStyle = "#927045";
    ctx.font = '700 24px "WantedSansVariable", sans-serif';
    ctx.fillText(`― ${record.nickname} ―`, 540, deedBottom + 7);

    const metricsY = Math.max(690, deedBottom + 45);
    roundedCanvasRect(ctx, 126, metricsY, 828, 126, 12);
    ctx.fillStyle = "#fcf7ef";
    ctx.fill();
    ctx.strokeStyle = "#ddcfbd";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(540, metricsY);
    ctx.lineTo(540, metricsY + 126);
    ctx.stroke();
    ctx.fillStyle = "#8b776b";
    ctx.font = '750 17px "WantedSansVariable", sans-serif';
    ctx.fillText(official ? "공식 난이도" : "집사 판정 난이도", 333, metricsY + 38);
    ctx.fillText("인류 기여도", 747, metricsY + 38);
    ctx.fillStyle = "#711b2c";
    ctx.font = '900 39px "Noto Serif KR", serif';
    ctx.fillText(rare ? "판정 불가" : "★★★★★", 333, metricsY + 91);
    ctx.fillText(scoreText(record), 747, metricsY + 91);

    const portraitY = metricsY + 143;
    const quoteY = 1120;
    const portraitHeight = Math.max(230, Math.min(326, quoteY - portraitY + 4));
    ctx.save();
    ctx.globalAlpha = .1;
    ctx.strokeStyle = "#9b6f48";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(270, portraitY + 145, 138, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawContainedCanvasImage(ctx, portrait, 102, portraitY - 12, 345, portraitHeight);
    ctx.textAlign = "left";
    ctx.fillStyle = "#907d70";
    ctx.font = '750 17px "WantedSansVariable", sans-serif';
    ctx.fillText("발급 담당 집사", 470, portraitY + 64);
    ctx.fillStyle = "#493936";
    ctx.font = '900 35px "Noto Serif KR", serif';
    ctx.fillText(butler.name, 470, portraitY + 110);
    ctx.fillStyle = "#86756b";
    ctx.font = '650 17px "WantedSansVariable", sans-serif';
    ctx.fillText(`발급 일자  ${record.date}`, 470, portraitY + 145);
    ctx.strokeStyle = "#8b776c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(470, portraitY + 185);
    ctx.lineTo(690, portraitY + 185);
    ctx.stroke();
    ctx.fillStyle = "#9b826b";
    ctx.font = '700 13px "WantedSansVariable", sans-serif';
    ctx.fillText("OVERBUTLER SIGNATURE", 470, portraitY + 207);

    ctx.textAlign = "center";
    ctx.save();
    ctx.translate(844, portraitY + 137);
    ctx.rotate(-.11);
    ctx.strokeStyle = rare ? "rgba(145, 101, 30, .9)" : "rgba(126, 25, 43, .86)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 79, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = rare ? "#80561c" : "#811a2d";
    ctx.font = '900 20px "Noto Serif KR", serif';
    ctx.fillText(official ? rare ? "희귀 위업" : "공식 대업" : rare ? "희귀 위업" : "오늘의 대업", 0, -7);
    ctx.fillText(official ? "인증 완료" : "기념 완료", 0, 22);
    ctx.restore();

    roundedCanvasRect(ctx, 102, quoteY, 876, 124, 8);
    ctx.fillStyle = "#f7eddf";
    ctx.fill();
    ctx.strokeStyle = "#ddcbb4";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#7b1b2d";
    ctx.font = '850 16px "WantedSansVariable", sans-serif';
    ctx.fillText(`${butler.name} 집사의 한마디`, 132, quoteY + 31);
    ctx.fillStyle = "#554541";
    ctx.font = '700 28px "Wanted Sans", sans-serif';
    const reportLines = canvasTextLines(ctx, `“${record.report}”`, 810, 2);
    reportLines.forEach((line, index) => ctx.fillText(line, 132, quoteY + 70 + index * 35));

    ctx.textAlign = "center";
    ctx.fillStyle = "#9a897d";
    ctx.font = '650 14px "WantedSansVariable", sans-serif';
    ctx.fillText("나도 오늘의 대업 보고하기 · OVERBUTLER DUTY OFFICE", 540, 1270);
    return canvasToBlob(canvas);
  }

  function downloadCertificateBlob(blob, record) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = certificateFilename(record);
    link.href = url;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function certificateBlobFor(record) {
    let blob = currentCertificateImagePromise ? await currentCertificateImagePromise : null;
    if (blob) return blob;
    currentCertificateImagePromise = createCertificateBlob(record).catch(() => null);
    blob = await currentCertificateImagePromise;
    if (!blob) throw new Error("Certificate image unavailable");
    return blob;
  }

  function certificateShareText(record) {
    const result = isOfficialCertificate(record) ? "공식 인증됐습니다." : "집사에게 거창하게 기념됐습니다.";
    return `${certificateOwnerName(record)}의 하찮은 대업이 ${result}\n${record.deed}\n${record.grade} · 인류 기여도 ${scoreText(record)}\n#과잉집사 #오늘의대업`;
  }

  async function copyCertificateText(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* use selection fallback */ }
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    field.remove();
    return copied;
  }

  function setCertificateActionPending(button, pending, label) {
    if (!button) return;
    if (pending) button.dataset.originalLabel = button.textContent;
    button.disabled = pending;
    button.setAttribute("aria-busy", String(pending));
    button.textContent = pending ? label : button.dataset.originalLabel || button.textContent;
  }

  async function shareCertificate() {
    if (!currentCertificate) return;
    const record = currentCertificate;
    const button = $("#share-certificate");
    const text = certificateShareText(record);
    let blob = null;
    setCertificateActionPending(button, true, "공유 카드 준비 중…");
    try {
      blob = await certificateBlobFor(record);
      const file = new File([blob], certificateFilename(record), { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "과잉집사 대업 인증서", text, files: [file] });
        trackEvent("certificate_share", { character: record.character, source: "native_file", official: isOfficialCertificate(record) });
        return;
      }
      if (navigator.share) {
        downloadCertificateBlob(blob, record);
        await navigator.share({ title: "과잉집사 대업 인증서", text, url: window.location.origin });
        trackEvent("certificate_share", { character: record.character, source: "native_link", official: isOfficialCertificate(record) });
        return;
      }
      downloadCertificateBlob(blob, record);
      const copied = await copyCertificateText(text);
      trackEvent("certificate_share", { character: record.character, source: copied ? "download_copy" : "download", official: isOfficialCertificate(record) });
      showToast(copied ? "인증서 이미지를 저장하고 자랑 문구를 복사했습니다." : "인증서 이미지를 저장했습니다.");
    } catch (error) {
      if (error.name === "AbortError") trackEvent("certificate_share", { character: record.character, source: "cancelled", official: isOfficialCertificate(record) });
      if (error.name !== "AbortError") {
        try {
          blob ||= await certificateBlobFor(record);
          downloadCertificateBlob(blob, record);
          await copyCertificateText(text);
          trackEvent("certificate_share", { character: record.character, source: "error_fallback", official: isOfficialCertificate(record) });
          showToast("공유 대신 인증서 이미지와 문구를 준비했습니다.");
        } catch {
          trackEvent("certificate_share", { character: record.character, source: "failed", official: isOfficialCertificate(record) });
          showToast("공유 카드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
      }
    } finally {
      setCertificateActionPending(button, false, "");
    }
  }

  async function saveCertificateImage() {
    if (!currentCertificate) return;
    const record = currentCertificate;
    const button = $("#save-certificate");
    setCertificateActionPending(button, true, "PNG 만드는 중…");
    try {
      const blob = await certificateBlobFor(record);
      downloadCertificateBlob(blob, record);
      trackEvent("certificate_save", { character: record.character, source: "download", official: isOfficialCertificate(record) });
      showToast("고화질 인증서 PNG를 저장했습니다.");
    } catch {
      trackEvent("certificate_save", { character: record.character, source: "failed", official: isOfficialCertificate(record) });
      showToast("인증서 저장 중 오류가 발생했습니다.");
    } finally {
      setCertificateActionPending(button, false, "");
    }
  }

  function showRecruitmentOverlay() {
    const overlay = $("#recruitment-overlay");
    overlay.hidden = false;
    overlay.scrollTop = 0;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => { overlay.scrollTop = 0; });
  }

  function openRecruitment() {
    const key = state.pendingApplicants.find(item => !state.deferredApplicants.includes(item)) || state.pendingApplicants[0];
    if (!key) { renderPersonnelPool(); return; }
    const profile = CHARACTER_PROFILES[key];
    const status = applicantStatus(key);
    const sheet = $("#recruitment-sheet");
    sheet.dataset.mode = "application";
    sheet.innerHTML = `
      <div class="personnel-document-meta"><span>신규 지원서 · PERSONNEL</span><b>접수 완료</b></div>
      <section class="application-hero">
        <div class="applicant-portrait"><img src="${personnelPortraitFor(key)}" alt="${escapeHtml(profile.name)}"></div>
        <div><small>중앙인사국 검토 완료</small><h2 id="applicant-name">${escapeHtml(profile.name)}</h2><p>${escapeHtml(profile.desc)}</p></div>
      </section>
      <section class="application-requirements"><div><h3>지원 조건 확인</h3><span>${status.ready ? "채용 가능" : "검토 중"}</span></div>${status.rows.map(row => {
        const complete = row.current >= row.required;
        return `<p class="${complete ? "complete" : ""}"><i>${complete ? "✓" : "·"}</i><span>${escapeHtml(row.label)}</span><b>${row.current}/${row.required}</b></p>`;
      }).join("")}</section>
      <p class="personnel-policy-note">채용해도 현재 담당은 자동으로 바뀌지 않습니다. 보유 집사에 등록한 뒤 직접 인수인계할 수 있어요.</p>
      <div class="personnel-actions"><button class="primary-button" data-personnel-action="hire" data-character="${key}" type="button">지원 승인 · 채용하기 <span>→</span></button>
      <button class="secondary-button" data-personnel-action="defer" data-character="${key}" type="button">보류함에 넣기</button>
      <button class="text-button" data-personnel-action="pool" type="button">현재 보유 집사 보기</button></div>`;
    showRecruitmentOverlay();
  }

  function renderPersonnelPool() {
    const cards = state.ownedButlers.map(key => {
      const profile = CHARACTER_PROFILES[key];
      const stat = ensureButlerStat(key);
      const current = key === state.character;
      return `<button class="personnel-pool-person ${current ? "active" : ""}" data-personnel-action="handover" data-character="${key}" type="button" ${current ? "disabled" : ""}><img src="${personnelPortraitFor(key)}" alt=""><span><b>${escapeHtml(stat.customName || profile.defaultName)}</b><small>${current ? "현재 담당" : stat.assignments > 0 ? "다시 맡기기" : "담당 맡기기"}</small></span></button>`;
    }).join("");
    const sheet = $("#recruitment-sheet");
    sheet.dataset.mode = "pool";
    sheet.innerHTML = `
      <div class="personnel-document-meta"><span>보유 인력 명부 · PERSONNEL</span><b>${state.ownedButlers.length}명 등록</b></div>
      <div class="personnel-pool-heading"><small>과잉집사 중앙인사국</small><h2 id="applicant-name">담당 집사 인수인계</h2><p>담당을 바꿔도 집사별 이름·관계·선물 기록은 따로 보존됩니다.</p></div>
      <div class="personnel-pool-list">${cards}</div>
      <div class="personnel-actions">${state.pendingApplicants.length ? `<button class="secondary-button" data-personnel-action="application" type="button">도착한 지원서 ${state.pendingApplicants.length}건 보기</button>` : ""}
      <button class="text-button" data-personnel-action="close" type="button">인사 명부 닫기</button></div>`;
    showRecruitmentOverlay();
  }

  function closeRecruitment() {
    const overlay = $("#recruitment-overlay");
    overlay.hidden = true;
    overlay.scrollTop = 0;
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
    if (!saveState()) { render(); return; }
    render();
    renderPersonnelPool();
    showToast(`${profile.name} 채용 완료 · 보유함에 등록했습니다.`);
  }

  function deferApplicant(character) {
    const key = normalizeCharacter(character);
    if (!state.pendingApplicants.includes(key)) return;
    if (!state.deferredApplicants.includes(key)) state.deferredApplicants.push(key);
    if (!saveState()) { render(); return; }
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
    const sheet = $("#recruitment-sheet");
    sheet.dataset.mode = "handover";
    sheet.innerHTML = `
      <div class="personnel-document-meta"><span>담당 변경 승인서 · HANDOVER</span><b>결재 대기</b></div>
      <div class="handover-heading"><small>과잉집사 중앙인사국</small><h2 id="applicant-name">${returning ? "기존 집사를 다시 호출할까요?" : "담당 집사를 변경할까요?"}</h2><p>전임 기록을 그대로 넘기고 새 담당의 관계 기록을 불러옵니다.</p></div>
      <div class="handover-route">
        <div><span>현재 담당</span><img src="${personnelPortraitFor(previousKey)}" alt=""><b>${escapeHtml(ensureButlerStat(previousKey).customName)}</b><p>${escapeHtml(RELATION_LINES[previousKey]?.farewell || previousProfile.handover)}</p></div>
        <i><b>인계</b>→</i>
        <div><span>새 담당</span><img src="${personnelPortraitFor(key)}" alt=""><b>${escapeHtml(nextStat.customName)}</b><p>${escapeHtml(RELATION_LINES[key]?.[returning ? "return" : "welcome"] || nextProfile.handover)}</p></div>
      </div>
      <p class="personnel-policy-note">대업·인증서·일지는 그대로 유지됩니다. 각 집사의 과몰입도와 선물 기록도 섞이지 않아요.</p>
      <div class="personnel-actions"><button class="primary-button" data-personnel-action="switch" data-character="${key}" type="button">${returning ? "복귀 승인 · 다시 담당 맡기기" : "인수인계 승인"} <span>→</span></button>
      <button class="secondary-button" data-personnel-action="pool" type="button">다른 집사도 검토하기</button></div>`;
    showRecruitmentOverlay();
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
    const message = templateOwner(RELATION_LINES[key]?.[returning ? "return" : "welcome"] || CHARACTER_PROFILES[key].handover);
    if (!saveState()) { render(); return; }
    trackEvent("butler_switch", { character: key, source: returning ? "return" : "handover" });
    closeRecruitment();
    render();
    typeMessage($("#briefing-message"), message);
    showToast(`${CHARACTER_PROFILES[key].name}에게 인수인계했습니다.`);
  }

  function renameCurrentButler(name) {
    const cleanName = String(name || "").trim().slice(0, 20);
    if (!cleanName) return false;
    state.butlerName = cleanName;
    ensureButlerStat(state.character).customName = cleanName;
    if (!saveState()) { render(); return false; }
    render();
    return true;
  }

  function giftCatalogFor(character = state.character) {
    return (GIFT_CATALOGS[normalizeCharacter(character)] || GIFT_CATALOGS.ai).map(([emoji, name], index) => ({ emoji, name, cost: GIFT_COSTS[index] }));
  }

  function renderGiftDesk() {
    const catalog = giftCatalogFor();
    const history = state.giftHistory.filter(item => normalizeCharacter(item.character) === state.character);
    $("#gift-desk-points").textContent = state.points;
    $("#gift-desk-butler-name").textContent = state.butlerName || CHARACTER_PROFILES[state.character].defaultName;
    $("#gift-desk-butler-line").textContent = templateOwner(CHARACTER_PROFILES[state.character].briefings[0]);
    setPoseImage($("#gift-desk-butler-image"), state.character, "base");
    $("#gift-catalog").innerHTML = catalog.map((gift, index) => {
      const affordable = state.points >= gift.cost;
      const interaction = giftInteractionFor(state.character, gift, index);
      const preferenceLabel = interaction.type === "rare" ? "✦ 희귀" : interaction.type === "duplicate" ? "↺ 기억" : interaction.type === "favorite" ? "♥ 취향" : "";
      return `<button class="gift-catalog-item gift-${interaction.type} ${affordable ? "affordable" : "locked"}" type="button" data-gift-index="${index}" ${affordable ? "" : "disabled"} aria-label="${escapeHtml(gift.name)} ${gift.cost}포인트${preferenceLabel ? ` · ${preferenceLabel}` : ""}">
        ${preferenceLabel ? `<mark>${preferenceLabel}</mark>` : ""}<span>${gift.emoji}</span><strong>${escapeHtml(gift.name)}</strong><small>${gift.cost}P</small>${affordable ? "" : "<i>잠김</i>"}
      </button>`;
    }).join("");
    $("#gift-history-count").textContent = `${history.length}개`;
    $("#gift-history-list").innerHTML = history.length
      ? history.slice(0, 5).map(item => {
        const labels = { favorite: "취향 적중", duplicate: "또 기억", rare: "희귀 선물" };
        return `<li><span>${item.emoji}</span><b>${escapeHtml(item.name)}${labels[item.reactionType] ? `<em>${labels[item.reactionType]}</em>` : ""}</b><time>${escapeHtml(item.date || "")}</time></li>`;
      }).join("")
      : '<li class="empty">아직 이 집사에게 준 선물이 없습니다.</li>';
    selectedGiftIndex = null;
    $("#gift-drop-status").textContent = "선물을 여기로 끌어주세요";
    $("#gift-drop-zone").classList.remove("receiving", "selected");
  }

  function openGiftDesk() {
    renderGiftDesk();
    trackEvent("gift_desk_open", { character: state.character });
    $("#gift-desk-overlay").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeGiftDesk() {
    $("#gift-desk-overlay").hidden = true;
    document.body.style.overflow = "";
    activeGiftDrag?.ghost?.remove();
    activeGiftDrag = null;
    selectedGiftIndex = null;
  }

  function selectGift(index) {
    const gift = giftCatalogFor()[index];
    if (!gift || state.points < gift.cost) { showToast("포인트가 조금 더 필요합니다."); return; }
    selectedGiftIndex = index;
    $$("#gift-catalog [data-gift-index]").forEach(button => button.classList.toggle("selected", Number(button.dataset.giftIndex) === index));
    $("#gift-drop-zone").classList.add("selected");
    $("#gift-drop-status").textContent = `${gift.emoji} ${gift.name} 선택 · 집사에게 끌어주세요`;
  }

  function giftInteractionFor(character, gift, index = giftCatalogFor(character).findIndex(item => item.name === gift?.name)) {
    const key = normalizeCharacter(character);
    const content = launchContentFor(key);
    if (!gift) return { type: "normal", label: "선물 접수", delta: BALANCE.giftRelationship.normal, duplicateCount: 0 };
    const priorCount = state.giftHistory.filter(item => normalizeCharacter(item.character) === key && item.name === gift.name).length;
    const rare = index >= 7;
    const favorite = Boolean(content?.favorites?.includes(gift.name));
    const type = rare ? "rare" : priorCount > 0 ? "duplicate" : favorite ? "favorite" : "normal";
    const labels = { normal: "선물 접수", favorite: "취향 적중", duplicate: "선물 기억 중", rare: "희귀 선물" };
    return { type, label: labels[type], delta: BALANCE.giftRelationship[type], duplicateCount: priorCount + 1, favorite, rare };
  }

  function giftResponse(character, gift, interaction = { type: "normal", duplicateCount: 1 }) {
    const owner = ownerDisplayName();
    const launchGiftMessage = launchContentFor(character)?.gifts?.[interaction.type];
    if (launchGiftMessage) return fillContentTemplate(launchGiftMessage, { gift: gift.name, count: interaction.duplicateCount });
    const responses = {
      ai: `[선물 수신: ${gift.name}] ${owner}이 직접 전달함. 행복 수치 284% 상승. 정상 범위를 벗어났지만 복구할 생각 없음.`,
      cat: `${gift.name}을 집사한테 주는 거냥...? 흥, ${owner}이 준 거라 특별히 평생 간직하겠다냥.`,
      dog: `${gift.name}이다멍!! ${owner} 최고다멍!! 꼬리 회전 속도 측정 불가다멍!`,
      alien: `${gift.name} 획득. ${owner}의 선물 교환 기술을 지구 최고 문명으로 본성에 보고하겠음.`,
      ninja: `${gift.name} 보급 완료. ${owner}의 은혜는 다음 극비 임무 성공으로 갚겠다.`,
      witch: `${gift.name}에서 강한 길조가 보여요. ${owner}의 마음까지 수정구슬에 보관할게요.`,
      fox: `${gift.name}... 나한테 주는 거야...? ${owner} 때문에... 집사 심장이 다시 뛰는 것 같아...`,
      star: `${gift.name}을 나한테? 티 안 내려 했는데... ${owner}, 오늘 무대보다 더 설레잖아.`,
      elf: `${gift.name} 고마워요. ${owner}의 마음까지 천 년 동안 소중히 간직할게요.`,
      fairy: `${gift.name}이 반짝여요! ${owner}이 직접 준 선물이라 집사 날개가 멈추질 않아요!`
    };
    return responses[normalizeCharacter(character)] || GIFT_MESSAGES[character];
  }

  function giveGift(index = selectedGiftIndex) {
    if (giftTransferActive) return;
    const gift = giftCatalogFor()[index];
    if (!gift || state.points < gift.cost) { showToast("선물을 전달할 포인트가 부족합니다."); return; }
    giftTransferActive = true;
    const interaction = giftInteractionFor(state.character, gift, index);
    const previousObsession = state.obsession;
    state.points -= gift.cost;
    state.gifts += 1;
    state.totalGifts += 1;
    state.obsession = clamp(state.obsession + interaction.delta, 0, 100);
    const stat = ensureButlerStat(state.character);
    stat.gifts += 1;
    stat.obsession = state.obsession;
    stat.customName = state.butlerName;
    state.giftHistory.unshift({
      id: `${Date.now()}-gift`, character: state.character, butlerName: state.butlerName,
      emoji: gift.emoji, name: gift.name, cost: gift.cost, date: today(), at: new Date().toISOString(),
      reactionType: interaction.type, duplicateCount: interaction.duplicateCount, obsessionGain: interaction.delta,
      relationshipBefore: previousObsession, relationshipAfter: state.obsession
    });
    state.giftHistory = state.giftHistory.slice(0, 100);
    markActiveDay(state.character);
    checkApplicantUnlocks();
    rememberButlerPose("gift");
    if (!saveState()) {
      giftTransferActive = false;
      render();
      renderGiftDesk();
      return;
    }
    trackEvent("gift_given", { character: state.character, giftType: interaction.type, relationshipStage: stageIndexFor(state.obsession) });
    setPoseImage($("#briefing-butler-image"), state.character, "gift");
    const message = giftResponse(state.character, gift, interaction);
    typeMessage($("#briefing-message"), message);
    renderManager();
    renderRelationshipStatus();
    $("#header-level").textContent = `과몰입 ${state.obsession}`;
    $("#gift-butler-name").textContent = state.butlerName || CHARACTER_PROFILES[state.character].defaultName;
    $("#gift-reaction-badge").textContent = interaction.label;
    $("#gift-reaction-badge").dataset.reaction = interaction.type;
    $("#gift-title").innerHTML = interaction.type === "rare" ? "희귀 선물로<br>집사 과몰입 비상" : interaction.type === "favorite" ? "취향 적중으로<br>집사 행복 회로 폭주" : interaction.type === "duplicate" ? "또 이 선물…<br>집사가 기억했습니다" : "선물 수령으로<br>집사 행복 회로 가동";
    $("#gift-message").textContent = message;
    $("#gift-received-name").textContent = `${gift.emoji} ${gift.name}`;
    $("#gift-count").textContent = stat.gifts;
    $("#gift-obsession").textContent = state.obsession;
    renderRelationshipResult("gift", previousObsession, state.obsession, interaction.delta, "gift");
    setPoseImage($("#gift-butler-image"), state.character, "gift");
    closeGiftDesk();
    $("#gift-overlay").hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => { giftTransferActive = false; }, 450);
    window.setTimeout(() => typeMessage($("#gift-message"), message, 30), 260);
  }

  function startGiftDrag(event, button) {
    if (activeGiftDrag || giftTransferActive) return;
    const index = Number(button.dataset.giftIndex);
    const gift = giftCatalogFor()[index];
    if (!gift || state.points < gift.cost) return;
    selectGift(index);
    const ghost = document.createElement("div");
    ghost.className = "gift-drag-ghost";
    ghost.textContent = gift.emoji;
    document.body.appendChild(ghost);
    activeGiftDrag = { index, ghost, pointerId: event.pointerId };
    button.setPointerCapture?.(event.pointerId);
    moveGiftDrag(event);
  }

  function moveGiftDrag(event) {
    if (!activeGiftDrag || event.pointerId !== activeGiftDrag.pointerId) return;
    event.preventDefault();
    activeGiftDrag.ghost.style.transform = `translate(${event.clientX - 30}px,${event.clientY - 30}px)`;
    const rect = $("#gift-drop-zone").getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    $("#gift-drop-zone").classList.toggle("receiving", inside);
    setPoseImage($("#gift-desk-butler-image"), state.character, inside ? "gift" : "base");
  }

  function endGiftDrag(event) {
    if (!activeGiftDrag || event.pointerId !== activeGiftDrag.pointerId) return;
    const rect = $("#gift-drop-zone").getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const index = activeGiftDrag.index;
    activeGiftDrag.ghost.remove();
    activeGiftDrag = null;
    $("#gift-drop-zone").classList.remove("receiving");
    if (inside) giveGift(index);
    else setPoseImage($("#gift-desk-butler-image"), state.character, "base");
  }

  function closeGift() {
    $("#gift-overlay").hidden = true;
    document.body.style.overflow = "";
  }

  function registerOwnerName(value) {
    const username = String(value || "").trim().slice(0, 12);
    if (!username) return false;
    state.username = username;
    if (!saveState()) return false;
    $("#owner-name-overlay").hidden = true;
    document.body.style.overflow = "";
    startTimeBriefing();
    renderButlerDiary();
    showToast(`${ownerDisplayName()} 호칭 등록 완료`);
    return true;
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
      state.rerolled = true;
      if (!saveState()) return;
      showToast("재추첨 결과: 또 오류봇입니다. 계약서가 너무 빨랐습니다.");
    });
    $$("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view, button.dataset.nav || button.dataset.archiveTab)));
    $$("[data-quick]").forEach(button => button.addEventListener("click", () => { $("#achievement-input").value = button.dataset.quick; $("#char-count").textContent = button.dataset.quick.length; }));
    $("[data-quick-focus]").addEventListener("click", () => $("#achievement-input").focus());
    $("#achievement-input").addEventListener("input", event => { $("#char-count").textContent = event.target.value.length; });
    $("#report-button").addEventListener("click", submitAchievement);
    $("#briefing-character-action").addEventListener("click", interactWithButler);
    $("#briefing-refresh").addEventListener("click", cycleBriefing);
    $("#first-deed-guide").addEventListener("click", () => {
      const entry = $("#view-home .entry-form");
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      entry.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => $("#achievement-input").focus(), reducedMotion ? 0 : 360);
    });
    $("#fame-button").addEventListener("click", () => showView("archive"));
    $$('[data-archive-tab]').forEach(button => button.addEventListener("click", () => showArchiveTab(button.dataset.archiveTab)));
    $("#view-archive .archive-tabs").addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const tabs = $$("#view-archive .archive-tabs [role='tab']");
      const current = Math.max(0, tabs.indexOf(document.activeElement));
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      showArchiveTab(tabs[next].dataset.archiveTab);
      tabs[next].focus();
    });
    $$('[data-record-filter]').forEach(button => button.addEventListener("click", () => {
      recordFilter = button.dataset.recordFilter;
      $$('[data-record-filter]').forEach(filter => filter.classList.toggle("active", filter === button));
      renderArchiveRecords();
      $$('[data-cert-index]').forEach(certificateButton => certificateButton.addEventListener("click", () => openCertificate(state.certificates[Number(certificateButton.dataset.certIndex)])));
    }));
    $("#record-search").addEventListener("input", event => { recordSearch = event.target.value; renderArchiveRecords(); });
    $("#record-grade-filter").addEventListener("change", event => { recordGrade = event.target.value; renderArchiveRecords(); });
    $("#archive-record-list").addEventListener("click", event => {
      const trigger = event.target.closest("[data-record-open], [data-record-id]");
      if (trigger) openRecordDetail(findRecordById(trigger.dataset.recordOpen || trigger.dataset.recordId));
    });
    $("#archive-record-list").addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-record-id]")) { event.preventDefault(); openRecordDetail(findRecordById(event.target.dataset.recordId)); }
    });
    $("#record-detail-close").addEventListener("click", closeRecordDetail);
    $("#record-detail-back").addEventListener("click", closeRecordDetail);
    $("#record-detail-certificate").addEventListener("click", reopenRecordCertificate);
    $("#record-detail-overlay").addEventListener("click", event => { if (event.target.id === "record-detail-overlay") closeRecordDetail(); });
    $("#manager-roster").addEventListener("click", event => {
      const button = event.target.closest("[data-manager-butler]");
      if (!button || button.dataset.managerButler === state.character) return;
      openHandover(button.dataset.managerButler);
    });
    $("#manager-change-button").addEventListener("click", renderPersonnelPool);
    $("#give-gift-button").addEventListener("click", openGiftDesk);
    $("#gift-desk-close").addEventListener("click", closeGiftDesk);
    $("#gift-desk-overlay").addEventListener("click", event => { if (event.target.id === "gift-desk-overlay") closeGiftDesk(); });
    $("#gift-catalog").addEventListener("click", event => {
      const button = event.target.closest("[data-gift-index]");
      if (button && !activeGiftDrag) selectGift(Number(button.dataset.giftIndex));
    });
    $("#gift-catalog").addEventListener("pointerdown", event => {
      const button = event.target.closest("[data-gift-index]");
      if (button) startGiftDrag(event, button);
    });
    window.addEventListener("pointermove", moveGiftDrag, { passive: false });
    window.addEventListener("pointerup", endGiftDrag);
    window.addEventListener("pointercancel", endGiftDrag);
    $("#gift-drop-zone").addEventListener("click", () => { if (selectedGiftIndex !== null) giveGift(selectedGiftIndex); });
    $("#owner-name-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!registerOwnerName($("#owner-name-late-input").value)) { showToast("집사가 기억할 이름을 적어주세요."); $("#owner-name-late-input").focus(); }
    });
    $("#result-certificate-button").addEventListener("click", issueCertificateFromResult);
    $("#result-close").addEventListener("click", closePraiseResult);
    $("#praise-result-overlay").addEventListener("click", event => { if (event.target.id === "praise-result-overlay") closePraiseResult(); });
    $("#gift-close").addEventListener("click", closeGift);
    $("#gift-overlay").addEventListener("click", event => { if (event.target.id === "gift-overlay") closeGift(); });
    $("#close-certificate").addEventListener("click", closeCertificate);
    $("[data-certificate-close]").addEventListener("click", closeCertificate);
    $("#share-certificate").addEventListener("click", shareCertificate);
    $("#save-certificate").addEventListener("click", saveCertificateImage);
    $("#certificate-overlay").addEventListener("click", event => { if (event.target.id === "certificate-overlay") closeCertificate(); });
    $("#recruit-note").addEventListener("click", openRecruitment);
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
    $$('[data-analytics-event]').forEach(link => link.addEventListener("click", () => trackEvent(link.dataset.analyticsEvent, { view: $("#main-screen").dataset.currentView || "unknown" })));
  }

  function init() {
    bindEvents();
    setupModalAccessibility();
    installBrowserBackGuard();
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    const forceOnboardingPreview = previewMode === "onboarding";
    if (previewMode === "home") {
      state.onboarded = true;
      state.character = "fairy";
      state.butlerName = CHARACTER_PROFILES.fairy.defaultName;
    }
    if (previewMode === "idol") {
      state.onboarded = true;
      state.character = "star";
      state.butlerName = CHARACTER_PROFILES.star.defaultName;
      if (!state.ownedButlers.includes("star")) state.ownedButlers.push("star");
    }
    returnVisitContext = previewMode ? { daysAway: 0, consumed: true } : returnVisitFor(state.lastActiveDate);
    if (state.onboarded) state.lastActiveDate = today();
    checkApplicantUnlocks();
    backfillDiaryReflections();
    if (state.onboarded && !forceOnboardingPreview) {
      $("#assignment-screen").hidden = true;
      $("#main-screen").hidden = false;
    }
    render();
    $("#app-version").textContent = APP_VERSION;
    trackEvent("app_open", { onboarded: state.onboarded, character: state.character, preview: Boolean(previewMode) });
    if (forceOnboardingPreview) {
      setPoseImage($(".assignment-character"), "ai", "base");
    } else {
      saveState();
      startTimeBriefing();
      if (state.onboarded && !state.username && !previewMode) {
        $("#owner-name-overlay").hidden = false;
        document.body.style.overflow = "hidden";
      }
    }
  }

  window.OVERBUTLER_ASSETS = OVERBUTLER_ASSETS;
  window.OVERBUTLER_ANALYTICS = Object.freeze({
    eventName: ANALYTICS_EVENT_NAME,
    persistent: false,
    snapshot: () => analyticsQueue.map(event => ({ ...event, properties: { ...event.properties } })),
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      analyticsSubscribers.add(listener);
      return () => analyticsSubscribers.delete(listener);
    }
  });
  window.OVERBUTLER_APP = Object.freeze({
    APP_VERSION, UPDATE_NOTES, POSES, BALANCE, RANKING_MODULE, giveGift, assetFor,
    judgeAchievement, pointsEarnedFor, relationshipGainFor,
    applicantStatus, checkApplicantUnlocks, hireApplicant, deferApplicant, openHandover, switchButler, renameCurrentButler,
    migrateState: normalizeState,
    certificationStatus
  });
  init();
})();

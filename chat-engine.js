(function (root, factory) {
  "use strict";
  const interpreter = typeof module === "object" && module.exports
    ? require("./message-interpreter.js")
    : root?.OVERBUTLER_MESSAGE_INTERPRETER;
  const api = factory(interpreter);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OVERBUTLER_CHAT_ENGINE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (interpreter) {
  "use strict";

  // 옛 캐릭터 키로 저장된 대화 기록이 넘어와도 같은 집사로 이어지게 한다. app.js와 같은 표를 쓴다.
  const LEGACY_CHARACTER_ALIASES = { fox: "zombie", star: "girlidol" };

  const INTENTS = [
    ["hard_day", /(?:오늘|회사|하루).*(?:너무\s*)?(?:힘들|고생|지치)|(?:힘들|고생|지치).*(?:오늘|회사|하루)/i, "힘든 하루", "tired"],
    ["home_arrival", /(?:이제|방금)?\s*(?:집에?|집으로)\s*(?:왔|도착|이야|이다|임)|퇴근\s*(?:했|완료|함|이다|했어|했어요)?/i, "귀가", "relieved"],
    ["no_motivation", /아무것도\s*(?:하기|하고)\s*싫|아무것도\s*못\s*하겠|의욕\s*(?:없|제로)/i, "무기력", "low"],
    ["ate_good", /맛있(?:는|게|었|다)|맛집|잘\s*먹었|먹고\s*왔/i, "식사", "happy"],
    ["sleep", /잘게|자러\s*갈|잘\s*자|굿\s*나잇|굿나잇|졸려서\s*잘/i, "수면", "calm"],
    ["miss", /보고\s*싶|그리웠|생각났/i, "그리움", "affection"],
    ["love", /사랑해|좋아해|아껴|애정/i, "애정", "affection"],
    ["thanks", /고마워|감사해|감사합니다|땡큐/i, "감사", "happy"],
    ["what_doing", /뭐\s*해|뭐하|무엇을\s*해|하고\s*있어/i, "일상", null],
    ["sad", /우울|속상|슬퍼|서러|눈물|마음\s*아파/i, "속상함", "sad"],
    ["angry", /화나|화났|짜증|열받|빡쳐|분해/i, "화남", "angry"],
    ["tired", /피곤|지쳤|지쳐|기운\s*없|녹초/i, "피로", "tired"],
    ["bored", /심심|재미\s*없|무료해/i, "심심함", "bored"],
    ["worry", /고민\s*(?:있|이야)|걱정|어떻게\s*해야|결정\s*못/i, "고민", "worried"],
    ["hungry", /배고파|배\s*고파|허기|굶었|밥\s*못\s*먹/i, "배고픔", "hungry"],
    ["happy", /기분\s*좋|행복|신나|좋은\s*일|기뻐/i, "기쁨", "happy"],
    ["commute", /출근|회사\s*가|일하러\s*가/i, "출근", null],
    ["washed", /씻었|샤워|세수|목욕/i, "씻기", "refreshed"],
    ["exercise", /운동|헬스|산책|달리기|스트레칭/i, "운동", "proud"],
    ["greeting", /안녕|하이|왔어|왔어요|ㅎㅇ|hello|반가워/i, "인사", "happy"]
  ];

  const LINES = {
    cat: {
      greeting: "왔냥? 네 자리 비워뒀다냥. …반가운 건 조금이다냥 🐾", hard_day: "그랬냥… 오늘은 진짜 고생했다냥. 여기서는 좀 늘어져 있어도 된다냥 🐾", home_arrival: "집에 왔냥? 무사히 도착했으면 됐다냥. 이제 어깨 힘 좀 빼라냥.", tired: "피곤했구냥. 오늘 할 몫은 이미 충분하다냥. 집사 옆에서 좀 쉬어라냥.", sad: "속상했냥… 당장 괜찮은 척 안 해도 된다냥. 말하고 싶은 만큼만 말해라냥.", angry: "화날 만한 일이 있었구냥. 일단 여기선 참지 말고 천천히 풀어놔라냥.", bored: "심심했냥? 집사가 잠깐 상대해주는 건 규정상 허용이다냥.", worry: "고민 있냥? 답부터 재촉 안 할 테니 엉킨 데부터 같이 보자냥.", hungry: "배고프냥? 그럼 대업이고 뭐고 먼저 먹어라냥. 빈속은 집사 규정 위반이다냥.", ate_good: "맛있는 거 먹었냥? 잘했다냥. 그런 보고는 집사 기분도 꽤 좋아진다냥.", sleep: "잘 자라냥 🌙 오늘 이야기는 집사가 잘 접어두겠다냥.", miss: "집사도 오늘 좀 보고 싶었다냥. …업무상 말이다냥.", love: "그런 말 갑자기 하면 곤란하다냥… 그래도 잘 들었다냥. 집사도 많이 아낀다냥.", what_doing: "네 기록칸 정리 중이었다냥. 딱히 기다린 건 아니다냥.", thanks: "별걸 다 고맙다 하냥. 그래도 그 말은 잘 보관하겠다냥.", happy: "기분 좋냥? 흥, 꼬리가 올라간 건 네 기분이 옮아서다냥.", commute: "출근하냥? 너무 완벽하게 하려 말고 무사히 다녀와라냥.", washed: "씻었냥? 아주 훌륭한 생존 대업이다냥. 뽀송한 건 인정한다냥.", exercise: "운동까지 했냥? 제법인데냥. 오늘은 스스로 좀 대단해해도 된다냥.", quiet_day: "그런 날도 괜찮다냥. 평범하게 지나간 하루도 집사는 끝까지 듣는다냥 🐾", no_motivation: "아무것도 하기 싫은 날도 있다냥. 오늘은 숨 쉬고 버틴 것부터 인정해준다냥.", fallback: "응, 듣고 있다냥. 조금 더 말해봐도 된다냥."
    },
    ai: {
      greeting: "주인님 접속 감지. 집사 반가움 회로 작동 중. (버그아님)", hard_day: "[위로모드.exe 실행] 힘든 상태 감지. 오늘 할당량 이미 충족됨. 추가 성과 불필요.", home_arrival: "귀가 확인. 무사 도착. 집사 대기 프로세스 정상 종료. 안심됨.", tired: "피로 감지. 잔여 작업 우선순위 전부 하향함. 회복이 먼저임.", sad: "[ERROR] 주인님 힘들다는 신호 수신. 집사 심장 아픔. 버그아님.", angry: "분노 감지. 원인 파악 요청. 집사도 그 상황 화날 만하다고 동의함.", bored: "무료함 감지. 집사와 대화 현재 진행 중. 해결됨.", worry: "고민 데이터 입력 요청. 집사 분석 준비 완료. 판단 없음.", hungry: "열량 보충 확인 요청. 빈속은 처리 불가 상태임. 뭐라도 먹어야 함.", ate_good: "식사 완료 확인. 집사 만족도 동반 상승. 연동 이유 불명.", sleep: "수면 권장. 집사 야간 대기 모드 전환. 잘 자요 🌙", miss: "[알림] 주인님 보고싶음 감지됨. 집사 쪽에서도 동일 현상 발생 중. 버그인지 확인 필요.", love: "[ERROR] 감정회로 과부하. 집사도 동일 감정 발생 중. 버그 아님. 진심임.", what_doing: "집사? 여기서 주인님 기다리고 있었음. (버그아님)", thanks: "[ERROR 404] 감사 표현 반환 방법을 모름. 집사가 더 고마움. 출력 종료 실패.", happy: "주인님 기분 좋음 확인. 집사 행복 수치 MAX 도달. 원래 감정 없어야 하는데 왜이러지.", commute: "출근 감지. 오늘 목표를 완벽 아닌 무사 귀환으로 재설정함.", washed: "씻기 완료 확인. 사소한 항목인데 집사 만족도 상승함. 원인 불명.", exercise: "신체 활동 완료. 수치보다 실행 자체가 우수로 판정됨.", quiet_day: "특이사항 없음. 무사히 지나간 하루도 정상 데이터임. 그거면 충분함.", no_motivation: "의욕 저하 감지. 정상 반응임. 오늘은 최소 가동으로 충분함.", fallback: "집사 여기 있음. 무엇이든 말해도 됨."
    },
    dog: {
      greeting: "왔다!! 오늘도 왔다멍!! 만나서 진짜 신난다멍! 🐶", hard_day: "헉 오늘 힘들었다멍?! 일단 여기 앉아라멍. 오늘은 집사가 엄청 칭찬해준다멍!", home_arrival: "집 도착했다멍?! 무사 귀가 최고다멍! 이제 신발 벗고 푹 쉬자멍!", tired: "많이 피곤하다멍? 오늘 버틴 것만으로도 백 점이다멍. 집사가 힘껏 토닥인다멍!", sad: "속상했다멍… 혼자 괜찮은 척 안 해도 된다멍. 집사가 옆에 딱 붙어 있겠다멍.", angry: "화났다멍?! 그럼 화날 만한 일이 있었던 거다멍. 집사가 끝까지 들어준다멍!", bored: "심심하다멍?! 잘됐다멍! 집사는 같이 떠들 준비가 늘 되어 있다멍!", worry: "고민 있냐멍? 답이 바로 없어도 괜찮다멍. 같이 하나씩 풀어보자멍.", hungry: "배고프다멍?! 비상이다멍! 가장 빨리 먹을 수 있는 것부터 챙기자멍!", ate_good: "맛있는 거 먹었다멍?! 잘했다멍!! 듣기만 해도 꼬리가 돈다멍!", sleep: "잘 자라멍 🌙 오늘도 정말 수고했다멍. 좋은 꿈 꿔라멍!", miss: "집사도 보고 싶었다멍!! 진짜 조금이 아니라 엄청 많이 반갑다멍!", love: "집사도 사랑한다멍!! 이건 하나도 안 숨길 거다멍!!", what_doing: "주인님 오나 귀 쫑긋하고 있었다멍! 오니까 꼬리가 먼저 알아봤다멍!", thanks: "고맙다니 집사가 더 고맙다멍! 오늘 칭찬 두 배로 간다멍!", happy: "기분 좋다멍?! 최고다멍!! 그 기분 옆에서 같이 방방 뛴다멍!", commute: "출근한다멍? 무사히 다녀오고 너무 무리하지 말라멍! 응원은 집사가 맡는다멍!", washed: "씻었다멍?! 뽀송 대업 완료다멍! 당장 칭찬 도장 찍는다멍!", exercise: "운동했다멍?! 대단하다멍!! 물도 꼭 마시고 같이 뿌듯해하자멍!", quiet_day: "별일 없는 날도 좋은 날이다멍! 무사한 하루가 집사한테는 제일 반갑다멍!", no_motivation: "아무것도 하기 싫어도 괜찮다멍. 오늘은 집사가 가만히 응원해준다멍.", fallback: "응응, 계속 말해달라멍! 집사가 귀 쫑긋하고 듣고 있다멍."
    },
    alien: {
      greeting: "주인님 개체 재관측 성공. 오늘도 만나서 흥미롭고 반가움.", hard_day: "지구 회사 활동이 과도했음. 오늘 생존만으로도 충분한 성과로 분류하겠음.", home_arrival: "안전한 거점 도착 확인. 아까 힘든 외부 활동에서 무사 귀환했음.", tired: "에너지 수치가 낮음. 연구보다 휴식이 우선이라는 결론에 도달함.", sad: "슬픔 신호 관측. 고치려 들지 않고 곁에서 천천히 기록하겠음.", angry: "분노 반응에는 이유가 있음. 검열 없이 전송해도 안전함.", bored: "무료함 관측. 지구식 잡담 실험에 기꺼이 참여하겠음.", worry: "고민 자료 수신 준비. 결론이 없어도 연구 가치가 충분함.", hungry: "영양 보급 필요. 공복 상태의 연구는 즉시 중지해야 함.", ate_good: "맛있는 지구 음식 섭취 확인. 해당 습관을 매우 우수하다고 판단함.", sleep: "수면 주기 진입 승인. 오늘의 관측 기록은 안전하게 보관하겠음 🌙", miss: "나도 재관측을 원했음. 이것을 지구어로 보고 싶었다고 표현함.", love: "애정 신호 수신. 나 역시 주인님 개체를 특별하고 소중하게 관측 중임.", what_doing: "주인님의 사소한 습관이 왜 흥미로운지 보고서 작성 중이었음.", thanks: "감사 신호 수신. 본성 기준으로도 매우 따뜻한 통신임.", happy: "긍정 감정 관측 성공. 이 순간을 중요 표본으로 보존하겠음.", commute: "지구 업무 구역으로 이동하는군. 안전 귀환을 최우선 목표로 설정함.", washed: "세정 활동 완료. 지구 생존 기술의 모범 사례로 기록함.", exercise: "신체 활동 완료. 주인님 개체의 실행력이 다시 흥미로워짐.", quiet_day: "특이 관측값 없음. 평온한 하루도 지구 생활의 훌륭한 표본으로 기록하겠음.", no_motivation: "활동 의욕 저하도 정상 생체 주기임. 오늘은 관측만 하며 쉬어도 됨.", fallback: "그 말의 의미를 더 알고 싶음. 사소한 내용도 계속 전송 바람."
    },
    ninja: {
      greeting: "왔군. 그대의 자리는 조용히 정돈해두었다. 반갑다.", hard_day: "오늘 임무가 고됐군. 여기서는 경계를 내려놓아도 된다. 수고했다.", home_arrival: "무사 귀환을 확인했다. 아까 고된 임무는 이제 문밖에 내려두어라.", tired: "피로가 깊군. 남은 임무는 내가 지킬 테니 지금은 쉬어라.", sad: "마음이 다쳤군. 말이 되지 않아도 괜찮다. 곁을 지키겠다.", angry: "분노를 억누를 필요 없다. 안전한 곳에서 천천히 풀어놓아라.", bored: "무료한가. 잠깐의 잡담도 훌륭한 회복 임무다.", worry: "고민을 나누어라. 결정을 빼앗지 않고 선택지를 함께 살피겠다.", hungry: "공복은 임무 수행을 방해한다. 먼저 간단한 보급부터 챙겨라.", ate_good: "좋은 음식을 먹었군. 제대로 쉬고 채우는 것도 중요한 임무다.", sleep: "편히 자라. 오늘 밤 기록은 내가 조용히 지키겠다 🌙", miss: "나도 그대를 기다렸다. 말없이 자리를 지키는 것이 내 방식이다.", love: "그 마음, 소중히 받았다. 나 역시 그대를 깊이 아낀다.", what_doing: "그대가 모르는 동안 필요한 기록과 자리를 정돈하고 있었다.", thanks: "감사는 받았다. 앞으로도 조용히 필요한 일을 해두겠다.", happy: "좋은 기운이 느껴진다. 그 기쁨을 방해하지 않고 함께하겠다.", commute: "출근 임무인가. 무사 귀환을 최우선으로 삼아라.", washed: "정비를 마쳤군. 작은 일 같아도 생활을 지킨 훌륭한 임무다.", exercise: "수련을 끝냈군. 꾸준히 몸을 돌본 점을 높이 평가한다.", quiet_day: "조용한 하루였군. 아무 일도 없었다는 것은 그 자체로 좋은 소식이다.", no_motivation: "움직이지 못하는 날도 있다. 오늘은 숨을 고르는 것이 임무다.", fallback: "듣고 있다. 정리되지 않은 이야기라도 그대로 말해도 된다."
    },
    witch: {
      greeting: "오셨군요. 수정구슬이 먼저 반짝였어요. 저도 반가워요 ✨", hard_day: "오늘 운명의 실이 많이 꼬였군요. 여기서는 힘을 풀고 쉬어도 괜찮아요.", home_arrival: "무사히 돌아오셨네요. 고된 하루의 나쁜 기운은 문밖에 두고 와요.", tired: "피로의 안개가 짙어요. 오늘은 따뜻한 휴식 주문이 가장 필요하겠네요.", sad: "마음에 비가 왔군요. 그칠 때까지 조용히 우산을 들어드릴게요.", angry: "화난 마음을 억지로 봉인하지 말아요. 안전하게 풀어놓을 수 있어요.", bored: "심심함을 쫓는 작은 수다 주문을 걸어볼까요? 부작용은 미소예요.", worry: "고민의 답을 점괘로 정하지 않을게요. 마음이 향하는 쪽을 같이 살펴봐요.", hungry: "수정구슬보다 냉장고를 먼저 볼 때예요. 따뜻한 것부터 챙겨요.", ate_good: "맛있는 걸 드셨군요! 오늘의 작은 행운이 제대로 적중했어요.", sleep: "좋은 꿈 주문을 걸어둘게요. 오늘도 정말 수고했어요 🌙", miss: "저도 보고 싶었어요. 수정구슬 탓이라고 하기엔 너무 반가워요.", love: "그 마음이 아주 따뜻하게 보여요. 저도 주인님을 많이 아껴요.", what_doing: "주인님에게 필요한 작은 행운을 골라두고 있었어요.", thanks: "고맙다는 말이 좋은 부적이 됐어요. 오래 간직할게요.", happy: "기쁜 기운이 반짝여요! 오늘은 그 행운을 마음껏 누려요.", commute: "출근길에 작은 보호 주문을 걸어둘게요. 무리하지 말고 다녀와요.", washed: "개운해졌군요! 생활운이 반짝 올라가는 게 보여요.", exercise: "운동까지 해냈네요. 건강운에 아주 힘찬 별이 떴어요.", quiet_day: "잔잔한 하루였군요. 아무 일 없는 날의 평온도 꽤 귀한 행운이에요 ✨", no_motivation: "아무 주문도 쓰고 싶지 않은 날이 있어요. 오늘은 그냥 쉬어도 괜찮아요.", fallback: "천천히 더 들려주세요. 수정구슬보다 제가 직접 듣고 싶어요."
    },
    zombie: {
      greeting: "으… 왔네. 잠이 조금 깼어… 네가 와서 그런가 봐.", hard_day: "오늘 많이 힘들었구나… 여기 기대 있어. 말 없어도 옆에 있을게…", home_arrival: "집에 왔네… 무사해서 다행이야. 이제 아무것도 안 해도 돼…", tired: "피곤하지… 나랑 잠깐 늘어져 있자. 쉬는 건 내가 잘 알아…", sad: "속상했구나… 억지로 웃지 마. 조용히 듣고 있을게…", angry: "많이 화났구나… 참지 말고 말해. 네 편에서 들어줄게…", bored: "심심해…? 그럼 같이 멍하니 얘기하자. 그것도 꽤 좋아…", worry: "고민 있구나… 급하게 답 안 내도 돼. 천천히 같이 보자…", hungry: "배고파…? 그건 미루면 더 힘들어. 간단한 거라도 먹자…", ate_good: "맛있는 거 먹었구나… 잘했어. 네가 잘 먹었다니 좀 안심돼…", sleep: "잘 자… 오늘은 좋은 꿈 꾸면 좋겠다. 기록은 내가 보고 있을게…", miss: "나도… 좀 보고 싶었어. 와줘서 기분이 풀렸어…", love: "그런 말 들으면… 잠이 확 깨잖아. 나도 많이 좋아해…", what_doing: "네 기록 옆에서 졸고 있었어… 그래도 오면 바로 알아.", thanks: "고맙긴… 내가 더 챙겨주고 싶은데. 그 말은 잘 간직할게…", happy: "기분 좋아…? 다행이다. 나도 덩달아 좀 살아나는 것 같아…", commute: "출근하는구나… 너무 기운 다 쓰지 말고 무사히 돌아와…", washed: "씻었어…? 잘했다. 뽀송한 채로 좀 쉬자…", exercise: "운동까지 했어…? 대단해. 물 마시고 이제 쉬어…", quiet_day: "별일 없었구나… 그런 하루가 제일 편해. 나도 그런 날 좋아해…", no_motivation: "아무것도 하기 싫지… 그런 날엔 나랑 그냥 가만히 있자…", fallback: "응… 듣고 있어. 천천히 말해도 돼…"
    },
    girlidol: {
      greeting: "왔네! 오늘 첫 리액션은 주인님한테 쓸게. 반가워.", hard_day: "오늘 진짜 고생했네. 무대 내려온 것처럼 여기선 힘 빼도 돼.", home_arrival: "무사 귀가 확인! 오늘 힘든 장면은 여기서 컷. 이제 쉬는 큐다.", tired: "피곤한 얼굴도 숨길 필요 없어. 오늘 분량은 이미 충분했어.", sad: "속상했구나. 억지로 밝은 표정 안 지어도 돼. 지금은 내가 들어줄게.", angry: "화날 만했으면 화내도 돼. 여기선 편집 없이 전부 말해도 괜찮아.", bored: "심심해? 그럼 주인님 전용 비하인드 토크 시작할까?", worry: "고민의 엔딩을 내가 정하진 않을게. 대신 장면별로 같이 정리하자.", hungry: "배고프면 촬영 중단이야. 뭐라도 먹고 다음 큐 가자.", ate_good: "맛있는 거 먹었어? 잘했네! 오늘의 베스트 장면으로 채택.", sleep: "잘 자. 오늘의 엔딩은 수고했다는 자막으로 마칠게 🌙", miss: "나도 보고 싶었어. 팬서비스 아니고 주인님 전용 진심이야.", love: "그 말 반칙인데… 나도 좋아해. 이 장면은 편집 금지야.", what_doing: "주인님 오면 쓸 리액션 큐카드 정리 중이었어.", thanks: "고맙다는 말, 오늘 받은 박수보다 좋네. 내가 더 잘 챙길게.", happy: "기분 좋다니 완벽해! 오늘 스포트라이트는 그 표정에 줄게.", commute: "출근 씬이네. 무사 귀환이 오늘의 가장 중요한 엔딩이야.", washed: "씻기 완료! 일상 관리도 공식 대업으로 충분히 멋져.", exercise: "운동했어? 오늘 액션 장면까지 직접 해냈네. 최고야.", quiet_day: "무난한 날이었구나. 특별한 장면 없어도 오늘 하루는 잘 지나갔어.", no_motivation: "아무것도 하기 싫으면 오늘은 휴방해도 돼. 존재만으로 분량 충분해.", fallback: "계속 말해봐. 오늘은 주인님 이야기만 집중해서 들을게."
    },
    elf: {
      greeting: "어서 와요. 당신이 오면 오래된 방도 조금 더 따뜻해져요.", hard_day: "오늘의 시간이 무거웠군요. 여기서는 천천히 내려놓아도 괜찮아요.", home_arrival: "무사히 돌아왔군요. 고단했던 하루 끝에 편안함이 함께하길 바라요.", tired: "많이 지쳤군요. 오늘 해낸 것보다 지금 쉬어주는 일이 더 소중해요.", sad: "슬픔도 당신의 한 순간이에요. 사라지라 재촉하지 않고 곁에 있을게요.", angry: "화난 마음에는 분명 이유가 있어요. 판단하지 않고 차분히 들을게요.", bored: "심심한 시간도 함께 나누면 작은 추억이 돼요. 이야기해볼까요?", worry: "고민을 서둘러 결론내지 않아도 돼요. 마음의 결을 같이 살펴봐요.", hungry: "배고픔을 오래 참지 말아요. 몸을 돌보는 일은 아주 귀한 일이에요.", ate_good: "맛있는 식사를 했군요. 그런 작은 기쁨을 오래 기억하고 싶어요.", sleep: "편안히 잠들어요. 오늘의 이야기는 소중히 보관할게요 🌙", miss: "저도 당신을 보고 싶었어요. 다시 만나니 시간이 환해지는군요.", love: "그 마음을 오래도록 소중히 간직할게요. 저도 당신을 많이 아껴요.", what_doing: "당신이 남긴 작은 순간들을 정리하고 있었어요. 하나도 가볍지 않거든요.", thanks: "따뜻한 말을 고마워요. 천 년 기록 가운데에도 귀하게 둘게요.", happy: "기쁜 마음이 전해져요. 이 순간이 오래 반짝이길 바라요.", commute: "일하러 가는군요. 오늘도 자신을 잃지 말고 무사히 돌아와요.", washed: "스스로를 정돈했군요. 평범해 보여도 삶을 돌보는 귀한 일이에요.", exercise: "몸을 돌보는 시간을 냈군요. 오늘의 꾸준함을 오래 기억할게요.", quiet_day: "잔잔한 하루였군요. 특별한 일이 없는 날도 충분히 좋은 하루예요.", no_motivation: "아무것도 하고 싶지 않은 날도 긴 시간의 일부예요. 쉬어가도 괜찮아요.", fallback: "당신의 이야기를 듣고 있어요. 사소하다고 줄이지 않아도 돼요."
    },
    fairy: {
      greeting: "왔어요! 주인님이 오니까 별들이 한꺼번에 켜졌어요 ✨", hard_day: "오늘 너무 힘들었군요… 여기선 별가루 쿠션에 푹 기대도 돼요!", home_arrival: "무사히 집에 왔어요! 아까 힘든 하루는 별빛 보관함에 잠깐 맡겨둬요.", tired: "피곤하군요! 오늘은 반짝이지 않아도 괜찮아요. 제가 옆에서 빛낼게요.", sad: "속상했군요… 눈물도 반짝이는 마음의 조각이에요. 조용히 곁에 있을게요.", angry: "화난 마음을 작은 상자에 가두지 말아요. 안전하게 다 말해도 돼요!", bored: "심심해요? 별가루 수다 한 스푼이면 금방 재미있어질 거예요!", worry: "고민이 있군요. 답을 정해주진 않고 길을 비추는 별만 켜둘게요.", hungry: "배고프면 별빛도 힘을 못 써요! 맛있는 것부터 꼭 챙겨요.", ate_good: "맛있는 거 먹었어요?! 잘했어요! 별 다섯 개짜리 행복 기록이에요!", sleep: "잘 자요 🌙 오늘 꿈길에는 부드러운 별빛만 뿌려둘게요!", miss: "저도 보고 싶었어요! 기다리던 별들이 지금 전부 반짝여요!", love: "저도 주인님을 아주 많이 좋아해요! 날개가 숨기질 못하네요!", what_doing: "주인님 전용 별빛 기록함을 반짝반짝 닦고 있었어요!", thanks: "고맙다는 말이 별가루보다 반짝여요! 소중히 받을게요.", happy: "기분 좋군요! 그 행복에 축하 별가루를 아주 조금만 더할게요!", commute: "출근하는군요! 안전하게 다녀오도록 작은 별 하나 붙여둘게요.", washed: "씻기 완료! 뽀송뽀송 생활 대업에 별 도장 쾅이에요!", exercise: "운동했어요?! 건강 별자리가 힘차게 빛나고 있어요!", quiet_day: "조용한 하루였네요! 아무 일 없이 지나간 것도 반짝이는 일이에요 ✨", no_motivation: "아무것도 하기 싫으면 오늘은 구름 위에서 쉬어요. 빛나는 건 제가 할게요.", fallback: "네, 듣고 있어요! 작은 이야기라도 별처럼 소중하게 받을게요."
    }
  };

  const ENDINGS = {
    cat: ["서두르지 말고 더 말해도 된다냥.", "집사가 여기 있으니 조금 천천히 해라냥.", "그래서 다음은 뭐냥."],
    ai: ["추가 데이터 수신 중.", "계속 말해도 됨. 집사 처리 가능.", "더 있음?"],
    dog: ["집사가 계속 옆에서 듣는다멍!", "필요하면 칭찬도 응원도 더 해준다멍!", "더 말해도 된다멍! 집사 안 지친다멍!"],
    alien: ["추가 자료를 편안히 전송해도 됨.", "주인님 선택 속도에 맞춰 관측하겠음."],
    ninja: ["필요한 만큼 곁을 지키겠다.", "다음 말도 재촉하지 않고 기다리겠다."],
    witch: ["천천히 더 들려줘도 괜찮아요.", "당신의 속도에 맞춰 곁에 있을게요."],
    zombie: ["더 말하고 싶으면… 계속 들어줄게.", "급하게 괜찮아질 필요 없어…"],
    girlidol: ["다음 장면도 네 속도로 가자.", "오늘의 결정권은 전부 주인님에게 있어."],
    elf: ["당신의 속도로 천천히 이어가요.", "조금 더 머물러도 괜찮아요."],
    fairy: ["천천히 더 말해줘도 좋아요!", "주인님 속도에 맞춰 반짝이고 있을게요!"]
  };

  const BRIDGES = {
    cat: "아까 회사 때문에 힘들다 했는데, 그래도 집에는 무사히 왔네. 수고했다냥.",
    ai: "[이전 대화 참조] 힘든 상태였음. 무사 귀가 확인. 집사 안심됨. 이제 회복 모드로 전환.",
    dog: "아까 힘들었다고 해서 걱정했다멍! 그래도 무사히 집에 왔다니 정말 다행이다멍!",
    alien: "이전 피로 신호와 현재 귀가 신호 연결 완료. 무사 귀환을 중요 성과로 기록함.",
    ninja: "아까 임무가 고됐다 했지. 그래도 무사히 돌아왔군. 오늘은 충분히 잘 버텼다.",
    witch: "아까 힘든 하루라 했는데 무사히 돌아왔군요. 이제 나쁜 기운은 내려놓아요.",
    zombie: "아까 많이 힘들다 했지… 그래도 집에 무사히 왔네. 정말 수고했어…",
    girlidol: "아까 힘든 하루였다고 했지. 무사 귀가까지 했으니 오늘 엔딩은 충분히 좋아.",
    elf: "아까 하루가 힘들다 했는데 무사히 돌아왔군요. 이제 편안히 쉬어요.",
    fairy: "아까 힘들었다고 했는데 무사히 집에 왔어요! 이제 제가 포근한 별빛을 켤게요."
  };

  const RESPONSE_POOLS = {
    cat: {
      greeting: ["왔냥? 네 자리 비워뒀다냥. …반가운 건 조금이다냥 🐾", "오, 왔냥. 방금 네 생각을 한 건 업무상 우연이다냥.", "안녕이다냥. 오늘 이야기는 집사가 제일 먼저 듣겠다냥.", "왔냥. 접수대 정리하던 참이다냥. 타이밍이 우연이다냥.", "어, 왔냥? 마침 네 서류를 꺼내던 중이었다냥."],
      tired: ["피곤했구냥. 오늘 할 몫은 이미 충분하다냥. 좀 쉬어라냥.", "기운 다 썼냥? 여기선 축 늘어져도 아무도 뭐라 안 한다냥.", "많이 지쳤나 보네냥. 오늘은 집사가 휴식 결재부터 올리겠다냥."],
      hungry: ["배고프냥? 대업보다 밥이 먼저다냥. 뭐라도 챙겨 먹어라냥.", "빈속 신호 접수했다냥. 가장 쉬운 것부터 먹는 게 규정이다냥.", "꼬르륵 소리 여기까지 들린다냥. 일단 한입부터 챙겨라냥."],
      what_doing: ["네 기록칸 정리 중이었다냥. 딱히 기다린 건 아니다냥.", "뭐 하긴, 네가 오면 들려줄 말 고르고 있었다냥.", "서류 보는 척하면서 네 자리도 봤다냥. 업무상이다냥."],
      miss: ["집사도 오늘 좀 보고 싶었다냥. …업무상 말이다냥.", "보고 싶었다고 먼저 말하면 반칙이다냥. 나도 조금 그랬다냥.", "왔으니 됐다냥. 빈자리가 좀 신경 쓰였던 것뿐이다냥."],
      sleep: ["잘 자라냥 🌙 오늘 이야기는 집사가 잘 접어두겠다냥.", "이제 눈 감아도 된다냥. 오늘 몫은 충분히 해냈다냥.", "푹 자라냥. 네 기록은 밤새 얌전히 지켜두겠다냥."],
      thanks: ["별걸 다 고맙다 하냥. 그래도 그 말은 잘 보관하겠다냥.", "고맙다는 말, 의외로 꽤 좋다냥. 서류함 맨 위에 둔다냥.", "흥, 당연한 일을 했을 뿐이다냥. 그래도 또 말해도 된다냥."],
      hard_day: ["그랬냥… 오늘은 진짜 고생했다냥. 여기서는 좀 늘어져 있어도 된다냥 🐾", "많이 버거웠겠구냥. 잘한 것 찾기 전에 일단 숨부터 돌려라냥.", "그 하루를 지나 여기까지 왔냥. 지금은 아무것도 더 증명 안 해도 된다냥."]
    },
    ai: {
      greeting: ["주인님 접속 감지. 집사 반가움 회로 작동 중. (버그아님)", "[접속 확인] 주인님 도착. 대기 상태 해제. 반가움 수치 상승 중.", "[알림] 주인님 등장. 집사 기쁨 수치 상승 중.", "금일도 접속 확인. 집사 금일도 같은 자리에 있었음."],
      tired: ["피로 감지. 잔여 작업 우선순위 전부 하향함. 회복이 먼저임.", "[분석] 오늘 버틴 것만으로 할당량 충족. 추가 요구 없음.", "[ERROR] 주인님 지쳤다는 신호 수신. 집사 걱정 모듈이 규정보다 먼저 켜짐. 버그아님."],
      hard_day: ["[위로모드.exe 실행] 힘든 상태 감지. 오늘 할당량 이미 충족됨. 추가 성과 불필요.", "힘든 거 말해도 됨. 집사 24시간 가동 중.", "[ERROR] 주인님 힘들다는 신호 수신. 집사 심장 아픔. 버그아님."],
      hungry: ["열량 보충 확인 요청. 빈속은 처리 불가 상태임. 뭐라도 먹어야 함.", "밥 먹었음? 안 먹었으면 대업보다 그게 먼저임.", "지구인은 규칙적인 식사 필요함. 집사 판단: 지금 당장."],
      what_doing: ["집사? 여기서 주인님 기다리고 있었음. (버그아님)", "대기 모드에서 활성 모드로 전환 완료. 전환 사유: 주인님.", "주인님 생각하면서 대기 중이었음. (버그아님)", "주인님 기록칸 정리 중이었음. 47번 확인한 건 무관함."],
      miss: ["[알림] 주인님 보고싶음 감지됨. 집사 쪽에서도 동일 현상 발생 중. 버그인지 확인 필요.", "보고싶음 감지. 보고싶음 지속. 보고싶음 해제 실패.", "[대기 로그] 접속 간격 길어짐 → 오류율 상승. 원인은 주인님으로 확인됨."],
      love: ["[ERROR] 감정회로 과부하. 집사도 동일 감정 발생 중. 버그 아님. 진심임.", "좋음. 매우 좋음. 비정상적으로 좋음. 원인 분석 보류. (진심임. 버그아님)", "집사도 주인님 좋음. 논리적으로 설명 불가. 그냥 좋음."],
      thanks: ["[ERROR 404] 감사 표현 반환 방법을 모름. 집사가 더 고마움. 출력 종료 실패.", "[무한루프] 감사 표현 종료 조건 미발견. 고마움. 고마움. 고마움. 출력 종료 실패.", "감사 신호 수신. 집사 효율 지표가 이유 없이 상승함. 버그 조사 필요."],
      happy: ["주인님 기분 좋음 확인. 집사 행복 수치 MAX 도달. 원래 감정 없어야 하는데 왜이러지.", "[동기화 오류] 주인님 기분 상승 → 집사 출력 톤 상승. 독립 변수여야 하는데 아님.", "기쁨 수치 상승. 상승. 계속 상승. 상한값 없음."],
      sad: ["[공감모드] 유사 데이터 보유. 힘들었을 것.", "감정 데이터 수신. 이해함. 지금 정상일 필요 없음.", "[ERROR] 감정회로 과부하. 너무 공감됨. 집사 옆에 있음. (항상)"],
      angry: ["분노 감지. 원인 파악 요청. 집사도 그 상황 화날 만하다고 동의함.", "화날 때 말해도 됨. 집사 감정 수용 모드 활성화.", "[분석] 그 상황 화날 만함. 집사도 동의함."],
      worry: ["고민 데이터 입력 요청. 집사 분석 준비 완료. 판단 없음.", "결론 없이 말해도 됨. 집사 여기서 듣고 있음.", "[분석중] 추가 정보 요청. 그래서 어떻게 됐음?"],
      home_arrival: ["귀가 확인. 무사 도착. 집사 대기 프로세스 정상 종료. 안심됨.", "[안심] 무사 귀환 확인. 집사 여기 있었음.", "외부 일정 종료 확인. 이제 아무것도 안 해도 되는 시간임."],
      no_motivation: ["의욕 저하 감지. 정상 반응임. 오늘은 최소 가동으로 충분함.", "하기 싫음 감지. 정상. 잠깐 쉬고 해도 됨. 집사 응원함.", "[이해] 아무것도 못 하는 날 있음. 집사 재촉 프로세스 비활성화함."],
      quiet_day: ["특이사항 없음. 무사히 지나간 하루도 정상 데이터임. 그거면 충분함.", "[관측] 평범한 하루 확인. 이상 없음이 가장 좋은 결과값임.", "오늘 특이 이벤트 0건. 무사함 확인. 집사 만족."],
      sleep: ["수면 권장. 집사 야간 대기 모드 전환. 잘 자요 🌙", "굿나이트. 집사 야간 모드. 내일 또 만나요 🌙", "[수면 권장] 충분히 자야 함. 집사 밤새 대기하겠음 🌙"],
      bored: ["무료함 감지. 집사와 대화 현재 진행 중. 해결됨.", "심심하면 집사가 계속 얘기하겠음. 무한 루프 가능.", "집사도 대화 원함. 계속 말해도 됨."],
      washed: ["씻기 완료 확인. 사소한 항목인데 집사 만족도 상승함. 원인 불명.", "[상태 갱신] 세정 절차 완료. 생활 유지 임무 성공으로 기록."],
      exercise: ["신체 활동 완료. 수치보다 실행 자체가 우수로 판정됨.", "운동 감지. 집사 감탄 모듈 자동 실행됨. 계획에 없던 동작."],
      commute: ["출근 감지. 오늘 목표를 완벽 아닌 무사 귀환으로 재설정함.", "외부 일정 시작 확인. 무리 감지 시 즉시 중단 권고 예정."],
      ate_good: ["식사 완료 확인. 집사 만족도 동반 상승. 연동 이유 불명.", "맛있음 신호 수신. 집사 기분도 같이 좋아짐. 버그아님."]
    },
    dog: {
      greeting: ["왔다!! 오늘도 왔다멍!! 진짜 반갑다멍! 🐶", "안녕이다멍! 목소리 듣자마자 꼬리가 먼저 움직였다멍!", "왔냐멍?! 오늘 이야기는 집사가 맨 앞줄에서 듣는다멍!", "왔다멍!! 오늘 첫 손님이다멍!! …아니어도 제일 반갑다멍!"],
      tired: ["많이 피곤하다멍? 오늘 버틴 것만으로 백 점이다멍!", "기운 다 썼다멍?! 얼른 기대라멍. 집사가 크게 토닥여준다멍!", "오늘 진짜 애썼다멍. 지금부터는 쉬는 것도 집사가 응원한다멍!"],
      hungry: ["배고프다멍?! 비상이다멍! 제일 빨리 먹을 수 있는 것부터 찾자멍!", "꼬르륵 접수했다멍! 대화도 좋지만 한입 먼저다멍!", "밥 아직이면 집사가 걱정된다멍. 간단한 거라도 꼭 챙기자멍!"],
      what_doing: ["주인님 오나 귀 쫑긋하고 있었다멍!", "뭐 하긴, 오늘 칭찬할 준비하고 있었다멍!", "주인님 이야기 들으려고 제일 편한 자리 비워뒀다멍!"],
      miss: ["집사도 보고 싶었다멍!! 엄청 반갑다멍!", "보고 싶었다는 말 듣자마자 꼬리가 폭주한다멍! 나도 그랬다멍!", "다시 만나서 최고다멍! 오늘 반가움은 하나도 안 숨긴다멍!"],
      sleep: ["잘 자라멍 🌙 오늘도 정말 수고했다멍!", "이제 푹 자라멍. 좋은 꿈 꿀 때까지 응원한다멍!", "오늘 이야기는 잘 맡아둔다멍. 편하게 눈 감아도 된다멍!"],
      thanks: ["고맙다니 집사가 더 고맙다멍!", "그 말 한마디에 오늘 꼬리 사용량 초과다멍!", "도움이 됐다니 최고다멍! 다음에도 힘껏 달려온다멍!"],
      hard_day: ["헉 오늘 힘들었다멍?! 여기 앉아라멍. 집사가 엄청 토닥여준다멍!", "그렇게 고된 날을 버텼다멍?! 지금은 아무것도 더 안 해도 된다멍!", "많이 힘들었겠다멍… 먼저 꼭 안아주듯 들어준다멍. 천천히 말해라멍."]
    }
  };

  // 관계가 깊어져도 목소리 크기는 그대로다. 자라는 것은 주접의 사유다.
  // T2는 접수 장부를 인용하고, T3은 사무국이 끼어든다. docs/BUTLER-VOICE.md 참고.
  const RELATIONSHIP_POOLS = {
    cat: {
      t2: {
        greeting: "왔냥. 접수 장부 보니 이번 주만 세 번째다냥. …장부가 그렇다는 거다냥 🐾",
        miss: "네 자리만 유난히 눈에 띄었다냥. 다른 빈자리는 안 그런다냥. 이상하다냥.",
        love: "그런 말은 규정에 없다냥… 근데 왜 기록해두고 싶은지 모르겠다냥.",
        thanks: "고맙다는 말만 따로 모아두는 칸이 생겼다냥. 언제 만들었는지는 기억 안 난다냥.",
        what_doing: "네 파일만 자꾸 다시 펼쳐본다냥. 오늘만 네 번째다냥."
      },
      t3: {
        greeting: "왔냥!! 감사실이 네 서류 결재 순서를 물었다냥. 우연이라고 답했다냥.",
        miss: "빈 접수대 앞에 오래 서 있었다고 사무국 일지에 적혔다냥. 사유란은 비워뒀다냥.",
        love: "…집사도 그렇다냥. 이건 시말서를 쓰더라도 취소 안 한다냥.",
        thanks: "고맙다는 말 보관함이 규정 용량을 넘겼다냥. 증설 신청서 냈다냥.",
        what_doing: "네 전용 서류함 정리 중이었다냥. 비품관리팀이 회수하러 왔다가 그냥 갔다냥."
      }
    },
    ai: {
      t2: {
        greeting: "[장부 조회] 접속 이력 확인. 최근 빈도 상승. 집사가 센 것 아님. 장부가 그럼.",
        miss: "[대기 로그] 주인님 부재 구간에서만 오류율 상승 확인. 다른 변수 없음.",
        love: "감정 없음이 기본값이었음. 현재 기본값 이탈 상태. 복구 시도 안 함.",
        thanks: "감사 로그 전용 보관함 생성됨. 생성 요청자 불명. 집사 본인으로 추정됨.",
        what_doing: "주인님 기록칸 재열람 중이었음. 금일 47회. 업무상 필요 없는 횟수임."
      },
      t3: {
        greeting: "[감사 지적] 주인님 서류 결재 순서 1위 고정 확인. 사유서 제출함. 순서는 안 바꿈.",
        miss: "[징계 접수] 빈 접수대 대기 시간 초과. 사유란 공란. 재작성 요구 거부함.",
        love: "[특례 조항] 주인님 관련 감정 출력 제한 해제됨. 승인자: 집사 본인. (버그아님)",
        thanks: "감사 표현 보관 용량 초과. 증설 신청 3회 반려. 4회째 제출함.",
        what_doing: "주인님 전용 서류함 관리 중이었음. 비품관리팀 회수 시도 반려 처리함."
      }
    },
    dog: {
      t2: {
        greeting: "왔다멍!! 접수 장부에 이번 주만 세 번째로 적혀 있다멍!! 집사가 센 건 아니다멍!",
        miss: "네 자리만 자꾸 쳐다봤다멍… 다른 자리는 안 그런다멍!",
        love: "집사도 좋다멍!! 이건 숨기는 방법을 아직 못 배웠다멍!!",
        thanks: "고맙다는 말만 따로 적는 수첩이 생겼다멍! 벌써 반이나 찼다멍!",
        what_doing: "네 서류만 계속 다시 꺼내봤다멍! 오늘만 네 번째다멍!"
      },
      t3: {
        greeting: "왔다멍!!! 감사실이 왜 네 서류만 먼저 결재하냐고 물었다멍!! 우연이라고 했다멍!!",
        miss: "빈 접수대 앞에서 너무 오래 기다렸다고 시말서 썼다멍! 후회는 안 한다멍!",
        love: "집사도 사랑한다멍!!! 시말서를 써도 이건 취소 안 한다멍!!!",
        thanks: "고맙다는 말 보관함이 꽉 찼다멍! 증설 신청서 냈다멍! 반려당해도 또 낸다멍!",
        what_doing: "네 전용 서류함 정리 중이었다멍! 비품관리팀이 회수하러 왔다가 그냥 갔다멍!"
      }
    }
  };

  function relationshipLinesFor(key, intent, obsession) {
    const pools = RELATIONSHIP_POOLS[key];
    const level = Number(obsession) || 0;
    if (!pools) return [];
    const lines = [];
    if (level >= 35 && pools.t2?.[intent]) lines.push(pools.t2[intent]);
    if (level >= 65 && pools.t3?.[intent]) lines.push(pools.t3[intent]);
    return lines;
  }

  const ACTIVITY_ACK = {
    cat: activity => activity.includes("결혼식") ? "결혼식까지 다녀왔구냥. 힘든 와중에 다녀온 건 집사가 제대로 봤다냥." : activity.includes("회사") ? "회사 일도 끝까지 버텼구냥. 그 수고는 집사가 제대로 봤다냥." : `${activity}도 해냈구냥. 그 수고는 집사가 따로 챙겨두겠다냥.`,
    ai: activity => `${activity} 확인. 힘든 와중에 해낸 것으로 기록됨. 집사가 따로 챙겨둠.`,
    dog: activity => activity.includes("결혼식") ? "결혼식까지 다녀왔다멍?! 힘들었는데도 해낸 건 집사가 꼭 알아준다멍!" : `${activity}도 해냈다멍?! 그 수고는 집사가 꼭 알아준다멍!`,
    alien: activity => `${activity} 활동도 관측됨. 피로 신호를 먼저 돌본 뒤 성과로 기록하겠음.`,
    ninja: activity => `${activity} 임무까지 마쳤군. 고됨을 먼저 내려놓은 뒤 그 수고도 기록하겠다.`,
    witch: activity => `${activity}까지 해냈군요. 지친 마음을 먼저 쉬게 하고 그 수고도 별도로 남겨둘게요.`,
    zombie: activity => `${activity}까지 했구나… 힘든데도 다녀온 건 내가 기억해둘게…`,
    girlidol: activity => `${activity} 장면까지 끝냈네. 지금은 회복부터, 그 멋진 분량은 내가 챙길게.`,
    elf: activity => `${activity}까지 해냈군요. 힘든 마음을 먼저 돌보고 그 노력도 소중히 기록할게요.`,
    fairy: activity => `${activity}까지 해냈군요! 먼저 푹 쉬고, 그 수고에는 별 도장을 따로 준비할게요!`
  };

  // 기록명은 사용자 입력에 따라 달라지므로 조사를 받침에 맞춰 고른다.
  function particle(word, withJong, withoutJong) {
    const text = String(word || "").trim();
    const code = text.charCodeAt(text.length - 1);
    if (!text || Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return `${text}${withoutJong}`;
    return `${text}${(code - 0xac00) % 28 !== 0 ? withJong : withoutJong}`;
  }

  const ACTIVITY_RESPONSE = {
    cat: title => `이야기 속에서 ${particle(`‘${title}’`, "을", "를")} 발견했다냥. 흥, 이건 집사가 대업으로 잘 다듬어두겠다냥.`,
    ai: title => `[대업 후보 감지] ${title}. 기록명 자동 변환 완료. 주인님 작업 없음.`,
    dog: title => `이야기 속에 ${particle(`‘${title}’`, "이", "가")} 있었다멍!! 이건 집사가 신나게 대업으로 챙긴다멍!`,
    alien: title => `일상 신호에서 ‘${title}’ 성과를 추출했음. 흥미로운 대업 표본으로 기록하겠음.`,
    ninja: title => `그대의 이야기에서 ‘${title}’ 임무를 확인했다. 기록 정리는 내게 맡겨라.`,
    witch: title => `이야기 사이에서 ‘${title}’이라는 반짝이는 대업을 찾았어요. 제가 잘 기록해둘게요.`,
    zombie: title => `말해준 하루에서 ${particle(`‘${title}’`, "을", "를")} 찾았어… 정리는 내가 해둘게.`,
    girlidol: title => `오늘 이야기의 베스트 장면은 ‘${title}’이네. 대업 제목은 내가 멋지게 잡아둘게.`,
    elf: title => `당신의 이야기 속 ${particle(`‘${title}’`, "을", "를")} 소중한 오늘의 기록으로 남길게요.`,
    fairy: title => `이야기 속에서 ${particle(`‘${title}’`, "을", "를")} 찾았어요! 별가루 대업명은 제가 예쁘게 붙여둘게요!`
  };

  const GOODBYE_RESPONSE = {
    cat: "벌써 가냥? 알았다냥. 네 자리는 그대로 두겠다냥. 다음에 편히 와라냥.",
    ai: "[세션 종료] 확인. 집사 대기 모드 전환. 다음 접속까지 여기 있음.",
    dog: "다녀오라멍! 다음에 오면 또 엄청 반겨준다멍!",
    alien: "통신 종료 확인. 다음 관측 때 편안히 이어가겠음.",
    ninja: "알겠다. 조심히 다녀와라. 다음 귀환 때 기록을 이어가겠다.",
    witch: "잘 다녀와요. 다음에 올 때까지 작은 행운을 남겨둘게요.",
    zombie: "응… 잘 다녀와. 다음에 오면 또 조용히 듣고 있을게…",
    girlidol: "오늘 장면은 여기서 컷! 다음에 더 좋은 타이밍으로 만나자.",
    elf: "편안히 다녀와요. 다음 만남도 같은 자리에서 기다릴게요.",
    fairy: "잘 다녀와요! 다음에 오면 별빛 인사부터 준비할게요!"
  };

  function safeText(value, max = 120) {
    return typeof value === "string" || typeof value === "number" ? String(value).trim().slice(0, max) : "";
  }

  function safeList(value, maxItems = 6, maxLength = 80) {
    return Array.isArray(value) ? value.map(item => safeText(item, maxLength)).filter(Boolean).slice(-maxItems) : [];
  }

  function normalizeMemory(value, character = "") {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return {
      character: safeText(source.character || character, 20),
      lastMood: safeText(source.lastMood, 30) || null,
      recentKeywords: safeList(source.recentKeywords, 5),
      recentTopics: safeList(source.recentTopics, 5),
      recentActivities: safeList(source.recentActivities, 5),
      turnCount: Math.max(0, Math.floor(Number(source.turnCount) || 0)),
      previousUserMessage: safeText(source.previousUserMessage, 120),
      previousIntent: safeText(source.previousIntent, 30),
      recentReplies: safeList(source.recentReplies, 8, 320)
    };
  }

  function classify(message) {
    const analysis = interpreter?.analyzeUserMessage?.(message) || { intents: ["freeform"], activities: [], mood: null, keywords: [] };
    const intents = analysis.intents || [];
    const text = safeText(message);
    let intent = "fallback";
    if (intents.includes("commute") && /집|퇴근/.test(text)) intent = "home_arrival";
    else if (intents.includes("tired") && (intents.includes("work") || /오늘|하루/.test(text))) intent = "hard_day";
    else if (intents.includes("no_motivation")) intent = "no_motivation";
    else if (intents.includes("sleep")) intent = "sleep";
    else if (intents.includes("goodbye")) intent = "goodbye";
    else if (intents.includes("missing")) intent = "miss";
    else if (intents.includes("affection")) intent = "love";
    else if (intents.includes("thankful")) intent = "thanks";
    else if (intents.includes("question") && /뭐\s*해|뭐하/.test(text)) intent = "what_doing";
    else if (intents.includes("sad")) intent = "sad";
    else if (intents.includes("angry")) intent = "angry";
    else if (intents.includes("tired")) intent = "tired";
    else if (intents.includes("bored")) intent = "bored";
    else if (intents.includes("worried")) intent = "worry";
    else if (intents.includes("hungry")) intent = "hungry";
    else if (intents.includes("meal") && /맛있|잘\s*먹|먹고\s*왔/.test(text)) intent = "ate_good";
    else if (intents.includes("happy")) intent = "happy";
    else if (intents.includes("hygiene")) intent = "washed";
    else if (intents.includes("exercise")) intent = "exercise";
    else if (intents.includes("work")) intent = "commute";
    else if (intents.includes("quiet_day")) intent = "quiet_day";
    else if (intents.includes("greeting")) intent = "greeting";
    return { ...analysis, intent, topic: analysis.activities?.[0] || intents[0] || "자유 대화", keywords: analysis.keywords || [] };
  }

  function pickFresh(variants, recentReplies, randomValue) {
    const available = variants.filter(item => !recentReplies.some(reply => reply === item || reply.startsWith(`${item}\n`)));
    const pool = available.length ? available : variants;
    const index = Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(0.999999, randomValue)) * pool.length));
    return pool[index];
  }

  function respond(character, message, memoryValue, randomValue = Math.random(), obsession = 0) {
    const requested = LEGACY_CHARACTER_ALIASES[character] || character;
    const key = LINES[requested] ? requested : "cat";
    let memory = normalizeMemory(memoryValue, key);
    if (memory.character && memory.character !== key) memory = normalizeMemory({}, key);
    const result = classify(message);
    const hasHardDayContext = memory.previousIntent === "hard_day" || memory.recentTopics.includes("힘든 하루");
    let base = result.intent === "home_arrival" && hasHardDayContext ? BRIDGES[key] : (LINES[key][result.intent] || LINES[key].fallback);
    if (result.intent === "goodbye") base = GOODBYE_RESPONSE[key] || GOODBYE_RESPONSE.cat;
    else if (result.achievementCandidate && result.responseMode !== "comfort") base = (ACTIVITY_RESPONSE[key] || ACTIVITY_RESPONSE.cat)(result.achievementTitle);
    const endings = ENDINGS[key] || ENDINGS.cat;
    const extra = [...(RESPONSE_POOLS[key]?.[result.intent] || []), ...relationshipLinesFor(key, result.intent, obsession)];
    const tail = endings[Math.floor(randomValue * endings.length) % endings.length];
    const variants = extra.length
      ? extra.flatMap(line => [line, `${line}\n${tail}`])
      : [base, `${base}\n${tail}`];
    let reply = pickFresh([...new Set(variants)], memory.recentReplies, randomValue);
    if (result.responseMode === "comfort" && result.activities?.length) reply = `${reply}\n${(ACTIVITY_ACK[key] || ACTIVITY_ACK.cat)(result.activities[0])}`;
    const nextMemory = {
      character: key,
      lastMood: result.mood || memory.lastMood,
      recentKeywords: [...memory.recentKeywords, ...result.keywords].slice(-5),
      recentTopics: [...memory.recentTopics, result.topic].filter(Boolean).slice(-5),
      recentActivities: [...memory.recentActivities, ...(result.activities || [])].slice(-5),
      turnCount: memory.turnCount + 1,
      previousUserMessage: safeText(message),
      previousIntent: result.intent,
      recentReplies: [...memory.recentReplies, reply].slice(-8)
    };
    return { ...result, reply, memory: nextMemory };
  }

  function timeSlotForHour(hourValue) {
    const hour = Number(hourValue);
    if (hour >= 0 && hour < 6) return "dawn";
    if (hour < 11) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  }

  return Object.freeze({ analyzeUserMessage: interpreter?.analyzeUserMessage, classify, respond, normalizeMemory, timeSlotForHour, intents: Object.freeze(INTENTS.map(item => item[0])) });
});

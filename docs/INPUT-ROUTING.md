# 입력 해석 · 라우팅 규칙

과잉집사는 사용자가 입력 모드를 고르는 앱이 아니다. "씻었어"처럼 짧게 써도 되고,
긴 하루 이야기를 써도 된다. 앱이 알아서 문맥을 구분한다. 이 문서는 그 구분 기준과
FORM05(대업 판정) 라우팅 규칙을 정리한다.

관련 파일: `message-interpreter.js`(해석) → `chat-engine.js`(대사 선택) → `app.js`의
`submitAchievement()`(라우팅/기록). 대사 톤 규칙은 `docs/BUTLER-VOICE.md`를 따른다.

---

## 0. 핵심 원칙

```
사용자가 오늘 이야기를 아무렇게나 씀
  → 집사가 전체 문맥을 이해함
  → 완료 행동이 있으면 대업을 발견함
  → 미래 계획은 절대 완료로 처리하지 않음
  → 짧은 행동과 긴 이야기는 반응 방식이 다름
```

내부적으로만 구분하는 입력 타입 (사용자에게 노출하거나 모드 선택 UI를 만들지 않는다):

| 타입 | 예 | 특징 |
|---|---|---|
| SHORT_ACTION | 씻었어 / 물 마셨어 | 짧고 완료된 행동, 감정 서사 거의 없음 |
| ACTION_LIST | 출근하고 공부하고 씻었어 | 완료 행동 여러 개 |
| EMOTION_ONLY | 오늘 회사 너무 힘들었어 | 완료 행동 없이 감정만 |
| STORY | 친구 만나서 카페 갔다 왔어 | 전체 흐름을 봐야 하는 서사 |
| MIXED_STORY | 힘들었는데 집 와서 씻었어 | 감정 + 완료 행동 혼재 |
| FUTURE_PLAN | 내일 운동할 거야 | 아직 하지 않은 계획 |
| CASUAL_CHAT | 안녕 / 뭐해 | 일상 대화 |

---

## 1. 완료 vs 계획 판정 (가장 중요한 버그의 원인)

`message-interpreter.js`의 `ACTIVITY_RULES`는 텍스트에서 완료된 행동 키워드를 찾는다.
문제는 "먹을 거임", "할 거야" 같은 미래형 어미가 붙어도 키워드 자체(먹, 운동, 씻…)는
그대로 매치된다는 것 — 방치하면 "저녁에 삼겹살 먹을 거임"이 "식사 챙김"으로
기록되어 버린다.

그래서 활동 매치마다 매치 끝 지점 뒤 `FUTURE_WINDOW`(18자) 안에 미래형 어미
(`FUTURE_TENSE` — 거야/거임/거다/예정/할게/할래/하려고/하기로/겠… 등)가 있는지 확인한다.
있으면 `activities`가 아니라 `futurePlans`로 분류하고, `achievementCandidate`·
`activityTypes`·도장 진행에서 완전히 제외한다.

```
씻었어              → activities: [씻기 완료]
저녁에 삼겹살 먹을 거임 → futurePlans: [{ type: meal, snippet: "저녁에 삼겹살 먹을 거임" }]
내일 운동할 거야       → futurePlans: [{ type: exercise, snippet: "운동할 거야" }]
```

`futurePlans`에만 들어간 항목은 대업 후보가 아니다. `activities`가 비어 있으면
`achievementCandidate`도 자동으로 false가 되므로, FORM05·도장·기록 어디에도 남지 않는다.

---

## 2. 톤 전환 (toneShift)

"힘들었어~ 그래도 저녁에 삼겹살 먹을 거임 히히!" 같은 문장에서 맨 앞의 "힘들었어"
하나만 보고 위로 모드로 끝내면 실패다. `message-interpreter.js`는 부정 감정 매치의
마지막 위치 이후에 긍정 감정 또는 톤 힌트(`POSITIVE_TONE_HINT` — ㅋㅋ/ㅎㅎ/히히/풀림/
다행/좋음/신남/살아났 등)가 나오면 `toneShift: true`를 반환한다.

`toneShift`는 `responseMode`(comfort/achievement 라우팅)를 바꾸지 않는다 — 순수하게
`chat-engine.js`가 대사를 고를 때 참고하는 신호다. cat 캐릭터에 한해 전용 대사로
교체한다 (`CAT_TONE_SHIFT`):

- 뒤에 아직 하지 않은 계획이 있으면 → 그 계획을 인용하며 "벌써 좀 살아났다" 반응
- 계획 없이 톤만 풀렸으면 → 일반 회복 인정 대사

다른 캐릭터는 이번 패스에서 새 대사 풀을 만들지 않는다. 기존 comfort 라인 그대로 나간다.

---

## 3. FORM05 라우팅표

| 입력 타입 | achievementCandidate | responseMode | 결과 |
|---|---|---|---|
| SHORT_ACTION | true | achievement | FORM05 (심사 연출 O) |
| ACTION_LIST | true | achievement | FORM05, 대표 행동 하나로 기록 |
| EMOTION_ONLY | false | comfort | 기록 없음, 공감 답변만 |
| FUTURE_PLAN | false | conversation | 기록 없음, "아직 안 했다" 답변 |
| STORY (완료 행동 없음) | false | conversation | 기록 없음 |
| MIXED_STORY (부정+완료행동) | true | comfort | FORM05 생략, 조용히 접수(gentle-note) + 도장 반영 |
| MIXED_STORY (부정+계획만) | false | comfort | 기록 없음, 계획 인정 답변만 |

`comfort` 모드는 감정이 먼저이므로, 완료 행동이 있어도 큰 FORM05 연출 없이
`finishAchievement(deed, { quiet: true })`로 조용히 접수한다 (기존 `gentle-note` 구조).
`achievement`/`special-achievement`만 심사 연출(FORM05)로 간다. 이 라우팅 자체는
이번 패스에서 바꾸지 않았다 — 바뀐 것은 그 앞 단계, 즉 "무엇이 완료 행동으로
잡히는가"뿐이다.

---

## 4. ACTION_LIST — 대표 행동 선택

여러 완료 행동이 잡혀도 대업 레코드는 하나만 만든다(새 다중 대업 시스템은 이번
패스에서 만들지 않는다). `achievementTitle()`이 기존 우선순위 규칙으로 대표 행동을
고르고, 나머지는 `activities` 배열에 그대로 남는다. cat 캐릭터는 활동이 2개
이상일 때 전용 대사(`CAT_MULTI_ACTIVITY`)로 "여러 개를 다 읽었다"는 티를 낸다.

---

## 5. 이번 패스에서 다루지 않은 것

- STORY(순수 서사, 완료 행동 없음)에 대한 전용 대사 확충 — 기존 conversation 경로
  그대로 사용. 필요하면 별도 패스.
- AI/DOG 등 다른 캐릭터의 toneShift/multi-activity 전용 대사 — 의도적으로 만들지
  않았다(§15 "CAT 하나만"). 기존 동작이 깨지지 않는 것만 확인했다.
- 완벽한 형태소 분석 — `FUTURE_TENSE`/`POSITIVE_TONE_HINT`는 로컬 휴리스틱 정규식이다.
  100% 커버리지가 목표가 아니라 주어진 회귀 테스트 세트를 안정적으로 통과하는 것이 목표.

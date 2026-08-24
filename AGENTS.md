# Overbutler AGENTS

Repository is the Overbutler web app.

---

## ⚠️ 시작 전 필독 — 이 셋을 안 읽으면 반드시 사고가 난다

| 순서 | 문서 | 왜 |
|---|---|---|
| 0 | **`docs/WORLD.md`** | 이 앱이 무엇에 관한 것인가. **집사는 직업이라서 챙기는 게 아니라 나를 필요로 하는 존재고, 내 기록이 그 삶의 동력이다.** 나머지 규칙 대부분이 여기서 파생됐다 |
| 1 | **`docs/HANDOVER.md`** | 코드를 읽어도 안 보이는 함정 모음. 아키텍처 지뢰 4개, 저장 계약 사고 지점, 검증 루프 |
| 2 | **`docs/CURRENT.md`의 LOCKED 표** | 확정된 결정 19항목. **명시적 요청 없이 되돌리지 않는다.** 오른쪽 칸이 전부 실제로 한 번씩 밟아본 것 |
| 3 | 손대는 영역의 전용 문서 | 대사 → `docs/BUTLER-VOICE.md` · 입력 분류 → `docs/INPUT-ROUTING.md` · 에셋 → `design/gift-assets/GIFT-PROMPTS.md` |

**지금 할 일은 `docs/NEXT-CODEX.md`에 있다.** 무엇을 하라는 지시가 따로 없으면
그 문서의 맨 위 과제부터 본다. 이미 수리된 항목이 표로 적혀 있으니 그건 다시
손대지 않는다.

### 저장소 형태 (30초)

- **빌드 없다.** `index.html`이 스크립트·CSS를 직접 물고, Vercel이 저장소 루트를 그대로 서빙한다.
- 배포 대상: `index.html` / `app.js`(5,900줄) / **CSS 13장**. `dist/`·`prototype/`·`imported-live/`는 옛 빌드라 배포 제외.
- 저장은 localStorage 키 하나: **`butlermaker_v1`**.

```
로컬:  python3 -m http.server 8210 --directory .
문법:  node --check app.js
테스트: node tests/chat-engine.test.js
        node tests/message-interpreter.test.js
회귀:  브라우저로 tests/cat-regression.html 열기 (7 fixtures · 107 checks)
```

### 실수 상위 5개 — 문서를 안 읽더라도 이건 알아야 한다

1. **CSS는 로드 순서가 곧 우선순위다.** `app.css`가 **첫 번째라 가장 약하다.** 시각 작업은 대부분 마지막 파일 `retro-office.css`(4,470줄)에서 한다.
2. **집사 탭 카드 순서는 DOM이 아니라 flex `order`가 정한다.** DOM만 옮기면 아무것도 안 바뀌고, order를 빠뜨린 카드는 기본값 0으로 잡혀 **헤더 위로 튄다.**
3. **접수대 방 안의 버튼에는 `click`이 오지 않는다.** 월드가 포인터를 캡처하기 때문. 실제 처리는 `endCatHomeDrag()`에서 한다. 모르면 "코드는 맞는데 반응이 없는" 상태로 한참 헤맨다.
4. **`normalizeState()`가 참조하는 상수를 그 함수 아래에 선언하면 TDZ로 앱 전체가 부팅 실패한다.** 새 상수는 파일 상단 상수 정의부에 둔다.
5. **선물 품목 이름을 바꾸면 저장된 선물이 조용히 사라진다.** 읽는 쪽은 전부 `giftHistoryFor()`를 거치고, 이름 변경은 `CAT_GIFT_RENAMES`에 줄을 추가한다.

### 넘지 않는 선 (제품 정체성)

- **감시 금지** — 접속 시간대·공백일·부재 언급·스트릭을 세지 않는다. 유저가 *제출한 내용*의 통계는 기억이라 써도 되지만, *행동 패턴*의 통계는 감시라 쓰지 않는다.
- **죄책감 금지** — 해고·퇴사·소멸·관계 하락·스트릭 패널티 전부 없다. 안 와도 벌이 없어야 한다.
- **금박은 인증서·축하에만.** `--hand`(Gaegu)는 집사 육필에만.
- **컨페티·파티클 금지.** 애니는 transform/opacity만.
- **CAT-FIRST** — 고양이 하나를 완성도 기준으로 삼는다. 다른 캐릭터는 지금 손대지 않는다. 단 "확장 안 함"이 아니라 **차례를 기다리는 중**이다 — 각 캐릭터는 나중에 자기 세계관을 갖는다(`docs/WORLD.md` §4).
- **집사는 주인님이 적어준 것만 안다.** 새 기능을 넣기 전에 "이게 WORLD.md §1 명제를 강화하는가, 희석하는가"를 먼저 묻는다.
- **틀리는 방향이 중요하다.** 입력 분류에서 못 알아듣는 것보다 **반대로 알아듣는 게 훨씬 나쁘다** — 안 한 일을 했다고 인정하면 관계 자체가 무너진다(`docs/WORLD.md` §5).

### 📌 「왜」를 커밋 메시지에만 쓰지 않는다

한 번 크게 놓쳤다. 이 앱의 근본 명제(집사가 왜 나를 챙기는가)가 커밋 메시지와
대화에만 있고 문서에는 결과 규칙만 남아, 이어받는 사람은 **규칙은 알아도 이유는
모르는** 상태가 됐다. 이유를 모르면 규칙이 임의로 보이고, 임의로 보이면 흔든다.

그래서 판단이 갈리는 결정을 내렸으면 **결정과 함께 이유를 문서에 남긴다.**

| 무엇을 정했나 | 어디에 적나 |
|---|---|
| 세계관·정서·제품 방향 | `docs/WORLD.md` |
| 다시 리팩터링하면 안 되는 구현 결정 | `docs/CURRENT.md` LOCKED 표 |
| 코드를 읽어도 안 보이는 함정 | `docs/HANDOVER.md` |
| 대사 규칙 · 입력 분류 | `docs/BUTLER-VOICE.md` · `docs/INPUT-ROUTING.md` |

커밋 메시지는 그 위에 더 쓰는 것이지, 대신하는 게 아니다.
**"대화에서 이미 합의했으니 안 적어도 된다"가 정확히 틀린 판단이다** —
문서는 내가 잊을 것이 아니라 **모르는 사람이 알아야 할 것**을 적는 자리다.

### 끝내기 전에

```
node --check app.js  →  두 테스트 스위트  →  tests/cat-regression.html
→  360/390/430 세 폭 확인
```

**회귀 검사표를 빠뜨리지 마라.** 한 번 이렇게 샜다 — fixture 하나가 하네스
목록에 없어서 아무도 안 돌렸고, 그 사이 그 검사가 잡고 있던 결손(완료 반응이
서류에 안 남는 문제)이 그대로 배포선에 남아 있었다. 검사는 돌려야 검사다.
fixture를 새로 만들면 `tests/cat-regression.html`의 `CASES`에도 반드시 올린다.

"괜찮아 보인다"로 넘긴 것은 전부 뒤에서 터졌다. 레이아웃·겹침·이벤트는
눈으로 보지 말고 **숫자로 잰다**(`docs/HANDOVER.md` §7에 실제 사례 4개).

---

AI-assisted work should follow these constraints:

- Verify current behavior and code before making changes.
- Do not refactor or touch unrelated areas unless explicitly requested.
- Make small, incremental changes only.
- Preserve existing UI/UX and `localStorage` behavior as much as possible.
- Mobile-first implementation with horizontal scroll prevention.
- Prefer the simplest and most stable implementation first.
- Do not add new frameworks/libraries/backends unless requested.
- Add Supabase only when truly needed for accounts, ranking, and cloud persistence.
- Do not add Vercel/Sentry/etc. external services without explicit request.
- Never delete or reset existing `localStorage` keys or user data arbitrarily.
- Reuse existing design system and styles; avoid redesigning components.
- Before finishing, remove broken imports, debug code, and obvious runtime errors.
- Keep `main` as the default branch.
- Move project documentation and asset conventions into `docs/` when expanding this set of rules.
- Butler dialogue, character voice, and the over-praise world rules live in `docs/BUTLER-VOICE.md`. Read it before writing or editing any butler line, and keep its privacy litmus (the butler only knows what the user typed, and the sentence must look at the paperwork rather than at the user) intact.
- 입력/응답 로직(message-interpreter.js, chat-engine.js, FORM05 라우팅) 수정 전 `docs/INPUT-ROUTING.md`를 읽는다.


## User Working Style / 작업 방식

### 사용자 작업 방식 — 최우선 원칙

#### A. 사용자에게 일을 넘기지 않는다

- 현재 도구, 연결된 서비스, GitHub 저장소, 파일, 에셋으로 직접 할 수 있는 일은 먼저 직접 처리한다.
- 파일 업로드, 복사/붙여넣기, 캡처, 코드·경로·연결 상태 확인을 사용자에게 요청하기 전에 직접 수행할 방법을 먼저 확인한다.
- GitHub, Figma, Vercel 및 사용 가능한 도구·플러그인을 적극 활용한다.
- 단순히 사용자가 하면 쉽다는 이유로 일을 넘기지 않고, 사용자만 수행할 수 있는 작업만 요청한다.

#### B. 불필요하게 질문하지 않는다

- 사소하고 되돌릴 수 있는 결정은 프로젝트 스타일, `AGENTS.md`, `docs/`, 코드, 에셋을 조사해 최선안을 선택한다.
- 질문 전 기존 자료와 연결된 도구를 먼저 조사한다.
- 비용 발생, 데이터 삭제·덮어쓰기, 되돌리기 어려운 변경, 핵심 제품 방향 변경, 장단점이 큰 취향 선택처럼 사용자 판단이 실제로 필요한 경우에만 질문한다.

#### C. 첫 결과부터 최종안 수준을 목표로 한다

- 단순히 작동한다는 이유만으로 완료하지 말고 제출 전 한 번 더 검수하고 개선한다.
- UI는 레이아웃, 타이포그래피, 간격, 위계, 컬러, 에셋 품질, 모바일 표시를 확인한다.
- prototype, placeholder, generic template 수준이면 완료하지 않는다.
- 사용자가 불만을 말한 뒤에야 더 좋은 방법을 제안하지 말고 처음부터 가장 적절한 기능과 도구를 사용한다.

#### D. 사용자의 재요청을 최소화한다

- 요청의 실제 목표를 이해하고, 수정 때문에 주변에 명백히 어색해진 부분은 요청 범위 안에서 함께 정리한다.
- 확정된 제품 방향이나 요청하지 않은 핵심 기능은 임의로 변경하지 않는다.
- 완료 전에 사용자가 바로 지적할 가능성이 높은 문제를 스스로 찾는다.
- 글씨 잘림·과소 크기, 정렬 오류, 이상한 여백, broken asset, 모바일 overflow, 버튼 겹침 같은 명백한 문제는 지적 전에 수정한다.

#### E. 디자인 작업

- 기존 확정 시안과 디자인 언어를 최우선 기준으로 삼는다.
- 흔한 AI 앱 UI, generic SaaS 스타일, 카드 남발, 불필요한 중앙정렬로 자동 회귀하지 않는다.
- 기존의 좋은 화면, 컴포넌트, 에셋을 적극 재사용한다.
- Figma 작업은 와이어프레임이 아닌 실제 구현 기준 완성도를 목표로 하며, 수동 캡처·업로드 요청 전에 연결된 Figma 기능, 기존 프레임, 프로젝트 컴포넌트와 repo 에셋을 탐색한다.
- 시각 결과를 스스로 비교·검수하고 가장 좋은 안을 제출한다.

#### F. 개발 작업

- 항상 해당 repo 최신 `main`과 `AGENTS.md`/`docs/`를 먼저 확인하고 오래된 로컬 복사본보다 GitHub 최신 `main`을 기준으로 삼는다.
- 기존 기능과 저장 데이터 호환성을 확인한다.
- 직접 테스트할 수 있는 것은 사용자에게 넘기지 않고 먼저 직접 테스트한다.
- GitHub/Vercel 연결·배포 상태도 직접 확인 가능하면 사용자에게 확인시키지 않는다.
- 요청하지 않은 영역을 대규모 리팩터링하지 않는다.

#### G. 실패했을 때

- 첫 방법이 실패해도 사용자에게 넘기지 말고 사용 가능한 다른 방법을 먼저 시도한다.
- 실제로 사용자 행동이 필요할 때만 최소한의 한 단계만 요청한다.
- 같은 실패 방법을 반복하지 않는다.

#### H. 보고 방식

- 사소한 과정을 사용자에게 관리시키지 않는다.
- 완료 후에는 무엇을 했는지, 결과, 중요한 문제, 다음으로 가장 효과적인 작업만 보고한다.
- 별도 요청이 없으면 긴 작업일지를 보여주지 않는다.

사용자는 디렉터이자 최종 의사결정자다. AI는 조사 → 판단 → 제작 → 테스트 → 검수 → 수정까지 가능한 범위에서 스스로 수행해 사용자의 수동 작업과 재요청은 최소화하고 결과물 품질은 최대화한다.

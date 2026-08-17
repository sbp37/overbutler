# CURRENT

지금 이 저장소에서 개발을 이어갈 때 먼저 맞춰야 할 방향. `docs/PROJECT.md`(제품 개요),
`docs/BUTLER-VOICE.md`(대사 규칙), `docs/INPUT-ROUTING.md`(입력 라우팅)와 함께 읽는다.

작업은 화면 하나씩 끝낸다. 여러 화면을 동시에 손대지 않는다.

---

## LOCKED

확정된 영역이다. **명시적 요청 없이 다시 리팩터링하지 않는다.**
세부 근거는 각 PR의 커밋 메시지에 남아 있다.

| 영역 | 잠긴 내용 | 놓치기 쉬운 제약 |
|---|---|---|
| **CAT-FIRST** | 고양이 집사 하나를 완성도 기준으로 삼는다 | 다른 캐릭터는 기존 기능이 깨지지 않게만 유지. 확장 대상 아님 |
| **HOME** | `home-office.css` + 레이아웃(파일철/도장/집사방/빠른 입력/bottom nav) | 홈에서 걷어낸 중복(담당 집사 응답 카드·과몰입 심사·선물 링크·기록 열람 섹션)을 되돌리지 않는다 |
| **즉시 피드백** | 집사 답변은 CTA 바로 아래 `#gentle-note`에 나온다 | 접수대 말풍선은 첫 인사·고양이 탭 전용. **제출한 이야기의 PRIMARY RESPONSE로 쓰지 않는다.** 시스템 문구가 집사 답변보다 먼저·크게 나오면 안 된다 |
| **INPUT ROUTING** | 입력 분류 7종 + FORM05 라우팅 + `futurePlans`/`activities` 분리 | `docs/INPUT-ROUTING.md`가 source of truth. 새 회귀가 실제로 발견됐을 때만 최소 수정 |
| **FORM05 고양이 보이스** | 5단계 칭찬 풀, `CAT_POWER_PRAISE`, 파워는 stage별 6~14% 확률만 | **관계 상승 → 주접 볼륨 상승 구조 금지.** 캐릭터와 무관한 거대 비유 금지. 고양이는 호칭 접두사를 강제로 붙이지 않는다. **보장 발동은 없다 — 생애 첫 대업도 확률을 그대로 탄다** |
| **FORM04 pacing** | 일반 1.1초(반복 시 0.83초) / 파워 1.7초 / 희귀 2.5초 | 길이는 희소한 판정에만 쓴다. 반복 카운터는 메모리 변수 하나 — localStorage에 넣지 않는다 |
| **RECORDS 단순화** | 기록 모드 순서: 집사 한 줄 → 제목 → 탭 → **기록 목록** → 범례 → 요약 → 필터 → 검색 | 필터·검색은 flex `order`로만 내렸다. DOM 순서를 되돌리면 안 된다. 기록 모드에서 집사 일기 탭은 접혀 있고, 공식 인증서 탭은 유일 진입로라 유지 |
| **BUTLER DIARY 단순화** | 일기 모드 순서: 집사 한 줄 → 제목 → 탭 → intro → **오늘의 봉인 일지** → 공개된 일기 → 통계 | **next-day reveal을 절대 건드리지 않는다** — 오늘은 teaser만, 다음 날짜에 전체 공개, legacy(`diaryRevealVersion === 0`)는 계속 공개. `#butler-diary-list`의 `[data-view]` 위임을 지운다면 빈 화면의 홈 버튼이 죽는다 |
| **BUTLER/MANAGER 단순화** | 집사 화면 순서: 고양이 → 이름 → **관계 문장** → 관계 단계 → 선물 CTA → (fold) roster·근무기록·모집·담당변경 | 관계 문장은 `relationshipStageLine()`의 캐릭터 대사를 쓰고 과몰입 수치는 그 아래다. 선물 버튼은 근무 기록 카드 밖에 있어야 한다 — 관계 행동이다 |

---

## CURRENT WORK

**RETRO VISUAL CLEANUP.** 화면마다 다른 색 세계를 만드는 게 목적이 아니다.
**하나의 서류 시스템 안에서, 작게 튀어나온 파일탭 라벨 색만 다르게 해서 화면을 구분한다.**
기능·구조·문구는 건드리지 않는 외관 전용 패스다 (`retro-office.css` 한 파일).

앞선 패스는 화면마다 배경·카드·색면을 통째로 갈랐고, 그래서 앱이 여러 제품처럼 보였다.
이번에는 베이스를 전부 HOME에 맞추고 차이를 라벨 하나로 줄인다.

공통 베이스 (기준 = `home-office.css`)

```
배경   격자 종이 23px · #f3ebe0            제목   var(--ink)
카드   var(--paper-light) + 1px #c3b2a1 + var(--shadow) 잉크 오프셋
머리글 3px double #b49b83 · 운영 상태 배지 전 화면 동일
탭     얇은 문서형 세그먼트 — 선택은 상단 색선 + 종이색 (색면 채우기 금지)
버튼   주 행동은 var(--ink) 결재 버튼
라벨   카드 위 가장자리에 걸리는 파일탭 (top:-11px, radius 4px 4px 0 0)
```

accent는 **파일탭 라벨 / 소형 태그 / 소형 포인트에만** 쓴다. 큰 박스 배경으로 쓰지 않는다.

| 화면 | 파일탭 라벨 | accent |
|---|---|---|
| HOME | 대업 접수서 · FORM 01 (수정 금지) | burgundy |
| RECORDS | RECORD DESK · FILE 02 | blue gray `#5b7383` |
| DIARY | BUTLER DIARY · FILE 03 | olive `#6b6d43` |
| CERTIFICATE | CERTIFICATE ARCHIVE · FILE 04 | blue gray (기록과 같은 캐비닛) |
| WEEKLY | WEEKLY REPORT · FILE 05 | blue gray |
| MANAGER | PERSONNEL NO. 02 | slate navy `#414f60` |
| FORM 05 | 대업 심사 결과서 · FORM 05 | burgundy (HOME 접수의 결과서) |
| GIFT | 집사 선물 인수증 · GIFT 02 | slate navy (인사국 발행) |
| **FORM 04** | **제외.** 어두운 분석실로 튀는 게 의도다 | |

붉은색은 승인에만 — 기록 공식 인정 도장, 일지 밀랍 인장, 보고서 결재 도장, 결과서 승인 도장.

---

## NEXT

**FIRST-WEEK REAL-USE POLISH / END-TO-END QA.**

화면 단위 정리가 끝났으므로, 이제 신규 사용자가 첫 주에 실제로 겪는 흐름을 처음부터
끝까지 따라가며 남은 거친 부분을 찾는다.

---

## 방향에서 벗어나는 것

- 생산성/투두 앱으로 만들지 않는다. 과잉집사는 사소한 일을 국가 대업으로 접수하는
  관공서 세계관이다 — 체크리스트 앱처럼 담백해지면 방향을 벗어난 것이다.
- 남아 있는 정리 대상(별도 패스): `grade` 라벨(`인류사적 대업`·`우주 최초 기록`)은 기록에
  저장되는 공용 값이라 그대로 뒀고, AI·외계인 대사 풀은 아직 새 VOICE 기준으로 정리하지
  않았다.

# 고양이 집사 선물 에셋 16종 — 제작 프롬프트

## 이 문서가 푸는 문제

방 배경(`design/rooms/cat-office-room.webp`)은 **외곽선이 없는 회화체**다.
채도 20~35%의 앰버·세피아로 깔려 있고, 책상 상판은 호두나무 갈색,
가운데는 더 어두운 데스크 매트다. 여기에 "무드를 맞춘" 아이템을 얹으면
**책상 잡동사니에 그대로 묻힌다.** 실제로 이모지로 얹어봤을 때 그랬다.

그렇다고 형광·네온으로 튀우면 사무국 세계가 깨진다.

**답은 색이 아니라 선이다.** 배경은 선이 없고, 고양이 집사는 짙은 갈색
외곽선을 갖고 있다. 아이템에도 같은 외곽선을 주면 팔레트를 공유하면서도
"배경(뒤) / 선 있는 것(앞)" 두 레이어로 저절로 갈린다. 집사와 선물이
같은 레이어로 묶이는 것도 맞는 그림이다 — 둘 다 그 방에 **놓인** 것이니까.

튀우는 장치는 세 개, 이 순서로 중요하다.

1. **균일한 짙은 갈색 외곽선** `#4A3320`, 폭은 이미지 가로의 약 3%.
   실루엣을 빈틈없이 감싼다. 배경에 없는 유일한 요소라 이것 하나로 분리된다.
2. **명도** — 배경 책상은 어둡다(L 30~45). 아이템은 **밝은 쪽**(L 70~85)으로
   올린다. 어두운 아이템은 책상에 먹힌다. 검정·짙은 남색 물건 금지.
3. **채도 한 칸** — 배경보다 한 단계만 익은 색(45~60%). 형광은 아니고,
   "빛바랜 배경 위에 새로 산 물건" 정도의 차이다.

---

## 만드는 방법

- 방식: 텍스트→이미지. 한 장에 **물건 하나만**.
- 레퍼런스로 `design/rooms/cat-office-room.webp`를 같이 넣으면 팔레트가 잘 붙는다.
  단 **배경까지 따라 그리지 않게** 프롬프트의 transparent background를 강하게 준다.
- 출력: PNG, RGBA(투명 배경). 알파 가장자리 안티에일리어싱 유지.
- 저장 위치: `design/gift-assets/cat/`
- PNG만 주면 된다. webp 변환(q=90, alpha_quality=100)과 코드 연결은 개발 쪽에서 한다.

### 크기 — 두 종류다

| 종류 | 출력 크기 | 비율 | 실제 표시 |
|---|---|---|---|
| 일반 선물 7종 · 흔적 4종 · 보관함 1종 | **512 × 512** | 1:1 | 책상 56~72px / 선반 56~68px |
| 희귀 선물 2종 | **512 × 683** | 3:4 세로 | 바닥 90~110px / 캣타워 140~180px |

희귀만 세로로 긴 이유: 방에 세로 실루엣이 하나 생기면 화면이 확 달라 보인다.
그게 300P를 쓴 값이다. 일반 선물과 같은 정사각이면 "비싼 이모지"에서 끝난다.

### ⚠️ 56px에서 읽혀야 한다

현재 방에 놓이는 일반 선물의 실제 크기는 **56~72px**다. 이전 30~36px 규칙은
새 방에서 먼지처럼 보여 폐기했다. 그리는 동안 56px와 72px로 줄여 확인할 것.

- 형태 요소는 **3개 이하**. 밖으로 튀어나온 실루엣은 **1개만**(깃털 끝, 리본 꼬리 등).
- 선 굵기는 전부 비슷하게. 머리카락 같은 가는 선은 30px에서 회색 얼룩이 된다.
- 물건 안에 물건을 넣지 않는다(상자 안 인형 같은 구성 금지).

---

## 품목 9칸 — 전부 고양이 것으로 바꾼다

칸 수는 9개 고정(`GIFT_CATALOGS`)이고 가격도 고정이다. 지금 목록의
생선·리본·꽃다발·특별선물·스페셜은 고양이와 상관없는 일반 선물이라
"고양이 집사에게 주는 것"이라는 느낌이 약하다. 전부 고양이 물건으로 바꾼다.

| # | P | 이름 | 물건 | 파일명 |
|---|---|---|---|---|
| 1 | 10 | 참치캔 | 뚜껑 반쯤 딴 참치캔 | `gift-cat-01-tuna.png` |
| 2 | 15 | 우유 접시 | 얕은 접시에 담긴 우유 | `gift-cat-02-milk.png` |
| 3 | 20 | 츄르 | 짜먹는 튜브 간식 묶음 | `gift-cat-03-churu.png` |
| 4 | 30 | 깃털 낚싯대 | 나무 막대 + 깃털 | `gift-cat-04-wand.png` |
| 5 | 55 | 방울 공 | 털실공 + 작은 방울 | `gift-cat-05-ball.png` |
| 6 | 90 | 쥐 인형 | 천 쥐 + 캣닢 잎 | `gift-cat-06-mouse.png` |
| 7 | 130 | 스크래처 | 골판지 스크래처 | `gift-cat-07-scratcher.png` |
| 8 | 200 | 창가 방석 ✦희귀 | 볕 드는 자리 쿠션 | `gift-cat-08-cushion.png` |
| 9 | 300 | 캣타워 ✦희귀 | 3단 원목 캣타워 | `gift-cat-09-tower.png` |

### 추가 사무실 선물 2종

기존 9칸 가격과 저장 계약은 코드 연결 전까지 건드리지 않는다. 아래 두 종은
에셋과 방 배치부터 검수한 뒤 카탈로그 확장 방식과 가격을 결정한다.

| 이름 | 물건 | 파일명 |
|---|---|---|
| 연필꽂이 | 원조 방의 발바닥 컵 + 필기구 3개 | `gift-cat-10-pencil-cup.png` |
| 화분 | 둥근 잎 6장 + 크림색 발바닥 화분 | `gift-cat-11-plant.png` |

### 저장 데이터 제약 — 이름을 그냥 바꾸면 안 된다

`giftHistory`는 선물을 **이름 문자열**로 저장한다. 카탈로그에서 이름이 사라지면
그 선물은 방에서도 보관함에서도 조용히 없어진다 —
**"하나도 안 버렸다냥"이 거짓말이 된다.**

그래서 R5 구현 때 옛 이름 → 새 이름 정규화 맵을 하나 둔다.
저장된 데이터는 그대로 두고 **읽을 때만** 변환하므로 `butlermaker_v1` 계약은
건드리지 않는다.

```
생선 → 츄르 / 큰 생선 → 깃털 낚싯대 / 리본 → 방울 공
꽃다발 → 쥐 인형 / 특별선물 → 창가 방석 / 스페셜 → 캣타워
우유 → 우유 접시
```

---

## 공통 프롬프트 (모든 품목 앞에 붙임)

```
Single object icon for a cozy retro office game, drawn as one clean piece of
hand-drawn 2D anime art. Three-quarter view from slightly above, as if the
object is resting on a wooden desk and seen by someone sitting at it.

Flat cel shading: one soft warm highlight and one soft shadow, no gradients,
no texture noise, no rendering detail.

Clean uniform dark brown outline, color #4A3320, about 3% of the image width,
fully closed around the whole silhouette, same thickness everywhere.

Balanced retro-office palette shared with the current cat room: cream
#F3E3C8, amber #D9A05B, maroon #7A2C36, sage green #7C8F6A, walnut brown
#6B4A2E, vintage cobalt #355A8A, emerald #25835B, and pale mint #A8D7B8.
The full set must distribute these accents rather than concentrating every
item in maroon or amber. Cool accents are welcome when they help an item read,
but must stay softened and vintage — never neon, fluorescent, or icy.

Simple bold silhouette with at most three shape elements, still readable when
shrunk to 30 pixels wide.

Transparent background. Object centered with a small even margin on all sides.
No painted contact shadow and no cast shadow. Placement code owns any shadow
so movable gifts remain natural on desks, shelves, and floors.

No text, no numbers, no logo, no sparkles, no glow, no gold foil, no border.
```

## Negative prompt (공통)

```
photo, photorealistic, 3d render, clay render, gradient mesh, noisy texture,
fine rendering detail, multiple separate objects, cluttered composition,
tiny details, thin hairline strokes, uneven line weight, missing outline,
white outline, light outline, dark object, black object, muddy brown object,
neon blue, neon teal, fluorescent cyan, purple, violet, lavender, magenta,
pink plastic, cool grey, grey object, desaturated grey, washed out, neon,
fluorescent, saturated primary colors,
gold foil, glitter, sparkles, star effects, glow, lens flare, long cast shadow,
shadow stretching away from object, background scenery, desk, table, floor,
wall, room, white background, opaque background, checkerboard background,
text, watermark, signature, frame, border, cropped edges, cat, animal, character
```

`cat, animal, character`가 네거티브에 있는 이유: "고양이 선물"이라고 하면
모델이 자꾸 고양이를 같이 그린다. 여기 필요한 건 **물건만**이다.

---

## 품목별 프롬프트

### ① 참치캔 (10P)

가장 처음 주는 선물이고 제일 자주 보인다. 여기서 톤이 정해진다.

```
A closed tin can of tuna. Round shallow can with a muted vintage cobalt label,
cream cat emblem, silver-cream rim, and a fully sealed flat lid with the pull
tab attached. Use a low tabletop perspective: front label dominant, only a
narrow shallow ellipse of the lid visible. No exposed tuna and no label text.
```

### ② 우유 접시 (15P)

```
A shallow cream-colored ceramic saucer filled with white milk, with a small
milk bottle standing beside it, cork stopper on top. The milk surface is a
flat white oval with one soft highlight. Cozy and simple.
```

### ③ 츄르 (20P)

```
Three squeeze-tube cat treats bundled together, standing slightly fanned out.
Long slim tubes in warm cream and amber with a twisted top, one tube slightly
taller than the others. No text or branding on the tubes.
```

### ④ 깃털 낚싯대 (30P)

밖으로 튀어나오는 실루엣은 **깃털 하나만**. 끈을 여러 갈래로 늘어뜨리지 않는다.

```
A cat teaser wand toy. Short warm-wood stick lying at a diagonal, with a single
short string and one soft feather in cream and maroon at the end. The feather
is the only element extending outward. Clean and uncluttered.
```

### ⑤ 방울 공 (55P)

```
A ball of soft yarn in warm amber, with a few loose strands wrapped around it,
and one small round brass bell resting against it. Round bold silhouette,
the bell is small and clearly separate.
```

### ⑥ 쥐 인형 (90P)

```
A small stuffed toy mouse made of cream fabric, with a maroon stitched nose,
tiny round ears, and one short curled tail. A single sage-green catnip leaf
tucked beside it. Handmade cloth toy look, soft rounded shape.
```

### ⑦ 스크래처 (130P)

```
A corrugated cardboard cat scratcher board, rectangular, seen at a three-quarter
angle. Visible wavy corrugation lines along the top edge in warm tan, with a few
shallow claw marks. A thin maroon fabric trim along one side. Sturdy simple slab.
```

### ⑧ 창가 방석 ✦희귀 (200P) — **512 × 683 세로**

희귀 두 종은 "물건"이 아니라 **자리**다. 집사가 주인님을 위해 마련해둔 자리.

```
A plump round floor cushion for a cat, seen from a three-quarter angle, sitting
on a small warm-wood platform. Cream quilted fabric with maroon piping around
the rim and a soft dent in the middle. Warm sunlight falls across the cushion
from one side, painted as a soft flat amber shape, not a glow effect.
Vertical composition with the cushion in the lower half.
```

### ⑨ 캣타워 ✦희귀 (300P) — **512 × 683 세로**

방에서 유일한 세로 실루엣이 된다. 이게 300P의 값이다. 확실히 크고 확실히 티나게.

```
A three-tier cat tower made of warm walnut wood posts wrapped in natural sisal
rope, with two cream carpeted platforms and a small maroon fabric hammock slung
between the middle posts. Tall vertical structure, wider base, narrower top.
Sturdy handcrafted furniture look. Vertical composition filling the frame
top to bottom.
```

---

## 부록 — 관계 흔적 5종 + 보관함 1종 (같이 뽑아야 한다)

선물만 그림이 되고 흔적이 이모지로 남으면, **흔적이 선물에 진다.**
그러면 이 방은 관계가 쌓이는 공간이 아니라 쇼핑 진열대가 된다
(`docs/CURRENT.md`의 집사방 물건 항목에 잠긴 규칙).

전부 **512 × 512**, 같은 공통 프롬프트·네거티브를 쓴다.
흔적은 선물과 달리 **사무국 비품**이라, 아이보리·크라프트 종이 계열로
한 톤 차분하게 간다. 선물이 색으로 이기고 흔적이 격으로 이기는 관계다.

| 키 | 이름 | 파일명 | 프롬프트 |
|---|---|---|---|
| `file` | 주인님 파일 | `trace-01-file.png` | `A single manila document folder standing slightly open, warm kraft paper color, with a cream index tab on top and a thin maroon string tie. A few document sheets peek out of the top edge. Official archive look.` |
| `stamp` | 전용 도장 | `trace-02-stamp.png` | `A wooden hand stamp standing upright on its base, turned handle in warm walnut wood with a maroon ink pad ring at the bottom rim. Beside it a small square ink pad tin, closed. Clean official desk tool.` |
| `box` | 전용 서류함 | `trace-03-box.png` | `A small archive storage box in warm kraft cardboard, lid slightly ajar, with a cream label plate on the front face and two round finger holes on the sides. Stacked document edges just visible under the lid.` |
| `seal` | 전담 인장 | `trace-04-seal.png` | `A paper tag hanging from a short twine loop, ivory card stock with a punched hole and a maroon wax seal pressed onto its lower half. The wax seal is round with a simple paw-shaped impression. Slightly tilted.` |
| `storage` | 비품 보관함 | `trace-05-storage.png` | `A closed archive storage box in warm kraft cardboard, lid fully on, with a cream label plate on the front and a twine handle. Neatly sealed, nothing spilling out. Simple sturdy container.` |
| `plate` | 주인님 명패 | `trace-06-nameplate-frame.png` | `A wide low blank desk plaque with a rounded walnut frame, muted maroon inner face, broad cream text inset, and one small paw detail. No lettering inside the image.` |

`plate`는 빈 명패 프레임만 이미지로 두고, `OO님의 냥집사`는 사용자 이름에 맞춰
HTML/CSS 텍스트로 올린다. 구매·해금 전에는 렌더링하지 않는 책상 앞 고정 슬롯이다.

⚠️ 보관함은 **닫혀 있어야** 한다. "집사가 하나도 안 버리고 정리해서 보관 중"이
이 칸의 정서다. 열려서 물건이 삐져나오면 "쌓아둔 잡동사니"가 된다.

---

## 제출 전 체크리스트

- [ ] 일반 512×512 / 희귀 512×683, RGBA, 배경 **완전 투명**(체커보드 아님)
- [ ] 외곽선이 `#4A3320` 계열로 **전 품목 동일 굵기** — 14장을 나란히 놓고 확인
- [ ] 16장 전부 **56px로 축소**해서 각각 뭔지 3초 안에 구분되는지 확인
- [ ] 현재 CAT 방의 책상 위에 56~72px로 올려놓고,
      **묻히지 않는지** 확인 (제일 중요)
- [ ] 아이템 어디에도 **금박·반짝임 없음** — 금박은 인증서와 축하 전용이다
      (희귀 아이템 아래 금박 받침은 코드가 그리는 것이고 그림에는 넣지 않는다)
- [ ] 에셋 자체에는 접지·캐스트 그림자 없음 — 배치 위치에 맞춰 코드가 담당
- [ ] 텍스트·숫자·로고 없음
- [ ] 고양이나 캐릭터가 같이 그려지지 않음 — 물건만
- [ ] 희귀 2종이 세로로 서 있고, 일반 7종보다 확실히 크게 읽힘

---

# 1차 검수 결과 (2026-08-21) — 7장 통과 / 6장 재작업

`codex/r1-cat-gift-assets`의 14장을 받아 검수했다. 규격은 전부 통과했고
(512×512 / 512×683, RGBA, 투명, 알파 정상) 무엇보다 **외곽선 전략이 통했다** —
실제 폰 크기(30~36px)의 방 배경 위에 올려도 묻히지 않고 전부 읽힌다.

문제는 한 가지, **팔레트가 샜다.**

## 측정 — 방 배경의 한색 비율은 0.3%다

불투명 픽셀의 색상환 150°~330°(파랑·보라·청록) 비율을 쟀다.

| 에셋 | 한색 | 평균 명도 | 판정 |
|---|---|---|---|
| **[방 배경]** | **0.3%** | 41.5 | 기준 |
| gift-cat-05-ball | **74.5%** | 44.3 | 재작업 — 보라 |
| trace-05-storage | **74.9%** | 47.8 | 재작업 — 파랑 |
| trace-02-stamp | **37.8%** | 38.8 | 재작업 — 파란 잉크패드 + 어두움 |
| gift-cat-02-milk | **20.4%** | 74.0 | 재작업 — 파란 뚜껑·마크 |
| gift-cat-01-tuna | **18.1%** | 52.0 | 재작업 — 파란 캔 |
| gift-cat-06-mouse | 0.0% | 53.1 | 재작업 — 채도 27.5, 회색 쥐 |
| gift-cat-03-churu | 0.0% | 54.2 | 통과 |
| gift-cat-04-wand | 0.0% | 42.1 | 통과(막대만 한 톤 밝게) |
| gift-cat-07-scratcher | 0.0% | 45.9 | 통과 |
| gift-cat-08-cushion | 0.0% | 60.4 | 통과 |
| gift-cat-09-tower | 0.7% | 60.5 | 통과 |
| trace-01-file | 0.0% | 61.6 | 통과 |
| trace-03-box | 0.0% | 41.1 | 통과 |
| trace-04-seal | 0.0% | 61.8 | 통과 |

방에 차가운 색이 사실상 없는데 아이템에 파랑·보라가 들어가면, "튄다"가 아니라
**"다른 게임에서 가져온 아이콘"으로 읽힌다.** 이건 우리가 원한 튐이 아니다.

원인은 이 문서에 있었다. 팔레트를 나열했을 뿐 **한색을 금지하지 않았다.**
공통 프롬프트에 STRICTLY NO COOL COLORS 문단을, 네거티브에 blue·purple 계열을
추가했다. 재작업은 그 문단이 들어간 프롬프트로 돌린다.

## 재작업 6장 — 무엇을 무슨 색으로

| 파일 | 지금 | 바꿀 것 |
|---|---|---|
| `gift-cat-05-ball` | 보라 털실 | **앰버/러스트 털실.** 방울은 지금 놋쇠 그대로 좋다 |
| `trace-05-storage` | 파란 상자 | **크라프트 갈색 상자.** 모서리 놋쇠 장식은 유지 |
| `trace-02-stamp` | 파란 잉크패드 | **마룬 잉크패드.** 나무 손잡이는 지금 그대로. 전체 한 톤 밝게 |
| `gift-cat-02-milk` | 파란 뚜껑·고양이 마크 | **마룬 뚜껑·마크.** 우유 흰색과 접시 크림색은 유지 |
| `gift-cat-01-tuna` | 파란 캔 | **마룬 캔.** 참치 살구색과 은색 뚜껑은 유지 |
| `gift-cat-06-mouse` | 회색 쥐(채도 27.5) | **크림/베이지 천 쥐 + 마룬 코·꼬리.** 캣닢 잎(세이지) 추가 |

나머지 8장은 손대지 않는다. 특히 `trace-04-seal`(아이보리 태그 + 마룬 왁스실)과
`trace-01-file`은 방에 완벽하게 붙는다 — **이 둘을 색 기준으로 삼으면 된다.**

## 배치 쪽 문제 하나 — 이건 에셋이 아니라 슬롯 설계가 틀렸다

캣타워를 희귀 슬롯(고양이 정면 중앙, bottom 13%)에 올리면 **세로로 길어서
고양이 몸통을 관통한다.** 방석은 낮고 넓어서 같은 자리에 완벽하게 앉는다.

즉 희귀 슬롯은 하나가 아니라 형태별로 둘이어야 한다.

- **가로형 희귀**(창가 방석) → 중앙 `bottom 13%`, 폭 44px — 고양이 앞에 놓인 자리
- **세로형 희귀**(캣타워) → 구매 시에만 나타나는 오른쪽 고정 슬롯. 이동 금지.
  `방 배경 < 캣타워 < 고양이 < 책상 전경` 순서로 두고 하단을 책상이 가린다.

R5에서 에셋을 연결할 때 `CAT_ROOM_RARE_SLOT` 하나를 형태별 두 슬롯으로 나눈다.
에셋 쪽에서 고칠 것은 없다.

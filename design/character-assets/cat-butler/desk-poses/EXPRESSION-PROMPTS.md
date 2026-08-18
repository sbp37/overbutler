# 접수대 고양이 표정 3종 — 제작 프롬프트

## 만드는 방법

**텍스트→이미지로 새로 뽑지 말 것.** `cat-desk-base.png`를 넣고
**image-to-image / inpainting**으로 **얼굴만** 바꾼다. 런타임에서 `img.src`만
갈아끼우는 구조라, 몸·책상·조끼·구도가 1px이라도 어긋나면 교체 순간 캐릭터가 튄다.

- 방식: inpaint(마스크 = 얼굴 영역만) 권장. i2i라면 denoise 0.25~0.35.
- 마스크 범위: 귀 끝 ~ 턱 아래, 좌우 수염 끝까지. 나비넥타이 아래는 건드리지 않는다.
- 출력: 822 × 1117 PNG, RGBA(투명 배경). 알파 가장자리 안티에일리어싱 유지.
- 저장 위치: `design/character-assets/cat-butler/desk-poses/`
  - `cat-desk-annoyed.png` / `cat-desk-happy.png` / `cat-desk-surprised.png`
- PNG만 주면 된다. webp 변환(q=90, alpha_quality=100)과 코드 연결은 개발 쪽에서 한다.

## ⚠️ 표정을 크게 과장할 것

화면 표시 크기는 **112 × 153px**(넓은 화면 117×160 / 좁은 화면 104×142)다.
원본의 1/7이고 얼굴은 그중 35px 남짓. 평소 감각으로 "살짝 찡그림"을 그리면
base와 구분이 안 된다. 눈·입 모양을 2배쯤 크게 잡아 실루엣만으로 읽히게 한다.

---

## 공통 프롬프트 (앞에 붙임)

```
Same cartoon orange tabby cat butler character, identical art style, identical
line weight and coloring. Chibi bust framing, seated behind a desk, cream-white
muzzle and chest, pink inner ears, tabby forehead stripes. Wearing a white
dress shirt, dark charcoal waistcoat with two amber buttons, a maroon bow tie,
and a small white name badge on the chest. Transparent background, flat cel
shading with soft airbrushed cheeks, clean dark-brown outlines.
Change ONLY the facial expression. Head size, head position, ear position,
body, arms, paws, clothing, and framing must stay exactly the same.
```

## ① annoyed — 띠껍

용도: 같은 곳을 연타/반복 탭할 때. **가장 자주 보이는 얼굴**이라 이게 초반 츤데레 톤을 결정한다.
화난 게 아니라 "…또?" 하는 얼굴. 귀찮은데 싫진 않은 온도.

```
Expression: mildly annoyed and unimpressed. Eyes narrowed to flat half-lidded
slits with a heavy straight upper lid, pupils pushed to one side in a sidelong
glance. One eyebrow ridge raised higher than the other. Mouth a flat wide
horizontal line, slightly pressed. One ear tilted back and down, the other
still upright. A single small vertical annoyance tick mark on the temple.
Whiskers drooping slightly. Deadpan, not angry.
```

## ② happy — 아주 조금 다정

용도: 대업 접수 직후 / 선물 받은 직후.
**여기서 활짝 웃기면 캐릭터가 무너진다.** "고생했다냥(아주 조금)" 딱 그 온도 —
티 안 내려다 새어나온 정도.

```
Expression: quietly pleased, trying not to show it. Eyes closed into gentle
upward crescent arcs (^ ^ shape). Mouth a small soft upward curve, closed.
Cheeks with a faint warm blush. Both ears tipped slightly forward. Whiskers
lifted a little. Content and understated — a small private smile, NOT a wide
open-mouthed grin, no visible teeth, no sparkles.
```

## ③ surprised — 흠칫

용도: 파워 주접(rare/power 판정)이 터지는 순간. 가장 드물게 뜨니 제일 세게 그려도 된다.
도장 찍다 손이 멈춘 얼굴.

```
Expression: startled. Eyes wide open and round, much larger than the base pose,
pupils dilated into big circles with a small highlight. Eyebrow ridges lifted
high. Mouth a small round open "o". Both ears snapped straight up and alert.
Whiskers bristling outward and upward. Fur on the cheeks slightly puffed.
Frozen mid-reaction, wide-eyed — surprised, not frightened, not angry.
```

## Negative prompt (공통)

```
different character, different art style, realistic, 3d render, photo,
full body, legs, lower body, standing, different pose, moved head,
resized head, different outfit, no waistcoat, no bow tie, missing name badge,
background scenery, desk, shadow on background, opaque background, white
background, text, watermark, signature, border, frame, extra limbs,
open mouth with teeth, sparkles, blush lines on annoyed version
```

## 제출 전 체크리스트

- [ ] 822 × 1117, RGBA, 배경 완전 투명
- [ ] `cat-desk-base.png` 위에 겹쳐서 **귀 끝·어깨선·조끼 단추·명찰 위치가 정확히 일치**
- [ ] 눈 중심 좌표가 base / blink와 같은 높이 (깜빡임과 이어져야 한다)
- [ ] 알파 바운딩 박스가 base와 같은 범위 (약 40, 40, 782, 1077)
- [ ] 112px 폭으로 축소해도 표정이 구분되는지 눈으로 확인

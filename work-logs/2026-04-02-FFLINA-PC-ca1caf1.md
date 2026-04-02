## 2026-04-02 — FFLINA-PC (feature/226-uiux-phase1-design-tokens) `ca1caf1`

> 모델: claude (spm-done 자동생성)

## 작업 요약

UI/UX 전면 개편 Phase 1 완료 — tailwind.config.js에 신규 디자인 시스템 토큰(surface/on-surface/tertiary/error/outline/inverse 계열 27개 컬러 + 쉐도우 + 보더 래디어스) 등록, Google Fonts(Manrope/Inter/Noto Sans KR) CSS 변수 방식으로 로드, body 기본 스타일을 새 디자인 토큰(bg-surface, text-on-surface, font-body)으로 교체

## 변경된 파일

- `tailwind.config.js` — 신규 디자인 토큰 추가 (surface/on-surface/tertiary/error/outline/inverse 계열 컬러, headline/body/kr 폰트 패밀리, ambient/modal 쉐도우, lg/full 보더 래디어스). 기존 CSS 변수 토큰 유지
- `src/app/layout.tsx` — Manrope, Noto_Sans_KR 추가 import. Inter 포함 전체 폰트를 CSS 변수 방식(`--font-*`)으로 변경
- `src/app/globals.css` — body 스타일을 `bg-surface text-on-surface font-body`로 교체

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 456 passed / 0 failed
- 신규 추가 테스트: 0개
- 미작성 테스트 및 사유: 없음 (스타일/설정 변경만으로 테스트 대상 없음)

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
| --- | --- | --- |
| `globals.css` | `body` 스타일 (`bg-surface text-on-surface`) | 기존 컴포넌트가 `--background` CSS 변수에 의존하고 있음 — Phase 2 컴포넌트 교체 전까지 background/foreground 계열 CSS 변수 값 변경 금지 |
| `tailwind.config.js` | 기존 CSS 변수 토큰 블록 (border, input, ring, background, foreground, brand, primary.DEFAULT 등) | 기존 컴포넌트 전체가 이 토큰에 의존 — Phase 2에서 컴포넌트 교체 완료 전까지 제거/수정 금지 |

## 미완성 / 다음 세션에서 이어받을 부분

- Phase 2: 공통 컴포넌트 교체 (버튼/인풋/카드/탭/모달 등 11개 작업 + 모바일 하단 탭 바 신규 생성)

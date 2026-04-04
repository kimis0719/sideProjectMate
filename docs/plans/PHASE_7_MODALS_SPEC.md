# Phase 7 — 모달 디자인 교체 상세 기획서 (7-1, 7-4, 7-5)

> 이슈: #247
> 브랜치: `feature/247-uiux-phase7-modals`
> 작성일: 2026-04-04

---

## 사용자 컨펌 완료 사항

| 항목 | 결정 |
|------|------|
| 7-2 InstructionModal | ⏸️ 대기 — 다른 개발자 기능 변경 완료 후 |
| 7-3 HistoryModal | ⏸️ 대기 — 다른 개발자 기능 변경 완료 후 |
| 7-6 ResourceModal | ⏸️ 보류 |
| 7-4 크롭/줌/회전 | 디자인만 교체, 기능 구현 안 함. 재업로드 버튼만 추가 |
| 7-5 태그/공개토글 | 유지 — v2 에셋(`01_5_review_modal`)에 포함됨 |
| 7-5 별점 색상 | 에셋 기준 파란색(primary-container) |

---

## 대상 파일

| # | 모달 | 파일 | 줄 수 | 분류 | 에셋 |
|---|------|------|------|------|------|
| 7-1 | 지원하기 | `src/components/projects/ApplyModal.tsx` | 176 | [디자인만 변경] | `modals/01_1_apply_modal.html` |
| 7-4 | 이미지 편집 | `src/components/profile/modals/ImageEditModal.tsx` | 143 | [디자인만 변경] | `modals/01_modals_all.html` (섹션 4) |
| 7-5 | 리뷰 작성 | `src/components/projects/ReviewModal.tsx` | 271 | [디자인만 변경] | `modals/01_5_review_modal.html` |

---

## 건드리면 안 되는 코드

| 파일 | 위치 | 이유 |
|------|------|------|
| ApplyModal.tsx | handleSubmit, useApplicationStore 연동 | 지원 API + 스토어 로직 |
| ImageEditModal.tsx | handleUpload, Cloudinary 업로드 로직 | 파일 업로드 플로우 |
| ReviewModal.tsx | handleSubmit, confirm/alert 다이얼로그 | 리뷰 API + 확인 플로우 |

---

## 공통 디자인 패턴 (3개 모달 공통)

- 오버레이: `bg-on-background/20 backdrop-blur-md` (glassmorphism)
- 모달 카드: `bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.06)]`
- 닫기 버튼: Material Symbols `close` + `text-outline hover:text-on-surface`
- 인풋/textarea: `bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/20`
- 라벨: `text-sm font-bold text-on-surface` 또는 `text-on-surface-variant font-label uppercase tracking-wider`
- 취소 버튼: `bg-surface-container-high text-on-surface-variant rounded-lg`
- 제출 버튼: `bg-primary-container text-on-primary rounded-lg font-bold`

---

## 작업 순서

```
Step 1: ApplyModal (7-1) → 사용자 테스트 & 컨펌
Step 2: ImageEditModal (7-4) → 사용자 테스트 & 컨펌
Step 3: ReviewModal (7-5) → 사용자 테스트 & 컨펌
```

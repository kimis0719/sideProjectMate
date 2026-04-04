# Phase 4 — 인증/온보딩 페이지 디자인 교체 상세 기획서

> 이슈: #241
> 브랜치: `feature/241-uiux-phase4-auth-onboarding`
> 작성일: 2026-04-04

---

## 작업 진행 규칙

Phase 3.5 기획서(`PHASE_3_5_KANBAN_2_0_SPEC.md`)와 동일한 규칙을 따릅니다.

1. **사전 확인**: 각 항목 시작 전 `[디자인만 변경]` / `[기능 수정]` 분류를 사용자에게 보고
2. **디자인 상충 시**: 작업 중단 → 선택지 제시 → 사용자 컨펌 후 진행
3. **완료 사이클**: 작업 완료 → 테스트 케이스 제시 → 사용자 로컬 테스트 → 컨펌 → 다음 단계

---

## 사용자 컨펌 완료 사항

| 항목 | 결정 |
|------|------|
| AvailabilityScheduler | 4블록×7일로 간략화 `[기능 수정]`. 디자인 참조: `pages/13_profile_view_v2_pc/` |
| 소셜 로그인 버튼 스타일 | 현행 유지 (GitHub=검은 filled, Google=투명+보더). 에셋과 다름 인지 |
| 랜딩 헤더 | 글로벌 Header 유지. 랜딩 전용 헤더 만들지 않음 |
| 모바일 | 추가 레퍼런스 없음. HTML 에셋 반응형 스타일대로 진행 |

---

## 현재 구현 상태

### 대상 파일 전수 목록

| 파일 | 줄 수 | 분류 | 비고 |
|------|------|------|------|
| `src/app/page.tsx` | 41 | [디자인만 변경] | 컨테이너, 배경색만 교체 |
| `src/components/HeroSection.tsx` | 281 | [디자인만 변경] | 캐러셀 로직 유지, className 교체 |
| `src/components/LandingPreview.tsx` | 98 | [디자인만 변경] | fetch 로직 유지, 카드/CTA 스타일 교체 |
| `src/components/projects/ProjectList.tsx` | 380 | [디자인만 변경] | 필터/페이지네이션 로직 유지, 칩/그리드 스타일 |
| `src/components/projects/ProjectCard.tsx` | 149 | [디자인만 변경] | hover, 뱃지 스타일 교체 |
| `src/app/login/page.tsx` | 368 | [디자인만 변경] | 인증 로직 유지, 브랜딩+폼 className 교체 |
| `src/app/register/page.tsx` | 704 | [디자인만 변경] | 밸리데이션 로직 유지, 브랜딩+폼+강도미터 교체 |
| `src/app/onboarding/page.tsx` | 236 | [디자인만 변경] | 위저드 로직 유지, 프로그레스/카드/버튼 교체 |
| `src/components/profile/CommunicationStyleSlider.tsx` | 102 | [디자인만 변경] | 슬라이더/태그 스타일 교체 |
| `src/components/profile/AvailabilityScheduler.tsx` | 196 | **[기능 수정]** | 24×7 → 4블록×7일 재구현 |
| **합계** | **~2,555** | | |

### 건드리면 안 되는 코드

| 파일 | 위치 | 이유 |
|------|------|------|
| `login/page.tsx` | `handleSubmit`, `handleSocialLogin` | next-auth signIn 로직 |
| `register/page.tsx` | 밸리데이션 useEffect 4개 (email, password, phone, strength) | 기존 밸리데이션 규칙 |
| `register/page.tsx` | `handleSubmit`, `generateRandomNickname` | 회원가입 API 호출 + 닉네임 생성 |
| `onboarding/page.tsx` | `saveStep`, `handleNext`, `handleComplete`, `handleSkip` | 온보딩 저장/완료 API 로직 |
| `HeroSection.tsx` | `goNext`, `goPrev`, useEffect 자동전환 | 캐러셀 타이머/상태 관리 |
| `LandingPreview.tsx` | useEffect fetch 로직, 세션 분기 | 비회원/회원 데이터 로딩 |
| `ProjectList.tsx` | 필터링/정렬/페이지네이션 전체 로직 | 비즈니스 로직 |
| `AdBanner.tsx` | 전체 | 카카오 AdFit SDK, 변경 불필요 |

---

## Step 1: 랜딩 페이지 (4-1)

### 1-1. page.tsx [디자인만 변경]

**현행:** `bg-background`
**변경:** `bg-surface` (에셋 기준 #f9f9f8)

### 1-2. HeroSection.tsx [디자인만 변경]

**디자인 참조:** `pages/01_landing_pc.html`

**Hero 배경:**
- 현행: `bg-gradient-to-br from-indigo-50 via-white to-purple-50`
- 에셋: `bg-surface` + dot-grid 패턴 제거 (깔끔한 surface 배경)
- 장식 blob: 현행 유지 (에셋에도 유사한 gradient blob 존재)

**뱃지 (슬라이드 라벨):**
- 현행: `bg-primary/10 text-primary text-xs`
- 에셋: `bg-primary/10 text-primary px-4 py-1 rounded-full` — 거의 동일, 패딩만 조정

**헤드라인:**
- 현행: `text-4xl md:text-5xl lg:text-6xl font-bold text-foreground`
- 에셋: `text-5xl lg:text-7xl font-bold text-on-surface leading-[1.2]`
- 변경: 크기 스케일업 + `text-on-surface` + `leading-[1.2]`

**CTA 버튼:**
- 현행: `btn-primary px-6 py-3` / `btn-secondary px-6 py-3`
- 에셋: 동일 패턴 + `hover:translate-x-1 transition-transform`
- 변경: hover에 `translate-x-1` 추가

**기능 소개 카드 (features):**
- 현행: `border border-border bg-card hover:shadow-lg hover:-translate-y-1`
- 에셋: `bg-surface-container-lowest hover:shadow-xl hover:-translate-y-1` (보더 제거, No-Line Rule)
- 변경: `border` 제거 → `bg-surface-container-lowest` + `shadow-ambient`

**슬라이드 컨트롤:**
- 현행: `bg-background/80 backdrop-blur-sm border border-border`
- 에셋: 유사 — 변경 최소화

**모바일 반응형:** 에셋에 `md:`, `lg:` 브레이크포인트 포함. 현행도 이미 반응형 적용됨. 자연스럽게 처리.

### 1-3. LandingPreview.tsx [디자인만 변경]

**카드 그리드:**
- 현행: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- 에셋: 동일 구조 — 변경 없음

**비회원 CTA:**
- 현행: `bg-primary text-primary-foreground rounded-lg`
- 에셋: 동일 — 변경 최소화

### 1-4. ProjectList.tsx, ProjectCard.tsx [디자인만 변경]

**필터 칩:**
- 현행: 각 필터별 인라인 스타일
- 에셋: `bg-surface-container-high` 비활성, `bg-primary text-on-primary` 활성, `rounded-full`
- 변경: 필터 칩 스타일을 에셋 기준으로 통일

**ProjectCard:**
- 현행: `hover:bg-surface-bright hover:shadow-ambient` (Phase 2에서 적용 완료)
- 에셋: 유사 — 변경 최소화

**테스트 케이스:**
- [ ] Hero 캐러셀 자동 전환 (4초) 정상 동작
- [ ] 캐러셀 좌/우 버튼, 인디케이터 점 클릭
- [ ] CTA 버튼 hover 시 translate-x-1 효과
- [ ] 기능 소개 카드 hover 시 shadow + lift 효과
- [ ] 필터 칩 활성/비활성 스타일 전환
- [ ] 프로젝트 카드 hover 효과
- [ ] 모바일(< 768px)에서 1열 레이아웃
- [ ] 비회원 미리보기 3장 + CTA 표시
- [ ] 로그인 사용자 전체 ProjectList 표시

---

## Step 2: 로그인 페이지 (4-2)

### 2-1. login/page.tsx [디자인만 변경]

**디자인 참조:** `pages/02_login_pc.html`

**좌측 브랜딩 패널:**
- 현행: `bg-gradient-to-br from-primary via-brand to-indigo-800`
- 에셋: `bg-branding-gradient` = `linear-gradient(135deg, #004ac6, #2563eb)`
- 변경: 그래디언트 값을 에셋 기준으로 교체
- 장식 blob: `w-96 h-96 bg-white/10 rounded-full blur-3xl` (에셋 기준)

**우측 폼 영역:**
- 배경: `bg-background` → `bg-surface-container-lowest` (에셋: 흰색)
- 인풋: 현행 `form-input` 클래스 유지 (Phase 2에서 이미 교체됨)
- 버튼: 현행 `btn-primary` 유지

**소셜 로그인 버튼:** ← **컨펌 완료: 현행 유지**
- GitHub: `bg-[#24292e] text-white` (변경 없음)
- Google: `bg-background border border-border text-foreground` (변경 없음)

**구분선:**
- 현행: `border-t border-border` + `bg-background px-3`
- 에셋: flex-grow `h-px bg-outline-variant/30` + `bg-surface-container-lowest`
- 변경: outline-variant 색상 적용

**에러 메시지:**
- 현행: `bg-destructive/10 border-destructive/20 text-destructive`
- 에셋: 유사 — 변경 최소화

**모바일:** `hidden md:flex` 좌측 브랜딩 숨김, `md:hidden` 모바일 로고 — 현행 이미 적용됨.

**테스트 케이스:**
- [ ] 이메일/비밀번호 입력 → 로그인 성공
- [ ] 잘못된 정보 → 에러 메시지 표시
- [ ] GitHub 소셜 로그인 클릭 → 리다이렉트
- [ ] Google 소셜 로그인 클릭 → 리다이렉트
- [ ] 로딩 중 스피너 + 버튼 비활성화
- [ ] 비밀번호 표시/숨기기 토글
- [ ] 모바일에서 좌측 브랜딩 숨김, 폼만 표시
- [ ] "회원가입" 링크 → /register 이동

---

## Step 3: 회원가입 페이지 (4-3)

### 3-1. register/page.tsx [디자인만 변경]

**디자인 참조:** `pages/03_register_pc.html`

**좌측 브랜딩:** 로그인과 동일한 그래디언트 교체 (Step 2 참조)

**폼 영역:** 로그인과 동일한 패턴 — `bg-surface-container-lowest`, `form-input`, `btn-primary`

**비밀번호 강도 미터:**
- 현행: 3단 `h-1 flex-1 rounded-full` + `bg-destructive`/`bg-yellow-400`/`bg-green-500`
- 에셋: `flex-1 bg-primary rounded-full` (활성 바)
- 변경: 색상만 조정. 위험=`bg-error`, 보통=`bg-yellow-400`, 안전=`bg-green-500` 유지 (에셋보다 현행이 UX적으로 더 나음)
- ⚠️ **컨펌 필요 시 사용자에게 질문**

**약관 체크박스:**
- 현행: `h-4 w-4 rounded border-border text-primary`
- 에셋: `w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20`
- 변경: border 색상 교체

**닉네임 재생성 버튼:**
- 현행: `btn-secondary px-3`
- 에셋: 유사 — 변경 최소화

**소셜 로그인 버튼:** 현행 유지 (Step 2와 동일)

**테스트 케이스:**
- [ ] 전체 폼 입력 → 회원가입 성공 → 로그인 페이지 이동
- [ ] 이메일 밸리데이션 (형식 오류 시 인라인 에러)
- [ ] 비밀번호 강도 미터 3단계 표시 (위험/보통/안전)
- [ ] 비밀번호 불일치 시 에러 표시
- [ ] 전화번호 형식 검증
- [ ] 닉네임 재생성 버튼 동작 + 로딩 스피너
- [ ] 약관 미동의 시 가입 버튼 비활성화
- [ ] GitHub/Google 소셜 가입 동작
- [ ] 모바일에서 좌측 브랜딩 숨김

---

## Step 4: 온보딩 페이지 (4-4)

### 4-1. onboarding/page.tsx [디자인만 변경]

**디자인 참조:** `pages/04_onboarding_pc.html`

**카드 컨테이너:**
- 현행: `bg-card rounded-2xl shadow-lg border border-border`
- 에셋: `bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.04)]` (No-Line Rule)
- 변경: border 제거, shadow 교체, rounded 조정

**프로그레스 바:**
- 현행: `bg-muted` 트랙 + `bg-primary` 바
- 에셋: 동일 패턴 + `transition-all duration-500`
- 변경: 애니메이션 추가

**도메인 선택 버튼 (Step 1):**
- 현행: `border-2` + `border-primary bg-primary/5 ring-1 ring-primary` (선택됨)
- 에셋: `bg-primary-container text-on-primary border-2 border-primary-container` (선택됨)
- 변경: 선택 상태 배경을 `bg-primary-container`로 교체

**하단 네비게이션 버튼:**
- 현행: `bg-primary text-primary-foreground rounded-lg`
- 에셋: `px-8 py-4 rounded-xl` (더 큰 패딩, 더 큰 radius)
- 변경: 패딩/radius 조정

### 4-2. CommunicationStyleSlider.tsx [디자인만 변경]

**슬라이더:**
- 현행: `accent-primary` (이미 적용)
- 에셋: 동일 — 변경 없음

**성격 태그:**
- 현행: `border-primary bg-primary/10 ring-1 ring-primary` (선택됨)
- 에셋: `bg-primary-container text-on-primary` (선택됨)
- 변경: 온보딩 도메인 버튼과 동일한 선택 스타일 통일

### 4-3. AvailabilityScheduler.tsx [기능 수정]

**디자인 참조:** `pages/13_profile_view_v2_pc/code.html` (라인 253~300)

**현행 → 변경:**
- react-schedule-selector (24시간×7일) 제거
- styled-components 제거
- Tailwind 4블록×7일 그리드로 재구현

**4블록 정의:**

| 블록 | 라벨 | 시간 범위 | DB 변환 |
|------|------|----------|---------|
| 아침 | 06-12 | `{ start: '06:00', end: '12:00' }` | DaySchedule 포맷 그대로 |
| 점심 | 12-18 | `{ start: '12:00', end: '18:00' }` | |
| 저녁 | 18-24 | `{ start: '18:00', end: '00:00' }` | |
| 심야 | 00-06 | `{ start: '00:00', end: '06:00' }` | |

**그리드 레이아웃 (에셋 기준):**
```
grid grid-cols-[4.5rem_repeat(7,1fr)] gap-[4px]
```

**셀 스타일:**
- 비활성: `h-10 bg-[#F3F4F6] rounded-md hover:bg-[#F3F4F6]/80 cursor-pointer`
- 활성: `h-10 bg-primary rounded-md shadow-sm`
- 헤더: `text-[10px] font-bold text-on-surface-variant uppercase`
- 행 라벨: `text-[9px] font-bold text-outline` + 시간 범위 `text-[8px] opacity-70`

**인터랙션:**
- 셀 클릭 → 토글 (활성↔비활성)
- onChange 시 DaySchedule[] 포맷으로 변환하여 부모에 전달

**기존 데이터 호환:**
- 기존 24시간 데이터 → 4블록으로 매핑: 해당 블록 시간대에 1개라도 포함되면 활성
- 새로 저장 시 블록 단위로 저장

**Props 인터페이스 유지:**
```ts
interface AvailabilitySchedulerProps {
  initialSchedule?: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}
```

**테스트 케이스:**
- [ ] Step 1: 도메인 선택/해제 토글
- [ ] Step 2: 슬라이더 값 변경, 성격 태그 최대 3개 제한
- [ ] Step 3: 4블록×7일 그리드 렌더링
- [ ] Step 3: 셀 클릭 시 토글 (활성↔비활성)
- [ ] Step 3: onChange로 DaySchedule[] 정상 출력
- [ ] 프로그레스 바 단계별 진행
- [ ] "다음" 버튼 → 단계 전환 + 서버 저장
- [ ] "완료 및 시작하기" → /projects 이동
- [ ] "다음에 하기" → 건너뛰기 동작
- [ ] 모바일에서 단일 열 레이아웃 정상 표시
- [ ] 기존 24시간 스케줄 데이터가 4블록에 올바르게 표시되는지

---

## 작업 순서

```
Step 1: 랜딩 페이지 ──────────────────────────────────
  1-1  page.tsx 배경색
  1-2  HeroSection className 교체
  1-3  LandingPreview 스타일
  1-4  ProjectList 필터 칩 / ProjectCard 스타일
  → 사용자 테스트 & 컨펌

Step 2: 로그인 페이지 ────────────────────────────────
  2-1  브랜딩 패널 그래디언트 + 폼 영역 스타일
  → 사용자 테스트 & 컨펌

Step 3: 회원가입 페이지 ──────────────────────────────
  3-1  브랜딩 패널 + 폼 + 강도 미터 스타일
  → 사용자 테스트 & 컨펌

Step 4: 온보딩 페이지 ────────────────────────────────
  4-1  카드/프로그레스/버튼 스타일
  4-2  CommunicationStyleSlider 스타일
  4-3  AvailabilityScheduler 4블록×7일 재구현
  → 사용자 테스트 & 컨펌
```

---

## 예상 일정

| Step | 작업 | 예상 |
|------|------|------|
| 1 | 랜딩 페이지 | 0.5일 |
| 2 | 로그인 | 0.3일 |
| 3 | 회원가입 | 0.3일 |
| 4 | 온보딩 (AvailabilityScheduler 재구현 포함) | 0.5일 |
| **합계** | | **1.5~2일** |

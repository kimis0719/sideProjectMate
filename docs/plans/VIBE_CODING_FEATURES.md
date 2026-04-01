# Side Project Mate — 바이브코딩 특화 기능 계획

> 작성일: 2026-04-01  
> 목적: 바이브코딩(AI-assisted rapid development) 팀을 위한 기능 추천 및 구현 로드맵

---

## 현재 완성도 평가

| 기능 | 완성도 | 비고 |
|------|--------|------|
| 칸반 보드 (실시간, undo/redo, peer cursor) | ★★★★★ 95% | 프로덕션 수준 |
| AI 명령 생성 (SSE, 멀티 LLM, 히스토리) | ★★★★☆ 75% | 프리셋·스트리밍 완성 |
| 팀 빌딩 & 신청 플로우 | ★★★★★ 95% | 전체 플로우 완성 |
| 사용자 프로필 (GitHub/Solved.ac/RSS) | ★★★★☆ 85% | 주요 통합 완성 |
| WBS / Gantt | ★★★★☆ 90% | API·UI 모두 존재 |
| 채팅 실시간 | ★★★★☆ 90% | Socket.io 완성 |
| 어드민 패널 | ★★★★☆ 80% | 주요 기능 완성 |
| 리뷰 시스템 | ★★☆☆☆ 30% | 모델만 있고 UI 미완 |
| 랜딩 페이지 | ★★☆☆☆ 30% | 기본 수준 |
| 소셜 로그인 (GitHub/Google) | ★☆☆☆☆ 10% | 설정만, 미노출 |
| 모바일 반응형 | ★☆☆☆☆ 10% | 데스크탑 전용 |

---

## 기능 추천 목록

### 🥇 최우선 — 임팩트 높음 & 기존 인프라 재활용 가능

---

#### 1. AI 프로젝트 킥스타터
**한 줄 요약**: 아이디어 한 문장 입력 → AI가 WBS + 칸반 섹션 + 기본 노트 자동 생성

**상세**
- 프로젝트 생성 플로우 마지막 단계에 "AI로 보드 구성하기" 옵션 추가
- 입력: 프로젝트 제목 + 한 줄 설명 + 기술스택
- 출력: 섹션 목록(To Do / In Progress / Done + 도메인별 섹션) + 첫 노트 세트

**재활용 가능한 기존 코드**
- `src/app/api/ai/generate-instruction/route.ts` — SSE 스트리밍
- `src/store/boardStore.ts` — `addNote`, `addSection` 액션
- `src/lib/utils/ai/buildAiContext.ts` — 컨텍스트 빌더

**구현 파일**
- `src/app/api/ai/kickstart/route.ts` (신규)
- `src/components/board/KickstartModal.tsx` (신규)
- `src/store/boardStore.ts` (배치 생성 액션 추가)

---

#### 2. 번다운 차트
**한 줄 요약**: 완료된 노트 수 × 날짜 그래프로 프로젝트 속도와 마감일 예측

**상세**
- 대시보드 탭에 "번다운" 뷰 추가
- X축: 날짜, Y축: 남은 노트 수
- 이상적인 선(ideal line)과 실제 선 비교
- 속도(velocity) 계산 → 현재 속도로 완료 예상일 표시

**재활용 가능한 기존 코드**
- `completedAt` 필드 (Note 모델에 추가 필요)
- `src/components/dashboard/` — 대시보드 위젯 패턴

**구현 파일**
- `src/app/api/kanban/boards/[boardId]/burndown/route.ts` (신규)
- `src/components/dashboard/BurndownChart.tsx` (신규)
- `src/lib/models/kanban/Note.ts` — `completedAt` 필드 추가

---

#### 3. WBS ↔ 칸반 양방향 동기화
**한 줄 요약**: WBS 태스크와 칸반 노트를 연결해 하나를 완료하면 나머지도 자동 반영

**상세**
- 노트에 `linkedTaskId` 필드 추가 (선택적 연결)
- WBS에서 태스크 완료 → 연결된 칸반 노트 자동 "완료" 이동
- 칸반 노트 완료 → 연결된 WBS 태스크 progress 100% 업데이트
- 연결 UI: 노트 상세에서 WBS 태스크 드롭다운 선택

**재활용 가능한 기존 코드**
- `src/app/api/wbs/tasks/[taskId]/route.ts`
- `src/app/api/kanban/notes/[noteId]/route.ts`
- `src/store/boardStore.ts` — `completeNote` 액션
- `src/store/wbsStore.ts`

**구현 파일**
- `src/lib/models/kanban/Note.ts` — `linkedTaskId` 추가
- `src/app/api/kanban/notes/[noteId]/route.ts` — 동기화 로직 추가
- `src/components/board/NoteItem.tsx` — 연결 UI 추가

---

### 🥈 고우선 — 바이브코딩 핵심 워크플로우

---

#### 4. AI 스프린트 플래너
**한 줄 요약**: 현재 보드 상태를 분석해 "이번 주 뭘 해야 하는지" 우선순위 제안

**상세**
- 보드의 미완료 노트 + 마감일 + 팀원 가용성 분석
- "이번 스프린트 집중 추천 항목 TOP 5" 생성
- 이유 설명 포함 (마감 임박 / 의존성 해제 / 중요도)

**재활용 가능한 기존 코드**
- `src/lib/utils/ai/buildAiContext.ts`
- `src/app/api/ai/generate-instruction/route.ts`
- 기존 AI 프리셋 패턴

**구현 파일**
- `src/app/api/ai/sprint-plan/route.ts` (신규)
- `src/components/dashboard/SprintPlannerWidget.tsx` (신규)

---

#### 5. AI 데일리 스탠드업 요약
**한 줄 요약**: 전날 완료된 노트 + 채팅 내용 → "어제 한 것 / 오늘 할 것 / 블로커" 자동 생성

**상세**
- 매일 오전 자동 생성 or 버튼 클릭 on-demand
- 결과물을 팀 채팅방에 자동 전송 옵션
- 팀원별 기여 항목 분류

**재활용 가능한 기존 코드**
- `src/app/api/kanban/notes/` — 완료 노트 조회
- `src/app/api/chat/messages/` — 채팅 내용 조회
- Socket.io 채팅 전송 로직

**구현 파일**
- `src/app/api/ai/standup/route.ts` (신규)
- `src/components/dashboard/StandupWidget.tsx` (신규)

---

#### 6. GitHub 이슈 / PR 연결
**한 줄 요약**: 칸반 노트에 GitHub 이슈 URL 첨부 → 이슈 상태 자동 동기화

**상세**
- 노트에 `githubIssueUrl` 필드 추가
- GitHub API로 이슈/PR 상태 polling (열림/닫힘/머지)
- 이슈 닫힘 → 노트 자동 완료 이동 (옵션)
- 노트 카드에 이슈 번호 + 상태 뱃지 표시

**재활용 가능한 기존 코드**
- `src/lib/github/` — GitHub 연동 유틸
- `src/lib/auth.ts` — GitHub OAuth 토큰

**구현 파일**
- `src/lib/models/kanban/Note.ts` — `githubIssueUrl` 추가
- `src/app/api/kanban/notes/[noteId]/github-sync/route.ts` (신규)
- `src/components/board/NoteItem.tsx` — 이슈 뱃지 UI

---

#### 7. AI 미팅 노트 → 태스크 변환
**한 줄 요약**: 회의 내용 텍스트 붙여넣기 → 액션 아이템 자동 추출 → 칸반 노트 일괄 생성

**상세**
- 대시보드에 "미팅 노트 변환" 패널 추가
- AI가 액션 아이템, 담당자, 우선순위 추출
- 미리보기 후 선택적 보드 추가

**재활용 가능한 기존 코드**
- `src/app/api/ai/generate-instruction/route.ts`
- `src/store/boardStore.ts` — `addNote` 배치 액션

**구현 파일**
- `src/app/api/ai/meeting-notes/route.ts` (신규)
- `src/components/board/MeetingNotesModal.tsx` (신규)

---

#### 8. 코드 스니펫 노트 타입
**한 줄 요약**: 칸반 노트에 코드 블록 특화 타입 추가 (신택스 하이라이팅 + AI 프롬프트 생성)

**상세**
- 노트 타입: `text` (기존) | `code` (신규) | `link` (신규)
- 코드 타입: 언어 선택 드롭다운 + 신택스 하이라이팅
- "이 코드로 AI 지시 생성" 버튼 → 기존 InstructionModal 연동
- 링크 타입: OG 태그 미리보기 (기존 `/api/utils/og` 재활용)

**재활용 가능한 기존 코드**
- `src/components/board/NoteItem.tsx`
- `src/components/board/InstructionModal.tsx`
- `src/app/api/utils/og/route.ts` — OG 파싱

**구현 파일**
- `src/lib/models/kanban/Note.ts` — `type`, `language` 필드 추가
- `src/components/board/NoteItem.tsx` — 타입별 렌더링 분기
- `src/components/board/CodeNoteView.tsx` (신규)

---

### 🥉 중우선 — UX & 팀워크 개선

---

#### 9. 프로젝트 템플릿
**한 줄 요약**: "SaaS MVP", "모바일 앱" 등 템플릿 선택 → 보드 + 섹션 + 노트 세트 자동 생성

**상세 템플릿 예시**
- `SaaS MVP` — 기획/디자인/프론트/백엔드/배포 섹션
- `모바일 앱` — Android/iOS/공통/QA 섹션
- `오픈소스 라이브러리` — Core/Docs/Tests/CI-CD 섹션
- `해커톤` — 아이디어/프로토타입/발표 섹션

**구현 파일**
- `src/constants/boardTemplates.ts` (신규)
- `src/app/api/projects/[pid]/apply-template/route.ts` (신규)
- `src/components/projects/TemplateSelectModal.tsx` (신규)

---

#### 10. 공개 포트폴리오 페이지
**한 줄 요약**: 프로젝트를 소셜 공유 가능한 읽기 전용 URL로 공개

**상세**
- `/projects/[pid]/showcase` — 비로그인 접근 가능
- 완성된 노트 수, 팀원 프로필, 기술스택 자동 렌더링
- OG 메타태그 + 트위터 카드 지원
- 프로젝트 소유자가 공개/비공개 토글

**구현 파일**
- `src/app/projects/[pid]/showcase/page.tsx` (신규)
- `src/lib/models/Project.ts` — `isPublic` 필드 추가
- `src/app/projects/[pid]/showcase/opengraph-image.tsx` (신규)

---

#### 11. 타임트래킹
**한 줄 요약**: 노트에 작업 타이머 start/stop → 주간 기여 리포트

**상세**
- 노트 카드에 타이머 버튼 추가
- 백그라운드에서도 타이머 유지 (localStorage)
- 주간 리포트: 팀원별 시간 투자 현황
- 노트별 누적 작업시간 표시

**구현 파일**
- `src/lib/models/TimeLog.ts` (신규 모델)
- `src/app/api/timelogs/route.ts` (신규)
- `src/components/board/NoteTimer.tsx` (신규)
- `src/components/dashboard/TimeReportWidget.tsx` (신규)

---

#### 12. 팀 기여 히트맵
**한 줄 요약**: GitHub 스타일 활동 히트맵으로 팀원별 기여도 시각화

**상세**
- 노트 생성/완료/수정 이벤트 기록
- 주차별 활동량 히트맵 (색상 농도)
- 팀원별 필터링
- 대시보드 위젯으로 표시

**구현 파일**
- `src/lib/models/ActivityLog.ts` (신규 모델)
- `src/app/api/activity/route.ts` (신규)
- `src/components/dashboard/ActivityHeatmap.tsx` (신규)

---

#### 13. 배포 URL 트래커
**한 줄 요약**: 프로젝트에 스테이징/프로덕션 URL 등록 + HTTP 상태 체크

**상세**
- 프로젝트 리소스에 `deployment` 타입 추가
- URL ping 체크 (cron or on-demand)
- 대시보드 위젯에 UP/DOWN 상태 표시
- Vercel/Render 웹훅 수신 → 배포 이력

**재활용 가능한 기존 코드**
- `src/lib/models/Project.ts` — resources[] 배열
- `src/components/dashboard/ResourceModal.tsx`

**구현 파일**
- `src/app/api/projects/[pid]/deployments/route.ts` (신규)
- `src/components/dashboard/DeploymentWidget.tsx` (신규)

---

#### 14. 역할 기반 온보딩 태스크 자동 생성
**한 줄 요약**: 새 팀원 승인 시 역할에 맞는 온보딩 노트 자동 생성

**상세**
- 신청 시 입력한 역할(프론트/백엔드/디자인 등) 기반
- 기존 AI 프리셋 활용해 온보딩 체크리스트 생성
- "환경설정", "코드 리뷰", "첫 PR" 등 기본 항목 포함

**재활용 가능한 기존 코드**
- `src/app/api/applications/[appId]/route.ts` — 승인 로직
- `src/app/api/ai/presets/` — 역할별 프리셋

**구현 파일**
- `src/app/api/applications/[appId]/route.ts` — 승인 시 온보딩 트리거 추가
- `src/app/api/ai/onboarding-tasks/route.ts` (신규)

---

#### 15. 코드 리뷰 체크리스트 AI
**한 줄 요약**: 구현한 기능 설명 입력 → AI가 PR 리뷰 체크리스트 생성

**상세**
- 칸반 노트에 "PR 체크리스트 생성" 버튼
- 노트 내용 + 기술스택 기반 체크리스트 생성
- 결과물을 노트에 마크다운으로 첨부

**재활용 가능한 기존 코드**
- `src/app/api/ai/generate-instruction/route.ts`
- `src/store/instructionStore.ts`

**구현 파일**
- `src/app/api/ai/review-checklist/route.ts` (신규)
- `src/components/board/ReviewChecklistButton.tsx` (신규)

---

### 4순위 — 완성도 보강 & 추가 아이디어

---

#### 16. 리뷰 시스템 UI 완성
- 모델(`Review`) + API(`/api/reviews`)는 이미 존재
- 프로필 페이지에 리뷰 목록 표시 컴포넌트만 추가하면 됨
- **파일**: `src/components/profile/ReviewSection.tsx` 완성

#### 17. 마일스톤 셀레브레이션
- 완료율 25% / 50% / 100% 달성 시 팀 전체 알림 + confetti 애니메이션
- **파일**: `src/store/boardStore.ts` — completeNote에 트리거 추가

#### 18. 프로젝트 헬스 스코어
- 보드 활동량 + 마감일 + 멤버 기여도 → AI가 1~100 점수 계산
- 대시보드 상단 위젯으로 표시

#### 19. 보이스 노트
- 모바일에서 음성 녹음 → OpenAI Whisper API → 노트 텍스트 자동 변환
- 빠른 아이디어 캡처용

#### 20. 크로스-섹션 태그 & 필터
- 현재 섹션 기반 구조 외에 크로스-섹션 태그 추가
- 태그로 보드 필터링, 태그별 노트 수 통계
- **파일**: `src/lib/models/kanban/Note.ts` — `tags[]` 추가

#### 21. AI 기술스택 추천
- 프로젝트 생성 시 설명 입력 → AI가 적합한 기술스택 추천
- 기존 TechStack 목록에서 추천 항목 하이라이트

#### 22. Vercel / Render 배포 웹훅
- 웹훅 수신 엔드포인트 추가
- 배포 성공/실패 → Socket.io로 팀 전체 실시간 알림

---

## 구현 우선순위 로드맵

```
Phase A (빠른 승리, 2~3주)
├── 번다운 차트          ← 기존 데이터로 즉시 구현 가능
├── 프로젝트 템플릿       ← 상수 파일 + API 추가만
├── 리뷰 시스템 UI 완성  ← 모델/API 이미 존재
└── 공개 포트폴리오 페이지 ← 새 페이지 추가

Phase B (핵심 AI 기능, 3~4주)
├── AI 프로젝트 킥스타터  ← 바이브코딩 핵심 가치
├── AI 스프린트 플래너
├── AI 미팅 노트 → 태스크 변환
└── 코드 스니펫 노트 타입

Phase C (외부 연동, 4~6주)
├── WBS ↔ 칸반 동기화
├── GitHub 이슈/PR 연결
└── 배포 URL 트래커

Phase D (팀워크 심화, 6주+)
├── 타임트래킹
├── 팀 기여 히트맵
├── 역할 기반 온보딩 태스크
└── AI 데일리 스탠드업 요약
```

---

## 검증 방법

- 각 기능 구현 후 `npm run test:run` 전체 통과 확인
- AI 기능: `src/components/common/AiModelTestPanel.tsx` 로컬 테스트
- 실시간 기능: 로컬 Socket.io 멀티 탭 연결 테스트
- 새 API: `src/app/api/MAP.md` 업데이트

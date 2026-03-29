---
name: spm-start
description: >
  Side Project Mate 작업 시작 커맨드.
  `/spm-start [작업내용]` 형태로 호출하면 GitHub 이슈 생성, 브랜치 생성,
  .workzones.yml 등록, 관련 MAP.md + 최근 work-logs 로딩을 한 번에 수행합니다.
  인자 없이 호출하면 대화형으로 작업 유형을 선택합니다.
  sideProjectMate 프로젝트에서 모든 작업 시작 시 항상 이 커맨드를 먼저 실행하세요.
---

# spm-start — 작업 시작 커맨드

이 스킬은 `/spm-start [작업내용]` 형태로 호출됩니다.
인자 없이 `/spm-start`만 호출하면 대화형으로 진행합니다.

> **워크존 역할 안내**: `.workzones.yml`은 팀 간 공유용이 아닌 **로컬 AI 컨텍스트 로딩 전용**입니다.
> 팀원 간 작업 범위 파악은 GitHub 이슈 + 브랜치로 대체합니다.

---

## 0단계: GitHub CLI 인증 확인

가장 먼저 `gh` CLI 인증 상태를 확인합니다:

```bash
gh auth status
```

- **인증됨**: 바로 다음 단계 진행
- **미인증**: 아래 안내 출력 후 중단

```
⚠️ GitHub CLI 인증이 필요합니다.

아래 명령어를 실행해 인증해주세요:
  gh auth login

인증 완료 후 /spm-start를 다시 실행하세요.
```

---

## 1단계: 미종료 작업 감지

아래 두 조건 중 하나라도 해당되면 미종료 작업으로 판단합니다:

```bash
git rev-parse --abbrev-ref HEAD   # main/master가 아닌 경우
```

또는 `.workzones.yml`에 `status: active` 또는 `status: locked` 항목이 있는 경우.

**미종료 작업 감지 시:**

```
⚠️ 종료되지 않은 작업이 있습니다.

브랜치: [현재 브랜치명]
마지막 커밋: [날짜] "[커밋 메시지]"

어떻게 할까요?
1. 지금 이전 작업 종료하기 (/spm-done 실행)
2. 이전 작업 보류하고 새 작업 시작
3. 이전 작업 강제 종료 (work-log 미생성 경고 후 진행)
```

각 선택지 처리:

- **[1 선택]** → `/spm-done` 플로우 실행 후 새 작업 시작
- **[2 선택]** → `.workzones.yml`에 `status: "paused"` 기록 후 새 작업 시작
- **[3 선택]** → 워크존만 해제, work-log 미생성 경고 표시 후 진행

---

## 2단계: 작업 유형 선택

인자가 없으면 아래 선택지를 제시합니다.
인자가 있으면 내용을 분석해 feature/fix 중 적절한 유형을 자동 판단하고, 사용자에게 확인합니다.

```
어떤 작업을 시작할까요?

1. 신규 기능 개발 (feature)
2. 버그 수정 (fix)
3. 기존 이슈 이어받기

선택해주세요 (1/2/3):
```

---

### [1. feature 선택 시]

**a. 계획서 파일 확인**

```
docs/plans/ 에 관련 계획서 파일이 있나요? (있으면 파일명, 없으면 엔터)
```

- **있음**: 해당 파일을 읽고 이슈 제목/본문 초안 작성
- **없음**: 작업 내용을 자연어로 받아 이슈 초안 작성

AI가 이슈 초안을 작성한 뒤 사용자에게 미리보기 및 확인 요청:

```
📝 GitHub 이슈 초안:
─────────────────────────────
제목: [이슈 제목]
본문:
[이슈 본문]
라벨: enhancement
─────────────────────────────
이대로 이슈를 생성할까요? (수정이 필요하면 내용을 알려주세요)
```

확인 후 이슈 생성:

```bash
gh issue create --title "[제목]" --body "[본문]" --label "enhancement"
```

출력에서 이슈 번호를 추출합니다 (예: `#180`).

**b. 브랜치 생성 및 checkout**

이슈 제목에서 영문 슬러그를 생성합니다 (예: "칸반보드 개선" → `kanban-improve`):

```bash
git checkout -b feature/[이슈번호]-[슬러그]
git push -u origin feature/[이슈번호]-[슬러그]
```

---

### [2. fix 선택 시]

버그 내용을 한 줄로 입력받습니다.

AI가 이슈 초안 작성 후 확인:

```
📝 GitHub 이슈 초안:
─────────────────────────────
제목: fix: [버그 내용]
라벨: bug
─────────────────────────────
이대로 이슈를 생성할까요?
```

확인 후 이슈 생성:

```bash
gh issue create --title "fix: [버그 내용]" --body "[버그 상세 설명]" --label "bug"
```

브랜치 생성:

```bash
git checkout -b fix/[이슈번호]-[슬러그]
git push -u origin fix/[이슈번호]-[슬러그]
```

---

### [3. 기존 이슈 이어받기 선택 시]

오픈 이슈 목록 조회:

```bash
gh issue list --state open --json number,title,assignees --limit 20
```

목록을 표시하고 번호 선택을 받습니다:

```
오픈 이슈 목록:
#182 칸반 성능 개선 (담당자: 없음)
#181 채팅 알림 버그 (담당자: kimis)
#180 SPM 스킬 개선 (담당자: caant)

이어받을 이슈 번호를 입력하세요:
```

선택한 이슈의 기존 브랜치가 있으면 checkout, 없으면 새로 생성:

```bash
# 기존 브랜치 확인
gh issue view [번호] --json headRefName

# 있으면
git checkout [브랜치명]
git pull

# 없으면
git checkout -b feature/[이슈번호]-[슬러그]
git push -u origin feature/[이슈번호]-[슬러그]
```

---

## 3단계: 도메인 감지 및 파일 경로 매핑

이슈 제목/내용 또는 인자에서 키워드를 감지해 관련 파일 경로를 결정합니다.

| 키워드                                | 잠금 경로                                                                 | 읽을 MAP.md                   |
| ------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| 칸반, 보드, kanban, board, 노트, 섹션 | `src/app/api/kanban/`, `src/store/boardStore.ts`, `src/components/board/` | `src/app/api/kanban/MAP.md`   |
| WBS, 간트, 태스크, task, gantt        | `src/app/api/wbs/`, `src/store/wbsStore.ts`, `src/components/wbs/`        | `src/app/api/wbs/MAP.md`      |
| 채팅, chat, 메시지                    | `src/app/api/chat/`, `src/components/chat/`                               | `src/app/api/chat/MAP.md`     |
| 프로젝트, project                     | `src/app/api/projects/`, `src/components/projects/`                       | `src/app/api/projects/MAP.md` |
| 유저, 프로필, user, profile           | `src/app/api/users/`, `src/components/profile/`                           | `src/app/api/users/MAP.md`    |
| 어드민, admin                         | `src/app/api/admin/`                                                      | `src/app/api/MAP.md`          |
| 스토어, store, 상태                   | `src/store/`                                                              | `src/store/MAP.md`            |
| 모델, model                           | `src/lib/models/`                                                         | `src/lib/models/MAP.md`       |
| 인증, auth, 로그인                    | `src/app/api/auth/`                                                       | `src/app/api/MAP.md`          |

도메인을 특정하기 어려우면 `src/app/api/MAP.md`를 읽고 사용자에게 확인하세요.

---

## 4단계: 팀원 충돌 감지

내 작업 도메인 키워드로 오픈 이슈를 필터링합니다 (이미 조회한 목록 재활용):

- 같은 도메인 키워드를 포함한 이슈가 있고, 담당자가 있으면 한 줄 경고 출력:

```
⚠️ 주의: [담당자]가 이슈 #[번호] ([이슈 제목])로 같은 도메인 작업 중입니다.
```

- 없으면 이 줄은 생략합니다.

---

## 5단계: .workzones.yml 업데이트

`git config user.name`으로 작업자 이름을 가져옵니다. 실패하면 `git config user.email`을 사용합니다.

오늘 날짜에서 7일 후를 만료일로 설정합니다.

현재 `.workzones.yml`의 `zones:` 배열에 항목을 추가합니다.
이미 같은 작업자의 항목이 있으면 교체합니다.

```yaml
- path: '감지된/경로'
  owner: '작업자이름'
  status: 'active'
  reason: '이슈 제목 또는 사용자가 입력한 작업내용'
  expires: 'YYYY-MM-DD'
```

---

## 6단계: CLAUDE.md 진행 현황 표 업데이트

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 해당 작업자의 기존 행을 교체하거나, 없으면 새로 추가합니다.

```markdown
| src/app/api/kanban/ | [작업자] | 🟡 작업 중 | [이슈 제목] |
```

"현재 작업 중인 항목 없음" 행은 실제 항목이 추가되면 제거합니다.

---

## 7단계: 컨텍스트 로딩

다음 파일들을 순서대로 읽습니다:

1. 감지된 도메인의 `MAP.md`
2. `work-logs/` 디렉토리에서 가장 최근 파일 3개 (파일명 기준 내림차순)

`work-logs/`에 파일이 없으면 건너뜁니다.

---

## 8단계: 요약 출력

```
✅ SPM 세션 시작
─────────────────────────────
📌 이슈: #[번호] [이슈 제목]
👤 작업자: [이름]
🌿 브랜치: [브랜치명]
📁 잠금 구역:
   - src/app/api/kanban/
   - src/store/boardStore.ts
📅 만료: YYYY-MM-DD
─────────────────────────────
📖 로드된 컨텍스트:
   - src/app/api/kanban/MAP.md ✓
   - work-logs/2026-03-28-HJ-abc1234.md ✓
─────────────────────────────
⚠️ [충돌 경고가 있으면 여기에 표시, 없으면 이 줄 생략]
이제 작업을 시작하세요!
```

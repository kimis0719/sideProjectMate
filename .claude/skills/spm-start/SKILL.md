---
name: spm-start
description: >
  Side Project Mate 작업 시작 커맨드.
  `/spm-start [SPM-번호] [작업내용]` 형태로 호출하면 Linear 이슈 기반 브랜치 생성,
  .workzones.yml 등록, 관련 MAP.md + 최근 work-logs 로딩을 한 번에 수행합니다.
  인자 없이 호출하면 대화형으로 작업 유형을 선택합니다.
  sideProjectMate 프로젝트에서 모든 작업 시작 시 항상 이 커맨드를 먼저 실행하세요.
---

# spm-start — 작업 시작 커맨드

이 스킬은 `/spm-start [SPM-번호] [작업내용]` 형태로 호출됩니다.
인자 없이 `/spm-start`만 호출하면 대화형으로 진행합니다.

> **이슈 관리**: 이슈는 **Linear**에서 생성·관리합니다 (팀 식별자: `SPM`).
> 개발자는 Linear에서 이슈를 확인한 뒤, 이 커맨드로 작업을 시작합니다.
> **워크존 역할 안내**: `.workzones.yml`은 팀 간 공유용이 아닌 **로컬 AI 컨텍스트 로딩 전용**입니다.
> 팀원 간 작업 범위 파악은 Linear 이슈 + 브랜치로 대체합니다.

---

## 0단계: GitHub CLI 인증 확인

브랜치 push 및 PR 생성을 위해 `gh` CLI 인증 상태를 확인합니다:

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

브랜치명과 마지막 커밋 정보를 출력한 뒤, `AskUserQuestion` 도구로 선택지를 제시합니다:

- question: "종료되지 않은 작업이 있습니다 ([브랜치명], 마지막 커밋: [메시지]). 어떻게 할까요?"
- header: "이전 작업"
- options:
  - label: "지금 종료하기", description: "/spm-done을 실행하고 새 작업을 시작합니다"
  - label: "보류하고 시작", description: "이전 작업을 paused 상태로 두고 새 작업을 시작합니다"
  - label: "강제 종료", description: "work-log 없이 워크존만 해제하고 진행합니다 (기록 유실 위험)"

각 선택지 처리:

- **[지금 종료하기]** → `/spm-done` 플로우 실행 후 새 작업 시작
- **[보류하고 시작]** → `.workzones.yml`에 `status: "paused"` 기록 후 새 작업 시작
- **[강제 종료]** → 워크존만 해제, work-log 미생성 경고 표시 후 진행

---

## 2단계: 작업 유형 선택

`AskUserQuestion` 도구로 선택지를 제시합니다.

- question: "어떤 작업을 시작할까요?"
- header: "작업 유형"
- options:
  - label: "Linear 이슈로 새 작업 시작 (Recommended)", description: "Linear 이슈 ID를 입력 → 브랜치 생성"
  - label: "새 Linear 이슈 생성 후 시작", description: "대화 내용을 기반으로 Linear 이슈를 생성하고 바로 작업을 시작합니다"
  - label: "기존 브랜치 이어받기", description: "이미 생성된 SPM 브랜치에서 작업을 이어받습니다"

인자가 `SPM-` 접두사로 시작하면 자동으로 "Linear 이슈로 새 작업 시작"을 선택하고 이슈 ID를 파싱합니다.
(예: `/spm-start SPM-42 칸반보드 드래그앤드롭 개선`)

---

### [1. Linear 이슈로 새 작업 시작]

**a. Linear 이슈 ID 입력**

인자에서 `SPM-` 접두사가 포함된 이슈 ID를 추출합니다.
인자가 없거나 이슈 ID가 없으면 `AskUserQuestion` 도구로 입력을 요청합니다:

- question: "Linear 이슈 ID를 입력해주세요 (예: SPM-42)"
- header: "Linear 이슈"

입력값에서 `SPM-[숫자]` 패턴을 추출합니다. 유효하지 않으면 다시 요청합니다.

**b. 작업 내용 확인**

인자에 이슈 ID 외 추가 텍스트가 있으면 이를 작업 내용(이슈 제목)으로 사용합니다.
없으면 `AskUserQuestion` 도구로 작업 내용을 간략히 입력받습니다:

- question: "이 이슈의 작업 내용을 한 줄로 요약해주세요 (브랜치명 슬러그 생성에 사용됩니다)"
- header: "작업 내용"

**c. 작업 유형 결정**

`AskUserQuestion` 도구로 선택지를 제시합니다:

- question: "작업 유형을 선택해주세요."
- header: "브랜치 유형"
- options:
  - label: "기능 개발 (feature)", description: "feature/SPM-[번호]-[slug] 브랜치 생성"
  - label: "버그 수정 (fix)", description: "fix/SPM-[번호]-[slug] 브랜치 생성"

작업 내용에 "fix", "버그", "수정", "오류", "에러" 등이 포함되면 "버그 수정"을 Recommended로 표시합니다.
그 외에는 "기능 개발"을 Recommended로 표시합니다.

**d. 계획서 파일 확인 (기능 개발 시)**

`AskUserQuestion` 도구로 선택지를 제시합니다:

- question: "관련 계획서 파일이 docs/plans/에 있나요?"
- header: "계획서"
- options:
  - label: "있음", description: "파일을 선택하면 AI가 읽고 컨텍스트를 로딩합니다"
  - label: "없음 (Recommended)", description: "계획서 없이 진행합니다"

**있음** 선택 시: `docs/plans/` 파일 목록을 보여주고 선택받습니다 (AskUserQuestion, 최대 4개, 초과 시 번호 직접 입력).

**e. 브랜치 생성 및 checkout**

작업 내용에서 영문 슬러그를 생성합니다 (예: "칸반보드 드래그앤드롭 개선" → `kanban-drag-drop`):

```bash
# feature 선택 시
git checkout -b feature/SPM-[번호]-[슬러그]
git push -u origin feature/SPM-[번호]-[슬러그]

# fix 선택 시
git checkout -b fix/SPM-[번호]-[슬러그]
git push -u origin fix/SPM-[번호]-[슬러그]
```

---

### [2. 새 Linear 이슈 생성 후 시작]

대화 내용을 기반으로 Linear 이슈를 직접 생성하고, 바로 작업을 시작합니다.

**a. 작업 내용 입력**

인자에 작업 내용이 있으면 사용하고, 없으면 `AskUserQuestion` 도구로 입력받습니다:

- question: "생성할 이슈의 작업 내용을 설명해주세요."
- header: "새 이슈"

**b. 작업 유형 결정**

`AskUserQuestion` 도구로 선택지를 제시합니다:

- question: "작업 유형을 선택해주세요."
- header: "브랜치 유형"
- options:
  - label: "기능 개발 (feature)", description: "feature/SPM-[번호]-[slug] 브랜치 생성"
  - label: "버그 수정 (fix)", description: "fix/SPM-[번호]-[slug] 브랜치 생성"

작업 내용에 "fix", "버그", "수정", "오류", "에러" 등이 포함되면 "버그 수정"을 Recommended로 표시합니다.
그 외에는 "기능 개발"을 Recommended로 표시합니다.

**c. 이슈 초안 작성 및 확인**

AI가 작업 내용을 분석하여 이슈 제목과 본문 초안을 작성합니다.
`AskUserQuestion` 도구로 확인을 요청합니다:

- question: "Linear 이슈 초안을 확인해주세요.\n제목: [이슈 제목]"
- header: "이슈 확인"
- options:
  - label: "이대로 생성 (Recommended)", description: "Linear에 이슈를 생성합니다"
  - label: "수정 후 생성", description: "Other를 선택해 수정할 내용을 입력하세요"
- preview 활용: 이슈 본문 전체를 preview 필드에 표시

**d. Linear MCP로 이슈 생성**

`mcp__claude_ai_Linear__save_issue` 도구로 이슈를 생성합니다:

- team: "Sideprojectmate"
- title: [확정된 이슈 제목]
- description: [확정된 이슈 본문 (Markdown)]
- labels: 버그 수정 시 ["Bug"], 기능 개발 시 ["Feature"] (라벨이 존재하는 경우)
- assignee: "me"
- priority: 3 (Normal, 사용자가 별도 지정하지 않은 경우)

응답에서 이슈 ID(`SPM-[번호]`)를 추출합니다.

**e. 브랜치 생성 및 checkout**

이슈 제목에서 영문 슬러그를 생성합니다:

```bash
# feature 선택 시
git checkout -b feature/SPM-[번호]-[슬러그]
git push -u origin feature/SPM-[번호]-[슬러그]

# fix 선택 시
git checkout -b fix/SPM-[번호]-[슬러그]
git push -u origin fix/SPM-[번호]-[슬러그]
```

이후 3단계(도메인 감지)부터는 [1. Linear 이슈로 새 작업 시작]과 동일하게 진행합니다.

---

### [3. 기존 브랜치 이어받기]

원격 브랜치 중 `SPM-` 패턴이 포함된 브랜치를 조회합니다:

```bash
git fetch origin
git branch -r --list "origin/feature/SPM-*" --list "origin/fix/SPM-*"
```

목록을 표시하고 `AskUserQuestion`으로 선택을 받습니다:

```
이어받을 브랜치를 선택하세요:
1. feature/SPM-42-kanban-drag-drop
2. fix/SPM-38-chat-notification-bug
3. feature/SPM-35-dashboard-widget
```

선택한 브랜치를 checkout합니다:

```bash
git checkout [브랜치명]
git pull
```

브랜치명에서 `SPM-[번호]`를 추출하여 이후 단계에서 사용합니다.

---

## 3단계: 도메인 감지 및 파일 경로 매핑

이슈 작업 내용 또는 인자에서 키워드를 감지해 관련 파일 경로를 결정합니다.

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

원격 브랜치 중 같은 도메인 키워드를 포함하고 현재 활성 상태인 브랜치가 있는지 확인합니다:

```bash
git branch -r --list "origin/feature/SPM-*" --list "origin/fix/SPM-*"
```

같은 도메인 키워드를 포함한 다른 팀원의 활성 브랜치가 있으면 한 줄 경고 출력:

```
⚠️ 주의: 브랜치 [브랜치명]이 같은 도메인에서 작업 중입니다.
```

없으면 이 줄은 생략합니다.

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
  reason: 'SPM-[번호] 작업 내용'
  expires: 'YYYY-MM-DD'
```

---

## 6단계: CLAUDE.md 진행 현황 표 업데이트

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 해당 작업자의 기존 행을 교체하거나, 없으면 새로 추가합니다.

```markdown
| src/app/api/kanban/ | [작업자] | 🟡 작업 중 | SPM-[번호] [작업 내용] |
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
📌 Linear 이슈: SPM-[번호] [작업 내용]
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

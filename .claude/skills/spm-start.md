---
name: spm-start
description: >
  Side Project Mate 작업 시작 커맨드.
  `/spm-start [작업내용]` 형태로 호출하면 .workzones.yml에 작업 구역을 자동 등록하고,
  관련 MAP.md와 최근 work-logs를 불러와 AI 세션 컨텍스트를 한 번에 준비합니다.
  sideProjectMate 프로젝트에서 모든 작업 시작 시 항상 이 커맨드를 먼저 실행하세요.
---

# spm-start — 작업 시작 커맨드

이 스킬은 `/spm-start [작업내용]` 형태로 호출됩니다.
인자 없이 `/spm-start`만 호출하면 대화형으로 진행합니다.

목표는 세 가지입니다.

1. `.workzones.yml`에 작업 구역을 등록해서 **로컬 AI 컨텍스트**를 관리한다.
2. 해당 도메인의 MAP.md + 최근 work-logs를 자동으로 로드해서 세션 컨텍스트를 준비한다.
3. GitHub 오픈 이슈를 확인해 내 작업 도메인과 겹치는 팀원 작업을 감지해 알린다.

> **워크존 역할 안내**: `.workzones.yml`은 팀 간 공유용이 아닌 **로컬 AI 컨텍스트 로딩 전용**입니다.
> 팀원 간 작업 범위 파악은 GitHub 이슈 + 브랜치로 대체합니다.

---

## 0단계: 미종료 작업 감지

작업 시작 전, 아래 두 조건 중 하나라도 해당되면 미종료 작업으로 판단합니다:

```
1. 현재 로컬 브랜치가 main/master가 아닌 경우
2. .workzones.yml에 active/locked 항목이 남아있는 경우
```

미종료 작업 감지 시 아래 안내를 출력하고 선택을 기다립니다:

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

## 1단계: 도메인 감지 및 파일 경로 매핑

인자에서 키워드를 감지해 관련 파일 경로를 결정합니다.
여러 도메인이 동시에 언급되면 모두 포함하세요.

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

## 2단계: 충돌 검사 (워크존 + GitHub 이슈)

### 로컬 워크존 확인

`.workzones.yml`을 읽고 현재 `status: locked` 또는 `status: active`인 구역과 겹치는지 확인합니다.
겹치는 구역이 있으면 작업을 막지는 않되, 반드시 사용자에게 알려주세요:

```
⚠️ 충돌 경고: src/store/boardStore.ts
   현재 [담당자]가 "[사유]"로 작업 중입니다.
   계속 진행하시겠습니까?
```

### GitHub 이슈 확인 (PAT 설정 시)

`.env.local`에 `GITHUB_ACCESS_TOKEN`이 있는 경우:

```bash
gh issue list --state open --json number,title,assignees
```

내 작업 도메인 키워드와 겹치는 오픈 이슈를 필터링합니다.
겹치는 이슈가 있을 경우에만 한 줄 주의사항을 출력합니다:

```
⚠️ 주의: [담당자]가 이슈 #[번호] ([이슈 제목])로 같은 도메인 작업 중입니다.
```

PAT 미설정 시: GitHub 이슈 확인 단계를 건너뜁니다 (에러 없이 조용히 스킵).

---

## 3단계: .workzones.yml 업데이트

`git config user.name`으로 작업자 이름을 가져옵니다. 실패하면 `git config user.email`을 사용합니다.

오늘 날짜에서 7일 후를 만료일로 설정합니다.

현재 `.workzones.yml`의 `zones:` 배열에 항목을 추가하세요.
이미 같은 작업자의 항목이 있으면 교체합니다.

```yaml
- path: '감지된/경로'
  owner: '작업자이름'
  status: 'active'
  reason: '사용자가 입력한 작업내용'
  expires: 'YYYY-MM-DD'
```

여러 경로가 있으면 각각 별도 항목으로 추가합니다.

---

## 4단계: CLAUDE.md 진행 현황 표 업데이트

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 해당 작업자의 기존 행을 찾아 교체하거나, 없으면 새로 추가합니다.

```markdown
| src/app/api/kanban/ | [작업자] | 🟡 작업 중 | [작업내용 요약] |
```

"현재 작업 중인 항목 없음" 행은 실제 항목이 추가되면 제거하세요.

---

## 5단계: 컨텍스트 로딩

다음 파일들을 순서대로 읽습니다:

1. 감지된 도메인의 `MAP.md`
2. `work-logs/` 디렉토리에서 가장 최근 파일 3개 (파일명 기준 내림차순)

`work-logs/`에 파일이 없으면 건너뜁니다.

---

## 6단계: 요약 출력

아래 형식으로 완료 요약을 출력합니다:

```
✅ SPM 세션 시작
─────────────────────────────
📌 작업: [사용자 입력 내용]
👤 작업자: [이름]
📁 잠금 구역:
   - src/app/api/kanban/
   - src/store/boardStore.ts
   - src/components/board/
📅 만료: YYYY-MM-DD
─────────────────────────────
📖 로드된 컨텍스트:
   - src/app/api/kanban/MAP.md ✓
   - work-logs/2026-03-28-HJ-abc1234.md ✓
   - work-logs/2026-03-27-YJ-def5678.md ✓
─────────────────────────────
⚠️ [충돌이 있으면 여기에 표시, 없으면 이 줄 생략]
이제 작업을 시작하세요!
```

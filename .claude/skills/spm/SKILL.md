---
name: spm
description: >
  Side Project Mate 프로젝트 전용 작업 시작/종료 커맨드.
  `/spm [작업내용]` 형태로 호출하면 .workzones.yml에 작업 구역을 자동 등록하고,
  관련 MAP.md와 최근 work-logs를 불러와 AI 세션 컨텍스트를 한 번에 준비합니다.
  `/spm 작업 종료`로 호출하면 본인 구역을 자동 해제하고 work-log를 자동 생성합니다.
  sideProjectMate 프로젝트에서 기능 개발, 버그 수정, 리팩토링 등
  모든 작업 시작 시 항상 이 커맨드를 먼저 실행하세요.
---

# SPM — 작업 시작/종료 커맨드

이 스킬은 `/spm [작업내용]` 또는 `/spm 작업 종료`로 호출됩니다.

목표는 세 가지입니다.

1. `.workzones.yml`에 작업 구역을 등록해서 팀원 간 충돌을 방지한다.
2. 해당 도메인의 MAP.md + 최근 work-logs를 자동으로 로드해서 세션 컨텍스트를 준비한다.
3. 작업 종료 시 git diff를 분석해 `work-logs/`에 작업 기록을 자동 생성한다.

---

## 1단계: 작업 종료 여부 확인

인자에 "종료", "끝", "완료", "done", "finish" 등이 포함되어 있으면 **작업 종료 플로우**로 이동하세요 (아래 섹션 참조).
그 외에는 **작업 시작 플로우**를 진행합니다.

---

## 2단계: 도메인 감지 및 파일 경로 매핑

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

## 3단계: 충돌 검사

`.workzones.yml`을 읽고 현재 `status: locked`인 구역과 겹치는지 확인합니다.

겹치는 구역이 있으면 작업을 막지는 않되, 반드시 사용자에게 알려주세요:

```
⚠️ 충돌 경고: src/store/boardStore.ts
   현재 [담당자]가 "[사유]"로 작업 중입니다.
   계속 진행하시겠습니까?
```

---

## 4단계: .workzones.yml 업데이트

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

## 5단계: CLAUDE.md 진행 현황 표 업데이트

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 해당 작업자의 기존 행을 찾아 교체하거나, 없으면 새로 추가합니다.

```markdown
| src/app/api/kanban/ | [작업자] | 🟡 작업 중 | [작업내용 요약] |
```

"현재 작업 중인 항목 없음" 행은 실제 항목이 추가되면 제거하세요.

---

## 6단계: 컨텍스트 로딩

다음 파일들을 순서대로 읽습니다:

1. 감지된 도메인의 `MAP.md`
2. `work-logs/` 디렉토리에서 가장 최근 파일 3개 (파일명 기준 내림차순)

`work-logs/`에 파일이 없으면 건너뜁니다.

---

## 7단계: 요약 출력

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

---

## 작업 종료 플로우

`/spm 작업 종료` 또는 유사한 표현으로 호출된 경우 아래 순서로 실행합니다.

### 종료 1단계: 작업자 및 브랜치 정보 수집

다음 명령어를 실행해 정보를 수집합니다:

```bash
git config user.name          # 작업자 이름
git rev-parse --short HEAD    # 현재 커밋 SHA (7자리)
git rev-parse --abbrev-ref HEAD  # 현재 브랜치명
```

### 종료 2단계: git diff로 변경사항 수집

main 브랜치와의 전체 diff를 가져옵니다:

```bash
git diff origin/main...HEAD --name-only   # 변경된 파일 목록
git diff origin/main...HEAD --stat        # 변경 통계 (삽입/삭제 줄 수)
```

`origin/main`이 없으면 `main`을 기준으로 시도합니다.
변경된 파일이 없으면 work-log 생성을 건너뛰고 종료 메시지만 출력합니다.

### 종료 3단계: work-log 파일 생성

수집한 git diff 정보를 바탕으로 아래 형식의 work-log를 작성하고
`work-logs/YYYY-MM-DD-[작업자명]-[SHA].md` 경로에 저장합니다.

파일명 예시: `work-logs/2026-03-28-HJ-a1b2c3d.md`

```markdown
## YYYY-MM-DD — [작업자] ([브랜치명]) `[SHA]`

> 모델: claude (spm 스킬 자동생성)

## 작업 요약

(변경된 파일과 작업 내용을 바탕으로 한 줄 요약)

## 변경된 파일

- `파일경로` — 변경 내용 한 줄 설명

## 미완성 / 다음 세션에서 이어받을 부분

없음 (또는 실제 미완성 내용)

## 건드리면 안 되는 부분

없음 (또는 주의사항)
```

파일을 작성할 때 `work-logs/` 디렉토리가 없으면 먼저 생성합니다.

### 종료 4단계: .workzones.yml 정리

`.workzones.yml`에서 현재 작업자(`owner`)에 해당하는 모든 항목을 제거합니다.
남은 항목이 없으면 `zones: []`로 설정합니다.

### 종료 5단계: CLAUDE.md 현황 표 복원

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 현재 작업자의 행을 삭제합니다.
표에 남은 항목이 없으면 기본 행을 복원합니다:

```markdown
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
```

### 종료 6단계: 완료 메시지 출력

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
🗑️ 제거된 구역:
   - src/app/api/kanban/
   - src/store/boardStore.ts
📝 work-log 생성 완료:
   - work-logs/2026-03-28-HJ-a1b2c3d.md
─────────────────────────────
변경된 파일을 커밋하고 PR을 올려주세요.
```

변경된 파일이 없어 work-log를 생성하지 않은 경우:

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
📝 변경된 파일이 없어 work-log를 생성하지 않았습니다.
─────────────────────────────
```

---
name: spm-done
description: >
  Side Project Mate 작업 종료 커맨드.
  `/spm-done` 호출 시 최종 테스트 검증 후 work-log를 생성하고,
  관련 문서를 자동 갱신하며 .workzones.yml 구역을 해제합니다.
  sideProjectMate 프로젝트에서 작업 완료 시 항상 이 커맨드로 종료하세요.
---

# spm-done — 작업 종료 커맨드

이 스킬은 `/spm-done` 형태로 호출됩니다.

---

## 1단계: 작업자 및 브랜치 정보 수집

```bash
git config user.name             # 작업자 이름
git rev-parse --short HEAD       # 현재 커밋 SHA (7자리)
git rev-parse --abbrev-ref HEAD  # 현재 브랜치명
```

---

## 2단계: 최종 테스트 실행 (TODO-005)

```bash
npm run test:run
```

- **전체 통과 시**: 다음 단계 진행
- **실패 시**: 종료 불가, 아래 안내 출력 후 중단

```
❌ 테스트 실패 — 작업 종료가 중단되었습니다.
실패한 테스트를 수정한 후 /spm-done을 다시 실행하세요.
```

---

## 3단계: TypeScript 타입 체크

```bash
npx tsc --noEmit
```

- **통과**: 다음 단계 진행
- **실패**: 에러를 분석하고 수정 후 재실행 (최대 2회 재시도)
- **2회 재시도 후에도 실패**: 종료 중단, 아래 안내 출력 후 중단

```
❌ 타입 체크 실패 — 작업 종료가 중단되었습니다.
타입 에러를 수정한 후 /spm-done을 다시 실행하세요.
```

---

## 4단계: git diff로 변경사항 수집

main 브랜치와의 전체 diff를 가져옵니다:

```bash
git diff origin/main...HEAD --name-only   # 변경된 파일 목록
git diff origin/main...HEAD --stat        # 변경 통계
```

`origin/main`이 없으면 `main`을 기준으로 시도합니다.
변경된 파일이 없으면 work-log 생성을 건너뜁니다.

---

## 5단계: "건드리면 안 되는 부분" 감지 및 확인 (TODO-008)

변경된 파일을 분석해 아래 기준에 해당하는 코드를 자동 감지합니다:

- 다른 로직과 강하게 결합된 코드 (예: 이벤트 핸들러가 여러 스토어에 의존)
- 성능 최적화 목적의 캐시/ref 구조 (예: `useRef`, `useMemo`, `cache` 패턴)
- 실시간 동기화(Socket) 관련 로직
- Undo/Redo 히스토리 관련 로직

감지 결과를 표 형식 초안으로 작성한 뒤 `AskUserQuestion` 도구로 확인을 요청합니다:

- question: "건드리면 안 되는 부분 초안을 확인해주세요."
- header: "주의 항목"
- options:
  - label: "확정 (Recommended)", description: "초안 내용을 work-log에 반영합니다"
  - label: "수정·추가", description: "Other를 선택해 수정하거나 추가할 항목을 입력하세요"
- preview 활용: 감지된 표 초안을 preview 필드에 표시 (항목 없으면 "없음")

사용자 확인 후 내용을 확정합니다. 항목이 없어도 "없음"으로 반드시 명시합니다.

---

## 6단계: work-log 파일 생성

확정된 내용을 바탕으로 work-log를 작성하고
`work-logs/YYYY-MM-DD-[작업자명]-[SHA].md` 경로에 저장합니다.

```markdown
## YYYY-MM-DD — [작업자] ([브랜치명]) `[SHA]`

> 모델: claude (spm-done 자동생성)

## 작업 요약

(변경된 파일과 작업 내용을 바탕으로 한 줄 요약)

## 변경된 파일

- `파일경로` — 변경 내용 한 줄 설명

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: N passed / N failed
- 신규 추가 테스트: N개 (파일명 목록)
- 미작성 테스트 및 사유: (없으면 "없음")

## 건드리면 안 되는 부분

| 파일   | 위치        | 이유 |
| ------ | ----------- | ---- |
| 파일명 | 함수/변수명 | 이유 |

## 미완성 / 다음 세션에서 이어받을 부분

없음 (또는 실제 미완성 내용)
```

`work-logs/` 디렉토리가 없으면 먼저 생성합니다.

---

## 7단계: 프로젝트 문서 자동 갱신 (TODO-010)

이번 작업에서 추가/수정/삭제된 파일을 감지해 아래 문서를 갱신합니다.

### PROJECT_INDEX.md 갱신

```
→ 새 라우트 추가 시: Pages 섹션 업데이트
→ 새 API 엔드포인트 추가 시: API Routes 섹션 업데이트
→ 새 Mongoose 모델/필드 추가 시: Models 섹션 업데이트
→ Zustand 스토어 변경 시: Stores 섹션 업데이트
→ 새 유틸 추가 시: Utility Modules 섹션 업데이트
→ Generated 날짜 갱신
```

### CLAUDE.md 갱신

```
→ 새로 추가된 도메인이 있으면 "작업 유형별 추가 로딩" 표 업데이트
→ 새 API 패턴이 생겼으면 "API Route 필수 패턴" 업데이트
→ "현재 진행 중인 작업 현황" 표 복원 (기존 동작 유지)
```

### 해당 도메인 MAP.md 갱신

```
→ 작업 도메인의 MAP.md에 새 파일/함수/엔드포인트 반영
   (예: 칸반 작업 시 src/app/api/kanban/MAP.md 갱신)
```

---

## 8단계: .workzones.yml 정리

`.workzones.yml`에서 현재 작업자(`owner`)에 해당하는 모든 항목을 제거합니다.
남은 항목이 없으면 `zones: []`로 설정합니다.

---

## 9단계: CLAUDE.md 현황 표 복원

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 현재 작업자의 행을 삭제합니다.
표에 남은 항목이 없으면 기본 행을 복원합니다:

```markdown
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
```

---

## 10단계: 코드 커밋 & 코드 PR 생성

현재 feature 브랜치에서 **코드 변경분만** 커밋하고 푸시합니다.
work-log, CLAUDE.md, MAP.md 등 문서 변경은 이 커밋에 **포함하지 않습니다**.

현재 브랜치와 연결된 Linear 이슈 ID를 브랜치명에서 추출합니다 (예: `feature/SPM-42-kanban-improve` → `SPM-42`).

```bash
git add [코드 변경 파일만]
git commit -m "[type]: [메시지] (SPM-[번호])"
git push
```

이어서 코드 PR을 생성합니다.
PR 제목에 `(SPM-[번호])`를, PR 본문 마지막에 `Linear: SPM-[번호]`를 포함하여 Linear ↔ GitHub 자동 연동을 활성화합니다.

`AskUserQuestion` 도구로 PR 초안 확인을 요청합니다:

- question: "PR 초안을 확인해주세요."
- header: "PR 확인"
- options:
  - label: "이대로 생성 (Recommended)", description: "PR을 생성합니다. 테스트 서버 검증 후 수동 머지해주세요."
  - label: "수정 후 생성", description: "Other를 선택해 수정할 내용을 입력하세요"
- preview 활용: PR 제목 + 본문 전체를 preview 필드에 표시

확인 후 PR 생성 (**auto-merge 하지 않음**):

```bash
gh pr create \
  --title "[PR 제목]" \
  --body "[PR 본문]" \
  --base main
```

- PR URL을 출력합니다.
- 테스트 서버 배포 안내: `🚀 코드 PR 생성 완료 — 테스트 서버에 자동 배포됩니다. 검증 완료 후 수동으로 머지해주세요.`
- **⚠️ `gh pr merge --auto`를 실행하지 않습니다.** 테스트 서버 검증 → 수동 머지가 운영 배포 프로세스입니다.

---

## 11단계: work-log/문서 갱신 — 별도 브랜치 PR로 분리

work-log, CLAUDE.md, MAP.md 등 문서 변경은 **코드 PR과 분리**하여 별도 브랜치 → PR → 즉시 squash merge합니다.
main 브랜치가 보호되어 있으므로 직접 push 대신 PR 방식을 사용합니다.

```bash
# main으로 이동
git checkout main
git pull origin main

# 문서 전용 브랜치 생성
DOCS_BRANCH="auto/worklog-[브랜치명]-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$DOCS_BRANCH"

# work-log, 문서 변경 커밋
git add work-logs/ CLAUDE.md [갱신된 MAP.md 등]
git commit -m "chore: work-log 및 문서 갱신 ([브랜치명])"
git push -u origin "$DOCS_BRANCH"

# PR 생성 + 즉시 squash merge
gh pr create \
  --title "chore: work-log 및 문서 갱신 ([브랜치명])" \
  --body "work-log 및 세션 문서 자동 갱신 (코드 변경 없음)" \
  --base main \
  --head "$DOCS_BRANCH"

gh pr merge "$DOCS_BRANCH" --squash --delete-branch

# 원래 feature 브랜치로 복귀
git checkout [feature 브랜치명]
```

> **주의:**
> - `gh pr merge --squash`가 "clean status" 오류로 실패할 수 있습니다. 이 경우 CI 통과를 기다린 후 재시도하거나, 사용자에게 수동 머지를 안내합니다.
> - 문서 PR은 코드가 없으므로 빌드에 영향 없습니다 (render.yaml ignoredPaths에 docs/**, work-logs/**, **/*.md 포함).

---

## 12단계: 완료 메시지 출력

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
🌿 브랜치: [브랜치명]
🔗 코드 PR: [코드 PR URL]
🔗 문서 PR: [문서 PR URL] (자동 머지)
📝 work-log 생성 완료:
   - work-logs/2026-03-28-HJ-a1b2c3d.md
📄 갱신된 문서:
   - CLAUDE.md
   - src/app/api/kanban/MAP.md
─────────────────────────────
🚀 코드 PR은 테스트 서버 검증 후 수동으로 머지해주세요.
```

변경된 파일이 없어 work-log를 생성하지 않은 경우:

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
📝 변경된 파일이 없어 work-log를 생성하지 않았습니다.
─────────────────────────────
```

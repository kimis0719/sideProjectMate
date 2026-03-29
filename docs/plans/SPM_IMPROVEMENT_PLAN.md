# SPM 스킬 개선 계획서

> 작성일: 2026-03-28
> 작성자: 프로젝트 리드
> 대상: `.claude/skills/spm/` 전체 구조 개편
> 목적: 실제 개발 운용 중 발견된 문제점 및 개선사항 반영

---

## 개요

기존 단일 `SKILL.md` 구조를 4개 커맨드 파일로 분리하고,
GitHub API 연동을 통한 이슈/브랜치/PR 자동화,
테스트 검증 강제화, 문서 자동 갱신 등을 추가한다.

### 변경 전

```
.claude/skills/spm/SKILL.md  ← 단일 파일
```

### 변경 후

```
.claude/skills/
├── spm-start.md
├── spm-commit.md
├── spm-done.md
└── spm-revert.md
```

---

## TODO-001 — 스킬 커맨드 체계 전면 개편

### 배경

기존 `/spm [작업내용]` / `/spm 작업 종료` 구조는

- 자연어가 포함되어 팀원마다 호출 방식이 달라질 수 있음
- Claude Code 자동완성 활용 불가
- 커맨드 목적이 불명확

### 요청 내용

단일 `SKILL.md`를 아래 4개 파일로 분리할 것.

```
.claude/skills/
├── spm-start.md
├── spm-commit.md
├── spm-done.md
└── spm-revert.md
```

**커맨드 체계:**

| 커맨드        | 역할                                                     |
| ------------- | -------------------------------------------------------- |
| `/spm-start`  | 작업 시작 (이슈 생성/선택 + 브랜치 생성 + 컨텍스트 로딩) |
| `/spm-commit` | 중간 커밋 (AI 커밋 메시지 작성 + 확인 + commit + push)   |
| `/spm-done`   | 작업 종료 (work-log 생성 + PR 생성 + 구역 해제)          |
| `/spm-revert` | 작업 롤백 (work-log 기반 git revert + PR 생성)           |

---

## TODO-002 — `/spm-start` 상세 설계

### 플로우

`/spm-start`만 호출하면 에이전트가 먼저 작업 유형을 질문.
뒤에 작업내용을 붙여도 되고, 아무것도 안 붙이면 아래처럼 대화형으로 진행.

```
어떤 작업을 시작할까요?

1. 신규 기능 개발 (feature)
2. 버그 수정 (fix)
3. 기존 이슈 이어받기

선택해주세요 (1/2/3):
```

**[1. feature 선택 시]**

```
→ "계획서 파일이 있나요?" 확인
  - 있음: docs/plans/ 내 파일 선택 → AI가 파악 후 이슈 제목/본문 초안 작성
  - 없음: 작업내용 자연어 설명 → AI가 간단 논의 후 이슈 초안 작성
→ 사용자 확인 후 GitHub 이슈 생성
→ 이슈 번호 기반 브랜치 자동 생성 (feature/이슈번호-작업명)
→ 로컬 checkout
→ .workzones.yml 등록 + CLAUDE.md 현황 표 업데이트
→ 관련 MAP.md + 최근 work-log 3개 로딩
```

**[2. fix 선택 시]**

```
→ 버그 내용 한 줄 입력
→ GitHub 이슈 생성 (bug 라벨 자동 태그)
→ 브랜치 자동 생성 (fix/이슈번호)
→ 로컬 checkout
→ .workzones.yml 등록 + CLAUDE.md 현황 표 업데이트
→ 계획서 없이 바로 작업 시작
```

**[3. 기존 이슈 이어받기 선택 시]**

```
→ GitHub 오픈 이슈 목록 조회 후 표시
→ 번호 선택
→ 브랜치 자동 생성 또는 기존 브랜치 checkout
→ .workzones.yml 등록 + CLAUDE.md 현황 표 업데이트
→ 관련 MAP.md + 최근 work-log 3개 로딩
```

### GitHub API 연동 필요 사항

- Personal Access Token 환경변수: `GITHUB_ACCESS_TOKEN`
- 권한 범위: `repo` (이슈 생성/조회, 브랜치 생성, PR 생성)

---

## TODO-003 — `/spm-commit` 상세 설계

### 플로우

```
1. git diff HEAD --name-only + git diff HEAD 로 변경 내용 수집
2. 새로 추가된 함수/필드/액션이 있는 경우
   → 해당 동작을 커버하는 테스트 파일 존재 여부 확인
   → 없으면 작성 후 진행
3. npm run test:run 실행
   → 전체 통과 시 다음 단계 진행
   → 실패 시 커밋 불가, 수정 후 재실행
4. AI가 변경 내용 분석 → 커밋 메시지 초안 작성
5. 사용자에게 미리보기 후 확인 요청
6. 확인 시: git add → git commit → git push
7. Husky post-commit 훅 → 로컬 스냅샷 자동 생성
```

### 커밋 메시지 형식

```
feat: 섹션 중첩 캡처 로직 추가 및 zIndex 3단 계층 재설계

- SectionModel에 parentSectionId, depth 필드 추가
- 부모 섹션 드래그 시 자식 섹션 동시 이동
- BoardShell zIndex 계산 로직 개선
```

### Husky 로컬 스냅샷

- `post-commit` 훅에서 자동 생성
- 저장 위치: `.local-snapshots/` (`.gitignore`에 추가)
- 내용: 커밋 SHA, 메시지, 변경 파일 목록, 타임스탬프
- 용도: `/spm-done` 시 전체 커밋 이력 종합하여 work-log 생성에 활용

---

## TODO-004 — `/spm-done` 상세 설계

### 플로우

```
1. npm run test:run 실행 (최종 전체 검증)
   → 전체 통과 시 다음 단계 진행
   → 실패 시 종료 불가, 수정 후 재실행
2. .local-snapshots/ 내 이번 세션 커밋 이력 전체 수집
3. AI가 전체 이력 종합 → work-log 생성 (work-logs/에 저장 + 푸시)
4. GitHub PR 자동 생성
   - 제목: 이슈 제목 기반 자동 작성
   - 본문: work-log 내용 자동 삽입
   - 이슈 연결: "Closes #이슈번호" 자동 추가
5. PROJECT_INDEX.md, CLAUDE.md, MAP.md 자동 갱신 (TODO-010 참조)
6. .workzones.yml 구역 해제
7. CLAUDE.md 현황 표 복원
```

### work-log 템플릿

```markdown
## YYYY-MM-DD — [작업자] ([브랜치명]) `[SHA]`

## 작업 요약

(전체 커밋 이력 종합 한 줄 요약)

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
```

---

## TODO-005 — 테스트 검증 강제화 (commit + done 양 단계)

### 배경

칸반보드 섹션 중첩 기능 작업 시, 캡처 함수가 분기 로직에
연결되었는지 검증하는 테스트가 누락된 채 작업 종료됨.
done 시점에만 검증하면 여러 커밋이 쌓인 후라 되돌리기 번거로움.
commit 시점에서 먼저 잡는 게 더 빠른 피드백.

### 각 단계별 역할

**`/spm-commit` 시 — "이 변경분 자체가 테스트 통과하는가"**

```
1. 이번 변경분에서 새로 추가된 함수 / 필드 / 액션이 있는 경우
   → 해당 동작을 커버하는 테스트 파일 존재 여부 확인
   → 없으면 작성 후 진행
2. npm run test:run 실행
   → 전체 통과 시 커밋 진행
   → 실패 시 커밋 불가, 수정 후 재실행
```

**`/spm-done` 시 — "전체 세션이 최종적으로 깨끗한가"**

```
1. npm run test:run 실행 (최종 전체 검증)
   → 전체 통과 시 work-log 생성 + PR 진행
   → 실패 시 종료 불가, 수정 후 재실행
2. 테스트 결과를 work-log에 명시
```

---

## TODO-006 — `/spm-start` 시 타 작업자 충돌 주의사항 주입

### 배경

워크존은 로컬 파일이라 팀원 간 공유가 안 되는 구조.
GitHub 오픈 이슈 + 브랜치 정보를 활용하면 별도 워크존 공유 없이도
현재 다른 팀원이 작업 중인 범위를 파악 가능.
단, 전체 diff를 컨텍스트에 주입하면 토큰 낭비 및 노이즈 발생.

### 요청 내용

`/spm-start` 플로우에 아래 단계 추가:

```
1. GitHub 오픈 이슈 목록 조회 (제목 + 담당자만, 가볍게)
2. 내 작업 도메인 키워드와 겹치는 이슈만 필터링
   (예: 칸반 작업 시작 → "kanban", "board" 키워드 이슈만)
3. 겹치는 이슈가 있을 경우에만 해당 브랜치 diff 조회
4. AI 컨텍스트에 한 줄 주의사항으로만 주입
```

**출력 예시:**

```
⚠️ 주의: kimis가 이슈 #177 (칸반보드 섹션 중첩)로 같은 도메인 작업 중입니다.
```

### 워크존 역할 재정의

- 워크존은 팀 공유용이 아닌 **로컬 AI 컨텍스트 로딩 전용**으로 역할 축소
- 팀원 간 작업 범위 파악은 GitHub 이슈 + 브랜치로 대체

### 워크존 Git 추적 제거 (함께 작업 요청)

현재 `.workzones.yml`이 `.gitignore`에 등록되어 있음에도
이미 GitHub에 올라간 상태라 Git이 계속 추적 중.
아래 명령어로 추적을 끊는 작업 필요:

```bash
git rm --cached .workzones.yml
git commit -m "chore: untrack .workzones.yml (local only)"
git push
```

---

## TODO-007 — `/spm-start` 시 미종료 작업 감지 및 처리

### 배경

`spm-done` 없이 세션이 끊기면 워크존이 locked 상태로 남고
work-log도 생성되지 않아 다음 작업자가 컨텍스트 복원 불가.
새 작업 시작 전 이전 작업 미종료 여부를 감지하는 방어 로직 필요.

### 감지 조건

아래 두 조건 중 하나라도 해당되면 미종료 작업으로 판단:

```
1. 현재 로컬 브랜치가 main/master가 아닌 경우
2. .workzones.yml에 active/locked 항목이 남아있는 경우
```

### 안내 메시지 및 선택지

```
⚠️ 종료되지 않은 작업이 있습니다.

브랜치: feature/177-kanban-upgrade
마지막 커밋: 2026-03-28 "섹션 중첩 캡처 로직 추가"

어떻게 할까요?
1. 지금 이전 작업 종료하기 (spm-done 실행)
2. 이전 작업 보류하고 새 작업 시작
3. 이전 작업 강제 종료 (work-log 미생성 경고 후 진행)
```

### 각 선택지 처리

```
[1 선택] → spm-done 플로우 실행 후 새 작업 시작
[2 선택] → 워크존에 status: "paused"로 기록
           새 작업 시작, 추후 재개 가능
           (급한 버그픽스 등 작업 전환 케이스 대응)
[3 선택] → 워크존만 해제, work-log 미생성 경고 표시 후 진행
```

---

## TODO-008 — work-log "건드리면 안 되는 부분" 섹션 강화

### 배경

롤백 시 충돌 해결의 가장 큰 어려움은 "어느 코드를 살려야 하는지" 판단이 어려운 것.
work-log의 "건드리면 안 되는 부분" 섹션이 이 판단 근거가 되므로 중요성 강화 필요.

### 요청 내용

**1. work-log 템플릿 구조화**

기존 자유 텍스트 형식에서 아래 표 형식으로 변경:

```markdown
## 건드리면 안 되는 부분

| 파일            | 위치                                   | 이유                                         |
| --------------- | -------------------------------------- | -------------------------------------------- |
| SectionItem.tsx | childNodeCacheRef/childSectionCacheRef | 성능 최적화 핵심, 건드리면 드래그 성능 저하  |
| boardStore.ts   | applyRemote\* 함수들                   | Undo/Redo 동기화 로직, 변경 시 히스토리 깨짐 |
```

**2. `spm-done` 시 자동 감지 및 작성 강제화**

에이전트가 변경된 파일을 분석하여 아래 기준으로 자동 감지:

```
- 다른 로직과 강하게 결합된 코드
- 성능 최적화 목적의 캐시/ref 구조
- 실시간 동기화(Socket) 관련 로직
- Undo/Redo 히스토리 관련 로직
```

감지된 항목을 초안으로 작성 후 사용자 확인 → work-log에 반영.
항목이 없더라도 "없음"으로 명시 (빈칸 방치 금지).

---

## TODO-009 — `/spm-revert` 커맨드 추가

### 배경

롤백 시 git revert 수동 실행은 번거롭고,
충돌 발생 시 컨텍스트 없이 해결해야 해서 위험도가 높음.
work-log 정보를 활용해 롤백 + 충돌 안내를 자동화.

### 플로우

```
/spm-revert 호출 시:

1. work-log 목록 표시 (날짜 + 작업 요약 + 커밋 SHA)
2. 되돌릴 작업 선택
3. 선택한 work-log의 "건드리면 안 되는 부분" 먼저 출력
   ("이 파일들은 충돌 시 특히 주의하세요")
4. git revert 실행

   [충돌 없을 시]
   → PR 자동 생성 후 완료

   [충돌 발생 시]
   → 충돌 파일 목록 표시
   → 해당 work-log의 작업 의도 + 건드리면 안 되는 부분 재표시
   → "이 내용을 참고해서 충돌을 해결하세요" 안내
   → 충돌 해결 완료 확인 후 PR 자동 생성
```

---

## TODO-010 — `spm-done` 시 프로젝트 문서 자동 갱신

### 배경

현재 SKILL.md의 5단계는 CLAUDE.md의 "진행 현황 표"만 업데이트함.
새로 추가된 파일, API, 모델, 컴포넌트 등은 반영되지 않아
시간이 지날수록 문서와 실제 코드 간 괴리가 커지는 구조.
AI가 매 세션마다 이 문서들을 컨텍스트로 참조하므로
문서 품질이 곧 AI 작업 품질에 직결됨.

**실제 문제 사례:**

- PROJECT_INDEX.md: `Generated: 2026-03-21` 이후 미갱신
  → 오늘 칸반 작업으로 13개 파일 변경됐지만 반영 안 됨
- CLAUDE.md: 새 API, 모델, 컴포넌트 추가되어도 미반영

### 요청 내용

`/spm-done` 플로우에서 work-log 생성 후 아래 단계 추가:

**1. PROJECT_INDEX.md 자동 갱신**

```
→ 이번 작업에서 추가/수정/삭제된 파일 감지
→ 아래 항목 자동 업데이트:
   - Pages (새 라우트 추가 시)
   - API Routes (새 엔드포인트 추가 시)
   - Mongoose Models (새 모델/필드 추가 시)
   - Zustand Stores (스토어 변경 시)
   - Utility Modules (새 유틸 추가 시)
   - Generated 날짜 갱신
```

**2. CLAUDE.md 자동 갱신**

```
→ 새로 추가된 도메인이 있으면 "작업 유형별 추가 로딩" 표 업데이트
→ 새 API 패턴이 생겼으면 "API Route 필수 패턴" 업데이트
→ "현재 진행 중인 작업 현황" 표 복원 (기존 동작 유지)
```

**3. 해당 도메인 MAP.md 자동 갱신**

```
→ 작업 도메인의 MAP.md에 새 파일/함수/엔드포인트 반영
   (예: 칸반 작업 시 src/app/api/kanban/MAP.md 갱신)
```

---

## TODO-011 — GitHub Actions 워크플로우 오류 수정

### 배경

GitHub Actions에서 두 워크플로우 파일 모두 오류 발생 중.
`auto-worklog.yml`은 ANTHROPIC_API_KEY를 활용해 Claude API로
work-log를 자동 생성하는 워크플로우로 확인됨.

### 에러 1 — `auto-worklog.yml` L74 YAML 문법 오류

```
Invalid workflow file: .github/workflows/auto-worklog.yml#L74
You have an error in your yaml syntax on line 74
```

**원인:** `run: |` 안에서 Python 히어독(`<< 'PYEOF'`) 문법이
GitHub Actions YAML 파서와 충돌.

**해결 방법:** Python 코드를 별도 스크립트 파일로 분리

```yaml
# 변경 전
- name: Claude API로 Work Log 생성
  run: |
    python3 << 'PYEOF'
    ... (Python 코드 인라인)
    PYEOF

# 변경 후
- name: Claude API로 Work Log 생성
  run: python3 scripts/generate-worklog.py
```

Python 코드는 `scripts/generate-worklog.py`로 분리하여 저장.

### 에러 2 — `ci.yml` L46 step 정의 불완전

```
Invalid workflow file: .github/workflows/ci.yml#L1
(Line: 46, Col: 9): There's not enough info to determine what you meant.
Add one of these properties: run, shell, uses, with, working-directory
```

**원인:** `typecheck` job의 마지막 step에서 `run` 명령어가 누락됨.

**해결 방법:** 누락된 `run` 명령어 추가

```yaml
- name: TypeScript 타입 체크
  run: npx tsc --noEmit
```

---

## TODO-012 — PAT 미설정 시 온보딩 안내

### 배경

`spm-start` 등 GitHub API 연동 기능을 사용하려면
팀원 각자 로컬에 Personal Access Token 세팅이 필요.
미설정 상태에서 스킬 호출 시 에러 없이 안내가 나와야 함.

### 요청 내용

모든 spm 커맨드 호출 시 **가장 먼저** `.env.local`에
`GITHUB_ACCESS_TOKEN` 존재 여부를 확인하는 단계 추가.

**미설정 시 출력 메시지:**

```
⚠️ GitHub API 연동을 위해 PAT 초기 세팅이 필요합니다.

1. GitHub 로그인
2. Settings → Developer settings
   → Personal access tokens → Tokens (classic)
   → Generate new token
3. 권한 선택: repo (전체) 체크 후 생성
4. 발급받은 토큰을 .env.local에 추가:
   GITHUB_ACCESS_TOKEN=ghp_xxxxx

세팅 완료 후 다시 시도해주세요.
```

**설정 완료 시:** 안내 없이 바로 다음 단계 진행.

---

## 추후 논의 필요 (칸반 고도화 완료 후 리팩토링 시)

- 컴포넌트 인라인 로직(캡처/릴리즈 등)을 `src/lib/utils/kanban/`으로 추출
- 추출 후 Phase 1 단위 테스트 커버리지 확보
- 대상: `SectionItem.tsx` 내 드래그 핸들러 판단 로직 등

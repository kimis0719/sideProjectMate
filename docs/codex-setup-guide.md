# Codex 온보딩 가이드

> OpenAI Codex를 사용하는 팀원이 Claude Code 팀원과 **동일한 워크플로우**로 개발할 수 있도록 하는 설정 가이드입니다.

---

## 목차

1. [핵심 차이점 요약](#1-핵심-차이점-요약)
2. [초기 설정](#2-초기-설정)
3. [작업 시작 절차](#3-작업-시작-절차-spm-start-대체)
4. [개발 중 커밋 절차](#4-개발-중-커밋-절차-spm-commit-대체)
5. [작업 종료 절차](#5-작업-종료-절차-spm-done-대체)
6. [긴급 수정 절차](#6-긴급-수정-절차-spm-hotfix-대체)
7. [작업 롤백 절차](#7-작업-롤백-절차-spm-revert-대체)
8. [Linear 이슈 관리](#8-linear-이슈-관리)
9. [테스트 작성 규칙](#9-테스트-작성-규칙)
10. [코드 컨벤션 요약](#10-코드-컨벤션-요약)
11. [트러블슈팅](#11-트러블슈팅)

---

## 1. 핵심 차이점 요약

| 항목 | Claude Code | Codex |
|------|-------------|-------|
| 프로젝트 지시 파일 | `CLAUDE.md` (자동 로딩) | `AGENTS.md` (자동 로딩) |
| 작업 커맨드 | `/spm-start`, `/spm-commit`, `/spm-done` 등 스킬 자동 실행 | 이 가이드의 수동 절차를 따름 |
| Linear 연동 | MCP 서버로 직접 조회/생성/업데이트 | Linear 웹 UI 또는 Linear CLI 사용 |
| 디자인 스킬 | `/critique`, `/polish` 등 21개 UI/UX 스킬 | 해당 스킬의 SKILL.md를 읽고 직접 적용 |
| work-log 생성 | `/spm-done` 시 자동 생성 | 템플릿 기반 수동 작성 |
| .workzones.yml | `/spm-start`가 자동 등록/해제 | 수동 편집 |

> **핵심 원칙**: 도구는 다르지만 **결과물은 동일**해야 합니다.
> 같은 컨벤션, 같은 테스트 기준, 같은 커밋 형식, 같은 work-log 포맷.

---

## 2. 초기 설정

### 2.1 AGENTS.md 확인

프로젝트 루트의 `AGENTS.md`가 Codex의 시스템 지시 파일입니다. Codex는 이 파일을 자동으로 읽습니다.

```
sideProjectMate/
├── CLAUDE.md      ← Claude Code용
├── AGENTS.md      ← Codex용 (동일 규칙)
```

두 파일의 핵심 내용은 동일합니다. `AGENTS.md`는 Codex의 도구 제약에 맞게 수동 절차를 안내합니다.

### 2.2 GitHub CLI 인증

```bash
gh auth status     # 인증 상태 확인
gh auth login      # 미인증 시 로그인
```

### 2.3 세션 시작 시 반드시 읽을 파일

Codex 세션을 시작할 때마다 아래 파일을 먼저 읽으세요:

```
1. .workzones.yml          → 다른 팀원이 작업 중인 구역 확인
2. work-logs/ 최신 3개     → 최근 변경사항 파악
3. 도메인 MAP.md           → 작업할 영역의 아키텍처 파악
```

### 2.4 도메인별 MAP.md 위치

| 도메인 | MAP.md 경로 |
|--------|-------------|
| API 전체 | `src/app/api/MAP.md` |
| 칸반 | `src/app/api/kanban/MAP.md` |
| WBS | `src/app/api/wbs/MAP.md` |
| 채팅 | `src/app/api/chat/MAP.md` |
| 프로젝트 | `src/app/api/projects/MAP.md` |
| 유저/프로필 | `src/app/api/users/MAP.md` |
| AI 기능 | `src/app/api/ai/MAP.md` |
| 모델 | `src/lib/models/MAP.md` |
| 스토어 | `src/store/MAP.md` |

---

## 3. 작업 시작 절차 (`/spm-start` 대체)

Claude Code에서는 `/spm-start SPM-42 칸반보드 개선`으로 한 번에 처리됩니다.
Codex에서는 아래 단계를 순서대로 수행하세요.

### 3.1 Linear 이슈 확인

Linear 웹(`linear.app`)에서 작업할 이슈를 확인합니다.
- 팀: **Sideprojectmate** (식별자: `SPM`)
- 이슈 형식: `SPM-42`

### 3.2 브랜치 생성

```bash
# main에서 시작
git checkout main
git pull origin main

# 브랜치 생성 (유형에 따라)
# 기능 개발:
git checkout -b feature/SPM-42-kanban-drag-drop

# 버그 수정:
git checkout -b fix/SPM-42-kanban-drag-drop

# 원격에 push
git push -u origin feature/SPM-42-kanban-drag-drop
```

**브랜치 슬러그 규칙**: 작업 내용을 영문 kebab-case로 변환합니다.
- "칸반보드 드래그앤드롭 개선" → `kanban-drag-drop`
- "채팅 알림 버그 수정" → `chat-notification-bug`

### 3.3 .workzones.yml 등록

`.workzones.yml` 파일에 본인 작업 구역을 등록합니다:

```yaml
zones:
  - path: 'src/app/api/kanban/'
    owner: '본인이름'
    status: 'active'
    reason: 'SPM-42 칸반보드 드래그앤드롭 개선'
    expires: '2026-04-25'   # 오늘 + 7일
```

**도메인 키워드 → 잠금 경로 매핑**:

| 키워드 | 잠금 경로 |
|--------|----------|
| 칸반, 보드 | `src/app/api/kanban/`, `src/store/boardStore.ts`, `src/components/board/` |
| WBS, 간트, 태스크 | `src/app/api/wbs/`, `src/store/wbsStore.ts`, `src/components/wbs/` |
| 채팅, 메시지 | `src/app/api/chat/`, `src/components/chat/` |
| 프로젝트 | `src/app/api/projects/`, `src/components/projects/` |
| 유저, 프로필 | `src/app/api/users/`, `src/components/profile/` |
| 어드민 | `src/app/api/admin/` |
| 스토어 | `src/store/` |
| 모델 | `src/lib/models/` |

### 3.4 CLAUDE.md 현황 표 업데이트

`CLAUDE.md` 하단의 "현재 진행 중인 작업 현황" 표에 본인 행을 추가합니다:

```markdown
| src/app/api/kanban/ | 본인이름 | 🟡 작업 중 | SPM-42 칸반보드 드래그앤드롭 개선 |
```

> "현재 작업 중인 항목 없음" 행은 실제 항목이 추가되면 제거하세요.

### 3.5 팀원 충돌 확인

같은 도메인에서 작업 중인 다른 팀원이 있는지 확인합니다:

```bash
git branch -r --list "origin/feature/SPM-*" --list "origin/fix/SPM-*"
```

같은 도메인 키워드를 포함한 활성 브랜치가 있으면 주의하세요.

### 3.6 컨텍스트 로딩

아래 파일들을 순서대로 읽습니다:

1. 해당 도메인의 `MAP.md`
2. `work-logs/` 최신 3개 (파일명 기준 내림차순 정렬)

---

## 4. 개발 중 커밋 절차 (`/spm-commit` 대체)

### 4.1 테스트 커버리지 확인

새로 추가한 함수/필드/액션에 대한 테스트가 있는지 확인합니다.
없으면 테스트 파일을 작성하세요 (`docs/testing-guide.md` 참조).

### 4.2 검증 실행

```bash
# 테스트 전체 실행 — 반드시 통과해야 함
npm run test:run

# 타입 체크 — 반드시 통과해야 함
npx tsc --noEmit
```

> **두 검증 모두 통과해야** 커밋할 수 있습니다.

### 4.3 커밋 및 Push

```bash
git add [변경된 파일들]
git commit -m "feat: 칸반보드 드래그앤드롭 개선 (SPM-42)"
git push
```

**커밋 메시지 형식**:

```
[type]: [설명] (SPM-[번호])
```

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `test` | 테스트 추가/수정 |
| `docs` | 문서 변경 |
| `chore` | 빌드/설정 변경 |

---

## 5. 작업 종료 절차 (`/spm-done` 대체)

### 5.1 최종 검증

```bash
npm run test:run       # 전체 테스트 통과 확인
npx tsc --noEmit       # 타입 체크 통과 확인
```

### 5.2 work-log 작성

`work-logs/` 디렉토리에 아래 형식으로 파일을 생성합니다.

**파일명**: `YYYY-MM-DD-[작업자이름]-[커밋SHA7자리].md`

예시: `2026-04-18-kimis-abc1234.md`

**내용 템플릿**:

```markdown
## 2026-04-18 — kimis (feature/SPM-42-kanban-drag-drop) `abc1234`

> 모델: codex (직접 작성)

## 작업 요약

칸반보드 드래그앤드롭 기능 개선 — 섹션 간 노트 이동 시 순서 보존

## 변경된 파일

- `src/app/api/kanban/notes/route.ts` — 노트 순서 업데이트 로직 추가
- `src/store/boardStore.ts` — 낙관적 업데이트 구현
- `src/components/board/NoteItem.tsx` — 드래그 핸들러 수정

## 테스트 결과

- 실행: npm run test:run
- 결과: 583 passed / 0 failed

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
|------|------|------|
| `src/store/boardStore.ts` | `optimisticUpdate()` | 소켓 동기화와 강결합 |

## 미완성 / 다음 세션에서 이어받을 부분

없음
```

> **"건드리면 안 되는 부분"**을 반드시 채워주세요. 다른 팀원이 이 정보를 보고 충돌을 피합니다.

### 5.3 도메인 MAP.md 갱신

새 파일, 함수, 엔드포인트를 추가했다면 해당 도메인의 `MAP.md`에 반영합니다.

### 5.4 .workzones.yml 정리

본인 항목을 제거합니다:

```yaml
# 변경 전
zones:
  - path: 'src/app/api/kanban/'
    owner: 'kimis'
    status: 'active'
    reason: 'SPM-42 칸반보드 드래그앤드롭 개선'
    expires: '2026-04-25'

# 변경 후
zones: []
```

### 5.5 CLAUDE.md 현황 표 복원

본인 행을 제거합니다. 다른 작업자가 없으면 기본 행을 복원합니다:

```markdown
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
```

### 5.6 통합 커밋 및 PR 생성

```bash
# 코드 + 문서 + work-log 모두 스테이징
git add [코드 파일들] work-logs/2026-04-18-kimis-abc1234.md CLAUDE.md .workzones.yml [MAP.md 파일들]
git commit -m "feat: 칸반보드 드래그앤드롭 개선 (SPM-42)"
git push

# PR 생성
gh pr create \
  --title "feat: 칸반보드 드래그앤드롭 개선 (SPM-42)" \
  --body "$(cat <<'EOF'
## Summary
- 칸반보드 섹션 간 노트 드래그앤드롭 시 순서 보존 로직 구현
- boardStore에 낙관적 업데이트 추가

## Test plan
- [ ] npm run test:run 전체 통과
- [ ] 칸반보드에서 노트 드래그 → 다른 섹션에 드롭 → 순서 유지 확인

Linear: SPM-42
EOF
)"
```

> PR 본문 마지막에 `Linear: SPM-42`를 추가하면 Linear ↔ GitHub 자동 연동됩니다.

---

## 6. 긴급 수정 절차 (`/spm-hotfix` 대체)

> **운영 크리티컬 오류**에만 사용하세요. 일반 버그는 3~5번 절차를 따르세요.

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main && git pull
git checkout -b hotfix/SPM-99-critical-fix-slug

# 2. 최소 범위로 수정 (리팩토링 금지!)

# 3. 검증
npm run test:run
npx tsc --noEmit

# 4. 커밋 및 Push
git add [수정 파일들]
git commit -m "hotfix: 긴급 수정 설명 (SPM-99)"
git push -u origin hotfix/SPM-99-critical-fix-slug

# 5. PR 생성 + 자동 머지
gh pr create \
  --title "hotfix: 긴급 수정 설명 (SPM-99)" \
  --body "$(cat <<'EOF'
## 오류
(오류 현상 설명)

## 원인
(원인 분석)

## 수정
(수정 내용)

## 검증
- npm run test:run 통과
- npx tsc --noEmit 통과

Linear: SPM-99
EOF
)"

gh pr merge --squash --auto

# 6. main 복귀
git checkout main && git pull
```

---

## 7. 작업 롤백 절차 (`/spm-revert` 대체)

```bash
# 1. work-logs/에서 롤백할 작업의 커밋 SHA 확인
ls work-logs/

# 2. "건드리면 안 되는 부분" 확인
cat work-logs/2026-04-18-kimis-abc1234.md

# 3. revert 실행
git revert abc1234

# 4. 충돌 발생 시 수동 해결 후
git revert --continue

# 5. Push 및 PR 생성
git push
gh pr create \
  --title "revert: SPM-42 칸반보드 드래그앤드롭 롤백" \
  --body "$(cat <<'EOF'
## 롤백 사유
(기능 오류 / 성능 저하 / 충돌 / 기획 변경)

## 원본 커밋
abc1234

Linear: SPM-42
EOF
)"
```

---

## 8. Linear 이슈 관리

### Claude Code vs Codex 차이

| 기능 | Claude Code | Codex |
|------|-------------|-------|
| 이슈 조회 | `mcp__linear-server__get_issue` | Linear 웹 UI |
| 이슈 생성 | `mcp__linear-server__save_issue` | Linear 웹 UI |
| 이슈 업데이트 | `mcp__linear-server__save_issue` | Linear 웹 UI |
| 이슈 상태 변경 | MCP 도구 | Linear 웹 UI |

### Codex에서의 Linear 사용법

1. **이슈 확인**: [linear.app](https://linear.app) → Sideprojectmate 팀 → 이슈 목록
2. **이슈 생성**: Linear 웹에서 직접 생성 (라벨: `Feature` 또는 `Bug`)
3. **PR 연동**: PR 본문에 `Linear: SPM-[번호]` 추가

### (선택) Linear CLI 설치

Linear CLI를 설치하면 터미널에서도 이슈를 관리할 수 있습니다:

```bash
npm install -g @linear/cli
linear auth
linear issue list --team SPM
linear issue view SPM-42
```

---

## 9. 테스트 작성 규칙

상세한 내용은 `docs/testing-guide.md`를 참조하세요. 핵심만 요약합니다.

### 실행 명령

```bash
npm run test:run      # 전체 실행 (CI용)
npm run test:watch    # 감시 모드 (개발용)
npm run test:coverage # 커버리지 포함
```

### 파일 위치

테스트 파일은 원본 파일 **바로 옆**에 배치합니다:

```
src/lib/utils/wbs/taskDependency.ts
src/lib/utils/wbs/taskDependency.test.ts   ← 바로 옆
```

### Phase별 핵심 패턴

**Phase 1 — 순수 함수** (`src/lib/utils/**`):

```ts
describe('함수명', () => {
  it('정상 케이스 1', () => { ... });
  it('정상 케이스 2', () => { ... });
  it('정상 케이스 3', () => { ... });
  it('엣지 케이스 1', () => { ... });
  it('엣지 케이스 2', () => { ... });
  it('실패 케이스', () => { ... });
});
```

**Phase 2 — 스토어/훅** (`src/store/**`, `src/hooks/**`):

- Socket mock은 `vi.hoisted()` 필수
- 테스트 항목: fetch 성공/실패, 낙관적 업데이트, 소켓 emit, 롤백

**Phase 3 — API Route** (`src/app/api/**`):

- 필수 mock: `mongodb`, `next-auth`, `next/headers`
- DB 생명주기: `beforeAll(setupTestDB)`, `afterEach(clearTestDB)`, `afterAll(teardownTestDB)`
- 테스트 항목: 401, 403, 400, 404, 201 응답, DB 실제 저장 확인
- 기존 fixture 재사용: `src/__tests__/fixtures/`

---

## 10. 코드 컨벤션 요약

상세한 내용은 `docs/conventions.md`를 참조하세요.

### API Route 필수 패턴

```ts
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?._id)
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });

  const data = await Model.find(query).lean();
  return NextResponse.json({ success: true, data });
}

export const GET = withApiLogging(_GET, '/api/도메인/경로');
```

### Mongoose 모델 패턴

```ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFoo extends Document {
  name: string;
}

const FooSchema: Schema = new Schema(
  { name: { type: String, required: true } },
  { timestamps: true }
);

export default mongoose.models.Foo || mongoose.model<IFoo>('Foo', FooSchema);
```

### Zustand 스토어 패턴

- State/Actions 타입 분리
- `devtools` 미들웨어 필수
- `window.alert()` / `window.confirm()` 대신 `useModal` 훅 사용

### Socket.io 규칙

- `src/lib/socket.ts`의 `getSocket()` 싱글톤 사용
- 컴포넌트 언마운트 시 `socket.off()` 필수

### 금지 사항

- `any` 타입 사용 금지
- 상대경로 import 금지 (항상 `@/` 사용)
- `window.alert()` / `window.confirm()` 사용 금지

---

## 11. 트러블슈팅

### Q: AGENTS.md와 CLAUDE.md 중 어떤 것을 수정해야 하나요?

프로젝트 규칙이 변경되면 **양쪽 모두** 업데이트해야 합니다.
핵심 규칙은 `docs/conventions.md`에 두고, 양쪽 파일에서 참조하는 것이 이상적입니다.

### Q: .workzones.yml에 다른 팀원 항목이 있으면 어떻게 하나요?

해당 경로의 파일을 수정하지 않도록 주의하세요.
부득이하게 겹치는 파일을 수정해야 한다면 해당 팀원과 소통 후 진행하세요.

### Q: Claude Code의 디자인 스킬(critique, polish 등)을 Codex에서 사용하려면?

`.claude/skills/[스킬명]/SKILL.md` 파일을 읽어보세요.
각 스킬의 분석 기준과 체크리스트가 정의되어 있으므로, 해당 내용을 참고하여 수동으로 적용할 수 있습니다.

예시:
```
.claude/skills/critique/SKILL.md      → UX 평가 기준
.claude/skills/polish/SKILL.md        → 최종 품질 체크리스트
.claude/skills/audit/SKILL.md         → 접근성/성능 감사 기준
```

### Q: work-log를 깜빡하고 안 썼어요

작업 종료 후라도 반드시 작성하세요. 다른 팀원이 `work-logs/`를 읽고 최근 변경사항을 파악합니다.
"건드리면 안 되는 부분"이 특히 중요합니다.

### Q: Linear MCP를 Codex에서 사용할 수 있나요?

현재는 불가합니다. Codex가 MCP 프로토콜을 지원하면 `linear-server` 설정을 추가할 수 있지만,
지금은 Linear 웹 UI를 사용하세요.

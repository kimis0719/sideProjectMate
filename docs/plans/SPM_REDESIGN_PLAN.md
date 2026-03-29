# SPM 서비스 전면 개편 계획서

> 작성일: 2026-03-29
> 목적: "AI 시대에 사이드 프로젝트를 팀원들과 함께 가장 빠르게 실행할 수 있는 환경"으로 포지셔닝 재정의
> 현황: 실사용자 없음 — 전면 개편 가능한 마지막 타이밍

---

## 체크포인트 규칙

> 계획서 전체에 걸쳐 `[CP-X-N]` 마커가 등장하면 에이전트는 반드시 작업을 멈춘다.
> 에이전트는 해당 항목에서 **현재 상태 또는 선택지를 개발자에게 제시**하고,
> 개발자의 명시적 확인 또는 선택을 받은 후에 다음 작업을 진행한다.
> "네", "진행해줘", "A로 해줘" 같은 명확한 응답이 없으면 절대 다음으로 넘어가지 않는다.

---

## 1. 개편 배경 및 핵심 방향

### 왜 바꾸는가

기존 SPM은 "기술스택 기반 팀 매칭" 모델이었다. 이 모델의 전제는 "부족한 기술을 채워줄 사람을 구한다"는 것인데, AI 바이브 코딩의 확산으로 이 전제가 흔들리고 있다.

개발자 한 명이 AI를 활용해 프론트, 백, 디자인, 기획을 넘나드는 시대에 "React 개발자 구해요" 방식의 매칭은 설득력을 잃는다.

그러나 팀이 필요한 이유 자체는 사라지지 않았다:

- **지속성**: 혼자 하면 동기부여가 꺼진다. 같이 달릴 사람이 프로젝트를 끝까지 가게 한다
- **도메인 지식**: AI가 못 주는 것 — 실제 현장 경험과 삶의 관점
- **관점의 충돌**: 좋은 제품은 "이게 정말 필요해?"라는 마찰에서 나온다
- **실행 속도**: 같은 방향을 보는 한 명이 더 있으면 훨씬 빨리 간다

### 포지셔닝 전환

| 항목 | 기존 | 개편 후 |
|------|------|---------|
| 핵심 가치 | 부족한 기술을 팀원으로 채우기 | 같은 문제에 꽂힌 사람과 빠르게 실행하기 |
| 매칭 기준 | 기술스택 + 역할 | 도메인 관심사 + 실행 스타일 + 가용 시간 |
| 차별점 | 팀 매칭 플랫폼 | 팀 매칭 + AI 기반 실행 도구 올인원 |
| 타겟 유저 | 기술 역할이 명확한 개발자 | 아이디어를 빠르게 실행하고 싶은 누구나 |

### 유지하는 것 vs 바꾸는 것

**유지**
- 칸반 보드 코어 로직 (현재 잘 만들어져 있음)
- AI 지시서(칸반 → MD 변환) 기능 — 이게 핵심 차별점
- 실시간 채팅
- GitHub 연동
- 인증 시스템 (next-auth)

**바꾸는 것**
- 프로젝트 모델: `requiredRoles` 제거 → `problemStatement` 중심
- 유저 프로필: `role` 제거 → `domains`, `workStyle`, `bio` 중심
- 지원 모델: `appliedRole` 제거 → `motivation` 중심
- 탐색 UI: 기술스택 필터 → 도메인/단계/스타일 필터
- 온보딩: 없음 → 3스텝 온보딩
- 랜딩: 텍스트 중심 → 실제 화면 노출 + 비회원 미리보기

**제거하는 것**
- WBS / 간트 차트 (AI 활용 시대에 불필요 — 단계적 제거)
- 프로필의 역할 뱃지 (프론트엔드/백엔드 고정 enum)
- 프로젝트 등록의 "역할별 모집 인원" 입력

---

## 2. 데이터 모델 설계

### 2-1. ProjectModel 개편

**제거 필드**
- `requiredRoles: [{ role, count }]` — 핵심 제거 대상

**신규 필드**

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| `problemStatement` | String (max 500) | "어떤 문제를 왜 풀려고 하는가" — 카드 본문 | 필수 |
| `currentStage` | enum | idea / prototype / mvp / beta / launched | 필수 |
| `executionStyle` | enum | ai_heavy / balanced / traditional | 필수 |
| `domains` | String[] | 프로젝트 도메인 태그 (자유 입력) | 권장 |
| `lookingFor` | String[] | 찾는 사람 특성 태그 (자유 입력) | 권장 |
| `weeklyHours` | Number | 예상 주당 참여 시간 | 필수 |
| `durationMonths` | Number | 예상 기간(개월) | 선택 |
| `maxMembers` | Number | 최대 팀원 수 (기본 4) | 선택 |
| `links` | Object | { github, figma, deploy, notion } | 선택 |

**유지 필드**: `title`, `description`, `ownerId`, `members`, `status`, `techStacks`(참고용), `likeCount`, `viewCount`

**인덱스 추가**: `domains`, `currentStage`, `executionStyle`, `status + createdAt`

---

### 2-2. UserModel 개편 (memberbasics 컬렉션)

**deprecated 처리** (삭제 아님 — 기존 코드 호환성)
- `role: string` — 신규 가입에서 받지 않음, 기존 데이터는 유지

**신규 필드**

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| `bio` | String (max 200) | 한두 줄 자기소개 | 온보딩 |
| `domains` | String[] | 관심 도메인 태그 | 온보딩 |
| `workStyle` | WorkStyle[] | 일하는 스타일 다중 선택 | 온보딩 |
| `weeklyAvailability` | Number | `availabilities.schedule`에서 자동 계산 (총 시간 합산) | 자동 |
| `preferLaunchStyle` | enum | quick / thorough | 온보딩 |
| `onboardingStep` | Number (0~4) | 온보딩 진행 단계 | 자동 |

**WorkStyle enum**
```
ai_heavy / fast_launch / quality_first / async_first / sync_preferred
```

**가상 필드 (DB 저장 안 함)**
- `profileCompleteness`: bio(20) + domains(20) + workStyle(15) + weeklyAvailability(15) + github(20) + techStacks(10) = 최대 100점

**인덱스 추가**: `domains`, `workStyle`, `onboardingStep`

---

### 2-3. ApplicationModel 개편

**제거 필드**
- `appliedRole` — 기술/역할 중심 지원 방식 제거

**신규 필드**

| 필드 | 타입 | 설명 | 필수 |
|------|------|------|------|
| `motivation` | String (min 20, max 500) | 왜 이 문제에 관심 있는지 | 필수 |
| `weeklyHours` | Number | 지원자의 실제 가용 시간 | 필수 |
| `ownerNote` | String (max 500) | 오너 내부 메모 (지원자 비노출) | 선택 |

**유지 필드**: `projectId`, `applicantId`, `status` (pending/accepted/rejected), `message`

**status 추가**: `withdrawn` (지원자 직접 취소)

**복합 유니크 인덱스**: `{ projectId, applicantId }` — 중복 지원 방지

---

## 3. API 엔드포인트 변경 목록

### 프로젝트 API

| 엔드포인트 | 변경 내용 |
|-----------|----------|
| `POST /api/projects` | `requiredRoles` 제거, `problemStatement` / `currentStage` / `executionStyle` / `domains` / `lookingFor` 추가 |
| `GET /api/projects` | 쿼리 파라미터 변경: `role` 제거 → `domain`, `stage`, `executionStyle`, `weeklyHours` 추가 |
| `PATCH /api/projects/[id]` | 신규 필드 수정 지원 |

### 유저/프로필 API

| 엔드포인트 | 변경 내용 |
|-----------|----------|
| `PATCH /api/users/profile` | `bio`, `domains`, `workStyle`, `weeklyAvailability`, `preferLaunchStyle` 수정 지원 |
| `POST /api/users/onboarding` | 신규 — 온보딩 단계별 저장 (`onboardingStep` 업데이트) |
| `GET /api/projects?memberId=&status=completed` | 신규 파라미터 — 완료 프로젝트 조회 (프로필 페이지용) |

### 지원 API

| 엔드포인트 | 변경 내용 |
|-----------|----------|
| `POST /api/projects/[id]/apply` | `role` 제거, `motivation` / `weeklyHours` 추가 |
| `PATCH /api/applications/[id]/withdraw` | 신규 — 지원자 직접 취소 |
| `GET /api/applications/my` | 신규 — 현재 유저의 전체 지원 목록 |

---

## 4. 화면(페이지) 변경 목록

### 신규 페이지
- `/onboarding` — 가입 후 3스텝 온보딩 페이지

### 크게 변경되는 페이지
- `/projects` — 탐색 필터 전면 교체, 카드 UI 변경
- `/projects/[id]` — 프로젝트 상세: problemStatement 중심으로 레이아웃 변경
- `/projects/new` — 등록 폼: requiredRoles 제거, 새 필드 추가
- `/profile` — 프로필: role 제거, 완성도 게이지, 도메인/스타일 표시
- `/` (랜딩) — 포지셔닝 문구 변경, 비회원 프로젝트 미리보기 추가

### 제거되는 페이지/기능
- WBS 관련 페이지 (단계적 제거 — Phase 7에서 처리)
- 프로필의 역할 설정 섹션

---

## 5. 단계별 개발 계획 (Phase)

> 각 Phase는 독립적으로 PR을 올릴 수 있는 단위로 구성

---

### Phase 0: 어휘 확정 + 비모델 정리 (0.5일)

목표: 모델 파일과 API Route를 건드리지 않고, Phase 1이 의존할 기반을 먼저 만든다.
작업은 성격이 다른 세 가지로 나뉜다.

> **Phase 0과 Phase 1의 구분선**: `src/lib/models/` 파일 및 API Route 핸들러 수정 여부.
> Phase 0은 이 두 가지를 건드리지 않는다.

---

#### 상수의 두 가지 성격 — 소스 vs 공통코드

Phase 0에서 정의할 상수들은 성격이 달라 저장 위치가 다르다.

| 구분 | 저장 위치 | 기준 |
|------|----------|------|
| Type A | 소스코드 (`src/constants/`) | Mongoose `enum` 검증에 직접 사용되거나, 코드 분기(`if/switch`)의 기준이 되는 값 |
| Type B | CommonCode DB (관리자 화면 입력) | UI 표시·추천 목적이며, 배포 없이 운영 중 추가/수정이 필요한 값 |

---

#### [소스코드 작업] Type A 상수 파일 생성

- [ ] `src/constants/project.ts` 신규 생성

  ```typescript
  export const PROJECT_STAGES   = ['idea', 'prototype', 'mvp', 'beta', 'launched'] as const;
  export const PROJECT_STATUSES = ['recruiting', 'in_progress', 'completed', 'paused'] as const;
  export const EXECUTION_STYLES = ['ai_heavy', 'balanced', 'traditional'] as const;

  export type ProjectStage   = (typeof PROJECT_STAGES)[number];
  export type ProjectStatus  = (typeof PROJECT_STATUSES)[number];
  export type ExecutionStyle = (typeof EXECUTION_STYLES)[number];
  ```

- [ ] `src/constants/user.ts` 신규 생성

  ```typescript
  export const LAUNCH_STYLES = ['quick', 'thorough'] as const;
  export type LaunchStyle = (typeof LAUNCH_STYLES)[number];

  // @deprecated — Phase 1에서 UserModel role 필드 optional 처리 예정
  export const USER_ROLES = ['프론트엔드', '백엔드', '디자이너', '기획'] as const;
  ```

---

#### [CommonCode DB 작업] Type B — 관리자 화면에서 신규 그룹 입력

> **[CP-0-1] DOMAIN / LOOKING_FOR / WORK_STYLE 초기값 입력 전**
>
> 에이전트는 아래 제안 태그 목록을 개발자에게 보여주고 확인을 받는다.
> 추천 태그는 서비스 첫 인상을 결정하는 UX 요소이므로 개발자가 직접 검토해야 한다.
> 개발자가 수정하거나 확인하면 그 값으로 입력을 진행한다.

- [ ] `DOMAIN` 그룹 생성 및 초기값 입력

  | code | label | order |
  |------|-------|-------|
  | local_biz | 소상공인/로컬 | 1 |
  | productivity | 생산성 | 2 |
  | education | 교육 | 3 |
  | healthcare | 헬스케어 | 4 |
  | fintech | 금융/핀테크 | 5 |
  | commerce | 커머스 | 6 |
  | entertainment | 엔터테인먼트 | 7 |
  | social | 소셜 | 8 |
  | dev_tools | 개발자 도구 | 9 |
  | realestate | 부동산 | 10 |

- [ ] `LOOKING_FOR` 그룹 생성 및 초기값 입력

  | code | label | order |
  |------|-------|-------|
  | fast_execution | 빠른 실행 | 1 |
  | domain_expert | 도메인 전문가 | 2 |
  | design_sense | 디자인 감각 | 3 |
  | planning | 기획력 | 4 |
  | async_work | 비동기 선호 | 5 |
  | long_term | 장기 프로젝트 | 6 |
  | mvp_experience | MVP 경험 | 7 |
  | ai_proficient | AI 활용 능숙 | 8 |

- [ ] `WORK_STYLE` 그룹 생성 및 초기값 입력

  | code | label | order |
  |------|-------|-------|
  | ai_heavy | AI 적극 활용 | 1 |
  | fast_launch | 빠른 출시 우선 | 2 |
  | quality_first | 완성도 우선 | 3 |
  | async_first | 비동기 선호 | 4 |
  | sync_preferred | 정기 미팅 선호 | 5 |

- [ ] `PROJECT_STAGE` 그룹 생성 및 초기값 입력

  | code | label | order |
  |------|-------|-------|
  | idea | 아이디어 단계 | 1 |
  | prototype | 프로토타입 있음 | 2 |
  | mvp | MVP 완성 | 3 |
  | beta | 베타 테스트 중 | 4 |
  | launched | 런치 완료 | 5 |

- [ ] `EXECUTION_STYLE` 그룹 생성 및 초기값 입력

  | code | label | order |
  |------|-------|-------|
  | ai_heavy | AI 적극 활용 | 1 |
  | balanced | AI와 직접 작업 균형 | 2 |
  | traditional | 직접 작업 위주 | 3 |

> **[CP-0-2] CommonCode 입력 완료 후**
>
> 관리자 화면(`/admin/common-codes`)에서 5개 그룹이 모두 정상 입력됐는지 확인한다.
> CATEGORY와 PROJECT_CATEGORY 그룹이 중복된 데이터인지 이 시점에 직접 확인한다.
> 확인 결과를 에이전트에게 알려주면 Phase 1로 진행한다.

---

#### [Impeccable 스킬 설치]

- [ ] Claude Code 기준: `npx skills add pbakaus/impeccable` 실행
  - `/polish`, `/audit`, `/typeset`, `/arrange`, `/critique` 등 디자인 커맨드 활성화
  - `.claude/` 하위에 스킬 파일 설치됨

> **`.impeccable.md` 생성은 Phase 3 완료 후에 한다.**
> 지금 실행하면 개편 전 디자인 패턴이 컨텍스트에 담겨 새 UI 작업 시 잘못된 방향으로 AI를 유도할 수 있다.

---

#### [UI 정리] 모델/API 무관한 작업

- [ ] 네비게이션에서 WBS 링크 주석 처리 (숨김)
- [ ] 랜딩 히어로 섹션 문구 변경
  - 기존: "기술스택 필터로 딱 맞는 팀원을 찾아보세요"
  - 변경: "아이디어를 빠르게 실행할 동료를 찾아보세요"

---

#### Phase 0에서 건드리지 않는 것

- `src/lib/models/` 하위 모든 파일
- `src/app/api/` 하위 모든 파일
- 기존 CommonCode 그룹 (CATEGORY, STATUS, POSITION, CAREER, PROJECT_CATEGORY)
- 칸반 보드 관련 모든 파일 / 인증(auth) 파일 / Socket.io 설정

---

#### 기존 CommonCode 그룹 처리 — Phase별 타이밍

| 그룹 | 처리 시점 | 처리 방법 |
|------|----------|----------|
| `CATEGORY` | Phase 3 (탐색 UI 교체 후) | `isActive=false` |
| `STATUS` | Phase 1 (모델 변경과 동시) | 코드값을 새 enum과 일치하도록 수정 |
| `POSITION` | Phase 7 (WBS 제거와 함께) | `isActive=false` |
| `CAREER` | Phase 7 | `isActive=false` |
| `PROJECT_CATEGORY` | Phase 7 | `isActive=false` |

---

---

### Phase 1: 데이터 모델 개편 (1~1.5일)

목표: 모델 스키마, API Route 핸들러, CommonCode DB(STATUS 그룹)를 한 번에 정합성 있게 변경한다.

> **이 Phase에서 일시적으로 깨지는 것들 (의도된 것)**
> - 프로젝트 생성 폼 → `problemStatement` required로 인해 기존 폼 제출 불가 (Phase 2에서 수정)
> - 지원 폼 → `motivation` required로 인해 기존 폼 제출 불가 (Phase 5에서 수정)

---

#### 1-0. MongoDB 컬렉션 마이그레이션 (모델 파일 수정 전 선행)

> **[CP-1-0] 아래 두 가지 마이그레이션 진행 전 확인**
>
> 두 작업 모두 실사용자가 없는 지금만 리스크 없이 가능하다.
> 에이전트는 각 작업 전 개발자에게 확인을 받고 진행한다.

**`memberbasics` → `users` 컬렉션 마이그레이션**

- [ ] MongoDB: `db.memberbasics.renameCollection('users')`
- [ ] `src/lib/models/User.ts` — 세 번째 인자 제거

  ```typescript
  // 기존
  mongoose.model<IUser>('User', UserSchema, 'memberbasics')
  // 변경 후
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
  ```

- [ ] `grep -r "memberbasics" src/` → 직접 문자열 참조 잔여 여부 확인 후 제거
- [ ] 변경 후 로그인 / 유저 조회 정상 동작 확인

> `ref: 'User'`로 연결된 모델들은 Mongoose 모델명 기준이므로 수정 불필요.

---

**`projectmembers` 컬렉션 deprecated 처리**

현재 멤버 데이터가 `projects.members` (embedded)와 `projectmembers` (별도 컬렉션) 두 곳에 분산돼 있다.
개편 후 `role` 개념이 사라지고 팀 규모가 최대 10명이므로 embedded 방식으로 통합한다.

- [ ] `projectmembers` 컬렉션 데이터를 `projects.members`로 병합 (중복 제거)
- [ ] `src/lib/models/ProjectMember.ts` — deprecated 주석 추가, 신규 import 금지
- [ ] `ProjectMember` 모델을 참조하는 API Route 확인 및 `projects.members` 방식으로 교체
- [ ] 기존 `projectmembers` 컬렉션은 당장 drop하지 않음 (Phase 7 cleanup 시 처리)

---

**`projects.tags` 타입 변경 — ObjectId 참조 → String 배열**

현재 `projects.tags`는 `techstacks` 컬렉션을 ObjectId로 참조한다.
새 모델에서는 `techStacks: [String]`으로 단순화한다.

- [ ] 기존 `projects.tags` 데이터에서 ObjectId → TechStack name 문자열로 변환
  ```typescript
  // 각 프로젝트의 tags ObjectId를 TechStack.name 으로 교체
  const stacks = await TechStack.find({ _id: { $in: project.tags } });
  project.techStacks = stacks.map(s => s.name);
  ```
- [ ] 변환 완료 후 `projects.tags` 필드 제거 (새 모델에선 `techStacks`만 사용)
- [ ] `techstacks` 컬렉션 자체는 유지 (TechStack 목록 API는 프론트 기술스택 입력 UI에서 계속 사용)

---

**`boards.ownerId` String → ObjectId 마이그레이션 (TODO 해소)**

`BoardModel.ts`에 개발자가 남긴 TODO: `"TODO: User 모델과 연결되면 ObjectId로 변경"`.
`memberbasics → users` 마이그레이션과 함께 이 TODO를 해소한다. boards 문서 12건.

- [ ] MongoDB: `boards.ownerId` String → ObjectId 변환
  ```javascript
  db.boards.find().forEach(b => {
    db.boards.updateOne({ _id: b._id }, { $set: { ownerId: new ObjectId(b.ownerId) } });
  });
  ```
- [ ] `src/lib/models/BoardModel.ts` — ownerId 타입 변경
  ```typescript
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  ```
- [ ] `IBoard` 인터페이스 — `ownerId: string` → `ownerId: mongoose.Types.ObjectId`
- [ ] 변경 후 보드 조회 및 populate 정상 동작 확인

---

#### 1-A. 모델 파일 수정

**`src/lib/models/Project.ts`**

> **`projects.author` → `ownerId` rename 포함**
> 현재 DB는 `author` 필드를 사용 중. Phase 1에서 `ownerId`로 통일한다.
> `db.projects.updateMany({}, [{ $set: { ownerId: '$author' } }, { $unset: 'author' }])` 로 마이그레이션.

| 작업 | 대상 필드 | 내용 |
|------|----------|------|
| 제거 | `requiredRoles` | `[{ role, count }]` 배열 전체 제거 |
| 제거 | `category` | 단일 String → `domains` 배열로 대체 |
| 이름 변경 | `author` → `ownerId` | ObjectId, ref: 'User' |
| 추가 | `problemStatement` | String, required, maxlength 500 |
| 추가 | `currentStage` | enum: `PROJECT_STAGES`, required, default `'idea'` |
| 추가 | `executionStyle` | enum: `EXECUTION_STYLES`, required, default `'ai_heavy'` |
| 추가 | `domains` | `[String]`, default `[]` |
| 추가 | `lookingFor` | `[String]`, default `[]` |
| 추가 | `weeklyHours` | Number, required, min 1, max 60 |
| 추가 | `durationMonths` | Number, optional |
| 추가 | `maxMembers` | Number, default 4 |
| 추가 | `links` | `{ github?, figma?, deploy?, notion? }` |
| 변경 | `status` enum | 구 코드값 → 신 `PROJECT_STATUSES` |
| 변경 | `members` 서브도큐먼트 | `{ userId, role, joinedAt }` → `{ userId, joinedAt }` |
| **유지** | `overview` | AI 지시서 템플릿 `{{overview}}` 변수로 사용 중 — 제거 금지 |
| **유지** | `resources` | AI 지시서 템플릿 `{{resources}}` 변수로 사용 중 — 제거 금지 |
| **유지** | `images` | Cloudinary 썸네일 — 등록 폼에서 선택 입력으로 유지 |
| 변경 | `deadline` | Date → 유지하되 `durationMonths`(Number)와 병행 (기존 데이터 호환) |
| 변경 | `content` | `description`으로 rename (Tiptap 리치 텍스트, 선택 입력) |
| 변경 | `likes` (Array) | → `likeCount` (Number)로 변환 |
| 변경 | `tags` (ObjectId[]) | → `techStacks` (String[])로 변환 (1-0에서 처리) |

> **`deadline` 처리 주의**: 기존 19건 프로젝트의 `deadline` Date 데이터는 보존한다.
> 새 등록 폼에서는 `durationMonths`만 받고, 기존 데이터 표시 시에는 deadline을 그대로 쓴다.
> 완전한 deadline 제거는 추후 별도 마이그레이션으로 처리.

> **`applications` 필드명 확인 필요**: 계획서는 `appliedRole`로 표기했지만 DB 스키마에는
> `role`로 보인다. Phase 1 시작 전 `Application.ts` 실제 필드명을 확인 후 제거 대상을 확정한다.

**`src/lib/models/User.ts` (memberbasics)**

추가: `bio`, `domains`, `workStyle`, `weeklyAvailability`, `preferLaunchStyle`, `onboardingStep`
변경: `role` — required 해제, deprecated 주석 추가

**`src/lib/models/Application.ts`**

제거: `appliedRole`
추가: `motivation` (required, minlength 20), `weeklyHours` (required), `ownerNote`
추가: `status` 값 `withdrawn`
추가: 복합 유니크 인덱스 `{ projectId, applicantId }`

---

#### 1-B. CommonCode DB 수정 (관리자 화면)

> **[CP-1-1] STATUS 그룹 코드값 수정 전**
>
> 에이전트는 현재 STATUS 그룹의 실제 코드값을 관리자 화면에서 확인하고 개발자에게 보여준다.
> 코드값이 예상(`01`, `02`, `03`)과 다를 수 있으므로 실제 값을 확인 후 진행한다.
> 변경 매핑을 개발자에게 제시하고 확인을 받은 후 수정한다.

| 기존 code (추정) | 신규 code | label | 비고 |
|---------|-----------|-------|------|
| `01` | `recruiting` | 모집중 | |
| `02` | `in_progress` | 진행중 | |
| `03` | `completed` | 완료 | |
| (없음) | `paused` | 일시정지 | 신규 추가 |

---

#### 1-C. API Route 수정

**`src/app/api/projects/route.ts`**

> **[CP-1-2] API 핸들러 수정 전**
>
> 에이전트는 변경된 모델 스키마를 요약해서 개발자에게 보여준다.
> 기존 API 응답 형태와 달라지는 부분(제거/추가되는 필드)을 명시하고 확인을 받는다.
> 특히 `GET /api/projects` 응답에서 `category`가 사라지고 `domains`로 바뀌는 부분을 강조한다.

POST 핸들러:
- [ ] `requiredRoles`, `category` 수신 제거
- [ ] `problemStatement` 필수 검증 추가
- [ ] `currentStage`, `executionStyle`, `weeklyHours` 필수 검증

GET 핸들러:
- [ ] `role`, `category` 쿼리 파라미터 제거
- [ ] `domain`, `stage`, `executionStyle`, `weeklyHours` 쿼리 파라미터 추가

**`src/app/api/projects/[id]/apply/route.ts`**

- [ ] `appliedRole` 수신 제거
- [ ] `motivation` 필수 검증 (없거나 20자 미만이면 400)
- [ ] `weeklyHours` 필수 검증

**`src/app/api/users/profile/route.ts`** (경로 확인 필요)

- [ ] `bio`, `domains`, `workStyle`, `weeklyAvailability`, `preferLaunchStyle` 수신 및 저장

---

#### 1-D. 서버 컴포넌트 직접 DB 조회 수정

- [ ] `src/app/page.tsx` (line 21) — STATUS 매핑 로직 확인
- [ ] `src/app/projects/page.tsx` (line 11) — STATUS 매핑 로직 확인

---

#### 1-E. 테스트 수정

- [ ] `src/app/api/projects/route.test.ts` — `problemStatement` required 검증 테스트
- [ ] `src/app/api/projects/[id]/apply/route.test.ts` — `motivation` 최소 20자 검증 테스트
- [ ] `src/app/api/projects/[id]/route.test.ts` — 신규 필드 수정 테스트

---

#### 체크포인트

> **[CP-1-3] Phase 1 완료 선언 전**
>
> 에이전트는 변경된 파일 목록과 각 파일의 핵심 변경 내용을 요약해서 보여준다.
> 의도적으로 깨진 기능 목록(프로젝트 등록 폼, 지원 폼)을 명시하고
> 개발자가 "확인했다, Phase 2로 진행하자"라고 응답하면 다음으로 넘어간다.

---

#### Phase 1 완료 기준

- [ ] 새 프로젝트 모델 기준으로 `POST /api/projects` 성공 (problemStatement 포함)
- [ ] `GET /api/projects?domain=education&stage=idea` 필터 동작
- [ ] 프로젝트 상태가 `recruiting`으로 저장되고, STATUS CommonCode label `모집중`으로 표시
- [ ] `POST .../apply` — motivation 없으면 400, 있으면 201
- [ ] User 프로필 `PATCH` — bio, domains, workStyle 저장 동작
- [ ] 위 항목 모두 테스트 통과

---

---

### Phase 2: 프로젝트 등록/수정 폼 개편 (1~1.5일)

목표: Phase 1로 인해 깨진 프로젝트 등록 폼을 새 모델 기준으로 복구하고, 수정 폼까지 같이 처리한다.

> **등록 폼 구조 결정: 단일 페이지 (섹션 분리형)**
> 섹션 순서: 핵심 정보 → 진행 현황 → 매칭 조건 → 부가 정보(접기 가능)

---

#### 2-A. 공통 컴포넌트 신규 생성

> **[CP-2-1] TagInput 컴포넌트 작성 전**
>
> 에이전트는 아래 props 인터페이스 초안을 개발자에게 보여준다.
> Phase 4(프로필 편집)에서도 재사용되므로 인터페이스가 확정돼야 중복 작업을 막을 수 있다.
> 개발자가 수정하거나 확인하면 그 인터페이스로 구현을 시작한다.

```typescript
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: { code: string; label: string }[];
  placeholder?: string;
  maxTags?: number;
  allowFreeInput?: boolean; // 기본값 true
}
```

- [ ] `src/components/common/TagInput.tsx` 신규 생성

---

#### 2-B. 프로젝트 등록 폼 개편

**CommonCode 데이터 로드**

현재: `GET /api/common-codes?group=CATEGORY` 단일 호출
변경 후: 4개 그룹 병렬 호출

> API가 `?group=DOMAIN,LOOKING_FOR` 형태 복수 조회를 지원하면 단일 호출로 통합 가능.
> Phase 2 시작 전 `GET /api/common-codes/route.ts` 확인 필요.

**폼 섹션 구성**

섹션 1 — 핵심 정보

| 필드 | 컴포넌트 | 검증 |
|------|----------|------|
| `title` | Input | required, maxlength 60 |
| `problemStatement` | Textarea | required, maxlength 500, 문자 수 카운터 |

> **[CP-2-2] `problemStatement` 플레이스홀더 문구 확정**
>
> 아래 초안을 개발자에게 보여주고 수정하거나 확인을 받는다.
> 이 문구가 사용자가 어떤 내용을 쓸지를 결정한다.
>
> 초안:
> "어떤 문제를 발견했나요? 왜 이걸 만들고 싶은지, 지금 어디까지 왔는지 솔직하게 써주세요.
> 예) 소규모 카페들이 배달앱 수수료 때문에 직접 주문 채널을 못 만들고 있다는 걸 알게 됐어요.
> MVP는 AI로 혼자 만들었는데 같이 발전시킬 분을 찾고 있어요."

섹션 2 — 진행 현황

| 필드 | 컴포넌트 | 검증 |
|------|----------|------|
| `currentStage` | 카드형 버튼 5개 | required |
| `executionStyle` | 카드형 버튼 3개 | required |
| `weeklyHours` | 버튼 그룹 | required |

> **[CP-2-3] `weeklyHours` 버튼 옵션값 확정**
>
> 아래 옵션 초안을 개발자에게 보여주고 확인을 받는다.
> 초안: 5h / 10h / 15h / 20h / 30h+

섹션 3 — 매칭 조건

| 필드 | 컴포넌트 | 비고 |
|------|----------|------|
| `domains` | TagInput | DOMAIN 그룹 추천, 자유 입력 허용 |
| `lookingFor` | TagInput | LOOKING_FOR 그룹 추천, 자유 입력 허용 |
| `maxMembers` | 버튼 그룹 | 2/3/4/5/6명 |

섹션 4 — 부가 정보 (기본 접힘)

| 필드 | 컴포넌트 | 비고 |
|------|----------|------|
| `overview` | Textarea | 선택, AI 컨텍스트 + 팀원용 상세 배경 설명 |
| `resources` | 배열 입력 (URL + 제목) | 선택, AI 컨텍스트 + 팀 참고 자료 |
| `images` | 파일 업로드 (Cloudinary) | 선택, 프로젝트 썸네일 — 기존 기능 유지 |
| `description` | Textarea | 선택, 부가 설명 (구 `content` rename) |
| `durationMonths` | 버튼 그룹 | 선택 (1 / 2 / 3 / 6개월 / 미정) |
| `techStacks` | TagInput | 선택, 참고용 |
| `links.github` | Input | 선택 |
| `links.deploy` | Input | 선택 |
| `links.notion` | Input | 선택 |

> **`overview` ≠ `problemStatement`**: `problemStatement`는 카드에 노출되는 짧은 훅(max 500자).
> `overview`는 AI 지시서 생성과 팀원 온보딩을 위한 상세 배경 설명으로 역할이 다르다.
> 두 필드는 공존하며 서로를 대체하지 않는다.
>
> **`resources` ≠ `links`**: `links`는 외부 공개 URL(GitHub, 배포 주소 등).
> `resources`는 팀 작업에 필요한 참고 자료 배열(문서, API 명세 등)로 목적이 다르다.

---

#### 2-C. 프로젝트 수정 폼 개편

- [ ] `ProjectForm.tsx`에 `initialData?: IProject` prop 추가
- [ ] 수정 폼 진입 시 기존 프로젝트 데이터 fetch → initialData로 전달
- [ ] 새 필드가 없는 경우 빈 값으로 초기화

---

#### 2-D. CommonCode 에러 처리

- [ ] fetch 실패 시 추천 칩 없이 자유 입력만으로 동작하는 fallback 처리
- [ ] 로딩 중 스켈레톤 표시

---

#### Impeccable 커맨드

Phase 2 UI 완성 후:
- `/typeset` — 폼 타이포그래피 계층 정리
- `/arrange` — 섹션 간격, 레이아웃 정렬

---

#### Phase 2 완료 기준

- [ ] `problemStatement` 포함하여 프로젝트 등록 성공 (Phase 1 breakage 해소)
- [ ] `currentStage`, `executionStyle` 카드 선택 후 저장 동작
- [ ] `domains`, `lookingFor` CommonCode 추천 칩 표시 및 자유 입력 동작
- [ ] 수정 폼 진입 시 기존 데이터 pre-fill 동작
- [ ] TagInput 컴포넌트 독립 동작 확인 (Phase 4에서 재사용 준비 완료)

---

---

### Phase 3: 프로젝트 카드 & 탐색 UI 개편 (1~1.5일)

목표: 새 모델 기반으로 프로젝트 목록/상세/필터 UI를 개편한다.

> **CATEGORY 그룹 비활성화 타이밍 주의**
> Phase 3이 끝나도 랜딩 페이지는 Phase 6까지 CATEGORY를 직접 조회한다.
> CATEGORY `isActive=false` 처리는 Phase 6에서 한다.

---

#### 3-A. ProjectCard 컴포넌트 개편

**code → label 매핑 설계**

목록 페이지에서 CommonCode를 한 번 fetch해 매핑 객체를 만들고, 카드에 prop으로 내려주는 방식.

```typescript
type CodeLabelMap = Record<string, string>;

interface ProjectCardProps {
  project: IProject;
  stageLabelMap: CodeLabelMap;
  styleLabelMap: CodeLabelMap;
}
```

**카드 레이아웃**: 썸네일 이미지(`images[0]`) → `currentStage` 배지 + 등록일 → `title` → `problemStatement` (3줄 클램프) → `lookingFor` 태그 → `executionStyle` + `weeklyHours` + 남은 자리

> 썸네일이 있는 프로젝트는 카드 상단에 이미지를 표시하고, 없는 프로젝트는 이미지 영역 없이 배지부터 시작한다. 기존 프로젝트 목록의 썸네일 중심 UX를 유지한다.

**남은 자리**: `project.maxMembers - project.members.length`

**[저장] 버튼**: 기존 `likeCount` 좋아요 기능으로 처리 (신규 북마크 기능은 범위 외)

---

#### 3-B. ProjectFilter 컴포넌트 개편

> **[CP-3-1] 필터 URL param 명명 확정**
>
> 에이전트는 아래 초안을 개발자에게 보여주고 확인을 받는다.
> URL param 명명은 배포 후 변경이 어려우므로 개발자가 직접 결정해야 한다.
>
> 초안: `?domain=education&stage=mvp&executionStyle=ai_heavy&minHours=10&status=recruiting`

제거: `role`, `category` 필터
추가: `domain` (멀티선택), `stage` (멀티선택), `executionStyle` (멀티선택), `minHours` (버튼), `status` (유지)

필터 상태: URL searchParams 방식 (서버 컴포넌트 `searchParams` props 연동)

---

#### 3-C. 프로젝트 목록 페이지

`src/app/projects/page.tsx` CommonCode 조회 변경:

```typescript
// 기존
CommonCode.find({ group: 'CATEGORY' })

// 변경 후
CommonCode.find({
  group: { $in: ['DOMAIN', 'PROJECT_STAGE', 'EXECUTION_STYLE', 'STATUS'] },
  isActive: true,
})
```

빈 상태(empty state): "조건에 맞는 프로젝트가 없어요" + [필터 초기화] + [첫 프로젝트 등록하기]

---

#### 3-D. 프로젝트 상세 페이지

`src/app/projects/[pid]/page.tsx` CommonCode 호출 변경:

기존: `?group=CATEGORY, STATUS`
변경: `?group=PROJECT_STAGE, EXECUTION_STYLE, STATUS`

레이아웃: `currentStage` + `status` 배지 → `title` + `problemStatement` → 실행 방식 → `lookingFor` → 팀 구성 → `techStacks` (접기) → CTA

---

#### 체크포인트

> **[CP-3-2] Phase 3 완료 전 — `/profile` vs `/mypage` 역할 구분 결정**
>
> Phase 4(온보딩/프로필 개편)를 시작하기 전에 이 결정이 필요하다.
> 에이전트는 현재 두 페이지의 실제 구조를 확인하고 개발자에게 보여준다.
>
> 결정 필요:
> - `/profile` — 공개 프로필 (편집 포함) / `/mypage` — 계정 설정
> - `/profile` — 읽기 전용 공개 프로필 / `/mypage` — 프로필 편집
>
> 개발자가 방향을 선택하면 Phase 4 계획에 반영 후 진행한다.

---

#### Phase 3 완료 기준

- [ ] 프로젝트 카드에 `problemStatement` 3줄 클램프로 표시
- [ ] `currentStage`, `executionStyle` CommonCode label로 표시
- [ ] 도메인/단계/실행방식 필터 동작 및 URL params 반영
- [ ] 필터 URL 공유 시 동일 결과 표시
- [ ] 필터 결과 없을 때 empty state 표시
- [ ] 프로젝트 상세 페이지 `problemStatement` 중심 레이아웃 표시
- [ ] CATEGORY CommonCode 그룹은 건드리지 않음 (Phase 6에서 처리)

---

**Impeccable — `.impeccable.md` 생성 (Phase 3 완료 직후 실행)**

Phase 3이 끝난 시점이 `/teach-impeccable`을 실행하기에 가장 적합하다.

- [ ] `/teach-impeccable` 실행 → `.impeccable.md` 생성
- [ ] `/audit` 실행 → 새 카드/탐색 UI P0~P3 이슈 확인 및 우선 처리

---

---

### Phase 4: 프로필 & 온보딩 개편 (1.5~2일)

목표: 온보딩 3스텝 플로우 구현 및 새 유저 모델 기반 프로필 개편.

> **선행 조건**: Phase 2(TagInput 컴포넌트) 완료, Phase 3(CP-3-2 `/profile`·`/mypage` 역할 결정) 완료

> **Phase 4 내 작업 순서 중요**
> 4-A(세션 확장) → 4-B(온보딩) → 4-C/D(프로필) 순서를 반드시 지킨다.

---

#### 4-A. next-auth 세션 확장 (Phase 4 최우선 작업)

- [ ] `src/types/next-auth.d.ts` — `onboardingStep: number` 추가 (Session + JWT)
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — jwt/session callback에 `onboardingStep` 주입

> **[CP-4-1] 미들웨어 온보딩 예외 경로 목록 확정**
>
> 에이전트는 현재 `middleware.ts`의 matcher 설정과 보호 경로 목록을 보여준다.
> 아래 예외 경로 초안을 개발자에게 제시하고 확인 또는 수정을 받는다.
> 누락된 경로가 있으면 무한 루프가 발생할 수 있다.
>
> 초안: `/onboarding`, `/api/`, `/login`, `/register`, `/_next`, `/favicon.ico`

- [ ] `middleware.ts` — `onboardingStep < 4` 시 `/onboarding` redirect 로직 추가

---

#### 4-B. 온보딩 페이지 (신규)

**온보딩 API**: `PATCH /api/users/onboarding` — `{ step, data }` 형태

> **[CP-4-2] 온보딩 완료/건너뛰기 후 redirect 목적지 확정**
>
> 에이전트는 두 가지 선택지를 제시한다. 개발자가 선택하면 진행한다.
>
> A. `/projects` — 맞춤 프로젝트를 바로 탐색 (온보딩 데이터 즉시 활용)
> B. `/dashboard` — 내 대시보드로 이동 (기존 동선과 일치)

**세션 갱신 (무한 루프 방지)**

온보딩 완료 후 반드시 `update({ onboardingStep: 4 })` 호출 후 redirect.

**스텝 컴포넌트**

- [ ] `OnboardingStep1.tsx` — DOMAIN 그룹 대형 카드 멀티선택
- [ ] `OnboardingStep2.tsx` — WORK_STYLE 그룹 칩 멀티선택
- [ ] `OnboardingStep3.tsx` — `weeklyAvailability` 버튼 그룹 + `preferLaunchStyle` 카드 2개

> Step 3 컴포넌트는 프로필 편집(4-D)에서 재사용되도록 처음부터 분리 설계한다.

---

#### 4-C. 프로필 페이지 개편

> **[CP-4-4] 프로필 완성도 가중치 확정**
>
> 에이전트는 아래 초안을 개발자에게 보여주고 확인을 받는다.
>
> 초안: bio(20) + domains(20) + workStyle(15) + weeklyAvailability(15) + github(20) + techStacks(10) = 100

CommonCode 로드: `DOMAIN`, `WORK_STYLE` 그룹 → code → label 매핑

레이아웃: 아바타 + 닉네임 + bio → 스탯 카드 → 완성도 게이지 → 도메인 → 스타일 → 가용성(스케줄러 또는 숫자 — CP-4-2 결정에 따름) → GitHub 통계 → 기술스택(접기) → 완료 프로젝트

완료 프로젝트 쿼리: `GET /api/projects?memberId={userId}&status=completed`

**기존 버그 수정 (CP-4-2 결정과 무관하게 반드시 수정)**

`ProfileView.tsx:159-182` — 가용성 저장 시 잘못된 API 호출 버그.

```typescript
// 현재 (잘못됨) — /api/users/me PATCH는 availability 필드를 무시함
await fetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ availability: ... }) });

// 수정 후
await fetch('/api/users/me/availability', { method: 'POST', body: JSON.stringify({ schedule, preference, personalityTags }) });
```

---

#### 4-D. 프로필 편집 개편

TagInput (Phase 2 재사용), OnboardingStep3 컴포넌트 재사용, 기존 기술스택 입력 재사용.

---

#### Impeccable 커맨드

온보딩 + 프로필 UI 완성 후:
- `/critique` — 닐슨 10 휴리스틱 + 페르소나별 UX 검증
- `/arrange` — 온보딩 스텝 간격, 버튼 위치 일관성

---

#### Phase 4 완료 기준

- [ ] 신규 가입 유저 → 자동으로 `/onboarding` redirect
- [ ] 온보딩 3스텝 완료 → `onboardingStep = 4` DB 저장 + 세션 갱신
- [ ] 온보딩 건너뛰기 → `onboardingStep = 4` + 무한 루프 없음
- [ ] 프로필 페이지에서 `domains`, `workStyle` CommonCode label로 표시
- [ ] 프로필 완성도 게이지 점수 정확히 표시
- [ ] TagInput이 Phase 2와 동일한 것 사용 (중복 구현 없음)

---

---

### Phase 5: 지원 플로우 개편 (1일)

목표: Phase 1로 인해 깨진 지원 관련 UI를 복구하고, motivation 중심 지원 플로우로 전환한다.

> **Phase 5 내 작업 순서 중요**
> 5-A(인프라) → 5-B(버튼 분기) → 5-C(모달) → 5-D(취소) → 5-E(대시보드)
> 스토어 없이 UI 먼저 만들면 연결 시 전부 다시 손봐야 한다.

---

#### 5-A. 지원 상태 조회 인프라 구축 (Phase 5 최우선 작업)

- [ ] `GET /api/applications/my` 신규 생성
- [ ] `src/store/applicationStore.ts` 신규 생성

```typescript
interface ApplicationStore {
  myApplications: Record<string, { applicationId: string; status: ApplicationStatus }>;
  fetchMyApplications: () => Promise<void>;
  addApplication: (projectId: string, applicationId: string) => void;
  withdrawApplication: (projectId: string) => void;
}
```

---

#### 5-B. 버튼 상태 분기

> **[CP-5-1] 버튼 6가지 상태 copy 및 취소 조건 확정**
>
> 에이전트는 아래 초안을 보여주고 개발자의 확인 또는 수정을 받는다.
> 특히 `accepted` 상태에서 취소 허용 여부는 비즈니스 결정이다.
>
> | 상태 | 버튼 표시 | 취소 허용 |
> |------|----------|---------|
> | 본인 프로젝트 | 없음 | — |
> | 모집 마감 | [모집 마감] disabled | — |
> | 미지원 | [이야기 나눠보기] | — |
> | pending | [지원 완료 · 취소] | O |
> | accepted | [팀원] badge | ? ← 개발자 결정 필요 |
> | rejected | [지원 마감] disabled | — |

---

#### 5-C. ApplyModal 개편

프로젝트 컨텍스트 표시 (모달 상단): `title`, `problemStatement` 2줄, `weeklyHours`, `lookingFor`

입력 필드: `motivation` (필수, 최소 20자, 카운터 표시) + `weeklyHours` 버튼 그룹 + `message` (선택)

`weeklyHours`: 유저 `weeklyAvailability` 값으로 pre-fill

제출 성공 후: `applicationStore.addApplication()` 호출 (re-fetch 없이 즉시 버튼 상태 전환)

---

#### 5-D. 지원 취소 (withdraw)

`PATCH /api/applications/[id]/withdraw` — Phase 1에서 API 작성됨.

취소 진입점: 카드/상세의 [지원 완료 · 취소] 버튼 + 대시보드 내 [취소] 버튼

---

#### 5-E. 대시보드 지원 현황 UI 수정

`dashboard/page.tsx`, `dashboard/[pid]/page.tsx`:
- `appliedRole` 표시 제거
- `motivation` 앞 50자 + "..." 표시
- `weeklyHours` 표시
- `ownerNote` 입력란 추가

> CATEGORY 의존성은 이 Phase에서 건드리지 않는다 (Phase 6에서 처리).

---

#### Impeccable 커맨드

ApplyModal + 대시보드 수정 후:
- `/polish` — 지원 플로우 전반 시각 정리

---

#### Phase 5 완료 기준

- [ ] `GET /api/applications/my` 정상 동작
- [ ] 이미 지원한 프로젝트에서 [지원 완료 · 취소] 표시
- [ ] `motivation` 20자 미만 시 제출 버튼 비활성화
- [ ] 지원 취소 후 버튼 상태 즉시 [이야기 나눠보기]로 복귀 (re-fetch 없이)
- [ ] 대시보드에서 `motivation` 표시, `appliedRole` 제거 (Phase 1 breakage 해소)

---

---

### Phase 6: 랜딩 페이지 개편 (1~1.5일)

목표: 새 포지셔닝 반영, 비회원 프로젝트 미리보기 추가, CATEGORY 의존성 전체 정리 및 비활성화.

> **Phase 6 시작 전 준비 필요 (개발 세션 외 작업)**
> 기능 소개 섹션에 사용할 실제 스크린샷 또는 GIF를 미리 캡처해둔다.

---

#### 6-A. CATEGORY 의존성 전체 정리

> **[CP-6-1] CATEGORY 비활성화 전 최종 확인**
>
> 에이전트는 아래 세 파일에서 CATEGORY 관련 코드가 제거됐는지 확인하고 결과를 보여준다.
> 세 파일 모두 제거 완료된 것을 개발자가 확인하면 그때 `isActive=false`로 변경한다.
>
> - `src/app/page.tsx` — `CommonCode.find({ group: 'CATEGORY' })` 제거 여부
> - `src/app/dashboard/page.tsx` — CATEGORY 조회 제거 여부
> - `src/app/dashboard/[pid]/page.tsx` — CATEGORY 조회 제거 여부

- [ ] 세 파일의 CATEGORY 의존성 제거
- [ ] 관리자 화면에서 CATEGORY `isActive = false`

---

#### 6-B. 비회원 프로젝트 미리보기

비회원 접근 범위: 카드 3개 + 상세 페이지 허용 / [이야기 나눠보기] 클릭 시만 로그인 redirect

서버 컴포넌트 직접 조회:
```typescript
const previewProjects = await Project.find({ status: 'recruiting' })
  .sort({ createdAt: -1 })
  .limit(3)
  .lean();
```

카드 0개인 경우: "아직 등록된 프로젝트가 없어요. 첫 번째로 시작해보세요!" + [프로젝트 등록하기]

---

#### 6-C. 랜딩 페이지 섹션 재구성

> **[CP-6-2] 히어로 헤드라인 및 서브 문구 최종 확정**
>
> 에이전트는 아래 초안을 보여주고 개발자의 수정 또는 확인을 받는다.
> 문구가 서비스 포지셔닝을 대표하므로 개발자가 직접 결정해야 한다.
>
> 헤드라인 초안: "아이디어를 빠르게 실행할 동료를 찾아요"
> 서브 초안: "기술 역할이 아니라 같은 문제에 꽂힌 사람을 찾는 팀 매칭 플랫폼"

> **[CP-6-3] 스크린샷/GIF 자산 준비 여부 확인**
>
> 기능 소개 섹션(AI 지시서 / 팀 매칭 / 실시간 협업)에 실제 화면 자산이 필요하다.
> 에이전트는 자산 준비 여부를 개발자에게 묻는다.
> 준비 안 됐으면 placeholder로 처리하고 추후 교체한다.
> 준비됐으면 파일 경로를 알려주면 반영한다.

섹션 순서: 히어로 → 비회원 프로젝트 미리보기 3개 → 핵심 기능 소개(AI 지시서 → 팀 매칭 → 실시간 협업) → CTA

제거: 숫자 지표 섹션 (초기엔 숫자가 작아 역효과)

---

#### 6-D. SEO 메타데이터

```typescript
export const metadata: Metadata = {
  title: 'Side Project Mate — 사이드 프로젝트 팀 매칭 플랫폼',
  description: '아이디어를 빠르게 실행할 동료를 찾아요. AI 칸반 보드로 함께 만들어가는 팀 매칭 플랫폼.',
};
```

---

#### 6-E. 푸터 & 공지사항 정리

- [ ] 소셜 링크 없으면 섹션 제거
- [ ] 공지사항 `href="#"` → 제거 또는 실제 페이지 연결

---

#### Impeccable 커맨드

랜딩 완성 후:
- `/audit` — 첫 인상 디자인 품질 점수 확인
- `/polish` — 이슈 처리 후 최종 마무리
- `/overdrive` — 선택적, 랜딩에 탁월한 시각 효과 적용 (베타)

---

#### Phase 6 완료 기준

- [ ] 비회원이 `/` 접근 시 프로젝트 카드 3개 표시
- [ ] 비회원 [이야기 나눠보기] 클릭 → 로그인 redirect
- [ ] `page.tsx` CommonCode.find() 직접 조회 코드 제거
- [ ] CATEGORY 그룹 `isActive = false`
- [ ] 랜딩 히어로 문구 새 포지셔닝 반영
- [ ] AI 지시서 기능이 기능 소개 첫 번째 배치
- [ ] 숫자 지표 섹션 제거

---

---

### Phase 7: WBS 제거 (0.5일)

목표: Phase 0에서 숨겨둔 WBS를 코드 레벨에서 실제 정리하고, 잔여 CommonCode 그룹을 비활성화한다.

---

#### 7-A. WBS 라우트 및 컴포넌트 정리

- [ ] `/wbs/**` → `/dashboard` redirect
- [ ] 네비게이션 WBS 링크 코드 삭제 (Phase 0의 주석 처리 → 실제 제거)
- [ ] 대시보드에서 WBS 관련 섹션 제거

> **[CP-7-1] WBS 파일 삭제 전**
>
> 에이전트는 `grep` 또는 코드 검색으로 `wbs/` 컴포넌트와 `wbsStore.ts`를
> import하는 파일 목록을 찾아 개발자에게 보여준다.
> 참조가 없음을 확인한 후에 파일 삭제를 진행한다.
> 참조가 남아있으면 해당 파일도 함께 정리한 후 삭제한다.

- [ ] `src/components/wbs/**` 파일 삭제
- [ ] `src/store/wbsStore.ts` 파일 삭제

---

#### 7-B. WBS API 정리

- [ ] `src/app/api/wbs/**` — 모든 handler를 410 Gone 응답으로 교체

```typescript
return NextResponse.json(
  { success: false, message: 'WBS 기능은 서비스 개편으로 종료되었습니다.' },
  { status: 410 }
);
```

WBS 모델 파일과 DB 컬렉션은 삭제하지 않음 (추후 cleanup PR).

---

#### 7-C. CommonCode 잔여 그룹 비활성화

관리자 화면에서:
- [ ] `POSITION` 그룹 `isActive = false`
- [ ] `CAREER` 그룹 `isActive = false`
- [ ] `PROJECT_CATEGORY` 그룹 `isActive = false`

---

#### 7-D. 고아 리소스 정리 (DB 스키마 분석 기반)

코드에서 참조하지 않는 완전한 dead resource들을 Phase 7에서 함께 정리한다.

**`posts` 컬렉션 / `Post.ts` 모델**

- [ ] `src/lib/models/Post.ts` 파일 삭제
- [ ] MongoDB: `db.posts.drop()`

**`comments` 컬렉션 / `Comment.ts` 모델**

- [ ] `src/lib/models/Comment.ts` 파일 확인 — import 참조 없으면 삭제
- [ ] MongoDB: `db.comments.drop()` (0 docs, 미구현 기능)

**`projectmembers` 컬렉션** (Phase 1에서 데이터 병합 완료 후)

- [ ] Phase 1에서 `projects.members`로 데이터 병합이 완료됐는지 확인
- [ ] 확인 후 MongoDB: `db.projectmembers.drop()`
- [ ] `src/lib/models/ProjectMember.ts` 파일 삭제

> Phase 1에서 `ProjectMember.ts`에 deprecated 주석만 달아두고 실제 파일 삭제는 여기서 처리한다.

---

#### Phase 7 완료 기준

- [ ] `/wbs/**` 접근 시 `/dashboard`로 redirect
- [ ] WBS 네비게이션 링크 완전 제거
- [ ] WBS API 전체 410 응답
- [ ] POSITION, CAREER, PROJECT_CATEGORY `isActive = false`
- [ ] `wbs/` 컴포넌트 및 스토어 파일 삭제 (import 참조 없음 확인 후)

---

---

### Phase 8: AI 칸반 연동 강화 (1~1.5일)

목표: 프로젝트 생성 → 칸반 자동 연동, AI 컨텍스트 업데이트, 잔여 미완성 항목 처리.

> **건드리면 안 되는 것 (Phase 8 내내 유지)**
> - `SectionItem.tsx` — `childNodeCacheRef` / `childSectionCacheRef` 드래그 DOM 캐시 구조
> - `boardStore.ts` — `applyRemote*` 함수들 (temporal/zundo Undo/Redo 동기화 로직)
> - `boardStore.ts` — `moveNote` 내 섹션 매칭 sort 로직
> - `SectionItem.tsx` — 리사이즈 캡처 로직 (`childSectionIds` 필터)
> - `gemini.ts` — `tryGenerate` + fallback 루프

---

#### 8-A. 프로젝트 생성 → 칸반 자동 연동

> **[CP-8-1] 칸반 자동 생성 실패 시 fallback 정책 확정**
>
> 에이전트는 두 가지 선택지를 제시한다. 개발자가 선택하면 진행한다.
>
> A. 프로젝트 생성도 실패로 처리 (트랜잭션, 강한 정합성)
> B. 프로젝트 생성은 성공, 칸반 생성 실패는 로그만 남김 (권장 — UX 우선)
>
> 현재 계획서는 B를 권장하지만 개발자가 최종 결정한다.

`POST /api/projects` 핸들러에서:
1. 프로젝트 생성
2. Board 자동 생성 (find-or-create)
3. "아이디어" 섹션 자동 생성
4. `problemStatement` → 첫 노트 자동 생성

기존 프로젝트(보드 없는 경우): 대시보드 칸반 버튼 클릭 시 lazy 생성

---

#### 8-B. 칸반 접근 권한 확인

- [ ] 칸반 API에서 `Project.members` 기반 권한 체크 로직 확인 및 보완
- [ ] 지원 수락 → `Project.members` 추가 → 칸반 접근 플로우 E2E 확인

---

#### 8-C. `buildAiContext.ts` 업데이트

> **[CP-8-2] `buildAiContext.ts` 수정 내용 리뷰**
>
> 에이전트는 수정된 `buildAiContext.ts`의 변경 내용을 개발자에게 보여준다.
> AI 지시서 품질에 직접 영향을 미치므로 개발자가 직접 확인해야 한다.
> 특히 `problemStatement`가 컨텍스트에 제대로 포함됐는지 확인한다.

| 기존 | 변경 |
|------|------|
| `category` 라벨 | `domains` 배열로 교체 |
| `requiredRoles` | 제거 |
| (없음) | `problemStatement` 추가 |
| (없음) | `executionStyle`, `currentStage` 추가 |

---

#### 8-D. AI 컨텍스트 관리자 페이지 — ✅ 완료됨 (2026-03-29)

`work-logs/2026-03-29-kimis-4a316be.md` 기준으로 구현 완료.

| 파일 | 상태 |
|------|------|
| `src/lib/models/AiSettings.ts` | ✅ |
| `src/lib/utils/ai/renderTemplate.ts` | ✅ (8개 테스트 통과) |
| `src/lib/utils/board/generateBoardMarkdown.ts` | ✅ |
| `src/app/api/ai/generate-instruction/route.ts` | ✅ SSE 스트리밍 |
| `src/app/admin/ai-settings/page.tsx` | ✅ 관리자 3탭 UI |
| `src/components/board/InstructionModal.tsx` | ✅ |
| `src/store/instructionStore.ts` | ✅ |

**잔여 미완성 항목**

- [ ] Gemini API 할당량 활성화 후 지시서 생성 E2E 테스트
- [ ] 사용량 통계 API `GET /api/admin/ai-settings/usage` — 미구현
- [ ] MD Export 기능 (KANBAN_MD_EXPORT_PLAN) — 미착수

---

#### 8-E. 일괄 완료 기능 (기존 미완성)

- [ ] `BoardShell.tsx` — 멀티셀렉트 시 헤더 액션바 [✅ 선택 완료] 버튼
- [ ] `PUT /api/kanban/notes/batch` — 일괄 status 변경 API
- [ ] `boardStore.ts` — 일괄 완료 액션 추가 (temporal 패턴 주의)

---

#### 8-F. 대시보드 → 칸반 진입 플로우 확인

- [ ] 대시보드 내 칸반 보드 진입 버튼 동작 확인
- [ ] 프로젝트 상세 페이지에서 팀원일 경우 [칸반 보드 열기] 표시
- [ ] 비팀원에게는 미노출

---

#### Impeccable 커맨드

AI 칸반 UI 완성 후:
- `/critique` — 핵심 차별 기능 UX 최종 검증

---

#### Phase 8 완료 기준

- [ ] 새 프로젝트 생성 시 칸반 보드 + "아이디어" 섹션 + problemStatement 노트 자동 생성
- [ ] `buildAiContext.ts` 업데이트 후 지시서 생성 정상 동작 확인
- [ ] Gemini API E2E 테스트 통과
- [ ] 사용량 통계 API 구현
- [ ] 멀티셀렉트 후 [✅ 선택 완료] 일괄 완료 동작

---

## 6. Phase 간 의존성

```
Phase 0 (어휘 확정)
    ↓
Phase 1 (모델 개편)  ← 모든 Phase의 기반
    ↓
Phase 2 (등록 폼)   Phase 3 (카드/탐색)   Phase 4 (프로필/온보딩)
    ↓                      ↓                       ↓
Phase 5 (지원 플로우)  ←────┘                       │
    ↓                                               │
Phase 6 (랜딩)  ←──────────────────────────────────┘
    ↓
Phase 7 (WBS 제거)
    ↓
Phase 8 (AI 칸반 연동)
```

Phase 2, 3, 4는 Phase 1 완료 후 병렬 진행 가능.

---

## 7. Phase별 우선도 · 난이도 · 영향 범위

### 평가 기준

| 축 | 설명 |
|---|---|
| 우선도 | 다른 Phase의 진행이 이 Phase에 막히는 정도. **긴급** = critical path |
| 난이도 | 구현 과정의 트리키함. 단순 반복 vs 새로운 설계 판단 필요 여부 |
| 영향 범위 | 잘못 구현했을 때 얼마나 많은 기능이 깨지는가 |
| 실패 리스크 | 실수 발생 시 복구 비용과 연쇄 장애 가능성 |

### Phase별 평가표

| Phase | 우선도 | 난이도 | 영향 범위 | 실패 리스크 |
|-------|--------|--------|----------|-----------|
| 0. 어휘 확정 | 긴급 | 낮음 | 없음 | 낮음 |
| 1. 모델 개편 | 긴급 | 중간 | 광범위 | 높음 |
| 2. 등록 폼 | 높음 | 중간 | 국소적 | 중간 |
| 3. 카드/탐색 UI | 높음 | 중간 | 중간 | 중간 |
| 4. 프로필/온보딩 | 중간 | 높음 | 중간 | 높음 |
| 5. 지원 플로우 | 높음 | 중간 | 국소적 | 중간 |
| 6. 랜딩 개편 | 낮음 | 낮음 | 중간 | 낮음 |
| 7. WBS 제거 | 낮음 | 낮음 | 국소적 | 낮음 |
| 8. AI 칸반 연동 | 높음 | 중간 | 중간 | 중간 |

### Phase별 상세 설명

**Phase 0 — 우선도: 긴급 / 리스크: 낮음**

Phase 1이 import할 상수 파일이 없으면 모델 작성 자체가 시작되지 않는다. 순서를 어기면 안 되지만, 작업 자체는 가장 단순하다. CommonCode DB 입력은 배포 없이 관리자 화면에서 즉시 가능하다.

**Phase 1 — 우선도: 긴급 / 리스크: 높음**

전체 개편의 근간. Phase 2~8이 전부 이 Phase의 결과에 의존한다. **STATUS CommonCode 코드값 변경과 모델 수정이 타이밍이 맞아야** 기존 화면이 일시적으로도 안 깨진다.

**Phase 2 — 우선도: 높음 / 리스크: 중간**

Phase 1 breakage를 가장 빠르게 해소하는 Phase. `TagInput.tsx`의 품질이 Phase 4에 직접 영향을 주므로, 처음부터 재사용을 염두에 두고 props 인터페이스를 설계해야 한다.

**Phase 3 — 우선도: 높음 / 리스크: 중간**

code→label 매핑을 카드 단위가 아닌 페이지 단위에서 처리하는 설계 결정이 핵심이다. CATEGORY CommonCode 비활성화를 이 Phase에서 하지 않는 것도 중요한 제약이다.

**Phase 4 — 우선도: 중간 / 난이도: 높음 / 리스크: 높음**

Phase 전체에서 난이도가 가장 높다. `next-auth` JWT 토큰 주입, 미들웨어 예외 경로, 온보딩 완료 후 세션 갱신(`update()`) 세 가지가 모두 맞아야 무한 루프 없이 동작한다.

**Phase 5 — 우선도: 높음 / 리스크: 중간**

`applicationStore`가 Phase 5 전체 UI를 떠받치는 구조다. **5-A(인프라) → 5-B → 5-C 순서**가 지켜져야 이중 작업을 막을 수 있다.

**Phase 6 — 우선도: 낮음 / 리스크: 낮음**

기능보다 포지셔닝 정리가 목적이다. CATEGORY 비활성화 전에 대시보드 의존성 제거(6-A)가 선행되어야 한다는 순서 제약이 있다.

**Phase 7 — 우선도: 낮음 / 리스크: 낮음**

기능 제거라 리스크가 가장 낮다. WBS 컴포넌트 삭제 전 import 참조 확인만 주의하면 된다.

**Phase 8 — 우선도: 높음 / 리스크: 중간**

`buildAiContext.ts` 업데이트를 빠뜨리면 이미 완성된 AI 지시서 시스템이 구 모델 기준으로 동작한다. Phase 1 직후에 이 파일을 업데이트하는 것을 잊지 않도록 주의.

---

## 8. 각 개발 세션 시작 시 참고사항

- `counters` 컬렉션 — `pid` 자동 증가 시스템. Board가 `pid`로 프로젝트 참조하므로 절대 건드리지 않음
- `techstacks` 컬렉션 — Phase 1에서 `projects.tags` ObjectId를 String으로 변환할 때 참조하므로 삭제하지 않음
- `reviews` 컬렉션 — 0 docs, 추후 확장 예정. 당장 건드리지 않음

### 스텝 완료 보고 프로토콜

에이전트는 각 서브스텝 완료 후 **반드시** 아래 형식으로 보고한다.
개발자의 확인 없이 다음 스텝으로 넘어가지 않는다.

```
✅ [스텝명] 완료

📁 수정된 파일
  - `경로/파일명` — 변경 내용 한 줄 요약

🔍 확인 방법
  - 접속: http://localhost:3000/[경로]
  - 동작: [무엇을 클릭하거나 입력할지]
  - 예상 결과: [정상이면 어떻게 보여야 하는지]

⚠️  확인이 어려운 경우 (백엔드 전용 작업)
  - 다음 스텝 완료 후 함께 확인 가능한 경우 명시
  - 또는 curl / 테스트 명령어 제공

⏭️ 다음 스텝: [다음에 할 작업 이름]
   개발자 확인 후 진행하겠습니다.
```

> **UI 변경이 없는 순수 백엔드 작업**(모델 파일, 마이그레이션 스크립트 등)은
> 확인 방법에 "다음 API 스텝 완료 후 [URL]에서 함께 확인 가능"으로 명시한다.
> 에이전트가 "확인 방법 없음"으로 넘어가는 것을 금지한다.

---

### 건드리면 안 되는 파일 (전 Phase 공통)
- `src/components/board/SectionItem.tsx` — `childNodeCacheRef`, `childSectionCacheRef`, 리사이즈 캡처 로직
- `src/store/boardStore.ts` — `applyRemote*` 함수들, `moveNote` 섹션 매칭 sort 로직
- `server.ts` — Socket.io 이벤트 핸들러
- `src/lib/socket.ts` — 소켓 싱글톤
- `src/lib/ai/providers/gemini.ts` — `tryGenerate` + fallback 루프

### 코딩 컨벤션 체크리스트
- `@/` import 별칭 사용 (상대 경로 금지)
- API Route: `export const dynamic = 'force-dynamic'` + `await dbConnect()` 필수
- 클라이언트 컴포넌트: 파일 최상단 `'use client'` 선언
- 응답 형식: `{ success: true, data: {...} }` / `{ success: false, message: '...' }`
- Mongoose 모델: `mongoose.models.Foo || mongoose.model<IFoo>('Foo', FooSchema)` 패턴

### 테스트 작성 기준
- Phase 1 API 변경 시: route.test.ts 업데이트 필수
- 새 유틸 함수 추가 시: 순수 함수 테스트 작성
- 새 스토어 추가 시: 스토어/훅 테스트 작성

### Impeccable 커맨드 Phase별 활용 가이드

> Phase 0에서 설치 완료, Phase 3 이후 `.impeccable.md` 생성 기준.

| Phase | 커맨드 | 실행 시점 | 목적 |
|-------|--------|----------|------|
| 2 | `/typeset` | 등록 폼 UI 완성 후 | 폼 타이포그래피 계층 정리 |
| 2 | `/arrange` | 등록 폼 UI 완성 후 | 섹션 간격, 레이아웃 정렬 |
| 3 | `/teach-impeccable` | Phase 3 완료 직후 | `.impeccable.md` 생성 — 이후 모든 Phase에 자동 적용 |
| 3 | `/audit` | `/teach-impeccable` 직후 | 새 카드/탐색 UI P0~P3 이슈 파악 |
| 4 | `/critique` | 온보딩 + 프로필 UI 완성 후 | 닐슨 10 휴리스틱 기준 UX 검증 |
| 4 | `/arrange` | 온보딩 스텝 UI 완성 후 | 스텝 간 간격, 버튼 위치 일관성 |
| 5 | `/polish` | ApplyModal + 대시보드 수정 후 | 지원 플로우 전반 시각 정리 |
| 6 | `/audit` | 랜딩 개편 완성 후 | 첫 인상 디자인 품질 점수 확인 |
| 6 | `/polish` | `/audit` 이슈 처리 후 | 랜딩 최종 마무리 |
| 8 | `/critique` | AI 칸반 UI 완성 후 | 핵심 차별 기능 UX 최종 검증 |

---

## 9. Phase별 테스트 확인 위치 레퍼런스

> 에이전트가 스텝 완료 보고 시 참조하는 확인 위치 목록.
> 개발 서버 기준: `http://localhost:3000`

### Phase 0

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| 상수 파일 생성 | 코드 에디터 | `src/constants/project.ts`, `user.ts` 파일 내용 확인 |
| CommonCode 그룹 입력 | `/admin/common-codes` | DOMAIN, LOOKING_FOR, WORK_STYLE, PROJECT_STAGE, EXECUTION_STYLE 5개 그룹 노출 확인 |
| Impeccable 설치 | Claude Code 터미널 | `/audit` 커맨드 입력 시 응답 확인 |
| 랜딩 문구 변경 | `/` | 히어로 섹션 새 문구 확인 |

### Phase 1

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| memberbasics → users | MongoDB Atlas or Compass | `users` 컬렉션에 18건 존재 확인 |
| boards.ownerId String → ObjectId | `/dashboard` 또는 `/dashboard/[pid]` | 칸반 보드 정상 진입 확인 |
| projectmembers deprecated | `/dashboard/[pid]` | 팀원 목록 정상 표시 확인 |
| projects.tags → techStacks | `/projects/[pid]` | 기술스택 라벨 정상 표시 확인 |
| projects.author → ownerId | `/projects/[pid]` | 오너 정보 정상 표시 확인 |
| deadline 제거 | MongoDB | `db.projects.findOne()` — deadline 필드 없음 확인 |
| STATUS CommonCode 코드값 수정 | `/projects` 목록 | 프로젝트 상태 라벨 (모집중 / 진행중 / 완료) 정상 표시 |
| POST /api/projects 수정 | `/projects/new` | problemStatement 없이 제출 → 에러 / 있으면 성공 |
| GET /api/projects 수정 | `/api/projects?domain=education` 브라우저 직접 입력 | JSON 응답에 domain 필터 동작 확인 |

### Phase 2

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| TagInput 컴포넌트 | `/projects/new` — Section 3 | 추천 칩 클릭, 직접 입력, X 버튼 제거 |
| 등록 폼 (Section 1~3) | `/projects/new` | problemStatement 입력 → currentStage 카드 선택 → domains 태그 선택 → 저장 |
| 등록 폼 (Section 4 부가정보) | `/projects/new` — 부가정보 펼치기 | overview, resources, images, techStacks 입력 후 저장 |
| 수정 폼 | `/projects/[pid]/edit` | 기존 데이터 pre-fill 확인, 저장 후 상세 페이지 반영 |
| Impeccable | Claude Code | `/typeset`, `/arrange` 실행 |

### Phase 3

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| ProjectCard | `/projects` | problemStatement 3줄 클램프, currentStage 한글 라벨, 썸네일 표시 |
| ProjectFilter | `/projects?domain=education&stage=mvp` | 필터 칩 선택 → URL 변경 → 목록 필터링 |
| 빈 상태 | `/projects?domain=realestate` (결과 없는 필터) | empty state 화면 표시 |
| 프로젝트 상세 | `/projects/[pid]` | problemStatement 중심 레이아웃, lookingFor 태그, 기술스택 접기 |
| /teach-impeccable | Claude Code | 실행 후 `.impeccable.md` 파일 생성 확인 |

### Phase 4

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| next-auth 세션 확장 | 로그인 후 개발자도구 → Application → Cookies | next-auth.session-token 디코딩 시 `onboardingStep` 필드 존재 확인 |
| 미들웨어 리다이렉트 | 신규 계정 로그인 후 임의 URL 접속 | `/onboarding`으로 자동 이동 확인 |
| 온보딩 Step 1 | `/onboarding` | DOMAIN 카드 표시 → 선택 → 다음 버튼 |
| 온보딩 Step 2 | `/onboarding` (Step 2) | WORK_STYLE 칩 표시 → 선택 → 다음 버튼 |
| 온보딩 Step 3 | `/onboarding` (Step 3) | AvailabilityScheduler 격자 드래그 → 저장 |
| 온보딩 완료 | 온보딩 Step 3 완료 후 | 지정 목적지로 리다이렉트 + 다시 `/onboarding` 접속 시 리다이렉트 없음 확인 |
| 건너뛰기 | `/onboarding` — 건너뛰기 클릭 | 완료 처리 후 무한루프 없이 이동 확인 |
| 프로필 페이지 | `/profile` 또는 `/mypage` | bio, domains 라벨, workStyle 라벨, 완성도 게이지 표시 |
| 프로필 편집 | 편집 화면 | bio 저장, TagInput 동작, 스케줄러 저장 후 조회 시 반영 |
| availability 버그 수정 | `/profile` 편집 화면 | 스케줄러 저장 후 페이지 새로고침 → 저장된 시간 그대로 표시 |

### Phase 5

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| GET /api/applications/my | 브라우저 개발자도구 → Network | 로그인 후 API 응답에 내 지원 목록 확인 |
| applicationStore | 개발자도구 → Zustand DevTools | `myApplications` 상태 키 존재 확인 |
| 버튼 상태 분기 | `/projects` 목록 | 미지원 프로젝트 → [이야기 나눠보기] / 이미 지원한 프로젝트 → [지원 완료·취소] |
| 본인 프로젝트 | `/projects` — 내가 만든 프로젝트 카드 | 버튼 없음 확인 |
| ApplyModal | 프로젝트 카드 → [이야기 나눠보기] 클릭 | motivation 20자 미만 → 제출 버튼 비활성화 / 이상 → 활성화 |
| 지원 취소 | 이미 지원한 카드 → [지원 완료·취소] 클릭 | 확인 모달 → 취소 → 버튼 즉시 [이야기 나눠보기]로 전환 |
| 대시보드 | `/dashboard` | appliedRole 없고 motivation 앞 50자 표시 확인 |
| 오너 지원자 관리 | `/dashboard/[pid]` — 내 프로젝트 | motivation 전문, weeklyHours 표시 확인 |

### Phase 6

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| CATEGORY 의존성 제거 | `/dashboard`, `/dashboard/[pid]` | 페이지 정상 로드 확인 (오류 없음) |
| CATEGORY 비활성화 | `/admin/common-codes` | CATEGORY 그룹 isActive=false 확인 |
| 비회원 프로젝트 미리보기 | 시크릿 모드 → `/` | 프로젝트 카드 3개 표시 확인 |
| 비회원 상세 접근 | 시크릿 모드 → 카드 클릭 | 상세 페이지 정상 접근 확인 |
| 비회원 지원 차단 | 시크릿 모드 → [이야기 나눠보기] 클릭 | 로그인 페이지로 redirect 확인 |
| 히어로 문구 | `/` | 새 헤드라인, 서브 문구 확인 |
| SEO 메타데이터 | 브라우저 탭 제목, 소셜 공유 미리보기 | title, description 태그 확인 |

### Phase 7

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| WBS 링크 제거 | 네비게이션 | WBS 메뉴 없음 확인 |
| WBS redirect | `/wbs` 직접 접속 | `/dashboard`로 자동 이동 확인 |
| WBS API 410 | 브라우저 또는 curl `GET /api/wbs/tasks` | 410 Gone 응답 확인 |
| posts 정리 | MongoDB | `db.posts.findOne()` → null 확인 |
| comments 정리 | MongoDB | `db.comments.findOne()` → null 확인 |

### Phase 8

| 스텝 | 확인 위치 | 확인 방법 |
|------|----------|----------|
| 칸반 자동 생성 | `/projects/new` 에서 새 프로젝트 등록 | 등록 완료 후 `/dashboard/[pid]` → 칸반 보드에 "아이디어" 섹션 + 첫 노트 확인 |
| 기존 프로젝트 lazy 생성 | `/dashboard/[기존pid]` → 칸반 버튼 클릭 | 보드 없는 프로젝트도 자동 생성 후 진입 확인 |
| buildAiContext 업데이트 | 칸반 보드 → [AI 지시서] 버튼 → 지시서 생성 | 생성된 마크다운에 `problemStatement` 내용 포함 여부 확인 |
| 칸반 접근 권한 | 팀원 계정으로 로그인 → `/dashboard/[pid]` | 팀원은 칸반 접근 가능, 비팀원은 차단 확인 |
| 일괄 완료 | 칸반 보드 → 노트 멀티선택 | [✅ 선택 완료] 버튼 표시 → 클릭 후 완료 탭으로 이동 확인 |
| Gemini E2E | 칸반 보드 → AI 지시서 생성 | 실제 마크다운 결과물 출력 확인 |

---

## 10. 추후 확장 (이번 개편 범위 외)

- 완료 프로젝트 쇼케이스 페이지
- 도메인 × 유저 도메인 교집합 기반 프로젝트 추천 API
- 팀원 상호 리뷰 시스템 (프로젝트 완료 후)
- 인앱 알림 시스템 (지원 수락/거절, 새 지원자)
- 프로젝트 카드 → 공개 SNS 공유 기능

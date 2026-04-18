# Side Project Mate

사이드 프로젝트 팀원 매칭 + 실시간 협업 플랫폼

개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고, 칸반 보드 / WBS(간트 차트) / 실시간 채팅 / AI 어시스턴트까지 한 곳에서 협업할 수 있는 풀스택 웹 애플리케이션입니다.

> **Live**: Render.com 배포 (main 브랜치 push 시 자동 배포)

---

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [API 엔드포인트 개요](#api-엔드포인트-개요)
- [Socket.io 실시간 이벤트](#socketio-실시간-이벤트)
- [테스트](#테스트)
- [AI 개발 가이드 (바이브코딩)](#ai-개발-가이드-바이브코딩)
- [배포](#배포)
- [트러블슈팅](#트러블슈팅)
- [기여하기](#기여하기)

---

## 주요 기능

### 인증 (Authentication)

- 이메일/비밀번호 기반 회원가입 및 로그인
- NextAuth 기반 세션 관리 (JWT + bcryptjs 해싱)
- 미들웨어 기반 접근 제어 (인증 필요 페이지 보호)

### 프로젝트 관리 (Project Management)

- **프로젝트 생성**: 썸네일 드래그 & 드롭 업로드(Cloudinary), 기술 스택 태그 선택, Tiptap 리치 텍스트 에디터
- **프로젝트 탐색**: 카테고리/상태/정렬 필터링, 키워드 검색, 좋아요
- **통합 대시보드**: 프로젝트별 칸반 보드 + WBS를 한 화면에서 관리
- **멤버 관리**: 멤버 추가/제거, 역할 관리
- **리소스 관리**: 프로젝트별 링크/파일 리소스 등록

### 프로필 & 개발자 지표 (Profile & Stats)

- **온보딩 위저드**: 초기 가입 시 직군, 경력, 기술 스택 등 단계별 입력 가이드
- **프로필 관리**: 기본 정보, 커뮤니케이션 성향(MBTI, 온/오프라인 선호도)
- **기술 스택**: `skillicons.dev` 기반 아이콘 UI, 주요 기술 및 숙련도 시각화
- **개발자 활동 지표**:
  - **GitHub 연동**: 커밋 활동(Green Light), 언어 사용량, Top Skills 분석
  - **Solved.ac (백준)**: 알고리즘 티어, 랭크, 스트릭 카드
  - **Tech Blog**: Velog 등 기술 블로그 최신 글 RSS 자동 수집
- **가용성 스케줄러**: 주간 협업 가능 시간 드래그 선택 및 시각화

### 지원 시스템 (Application System)

- 희망 역할 선택 및 지원 메시지 작성
- 프로젝트 오너가 지원자 목록 확인 및 수락/거절 처리
- 수락 시 자동으로 프로젝트 멤버 등록 + 알림 발송
- 마이페이지에서 본인 지원 내역 및 상태 확인

### 칸반 보드 (Kanban Board)

- `dnd-kit` 기반의 자유 배치 보드 (섹션 + 노트)
- 드래그 & 드롭으로 직관적인 상태 변경
- 노트별 태그, 마감일, 담당자, 완료 상태 관리
- 실시간 Presence (현재 접속자 표시 + 컬러 커서)
- 리소스 잠금 (동시 편집 충돌 방지)
- Undo/Redo 지원 (Zundo 미들웨어)
- 일괄 완료/삭제 (Batch Operations)

### WBS — 간트 차트 (Work Breakdown Structure)

- `gantt-task-react` 기반 일/주/월 뷰
- 작업 간 의존성(Dependency) 설정 및 시각화
- 일정 충돌 감지 및 경고
- 타임라인에서 드래그로 작업 기간 직접 조정
- 마일스톤 및 진행률 관리

### 실시간 채팅 (Chat)

- Socket.io 기반 실시간 메시지 송수신
- **채팅방 유형**: INQUIRY(문의), RECRUIT(인터뷰), TEAM(팀 채팅방), DM(1:1), SYSTEM(가이드 봇)
- 채팅방 생성 시 카테고리별 시스템 안내 메시지 자동 발송
- DM 중복 방지 (동일 참여자 구성의 방 재활용)
- 읽음 처리 및 안 읽은 메시지 카운트
- 글로벌 채팅 위젯 (헤더에서 바로 접근)

### AI 어시스턴트 (AI Assistant)

- **지시문 생성**: 칸반 보드의 노트/섹션을 기반으로 AI 개발 지시문 자동 생성 (SSE 스트리밍)
- **프리셋 관리**: 프로젝트별 역할 프리셋 저장 및 재사용
- **실행 결과 파싱**: AI 실행 결과를 파싱하여 칸반 노트로 자동 등록
- **하네스 카탈로그**: AI 도구/스킬 카탈로그 브라우징 및 추천
- **사용량 모니터링**: 일일 사용량 추적 및 임계치 경고 (Discord Webhook)

### 알림 (Notifications)

- 실시간 알림 (지원 결과, 새 지원자, 프로젝트 변경 등)
- Socket.io 기반 즉시 전달 + DB 저장
- 읽음/안읽음 상태 관리

### 리뷰 (Reviews)

- 프로젝트 종료 후 팀원 간 피어 리뷰
- 평점 + 코멘트 + 스킬 태그 기반 평가
- 관리자 모더레이션

### 관리자 패널 (Admin Dashboard)

- 사용자/프로젝트/지원/리뷰 관리 및 모더레이션
- 기술 스택 및 공통 코드(직군, 상태 등) 관리
- AI 설정 (프로바이더, 모델, 일일 한도, 가드레일)
- 공지사항 발송
- 감사 로그 (Admin Audit Log)
- 플랫폼 통계 대시보드

---

## 기술 스택

### Frontend

| 분류            | 기술                                              |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 14 (App Router)                           |
| Language        | TypeScript 5.3 (strict mode)                      |
| Styling         | Tailwind CSS 3.4 + Styled Components 6            |
| State           | Zustand 4.5 + Zundo (Undo/Redo)                   |
| Drag & Drop     | dnd-kit (칸반), gantt-task-react (WBS)            |
| Editor          | Tiptap 2 (Rich Text, Code Block, Image)           |
| 일정            | react-schedule-selector                           |
| 기타 UI         | react-slick (캐러셀), react-markdown, DOMPurify   |

### Backend & Database

| 분류       | 기술                                          |
| ---------- | --------------------------------------------- |
| Runtime    | Node.js (>=18.0.0)                            |
| Server     | Express 5 + Next.js API Routes (커스텀 서버)  |
| Database   | MongoDB Atlas + Mongoose 8                    |
| 실시간     | Socket.io 4.8 (4개 네임스페이스)              |
| 인증       | NextAuth 4 + JWT + bcryptjs                   |
| AI         | Google Generative AI (Gemini)                 |
| 이미지     | Cloudinary 2                                  |
| GitHub API | graphql-request (GraphQL)                     |
| RSS        | rss-parser                                    |
| OG 태그    | open-graph-scraper                            |

### DevOps & QA

| 분류          | 기술                                    |
| ------------- | --------------------------------------- |
| 테스트        | Vitest 4 + mongodb-memory-server        |
| Linting       | ESLint 8.56 + Prettier 3                |
| Git Hooks     | Husky 9 + lint-staged 15                |
| 에러 추적     | Sentry (Next.js SDK)                    |
| Dev Server    | nodemon + ts-node                       |
| 배포          | Render.com (render.yaml)                |

---

## 시작하기

### 사전 요구사항

- Node.js >= 18.0.0
- npm 8 이상
- MongoDB Atlas 계정 (또는 로컬 MongoDB)

### 1. 저장소 클론

```bash
git clone https://github.com/sideprojectmate/sideProjectMate.git
cd sideProjectMate
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```env
# ── 필수 ──────────────────────────────────────
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# 인증
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Cloudinary (이미지 업로드)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── 선택 (없으면 해당 기능 비활성화) ──────────
# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub API (프로필 연동)
GITHUB_ACCESS_TOKEN=ghp_...

# Sentry (에러 추적)
SENTRY_DSN=...

# 성능 관련
API_LOGGING=true          # false로 설정 시 API 로깅 비활성화
MONGODB_DEBUG=false        # true로 설정 시 Mongoose 쿼리 로그 출력
```

### 4. 개발 서버 실행

```bash
npm run dev
```

> Express + Socket.io 커스텀 서버(`server.ts`)가 `http://localhost:3000`에서 실행됩니다.

### 5. 주요 스크립트

```bash
npm run dev          # 개발 서버 (nodemon + ts-node, 포트 3000)
npm run build        # 프로덕션 빌드 (Next.js + server.ts 컴파일)
npm run start        # 프로덕션 서버 실행 (dist/server.js)
npm run test:run     # 전체 테스트 실행
npm run test:watch   # 테스트 감시 모드
npm run test:coverage # 커버리지 리포트
npm run lint         # ESLint
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npm run format:check # 포맷 검사
```

---

## 프로젝트 구조

```
sideProjectMate/
├── server.ts                     # Express + Socket.io 커스텀 서버
├── next.config.js                # Next.js 설정 (Sentry, 이미지 도메인)
├── render.yaml                   # Render.com 배포 설정
├── vitest.config.ts              # 테스트 설정
├── tailwind.config.js            # Tailwind 디자인 토큰
├── docs/                         # 개발 문서
│   ├── architecture.md           # 아키텍처 상세
│   ├── conventions.md            # 코드 컨벤션
│   └── testing-guide.md          # 테스트 작성 가이드
├── work-logs/                    # 작업 이력 로그
└── src/
    ├── app/                      # Next.js App Router
    │   ├── page.tsx              # 랜딩 페이지
    │   ├── layout.tsx            # 루트 레이아웃
    │   ├── login/                # 로그인
    │   ├── register/             # 회원가입
    │   ├── onboarding/           # 온보딩 위저드
    │   ├── projects/             # 프로젝트 (목록/상세/생성/수정)
    │   │   ├── [pid]/            # 프로젝트 상세
    │   │   ├── mine/             # 내 프로젝트
    │   │   └── new/              # 프로젝트 생성
    │   ├── dashboard/            # 통합 대시보드
    │   ├── kanban/[pid]/         # 칸반 보드
    │   ├── chat/                 # 채팅
    │   ├── profile/[id]/         # 공개 프로필
    │   ├── mypage/               # 마이페이지 (지원 내역)
    │   ├── admin/                # 관리자 패널
    │   │   ├── ai-settings/      # AI 설정
    │   │   ├── users/            # 사용자 관리
    │   │   ├── projects/         # 프로젝트 관리
    │   │   ├── applications/     # 지원 관리
    │   │   ├── reviews/          # 리뷰 관리
    │   │   ├── tech-stacks/      # 기술 스택 관리
    │   │   ├── common-codes/     # 공통 코드 관리
    │   │   ├── announcements/    # 공지사항
    │   │   └── audit-log/        # 감사 로그
    │   ├── tech/                 # 기술 스택 페이지
    │   ├── privacy/              # 개인정보처리방침
    │   ├── terms/                # 이용약관
    │   └── api/                  # API Routes (82개)
    │       ├── auth/             #   인증 (NextAuth, 회원가입)
    │       ├── projects/         #   프로젝트 CRUD + 좋아요/지원/멤버
    │       ├── applications/     #   지원 관리
    │       ├── kanban/           #   칸반 보드/섹션/노트 CRUD
    │       ├── wbs/              #   WBS 태스크 CRUD
    │       ├── chat/             #   채팅방/메시지
    │       ├── ai/               #   AI 지시문/프리셋/실행결과/하네스
    │       ├── users/            #   사용자 프로필/GitHub/블로그
    │       ├── notifications/    #   알림
    │       ├── reviews/          #   리뷰
    │       ├── admin/            #   관리자 API
    │       ├── cloudinary/       #   이미지 업로드 서명
    │       ├── common-codes/     #   공통 코드
    │       ├── tech-stacks/      #   기술 스택 목록
    │       ├── health/           #   API 성능 통계
    │       ├── status/           #   서버 상태
    │       └── proxy/            #   외부 API 프록시
    ├── components/               # React 컴포넌트 (도메인별 분류)
    │   ├── admin/                #   관리자 UI
    │   ├── board/                #   칸반 보드 (dnd-kit)
    │   ├── chat/                 #   채팅 UI + 글로벌 위젯
    │   ├── common/               #   공통 (모달, 토스트, 빈 상태 등)
    │   ├── dashboard/            #   대시보드 레이아웃
    │   ├── editor/               #   Tiptap 리치 텍스트 에디터
    │   ├── profile/              #   프로필 + 온보딩
    │   └── projects/             #   프로젝트 카드/폼/필터
    ├── store/                    # Zustand 스토어
    │   ├── boardStore.ts         #   칸반 보드 상태 (가장 복잡)
    │   ├── chatWidgetStore.ts    #   채팅 위젯 상태
    │   ├── instructionStore.ts   #   AI 지시문 생성 상태
    │   ├── executionResultStore.ts #  AI 실행 결과 파싱
    │   ├── applicationStore.ts   #   지원 상태 추적
    │   └── modalStore.ts         #   글로벌 모달
    ├── lib/
    │   ├── models/               # Mongoose 스키마 (27개 모델)
    │   │   ├── User.ts           #   사용자
    │   │   ├── Project.ts        #   프로젝트
    │   │   ├── Application.ts    #   지원
    │   │   ├── ChatRoom.ts       #   채팅방
    │   │   ├── ChatMessage.ts    #   채팅 메시지
    │   │   ├── Notification.ts   #   알림
    │   │   ├── Review.ts         #   리뷰
    │   │   ├── TechStack.ts      #   기술 스택
    │   │   ├── CommonCode.ts     #   공통 코드
    │   │   ├── AiPreset.ts       #   AI 프리셋
    │   │   ├── AiSettings.ts     #   AI 관리 설정
    │   │   ├── kanban/           #   Board, Section, Note
    │   │   └── wbs/              #   Task
    │   ├── ai/                   # AI 프로바이더 통합
    │   ├── github/               # GitHub GraphQL API
    │   ├── blog/                 # RSS 파싱
    │   ├── notifications/        # 알림 로직
    │   ├── utils/                # 헬퍼 함수
    │   ├── auth.ts               # NextAuth 설정
    │   ├── dbConnect.ts          # MongoDB 연결
    │   ├── socket.ts             # Socket.io 클라이언트 설정
    │   ├── apiLogger.ts          # API 요청 로깅 래퍼
    │   └── adminAuth.ts          # 관리자 인증
    ├── hooks/                    # 커스텀 React 훅
    ├── constants/                # 상수 정의
    ├── types/                    # TypeScript 타입
    ├── middleware.ts             # Next.js 미들웨어 (인증 가드)
    └── __tests__/                # 테스트 헬퍼 & 픽스처
```

---

## API 엔드포인트 개요

총 82개의 API Route 핸들러가 있습니다. 주요 도메인별 정리:

| 도메인       | 경로 패턴                    | 주요 메서드                  | 설명                              |
| ------------ | ---------------------------- | ---------------------------- | --------------------------------- |
| 인증         | `/api/auth/*`                | POST                         | 회원가입, NextAuth 핸들러         |
| 프로젝트     | `/api/projects/*`            | GET, POST, PUT, PATCH, DELETE | 프로젝트 CRUD + 좋아요/지원/멤버  |
| 지원         | `/api/applications/*`        | GET, POST, PATCH             | 지원 제출/조회/수락/거절/탈퇴     |
| 칸반         | `/api/kanban/*`              | GET, POST, PUT, DELETE       | 보드/섹션/노트 CRUD + 일괄 처리   |
| WBS          | `/api/wbs/*`                 | GET, POST, PUT, DELETE       | 태스크 CRUD + 일괄 업데이트       |
| 채팅         | `/api/chat/*`                | GET, POST, DELETE            | 채팅방/메시지 관리                |
| AI           | `/api/ai/*`                  | GET, POST                    | 지시문 생성(SSE)/프리셋/실행결과  |
| 사용자       | `/api/users/*`               | GET, PUT                     | 프로필/GitHub/블로그/가용성       |
| 알림         | `/api/notifications/*`       | GET, PATCH                   | 알림 목록/읽음 처리               |
| 리뷰         | `/api/reviews/*`             | GET, POST                    | 리뷰 작성/조회                    |
| 관리자       | `/api/admin/*`               | GET, POST, PUT               | 전체 관리 (18개 엔드포인트)       |
| 유틸         | `/api/health`, `/api/status` | GET                          | 성능 통계, 서버 상태              |

### API Route 작성 패턴

모든 API Route는 `withApiLogging` 래퍼를 사용합니다:

```ts
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?._id)
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });

  return NextResponse.json({ success: true, data: { ... } });
}

export const GET = withApiLogging(_GET, '/api/도메인/경로');
```

> 응답 형식은 항상 `{ success: boolean, data?: any, message?: string }` 을 따릅니다.

---

## Socket.io 실시간 이벤트

개발 서버는 Express + Socket.io 커스텀 서버(`server.ts`)로 구동됩니다.
4개의 네임스페이스가 존재합니다:

### 1. 칸반 보드

| Client → Server                                          | 설명                      |
| --------------------------------------------------------- | ------------------------- |
| `join-board` / `leave-board`                              | 보드 룸 접속/이탈         |
| `user-activity`                                           | Presence 정보 전송        |
| `create-note` / `update-note` / `delete-note`             | 노트 실시간 동기화        |
| `complete-note` / `revert-note`                           | 노트 완료/되돌리기        |
| `create-section` / `update-section` / `delete-section`    | 섹션 실시간 동기화        |
| `complete-section` / `revert-section`                     | 섹션 완료/되돌리기        |
| `delete-notes-batch`                                      | 노트 일괄 삭제            |
| `request-lock` / `release-lock`                           | 리소스 편집 잠금          |
| `select-note` / `deselect-note`                           | 선택 상태 실시간 공유     |
| `sync-board`                                              | Undo/Redo 보드 동기화     |

### 2. 프로젝트

| Client → Server                            | 설명                    |
| ------------------------------------------ | ----------------------- |
| `join-project` / `leave-project`           | 프로젝트 룸 접속/이탈   |
| `resource-update` / `project-update`       | 리소스/프로젝트 변경    |

### 3. WBS

| Client → Server                            | 설명                    |
| ------------------------------------------ | ----------------------- |
| `wbs-task-created/updated/deleted`         | 태스크 실시간 동기화    |

### 4. 채팅

| Client → Server                            | 설명                    |
| ------------------------------------------ | ----------------------- |
| `join-chat-room` / `leave-chat-room`       | 채팅방 접속/이탈        |
| `send-message`                             | 메시지 전송             |
| `new-room`                                 | 새 채팅방 알림          |
| `send-notification`                        | 개인 알림 전송          |

---

## 테스트

**580개 테스트** | Vitest + mongodb-memory-server 기반

```bash
npm run test:run       # 전체 테스트 (약 9초)
npm run test:watch     # 감시 모드
npm run test:coverage  # 커버리지 리포트
```

### 테스트 구조

```
src/__tests__/
├── fixtures/              # 공유 테스트 데이터 (재사용 권장)
│   ├── users.ts
│   ├── projects.ts
│   └── ...
└── helpers/               # DB 연결/초기화 헬퍼

src/app/api/**/*.test.ts   # API Route 테스트 (각 route.ts 옆에 위치)
src/store/**/*.test.ts     # Zustand 스토어 테스트
src/lib/**/*.test.ts       # 유틸리티 함수 테스트
```

### 테스트 작성 시 참고

- 상세 가이드: `docs/testing-guide.md`
- 기존 fixture(`src/__tests__/fixtures/`)를 적극 재사용
- API 테스트는 `mongodb-memory-server`로 실제 DB를 사용 (Mock 아님)
- 새 코드 작성 시 `*.test.ts` 파일을 함께 생성

---

## AI 개발 가이드 (바이브코딩)

AI 코딩 에이전트를 활용하여 개발할 때 참고할 정보입니다. Claude, Cursor, Copilot, Windsurf 등 어떤 AI 도구를 사용하든 아래 가이드가 적용됩니다.

### 프로젝트 이해를 위한 핵심 파일

AI 세션을 시작할 때 아래 파일들을 컨텍스트로 제공하면 정확한 코드를 생성할 수 있습니다:

| 상황             | 읽어야 할 파일                               |
| ---------------- | -------------------------------------------- |
| 모든 작업        | `CLAUDE.md` (프로젝트 규칙 요약)             |
| API 작업         | `src/app/api/MAP.md` → 해당 도메인 `MAP.md`  |
| 칸반 작업        | `src/app/api/kanban/MAP.md` + `src/store/MAP.md` |
| 채팅 작업        | `src/app/api/chat/MAP.md`                    |
| 모델 작업        | `src/lib/models/MAP.md`                      |
| 스토어 작업      | `src/store/MAP.md`                           |
| 컨벤션 확인      | `docs/conventions.md`                        |
| 아키텍처 확인    | `docs/architecture.md`                       |
| 테스트 작성      | `docs/testing-guide.md`                      |

> `MAP.md` 파일은 각 디렉토리의 파일 관계와 역할을 설명하는 지도 파일입니다.

### 코드 생성 시 필수 체크리스트

AI가 코드를 생성할 때 아래 패턴을 따르도록 지시하세요:

- [ ] **경로 별칭**: 항상 `@/` 사용 (예: `import { User } from '@/lib/models/User'`), 상대경로 금지
- [ ] **클라이언트 컴포넌트**: `'use client'` 선언 필수
- [ ] **API Route**: `export const dynamic = 'force-dynamic'` + `dbConnect()` + 인증 체크 + `withApiLogging` 래퍼
- [ ] **읽기 전용 쿼리**: `.lean()` 사용
- [ ] **응답 형식**: `{ success: true/false, data | message }` 통일
- [ ] **Mongoose 모델**: 중복 등록 방지 패턴 (`models.ModelName || model(...)`)
- [ ] **Zustand 스토어**: `devtools` 미들웨어 적용
- [ ] **Socket.io**: `socket.off()` cleanup 등록
- [ ] **타입**: `any` 사용 금지

### 팀 작업 충돌 방지

프로젝트는 `.workzones.yml` 파일로 현재 작업 중인 영역을 추적합니다. AI 세션 시작 시 이 파일을 확인하여 다른 팀원이 작업 중인 영역과 겹치지 않도록 하세요.

최근 작업 이력은 `work-logs/` 디렉토리의 최신 3개 파일에서 확인할 수 있습니다.

### Git 브랜치 전략

```
main              ← 배포 (Render 자동 배포)
feature/SPM-*     ← 기능 개발
fix/SPM-*         ← 버그 수정
hotfix/SPM-*      ← 긴급 수정
```

---

## 배포

### Render.com 자동 배포

`render.yaml` 설정으로 GitHub `main` 브랜치 push 시 자동 배포됩니다.

| 항목          | 값                              |
| ------------- | ------------------------------- |
| Build Command | `npm install && npm run build`  |
| Start Command | `npm start`                     |
| Health Check  | `/api/status`                   |
| Plan          | Free                            |

### 환경변수

Render 대시보드에서 `.env.local`과 동일한 환경변수를 설정하세요.

### Keep-Alive

프로덕션 환경에서는 Render Free Tier의 슬립을 방지하기 위해 `server.ts`에서 10분마다 `/api/status`에 자체 핑을 보냅니다.

---

## 트러블슈팅

**"Unsupported Server Component type" 에러**
- 클라이언트 훅(`useState`, `useEffect` 등)을 사용하는 컴포넌트 최상단에 `'use client'`가 있는지 확인하세요.

**Socket.io 연결 실패**
- `npm run dev` 실행 후 `> Ready on http://localhost:3000` 메시지를 확인하세요.
- Socket.io 경로는 `/api/socket/io`입니다. `server.ts`의 `path` 설정과 일치해야 합니다.

**MongoDB 연결 오류**
- `.env.local`의 `MONGODB_URI`가 올바른지 확인하세요.
- IP 화이트리스트에 현재 IP가 추가되어 있는지 MongoDB Atlas에서 확인하세요.

**테스트 타임아웃 (mongodb-memory-server)**
- 첫 실행 시 MongoDB 바이너리 다운로드에 시간이 걸릴 수 있습니다.
- 간헐적 타임아웃은 `mongodb-memory-server` 초기화 속도 문제입니다. 재실행하세요.

**API 응답이 느릴 때**
- `/api/health` 엔드포인트에서 API별 평균 응답시간 통계를 확인하세요.
- 500ms 초과 API는 서버 로그에 `[SLOW API]`로 자동 경고됩니다.

---

## 기여하기

1. Linear에서 이슈 확인 또는 GitHub Issue 생성
2. 브랜치 생성 (`feature/SPM-번호-설명` 또는 `fix/SPM-번호-설명`)
3. 코드 작성 + 테스트 추가
4. `npm run test:run` 전체 통과 확인
5. Pull Request 생성
6. 코드 리뷰 후 main 머지

---

## 라이센스

MIT License

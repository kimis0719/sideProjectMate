# Side Project Mate 🚀

사이드 프로젝트 메이트는 개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고 협업할 수 있는 플랫폼입니다.

---

## ✨ 주요 기능

### 🔐 인증 (Authentication)
- 이메일 & 비밀번호 기반 회원가입/로그인
- JWT 기반 세션 관리 (next-auth)
- bcryptjs 비밀번호 해싱 및 미들웨어 접근 제어

### 📁 프로젝트 관리 (Project Management)
- **프로젝트 생성**: 썸네일 드래그 & 드롭 업로드(Cloudinary), 기술 스택 태그 선택, Tiptap 기반 리치 텍스트 에디터 지원
- **프로젝트 조회**: 카테고리 / 상태 / 정렬 필터링 및 키워드 검색
- **통합 대시보드**: 프로젝트별 칸반 보드와 WBS를 한 화면에서 관리

### 👤 마이페이지 & 프로필 (Profile & Stats)
- **온보딩 위저드**: 초기 진입 시 직군, 경력 등 필수 정보를 입력받는 단계별 가이드
- **프로필 관리**: 기본 정보 및 커뮤니케이션 성향(MBTI, 온/오프라인 선호도) 관리
- **기술 스택 (Skill Stack)**: `skillicons.dev` 기반의 직관적인 아이콘 UI, 주요 기술 및 숙련도 시각화
- **개발자 활동 지표**:
  - **GitHub 연동**: 커밋 활동(Green Light), 언어 사용량, Top Skills 자동 분석
  - **Solved.ac (백준)**: 알고리즘 티어, 랭크, 스트릭 카드 표시
  - **Tech Blog**: Velog 등 기술 블로그 최신 글 RSS 자동 수집
- **가용성 스케줄러**: 주간 협업 가능 시간 드래그 선택 및 시각화
- **마이페이지**: 본인이 제출한 지원 내역(지원 프로젝트, 역할, 상태) 확인

### 🤝 지원 시스템 (Application System)
- **지원하기**: 희망 역할 선택 및 지원 메시지 작성
- **지원자 관리**: 프로젝트 작성자가 지원자 목록 확인 및 수락/거절 처리

### 📊 협업 도구 (Collab Tools)
- **칸반 보드 (Kanban Board)**:
  - `dnd-kit` 기반의 To Do / In Progress / Done 업무 관리
  - 드래그 & 드롭으로 직관적인 상태 변경
  - 실시간 Presence(현재 접속자) 표시 및 리소스 잠금(충돌 방지)
- **WBS (Work Breakdown Structure)**:
  - `gantt-task-react` 기반의 간트 차트 (일 / 주 / 월 뷰 지원)
  - 작업 간 의존성(Dependency) 설정 및 시각화
  - 일정 충돌 감지 및 경고 알림
  - 타임라인에서 드래그로 직접 작업 기간 조정
- **실시간 동기화**: `Socket.io` 기반의 노트 생성/수정/삭제/선택 상태 실시간 전파

### 💬 채팅 (Chat) — UI 프로토타입
> 현재 UI 프로토타입 단계입니다. 백엔드 API 및 모델은 구현 완료, 실시간 연동 작업 진행 중입니다.

- **채팅방 유형**: INQUIRY(문의), RECRUIT(인터뷰), TEAM(팀 채팅방), DM(1:1), SYSTEM(가이드 봇)
- 채팅방 생성 시 카테고리별 시스템 안내 메시지 자동 발송
- DM 중복 방지 로직 (동일 참여자 구성의 방 재활용)

### 🔔 알림 (Notifications)
- 실시간 알림 시스템 (지원 결과, 새 지원자 알림 등)
- Zustand 기반 알림 스토어

---

## 🛠 기술 스택

### Frontend
| 분류 | 기술 |
|------|------|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4, Styled Components 6 |
| State Management | Zustand 4.5, Zundo (Undo/Redo) |
| 드래그 & 드롭 | dnd-kit (칸반), gantt-task-react (WBS) |
| 에디터 | Tiptap 2 (Rich Text Editor, Code Block) |
| 일정 | react-schedule-selector |
| 기타 UI | react-slick (캐러셀), react-markdown |

### Backend & Database
| 분류 | 기술 |
|------|------|
| Runtime | Node.js 20.x |
| Server | Next.js API Routes + Express (Socket.io 전용) |
| Database | MongoDB Atlas (Mongoose 8.x) |
| 실시간 | Socket.io 4.8 |
| 인증 | next-auth 4, jsonwebtoken, bcryptjs |
| 이미지 | Cloudinary 2 |
| GraphQL | graphql-request (GitHub API 연동) |
| RSS | rss-parser (Tech Blog 연동) |
| OG | open-graph-scraper |

### DevOps & Tools
| 분류 | 기술 |
|------|------|
| Linting | ESLint 8.56, Prettier |
| Dev Server | nodemon + ts-node |
| Deployment | Render.com (Free Plan) |

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 20.x 권장 (>=18 지원)
- npm 8 이상

### 개발 환경 설정

**1. 저장소 클론**
```bash
git clone https://github.com/kimis0719/sideProjectMate.git
cd sideProjectMate
```

**2. 의존성 설치**
```bash
npm install
```

**3. 환경 변수 설정**

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 변수들을 설정하세요.

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Cloudinary (이미지 업로드)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**4. 개발 서버 실행**
```bash
# 개발 모드 (nodemon + ts-node, 포트 3000)
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm run start
```

**5. 브라우저 확인**
```
http://localhost:3000
```

---

## 🏗 프로젝트 구조

```
sideProjectMate/
├── server.ts                   # Express + Socket.io 커스텀 서버
├── next.config.js
├── render.yaml                 # Render.com 배포 설정
└── src/
    ├── app/                    # Next.js App Router 페이지
    │   ├── api/               # API Routes
    │   │   ├── applications/  # 지원 CRUD
    │   │   ├── auth/          # 인증 (next-auth)
    │   │   ├── chat/          # 채팅방 생성/조회/메시지
    │   │   ├── cloudinary/    # 이미지 업로드
    │   │   ├── common-codes/  # 공통 코드 (직군, 기술 등)
    │   │   ├── kanban/        # 칸반 보드 CRUD
    │   │   ├── notifications/ # 알림
    │   │   ├── projects/      # 프로젝트 CRUD
    │   │   ├── proxy/         # 외부 API 프록시 (CORS 우회)
    │   │   ├── status/        # 서버 상태 확인
    │   │   ├── tech-stacks/   # 기술 스택 목록
    │   │   ├── users/         # 유저 프로필, GitHub, Solved.ac
    │   │   ├── utils/         # 유틸 API
    │   │   └── wbs/           # WBS(간트 차트) CRUD
    │   ├── chat/              # 채팅 UI (프로토타입)
    │   ├── dashboard/[pid]/   # 통합 대시보드
    │   │   ├── kanban/        # 칸반 보드 페이지
    │   │   └── wbs/           # WBS 페이지
    │   ├── kanban/[pid]/      # 칸반 보드 독립 경로
    │   ├── login/             # 로그인
    │   ├── register/          # 회원가입
    │   ├── mypage/            # 마이페이지 (내 지원 내역)
    │   ├── profile/[id]/      # 공개 프로필
    │   ├── tech/              # 기술 스택/활동 지표 페이지
    │   ├── projects/          # 프로젝트 목록, 상세, 생성/수정
    │   │   ├── [pid]/
    │   │   └── new/
    │   ├── layout.tsx
    │   └── page.tsx           # 메인 페이지
    ├── components/            # 재사용 컴포넌트
    │   ├── board/             # 칸반 보드
    │   ├── chat/              # 채팅 UI
    │   ├── common/            # 공통 컴포넌트
    │   ├── dashboard/         # 통합 대시보드
    │   ├── editor/            # Tiptap 에디터
    │   ├── profile/           # 프로필 & 온보딩
    │   ├── projects/          # 프로젝트 관련
    │   └── wbs/               # WBS(간트 차트)
    ├── store/                 # Zustand 스토어
    │   ├── boardStore.ts      # 칸반 보드 상태
    │   ├── wbsStore.ts        # WBS 상태 (Undo/Redo 포함)
    │   └── modalStore.ts      # 모달 상태
    ├── lib/
    │   ├── models/            # Mongoose 스키마
    │   │   ├── User.ts
    │   │   ├── Project.ts
    │   │   ├── Application.ts
    │   │   ├── Notification.ts
    │   │   ├── Availability.ts
    │   │   ├── ChatRoom.ts
    │   │   ├── ChatMessage.ts
    │   │   ├── Comment.ts
    │   │   ├── CommonCode.ts
    │   │   ├── Post.ts
    │   │   ├── ProjectMember.ts
    │   │   ├── Skill.ts
    │   │   ├── TechStack.ts
    │   │   ├── kanban/        # Board, Section, Note 모델
    │   │   └── wbs/           # Task 모델
    │   ├── store/
    │   │   └── notificationStore.ts
    │   ├── blog/              # RSS 파싱 유틸
    │   ├── github/            # GitHub GraphQL 연동
    │   └── utils/             # WBS 의존성 계산 등 헬퍼
    ├── hooks/                 # 커스텀 훅
    ├── constants/             # 상수 정의
    └── types/                 # TypeScript 타입 정의
```

---

## 🔌 Socket.io 이벤트 (server.ts)

개발 서버는 Express + Socket.io 커스텀 서버(`server.ts`)로 구동됩니다.

| 이벤트 (Client → Server) | 설명 |
|--------------------------|------|
| `join-board` | 칸반 보드 룸 접속 |
| `user-activity` | 보드 Presence 정보 전송 (접속자 목록 갱신) |
| `leave-board` | 칸반 보드 룸 이탈 |
| `update-note` / `create-note` / `delete-note` | 노트 변경 실시간 전파 |
| `update-section` / `create-section` / `delete-section` | 섹션 변경 실시간 전파 |
| `request-lock` / `release-lock` | 노트/섹션 편집 잠금 (충돌 방지) |
| `sync-board` | Undo/Redo 시 전체 보드 동기화 |
| `select-note` / `deselect-note` | 실시간 노트 선택 상태 공유 |
| `join-project` | 프로젝트 룸 접속 (온라인 상태 등록) |
| `resource-update` | 프로젝트 리소스 변경 알림 |
| `project-update` | 프로젝트 상태/개요 변경 알림 |
| `join-chat-room` / `leave-chat-room` | 채팅방 룸 접속/이탈 |
| `send-notification` | 실시간 알림 전송 |

---

## 주요 스크립트

```bash
npm run dev      # 개발 서버 실행 (nodemon + ts-node)
npm run build    # 프로덕션 빌드 (Next.js 빌드 + server.ts 컴파일)
npm run start    # 프로덕션 서버 실행 (dist/server.js)
npm run lint     # ESLint 실행
npm run format   # Prettier 포맷팅
```

---

## 🚀 배포 (Render.com)

`render.yaml`이 설정되어 있어 GitHub 연동 시 자동 배포됩니다.

1. [Render.com](https://render.com/) 로그인 후 "New Web Service" 생성
2. GitHub 저장소 연결
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment Variables에 `.env.local` 항목 동일하게 입력
6. 배포 시작

---

## ⚠️ 트러블슈팅

**"Unsupported Server Component type" 에러**
- 클라이언트 훅(`useState`, `useEffect` 등)을 사용하는 컴포넌트 최상단에 `'use client'` 지시어가 있는지 확인하세요.

**Socket.io 연결 실패**
- `npm run dev` 실행 후 터미널에서 `> Ready on http://localhost:3000` 메시지를 확인하세요.
- 클라이언트 측 Socket.io 경로(`/api/socket/io`)가 `server.ts`의 `path` 설정과 일치하는지 확인하세요.

**채팅 기능이 동작하지 않아요**
- 현재 채팅 UI는 Mock 데이터 기반 프로토타입입니다. DB 연동 작업이 진행 중입니다.

---

## 🤝 기여하기

1. Issue 생성
2. Fork & Branch 생성 (`feature/amazing-feature`)
3. Commit & Push
4. Pull Request 요청

---

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

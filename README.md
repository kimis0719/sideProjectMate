# Side Project Mate 🚀

사이드 프로젝트 메이트는 개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고 협업할 수 있는 플랫폼입니다.

## ✨ 주요 기능

- **🔐 인증 (Authentication)**
  - **회원가입/로그인**: 이메일 및 비밀번호 기반 인증
  - **보안**: JWT 기반 세션 관리, 비밀번호 해싱(bcryptjs), 미들웨어 접근 제어

- **📁 프로젝트 관리 (Project Management)**
  - **프로젝트 생성**: 썸네일 드래그 & 드롭 업로드(Cloudinary), 기술 스택 태그 선택, 상세 모집 요건 작성
  - **프로젝트 조회**: 카테고리/상태/정렬 필터링, 키워드 검색, 무한 스크롤(예정)
  - **프로젝트 관리**: 작성자 권한 관리(수정/삭제)

- **👤 마이페이지 (Profile & Stats) ✨**
  - **프로필 관리**: 기본 정보(직군, 연차, 활동 상태 등) 및 자기소개 관리
  - **기술 스택 (Skill Stack)**: 
    - `skillicons.dev` 기반의 직관적인 아이콘 UI (자동 카테고리 분류)
    - 주요 기술 및 숙련도 시각화
  - **개발자 활동 지표**:
    - **GitHub 연동**: 커밋 활동(Green Light), 언어 사용량, Top Skills 자동 분석
    - **Solved.ac (백준)**: 알고리즘 문제 해결 능력(티어, 랭크, 스트릭) 카드 표시
    - **Tech Blog**: Velog 등 기술 블로그 최신 글 RSS 자동 수집
  - **가용성 스케줄러 (Availability)**:
    - 주간 협업 가능 시간 드래그 선택 (Drag & Drop) 및 시각화
    - 커뮤니케이션 성향(동기/비동기) 및 MBTI 스타일 태그 관리

- **🤝 지원 시스템 (Application System)**
  - **지원하기**: 희망 역할 선택 및 지원 메시지 작성
  - **지원자 관리**: 프로젝트 작성자가 지원자 목록 확인 및 수락/거절 처리
  - **실시간 상태 공유**: 지원 상태 변경 시 알림 (예정)

- **📊 협업 도구 (Collab Tools)**
  - **칸반 보드 (Kanban Board)**: 
    - `dnd-kit`을 활용한 프로젝트별 업무 관리 (To Do, In Progress, Done)
    - 드래그 & 드롭으로 직관적인 업무 상태 변경
  - **실시간 소통**: `Socket.io` 기반의 실시간 상태 동기화 및 알림

- **🔔 알림 (Notifications)**
  - 실시간 알림 시스템 (지원 결과, 새 지원자 알림 등)

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4, Styled Components (일부 적용)
- **State Management**: Zustand
- **UI Libraries**: 
  - React 18.3
  - dnd-kit (Drag & Drop)
  - React Schedule Selector (일정 관리)
  - React Slick (캐러셀)

### Backend & Database
- **Runtime**: Node.js 20.x
- **Server**: Next.js API Routes + Custom Express Server (Socket.io 용)
- **Database**: MongoDB Atlas (Mongoose 8.x)
- **Real-time**: Socket.io 4.8
- **Authentication**: JWT (jsonwebtoken), bcryptjs

### Tools & DevOps
- **Linting**: ESLint 8.56, Prettier
- **Deployment**: Render.com

## 🚀 시작하기

### 필수 사항

- Node.js 20.x 권장 (>=18 지원)
- npm 8 이상

### 개발 환경 설정

1. 저장소 클론 및 이동
```bash
git clone https://github.com/kimis0719/sideProjectMate.git
cd sideProjectMate
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정 (.env.local)
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요.
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# 필요한 경우 추가
NEXTAUTH_URL=http://localhost:3000
```

4. 개발 서버 실행
```bash
# 개발 모드 (포트 3000 사용)
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm run start
```

5. 브라우저에서 확인
```
http://localhost:3000
```

## 🏗 프로젝트 구조

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API Routes (auth, users, status, proxy 등)
│   ├── login/ & register/ # 인증 페이지
│   ├── profile/           # 마이페이지 (정보, 스킬, 스케줄러 등)
│   ├── projects/          # 프로젝트 목록 및 상세, 생성
│   ├── kanban/            # 칸반 보드 관리
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # 재사용 컴포넌트
│   ├── common/            # 공통 UI (버튼, 모달 등)
│   ├── profile/           # 프로필 관련 (SkillSection, Scheduler, GitHubStats 등)
│   ├── Header.tsx         # 헤더 (네비게이션)
│   └── ...
├── lib/                   # 유틸리티 및 설정
│   ├── models/            # Mongoose 스키마 (User, Project, Availability 등)
│   ├── github/            # GitHub API 관련 로직
│   ├── iconUtils.ts       # 아이콘 매핑 유틸
│   └── mongodb.ts         # DB 연결 설정
└── public/                # 정적 파일
```

### 주요 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: 코드 린팅
- `npm run format`: 코드 포맷팅

## 🚀 배포하기 (Render.com)

1. [Render.com](https://render.com/) 가입 및 로그인
2. "New Web Service" 생성 -> GitHub 저장소 연결
3. 설정 입력:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables** 설정 (위의 환경 변수 참고)
5. 배포 시작!

## ⚠️ 트러블슈팅

- **"Unsupported Server Component type" 에러**
  - 클라이언트 훅(`useState`, `useEffect` 등)을 사용하는 컴포넌트 최상단에 `'use client'` 지시어가 있는지 확인하세요.
- **헤더 로그인 상태 미반영**
  - `Header` 컴포넌트는 클라이언트 사이드에서 세션 스토리지/쿠키를 확인하여 렌더링됩니다. 로그인이 풀린 경우 새로고침을 시도해보세요.
- **Socket.io 연결 실패**
  - 개발 서버(`next dev`)에서는 터미널 로그에 소켓 서버가 정상적으로 시작되었는지 확인해야 합니다 (`> Ready on http://localhost:3000`).

## 🤝 기여하기

1. Issue 생성
2. Fork & Branch 생성 (`feature/amazing-feature`)
3. Commit & Push
4. Pull Request 요청

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

---

> [!NOTE]
> 본 프로젝트는 **Google DeepMind** 기술 기반의 AI 에이전트(**Antigravity**)와의 협업을 통해 개발되었습니다. 🤖✨

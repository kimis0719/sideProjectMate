# Side Project Mate 🚀

사이드 프로젝트 메이트는 개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고 협업할 수 있는 플랫폼입니다.

## ✨ 주요 기능

- **🔐 인증 (Authentication)**
  - **회원가입/로그인**: 이메일 및 비밀번호 기반 인증
  - **보안**: JWT 기반 세션 관리, 비밀번호 해싱(bcryptjs), 미들웨어 접근 제어

- **📁 프로젝트 관리 (Project Management)**
  - **프로젝트 생성**: 썸네일 드래그 & 드롭 업로드(Cloudinary), 기술 스택 태그 선택, Tiptap 기반의 리치 텍스트 에디터 지원
  - **프로젝트 조회**: 카테고리/상태/정렬 필터링, 키워드 검색
  - **통합 대시보드**: 프로젝트별 칸반 보드와 WBS를 한곳에서 관리하는 대시보드 제공

- **👤 마이페이지 (Profile & Stats) ✨**
  - **온보딩 위저드**: 초기 진입 시 직군, 경력 등 필수 정보를 입력받는 단계별 가이드 제공
  - **프로필 관리**: 기본 정보 및 커뮤니케이션 성향(MBTI, 온/오프라인 선호도) 관리
  - **기술 스택 (Skill Stack)**: 
    - `skillicons.dev` 기반의 직관적인 아이콘 UI
    - 주요 기술 및 숙련도 시각화
  - **개발자 활동 지표**:
    - **GitHub 연동**: 커밋 활동(Green Light), 언어 사용량, Top Skills 자동 분석
    - **Solved.ac (백준)**: 알고리즘 문제 해결 능력(티어, 랭크, 스트릭) 카드 표시
    - **Tech Blog**: Velog 등 기술 블로그 최신 글 RSS 자동 수집
  - **가용성 스케줄러 (Availability)**:
    - 주간 협업 가능 시간 드래그 선택 (Drag & Drop) 및 시각화

- **🤝 지원 시스템 (Application System)**
  - **지원하기**: 희망 역할 선택 및 지원 메시지 작성
  - **지원자 관리**: 프로젝트 작성자가 지원자 목록 확인 및 수락/거절 처리

- **📊 협업 도구 (Collab Tools)**
  - **칸반 보드 (Kanban Board)**: 
    - `dnd-kit`을 활용한 프로젝트별 업무 관리 (To Do, In Progress, Done)
    - 드래그 & 드롭으로 직관적인 업무 상태 변경
  - **WBS (Work Breakdown Structure) 🆕**:
    - **Gantt Chart**: `gantt-task-react` 기반의 프로젝트 일정 시각화 (일/주/월 뷰 지원)
    - **의존성 관리**: 작업 간의 선행/후행 관계(Dependency) 설정 및 시각화
    - **일정 충돌 감지**: 팀원의 작업 일정이 겹칠 경우 경고 알림 및 통계 제공
    - **드래그 편집**: 타임라인에서 직접 작업 기간 조정
  - **실시간 소통**: `Socket.io` 기반의 실시간 상태 동기화

- **🔔 알림 (Notifications)**
  - 실시간 알림 시스템 (지원 결과, 새 지원자 알림 등)

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4, Styled Components
- **State Management**: Zustand, Zundo (Undo/Redo)
- **UI Libraries**: 
  - React 18.3
  - dnd-kit (Kanban Drag & Drop)
  - gantt-task-react (WBS Chart)
  - Tiptap (Rich Text Editor)
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
- **Image Hosting**: Cloudinary

## 🚀 시작하기

### 필수 사항

- Node.js 20.x 권장 (>=18 지원)
- npm 8 이상

### 개발 환경 설정

1. 저장소 클론 및 이동
```bash
git clone [https://github.com/kimis0719/sideProjectMate.git](https://github.com/kimis0719/sideProjectMate.git)
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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

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
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (auth, users, wbs, kanban 등)
│   ├── dashboard/         # [New] 통합 프로젝트 관리 (Kanban + WBS)
│   │   └── [pid]/
│   │       ├── kanban/    # 칸반 보드 페이지
│   │       └── wbs/       # WBS 간트차트 페이지
│   ├── login/ & register/ # 인증 페이지
│   ├── profile/           # 마이페이지 & 온보딩 위저드
│   ├── projects/          # 프로젝트 목록, 상세, 생성/수정
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # 재사용 컴포넌트
│   ├── board/             # 칸반 보드 관련 컴포넌트
│   ├── wbs/               # WBS(Gantt) 관련 컴포넌트
│   ├── editor/            # Tiptap 에디터 컴포넌트
│   ├── profile/           # 프로필 및 온보딩 관련
│   └── ...
├── lib/                   # 유틸리티 및 설정
│   ├── models/            # Mongoose 스키마 (User, Project, Task 등)
│   ├── utils/             # 헬퍼 함수 (WBS 의존성 계산 등)
│   └── store/             # Zustand 스토어 (wbsStore, boardStore 등)
└── public/                # 정적 파일
```

### 주요 스크립트

* `npm run dev`: 개발 서버 실행 (server.ts 기반)
* `npm run build`: 프로덕션 빌드
* `npm run start`: 프로덕션 서버 실행
* `npm run lint`: 코드 린팅
* `npm run format`: 코드 포맷팅

## 🚀 배포하기 (Render.com)

1. [Render.com](https://render.com/) 가입 및 로그인
2. "New Web Service" 생성 -> GitHub 저장소 연결
3. 설정 입력:
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm start`


4. **Environment Variables** 설정
5. 배포 시작!

## ⚠️ 트러블슈팅

* **"Unsupported Server Component type" 에러**
* 클라이언트 훅(`useState`, `useEffect` 등)을 사용하는 컴포넌트 최상단에 `'use client'` 지시어가 있는지 확인하세요.


* **Socket.io 연결 실패**
* 개발 서버(`npm run dev`) 실행 시 터미널 로그에 소켓 서버가 정상적으로 시작되었는지 확인하세요.



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

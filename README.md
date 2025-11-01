# Side Project Mate 🚀

사이드 프로젝트 메이트는 개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고 협업할 수 있는 플랫폼입니다.

## 🛠 기술 스택

- **프레임워크**: Next.js 14.2.33 (App Router)
- **언어**: TypeScript 5.3.3
- **런타임**: Node.js 20.x (권장)
- **UI 라이브러리**: React 18.3.1
- **스타일링**: Tailwind CSS 3.4.1
- **코드 품질**: 
  - ESLint 8.56.0
  - Prettier
  - TypeScript 타입 체크
- **배포**: Render.com

- **백엔드/DB**: Next.js API Routes, MongoDB (Mongoose 8)
- **인증**: JSON Web Token (jsonwebtoken), 비밀번호 해싱(bcryptjs)

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

3. 개발 서버 실행
```bash
# 개발 모드 (포트 3000 사용)
npm run dev

# 프로덕션 빌드 및 실행
npm run build
npm run start
```

4. 브라우저에서 확인
```
http://localhost:3000
```

## 🏗 프로젝트 구조

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃 (Header 사용)
│   ├── page.tsx           # 메인 페이지
│   ├── login/page.tsx     # 로그인 (client component)
│   ├── register/page.tsx  # 회원가입 (client component)
│   ├── profile/page.tsx   # 내 정보 (client component)
│   └── api/               # API Routes (auth, users, status 등)
├── components/            # 재사용 컴포넌트 (Header 등)
├── lib/                   # 유틸/DB/모델
│   ├── mongodb.ts         # MongoDB 연결
│   └── models/            # Mongoose 모델 (User, Post 등)
└── .env.local             # 로컬 환경 변수 (gitignore)
```

### 주요 스크립트

- `npm run dev`: 개발 서버 실행 (포트 3000)
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행
- `npm run format`: Prettier로 코드 포맷팅

## 🚀 배포하기

### Render.com에 배포

1. [Render.com](https://render.com/)에 가입/로그인
2. "New +" 버튼 클릭 후 "Web Service" 선택
3. GitHub 저장소 연결
4. 배포 설정:
   - **Name**: `sideprojectmate`
   - **Region**: 가까운 지역
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - (권장) **Node Version**: `20.x`
5. "Create Web Service" 클릭

## 🔧 환경 변수

로컬은 `.env.local`, 배포는 Render 환경 변수 화면에서 아래 값을 설정하세요:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DB=<dbname>
JWT_SECRET=<강력한_시크릿_문자열>
```

> Render 배포 시 "Error: secretOrPrivateKey must have a value" 가 보이면 `JWT_SECRET`이 설정되지 않은 것입니다. 환경변수를 추가하고 재배포하세요.

## 🔐 인증 흐름

- `POST /api/auth/login`: 이메일/비밀번호 검증 → JWT 발급 → 클라이언트는 `localStorage`에 `token`, `user` 저장
- `POST /api/auth/register`: 사용자 생성(중복 검사, 비밀번호 해싱)
- `src/components/Header.tsx`: `localStorage` 상태로 로그인/회원가입 버튼을 토글, 라우트 변경 및 storage 이벤트로 동기화
- `src/app/profile/page.tsx`: 미로그인 시 `/login`으로 리다이렉트

## ⚠️ 트러블슈팅

- **Unsupported Server Component type: {...}**
  - 클라이언트 전용 페이지(`/login`, `/register`, `/profile`) 상단에 `'use client'`가 필요합니다.
  - 필요 시 페이지 상단에 아래를 추가하여 프리렌더를 비활성화합니다:
    ```ts
    export const dynamic = 'force-dynamic'
    ```
- **헤더가 로그인 상태를 반영하지 않음**
  - `layout.tsx`에서 정적 마크업 대신 `Header` 컴포넌트를 사용합니다.
  - `Header.tsx`는 `usePathname()` + `storage` 이벤트로 상태를 갱신합니다.

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈에 할당을 요청해주세요.
2. Fork 후 feature/기능이름 브랜치를 생성해주세요.
3. PR을 보내주시면 검토 후 반영하겠습니다.

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고해주세요.

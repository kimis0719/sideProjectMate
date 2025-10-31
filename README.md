# Side Project Mate 🚀

사이드 프로젝트 메이트는 개발자들이 사이드 프로젝트를 함께 진행할 팀원을 찾고 협업할 수 있는 플랫폼입니다.

## 🛠 기술 스택

- **프레임워크**: Next.js 14.2.33 (App Router)
- **언어**: TypeScript 5.3.3
- **런타임**: Node.js 18+
- **UI 라이브러리**: React 18.3.1
- **스타일링**: Tailwind CSS 3.4.1
- **코드 품질**: 
  - ESLint 8.56.0
  - Prettier
  - TypeScript 타입 체크
- **배포**: Render.com

## 🚀 시작하기

### 필수 사항

- Node.js 16.8 이상
- npm 7.0 이상

### 개발 환경 설정

1. 저장소 클론 및 이동
```bash
git clone https://github.com/your-username/sideProjectMate.git
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
├── app/                  # Next.js 13+ App Router
│   ├── favicon.ico      # 파비콘
│   ├── globals.css      # 전역 스타일
│   ├── layout.tsx       # 레이아웃 컴포넌트
│   └── page.tsx         # 메인 페이지
├── components/          # 재사용 가능한 컴포넌트들
├── lib/                 # 유틸리티 함수들
└── styles/              # 전역 스타일 시트
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
   - **Region**: `Singapore` (또는 가까운 지역)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. "Create Web Service" 클릭

## 🔧 환경 변수

`.env.local` 파일을 생성하여 다음 변수들을 설정할 수 있습니다:

```
NEXT_PUBLIC_API_URL=API_BASE_URL
# 기타 필요한 환경 변수들...
```

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈에 할당을 요청해주세요.
2. Fork 후 feature/기능이름 브랜치를 생성해주세요.
3. PR을 보내주시면 검토 후 반영하겠습니다.

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고해주세요.

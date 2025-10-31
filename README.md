# Side Project Mate

사이드 프로젝트를 위한 협업 플랫폼

## 개발 환경 설정

### 필수 사항
- Node.js (14.x 이상)
- npm (6.x 이상)

### 설치 방법

1. 저장소 클론
```bash
git clone [저장소 URL]
cd sideProjectMate
```

2. 서버 의존성 설치
```bash
npm install
```

3. 클라이언트 의존성 설치
```bash
cd client
npm install
cd ..
```

### 개발 서버 실행

```bash
# 개발 모드 (백엔드 + 프론트엔드 동시 실행)
npm run dev

# 백엔드만 실행
npm run server

# 프론트엔드만 실행 (별도 터미널에서)
npm run client
```

### 프로덕션 빌드

```bash
# 클라이언트 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 배포

이 프로젝트는 Render.com에서 쉽게 배포할 수 있습니다.

1. Render.com에 새 Web Service 생성
2. GitHub 저장소 연결
3. 빌드 명령: `npm install && npm run build`
4. 시작 명령: `npm start`
5. 환경 변수 설정 (필요한 경우)

## 환경 변수

`.env` 파일을 생성하여 다음 변수들을 설정할 수 있습니다.

```
PORT=5000
NODE_ENV=development
# 기타 필요한 환경 변수들...
```

## 기술 스택

- **프론트엔드**: React
- **백엔드**: Node.js, Express
- **데이터베이스**: (추가 예정)
- **배포**: Render.com

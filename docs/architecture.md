# 아키텍처 & 환경 가이드

## 기술 스택

| 레이어     | 기술                                          |
| ---------- | --------------------------------------------- |
| 프레임워크 | Next.js 14 (App Router)                       |
| 서버       | Express + Socket.io 커스텀 서버 (`server.ts`) |
| DB         | MongoDB Atlas / Mongoose 8 ODM                |
| 인증       | next-auth v4 (JWT, Credentials Provider)      |
| 상태관리   | Zustand + devtools                            |
| 스타일     | Tailwind CSS                                  |
| 언어       | TypeScript (strict)                           |
| 배포       | Render.com Free Plan (`render.yaml`)          |
| 실시간     | Socket.io (경로: `/api/socket/io`)            |

## 폴더 구조

```
src/
├── app/
│   ├── api/          ← API Route Handlers
│   │   ├── kanban/   → 칸반 보드/섹션/노트
│   │   ├── projects/ → 프로젝트 CRUD + 지원/좋아요
│   │   ├── users/    → 유저 프로필/GitHub통계/블로그
│   │   ├── wbs/      → WBS 태스크 관리
│   │   ├── chat/     → 채팅 룸/메시지
│   │   ├── auth/     → 인증 (next-auth)
│   │   └── admin/    → 어드민 전용 API
│   └── (pages)/      ← App Router 페이지
├── components/       ← UI 컴포넌트
│   ├── board/        → 칸반 보드 컴포넌트
│   ├── wbs/          → WBS 컴포넌트
│   ├── chat/         → 채팅 컴포넌트
│   ├── profile/      → 프로필 컴포넌트
│   └── common/       → 공용 컴포넌트
├── store/            ← Zustand 스토어
├── hooks/            ← 커스텀 훅
├── lib/
│   ├── models/       → Mongoose 모델
│   ├── utils/        → 순수 유틸 함수
│   ├── github/       → GitHub API 연동
│   ├── blog/         → 블로그 RSS 파싱
│   └── socket.ts     → Socket.io 싱글톤
├── constants/        ← Union 타입 + 매핑 객체
└── types/            ← 전역 타입 정의
```

## 경로 별칭

`tsconfig.json`에서 `@/` → `src/`. **모든 import에 `@/` 사용 필수.**

```ts
import User from '@/lib/models/User'; // ✅
import User from '../../lib/models/User'; // ❌
```

## 환경별 주의사항

- **TypeScript**: `next.config.js`에 `ignoreBuildErrors: true` 임시 활성화 중. 타입 에러 방치 금지.
- **next-auth Session**: `src/types/next-auth.d.ts`에서 `session.user._id` 필드 확장됨
- **User 모델**: 실제 MongoDB 컬렉션 이름은 `memberbasics` (레거시)
- **Cloudinary**: 클라이언트 → `/api/cloudinary` (서명) → Cloudinary SDK 직접 업로드
- **상수/타입**: `src/constants/`에 Union 타입 + 매핑 객체로 정의

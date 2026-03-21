# CLAUDE.md — Side Project Mate

> 이 문서는 팀원 및 Claude AI Agent가 동일한 컨텍스트로 일관된 퀄리티의 작업을 수행하기 위한 가이드입니다.
> 코드를 수정하거나 새 기능을 추가하기 전에 반드시 이 문서를 읽고 숙지하세요.

---

## 1. 프로젝트 개요

**Side Project Mate**는 개발자들이 사이드 프로젝트 팀원을 찾고 협업할 수 있는 풀스택 플랫폼입니다.

- **서버**: Express + Socket.io 커스텀 서버(`server.ts`) 위에서 Next.js App Router 구동
- **DB**: MongoDB Atlas (Mongoose ODM)
- **실시간**: Socket.io (경로: `/api/socket/io`)
- **인증**: next-auth v4 (JWT 전략, Credentials Provider)
- **배포**: Render.com (Free Plan, `render.yaml` 참조)

---

## 2. 기술 스택

### Frontend
| 역할 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 14.2.x |
| Language | TypeScript | 5.3.x |
| Styling | Tailwind CSS | 3.4.x |
| Styling (동적) | styled-components | 6.x |
| 전역 상태 | Zustand | 4.5.x |
| Undo/Redo | Zundo | 2.x |
| 드래그 & 드롭 | dnd-kit | 6.x / 10.x |
| 간트 차트 | gantt-task-react | 0.3.x |
| 리치 에디터 | Tiptap 2 | 2.x |
| 일정 선택 | react-schedule-selector | 2.x |
| 캐러셀 | react-slick | 0.30.x |
| Markdown | react-markdown + remark-gfm | 9.x / 4.x |

### Backend & Infra
| 역할 | 기술 | 버전 |
|------|------|------|
| Runtime | Node.js | 20.x (>=18 지원) |
| HTTP Server | Express | 5.x |
| 실시간 | Socket.io | 4.8.x |
| DB | MongoDB Atlas (Mongoose) | 8.x |
| 인증 | next-auth + jsonwebtoken + bcryptjs | 4.x / 9.x / 3.x |
| 이미지 | Cloudinary | 2.x |
| GitHub API | graphql-request (GraphQL) | 6.x |
| RSS | rss-parser | 3.x |
| OG 스크래핑 | open-graph-scraper | 6.x |
| Dev 서버 | nodemon + ts-node | 3.x / 10.x |

### 경로 별칭

`tsconfig.json`에서 `@/`를 `src/`로 매핑합니다. 모든 import에 `@/`를 사용하세요.

```ts
// ✅ 올바른 방식
import User from '@/lib/models/User';

// ❌ 금지
import User from '../../lib/models/User';
```

---

## 3. 폴더 구조

```
sideProjectMate/
├── server.ts                    # Express + Socket.io 커스텀 서버 (진입점)
├── next.config.js               # Next.js 설정 (이미지 허용 도메인, webpack fallback)
├── render.yaml                  # Render.com 배포 설정
├── tailwind.config.js
├── tsconfig.json                # Next.js용 TS 설정
├── tsconfig.server.json         # server.ts 컴파일 전용 TS 설정
└── src/
    ├── app/                     # Next.js App Router
    │   ├── api/                 # API Route Handlers
    │   │   ├── applications/    # 지원(지원하기, 수락/거절)
    │   │   ├── auth/            # next-auth 핸들러
    │   │   ├── chat/            # 채팅방 생성/조회, 메시지
    │   │   ├── cloudinary/      # 이미지 업로드 (서명 발급)
    │   │   ├── common-codes/    # 공통 코드 조회 (직군, 기술스택 등)
    │   │   ├── kanban/          # 칸반 보드 CRUD (Board, Section, Note)
    │   │   ├── notifications/   # 알림 조회 & 읽음 처리
    │   │   ├── projects/        # 프로젝트 CRUD, 좋아요, 지원자 관리
    │   │   ├── proxy/           # 외부 API CORS 우회 프록시
    │   │   ├── status/          # 서버 헬스체크
    │   │   ├── tech-stacks/     # 기술 스택 목록 조회
    │   │   ├── users/           # 유저 프로필, GitHub/Solved.ac/Blog 연동
    │   │   ├── utils/           # 유틸 API (URL OG 정보 등)
    │   │   └── wbs/             # WBS Task CRUD, 의존성 관리
    │   │
    │   ├── chat/                # 채팅 페이지 (현재 UI 프로토타입)
    │   ├── dashboard/[pid]/     # 통합 대시보드 (칸반 + WBS 탭)
    │   │   ├── kanban/          # 칸반 보드 뷰
    │   │   └── wbs/             # WBS 간트차트 뷰
    │   ├── kanban/[pid]/        # 칸반 보드 독립 경로
    │   ├── login/               # 로그인 페이지
    │   ├── register/            # 회원가입 페이지
    │   ├── mypage/              # 마이페이지 (내 지원 내역)
    │   ├── profile/[id]/        # 타인 공개 프로필 조회
    │   ├── tech/                # 기술 스택 & 활동 지표 (본인)
    │   ├── projects/            # 프로젝트 목록/상세/생성/수정
    │   │   ├── [pid]/
    │   │   └── new/
    │   ├── layout.tsx           # 루트 레이아웃 (Header, Footer, Provider)
    │   └── page.tsx             # 메인 랜딩 페이지
    │
    ├── components/              # 재사용 UI 컴포넌트
    │   ├── AuthSessionProvider.tsx  # next-auth SessionProvider 래퍼
    │   ├── ThemeProvider.tsx        # styled-components ThemeProvider
    │   ├── Header.tsx / Footer.tsx
    │   ├── board/               # 칸반 보드 컴포넌트
    │   ├── chat/                # 채팅 UI (프로토타입)
    │   ├── common/              # 공통 컴포넌트 (GlobalModal 등)
    │   ├── dashboard/           # 통합 대시보드 위젯
    │   ├── editor/              # Tiptap 에디터
    │   ├── profile/             # 프로필 관련 컴포넌트 (onboarding, external, portfolio, modals)
    │   ├── projects/            # 프로젝트 카드/리스트
    │   └── wbs/                 # WBS 간트차트 관련
    │
    ├── store/                   # Zustand 클라이언트 상태 스토어
    │   ├── boardStore.ts        # 칸반 보드 전역 상태 (노트, 섹션, Socket, Undo/Redo)
    │   ├── wbsStore.ts          # WBS Task 전역 상태
    │   └── modalStore.ts        # GlobalModal 전역 상태
    │
    ├── hooks/                   # 커스텀 React Hook
    │   ├── useModal.ts          # modalStore를 감싸는 편의 훅
    │   └── useChatSocket.ts     # 채팅 Socket.io 훅
    │
    ├── constants/               # 상수 및 공통 타입
    │   └── chat.ts              # ChatCategory 타입, 색상 매핑
    │
    ├── types/                   # 전역 TypeScript 타입 선언
    │   ├── next-auth.d.ts       # Session에 _id 필드 확장
    │   ├── declarations.d.ts    # 모듈 선언
    │   └── frappe-gantt.d.ts    # 라이브러리 타입 보완
    │
    └── lib/                     # 서버/공통 유틸리티
        ├── auth.ts              # next-auth authOptions (로그인 로직, JWT 콜백)
        ├── mongodb.ts           # Mongoose 연결 (싱글톤 캐싱)
        ├── socket.ts            # Socket.io 클라이언트 싱글톤
        ├── iconUtils.ts         # skillicons.dev 아이콘 URL 생성 유틸
        ├── profileUtils.ts      # 프로필 관련 유틸
        ├── blog/                # RSS 파싱 (Velog 등 Tech Blog)
        ├── github/              # GitHub GraphQL API 연동 (통계 수집)
        ├── models/              # Mongoose 스키마 & 모델
        │   ├── User.ts          # 컬렉션: memberbasics
        │   ├── Project.ts
        │   ├── Application.ts
        │   ├── Notification.ts
        │   ├── Availability.ts
        │   ├── ChatRoom.ts
        │   ├── ChatMessage.ts
        │   ├── Comment.ts
        │   ├── CommonCode.ts
        │   ├── Counter.ts       # pid, uid 등 자동 증가 카운터
        │   ├── Post.ts
        │   ├── ProjectMember.ts
        │   ├── Skill.ts
        │   ├── TechStack.ts
        │   ├── kanban/          # BoardModel, SectionModel, NoteModel
        │   └── wbs/             # TaskModel
        ├── store/
        │   └── notificationStore.ts  # 알림 Zustand 스토어 (서버/클라이언트 공용)
        └── utils/               # 헬퍼 함수 (WBS 의존성 계산 등)
```

---

## 4. 주요 컴포넌트 역할

### 레이아웃 / 전역

| 컴포넌트 | 역할 |
|----------|------|
| `AuthSessionProvider` | `SessionProvider`를 클라이언트 컴포넌트로 분리해 App Router에서 next-auth 세션 공급 |
| `ThemeProvider` | styled-components 테마 공급자 |
| `GlobalModal` | `modalStore` 기반 전역 Alert/Confirm 모달. `window.alert` 대신 이걸 씁니다 |
| `Header` | 네비게이션, 알림 아이콘, 로그아웃, Socket 연결/해제 |

### 칸반 보드 (`src/components/board/`)

| 컴포넌트 | 역할 |
|----------|------|
| `BoardShell` | 칸반 보드 메인 컨테이너. `boardStore`에서 상태를 구독하고 Socket 이벤트를 초기화합니다 |
| `NoteItem` | 드래그 가능한 개별 노트 카드 |
| `SectionItem` | 노트를 그룹화하는 섹션(컨테이너) |
| `Minimap` | 보드 전체 축소 지도 |
| `ZoomController` | 줌 인/아웃 컨트롤러 |
| `ShortcutHandler` | 키보드 단축키 처리 |
| `ShortcutModal` | 단축키 목록 안내 모달 |

### WBS (`src/components/wbs/`)

| 컴포넌트 | 역할 |
|----------|------|
| `GanttChart` | `gantt-task-react` 기반 간트 차트. `wbsStore`의 tasks를 렌더링 |
| `TaskList` | 태스크 목록 사이드 패널 |
| `TaskForm` | 태스크 추가/수정 폼 |
| `DependencySettingModal` | 선행/후행 의존성 설정 모달 |

### 프로필 (`src/components/profile/`)

| 컴포넌트 | 역할 |
|----------|------|
| `OnboardingWizard` | 첫 로그인 시 직군·경력 등 정보 수집 다단계 마법사 |
| `ProfileHeader` | 프로필 상단 (아바타, 이름, 상태, 기술 스택 아이콘) |
| `StatusDashboard` | GitHub 통계, Solved.ac, Blog RSS를 종합 표시 |
| `GitHubStats` | GitHub GraphQL 기반 활동 지표 (커밋, 언어 등) |
| `SolvedAcCard` | Solved.ac 티어 및 스트릭 카드 |
| `BlogPostCard` | RSS 파싱으로 수집한 최신 블로그 글 카드 |
| `AvailabilityScheduler` | 주간 협업 가능 시간 드래그 선택 |

### 대시보드 (`src/components/dashboard/`)

| 컴포넌트 | 역할 |
|----------|------|
| `ProjectHeader` | 프로젝트 제목, 상태, 데드라인 표시 |
| `ProjectOverview` | 프로젝트 개요 편집 (PM 전용) |
| `MemberWidget` | 현재 접속 중인 팀원 Presence 표시 |
| `ResourceModal` | 프로젝트 공유 리소스(링크/텍스트) 등록 모달 |

---

## 5. 실행 방법

### 개발 환경

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.local.example .env.local  # 없으면 직접 생성 (아래 참조)

# 3. 개발 서버 실행 (nodemon이 server.ts를 감시)
npm run dev
# → http://localhost:3000
```

**필수 환경 변수 (`.env.local`)**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 프로덕션 빌드

```bash
npm run build   # Next.js 빌드 + server.ts → dist/server.js 컴파일
npm run start   # NODE_ENV=production node dist/server.js
```

### 유용한 스크립트

```bash
npm run lint     # ESLint 검사
npm run format   # Prettier 포맷팅 (커밋 전 실행 권장)
```

---

## 6. 코딩 컨벤션

### 6-1. 파일 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| React 컴포넌트 | PascalCase | `BoardShell.tsx`, `NoteItem.tsx` |
| 훅 | camelCase, `use` 접두어 | `useModal.ts`, `useChatSocket.ts` |
| 스토어 | camelCase, `Store` 접미어 | `boardStore.ts`, `wbsStore.ts` |
| 유틸/라이브러리 | camelCase | `iconUtils.ts`, `profileUtils.ts` |
| 상수 파일 | camelCase | `chat.ts` |
| Mongoose 모델 | PascalCase, 단수형 | `User.ts`, `Project.ts` |

### 6-2. 클라이언트 / 서버 컴포넌트 구분

Next.js App Router는 **기본적으로 서버 컴포넌트**입니다.
`useState`, `useEffect`, `useSession` 등 클라이언트 전용 API를 사용하면 **파일 최상단에 반드시 `'use client'`를 선언**하세요.

```tsx
// ✅ 올바른 예
'use client';
import { useState } from 'react';
```

### 6-3. API Route 응답 형식

모든 API Route는 아래 형식을 따릅니다. 일관성이 깨지면 클라이언트 에러 처리가 복잡해집니다.

```ts
// 성공
return NextResponse.json({ success: true, data: { ... } });
// 또는
return NextResponse.json({ success: true, message: '...' }, { status: 201 });

// 실패
return NextResponse.json(
  { success: false, message: '사용자 친화적 메시지', error: error.message },
  { status: 400 | 401 | 404 | 500 }
);
```

### 6-4. API Route 필수 패턴

모든 API Route 핸들러 시작 부분에 아래 두 가지를 반드시 포함하세요.

```ts
// 1. 동적 렌더링 강제 (캐시 방지)
export const dynamic = 'force-dynamic';

// 2. DB 연결 (각 핸들러 내부에서 호출)
await dbConnect();

// 3. 인증이 필요한 엔드포인트
const session = await getServerSession(authOptions);
if (!session || !session.user?._id) {
  return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
}
const currentUserId = session.user._id;
```

### 6-5. Mongoose 모델 정의 패턴

새 모델을 추가할 때 아래 구조를 따르세요.

```ts
import mongoose, { Document, Schema } from 'mongoose';

// 1. 인터페이스 (Document 확장)
export interface IFoo extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. 스키마
const FooSchema: Schema = new Schema(
  { name: { type: String, required: true } },
  { timestamps: true }  // createdAt, updatedAt 자동 생성
);

// 3. 모델 등록 (Hot Reload 대비 중복 등록 방지)
export default mongoose.models.Foo || mongoose.model<IFoo>('Foo', FooSchema);
```

> ⚠️ `User` 모델은 컬렉션 이름이 `memberbasics`입니다. 모델 정의 시 세 번째 인자로 컬렉션 이름을 명시했습니다.

### 6-6. Zustand 스토어 패턴

스토어는 **상태(State)와 액션(Actions)을 분리하여 타입 정의** 후 작성합니다.

```ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type FooState = {
  // 상태
  items: Item[];
  isLoading: boolean;
  // 액션
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
};

export const useFooStore = create<FooState>()(
  devtools(
    (set, get) => ({
      items: [],
      isLoading: false,
      fetchItems: async () => {
        set({ isLoading: true });
        // ... API 호출
        set({ items: [...], isLoading: false });
      },
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }),
    { name: 'FooStore' }  // devtools 이름 지정
  )
);
```

### 6-7. 모달 사용

`window.alert()` / `window.confirm()` 대신 `useModal` 훅을 사용하세요.

```tsx
'use client';
import { useModal } from '@/hooks/useModal';

const { confirm, alert } = useModal();

// 확인/취소 모달
const ok = await confirm('삭제 확인', '정말 삭제하시겠습니까?', {
  confirmText: '삭제',
  isDestructive: true,  // 빨간색 버튼
});
if (ok) { /* 삭제 로직 */ }

// 알림 모달
await alert('완료', '저장되었습니다.');
```

### 6-8. Socket.io 사용

클라이언트에서 Socket은 `src/lib/socket.ts`의 싱글톤을 통해 가져옵니다.
컴포넌트가 언마운트될 때 반드시 이벤트 구독을 해제하세요.

```ts
import { getSocket } from '@/lib/socket';

useEffect(() => {
  const socket = getSocket();
  socket.on('note-updated', handleNoteUpdated);

  return () => {
    socket.off('note-updated', handleNoteUpdated);  // 구독 해제 필수
  };
}, []);
```

### 6-9. 상수 / 타입 관리

특정 도메인의 상수는 `src/constants/` 에 모읍니다.
Union 타입과 매핑 객체를 함께 정의하면 타입 안정성과 유지보수성이 높아집니다.

```ts
// src/constants/chat.ts 패턴 참조
export type ChatCategory = 'INQUIRY' | 'RECRUIT' | 'TEAM' | 'DM' | 'SYSTEM';

export const CHAT_CATEGORY_COLORS: Record<ChatCategory, string> = {
  INQUIRY: '#FFD93D',
  // ...
};
```

### 6-10. 코드 스타일

- **들여쓰기**: 2 spaces (Prettier 기본값)
- **세미콜론**: 있음 (`;`)
- **따옴표**: 문자열은 작은따옴표(`'`) 기본, JSX attribute는 큰따옴표(`"`)
- **줄바꿈**: 함수/클래스 사이, 주요 로직 블록 사이에 빈 줄 추가
- **주석**: 중요한 로직, 의도가 불명확한 코드에 한국어 또는 영어 주석 추가
- **JSDoc**: 공용 함수와 훅에 `/** ... */` JSDoc 작성
- **이모지**: 상수/주석에서 제한적으로 허용 (과도하게 남용하지 않기)

---

## 7. 환경별 주의사항

### TypeScript / ESLint

`next.config.js`에 아래 설정이 활성화되어 있습니다. 빌드 에러를 막기 위한 임시 설정이며, **타입 에러와 ESLint 경고를 방치하지 말고 가능하면 해결하세요**.

```js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

### next-auth Session 확장

`session.user`에 기본적으로 없는 `_id` 필드를 `src/types/next-auth.d.ts`에서 확장했습니다.
클라이언트에서 `session.user?._id`, 서버에서 `session.user?._id`로 접근하세요.

### MongoDB 컬렉션 이름

`User` 모델의 실제 MongoDB 컬렉션 이름은 `memberbasics`입니다(레거시 이유). 직접 컬렉션을 조회하는 코드를 작성할 때 유의하세요.

### Cloudinary 업로드 플로우

이미지 업로드는 클라이언트 → `/api/cloudinary` (서명 발급) → Cloudinary SDK 업로드 → URL 저장 방식입니다. 이미지를 직접 서버로 업로드하지 않습니다.

### Socket.io 서버 경로

Socket.io의 연결 경로는 `/api/socket/io`입니다 (`server.ts`와 `src/lib/socket.ts` 양쪽에서 일치해야 합니다).

---

## 8. 작업 중인 기능 (In Progress)

아래 기능은 구현이 진행 중이거나 프로토타입 상태입니다. 관련 코드를 수정할 때 작업 맥락을 팀과 공유하세요.

| 기능 | 상태 | 비고 |
|------|------|------|
| 채팅 (Chat) | 🚧 UI 프로토타입 | Mock 데이터 사용 중. 실시간 DB 연동 미완성 |
| 댓글 (Comment) | 🚧 모델만 존재 | `Comment.ts` 정의됨, API/UI 미구현 |
| Post | 🚧 모델만 존재 | `Post.ts` 정의됨, API/UI 미구현 |

---

## 9. Git 브랜치 & 커밋 전략

```
main          ← 배포 브랜치 (Render 자동 배포)
feature/*     ← 새 기능 개발
fix/*         ← 버그 수정
refactor/*    ← 리팩토링
```

**커밋 메시지 컨벤션 (Conventional Commits 권장)**
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 기능 변경 없는 코드 개선
style: 포맷팅, 세미콜론 등 스타일 변경
docs: 문서 수정
chore: 빌드/설정 변경
```

---

## 10. Claude AI Agent를 위한 추가 지침

> 이 섹션은 Claude AI가 코드를 생성하거나 수정할 때 따라야 할 규칙입니다.

### 반드시 지켜야 할 규칙

1. **기존 패턴을 먼저 파악하세요.** 유사한 기능의 기존 파일을 참고하여 동일한 구조와 스타일로 작성합니다.
2. **`'use client'` 지시어를 정확히 사용하세요.** 훅, 이벤트 핸들러, 브라우저 API를 사용하는 컴포넌트는 빠짐없이 선언합니다.
3. **API 응답 형식을 통일하세요.** `{ success, data | message | error }` 구조를 반드시 유지합니다.
4. **각 API Route에서 `dbConnect()`를 호출하세요.** 연결이 없으면 요청이 실패합니다.
5. **새 Mongoose 모델 추가 시 `mongoose.models.X || mongoose.model(...)` 패턴을 사용하세요.** 핫 리로드 중 중복 등록 에러를 방지합니다.
6. **전역 모달은 `useModal` 훅을 사용하세요.** `window.alert`/`window.confirm`은 금지입니다.
7. **소켓 이벤트 핸들러는 컴포넌트 언마운트 시 반드시 해제하세요.**
8. **타입을 `any`로 남겨두지 마세요.** 기존 인터페이스를 활용하거나 새 타입을 `src/types/`에 추가합니다.

### 코드 생성 시 체크리스트

- [ ] 파일 네이밍이 컨벤션에 맞는가?
- [ ] 클라이언트 컴포넌트에 `'use client'` 선언이 있는가?
- [ ] API Route에 `dynamic = 'force-dynamic'`과 `dbConnect()` 호출이 있는가?
- [ ] 인증이 필요한 엔드포인트에 `getServerSession` 체크가 있는가?
- [ ] 응답 형식이 `{ success, data | message | error }` 구조인가?
- [ ] 새 Mongoose 모델이 중복 등록 방지 패턴을 사용하는가?
- [ ] Zustand 스토어에 `devtools` 미들웨어가 있는가?
- [ ] 소켓 구독이 cleanup 함수에서 해제되는가?
- [ ] `@/` 경로 별칭을 사용하는가?

---

## 11. 테스트 작성 규칙 (Vitest — Phase 2 적용 완료)

### 테스트 환경
- **테스트 러너**: Vitest (`npm run test:run` / `test:watch` / `test:coverage`)
- **설정 파일**: `vitest.config.ts` (루트), `@/` 별칭 사용 가능
- **전역 setup**: `src/__tests__/setup.ts` (afterEach vi.restoreAllMocks 자동 적용)
- **현재 테스트 수**: 364개 (Phase 1: 203개, Phase 2: 161개)
- **자세한 사용법**: `TESTING_PHASE1_GUIDE.md`, `TESTING_PHASE2_GUIDE.md` 참조

### 테스트 파일 위치 규칙
테스트 파일은 **원본 파일 바로 옆**에 배치합니다. 별도 폴더 금지.

```
src/lib/utils/wbs/taskDependency.ts
src/lib/utils/wbs/taskDependency.test.ts  ← 여기
src/store/wbsStore.ts
src/store/wbsStore.test.ts                ← 여기
```

### 테스트 인프라 구조

```
src/__tests__/
├── setup.ts                # Vitest 전역 설정 (afterEach vi.restoreAllMocks)
├── fixtures/               # 테스트용 Mock 데이터
│   ├── users.ts            # mockUserAlice, mockUserBob 등
│   ├── projects.ts         # Mock 프로젝트 데이터
│   ├── tasks.ts            # linearChainTasks, parallelTasks 등
│   ├── chat.ts             # Mock 채팅 데이터
│   └── index.ts            # 통합 export
└── helpers/                # 테스트 헬퍼 유틸
    ├── mockSession.ts      # createMockSession, mockGetServerSession
    ├── mockSocket.ts       # createMockSocket, emitFromServer
    └── index.ts            # 통합 export
```

### 11-1. Phase 1 — 순수 함수 테스트

아래 위치에 **순수 함수**(DB·네트워크·소켓 의존성 없음)를 추가하거나 수정할 때
반드시 `*.test.ts` 파일을 함께 작성합니다.

- `src/lib/utils/**/*.ts`
- `src/lib/iconUtils.ts`, `src/lib/profileUtils.ts`
- `src/constants/**/*.ts`

#### 테스트 작성 필수 패턴

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFile';

describe('myFunction', () => {
  // 정상 케이스 3개 이상
  it('한국어로 테스트 의도를 명확히 설명한다', () => {
    // Arrange
    const input = ...;
    // Act
    const result = myFunction(input);
    // Assert
    expect(result).toBe(expected);
  });

  // 엣지 케이스 2개 이상 (빈 배열, 빈 문자열, 경계값)
  it('입력이 빈 배열이면 빈 배열을 반환한다', () => { ... });

  // 에러/실패 케이스 1개 이상
  it('잘못된 입력이면 false를 반환한다', () => { ... });
});
```

### 11-2. Phase 2 — Zustand 스토어 + 훅 테스트

`src/store/**/*.ts` 또는 `src/hooks/**/*.ts`를 추가하거나 수정할 때
반드시 `*.test.ts` 파일을 함께 작성합니다.

#### fetch Mock 패턴

```typescript
// 성공 응답
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, data: { _id: 'task-001', title: '작업' } }),
});

// 실패 응답
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  json: () => Promise.resolve({ success: false, message: '에러' }),
});
```

#### Socket Mock 패턴 (vi.hoisted 필수)

`vi.mock()`은 파일 최상단으로 호이스팅되므로, 외부 변수 참조 시 `vi.hoisted()`를 사용합니다.

```typescript
// ✅ 올바른 방법
const { mockSocket, emitFromServer, clearListeners } = vi.hoisted(() => {
  const listeners = new Map();
  return {
    mockSocket: {
      emit: vi.fn(),
      on: vi.fn((event, handler) => { /* ... */ }),
      off: vi.fn(),
      disconnect: vi.fn(),
    },
    emitFromServer: (event, ...args) => { /* ... */ },
    clearListeners: () => listeners.clear(),
  };
});
vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket,
  socketClient: { connect: () => mockSocket, disconnect: vi.fn(), socket: mockSocket },
}));

// ❌ 에러 — mockSocket이 호이스팅 시점에 초기화되지 않음
const { mockSocket } = createMockSocket();
vi.mock('@/lib/socket', () => ({ getSocket: () => mockSocket })); // ReferenceError!
```

#### Zustand 스토어 직접 테스트 패턴

React 렌더링 없이 스토어를 직접 조작합니다.

```typescript
import { useWbsStore } from './wbsStore';

// 각 테스트 전 초기화
beforeEach(() => {
  useWbsStore.setState({ tasks: [], selectedTaskId: null, isLoading: false });
  vi.restoreAllMocks();
  mockSocket.emit.mockClear();
});

// 상태 읽기
const state = useWbsStore.getState();

// 상태 직접 설정 (테스트 준비용)
useWbsStore.setState({ tasks: [mockTask], selectedTaskId: 'task-001' });

// 액션 호출
await useWbsStore.getState().fetchTasks(1);
```

#### 스토어 테스트 시 반드시 검증할 항목

| 확인 항목 | 설명 |
|----------|------|
| API 성공 시 상태 업데이트 | `expect(state.tasks).toHaveLength(2)` |
| API 호출 URL/method | `expect(fetch).toHaveBeenCalledWith('/api/...', { method: 'POST' })` |
| Optimistic Update | fetch를 지연시켜 서버 응답 전 상태 반영 확인 |
| API 실패 시 롤백 | `mockFetchFailure()` → 원래 상태 유지 |
| 소켓 브로드캐스트 | `expect(mockSocket.emit).toHaveBeenCalledWith(...)` |
| 소켓 조건 미충족 | `currentPid: null` → `emit` 미호출 |

#### 테스트 헬퍼 사용법

```typescript
// mockSession — next-auth 세션 Mock
import { createMockSession } from '@/__tests__/helpers';
const session = createMockSession();                                    // 기본 (Alice)
const admin = createMockSession({ user: { _id: 'admin-001', memberType: 'ADM' } });

// mockSocket — Socket.io 클라이언트 Mock
import { createMockSocket } from '@/__tests__/helpers';
const { mockSocket, emitFromServer, clearListeners } = createMockSocket();
```

### Fixture 재사용

테스트용 Mock 데이터는 새로 만들지 말고 기존 fixture를 우선 사용합니다.

```typescript
// ✅ 올바른 방식
import { mockUserAlice } from '@/__tests__/fixtures/users';
import { linearChainTasks } from '@/__tests__/fixtures/tasks';

// 기존 fixture를 변형해서 사용
const customTask = { ...linearChainTasks[0], title: '변경된 제목' };
```

새 도메인이 생기면 `src/__tests__/fixtures/`에 파일을 추가하고
`index.ts`에 `export *`를 등록합니다.

### 코드 생성 시 체크리스트 (테스트)

**Phase 1 (순수 함수)**
- [ ] 순수 함수 추가/수정 시 `*.test.ts` 파일이 함께 생성되었는가?
- [ ] 정상 케이스 3개 + 엣지 케이스 2개 + 실패 케이스 1개 이상인가?

**Phase 2 (스토어/훅)**
- [ ] Zustand 스토어 추가/수정 시 `*.test.ts` 파일이 함께 생성되었는가?
- [ ] `fetch` Mock으로 API 성공/실패 케이스를 모두 테스트했는가?
- [ ] Optimistic Update가 있다면 서버 응답 전후 상태를 모두 검증했는가?
- [ ] API 실패 시 롤백 동작을 검증했는가?
- [ ] 소켓 이벤트 emit/수신을 검증했는가?
- [ ] `vi.hoisted()` + `vi.mock()` 패턴을 올바르게 사용했는가?

**공통**
- [ ] 테스트 이름이 한국어로 의도를 명확히 설명하는가?
- [ ] `npm run test:run` 실행 시 전부 통과하는가?
- [ ] 기존 fixture를 활용했는가? (중복 Mock 데이터 생성 금지)

---

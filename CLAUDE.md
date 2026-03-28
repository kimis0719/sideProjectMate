# CLAUDE.md — Side Project Mate

> 이 문서는 팀원 및 Claude AI Agent가 동일한 컨텍스트로 일관된 퀄리티의 작업을 수행하기 위한 가이드입니다.
> 코드를 수정하거나 새 기능을 추가하기 전에 반드시 이 문서를 읽고 숙지하세요.
> 작업 시작 전 `PROJECT_INDEX.md`를 읽고 프로젝트 구조를 파악하세요.

---

## 1. 프로젝트 개요

**Side Project Mate**는 개발자들이 사이드 프로젝트 팀원을 찾고 협업할 수 있는 풀스택 플랫폼입니다.

- **서버**: Express + Socket.io 커스텀 서버(`server.ts`) 위에서 Next.js App Router 구동
- **DB**: MongoDB Atlas (Mongoose ODM)
- **실시간**: Socket.io (경로: `/api/socket/io`)
- **인증**: next-auth v4 (JWT 전략, Credentials Provider)
- **배포**: Render.com (Free Plan, `render.yaml` 참조)
- **주요 기술**: Next.js 14 / TypeScript / Tailwind CSS / Zustand / Mongoose 8

### 경로 별칭

`tsconfig.json`에서 `@/`를 `src/`로 매핑합니다. 모든 import에 `@/`를 사용하세요.

```ts
// ✅ 올바른 방식
import User from '@/lib/models/User';
// ❌ 금지
import User from '../../lib/models/User';
```

---

## 2. 코딩 컨벤션

### 2-1. 파일 네이밍

| 대상            | 규칙                      | 예시                              |
| --------------- | ------------------------- | --------------------------------- |
| React 컴포넌트  | PascalCase                | `BoardShell.tsx`, `NoteItem.tsx`  |
| 훅              | camelCase, `use` 접두어   | `useModal.ts`, `useChatSocket.ts` |
| 스토어          | camelCase, `Store` 접미어 | `boardStore.ts`, `wbsStore.ts`    |
| 유틸/라이브러리 | camelCase                 | `iconUtils.ts`, `profileUtils.ts` |
| Mongoose 모델   | PascalCase, 단수형        | `User.ts`, `Project.ts`           |

### 2-2. 클라이언트 / 서버 컴포넌트 구분

`useState`, `useEffect`, `useSession` 등 클라이언트 전용 API를 사용하면 **파일 최상단에 반드시 `'use client'`를 선언**하세요.

### 2-3. API Route 응답 형식

```ts
// 성공
return NextResponse.json({ success: true, data: { ... } });
// 실패
return NextResponse.json(
  { success: false, message: '사용자 친화적 메시지', error: error.message },
  { status: 400 | 401 | 404 | 500 }
);
```

### 2-4. API Route 필수 패턴

```ts
export const dynamic = 'force-dynamic'; // 캐시 방지
await dbConnect(); // DB 연결 필수
// 인증이 필요한 엔드포인트:
const session = await getServerSession(authOptions);
if (!session || !session.user?._id) {
  return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
}
```

### 2-5. Mongoose 모델 정의 패턴

```ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IFoo extends Document {
  name: string;
}
const FooSchema: Schema = new Schema(
  { name: { type: String, required: true } },
  { timestamps: true }
);
// Hot Reload 대비 중복 등록 방지
export default mongoose.models.Foo || mongoose.model<IFoo>('Foo', FooSchema);
```

### 2-6. Zustand 스토어 패턴

- 상태(State)와 액션(Actions)을 분리하여 타입 정의
- `devtools` 미들웨어 필수 사용
- `window.alert()`/`window.confirm()` 대신 `useModal` 훅 사용

### 2-7. Socket.io 사용

- `src/lib/socket.ts`의 `getSocket()` 싱글톤 사용
- 컴포넌트 언마운트 시 `socket.off()` 필수
- 서버 경로: `/api/socket/io` (`server.ts`와 `src/lib/socket.ts` 양쪽 일치 필수)

### 2-8. 코드 스타일

- **들여쓰기**: 2 spaces / **세미콜론**: 있음
- **따옴표**: 문자열 `'`, JSX attribute `"`
- **주석**: 한국어 또는 영어, 의도가 불명확한 코드에 추가
- **타입**: `any` 금지, 기존 인터페이스 활용 또는 `src/types/`에 추가

---

## 3. 환경별 주의사항

- **TypeScript/ESLint**: `next.config.js`에서 `ignoreBuildErrors`, `ignoreDuringBuilds` 활성화 중 (임시). 타입 에러는 방치하지 마세요.
- **next-auth Session 확장**: `src/types/next-auth.d.ts`에서 `session.user._id` 필드 확장됨
- **User 모델 컬렉션**: 실제 MongoDB 컬렉션 이름은 `memberbasics` (레거시)
- **Cloudinary 업로드**: 클라이언트 → `/api/cloudinary` (서명) → Cloudinary SDK 직접 업로드
- **상수/타입 관리**: `src/constants/`에 Union 타입 + 매핑 객체로 정의

---

## 4. Git 브랜치 & 커밋 전략

```
main          ← 배포 브랜치 (Render 자동 배포)
feature/*     ← 새 기능 개발
fix/*         ← 버그 수정
refactor/*    ← 리팩토링
```

커밋 메시지: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, `test:` (Conventional Commits)

---

## 5. 코드 생성 시 체크리스트

- [ ] `'use client'` 선언 (클라이언트 컴포넌트)
- [ ] API Route에 `dynamic = 'force-dynamic'` + `dbConnect()` 호출
- [ ] 인증 필요 엔드포인트에 `getServerSession` 체크
- [ ] 응답 형식 `{ success, data | message | error }` 통일
- [ ] Mongoose 모델 중복 등록 방지 패턴
- [ ] Zustand 스토어에 `devtools` 미들웨어
- [ ] Socket 구독 cleanup 함수에서 해제
- [ ] `@/` 경로 별칭 사용
- [ ] `any` 타입 사용 금지

---

## 6. 테스트 작성 규칙 (Vitest — Phase 3 적용 완료)

- **현재 테스트 수**: 457개 (Phase 1: 203개, Phase 2: 161개, Phase 3: 93개)
- **명령어**: `npm run test:run` / `test:watch` / `test:coverage`
- **상세 가이드**: `docs/testing/` 하위 파일 참조

### 테스트 파일 위치

원본 파일 바로 옆에 배치합니다. 별도 폴더 금지.

```
src/lib/utils/wbs/taskDependency.test.ts   ← 순수 함수 (Phase 1)
src/store/wbsStore.test.ts                 ← 스토어/훅 (Phase 2)
src/app/api/wbs/tasks/route.test.ts        ← API Route (Phase 3)
```

### 테스트 작성 기준

| Phase | 대상                                             | 필수 커버리지                                       |
| ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1     | `src/lib/utils/**`, `src/constants/**` 순수 함수 | 정상 3개 + 엣지 2개 + 실패 1개 이상                 |
| 2     | `src/store/**`, `src/hooks/**`                   | fetch 성공/실패, Optimistic Update, 소켓 emit, 롤백 |
| 3     | `src/app/api/**` Route Handler                   | 401/403/400/404/201, DB 실제 저장 확인              |

### 핵심 패턴 요약

- **Phase 2 Socket Mock**: `vi.hoisted()` + `vi.mock()` 패턴 필수 (상세: `docs/testing/TESTING_PHASE2_GUIDE.md`)
- **Phase 3 필수 Mock**: `vi.mock('@/lib/mongodb')`, `vi.mock('next-auth')`, `vi.mock('next/headers')`
- **Phase 3 DB 생명주기**: `setupTestDB()` / `clearTestDB()` / `teardownTestDB()`
- **Fixture 재사용**: `src/__tests__/fixtures/` 기존 데이터 우선 사용, 중복 생성 금지

### 테스트 체크리스트

- [ ] 코드 추가/수정 시 해당 Phase의 `*.test.ts` 파일 함께 생성
- [ ] 테스트 이름 한국어로 의도 명확히 설명
- [ ] `npm run test:run` 전체 통과 확인
- [ ] 기존 fixture 활용 (중복 Mock 데이터 금지)

---

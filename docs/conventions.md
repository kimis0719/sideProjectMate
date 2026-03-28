# 코딩 컨벤션 상세 가이드

> 요약본은 `CLAUDE.md` 참조. 이 문서는 상세 설명이 필요할 때만 읽으세요.

## 파일 네이밍

| 대상            | 규칙                      | 예시                              |
| --------------- | ------------------------- | --------------------------------- |
| React 컴포넌트  | PascalCase                | `BoardShell.tsx`, `NoteItem.tsx`  |
| 훅              | camelCase, `use` 접두어   | `useModal.ts`, `useChatSocket.ts` |
| 스토어          | camelCase, `Store` 접미어 | `boardStore.ts`, `wbsStore.ts`    |
| 유틸/라이브러리 | camelCase                 | `iconUtils.ts`, `profileUtils.ts` |
| Mongoose 모델   | PascalCase, 단수형        | `User.ts`, `Project.ts`           |

## 클라이언트 / 서버 컴포넌트 구분

`useState`, `useEffect`, `useSession` 등 클라이언트 전용 API를 사용하면 **파일 최상단에 반드시 `'use client'`를 선언**하세요.

## API Route 응답 형식

```ts
// 성공
return NextResponse.json({ success: true, data: { ... } });
// 실패
return NextResponse.json(
  { success: false, message: '사용자 친화적 메시지', error: error.message },
  { status: 400 | 401 | 404 | 500 }
);
```

## API Route 필수 패턴

```ts
export const dynamic = 'force-dynamic'; // 캐시 방지
await dbConnect(); // DB 연결 필수

// 인증이 필요한 엔드포인트:
const session = await getServerSession(authOptions);
if (!session || !session.user?._id) {
  return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
}
```

## Mongoose 모델 정의 패턴

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

## Zustand 스토어 패턴

- 상태(State)와 액션(Actions)을 분리하여 타입 정의
- `devtools` 미들웨어 필수 사용
- `window.alert()` / `window.confirm()` 대신 `useModal` 훅 사용

## Socket.io 사용

- `src/lib/socket.ts`의 `getSocket()` 싱글톤 사용
- 컴포넌트 언마운트 시 `socket.off()` 필수
- 서버 경로: `/api/socket/io` (`server.ts`와 `src/lib/socket.ts` 양쪽 일치 필수)

## 코드 스타일

- **들여쓰기**: 2 spaces / **세미콜론**: 있음
- **따옴표**: 문자열 `'`, JSX attribute `"`
- **주석**: 한국어 또는 영어, 의도가 불명확한 코드에 추가
- **타입**: `any` 금지, 기존 인터페이스 활용 또는 `src/types/`에 추가

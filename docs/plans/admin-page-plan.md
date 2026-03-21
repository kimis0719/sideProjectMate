# Side Project Mate — 관리자 페이지 개발 계획

> 작성일: 2026-02-28
> 대상 독자: 개발팀, HyunJin

---

## 1. 관리자 페이지 필요 여부 판단

### ✅ 결론: **필요하다**

코드베이스를 전체적으로 분석한 결과, 현재 프로젝트에는 아래와 같은 구조적 공백이 있습니다.

| 영역 | 현황 | 문제 |
|------|------|------|
| **공통 코드(CommonCode)** | DB에 존재하나 관리 UI 없음 | 새 카테고리/직군 추가 시 직접 DB 접근 필요 |
| **기술 스택(TechStack)** | DB에 존재하나 관리 UI 없음 | 새 기술 추가 시 직접 DB 접근 필요 |
| **사용자 관리** | `memberType: 'user'` 필드만 존재 | 악성 유저 비활성화, 관리자 지정 수단 없음 |
| **프로젝트 모더레이션** | 프로젝트 작성자만 자체 삭제 가능 | 불건전 게시물 운영자 삭제 수단 없음 |
| **플랫폼 통계** | 없음 | 서비스 현황 파악 불가 |

### 판단 근거

1. **공통 코드 및 기술 스택은 플랫폼의 근간 데이터**입니다. 프로젝트 모집 시 직군(`position`), 기술 스택(`techTags`), 카테고리 필터 등이 모두 이 데이터에 의존하는데, 현재는 MongoDB Atlas에 직접 접속해야만 추가·수정이 가능합니다.

2. **`User` 모델에 `memberType` 필드가 이미 준비되어 있습니다.** 기본값이 `'user'`로 되어 있어 `'admin'` 등의 역할 확장이 자연스럽습니다. 인프라를 새로 만들 필요가 없습니다.

3. **서비스가 성장할수록 콘텐츠 모더레이션이 필요해집니다.** 스팸 프로젝트, 가짜 지원자, 부적절한 소개글 등에 대응할 운영 도구가 없으면 플랫폼 신뢰도가 하락합니다.

4. **현재 대안(MongoDB Atlas 직접 접근)은 운영 위험이 큽니다.** 실수로 데이터를 잘못 수정하거나 삭제할 가능성이 있으며, 협업 시 공유하기 어렵습니다.

---

## 2. 관리자 페이지 범위 (Scope)

### 포함할 기능 (MVP)

```
Phase 1: 기반 작업 (1~2일)
Phase 2: 핵심 관리 기능 (3~5일)
Phase 3: 통계 & 모더레이션 (2~3일)
```

### 제외할 기능 (Out of Scope)

- 세분화된 권한 그룹 (RBAC): 초기엔 `admin` 단일 역할로 충분
- 감사 로그(Audit Log): 추후 필요 시 추가
- 다국어 대응 관리: 현재 프로젝트는 한국어 단일

---

## 3. 개발 계획 상세

### Phase 1: 기반 작업

#### 1-1. `memberType` 역할 확장

**파일**: `src/lib/models/User.ts`

```ts
// 변경 전
memberType: { type: String, default: 'user' }

// 변경 후
memberType: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
}
```

**파일**: `src/types/next-auth.d.ts`
세션에 `memberType` 필드 추가

```ts
declare module 'next-auth' {
  interface Session {
    user: {
      _id: string;
      memberType: 'user' | 'admin'; // 추가
    } & DefaultSession['user'];
  }
}
```

**파일**: `src/lib/auth.ts`
JWT 콜백에서 `memberType`을 세션에 포함

```ts
callbacks: {
  jwt: async ({ token, user }) => {
    if (user) {
      token._id = user._id;
      token.memberType = user.memberType; // 추가
    }
    return token;
  },
  session: async ({ session, token }) => {
    session.user._id = token._id;
    session.user.memberType = token.memberType; // 추가
    return session;
  }
}
```

#### 1-2. 관리자 인증 미들웨어 유틸 작성

**신규 파일**: `src/lib/adminAuth.ts`

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return { error: NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 }) };
  }
  if (session.user.memberType !== 'admin') {
    return { error: NextResponse.json({ success: false, message: '관리자 권한이 필요합니다.' }, { status: 403 }) };
  }
  return { session };
}
```

#### 1-3. 관리자 레이아웃 & 라우팅 구성

**신규 경로**: `src/app/admin/`

```
src/app/admin/
├── layout.tsx          # 관리자 전용 레이아웃 (사이드바 + 인증 가드)
├── page.tsx            # 대시보드 (통계 요약)
├── users/
│   └── page.tsx        # 사용자 목록 & 관리
├── projects/
│   └── page.tsx        # 프로젝트 목록 & 모더레이션
├── common-codes/
│   └── page.tsx        # 공통 코드 CRUD
└── tech-stacks/
    └── page.tsx        # 기술 스택 CRUD
```

**`src/app/admin/layout.tsx`** — 서버 컴포넌트로 인증 가드 처리

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.memberType !== 'admin') {
    redirect('/');
  }
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

---

### Phase 2: 핵심 관리 기능

#### 2-1. 공통 코드 관리 (CommonCode CRUD)

**현재 문제**: `/api/common-codes`는 GET만 구현되어 있으며 관리 UI 없음

**신규 API**: `src/app/api/admin/common-codes/route.ts`

구현할 엔드포인트:
- `GET /api/admin/common-codes` — 전체 목록 (그룹별 페이지네이션)
- `POST /api/admin/common-codes` — 새 코드 추가
- `PUT /api/admin/common-codes/[id]` — 코드 수정 (label, order, isActive)
- `DELETE /api/admin/common-codes/[id]` — 코드 삭제

관리할 주요 그룹:
| group | 용도 |
|-------|------|
| `POSITION` | 직군 (프론트엔드, 백엔드, 디자이너, ...) |
| `PROJECT_CATEGORY` | 프로젝트 카테고리 |
| `CAREER` | 경력 단계 |

**UI 컴포넌트**: `src/components/admin/CommonCodeManager.tsx`
- 그룹별 탭 전환
- 인라인 편집 (label, order 수정)
- isActive 토글 스위치
- 새 코드 추가 폼

#### 2-2. 기술 스택 관리 (TechStack CRUD)

**현재 문제**: `/api/tech-stacks`는 GET만 구현되어 있으며 관리 UI 없음

**신규 API**: `src/app/api/admin/tech-stacks/route.ts`

구현할 엔드포인트:
- `GET /api/admin/tech-stacks` — 전체 목록 (카테고리 필터, 페이지네이션)
- `POST /api/admin/tech-stacks` — 새 기술 추가
- `PUT /api/admin/tech-stacks/[id]` — 기술 수정
- `DELETE /api/admin/tech-stacks/[id]` — 기술 삭제

**UI 컴포넌트**: `src/components/admin/TechStackManager.tsx`
- 카테고리별 필터 (frontend / backend / database / devops / mobile / other)
- skillicons.dev 아이콘 미리보기 (`iconUtils.ts` 활용)
- 기술명 + 카테고리 + logoUrl 편집 폼

#### 2-3. 사용자 관리

**신규 API**: `src/app/api/admin/users/route.ts`

구현할 엔드포인트:
- `GET /api/admin/users` — 전체 사용자 목록 (검색, 정렬, 페이지네이션)
- `PATCH /api/admin/users/[id]` — 상태 변경 (`delYn`, `memberType`)

**UI 기능**:
- 사용자 테이블 (이름, 이메일, 가입일, 프로젝트 수, 상태)
- 검색 (이름/이메일)
- 계정 비활성화 (`delYn: 'Y'` 설정)
- 관리자 권한 부여 (`memberType: 'admin'` 설정)
- 사용자 프로필 페이지 바로가기 링크

**주의**: 비활성화된 사용자(`delYn: 'Y'`)가 로그인 시도 시 거부되도록 `auth.ts`의 `authorize` 함수에 체크 추가 필요

```ts
// src/lib/auth.ts — authorize 함수 내
if (user.delYn === 'Y') {
  throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
}
```

#### 2-4. 프로젝트 모더레이션

**신규 API**: `src/app/api/admin/projects/route.ts`

구현할 엔드포인트:
- `GET /api/admin/projects` — 전체 프로젝트 목록 (상태 필터, 페이지네이션)
- `DELETE /api/admin/projects/[pid]` — 프로젝트 강제 삭제

**UI 기능**:
- 프로젝트 테이블 (제목, 작성자, 상태, 조회수, 지원자 수, 생성일)
- 상태 필터 (모집중 / 진행중 / 완료)
- 프로젝트 상세 페이지 바로가기 링크
- 강제 삭제 (확인 모달 필수, `useModal` 훅 활용)

---

### Phase 3: 통계 대시보드

#### 3-1. 집계 API

**신규 파일**: `src/app/api/admin/stats/route.ts`

MongoDB Aggregation Pipeline을 활용한 플랫폼 현황 통계:

```ts
// 주요 집계 항목
{
  users: {
    total: number,          // 전체 가입자
    activeToday: number,    // 오늘 활성 세션 (추정)
    newThisWeek: number,    // 이번 주 신규 가입
  },
  projects: {
    total: number,
    byStatus: {             // 상태별 분류
      recruiting: number,
      inProgress: number,
      completed: number,
    },
    newThisWeek: number,
  },
  applications: {
    total: number,
    pendingCount: number,   // 대기 중인 지원
    acceptanceRate: number, // 수락률 (%)
  },
  topTechStacks: Array<{ name: string; count: number }>, // 인기 기술 스택 Top 10
}
```

#### 3-2. 대시보드 UI

**파일**: `src/app/admin/page.tsx`

표시할 위젯:
- KPI 카드 4개 (전체 유저 / 프로젝트 / 대기 지원 / 수락률)
- 인기 기술 스택 순위 (간단한 bar 차트 또는 순위 리스트)
- 최근 가입 사용자 5명
- 최근 생성 프로젝트 5개

차트 라이브러리: 이미 의존성에 있는 패키지를 활용하거나 필요 시 Recharts 추가

---

## 4. 컴포넌트 구조

```
src/components/admin/
├── AdminSidebar.tsx        # 관리자 사이드 네비게이션
├── AdminStatCard.tsx       # KPI 카드 컴포넌트
├── AdminTable.tsx          # 범용 테이블 (정렬, 페이지네이션)
├── CommonCodeManager.tsx   # 공통 코드 CRUD UI
├── TechStackManager.tsx    # 기술 스택 CRUD UI
├── UserManageTable.tsx     # 사용자 관리 테이블
└── ProjectModerateTable.tsx # 프로젝트 모더레이션 테이블
```

---

## 5. 구현 순서 & 예상 일정

| 순서 | 작업 | 예상 소요 | 의존성 |
|------|------|-----------|--------|
| 1 | `memberType` 역할 확장 + `adminAuth.ts` 작성 | 0.5일 | - |
| 2 | `auth.ts` 세션 확장 + `delYn` 로그인 체크 | 0.5일 | 1 |
| 3 | 관리자 레이아웃 + 인증 가드 | 0.5일 | 1, 2 |
| 4 | CommonCode 관리 API + UI | 1일 | 3 |
| 5 | TechStack 관리 API + UI | 1일 | 3 |
| 6 | 사용자 관리 API + UI | 1.5일 | 3 |
| 7 | 프로젝트 모더레이션 API + UI | 1일 | 3 |
| 8 | 통계 집계 API + 대시보드 UI | 1.5일 | 4~7 |
| 9 | 테스트 & 첫 관리자 계정 생성 | 0.5일 | 전체 |

**총 예상 기간: 8~10일 (1인 기준)**

---

## 6. 첫 관리자 계정 생성 방법

관리자 페이지 완성 후, 최초 관리자 계정은 스크립트로 직접 생성합니다.

**신규 파일**: `scripts/create-admin.ts`

```ts
// 실행: ts-node scripts/create-admin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/lib/models/User';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const password = await bcrypt.hash('your-secure-password', 10);
  await User.create({
    authorEmail: 'admin@sideprojectmate.com',
    password,
    nName: '관리자',
    memberType: 'admin',
    delYn: 'N',
  });
  console.log('관리자 계정 생성 완료');
  process.exit(0);
}
main();
```

이후 관리자 페이지 내에서 다른 사용자에게 관리자 권한을 부여할 수 있습니다.

---

## 7. 보안 고려사항

- **모든 `/api/admin/*` 엔드포인트**는 `requireAdmin()` 유틸로 인증·권한을 검사합니다.
- **`/admin/*` 페이지**는 레이아웃 서버 컴포넌트에서 세션 검사 후 비관리자는 `/`로 리다이렉트합니다.
- **파괴적 작업**(사용자 비활성화, 프로젝트 삭제)은 반드시 `useModal`의 `confirm` 모달을 통해 2차 확인을 받습니다.
- **관리자 권한 부여**는 기존 관리자만 가능하며, 자기 자신의 권한은 변경하지 못하도록 제한합니다.
- 추후 감사 로그(Audit Log) 모델(`AdminLog`)을 추가해 모든 관리 행위를 기록하는 것을 권장합니다.

---

## 8. 기존 코드 변경 영향 범위

이 계획은 **기존 코드를 최대한 건드리지 않고** 새 기능을 추가하는 방향으로 설계되었습니다.

| 파일 | 변경 유형 | 내용 |
|------|-----------|------|
| `src/lib/models/User.ts` | 수정 | `memberType` enum 추가 |
| `src/lib/auth.ts` | 수정 | JWT/세션 콜백에 `memberType` 추가, `delYn` 로그인 체크 |
| `src/types/next-auth.d.ts` | 수정 | `memberType` 타입 선언 추가 |
| `src/app/admin/**` | 신규 | 관리자 페이지 전체 |
| `src/app/api/admin/**` | 신규 | 관리자 API 전체 |
| `src/components/admin/**` | 신규 | 관리자 UI 컴포넌트 전체 |
| `src/lib/adminAuth.ts` | 신규 | 관리자 인증 유틸 |
| `scripts/create-admin.ts` | 신규 | 최초 관리자 계정 생성 스크립트 |

**기존 사용자 기능, 프로젝트 기능, 칸반/WBS 기능에는 영향 없음.**

---

## 9. 향후 확장 가능 기능 (추후 검토)

- **공지사항 관리**: `Post` 모델이 이미 존재하므로 관리자 글쓰기 기능 연결 가능
- **댓글 모더레이션**: `Comment` 모델이 이미 존재하나 API/UI 미구현 상태
- **이메일 발송**: 공지, 경고 메일 발송 (Nodemailer or SES 연동)
- **관리자 활동 로그**: `AdminLog` 모델 신설, 모든 관리 행위 기록
- **통계 차트 고도화**: 시계열 데이터, 지원률 추이 등

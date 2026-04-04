# 프로젝트 API MAP

## Route 목록

| 파일                            | 메서드 | 기능                              |
| ------------------------------- | ------ | --------------------------------- |
| `route.ts`                      | GET    | 프로젝트 목록 (필터/페이지네이션) |
| `route.ts`                      | POST   | 프로젝트 생성                     |
| `[pid]/route.ts`                | GET    | 단일 프로젝트 조회                |
| `[pid]/route.ts`                | PUT    | 프로젝트 수정                     |
| `[pid]/route.ts`                | DELETE | 프로젝트 삭제                     |
| `[pid]/route.ts`                | PATCH  | 상태/overview 부분 업데이트       |
| `[pid]/like/route.ts`           | POST   | 좋아요 토글 (likedBy $addToSet/$pull + likeCount 증감) |
| `[pid]/apply/route.ts`          | POST   | 프로젝트 지원 (motivation+weeklyHours), 응답에 data:{_id,projectId} 포함 |
| `[pid]/application/route.ts`    | GET    | 내 지원 현황                      |
| `[pid]/application/me/route.ts` | GET    | 내 지원서 상세                    |
| `[pid]/applications/route.ts`   | GET    | 지원자 목록 (리더용)              |
| `[pid]/resources/route.ts`      | GET    | 프로젝트 리소스                   |
| `[pid]/resources/route.ts`      | POST   | 리소스 추가                       |

## 주요 필드 변경 (Phase 1)

- `Project.author` → `Project.ownerId`
- `Project.content` → `Project.description`
- `Project.tags` (ObjectId[]) → `Project.techStacks` (String[])
- `Project.likes` (Array) → `Project.likeCount` (Number) + `Project.likedBy` (ObjectId[])
- `Project.members` → embedded `IProjectMember[]` (ProjectMember 컬렉션 deprecated)
- `Project.status`: `'01/02/03'` → `'recruiting/in_progress/completed/paused'`
- `Application.role` 제거 → `motivation` (required, min 20) + `weeklyHours` (required) 추가

## 의존 모델

- `src/lib/models/Project.ts`
- `src/lib/models/Application.ts`
- ~~`src/lib/models/ProjectMember.ts`~~ — deprecated, Phase 7 삭제 예정

## 의존 컴포넌트

- `src/components/projects/` — 프로젝트 카드/폼/상세

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-30

- `[pid]/application/me/route.ts`
- `[pid]/applications/route.ts`
- `[pid]/apply/route.ts`
- `[pid]/like/route.ts`
- `[pid]/resources/route.ts`
- `[pid]/route.ts`
- `route.ts`

# 유저 API MAP

## Route 목록

| 파일                       | 메서드 | 기능                   |
| -------------------------- | ------ | ---------------------- |
| `route.ts`                 | GET    | 유저 목록              |
| `[id]/route.ts`            | GET    | 유저 프로필 조회       |
| `[id]/route.ts`            | PUT    | 유저 정보 수정         |
| `me/route.ts`              | GET    | 내 프로필              |
| `me/route.ts`              | PUT    | 내 프로필 수정         |
| `me/availability/route.ts` | GET    | 내 가용 시간           |
| `me/availability/route.ts` | PUT    | 가용 시간 수정         |
| `github-stats/route.ts`    | GET    | GitHub 통계 조회/갱신  |
| `blog/posts/route.ts`      | GET    | 블로그 RSS 포스트 목록 |

## 의존 모델

- `src/lib/models/User.ts` — 컬렉션명: `memberbasics` (레거시 주의)
- `src/lib/models/Availability.ts`

## 의존 유틸

- `src/lib/github/` — GitHub API 연동
- `src/lib/blog/` — RSS 파싱

## 의존 컴포넌트

- `src/components/profile/` — 프로필 관련 전체

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-28

- `[id]/route.ts`
- `blog/posts/route.ts`
- `github-stats/route.ts`
- `me/availability/route.ts`
- `me/route.ts`
- `route.ts`

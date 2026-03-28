# WBS API MAP

## Route 목록

| 파일                      | 메서드 | 기능                           |
| ------------------------- | ------ | ------------------------------ |
| `tasks/route.ts`          | GET    | WBS 태스크 목록                |
| `tasks/route.ts`          | POST   | 태스크 생성                    |
| `tasks/[taskId]/route.ts` | GET    | 단일 태스크 조회               |
| `tasks/[taskId]/route.ts` | PUT    | 태스크 수정                    |
| `tasks/[taskId]/route.ts` | DELETE | 태스크 삭제                    |
| `tasks/batch/route.ts`    | PUT    | 태스크 일괄 수정 (순서/의존성) |

## 의존 모델

- `src/lib/models/wbs/` — WBS 태스크 모델

## 의존 스토어

- `src/store/wbsStore.ts` — WBS 전역 상태 (zundo undo/redo 포함)

## 의존 유틸

- `src/lib/utils/wbs/taskDependency.ts` — 의존성 계산 로직

## 의존 컴포넌트

- `src/components/wbs/` — WBS 태스크 목록/편집/간트차트

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-28

- `tasks/[taskId]/route.ts`
- `tasks/batch/route.ts`
- `tasks/route.ts`

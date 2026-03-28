# 칸반 API MAP

## Route 목록

| 파일                                | 메서드 | 기능                            |
| ----------------------------------- | ------ | ------------------------------- |
| `boards/route.ts`                   | GET    | 보드 목록 조회                  |
| `boards/route.ts`                   | POST   | 보드 생성                       |
| `boards/[boardId]/route.ts`         | GET    | 단일 보드 조회 (섹션+노트 포함) |
| `boards/[boardId]/route.ts`         | PUT    | 보드 수정                       |
| `boards/[boardId]/route.ts`         | DELETE | 보드 삭제                       |
| `boards/[boardId]/members/route.ts` | GET    | 보드 멤버 목록                  |
| `boards/[boardId]/members/route.ts` | POST   | 멤버 추가                       |
| `sections/route.ts`                 | POST   | 섹션 생성                       |
| `sections/[id]/route.ts`            | PUT    | 섹션 수정                       |
| `sections/[id]/route.ts`            | DELETE | 섹션 삭제                       |
| `notes/route.ts`                    | POST   | 노트 생성                       |
| `notes/[noteId]/route.ts`           | GET    | 단일 노트 조회                  |
| `notes/[noteId]/route.ts`           | PUT    | 노트 수정                       |
| `notes/[noteId]/route.ts`           | DELETE | 노트 삭제                       |
| `notes/batch/route.ts`              | PUT    | 노트 일괄 수정 (순서변경)       |
| `notes/batch-delete/route.ts`       | DELETE | 노트 일괄 삭제                  |

## 의존 모델

- `src/lib/models/kanban/` — Board, Section, Note 모델

## 의존 스토어

- `src/store/boardStore.ts` — 칸반 전역 상태 관리

## 의존 컴포넌트

- `src/components/board/` — BoardShell, SectionItem, NoteItem 등

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-28

- `boards/[boardId]/members/route.ts`
- `boards/route.ts`
- `notes/[noteId]/route.ts`
- `notes/batch/route.ts`
- `notes/batch-delete/route.ts`
- `notes/route.ts`
- `sections/[id]/route.ts`
- `sections/route.ts`

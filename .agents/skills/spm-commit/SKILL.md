---
name: spm-commit
description: >
  Side Project Mate 중간 커밋 커맨드.
  테스트/타입체크 통과 후 규칙에 맞는 커밋 메시지로 커밋 및 push를 수행합니다.
user-invocable: true
---

# spm-commit — 중간 커밋

## 목표

1. 변경분 테스트 누락 방지
2. `npm run test:run` + `npx tsc --noEmit` 통과 보장
3. `type: 설명 (SPM-번호)` 형식으로 커밋

## 실행 절차

1. `git rev-parse --abbrev-ref HEAD`로 브랜치/이슈 번호 확인
2. `git diff HEAD --name-only`로 변경 파일 수집
3. 신규 함수/필드/액션에 대응하는 테스트 존재 여부 확인
4. `npm run test:run`
5. `npx tsc --noEmit`
6. `git add -A`
7. `git commit -m "[type]: [설명] (SPM-[번호])"`
8. `git push`

## type 규칙

- `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## 실패 처리

- 테스트 또는 타입체크 실패 시 커밋하지 않고 실패 원인을 먼저 해결합니다.

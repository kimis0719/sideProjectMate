---
name: spm
description: >
  Side Project Mate 호환 진입 커맨드.
  `/spm` 호출 시 입력 내용에 따라 `/spm-start` 또는 `/spm-done` 절차를 안내합니다.
  기존 Claude 커맨드 습관을 Codex에서도 동일하게 유지하려는 경우 사용하세요.
user-invocable: true
---

# spm — 호환 진입점

`/spm`은 하위 호환용 진입점입니다. 실제 실행은 아래 커맨드를 기준으로 진행합니다.

- `/spm-start`: 작업 시작
- `/spm-commit`: 중간 커밋
- `/spm-done`: 작업 종료
- `/spm-hotfix`: 긴급 수정
- `/spm-revert`: 롤백

입력에 `종료`, `완료`, `done`, `finish`가 포함되면 `/spm-done` 절차를 따릅니다.
그 외에는 `/spm-start` 절차를 따릅니다.

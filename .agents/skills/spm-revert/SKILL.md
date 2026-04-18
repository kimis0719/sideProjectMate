---
name: spm-revert
description: >
  Side Project Mate 롤백 커맨드.
  work-log를 기준으로 대상 커밋을 안전하게 revert하고 PR을 생성합니다.
user-invocable: true
---

# spm-revert — 작업 롤백

## 목표

1. 롤백 대상 커밋 정확히 선택
2. 충돌 시 work-log 주의사항 기반으로 안전 복구
3. 롤백 PR 생성 및 이슈 연결

## 실행 절차

1. `gh auth status`
2. `work-logs/` 최신 목록 확인
3. 대상 work-log의 SHA와 "건드리면 안 되는 부분" 확인
4. `git revert [SHA] --no-edit`
5. 충돌 시 수동 해결 후 `git revert --continue`
6. `git push`
7. `gh pr create --title "revert: ..."` 실행
8. PR 본문 마지막 줄에 `Linear: SPM-[번호]` 추가

## 주의

- SHA 추정으로 롤백하지 말고 work-log 기준으로 확인합니다.
- 충돌 해결 시 기존 동기화/성능 최적화 로직을 보존합니다.

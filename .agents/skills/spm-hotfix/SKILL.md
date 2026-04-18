---
name: spm-hotfix
description: >
  Side Project Mate 긴급 수정 커맨드.
  운영 크리티컬 이슈 발생 시 hotfix 브랜치에서 최소 범위 수정 후 PR까지 빠르게 진행합니다.
user-invocable: true
---

# spm-hotfix — 긴급 수정

## 사용 조건

- 운영 장애/크리티컬 오류로 즉시 배포가 필요한 경우에만 사용
- 일반 버그는 `spm-start` 절차 사용

## 실행 절차

1. `gh auth status`
2. `git checkout main && git pull origin main`
3. `git checkout -b hotfix/SPM-[번호]-[slug]`
4. 최소 범위 수정 (리팩토링 금지)
5. `npm run test:run`
6. `npx tsc --noEmit`
7. `git add -A`
8. `git commit -m "hotfix: [설명] (SPM-[번호])"`
9. `git push -u origin hotfix/SPM-[번호]-[slug]`
10. `gh pr create` 후 필요 시 `gh pr merge --squash --auto`

## 주의

- 속도 우선이지만 테스트/타입체크는 생략하지 않습니다.
- 종료 후 `main`으로 복귀하고 최신 상태를 동기화합니다.

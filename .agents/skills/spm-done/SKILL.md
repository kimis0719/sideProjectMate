---
name: spm-done
description: >
  Side Project Mate 작업 종료 커맨드.
  최종 검증, work-log 작성, 워크존 해제, 문서 갱신, PR 생성까지 마무리합니다.
user-invocable: true
---

# spm-done — 작업 종료

## 목표

1. 최종 품질 검증 완료
2. `work-logs/` 기록 생성
3. 워크존/현황표 정리
4. PR 생성 및 Linear 연결

## 실행 절차

1. `npm run test:run`
2. `npx tsc --noEmit`
3. 변경 파일/핵심 수정점 정리
4. `work-logs/YYYY-MM-DD-[작업자]-[SHA7].md` 작성
5. 도메인 `MAP.md` 갱신 (새 파일/함수/엔드포인트 반영)
6. `.workzones.yml`에서 본인 항목 제거
7. `CLAUDE.md` "현재 진행 중인 작업 현황" 표 복원
8. `git add` → `git commit` → `git push`
9. `gh pr create` 실행 (본문 마지막 줄에 `Linear: SPM-[번호]`)

## work-log 필수 섹션

- 작업 요약
- 변경된 파일
- 테스트 결과
- 건드리면 안 되는 부분
- 미완성/다음 세션 인수인계

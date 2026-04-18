---
name: spm-start
description: >
  Side Project Mate 작업 시작 커맨드.
  `/spm-start [SPM-번호] [작업내용]` 호출 시 브랜치, 워크존, 컨텍스트 로딩을 Codex 기준으로 수행합니다.
  Linear는 MCP 대신 웹 UI 또는 CLI를 사용합니다.
user-invocable: true
---

# spm-start — 작업 시작

## 목표

1. 현재 작업 브랜치를 `feature|fix/SPM-[번호]-[slug]`로 준비
2. `.workzones.yml`에 작업 구역 등록
3. 도메인 `MAP.md`와 `work-logs` 최신 3개를 로딩

## 실행 절차

1. `gh auth status`로 인증 상태 확인
2. Linear 웹/CLI에서 이슈 확인 (`SPM-[번호]`)
3. `git checkout main` → `git pull origin main`
4. `git checkout -b feature/SPM-[번호]-[slug]` 또는 `fix/...`
5. `.workzones.yml`에 본인 구역 `status: active` 등록
6. `CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에 본인 항목 추가
7. 도메인 `MAP.md` + `work-logs` 최신 3개를 읽어 컨텍스트 반영

## 도메인 키워드 매핑

- 칸반/보드: `src/app/api/kanban/`, `src/store/boardStore.ts`, `src/components/board/`
- WBS/간트: `src/app/api/wbs/`, `src/store/wbsStore.ts`, `src/components/wbs/`
- 채팅: `src/app/api/chat/`, `src/components/chat/`
- 프로젝트: `src/app/api/projects/`, `src/components/projects/`
- 유저/프로필: `src/app/api/users/`, `src/components/profile/`
- 스토어: `src/store/`
- 모델: `src/lib/models/`

## 주의

- Codex에서는 Linear MCP를 직접 호출하지 않습니다.
- 이슈 조회/생성/상태 변경은 Linear 웹 UI 또는 `linear` CLI로 수행합니다.

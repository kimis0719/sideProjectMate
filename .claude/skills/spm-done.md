---
name: spm-done
description: >
  Side Project Mate 작업 종료 커맨드.
  `/spm-done` 호출 시 최종 테스트 검증 후 work-log를 생성하고,
  관련 문서를 자동 갱신하며 .workzones.yml 구역을 해제합니다.
  sideProjectMate 프로젝트에서 작업 완료 시 항상 이 커맨드로 종료하세요.
---

# spm-done — 작업 종료 커맨드

이 스킬은 `/spm-done` 형태로 호출됩니다.

---

## 1단계: 작업자 및 브랜치 정보 수집

```bash
git config user.name             # 작업자 이름
git rev-parse --short HEAD       # 현재 커밋 SHA (7자리)
git rev-parse --abbrev-ref HEAD  # 현재 브랜치명
```

---

## 2단계: 최종 테스트 실행 (TODO-005)

```bash
npm run test:run
```

- **전체 통과 시**: 다음 단계 진행
- **실패 시**: 종료 불가, 아래 안내 출력 후 중단

```
❌ 테스트 실패 — 작업 종료가 중단되었습니다.
실패한 테스트를 수정한 후 /spm-done을 다시 실행하세요.
```

---

## 3단계: git diff로 변경사항 수집

main 브랜치와의 전체 diff를 가져옵니다:

```bash
git diff origin/main...HEAD --name-only   # 변경된 파일 목록
git diff origin/main...HEAD --stat        # 변경 통계
```

`origin/main`이 없으면 `main`을 기준으로 시도합니다.
변경된 파일이 없으면 work-log 생성을 건너뜁니다.

---

## 4단계: work-log 파일 생성

수집한 정보를 바탕으로 아래 형식의 work-log를 작성하고
`work-logs/YYYY-MM-DD-[작업자명]-[SHA].md` 경로에 저장합니다.

```markdown
## YYYY-MM-DD — [작업자] ([브랜치명]) `[SHA]`

> 모델: claude (spm-done 자동생성)

## 작업 요약

(변경된 파일과 작업 내용을 바탕으로 한 줄 요약)

## 변경된 파일

- `파일경로` — 변경 내용 한 줄 설명

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: N passed / N failed
- 신규 추가 테스트: N개 (파일명 목록)
- 미작성 테스트 및 사유: (없으면 "없음")

## 건드리면 안 되는 부분

| 파일   | 위치        | 이유 |
| ------ | ----------- | ---- |
| 파일명 | 함수/변수명 | 이유 |

에이전트가 변경된 파일을 분석해 아래 기준으로 자동 감지 후 초안 작성:

- 다른 로직과 강하게 결합된 코드
- 성능 최적화 목적의 캐시/ref 구조
- 실시간 동기화(Socket) 관련 로직
- Undo/Redo 히스토리 관련 로직

항목이 없더라도 "없음"으로 명시 (빈칸 방치 금지).
초안을 사용자에게 확인 받은 후 work-log에 반영합니다.

## 미완성 / 다음 세션에서 이어받을 부분

없음 (또는 실제 미완성 내용)
```

`work-logs/` 디렉토리가 없으면 먼저 생성합니다.

---

## 5단계: 프로젝트 문서 자동 갱신 (TODO-010)

이번 작업에서 추가/수정/삭제된 파일을 감지해 아래 문서를 갱신합니다.

### PROJECT_INDEX.md 갱신

```
→ 새 라우트 추가 시: Pages 섹션 업데이트
→ 새 API 엔드포인트 추가 시: API Routes 섹션 업데이트
→ 새 Mongoose 모델/필드 추가 시: Models 섹션 업데이트
→ Zustand 스토어 변경 시: Stores 섹션 업데이트
→ 새 유틸 추가 시: Utility Modules 섹션 업데이트
→ Generated 날짜 갱신
```

### CLAUDE.md 갱신

```
→ 새로 추가된 도메인이 있으면 "작업 유형별 추가 로딩" 표 업데이트
→ 새 API 패턴이 생겼으면 "API Route 필수 패턴" 업데이트
→ "현재 진행 중인 작업 현황" 표 복원 (기존 동작 유지)
```

### 해당 도메인 MAP.md 갱신

```
→ 작업 도메인의 MAP.md에 새 파일/함수/엔드포인트 반영
   (예: 칸반 작업 시 src/app/api/kanban/MAP.md 갱신)
```

---

## 6단계: .workzones.yml 정리

`.workzones.yml`에서 현재 작업자(`owner`)에 해당하는 모든 항목을 제거합니다.
남은 항목이 없으면 `zones: []`로 설정합니다.

---

## 7단계: CLAUDE.md 현황 표 복원

`CLAUDE.md`의 "현재 진행 중인 작업 현황" 표에서 현재 작업자의 행을 삭제합니다.
표에 남은 항목이 없으면 기본 행을 복원합니다:

```markdown
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
```

---

## 8단계: 완료 메시지 출력

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
🗑️ 제거된 구역:
   - src/app/api/kanban/
   - src/store/boardStore.ts
📝 work-log 생성 완료:
   - work-logs/2026-03-28-HJ-a1b2c3d.md
📄 갱신된 문서:
   - PROJECT_INDEX.md
   - CLAUDE.md
   - src/app/api/kanban/MAP.md
─────────────────────────────
변경된 파일을 커밋하고 PR을 올려주세요.
```

변경된 파일이 없어 work-log를 생성하지 않은 경우:

```
✅ SPM 세션 종료
─────────────────────────────
👤 [작업자]의 작업 구역이 해제되었습니다.
📝 변경된 파일이 없어 work-log를 생성하지 않았습니다.
─────────────────────────────
```

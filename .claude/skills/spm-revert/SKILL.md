---
name: spm-revert
description: >
  Side Project Mate 작업 롤백 커맨드.
  `/spm-revert` 호출 시 work-log 목록을 보여주고, 선택한 작업을 git revert합니다.
  충돌 발생 시 해당 work-log의 "건드리면 안 되는 부분" 정보를 활용해 안내합니다.
  롤백 완료 후 gh pr create로 PR을 자동 생성합니다.
---

# spm-revert — 작업 롤백 커맨드

이 스킬은 `/spm-revert` 형태로 호출됩니다.

---

## 0단계: GitHub CLI 인증 확인

```bash
gh auth status
```

- **인증됨**: 바로 다음 단계 진행
- **미인증**: `gh auth login` 안내 후 중단

---

## 1단계: work-log 목록 표시

`work-logs/` 디렉토리의 파일 목록을 읽어 표시합니다.
각 파일의 첫 줄(날짜 + 작업자 + 브랜치 + SHA)과 "작업 요약" 섹션을 파싱합니다.

```
되돌릴 작업을 선택하세요:

1. 2026-03-28 — HJ (feature/180-spm-improve) `a1b2c3d`
   요약: SPM 스킬 체계 개편 및 GitHub Actions CI 수정

2. 2026-03-25 — YJ (fix/175-drag-bug) `e4f5g6h`
   요약: 드래그 앤 드롭 좌표 계산 버그 수정

선택 (번호):
```

---

## 2단계: 롤백 전 주의사항 출력

선택한 work-log의 "건드리면 안 되는 부분" 섹션을 먼저 표시합니다.

```
⚠️ 롤백 전 주의사항
이 파일들은 충돌 시 특히 주의하세요:

| 파일 | 위치 | 이유 |
|---|---|---|
| SectionItem.tsx | childNodeCacheRef | 성능 최적화 핵심 |
| boardStore.ts | applyRemote* 함수들 | Undo/Redo 동기화 로직 |

없음인 경우: 특별한 주의사항이 없습니다.

계속 진행하시겠습니까? (y/n)
```

---

## 3단계: git revert 실행

```bash
git revert [SHA] --no-edit
```

### 충돌 없을 시

```bash
git push
```

4단계로 진행합니다.

### 충돌 발생 시

충돌 파일 목록을 표시하고, 해당 work-log의 작업 의도 + "건드리면 안 되는 부분"을 재표시합니다:

```
⚠️ 충돌이 발생했습니다.

충돌 파일:
- src/components/board/SectionItem.tsx
- src/store/boardStore.ts

📌 이 작업의 주의사항을 참고해 충돌을 해결하세요:
[2단계에서 표시한 "건드리면 안 되는 부분" 재표시]

충돌 파일을 직접 수정한 뒤 "완료"를 입력해주세요.
```

충돌 해결 완료 확인 후:

```bash
git add .
git revert --continue
git push
```

---

## 4단계: PR 자동 생성

revert 커밋의 SHA를 수집하고, 선택한 work-log 내용을 기반으로 PR 초안을 작성합니다.

```
📝 PR 초안:
─────────────────────────────
제목: revert: [되돌린 작업 요약]
본문:
## 롤백 대상
- 커밋: [원본 SHA]
- 작업: [work-log 작업 요약]

## 롤백 사유
(사용자에게 롤백 사유를 간단히 입력받습니다)

## 주의사항
[건드리면 안 되는 부분 내용]
─────────────────────────────
이대로 PR을 생성할까요?
```

확인 후 PR 생성:

```bash
gh pr create \
  --title "revert: [되돌린 작업 요약]" \
  --body "[PR 본문]" \
  --base main
```

---

## 5단계: 완료 메시지 출력

```
✅ 롤백 완료
─────────────────────────────
🔄 되돌린 작업: [work-log 작업 요약]
🔗 PR: [PR URL]
─────────────────────────────
```

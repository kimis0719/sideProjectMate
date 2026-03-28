---
name: spm-revert
description: >
  Side Project Mate 작업 롤백 커맨드.
  `/spm-revert` 호출 시 work-log 목록을 보여주고, 선택한 작업을 git revert합니다.
  충돌 발생 시 해당 work-log의 "건드리면 안 되는 부분" 정보를 활용해 안내합니다.
---

# spm-revert — 작업 롤백 커맨드

이 스킬은 `/spm-revert` 형태로 호출됩니다.

---

## 1단계: work-log 목록 표시

`work-logs/` 디렉토리에서 파일 목록을 가져와 표시합니다:

```
되돌릴 작업을 선택하세요:

1. 2026-03-28 — HJ (feature/177-kanban) `a1b2c3d`
   요약: 섹션 중첩 캡처 로직 추가 및 zIndex 재설계

2. 2026-03-25 — YJ (fix/175-drag-bug) `e4f5g6h`
   요약: 드래그 앤 드롭 좌표 계산 버그 수정

선택 (번호 입력):
```

---

## 2단계: 선택한 work-log의 "건드리면 안 되는 부분" 먼저 출력

```
⚠️ 롤백 전 주의사항
이 파일들은 충돌 시 특히 주의하세요:

| 파일 | 위치 | 이유 |
|---|---|---|
| SectionItem.tsx | childNodeCacheRef | 성능 최적화 핵심 |
| boardStore.ts | applyRemote* 함수들 | Undo/Redo 동기화 로직 |

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

완료 메시지:

```
✅ 롤백 완료
─────────────────────────────
🔄 되돌린 커밋: [SHA]
📝 work-log: [파일명]
─────────────────────────────
PR을 생성하시겠습니까? (y/n)
```

### 충돌 발생 시

충돌 파일 목록을 표시하고, 해당 work-log의 작업 의도 + 건드리면 안 되는 부분을 재표시합니다:

```
⚠️ 충돌이 발생했습니다.

충돌 파일:
- src/components/board/SectionItem.tsx
- src/store/boardStore.ts

위 파일들의 충돌을 해결해주세요.
참고: 이 작업의 "건드리면 안 되는 부분" 목록을 확인하세요.

충돌 해결 완료 후 "완료"를 입력해주세요.
```

충돌 해결 확인 후:

```bash
git add .
git revert --continue
git push
```

---

## 4단계: 완료 안내

```
✅ 롤백 및 푸시 완료
─────────────────────────────
🔄 되돌린 작업: [작업 요약]
🔗 브랜치: [현재 브랜치]
─────────────────────────────
PR을 생성하시겠습니까? (y/n)
```

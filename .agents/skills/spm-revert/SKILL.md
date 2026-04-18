---
name: spm-revert
description: >
  Side Project Mate 작업 롤백 커맨드.
  `/spm-revert` 호출 시 work-log 목록을 보여주고, 선택한 작업을 git revert합니다.
  충돌 발생 시 해당 work-log의 "건드리면 안 되는 부분" 정보를 활용해 안내합니다.
  롤백 완료 후 gh pr create로 PR을 자동 생성합니다.
---

# spm-revert — 작업 롤백 커맨드

## Codex 분기 규칙

- Codex(Default mode)에서는 `AskUserQuestion` 도구를 사용하지 않고, 선택 단계는 일반 대화 질문으로 대체합니다.
- 추천 선택지가 있는 단계는 기본적으로 Recommended를 적용하고, 사용자 요청 시 대체 옵션으로 전환합니다.

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

`work-logs/` 디렉토리의 파일 목록을 읽어 각 파일의 첫 줄(날짜 + 작업자 + 브랜치 + SHA)과 "작업 요약" 섹션을 파싱합니다.

최대 4개까지 `AskUserQuestion` 도구로 선택지를 제시합니다 (최신순 정렬):

- question: "되돌릴 작업을 선택하세요."
- header: "work-log"
- options (각 work-log 항목):
  - label: "[날짜] [작업자] ([브랜치])"
  - description: "[작업 요약 한 줄]"
- preview 활용: 선택한 work-log의 전체 내용을 표시

work-log가 5개 이상이면 "Other를 선택해 SHA를 직접 입력하세요"라고 안내합니다.

---

## 2단계: 롤백 전 주의사항 출력

선택한 work-log의 "건드리면 안 되는 부분" 섹션을 먼저 표시합니다.

`AskUserQuestion` 도구로 롤백 진행 여부를 확인합니다:

- question: "선택한 작업을 롤백합니다. 계속 진행할까요?"
- header: "롤백 확인"
- options:
  - label: "롤백 진행 (Recommended)", description: "git revert를 실행하고 PR을 생성합니다"
  - label: "취소", description: "롤백을 중단합니다"
- preview 활용: "건드리면 안 되는 부분" 표 + 작업 요약을 표시 (항목 없으면 "특별한 주의사항이 없습니다")

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

롤백 사유를 `AskUserQuestion` 도구로 먼저 입력받습니다:

- question: "롤백 사유를 선택하거나 직접 입력하세요."
- header: "롤백 사유"
- options:
  - label: "기능 오류 (Recommended)", description: "배포 후 기능이 정상 동작하지 않음"
  - label: "성능 저하", description: "해당 작업 이후 성능 문제 발생"
  - label: "충돌 발생", description: "다른 작업과 충돌하여 롤백 필요"
  - label: "기획 변경", description: "기획 변경으로 해당 기능 불필요"

입력받은 사유로 PR 초안을 작성한 뒤 `AskUserQuestion` 도구로 확인을 요청합니다:

- question: "PR 초안을 확인해주세요."
- header: "PR 확인"
- options:
  - label: "이대로 생성 (Recommended)", description: "PR을 생성합니다"
  - label: "수정 후 생성", description: "Other를 선택해 수정할 내용을 입력하세요"
- preview 활용: PR 제목 + 본문 전체를 표시

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

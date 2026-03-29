---
name: spm-commit
description: >
  Side Project Mate 중간 커밋 커맨드.
  `/spm-commit` 호출 시 변경 내용을 분석하고, 테스트를 검증한 뒤,
  AI가 커밋 메시지 초안을 작성하여 확인 후 commit + push합니다.
  sideProjectMate 프로젝트에서 작업 중 커밋할 때 사용하세요.
---

# spm-commit — 중간 커밋 커맨드

이 스킬은 `/spm-commit` 형태로 호출됩니다.

목표는 세 가지입니다.

1. 새로 추가된 함수/필드/액션에 대한 테스트 존재 여부를 확인하고 강제화한다.
2. 전체 테스트가 통과한 경우에만 커밋을 진행한다.
3. AI가 변경 내용을 분석해 커밋 메시지 초안을 작성하고 사용자 확인 후 커밋한다.

---

## 1단계: 변경 내용 수집

```bash
git diff HEAD --name-only   # 변경된 파일 목록
git diff HEAD               # 전체 diff 내용
```

변경된 파일이 없으면 커밋할 내용이 없다고 안내하고 종료합니다.

---

## 2단계: 테스트 커버리지 확인 (TODO-005)

이번 변경분에서 **새로 추가된 함수 / 필드 / 액션 / 스토어 액션**이 있는 경우:

```
→ 해당 동작을 커버하는 테스트 파일 존재 여부 확인
→ 없으면 아래 안내 후 테스트 작성 요청:
```

```
⚠️ 테스트 누락 감지
다음 항목에 대한 테스트가 없습니다:
- [함수명] in [파일경로]

테스트를 먼저 작성해주세요. 작성 완료 후 /spm-commit을 다시 실행하세요.
커버리지 기준: src/__tests__/ 또는 파일명.test.ts 패턴
```

테스트 작성이 불필요한 경우, `AskUserQuestion` 도구로 확인을 요청합니다:

- question: "다음 항목에 테스트가 없습니다: [함수명]. 어떻게 할까요?"
- header: "테스트 누락"
- options:
  - label: "테스트 작성 (Recommended)", description: "테스트 작성 후 /spm-commit을 다시 실행하세요"
  - label: "건너뛰기", description: "UI 전용 변경 등 테스트가 불필요한 경우에만 선택하세요"

---

## 3단계: 테스트 실행

```bash
npm run test:run
```

- **전체 통과 시**: 다음 단계 진행
- **실패 시**: 커밋 불가, 아래 안내 출력 후 종료

```
❌ 테스트 실패 — 커밋이 중단되었습니다.
실패한 테스트를 수정한 후 /spm-commit을 다시 실행하세요.
```

---

## 4단계: 커밋 메시지 초안 작성

변경 내용을 분석해 아래 형식으로 커밋 메시지 초안을 작성합니다:

```
feat: 섹션 중첩 캡처 로직 추가 및 zIndex 3단 계층 재설계

- SectionModel에 parentSectionId, depth 필드 추가
- 부모 섹션 드래그 시 자식 섹션 동시 이동
- BoardShell zIndex 계산 로직 개선
```

**타입 선택 기준:**

- `feat`: 새 기능 추가
- `fix`: 버그 수정
- `refactor`: 기능 변경 없는 코드 개선
- `test`: 테스트 추가/수정
- `docs`: 문서 변경
- `chore`: 설정, 의존성 등 기타

초안을 작성한 뒤 `AskUserQuestion` 도구로 확인을 요청합니다:

- question: "커밋 메시지 초안을 확인해주세요."
- header: "커밋 확인"
- options:
  - label: "이대로 커밋 (Recommended)", description: "초안 메시지로 git commit + push를 실행합니다"
  - label: "수정 후 커밋", description: "Other를 선택해 수정할 내용을 입력하세요"
- preview 활용: 커밋 메시지 전체를 preview 필드에 표시

```
preview 예시:
feat: 섹션 중첩 캡처 로직 추가

- SectionModel에 parentSectionId, depth 필드 추가
- BoardShell zIndex 계산 로직 개선
```

---

## 5단계: 커밋 & 푸시

사용자 확인 후 실행합니다:

```bash
git add -A
git commit -m "[확정된 커밋 메시지]"
git push
```

완료 메시지 출력:

```
✅ 커밋 완료
─────────────────────────────
📝 [커밋 메시지 첫 줄]
🔗 SHA: [커밋 SHA 7자리]
─────────────────────────────
```

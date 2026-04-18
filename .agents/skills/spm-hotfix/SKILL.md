---
name: spm-hotfix
description: >
  Side Project Mate 긴급수정 커맨드.
  `/spm-hotfix [SPM-번호] [오류 설명]` 형태로 호출하면 main 브랜치에서 즉시 수정 후
  브랜치 → 수정 → 테스트 → PR → 머지까지 전자동으로 수행합니다.
  운영 크리티컬 오류가 발생하여 즉시 배포가 필요한 경우에만 사용하세요.
  일반 버그 수정은 `/spm-start`를 사용하세요.
---

# spm-hotfix — 긴급수정 커맨드

## Codex 분기 규칙

- Codex(Default mode)에서는 `AskUserQuestion` 도구를 사용하지 않고, 확인 단계는 일반 대화 질문으로 대체합니다.
- 추천 선택지가 있는 단계는 기본적으로 Recommended를 적용하고, 사용자 요청 시 대체 옵션으로 전환합니다.

이 스킬은 `/spm-hotfix [SPM-번호] [오류 설명]` 형태로 호출됩니다.

> **사용 조건**: 운영 서버에서 크리티컬 오류가 발생하여 **즉시 배포**가 필요한 경우에만 사용합니다.
> 일반 버그 수정은 `/spm-start`로 시작하세요.

> **핵심 차이**: `/spm-start` + `/spm-done` 플로우와 달리,
> 이 스킬은 PR 생성 후 **자동 머지**까지 수행하고 main으로 복귀합니다.
> work-log 생성, MAP.md 갱신 등 문서 작업도 최소화하여 속도에 집중합니다.

> **이슈 관리**: 이슈는 **Linear**에서 관리합니다 (팀 식별자: `SPM`).
> 긴급 상황이라도 Linear에서 이슈를 먼저 생성하거나, 이슈 ID를 입력해주세요.
> 정말 급한 경우 이슈 없이 진행할 수 있지만, 완료 후 반드시 Linear에서 이슈를 생성해주세요.

---

## 0단계: 사전 확인

### GitHub CLI 인증 확인

```bash
gh auth status
```

- **인증됨**: 다음 단계 진행
- **미인증**: 아래 안내 출력 후 중단

```
⚠️ GitHub CLI 인증이 필요합니다.

아래 명령어를 실행해 인증해주세요:
  gh auth login

인증 완료 후 /spm-hotfix를 다시 실행하세요.
```

### main 브랜치 확인

```bash
git rev-parse --abbrev-ref HEAD
```

- **main이 아닌 경우**: 경고 출력 후 `AskUserQuestion` 도구로 확인

  - question: "현재 브랜치가 [브랜치명]입니다. main으로 전환 후 진행할까요?"
  - options:
    - label: "main으로 전환 후 진행 (Recommended)", description: "git checkout main && git pull 실행"
    - label: "현재 브랜치에서 진행", description: "현재 브랜치 기준으로 hotfix 브랜치 생성"
    - label: "중단", description: "작업을 중단합니다"

- **main인 경우**: 최신 상태로 pull

```bash
git pull origin main
```

### 워킹 디렉토리 클린 확인

```bash
git status --porcelain
```

- **변경사항 있는 경우**: 경고 출력 후 `AskUserQuestion` 도구로 확인

  - question: "커밋되지 않은 변경사항이 있습니다. stash 후 진행할까요?"
  - options:
    - label: "stash 후 진행 (Recommended)", description: "git stash 실행 후 hotfix 진행, 완료 후 stash pop"
    - label: "중단", description: "변경사항을 먼저 정리하세요"

---

## 1단계: 오류 분석 및 Linear 이슈 확인

### Linear 이슈 ID 확인

인자에서 `SPM-[숫자]` 패턴을 추출합니다.
인자가 없거나 이슈 ID가 없으면 `AskUserQuestion`으로 확인합니다:

- question: "Linear 이슈 ID를 입력해주세요. 아직 없으면 '없음'을 선택하세요."
- header: "Linear 이슈"
- options:
  - label: "이슈 ID 입력 (Recommended)", description: "Other를 선택해 SPM-번호를 입력하세요 (예: SPM-42)"
  - label: "없음 — 이슈 없이 진행", description: "hotfix 완료 후 Linear에서 반드시 이슈를 생성해주세요"

### 오류 설명 확인

인자에서 이슈 ID를 제외한 텍스트를 오류 설명으로 사용합니다.
없으면 `AskUserQuestion`으로 오류 내용을 입력받습니다:

- question: "운영에서 발생한 오류를 설명해주세요. (에러 메시지, 발생 페이지, 재현 조건 등)"

---

## 2단계: hotfix 브랜치 생성

오류 설명에서 영문 슬러그를 생성합니다:

```bash
# Linear 이슈가 있는 경우
git checkout -b hotfix/SPM-[번호]-[슬러그]
git push -u origin hotfix/SPM-[번호]-[슬러그]

# Linear 이슈가 없는 경우
git checkout -b hotfix/urgent-[슬러그]
git push -u origin hotfix/urgent-[슬러그]
```

---

## 3단계: 수정 작업

**이 단계는 AI가 자율적으로 수행합니다.**

1. 오류 원인을 조사합니다 (관련 파일 읽기, 에러 추적)
2. 최소 범위로 수정합니다 — hotfix는 오류 해결에만 집중, 리팩토링/개선 금지
3. 수정이 완료되면 다음 단계로 진행합니다

---

## 4단계: 검증

### 테스트 실행

```bash
npm run test:run
```

- **전체 통과**: 다음으로 진행
- **실패**: 실패 원인을 분석하고 수정 후 재실행 (최대 2회 재시도)
- **2회 재시도 후에도 실패**: 중단하고 사용자에게 보고

### TypeScript 타입 체크

```bash
npx tsc --noEmit
```

- **통과**: 다음으로 진행
- **실패**: 타입 오류를 수정하고 재실행 (최대 2회 재시도)

---

## 5단계: 커밋 및 Push

변경된 파일을 분석하여 커밋 메시지를 자동 작성합니다. **사용자 확인 없이 즉시 커밋합니다.**

```bash
git add [변경된 파일들]
# Linear 이슈가 있는 경우
git commit -m "hotfix: [수정 내용 요약] (SPM-[번호])

[상세 설명]

Co-Authored-By: Claude <noreply@anthropic.com>"

# Linear 이슈가 없는 경우
git commit -m "hotfix: [수정 내용 요약]

[상세 설명]

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

> 커밋 메시지에는 `hotfix:` 접두사를 사용합니다.
> `.workzones.yml`, `CLAUDE.md` 등 메타 파일은 커밋에 포함하지 않습니다 (속도 우선).

---

## 6단계: PR 생성 및 자동 머지

### PR 생성

```bash
# Linear 이슈가 있는 경우
gh pr create --title "hotfix: [수정 요약] (SPM-[번호])" --body "$(cat <<'EOF'
## 🚨 Hotfix

- **오류**: [오류 설명]
- **원인**: [원인 분석]
- **수정**: [수정 내용]

## 검증

- [x] `npm run test:run` 통과
- [x] `npx tsc --noEmit` 통과

Linear: SPM-[번호]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"

# Linear 이슈가 없는 경우 — PR 본문에서 Linear 라인 생략
```

### 자동 머지

```bash
gh pr merge --squash --auto --delete-branch
```

> `--auto`가 실패하면 (branch protection 등) `--admin` 플래그 없이 재시도합니다.
> 그래도 실패하면 사용자에게 수동 머지를 안내합니다:
>
> ```
> ⚠️ 자동 머지가 실패했습니다. 아래 명령어로 수동 머지해주세요:
>   gh pr merge [PR번호] --squash --delete-branch
> ```

---

## 7단계: main 복귀 및 정리

```bash
git checkout main
git pull origin main
```

stash가 있었다면:

```bash
git stash pop
```

---

## 8단계: 요약 출력

```
🚨 Hotfix 완료
─────────────────────────────
📌 Linear 이슈: SPM-[번호] [오류 요약]  (또는 "이슈 미등록 — Linear에서 생성 필요")
🔀 PR: #[PR번호] (머지 완료)
🌿 브랜치: hotfix/SPM-[번호]-[슬러그] (삭제됨)
─────────────────────────────
📝 변경 파일:
   - [파일1]
   - [파일2]
✅ 테스트: [N]개 통과
✅ 타입 체크: 통과
─────────────────────────────
Render 자동 배포가 트리거됩니다.
```

> Linear 이슈 없이 진행한 경우, 마지막에 아래 경고를 추가합니다:
>
> ```
> ⚠️ Linear 이슈가 등록되지 않았습니다.
>    팀원이 진행상황을 파악할 수 있도록 Linear에서 이슈를 생성해주세요.
> ```

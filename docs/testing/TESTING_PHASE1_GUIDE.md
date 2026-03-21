# Phase 1 테스트 사용 가이드

---

## 1. 기본 명령어

```bash
# 개발 중 — 파일 저장할 때마다 자동으로 테스트 재실행 (가장 자주 사용)
npm run test:watch

# CI/확인용 — 한 번 전체 실행하고 종료
npm run test:run

# 어떤 코드가 테스트되지 않았는지 확인
npm run test:coverage

# 대화형 UI (브라우저에서 결과 확인, 선택 사항)
npm run test:ui
```

**일반적인 사용 흐름**: 코드를 수정할 때는 `test:watch`를 켜두고 작업합니다. 저장할 때마다 관련 테스트가 자동으로 재실행됩니다.

---

## 2. 현재 테스트 파일 구조

```
src/
├── __tests__/
│   ├── setup.ts                     # 전역 설정 (건드릴 일 거의 없음)
│   └── fixtures/
│       ├── users.ts                 # 유저 Mock 데이터
│       ├── projects.ts              # 프로젝트 Mock 데이터
│       ├── tasks.ts                 # WBS 태스크 Mock 데이터
│       └── index.ts                 # 통합 export
│
├── lib/
│   ├── iconUtils.ts
│   ├── iconUtils.test.ts            ← 43개 테스트
│   ├── profileUtils.ts
│   ├── profileUtils.test.ts         ← 27개 테스트
│   └── utils/wbs/
│       ├── taskDependency.ts
│       ├── taskDependency.test.ts   ← 59개 테스트
│       ├── scheduleConflict.ts
│       └── scheduleConflict.test.ts ← 52개 테스트
```

**규칙**: 테스트 파일은 **원본 파일 바로 옆**에 `*.test.ts`로 만듭니다.

---

## 3. 테스트 파일 읽는 법

```typescript
// taskDependency.test.ts 구조 패턴
import { describe, it, expect } from 'vitest';
import { getPredecessorTasks } from './taskDependency';  // 테스트할 함수
import { linearChainTasks } from '@/__tests__/fixtures/tasks'; // Mock 데이터

describe('getPredecessorTasks', () => {   // 함수 단위로 그룹화

  it('의존관계 없는 작업의 선행 작업 목록은 빈 배열이다', () => {
    // Arrange: 준비
    const task = linearChainTasks[0];

    // Act: 실행
    const result = getPredecessorTasks(task, [task]);

    // Assert: 검증
    expect(result).toEqual([]);
  });

});
```

`describe` = 테스트 그룹, `it` = 개별 테스트, `expect` = 결과 검증

---

## 4. 앞으로 추가 개발 시 테스트 추가하는 법x

### Case A — 기존 유틸 파일에 새 함수를 추가할 때

예: `scheduleConflict.ts`에 `getConflictSummary()` 함수를 새로 만들었을 때

```typescript
// src/lib/utils/wbs/scheduleConflict.test.ts 맨 아래에 describe 블록 추가

describe('getConflictSummary', () => {

  it('충돌이 없으면 요약에 total이 0이다', () => {
    const result = getConflictSummary([]);
    expect(result.total).toBe(0);
  });

  it('충돌이 3건이면 total이 3이다', () => {
    const result = getConflictSummary(mockConflicts); // fixture 사용
    expect(result.total).toBe(3);
  });

});
```

### Case B — 완전히 새로운 유틸 파일을 만들 때

예: `src/lib/utils/formatUtils.ts`를 새로 만들었을 때

```
1. src/lib/utils/formatUtils.ts        ← 새 파일
2. src/lib/utils/formatUtils.test.ts   ← 바로 옆에 테스트 파일 생성
```

```typescript
// formatUtils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatUtils';

describe('formatDate', () => {
  it('날짜를 한국어 형식으로 변환한다', () => {
    expect(formatDate(new Date('2024-01-15'))).toBe('2024년 1월 15일');
  });
});
```

### Case C — 기존 함수의 동작을 바꿀 때

예: `calculateProfileCompleteness`에서 아바타 배점을 15점 → 20점으로 변경했을 때

```
1. 코드 수정
2. npm run test:run 실행
3. 실패한 테스트 확인 → "아바타 URL이 있으면 15점을 부여한다" 실패
4. profileUtils.test.ts에서 해당 테스트의 기대값을 20으로 수정
5. 관련 전체 점수 테스트도 함께 수정
```

> **핵심 원칙**: 코드를 바꾸면 테스트도 함께 바꿉니다.
> 테스트가 실패하면 코드 변경이 기존 동작에 영향을 준다는 신호입니다.

### Case D — 버그를 발견했을 때

버그를 고치기 **전에** 먼저 실패하는 테스트를 작성합니다.

```typescript
// 1. 버그 재현 테스트 작성 (이 시점엔 실패해야 정상)
it('기간이 0인 작업의 충돌 심각도는 25다', () => {
  const conflict = makeConflict(0, 1);
  expect(calculateConflictSeverity(conflict)).toBe(25);
});

// 2. npm run test:run → 실패 확인
// 3. 원본 코드 버그 수정
// 4. npm run test:run → 통과 확인
```

이렇게 하면 같은 버그가 재발해도 테스트가 바로 잡아줍니다.

---

## 5. fixture 재사용 패턴

새 테스트에서 기존 fixture를 가져다 쓰거나 확장합니다.

```typescript
import { mockUserAlice, fullProfile } from '@/__tests__/fixtures/users';
import { linearChainTasks } from '@/__tests__/fixtures/tasks';

// 기존 fixture를 약간 변형해서 사용 (원본은 건드리지 않음)
const modifiedTask = {
  ...linearChainTasks[0],  // 기존 fixture 복사
  title: '변경된 제목',     // 필요한 부분만 덮어씀
};
```

새로운 도메인 데이터가 생기면 `src/__tests__/fixtures/` 폴더에 파일을 추가하고 `index.ts`에 export를 추가합니다.

---

## 6. 한 줄 요약

| 상황 | 할 일 |
|------|-------|
| 새 유틸 함수 추가 | 함수 옆에 `*.test.ts` 만들고 테스트 작성 |
| 기존 함수 수정 | `test:run` 실행 → 실패 테스트 확인 → 기대값 수정 |
| 버그 수정 | 실패 테스트 먼저 작성 → 코드 수정 → 통과 확인 |
| 개발 중 실시간 확인 | `npm run test:watch` 켜두기 |
| PR 전 최종 확인 | `npm run test:coverage` 로 커버리지 확인 |

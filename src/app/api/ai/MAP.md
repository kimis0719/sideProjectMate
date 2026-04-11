# AI API MAP

## 엔드포인트

| 메서드 | 경로 | 핸들러 파일 | 설명 |
|--------|------|-------------|------|
| POST | `/api/ai/generate-instruction` | `generate-instruction/route.ts` | AI 지시서 생성 (SSE 스트리밍) |
| POST | `/api/ai/execution-result` | `execution-result/route.ts` | 실행결과 파싱 & 노트 자동 완료처리 |
| GET | `/api/ai/history/[id]` | `history/[id]/route.ts` | 지시서 히스토리 단건 조회 |
| GET/POST | `/api/ai/presets` | `presets/route.ts` | AI 프리셋 목록 조회 / 생성 |
| POST | `/api/ai/recommend-harness` | `recommend-harness/route.ts` | 프로젝트/노트 기반 하네스 추천 (태그 필터링 + AI 정밀 매칭) |
| GET | `/api/ai/harness-catalog` | `harness-catalog/route.ts` | 하네스 카탈로그 목록 조회 (filesCache 제외) |
| GET | `/api/ai/history/[id]/download` | `history/[id]/download/route.ts` | 지시서 + 하네스 ZIP 다운로드 (?harnessId=&lang=ko\|en) |

## 주요 유틸 (src/lib/utils/ai/)

| 파일 | 역할 |
|------|------|
| `parseExecutionResult.ts` | spm-result 코드블록 or bare JSON 파싱 (CRLF, balanced bracket, 리터럴 줄바꿈 처리) |
| `generateResultTemplate.ts` | 지시서에 삽입할 spm-result JSON 템플릿 생성 |
| `buildAiContext.ts` | 보드 데이터 → systemPrompt + userMessage 조립 |
| `validateAdditionalInstruction.ts` | additionalInstruction 가드레일 검증 (길이 500자·URL·금지패턴). null=유효, string=에러메시지 |
| `recommendHarness.ts` | 프로젝트 기술스택+노트 기반 harness-100 추천 (태그 필터링 → AI 정밀 매칭) |

## 하네스 유틸 (src/lib/utils/harness/)

| 파일 | 역할 |
|------|------|
| `buildZipPackage.ts` | 지시서 + 하네스 파일을 ZIP으로 패키징 (SETUP-GUIDE.md, README.md 포함) |
| `syncFromGithub.ts` | GitHub API로 harness-100 레포에서 최신 파일 가져와 DB 동기화 |

## 관련 모델

- `AiInstructionHistory` — 지시서 히스토리 (resultMarkdown에 spm-result 템플릿 포함)
- `AiExecutionLog` — 실행결과 로그 (instructionId, results[], testsResult, parseMethod)
- `AiSettings` — AI 설정 (provider, modelPriority, cooldown, dailyLimit, **guardRailPatterns**)
- `AiUsage` — 사용량 기록

## 실행결과 처리 흐름

```
[Agent 실행] → spm-result JSON 복사
→ "결과 보고" 버튼 클릭 (InstructionModal or HistoryModal)
→ ExecutionResultModal (textarea 붙여넣기)
→ POST /api/ai/execution-result
→ parseExecutionResult() → done 노트 자동완료 / partial,failed → requiresConfirmation
→ ExecutionResultConfirm UI
→ boardStore.completeNote() 호출 (보드 상태 + socket 동기화)
→ AiExecutionLog 저장
```

## 주의

- `generate-instruction` 은 SSE 스트리밍(`Response` 반환)이므로 `withApiLogging` 래퍼 불가
- `execution-result`는 `withApiLogging(handlePost, ...)` 패턴 사용
- 지시서 resultMarkdown에는 spm-result 템플릿이 DB에만 저장됨 (스트리밍 미포함); 클라이언트는 `done` SSE 이후 `/api/ai/history/{id}` 재조회
- 어드민(`memberType === 'admin'`)은 쿨다운·일일 한도·가드레일 모두 스킵됨 (AiUsage 기록은 유지)
- `FRONTEND_GUARDRAIL_PATTERNS`(InstructionModal)과 `AiSettings.guardRailPatterns` 기본값을 항상 동기화할 것

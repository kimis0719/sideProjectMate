# AI API MAP

## 엔드포인트

| 메서드 | 경로 | 핸들러 파일 | 설명 |
|--------|------|-------------|------|
| POST | `/api/ai/generate-instruction` | `generate-instruction/route.ts` | AI 지시서 생성 (SSE 스트리밍) |
| POST | `/api/ai/execution-result` | `execution-result/route.ts` | 실행결과 파싱 & 노트 자동 완료처리 |
| GET | `/api/ai/history/[id]` | `history/[id]/route.ts` | 지시서 히스토리 단건 조회 |
| GET/POST | `/api/ai/presets` | `presets/route.ts` | AI 프리셋 목록 조회 / 생성 |

## 주요 유틸 (src/lib/utils/ai/)

| 파일 | 역할 |
|------|------|
| `parseExecutionResult.ts` | spm-result 코드블록 or bare JSON 파싱 (CRLF, balanced bracket, 리터럴 줄바꿈 처리) |
| `generateResultTemplate.ts` | 지시서에 삽입할 spm-result JSON 템플릿 생성 |
| `buildAiContext.ts` | 보드 데이터 → systemPrompt + userMessage 조립 |

## 관련 모델

- `AiInstructionHistory` — 지시서 히스토리 (resultMarkdown에 spm-result 템플릿 포함)
- `AiExecutionLog` — 실행결과 로그 (instructionId, results[], testsResult, parseMethod)
- `AiSettings` — AI 설정 (provider, modelPriority, cooldown, dailyLimit)
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

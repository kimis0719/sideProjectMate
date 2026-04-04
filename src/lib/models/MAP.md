# Mongoose 모델 MAP

| 모델 파일          | 컬렉션명          | 주요 필드                                       |
| ------------------ | ----------------- | ----------------------------------------------- |
| `User.ts`          | `memberbasics` ⚠️ | name, email, techStack, githubUrl               |
| `Project.ts`       | `projects`        | title, description, techStacks, status, members |
| `Application.ts`   | `applications`    | projectId, userId, status, message              |
| `ProjectMember.ts` | `projectmembers`  | projectId, userId, role                         |
| `Notification.ts`  | `notifications`   | userId, type, message, isRead                   |
| `ChatRoom.ts`      | `chatrooms`       | projectId, participants                         |
| `ChatMessage.ts`   | `chatmessages`    | roomId, senderId, content                       |
| `TechStack.ts`     | `techstacks`      | name, icon, category                            |
| `CommonCode.ts`    | `commoncodes`     | group, code, label                              |
| `Review.ts`        | `reviews`         | reviewerId, revieweeId, projectId, rating       |
| `Availability.ts`  | `availabilities`  | userId, schedule                                |
| `AiSettings.ts`    | `aisettings`      | provider, modelPriority, systemPromptTemplate, defaultPresets |
| `AiUsage.ts`       | `aiusages`        | userId, projectId, provider, inputTokens        |
| `AiPreset.ts`      | `aipresets`       | projectId, name, roleInstruction                |
| `AiInstructionHistory.ts` | `aiinstructionhistories` | projectId, boardId, target, resultMarkdown |
| `AiExecutionLog.ts`       | `aiexecutionlogs`        | instructionId, boardId, results[], testsResult, parseMethod |
| `kanban/`          | —                 | Board, Section, Note                            |
| `wbs/`             | —                 | WBS Task                                        |

## ⚠️ 주의

`User.ts`의 MongoDB 컬렉션명은 `memberbasics` (레거시). 모델 정의 시 반드시 확인.

## 모델 정의 패턴

```ts
export default mongoose.models.Foo || mongoose.model<IFoo>('Foo', FooSchema);
```

Hot Reload 대비 중복 등록 방지 패턴 필수.

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-29

- `AiInstructionHistory.ts`
- `AiPreset.ts`
- `AiSettings.ts`
- `AiUsage.ts`
- `Application.ts`
- `Availability.ts`
- `ChatMessage.ts`
- `ChatRoom.ts`
- `Comment.ts`
- `CommonCode.ts`
- `Counter.ts`
- `Notification.ts`
- `Post.ts`
- `Project.ts`
- `ProjectMember.ts`
- `Review.ts`
- `Skill.ts`
- `TechStack.ts`
- `User.ts`
- `kanban/BoardModel.ts`
- `kanban/NoteModel.ts`
- `kanban/SectionModel.ts`
- `wbs/TaskModel.ts`

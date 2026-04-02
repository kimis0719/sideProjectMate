# Project Index: Side Project Mate

Generated: 2026-03-31

## Project Structure

```
sideProjectMate/
├── server.ts                    # Express + Socket.io entry point
├── docs/
│   ├── testing/                 # Test guides (Phase 1~3)
│   └── plans/                   # Feature plans (5 docs)
└── src/
    ├── app/                     # Next.js App Router (pages + API)
    ├── components/              # React UI components (61 files)
    ├── store/                   # Zustand stores (3)
    ├── hooks/                   # Custom hooks (2)
    ├── constants/               # Constants & type maps (4)
    ├── types/                   # Global TS declarations (3)
    └── lib/                     # Server utils, models, helpers
```

## Entry Points

- **Server**: `server.ts` — Express + Socket.io custom server, serves Next.js
- **App**: `src/app/layout.tsx` — Root layout (Header, Footer, Providers)
- **Home**: `src/app/page.tsx` — Landing page
- **Tests**: `npm run test:run` — Vitest (457 tests, 3 phases)
- **Scripts**: `scripts/create-admin.ts` — Admin user creation

## Pages (26 routes)

| Route                                                                   | Purpose                                             |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| `/`                                                                     | Landing (HeroSection)                               |
| `/login`, `/register`                                                   | Auth                                                |
| `/projects`, `/projects/[pid]`, `/projects/new`, `/projects/[pid]/edit` | Project CRUD                                        |
| `/projects/[pid]/manage`                                                | Project member management                           |
| `/dashboard/[pid]`, `/dashboard/[pid]/kanban`, `/dashboard/[pid]/wbs`   | Dashboard + Kanban + WBS                            |
| `/kanban/[pid]`                                                         | Standalone kanban                                   |
| `/profile`, `/profile/[id]`                                             | Profile (self / public)                             |
| `/tech`                                                                 | Tech stack & activity metrics                       |
| `/mypage`                                                               | My applications                                     |
| `/chat`                                                                 | Chat (prototype)                                    |
| `/admin/*`                                                              | Admin panel (stats, users, projects, codes, stacks) |
| `/privacy`, `/terms`                                                    | Legal pages                                         |

## API Routes (52 endpoints)

| Domain            | Path                                                      | Methods                 |
| ----------------- | --------------------------------------------------------- | ----------------------- |
| **Auth**          | `/api/auth/[...nextauth]`                                 | GET, POST               |
|                   | `/api/auth/register`                                      | POST                    |
| **Projects**      | `/api/projects`                                           | GET, POST               |
|                   | `/api/projects/[pid]`                                     | GET, PUT, DELETE, PATCH |
|                   | `/api/projects/[pid]/apply`                               | POST                    |
|                   | `/api/projects/[pid]/applications`                        | GET                     |
|                   | `/api/projects/[pid]/application/me`                      | GET                     |
|                   | `/api/projects/[pid]/like`                                | POST                    |
|                   | `/api/projects/[pid]/resources`                           | GET, POST, DELETE       |
| **Applications**  | `/api/applications`                                       | GET                     |
|                   | `/api/applications/my`                                    | GET                     |
|                   | `/api/applications/[appId]`                               | PUT, DELETE             |
|                   | `/api/applications/[appId]/leave`                         | PATCH                   |
|                   | `/api/applications/by-project/[pid]`                      | GET                     |
| **Kanban**        | `/api/kanban/boards`                                      | GET, POST               |
|                   | `/api/kanban/boards/[boardId]/members`                    | GET                     |
|                   | `/api/kanban/sections`                                    | GET, POST               |
|                   | `/api/kanban/sections/[id]`                               | PUT, DELETE             |
|                   | `/api/kanban/notes`                                       | POST                    |
|                   | `/api/kanban/notes/[noteId]`                              | PUT, DELETE             |
|                   | `/api/kanban/notes/batch`                                 | PUT                     |
|                   | `/api/kanban/notes/batch-delete`                          | POST                    |
| **WBS**           | `/api/wbs/tasks`                                          | GET, POST               |
|                   | `/api/wbs/tasks/[taskId]`                                 | PATCH, DELETE           |
|                   | `/api/wbs/tasks/batch`                                    | PATCH, DELETE           |
| **Chat**          | `/api/chat/rooms`                                         | GET, POST               |
|                   | `/api/chat/rooms/[roomId]`                                | GET                     |
|                   | `/api/chat/messages`                                      | POST                    |
|                   | `/api/chat/messages/[roomId]`                             | GET                     |
| **Users**         | `/api/users`                                              | GET                     |
|                   | `/api/users/me`                                           | GET, PUT                |
|                   | `/api/users/[id]`                                         | GET                     |
|                   | `/api/users/me/availability`                              | PUT                     |
|                   | `/api/users/blog/posts`                                   | GET                     |
|                   | `/api/users/github-stats`                                 | GET                     |
| **Notifications** | `/api/notifications`                                      | GET                     |
|                   | `/api/notifications/[id]`                                 | PATCH                   |
| **Admin**         | `/api/admin/stats`                                        | GET                     |
|                   | `/api/admin/users`, `/api/admin/users/[id]`               | GET, PATCH              |
|                   | `/api/admin/projects`, `/api/admin/projects/[pid]`        | GET, PATCH              |
|                   | `/api/admin/common-codes`, `/api/admin/common-codes/[id]` | GET, POST, PUT, DELETE  |
|                   | `/api/admin/tech-stacks`, `/api/admin/tech-stacks/[id]`   | GET, POST, PUT, DELETE  |
| **Misc**          | `/api/cloudinary/sign`                                    | POST                    |
|                   | `/api/common-codes`                                       | GET                     |
|                   | `/api/tech-stacks`                                        | GET                     |
|                   | `/api/reviews`, `/api/reviews/check`                      | GET, POST               |
|                   | `/api/utils/og`                                           | GET                     |
|                   | `/api/proxy/solved`                                       | GET                     |
|                   | `/api/status`                                             | GET                     |
|                   | `/api/debug/github-sync`                                  | GET                     |

## Mongoose Models (19)

| Model         | Collection     | Key Fields                                   |
| ------------- | -------------- | -------------------------------------------- |
| User          | `users`        | uid, nName, authorEmail, memberType, bio, domains, workStyle, onboardingStep |
| Project       | projects       | pid, title, ownerId, status (recruiting/in_progress/completed/paused), techStacks, members (embedded) |
| Application   | applications   | projectId, applicantId, motivation, weeklyHours, status |
| ProjectMember | projectmembers | **@deprecated** — Phase 7 삭제 예정, projects.members embedded로 대체 |
| Notification  | notifications  | userId, type, message                        |
| Counter       | counters       | name, seq (auto-increment)                   |
| BoardModel    | boards         | projectId, title                             |
| SectionModel  | sections       | boardId, title, order                        |
| NoteModel     | notes          | sectionId, content, order                    |
| TaskModel     | tasks          | pid, title, startDate, endDate, dependencies |
| ChatRoom      | chatrooms      | participants, type                           |
| ChatMessage   | chatmessages   | roomId, senderId, content                    |
| Review        | reviews        | reviewerId, revieweeId, projectId            |
| Comment       | comments       | (API/UI not implemented)                     |
| Post          | posts          | (API/UI not implemented)                     |
| CommonCode    | commoncodes    | category, code, label                        |
| TechStack     | techstacks     | name, category, icon                         |
| Skill         | skills         | userId, techStackId                          |
| Availability  | availabilities | userId, schedule                             |

## Zustand Stores

| Store               | Path                                 | Purpose                                                     |
| ------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `boardStore`        | `src/store/boardStore.ts`            | Kanban state (notes, sections, Socket, Undo/Redo via Zundo) |
| `wbsStore`          | `src/store/wbsStore.ts`              | WBS tasks state (CRUD, socket broadcast)                    |
| `modalStore`        | `src/store/modalStore.ts`            | Global alert/confirm modal                                  |
| `notificationStore` | `src/lib/store/notificationStore.ts` | Notification state                                          |
| `applicationStore`  | `src/store/applicationStore.ts`      | My application status map (projectId → {applicationId, status}) |

## Utility Modules

| Module             | Path                                    | Purpose                                                     |
| ------------------ | --------------------------------------- | ----------------------------------------------------------- |
| `taskDependency`   | `src/lib/utils/wbs/taskDependency.ts`   | WBS dependency cycle detection & topological sort           |
| `scheduleConflict` | `src/lib/utils/wbs/scheduleConflict.ts` | Task date conflict validation                               |
| `drawDependencies` | `src/lib/utils/wbs/drawDependencies.ts` | Gantt chart dependency arrow rendering                      |
| `chatUtils`        | `src/lib/utils/chat/chatUtils.ts`       | Chat message formatting                                     |
| `resourceUtils`    | `src/lib/utils/resourceUtils.ts`        | Project resource helpers                                    |
| `iconUtils`        | `src/lib/iconUtils.ts`                  | skillicons.dev URL generation                               |
| `profileUtils`     | `src/lib/profileUtils.ts`               | Profile data formatting                                     |
| `github/*`         | `src/lib/github/`                       | GitHub GraphQL API (client, queries, service, types, utils) |
| `blog/rss`         | `src/lib/blog/rss.ts`                   | Blog RSS feed parsing                                       |

## Configuration

| File                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `next.config.js`       | Next.js config (image domains, webpack fallback) |
| `tailwind.config.js`   | Tailwind CSS config — 신규 디자인 시스템 토큰 포함 (surface/on-surface/tertiary/error/outline/inverse 계열, Manrope/Inter/Noto Sans KR 폰트, ambient/modal 쉐도우) |
| `tsconfig.json`        | TypeScript config (`@/` = `src/`)                |
| `tsconfig.server.json` | server.ts compilation                            |
| `vitest.config.ts`     | Vitest test runner config                        |
| `render.yaml`          | Render.com deployment                            |
| `.eslintrc.json`       | ESLint rules                                     |

## Documentation

| File                                         | Topic                                 |
| -------------------------------------------- | ------------------------------------- |
| `CLAUDE.md`                                  | Agent & team coding guide (216 lines) |
| `README.md`                                  | Project introduction                  |
| `docs/testing/TESTING_GUIDE.md`              | Test strategy overview                |
| `docs/testing/TESTING_PHASE{1,2,3}_GUIDE.md` | Phase-specific test guides            |
| `docs/plans/DEV_ROADMAP.md`                  | Development roadmap                   |
| `docs/plans/UI_UX_IMPROVEMENT_PLAN.md`       | UI/UX improvement plan                |
| `docs/plans/UIUX_DEVELOPMENT_SPEC.md`        | UI/UX 전면 개편 개발 기획서 (Phase 1~9) |
| `docs/assets/`                               | 디자인 에셋 (Stitch HTML + PNG, pages/components/kanban/modals/admin) |
| `docs/plans/WBS_REDESIGN.md`                 | WBS redesign plan                     |
| `docs/plans/admin-page-plan.md`              | Admin page plan                       |
| `docs/plans/KANBAN_REVIEW.md`                | Kanban review                         |

## Test Coverage

- **Phase 1** (Pure functions): 203 tests — `src/lib/utils/**`, `src/constants/**`
- **Phase 2** (Stores/Hooks): 161 tests — `src/store/**`, `src/hooks/**`
- **Phase 3** (API Routes): 93 tests — `src/app/api/**`
- **Total**: 457 tests
- **Test infra**: `src/__tests__/fixtures/` (mock data), `src/__tests__/helpers/` (session, socket, DB, request mocks)

## Key Dependencies

| Package               | Version | Purpose                            |
| --------------------- | ------- | ---------------------------------- |
| next                  | 14.2.x  | App Router framework               |
| react                 | 18.3.x  | UI library                         |
| mongoose              | 8.x     | MongoDB ODM                        |
| next-auth             | 4.x     | Authentication (JWT + Credentials) |
| socket.io             | 4.8.x   | Real-time communication            |
| zustand               | 4.5.x   | Client state management            |
| express               | 5.x     | HTTP server                        |
| tailwindcss           | 3.4.x   | CSS framework                      |
| vitest                | 4.x     | Test runner                        |
| mongodb-memory-server | 11.x    | In-memory DB for integration tests |

## Quick Start

1. `npm install`
2. Create `.env.local` (MONGODB*URI, JWT_SECRET, NEXTAUTH_URL, NEXTAUTH_SECRET, CLOUDINARY*\*)
3. `npm run dev` → http://localhost:3000
4. `npm run test:run` → 457 tests

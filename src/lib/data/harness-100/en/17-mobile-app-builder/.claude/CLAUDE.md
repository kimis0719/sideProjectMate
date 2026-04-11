# Mobile App Builder Harness

A harness where an agent team collaborates to perform UI/UX design, native code generation, API integration, and store deployment preparation for mobile apps.

## Structure

```
.claude/
├── agents/
│   ├── ux-designer.md        — UX/UI design (wireframes, design system, interactions)
│   ├── app-developer.md      — Native/cross-platform app development (Swift, Kotlin, Flutter, RN)
│   ├── api-integrator.md     — API integration (REST/GraphQL client, auth, caching)
│   ├── store-manager.md      — Store deployment (metadata, screenshots, review preparation)
│   └── qa-engineer.md        — Quality verification (UI tests, performance, accessibility, security)
├── skills/
│   ├── mobile-app-builder/
│   │   └── skill.md           — Orchestrator (team coordination, workflow, error handling)
│   ├── mobile-ux-patterns/
│   │   └── skill.md           — UX designer extension (iOS HIG/Material 3, navigation, design tokens)
│   └── app-store-optimization/
│       └── skill.md           — Store manager extension (ASO metadata, keyword strategy, review preparation)
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/mobile-app-builder` skill, or make a natural language request like "Build me a mobile app."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_ux_design.md` — UX/UI design document
- `02_app_code/` — App source code
- `02_app_architecture.md` — App architecture document
- `03_api_integration.md` — API integration specification
- `04_store_listing.md` — Store deployment metadata
- `05_qa_report.md` — QA verification report

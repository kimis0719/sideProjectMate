# Microservice Designer Harness

An agent team harness for designing, decomposing, communicating, and monitoring microservice architectures. Automates the full pipeline from domain analysis to observability design.

## Structure

```
.claude/
├── agents/
│   ├── domain-analyst.md        — Domain analysis (bounded contexts, event storming, aggregate identification)
│   ├── service-architect.md     — Service design (API contracts, data ownership, deployment units)
│   ├── communication-designer.md — Communication design (sync/async, event bus, API gateway)
│   ├── observability-engineer.md — Observability design (metrics, logging, tracing, alerting)
│   └── architecture-reviewer.md  — Cross-validation (domain <-> service <-> communication <-> observability consistency)
├── skills/
│   ├── microservice-designer/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── ddd-context-mapping/
│   │   └── skill.md              — Bounded context, event storming, and context map guide
│   └── distributed-patterns/
│       └── skill.md              — Distributed system patterns (Saga, CQRS, Circuit Breaker) guide
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/microservice-designer` skill, or make a natural language request such as "design a microservice architecture."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_domain_analysis.md` — Domain analysis report
- `02_service_design.md` — Service design document
- `03_communication_design.md` — Communication design document
- `04_observability_design.md` — Observability design document
- `05_review_report.md` — Final review report

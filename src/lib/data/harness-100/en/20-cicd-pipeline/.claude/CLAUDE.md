# CI/CD Pipeline Harness

A harness where an agent team collaborates to design, build, monitor, and optimize CI/CD pipelines.

## Structure

```
.claude/
├── agents/
│   ├── pipeline-designer.md     — Pipeline design (stages, triggers, branch strategies)
│   ├── infra-engineer.md        — Infrastructure configuration (runners, containers, environment variables, secrets)
│   ├── monitoring-specialist.md — Monitoring (metrics, alerts, dashboards, SLA)
│   ├── security-scanner.md      — Security scanning (SAST, DAST, dependencies, containers)
│   └── pipeline-reviewer.md     — Pipeline review (efficiency, reliability, security, alignment)
├── skills/
│   ├── cicd-pipeline/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── pipeline-security-gates/
│   │   └── skill.md              — Security scanner extension (SAST/SCA/secret detection tools, gate placement, thresholds)
│   └── deployment-strategies/
│       └── skill.md              — Pipeline designer extension (Blue-Green/Canary/Rolling, DORA)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/cicd-pipeline` skill or make a natural language request such as "Create a CI/CD pipeline."

## Artifacts

All artifacts are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_pipeline_design.md` — Pipeline design document
- `02_pipeline_config/` — Pipeline configuration files (YAML, etc.)
- `03_monitoring.md` — Monitoring design document
- `04_security_scan.md` — Security scan configuration and report
- `05_review_report.md` — Pipeline review report

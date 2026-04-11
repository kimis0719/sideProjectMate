# Infra as Code Harness

An agent team harness for Infrastructure as Code (IaC) design and implementation. Automates Terraform/Pulumi-based environment configuration, security, and cost optimization pipelines.

## Structure

```
.claude/
├── agents/
│   ├── infra-architect.md        — Infrastructure design (architecture, module structure, environment separation)
│   ├── security-engineer.md      — Security engineer (IAM, networking, encryption, compliance)
│   ├── cost-optimizer.md         — Cost optimization (resource sizing, reservations, FinOps)
│   ├── drift-detector.md         — Drift detection (state verification, policy compliance, auto-remediation)
│   └── iac-reviewer.md           — Cross-validation (design <-> security <-> cost <-> drift consistency)
├── skills/
│   ├── infra-as-code/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── terraform-module-patterns/
│   │   └── skill.md              — Terraform module design pattern guide
│   └── cloud-cost-models/
│       └── skill.md              — Cloud cost model and FinOps guide
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/infra-as-code` skill, or make a natural language request such as "design infrastructure code."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_infra_design.md` — Infrastructure design document
- `02_security_design.md` — Security design document
- `03_cost_analysis.md` — Cost analysis report
- `04_drift_policy.md` — Drift detection policy
- `05_review_report.md` — Final review report

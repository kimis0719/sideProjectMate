# LLM App Builder Harness

LLM application construction: a harness where an agent team collaborates to perform prompt engineering → RAG architecture → optimization → evaluation → deployment.

## Structure

```
.claude/
├── agents/
│   ├── prompt-engineer.md         — Prompt Engineer (prompt design, few-shot, chain-of-thought, guardrails)
│   ├── rag-architect.md           — RAG Architect (retrieval design, embedding, vector DB, chunking)
│   ├── optimization-engineer.md   — Optimization Engineer (latency, cost, caching, model selection)
│   ├── eval-specialist.md         — Evaluation Specialist (benchmark design, quality metrics, A/B testing)
│   └── deploy-engineer.md        — Deploy Engineer (API serving, scaling, monitoring, CI/CD)
├── skills/
│   ├── llm-app-builder/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── chunking-strategy-guide/
│   │   └── skill.md              — Document chunking strategy guide
│   └── prompt-optimizer/
│       └── skill.md              — Prompt optimization methodology guide
└── CLAUDE.md                      — This file
```

## Usage

Trigger the `/llm-app-builder` skill or use natural language like "Build an LLM application for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and application requirements
- `01_prompt_design.md` — Prompt templates and engineering document
- `02_rag_architecture.md` — RAG pipeline architecture
- `03_optimization_plan.md` — Performance optimization plan
- `04_eval_report.md` — Evaluation results and quality metrics
- `05_deploy_config/` — Deployment configuration and infrastructure
- `src/` — Application source code

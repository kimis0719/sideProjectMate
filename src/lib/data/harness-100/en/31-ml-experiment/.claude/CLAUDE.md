# ML Experiment Harness

A harness where an agent team collaborates to perform the full ML experiment lifecycle: data preparation → model design → training → evaluation → deployment.

## Structure

```
.claude/
├── agents/
│   ├── data-engineer.md         — Data Engineer (collection, preprocessing, feature engineering, splitting)
│   ├── model-designer.md        — Model Designer (architecture, hyperparameters, loss functions)
│   ├── training-manager.md      — Training Manager (experiment tracking, GPU management, checkpoints, reproducibility)
│   ├── evaluation-analyst.md    — Evaluation Analyst (metrics, bias verification, interpretability, A/B)
│   └── experiment-reviewer.md   — Experiment Reviewer (cross-validation, publication quality, reproducibility verification)
├── skills/
│   ├── ml-experiment/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── feature-engineering-cookbook/
│   │   └── skill.md              — Feature engineering techniques catalog
│   ├── model-selection-guide/
│   │   └── skill.md              — ML model selection matrix guide
│   └── experiment-tracking-setup/
│       └── skill.md              — Experiment tracking and reproducibility guide
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/ml-experiment` skill or use natural language like "Design an ML experiment for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_data_preparation.md` — Data preparation plan and pipeline
- `02_model_design.md` — Model architecture design
- `03_training_config.md` — Training configuration and experiment tracking
- `04_evaluation_report.md` — Evaluation report
- `05_review_report.md` — Experiment review report
- `experiment_code/` — Experiment implementation code

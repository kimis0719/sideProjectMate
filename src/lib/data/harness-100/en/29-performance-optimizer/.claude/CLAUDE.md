# Performance Optimizer Harness

An agent team harness for performance optimization covering profiling, bottleneck analysis, optimization, and benchmarking.

## Structure

```
.claude/
├── agents/
│   ├── profiler.md              — Profiler (CPU, memory, I/O, network profiling)
│   ├── bottleneck-analyst.md    — Bottleneck analyst (hotspot identification, root cause, impact assessment)
│   ├── optimization-engineer.md — Optimization engineer (code/query/architecture optimization)
│   ├── benchmark-manager.md     — Benchmark manager (test design, execution, comparative analysis)
│   └── perf-reviewer.md         — Performance reviewer (cross-validation, regression prevention, final report)
├── skills/
│   ├── performance-optimizer/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── query-optimization-patterns/
│   │   └── skill.md              — Query optimization pattern guide
│   └── caching-strategy-selector/
│       └── skill.md              — Caching strategy selection guide
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/performance-optimizer` skill, or make a natural language request such as "optimize performance."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_profiling_report.md` — Profiling results
- `02_bottleneck_analysis.md` — Bottleneck analysis report
- `03_optimization_plan.md` — Optimization plan and implementation
- `04_benchmark_results.md` — Benchmark results and comparison
- `05_review_report.md` — Review report

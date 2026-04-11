# IP Portfolio Harness

An intellectual property portfolio management harness. An agent team collaborates to produce IP analysis, patent mapping, protection strategy, licensing strategy, and renewal scheduling.

## Structure

```
.claude/
├── agents/
│   ├── ip-analyst.md             — IP analysis (portfolio assessment, valuation, gap analysis)
│   ├── patent-mapper.md          — Patent mapping (technology mapping, claim analysis, prior art)
│   ├── protection-advisor.md     — Protection strategy (filing strategy, trade secrets, design rights)
│   ├── license-strategist.md     — Licensing strategy (in/out licensing, royalty, cross-licensing)
│   └── renewal-scheduler.md     — Renewal scheduling (deadlines, cost optimization, abandonment criteria)
├── skills/
│   ├── ip-portfolio/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── patent-valuation/
│   │   └── skill.md              — Patent valuation (ip-analyst extension)
│   └── ip-landscape-analysis/
│       └── skill.md              — IP landscape analysis (patent-mapper extension)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/ip-portfolio` skill, or make a natural language request such as "Analyze our IP portfolio."

## Outputs

All outputs are saved to the `_workspace/` directory:
- `00_input.md` — IP portfolio information and analysis scope
- `01_ip_analysis.md` — IP portfolio analysis report
- `02_patent_map.md` — Patent mapping report
- `03_protection_strategy.md` — Protection strategy
- `04_licensing_strategy.md` — Licensing strategy
- `05_renewal_schedule.md` — Renewal schedule and cost plan
- `06_ip_summary.md` — IP portfolio summary report

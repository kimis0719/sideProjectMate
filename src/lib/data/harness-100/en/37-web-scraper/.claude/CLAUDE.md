# Web Scraper Harness

Web scraping system construction: a harness in which an agent team collaborates to build target analysis, crawler design, parsing, storage, and monitoring.

## Structure

```
.claude/
├── agents/
│   ├── target-analyst.md      — Target site analysis (structure, robots.txt, legal review)
│   ├── crawler-developer.md   — Crawler design and implementation (request strategy, session management, evasion)
│   ├── parser-engineer.md     — HTML/JSON parsing logic (selectors, data extraction)
│   ├── data-manager.md        — Data storage, cleansing, and validation (schema, deduplication, export)
│   └── monitor-operator.md    — Monitoring, alerting, and maintenance (health checks, change detection, logging)
├── skills/
│   ├── web-scraper/
│   │   └── skill.md           — Orchestrator (team coordination, workflow, error handling)
│   ├── anti-bot-analyzer/
│   │   └── skill.md           — Anti-bot analysis (defense layers, rate limits, legal risk)
│   └── selector-generator/
│       └── skill.md           — Selector generation (CSS/XPath, robustness scoring, change detection)
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/web-scraper` skill, or make a natural language request such as "Build a web scraping system."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — User input summary
- `01_target_analysis.md` — Target site analysis report
- `02_crawler_design.md` — Crawler design and code
- `03_parser_logic.md` — Parsing logic and code
- `04_data_storage.md` — Data storage design
- `05_monitor_config.md` — Monitoring configuration
- `src/` — Actual scraping source code

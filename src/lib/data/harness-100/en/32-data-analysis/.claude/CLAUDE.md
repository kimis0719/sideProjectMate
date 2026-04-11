# Data Analysis Harness

A harness where an agent team collaborates to perform the full data analysis lifecycle: exploration → cleaning → analysis → visualization → reporting.

## Structure

```
.claude/
├── agents/
│   ├── explorer.md          — Exploratory Analysis (data profiling, distribution analysis, outlier detection)
│   ├── cleaner.md           — Data Cleaning (missing values, outliers, type conversion, normalization)
│   ├── analyst.md           — Statistical Analysis (hypothesis testing, correlation, regression, clustering)
│   ├── visualizer.md        — Visualization (chart design, dashboard layout, interaction)
│   └── reporter.md          — Report Writing (insight synthesis, executive summary, recommendations)
├── skills/
│   ├── data-analysis/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── statistical-tests-selector/
│   │   └── skill.md              — Statistical test selection guide
│   └── visualization-chooser/
│       └── skill.md              — Visualization type selection matrix guide
└── CLAUDE.md                — This file
```

## Usage

Trigger the `/data-analysis` skill or use natural language like "Analyze this data for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and data source information
- `01_exploration_report.md` — Exploratory Data Analysis (EDA) results
- `02_cleaning_log.md` — Cleaning operation log and transformation code
- `03_analysis_results.md` — Statistical analysis results
- `04_visualizations.md` — Visualization concepts and code
- `05_final_report.md` — Final analysis report
- `scripts/` — Reproducible analysis scripts

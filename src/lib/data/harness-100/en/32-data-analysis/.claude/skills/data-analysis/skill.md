---
name: data-analysis
description: "A full analysis pipeline where an agent team collaborates to perform exploratory data analysis (EDA), data cleaning, statistical analysis, visualization, and report writing. Use this skill for 'analyze this data', 'do EDA', 'exploratory analysis', 'statistical analysis', 'data visualization', 'write an analysis report', 'analyze CSV', 'extract data insights', 'data cleaning', 'outlier analysis', and other data analysis tasks. Note: real-time data streaming, ML model training/deployment, and BI dashboard server construction are outside this skill's scope."
---

# Data Analysis — Full Data Analysis Pipeline

An agent team collaborates to perform the full data lifecycle: exploration → cleaning → analysis → visualization → reporting.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| explorer | `.claude/agents/explorer.md` | Exploratory analysis, data profiling | general-purpose |
| cleaner | `.claude/agents/cleaner.md` | Data cleaning, transformation pipeline | general-purpose |
| analyst | `.claude/agents/analyst.md` | Statistical analysis, insight derivation | general-purpose |
| visualizer | `.claude/agents/visualizer.md` | Chart design, visualization code generation | general-purpose |
| reporter | `.claude/agents/reporter.md` | Final report writing, quality verification | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Data Source**: File path, format (CSV/Excel/JSON/DB), size
    - **Analysis Purpose**: Business questions, hypotheses, expected results
    - **Constraints** (optional): Time, specific analysis techniques, reporting audience
    - **Domain Information** (optional): Industry, variable meanings, business context
2. Create `_workspace/` directory and `_workspace/scripts/` subdirectory
3. Organize input and save to `_workspace/00_input.md`
4. Copy data files to `_workspace/data/`
5. If existing files are present, copy to `_workspace/` and skip the corresponding Phase
6. **Determine execution mode** based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Output |
|-------|------|-------|-------------|--------|
| 1 | Exploratory Analysis | explorer | None | `01_exploration_report.md` |
| 2 | Data Cleaning | cleaner | Task 1 | `02_cleaning_log.md`, `scripts/02_cleaning.py` |
| 3a | Statistical Analysis | analyst | Task 2 | `03_analysis_results.md`, `scripts/03_analysis.py` |
| 3b | EDA Visualization | visualizer | Task 1 | `04_visualizations.md` (EDA portion) |
| 4 | Analysis Result Visualization | visualizer | Task 3a | `04_visualizations.md` (analysis portion), `scripts/04_viz_*.py` |
| 5 | Final Report | reporter | Tasks 3a, 4 | `05_final_report.md` |

Tasks 3a (analysis) and 3b (EDA visualization) run **in parallel**.

**Inter-team communication flow:**
- explorer completes → Sends cleaning recommendations to cleaner, analysis suggestions to analyst, distribution visualization targets to visualizer
- cleaner completes → Sends cleaned data location and transformation history to analyst
- analyst completes → Sends visualization requests to visualizer, insights to reporter
- visualizer completes → Sends visualization list to reporter
- reporter cross-validates all outputs. Sends correction requests when inconsistencies are found (up to 2 times)

### Phase 3: Integration and Final Outputs

1. Check all files in `_workspace/`
2. Verify that all required corrections from reporter have been addressed
3. Report final summary to the user:
    - Exploration Report — `01_exploration_report.md`
    - Cleaning Log — `02_cleaning_log.md`
    - Analysis Results — `03_analysis_results.md`
    - Visualizations — `04_visualizations.md`
    - Final Report — `05_final_report.md`
    - Reproducible Scripts — `scripts/` directory

## Scale-Based Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Analyze the data", "Full analysis" | **Full Pipeline** | All 5 |
| "Just do EDA", "Data exploration" | **Exploration Mode** | explorer + visualizer |
| "Clean the data", "Data cleaning" | **Cleaning Mode** | explorer + cleaner |
| "Statistical analysis only", "Hypothesis testing" | **Analysis Mode** | analyst + visualizer + reporter |
| "Visualization only", "Draw charts" | **Visualization Mode** | visualizer only |
| "Write analysis report" (existing analysis) | **Report Mode** | reporter only |

**Leveraging existing files**: If already cleaned data exists, skip explorer and cleaner. If analysis results exist, skip analyst and proceed with visualization and reporting only.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary outputs and data storage |
| Message-based | SendMessage | Key information transfer, correction requests |
| Code-based | `_workspace/scripts/` | Reproducible analysis scripts |

File naming convention: `{order}_{output}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| File read failure | Try encodings sequentially (UTF-8→CP949→EUC-KR→Latin-1), auto-detect delimiter |
| Large data (>1GB) | Analyze with sampling, chunk processing, use dask for full statistics |
| Analysis assumptions not met | Auto-switch to nonparametric alternatives, state rationale in report |
| Font rendering issues | Auto-insert OS-specific font configuration code |
| Agent failure | 1 retry, proceed without that output if failed, note omission in report |
| Reporter finds inconsistency | Send correction request to relevant agent → rework → re-verify (up to 2 times) |

## Test Scenarios

### Normal Flow
**Prompt**: "Analyze this sales CSV file and find the cause of the sales decline"
**Expected Results**:
- EDA: Variable profiling, missing/outlier analysis, sales-related variable identification
- Cleaning: Missing value treatment, outlier capping, type conversion log
- Analysis: Time-series decomposition, segment comparison (t-test/ANOVA), correlation analysis
- Visualization: Sales trend line chart, factor comparison bar chart, correlation heatmap
- Report: Top 3 decline causes + recommended actions + executive summary

### Existing File Flow
**Prompt**: "I already have cleaned data. Just do statistical analysis and visualization" + cleaned data file attached
**Expected Results**:
- Copy existing data to `_workspace/data/`
- Analysis mode: Skip explorer and cleaner, deploy analyst + visualizer + reporter
- Cleaning history recorded based on user-provided information

### Error Flow
**Prompt**: "Analyze this Excel file" (many variables with >50% missing, numerous outliers)
**Expected Results**:
- explorer reports data quality issues in detail
- cleaner presents per-variable treatment strategies with rationale, warning if rows decrease >30%
- analyst states data sufficiency limitations and performs power analysis
- reporter honestly records data quality issues in limitations section


## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| statistical-tests-selector | `.claude/skills/statistical-tests-selector/skill.md` | analyst | Test selection tree, t-test/ANOVA/chi-squared, effect size, power |
| visualization-chooser | `.claude/skills/visualization-chooser/skill.md` | visualizer | Chart type matrix, matplotlib/seaborn/plotly patterns, anti-patterns |

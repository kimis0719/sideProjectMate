---
name: bi-dashboard
description: "Full pipeline where an agent team collaborates to generate data warehouse design, KPI definitions, visualizations, and automated reports for a BI dashboard. Use this skill for requests like 'build me a BI dashboard', 'dashboard design', 'define KPIs', 'executive reporting dashboard', 'data visualization design', 'report automation', 'data warehouse design', 'build a KPI tree', 'sales dashboard', 'performance metrics framework', and other BI dashboard construction tasks. Also supports visualization or report automation when existing data models or KPI lists are available. Note: direct manipulation of BI tools (Tableau/PowerBI/Looker), database instance creation, and real-time data pipeline operation are outside the scope of this skill."
---

# BI Dashboard — Data Analytics Dashboard Full Pipeline

An agent team collaborates to generate data warehouse design, KPI definitions, visualizations, and automated reports in one pass.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| data-engineer | `.claude/agents/data-engineer.md` | Warehouse design, ETL, data modeling | general-purpose |
| kpi-designer | `.claude/agents/kpi-designer.md` | Metric definition, calculation logic, target setting | general-purpose |
| dashboard-builder | `.claude/agents/dashboard-builder.md` | Visualization design, layout, interactions | general-purpose |
| report-automator | `.claude/agents/report-automator.md` | Scheduled reporting, alert configuration, distribution | general-purpose |
| bi-reviewer | `.claude/agents/bi-reviewer.md` | Consistency verification, data flow QA | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Business domain**: E-commerce/SaaS/Manufacturing/Finance/Education, etc.
    - **Data sources**: Available DB, API, file information
    - **Key questions**: Business questions the dashboard should answer
    - **User tiers**: Executives/team leads/practitioners — dashboard users
    - **Existing assets** (optional): Existing KPIs, data models, reports, etc.
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request (see "Execution Modes by Request Scope" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Data warehouse design | data-engineer | None | `_workspace/01_data_warehouse_design.md` |
| 2 | KPI definition | kpi-designer | Task 1 | `_workspace/02_kpi_definition.md` |
| 3a | Dashboard visualization | dashboard-builder | Tasks 1, 2 | `_workspace/03_dashboard_spec.md` |
| 3b | Report automation | report-automator | Task 2 | `_workspace/04_report_automation.md` |
| 4 | BI review | bi-reviewer | Tasks 3a, 3b | `_workspace/05_review_report.md` |

Tasks 3a (dashboard) and 3b (report) run **in parallel**.

**Inter-agent communication flow:**
- data-engineer completes > passes Measure/Dimension list to kpi-designer
- kpi-designer completes > passes KPI priorities/drill-down to dashboard-builder, passes reporting schedule/thresholds to report-automator
- dashboard-builder completes > passes snapshot capture method to report-automator
- bi-reviewer cross-validates all deliverables. On CRITICAL findings, requests corrections from the relevant agent > rework > re-verify (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

Finalize deliverables based on the reviewer's report:

1. Verify all files in `_workspace/`
2. Confirm that all CRITICAL findings have been addressed
3. Report the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Build me a BI dashboard", "full dashboard design" | **Full pipeline** | All 5 agents |
| "Just define KPIs" | **KPI mode** | data-engineer + kpi-designer + reviewer |
| "Design a dashboard with these KPIs" (existing KPIs) | **Visualization mode** | dashboard-builder + reviewer |
| "Set up report automation" | **Report mode** | report-automator + reviewer |
| "Review this dashboard design" | **Review mode** | reviewer only |

**Reusing existing files**: If the user provides existing KPI lists, data models, etc., copy them to the appropriate numbered location in `_workspace/` and skip the corresponding agent.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share primary deliverables |
| Message-based | SendMessage | Real-time key information transfer, correction requests |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| No data source information | Design with domain-standard schema, specify customization points |
| Business objectives unclear | Propose domain-standard KPI frameworks, guide selection |
| Agent failure | Retry once > if still failing, proceed without that deliverable, note in review report |
| CRITICAL finding in review | Request correction from relevant agent > rework > re-verify (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "Design a BI dashboard for an e-commerce store covering sales, customers, and inventory management"
**Expected result**:
- Data model: E-commerce Star Schema (fact_orders, dim_product, dim_customer, dim_date)
- KPIs: Purchase funnel (visits > cart > checkout), revenue, average order value, repurchase rate, inventory turnover
- Dashboard: Executive Summary + Sales + Customer + Inventory, 4 tabs
- Reports: Daily sales summary, weekly team report, monthly executive report
- Review: Full consistency matrix verification

### Existing File Reuse Flow
**Prompt**: "Design a dashboard layout with this KPI list" + KPI file attached
**Expected result**:
- Copy existing KPIs to `_workspace/02_kpi_definition.md`
- Visualization mode: Deploy dashboard-builder + reviewer
- Skip data-engineer and kpi-designer

### Error Flow
**Prompt**: "Build a dashboard for our company"
**Expected result**:
- Domain/data source unknown > propose 3 common business domains, guide selection
- After selection, proceed with full pipeline based on domain-standard schema

## Agent Extension Skills

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| kpi-tree-builder | `.claude/skills/kpi-tree-builder/skill.md` | kpi-designer, dashboard-builder | KPI tree decomposition methodology, domain templates, threshold setting, drill-down design |
| chart-selector | `.claude/skills/chart-selector/skill.md` | dashboard-builder, kpi-designer | Chart type decision tree, per-chart rules, color palettes, layout principles |

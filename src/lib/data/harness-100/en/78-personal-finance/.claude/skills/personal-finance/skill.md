---
name: personal-finance
description: "itemsperson financialmanagement A pipeline where an agent team collaborates for comprehensive planning. 'financialmanagement ', 'totaldepartment organization', ' ', 'investment ', 'tax savings method', 'annual optimization', 'retirement preparation', 'budget ', 'savings plan', 're-', 'assetmanagement', 'financialdesign' etc. itemsperson financial before skill usage. existing totaldepartment data case analysisdepartment whenworkto do number . However, actual execution, , tax versus is outside this skill's scope."
---

# Personal Finance — itemsperson financialmanagement comprehensive pipeline

incomeexpenseanalysis→budgetdesign→investmentstrategy→tax savingsapproach→retirementdesign An agent team collaborates to generate all deliverables at once.

## execution mode

**agent team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## agent composition

| agent | file | role | type |
|---------|------|------|------|
| financial-analyst | `.claude/agents/financial-analyst.md` | incomeexpense analysis, financialcasebeforenature diagnosis | general-purpose |
| budget-planner | `.claude/agents/budget-planner.md` | budget design, savings plan | general-purpose |
| investment-advisor | `.claude/agents/investment-advisor.md` | assetallocation, portfolio design | general-purpose |
| tax-strategist | `.claude/agents/tax-strategist.md` | tax savings strategy, retirement design | general-purpose |
| finance-reviewer | `.claude/agents/finance-reviewer.md` | cross-verification, figure consistency confirm | general-purpose |

## workflow

### Phase 1: preparation (Orchestrator directly perform)

1. Extract from user input:
 - ** information**: month income, type(/company/from)
 - **expense information** (optional): month expense within or versusquality scale
 - **asset·debt** (optional): report asset, versus current status
 - **financial goal** (optional): savings, investment, within , retirement etc.
 - **existing file** (optional): totaldepartment data, existing financial plan etc.
2. `_workspace/` Create the directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/`and skip the corresponding Phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: team composition and execution

| order | task | responsible | dependency | deliverable |
|------|------|------|------|--------|
| 1 | incomeexpense analysis | analyst | None | `_workspace/01_financial_analysis.md` |
| 2 | budget design | planner | task 1 | `_workspace/02_budget_plan.md` |
| 3a | investment strategy | advisor | task 1, 2 | `_workspace/03_investment_strategy.md` |
| 3b | tax savings·retirement design | strategist | task 1, 2 | `_workspace/04_tax_strategy.md` |
| 4 | comprehensive review | reviewer | task 1~3 | `_workspace/05_review_report.md` |

task 3a(investment) and 3b(tax savings) ** execution**. task 2(budget) only dependency when whenworkto do number .

**teamKRW between flow:**
- analyst complete → plannerto expense structure·reduction possible item, advisorto investment possible amount·risk nature, strategistto structure·tax department deliver
- planner complete → advisorto investment possible month amount, strategistto savings·investment plan deliver
- advisor ↔ strategist: tax utilization current status 
- reviewer all deliverable cross-verification. 🔴 required revision findings when Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds)

### Phase 3: integration and final deliverable

1. `_workspace/` Verify all files in the directory
2. review reportConfirm that all critical revisions from the review report have been addressed
3. Report the final summary to the user

## task scaleby mode

| user request pattern | execution mode | deploy agent |
|----------------|----------|-------------|
| "financialmanagement comprehensive design" | **Full pipeline** | 5people beforeKRW |
| "budget only " | **budget mode** | analyst + planner + reviewer |
| "investment " | **investment mode** | analyst + advisor + reviewer |
| "tax savings method " | **tax savings mode** | analyst + strategist + reviewer |
| "retirement design please do" | **retirement mode** | analyst + strategist + reviewer |
| " totaldepartment analysisplease do" | **analysis mode** | analyst + reviewer |

**existing file utilization**: totaldepartment data, existing budgettable etc. provide applicable stage case.

## data deliver protocol

| strategy | method | also |
|------|------|------|
| File-based | `_workspace/` | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{}_{agent}_{deliverable}.{extensionspecialist}`

## error handling

| error type | strategy |
|----------|------|
| financial data un-provide | Korean pyeongbalanced data simulation, " data" specify |
| web search failure | general ·tax standard applied, "data limitation" specify |
| investment possible amount 0KRW | secure + debt exchange strategyas beforeexchange |
| agent failure | Retry once -> proceed without that deliverable, note the gap in the review report |
| reviewfrom 🔴 findings | Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds) |

## test scenario

### flow
**Prompt**: "monthgrade 4000,000 KRW personperson financialmanagement overallqualityas . monthtax 700,000 KRW, savings and ."
**expected result**:
- analysis: 4000,000 KRW income versus expense structure However, savingsrate un- 
- budget: 50/30/20 based budgettable, minimum month 800,000 KRW savings goal
- investment: reportspecialist target planquality portfolio, pensionsavings 
- tax savings: annual optimization, pensionsavings tax utilization
- review: figure cross-verification, execution possiblenature confirm

### existing file utilization flow
**Prompt**: " totaldepartment data investment strategy " + totaldepartment file department
**expected result**:
- totaldepartment `_workspace/01_financial_analysis.md` based data utilization
- investment mode: analyst(data organization) + advisor + reviewer deploy

### error flow
**Prompt**: " ?"
**expected result**:
- financial data insufficient → analyst basic question or pyeongbalanced data simulation
- goal people → planner →duringbasis→basis stageby goal proposal
- review report "actual data input when also " specify

## agentby extension skill

| agent | extension skill | also |
|---------|----------|------|
| investment-advisor, tax-strategist | `compound-interest-simulator` | total, asset nature example, retirement design |
| financial-analyst, finance-reviewer | `financial-ratio-analyzer` | financial ratio analysis, casebeforenature However, score |

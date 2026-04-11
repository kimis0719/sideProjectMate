# Personal Finance Harness

itemsperson financialmanagement incomeexpenseanalysis→budgetdesign→investmentstrategy→tax savingsapproach→retirementdesign A harness where an agent team collaborates to produce deliverables.

## structure

```
.claude/
├── agents/
│ ├── financial-analyst.md — financial analysis (incomeexpense identify, financialcasebeforenature diagnosis)
│ ├── budget-planner.md — budget design (categoryby budget, savings goal)
│ ├── investment-advisor.md — investment strategy (assetallocation, portfolio design)
│ ├── tax-strategist.md — tax savings strategy (tax optimization, utilization)
│ └── finance-reviewer.md — cross-verification (analysis↔budget↔investment↔tax savings consistency)
├── skills/
│ ├── personal-finance/
│ │ └── skill.md — Orchestrator (team , workflow, error handling)
│ ├── compound-interest-simulator/
│ │ └── skill.md — simulator (investment-advisor)
│ └── financial-ratio-analyzer/
│ └── skill.md — financial ratio analysisbasis (financial-analyst)
└── CLAUDE.md — file
```

## usage

`/personal-finance` skill , "financial management " specialistannual request.

## deliverable

all deliverable `_workspace/` save:
- `00_input.md` — user input organization
- `01_financial_analysis.md` — incomeexpense analysis + financialcasebeforenature diagnosis
- `02_budget_plan.md` — budget design + savings plan
- `03_investment_strategy.md` — investment strategy + portfolio
- `04_tax_strategy.md` — tax savings approach + retirement design
- `05_review_report.md` — review report

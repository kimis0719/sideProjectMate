---
name: kpi-tree-builder
description: "Methodology for systematically designing KPI trees (metric hierarchy) and defining drill-down structures. Use this skill for 'build a KPI tree', 'metric hierarchy design', 'drill-down structure', 'KPI decomposition', 'performance metrics framework', 'revenue decomposition tree', and other KPI system design tasks. Note: actual database query optimization and real-time monitoring infrastructure construction are outside the scope of this skill."
---

# KPI Tree Builder — KPI Tree Design Methodology

A skill that enhances metric design for the kpi-designer and dashboard-builder.

## Target Agents

- **kpi-designer** — Systematically designs KPI hierarchies
- **dashboard-builder** — Implements drill-down navigation

## KPI Tree Decomposition Methodology

### Multiplicative Decomposition

```
Revenue = Order Count x Average Order Value
       = (Visitors x Conversion Rate) x (Product Price x Items per Order)

Visitors = Organic Traffic + Paid Traffic + Direct Traffic
Conversion Rate = Cart Conversion x Checkout Conversion
```

### Additive Decomposition

```
Total Cost = Personnel + Marketing + Server + Other Operating
Total Revenue = Product A Revenue + Product B Revenue + Service Revenue
```

### Ratio Decomposition

```
Customer Lifetime Value (LTV) = ARPU x Average Subscription Duration
CAC Payback Period = CAC / Monthly ARPU
ROI = (Profit - Investment) / Investment x 100
```

## Domain-Specific KPI Tree Templates

### E-Commerce

```
Revenue
├── GMV (Gross Merchandise Value)
│   ├── Order Count
│   │   ├── Unique Visitors (UV)
│   │   │   ├── Organic Traffic
│   │   │   ├── Paid Traffic (CPC, CPA)
│   │   │   └── Referral Traffic
│   │   └── Purchase Conversion Rate (CVR)
│   │       ├── Cart Conversion Rate
│   │       └── Checkout Completion Rate
│   └── Average Order Value (AOV)
│       ├── Product Unit Price
│       └── Items per Order
├── Commission Rate
└── Cancellation/Return Rate
```

### SaaS

```
ARR (Annual Recurring Revenue)
├── New ARR
│   ├── New Customer Count
│   │   ├── Lead Count
│   │   ├── Lead-to-Trial Conversion
│   │   └── Trial-to-Paid Conversion
│   └── New ARPA (Revenue per Account)
├── Expansion ARR (Upsell/Cross-sell)
│   ├── Expansion Customer Ratio
│   └── Expansion Amount
├── Churned ARR (-)
│   ├── Churned Customer Count
│   └── Churned ARPA
└── NRR (Net Revenue Retention)
    = (Starting ARR + Expansion - Contraction - Churn) / Starting ARR
```

### Marketing

```
ROAS (Return on Ad Spend)
├── Ad Revenue
│   ├── Clicks
│   │   ├── Impressions
│   │   └── CTR (Click-Through Rate)
│   └── Value per Click
│       ├── Conversion Rate
│       └── Value per Conversion
└── Ad Spend
    ├── CPC x Clicks
    └── CPM x Impressions/1000
```

## KPI Definition Standard Form

```markdown
### KPI: [Metric Name]

| Item | Content |
|------|---------|
| Definition | [Clear definition of the metric] |
| Formula | [Calculation formula] |
| Unit | [%, currency, count, people, etc.] |
| Measurement Frequency | [Daily/Weekly/Monthly/Quarterly] |
| Data Source | [Table name or API] |
| Target | [Target value + rationale] |
| Threshold | [Warning: 80%, Critical: 60%] |
| Owner | [Responsible team/individual] |
| Drill-Down | [Sub-metric list] |
| Filters | [Period, region, product, etc.] |
```

## Metric Quality Checklist (SMART-D)

```
S - Specific: Is it clearly defined?
M - Measurable: Can it be measured quantitatively?
A - Actionable: Can decisions be made from this metric?
R - Relevant: Is it connected to business objectives?
T - Timely: Is it refreshed at an appropriate frequency?
D - Drillable: Can it be decomposed for root cause analysis?
```

## Threshold Setting Methods

```
Method 1: Statistics-based
  - Mean +/- 1 sigma: Warning
  - Mean +/- 2 sigma: Critical
  - Based on past 12 months of data

Method 2: Benchmark-based
  - Below 80% of industry average: Warning
  - Below 60% of industry average: Critical

Method 3: Target-based
  - Below 80% of target: Warning
  - Below 60% of target: Critical

Method 4: Trend-based
  - -10% vs previous week: Warning
  - -20% vs previous week: Critical
```

## Drill-Down Design Patterns

```
Level 0: Executive Summary
  > 3-5 key KPIs, trends, anomaly alerts

Level 1: Department Dashboards
  > Key metrics per Marketing/Sales/Operations/CS

Level 2: Detailed Analysis
  > Time series, segment comparisons, cohorts

Level 3: Raw Data
  > Individual transactions, filtering, export
```

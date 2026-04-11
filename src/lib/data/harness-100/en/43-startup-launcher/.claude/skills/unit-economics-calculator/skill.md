---
name: unit-economics-calculator
description: "Methodology for systematically calculating startup unit economics (LTV, CAC, margin, BEP). Use this skill for 'unit economics calculation', 'LTV calculation', 'CAC analysis', 'break-even point', 'per-customer economics', 'unit profitability', and other unit economics analysis tasks. Note: bookkeeping, tax filing, and financial auditing are outside the scope of this skill."
---

# Unit Economics Calculator — Unit Economics Calculation Methodology

A skill that enhances the business-modeler's financial analysis capabilities.

## Target Agents

- **business-modeler** — Calculates unit economics systematically
- **launch-reviewer** — Validates financial assumptions

## Core Metrics

### CAC (Customer Acquisition Cost)
```
CAC = Total Marketing & Sales Spend / New Customers Acquired

Components:
- Advertising spend (paid channels)
- Sales team costs (salary + commission)
- Marketing tool costs
- Content production costs

Blended CAC vs. Channel-specific CAC
```

### LTV (Lifetime Value)
```
Simple: LTV = ARPU x Average Customer Lifespan
Detailed: LTV = ARPU x Gross Margin x (1 / Churn Rate)

For subscription:
  LTV = Monthly ARPU x Gross Margin x (1 / Monthly Churn Rate)

For e-commerce:
  LTV = AOV x Purchase Frequency x Customer Lifespan x Gross Margin
```

### Key Ratios
```
LTV/CAC Ratio:
  < 1x: Unsustainable (losing money per customer)
  1-3x: Improving but risky
  >= 3x: Healthy (industry benchmark)
  > 5x: May be underinvesting in growth

Payback Period:
  = CAC / Monthly Gross Profit per Customer
  Target: <= 12 months (SaaS), <= 6 months (e-commerce)

Gross Margin:
  = (Revenue - COGS) / Revenue x 100
  SaaS target: 70-85%
  E-commerce target: 30-50%
  Marketplace target: 60-80% (of take rate)
```

### Break-Even Point (BEP)
```
BEP (units) = Fixed Costs / (Price - Variable Cost per Unit)
BEP (revenue) = Fixed Costs / Contribution Margin Ratio

Monthly BEP:
  Fixed monthly costs / (ARPU - Variable cost per user)
```

## Scenario Analysis Template

```
| Metric | Conservative | Base | Optimistic |
|--------|-------------|------|-----------|
| Monthly new customers | | | |
| Churn rate | | | |
| ARPU | | | |
| CAC | | | |
| Gross margin | | | |
| LTV | | | |
| LTV/CAC | | | |
| Payback period | | | |
| Monthly burn | | | |
| Runway (months) | | | |
| BEP month | | | |
```

## Industry Benchmarks

| Metric | SaaS | E-Commerce | Marketplace |
|--------|------|-----------|-------------|
| Gross Margin | 70-85% | 30-50% | 60-80% |
| LTV/CAC | >= 3x | >= 3x | >= 3x |
| Payback | <= 12mo | <= 6mo | <= 12mo |
| Churn (monthly) | 3-7% | N/A | 5-10% |
| NRR | > 100% | N/A | N/A |

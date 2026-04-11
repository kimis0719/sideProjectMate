---
name: pricing-calculator
description: "A specialized skill for systematically performing cost estimation, bidding strategy, and price simulation in RFP pricing proposals. Used by the pricing-strategist agent when calculating labor costs, expenses, and profit to determine optimal bid prices. Automatically applied in contexts such as 'cost estimation', 'bid price', 'pricing strategy', 'labor cost calculation', 'FP/MM rates'. However, real-time bidding participation or government procurement system operation are outside the scope of this skill."
---

# Pricing Calculator — RFP Pricing Calculation Tool

A specialized skill that enhances the pricing calculation capabilities of the pricing-strategist agent.

## Target Agent

- **pricing-strategist** — Cost estimation, bid price calculation, price simulation

## Software Project Cost Estimation

### Labor Cost Calculation

```
Labor Cost = Person-Months (MM) x Monthly Rate per Grade

Total MM = Scope Assessment → Function Point or Experience-based
Monthly Rate = Industry standard labor rate table (published annually)
```

| Grade | Typical Monthly Rate Range | Experience Criteria |
|-------|--------------------------|---------------------|
| Senior (Principal) | $8,000-12,000 | 15+ years |
| Advanced | $6,500-9,000 | 10-15 years |
| Intermediate | $5,000-7,000 | 5-10 years |
| Junior | $3,500-5,500 | 1-5 years |

### Cost Structure

```
Total Project Cost = Labor + Direct Expenses + Overhead + Profit + Tax

Labor: MM x Rate
Direct Expenses: Equipment, Software, Travel, Training (10-20% of labor)
Overhead: Labor x Rate (typically 110-120%)
Profit: (Labor + Overhead) x Rate (typically 25%)
Tax: Subtotal x Tax Rate
```

## Bidding Strategy

### Price Evaluation Methods

| Method | Formula | Strategy |
|--------|---------|----------|
| Lowest Price | Score = (Lowest Bid / Your Bid) x Price Weight | Minimize price |
| Qualification Review | Pass/Fail threshold | Stay above minimum |
| Comprehensive | Weighted (Tech + Price) | Optimize balance |

### Optimal Bid Price Simulation

```
Target Score = Technical Score + Price Score
Price Score = f(Your Bid, Estimated Price, Competitors)

Simulation Variables:
- Estimated price range
- Expected competitor bids (3 scenarios)
- Technical score assumptions
- Price evaluation formula specifics
```

### Price Sensitivity Matrix

```markdown
| Bid Rate (% of Est.) | Price Score | Tech Score Needed to Win | Risk |
|----------------------|------------|------------------------|------|
| 85% | High | Low | Margin squeeze |
| 90% | Medium-High | Medium | Balanced |
| 95% | Medium | Medium-High | Safe margin |
| 100% | Low | High | May lose on price |
```

## Cost Validation Checklist

- [ ] All required personnel accounted for in labor calculation?
- [ ] Labor rates match published standards?
- [ ] Direct expenses include all anticipated costs?
- [ ] Overhead rate within acceptable range?
- [ ] Profit margin sustainable?
- [ ] Hidden costs (travel, overtime, warranty) factored in?
- [ ] Price competitive against estimated budget?

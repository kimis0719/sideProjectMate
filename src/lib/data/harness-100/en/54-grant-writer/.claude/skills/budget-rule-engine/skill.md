---
name: budget-rule-engine
description: "A specialized skill providing systematic government grant/funding budget preparation rules and per-category calculation standards. Used by the budget-designer agent when applying per-category ceilings, calculation basis writing methods, and settlement rules during budget preparation. Automatically applied in contexts such as 'budget preparation rules', 'per-category standards', 'budget ceilings', 'settlement guide', 'matching funds'. However, actual accounting processing and tax filing are outside the scope of this skill."
---

# Budget Rule Engine — Grant Budget Preparation Rules Engine

A specialized skill that enhances the budget preparation capabilities of the budget-designer agent.

## Target Agent

- **budget-designer** — Per-category budget calculation, compliance, settlement guide

## Government R&D Standard Budget Category System

### Direct Costs

| Category | Sub-Items | Ceiling Ratio | Calculation Basis |
|---------|-----------|---------------|-------------------|
| Labor | Internal labor, External labor | Within 60% of total (typical) | Labor rate table x Participation rate x Duration |
| Equipment & Materials | Equipment purchase, Reagents/materials, Software | Within 40% of total | Quotation-based |
| Research Activity | Domestic/international travel, Meetings, Supplies | Within 20% of labor | Per-item calculation |
| Research Allowance | PI and researcher allowances | Within 20% of direct costs | Headcount x Unit rate |
| Subcontracting | External institution subcontracting | Within 30% of total | Subcontract agreement (draft) |

### Indirect Costs

| Category | Calculation | Ceiling |
|---------|-----------|---------|
| Indirect Costs | (Direct costs - Subcontracting) x Indirect rate | Per-institution indirect rate (Universities 33%, Companies 17%, etc.) |

## Labor Cost Calculation Standards

### Internal Labor Calculation

```
Monthly Labor Cost = Annual Salary / 12 (or labor rate table unit price)
Project Labor Cost = Monthly Cost x Participation Rate (%) x Duration (months)
```

| Grade | Government Project Standard Rate (Monthly, Reference) | Participation Rate Range |
|-------|------------------------------------------------------|------------------------|
| Principal Investigator | $4,000-6,500 | 10-30% |
| Senior Researcher | $3,200-4,800 | 20-50% |
| Researcher | $2,400-3,600 | 30-100% |
| Research Assistant | $1,600-2,400 | 50-100% |

### External Labor (Student Researchers, etc.)

| Category | Rate | Notes |
|---------|------|-------|
| PhD Candidate | $1,600-2,000/month | Full-time basis |
| MS Candidate | $1,200-1,450/month | Full-time basis |
| Undergraduate Researcher | $650-950/month | Part-time |

## Equipment & Materials Calculation Principles

### Equipment Purchase

1. **Justify necessity**: Reason existing equipment is insufficient
2. **Price basis**: 2+ quotations (for items over $8,000)
3. **Depreciation**: Compare purchase vs. lease (lease-first principle)
4. **Shared use**: Specify shared usage plan for purchased equipment

### Materials

```
Material Cost = Unit Price x Quantity x Usage Frequency

Calculation Basis Example:
- Reagent A: @$40 x 10 units x 3 experiments = $1,200
- Consumable B: @$2.40 x 100 units x 12 months = $2,880
```

## Budget Preparation Checklist

### Compliance Verification

- [ ] Per-category ceiling ratios met
- [ ] Labor rates within standard ranges
- [ ] Matching fund (institutional contribution) ratio satisfied
- [ ] Indirect cost rate within institutional agreement rate
- [ ] Subcontracting within ceiling
- [ ] Quotation basis attached for equipment purchases

### Settlement Preparation

- [ ] Clear calculation basis for all categories?
- [ ] Budget transfer restrictions between categories verified?
- [ ] Carryover eligibility confirmed?
- [ ] Card usage mandatory items confirmed?
- [ ] Supporting document list pre-organized?

## Matching Fund (Institutional Contribution) Guide

| Program Type | Government Funding Ratio | Institutional Share | Cash/In-kind Ratio |
|-------------|------------------------|--------------------|--------------------|
| SME R&D | 75% | 25% | Cash 10%+ |
| Mid-size R&D | 50-65% | 35-50% | Cash 20%+ |
| Large Enterprise R&D | 33-50% | 50-67% | Cash 30%+ |
| Small Business Support | 80-100% | 0-20% | Flexible |
| Startup Support | 70-100% | 0-30% | Flexible |

## Budget Calculation Basis Writing Template

```markdown
### Category: [Category Name]
### Sub-Item: [Sub-Item Name]

| Item | Calculation Details | Amount |
|------|--------------------|----|
| [Item 1] | [Unit Price] x [Quantity] x [Duration/Frequency] | [Amount] |
| [Item 2] | [Detailed calculation basis] | [Amount] |
| **Subtotal** | | **[Total]** |

**Calculation Basis:**
- [Why this item is needed]
- [Basis for quantity/frequency]
- [Basis for unit price (market rate, quotation, standard rate table)]
```

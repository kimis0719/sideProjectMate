---
name: budget-standard-checker
description: "Methodology for verifying government R&D project budget cost category standards and appropriateness. Use this skill for 'budget standard verification', 'cost category allocation', 'government project budget regulations', 'personnel cost standards', 'equipment allocation', 'indirect cost calculation', and other government project budget verification tasks. Note: actual accounting processing, tax calculation, and evidence document issuance are outside the scope of this skill."
---

# Budget Standard Checker — Government R&D Budget Compliance Verification

A skill that enhances budget compliance verification for the budget-planner and submission-reviewer.

## Target Agents

- **budget-planner** — Ensures budget complies with government standards
- **submission-reviewer** — Validates budget appropriateness

## Cost Category Standards

### Personnel Costs
```
Rules:
- Based on government published researcher salary tables
- Effort rate must be realistic (typically 50-100%)
- Project lead typically 30-50% effort
- Cannot exceed actual salary
- Include benefits and insurance in calculation

Verification:
- [ ] Salary grade matches researcher qualifications
- [ ] Effort percentage is reasonable for role
- [ ] Total does not exceed published caps
- [ ] Existing employees vs. new hires clearly distinguished
```

### Equipment
```
Rules:
- Must be directly necessary for the research
- Cannot be general-purpose office equipment
- Must specify exact model and justification
- Equipment over threshold requires multiple quotes
- Depreciation vs. purchase criteria

Verification:
- [ ] Each item justified by technical plan
- [ ] Not available through shared facilities
- [ ] Cost is market-rate (provide quotes)
- [ ] Lifespan exceeds project period considerations
```

### Materials and Supplies
```
Rules:
- Direct materials for R&D only
- Consumables, components, software licenses
- Must be itemized with unit costs
- Bulk purchases require justification

Verification:
- [ ] Each item linked to specific R&D activity
- [ ] Unit costs are reasonable
- [ ] Quantities match technical plan
```

### Outsourcing/Subcontracting
```
Rules:
- Outsourcing typically capped (often 30-50% of total)
- Must justify why in-house is not feasible
- Subcontractor qualifications must be documented
- Cannot outsource core research activities

Verification:
- [ ] Within outsourcing cap
- [ ] Technical justification provided
- [ ] Contractor selection criteria documented
- [ ] Deliverables clearly defined
```

### Travel
```
Rules:
- Must be directly related to research
- Domestic vs. international guidelines
- Per diem rates follow government standards
- Conference attendance justification required

Verification:
- [ ] Each trip linked to project activity
- [ ] Rates follow government per diem
- [ ] International travel additionally justified
```

### Indirect Costs (Overhead)
```
Rules:
- Rate varies by institution type
- Applied to specific cost base (varies by program)
- University vs. company vs. research institute rates differ

Verification:
- [ ] Correct rate applied for institution type
- [ ] Correct cost base used
- [ ] Total does not exceed program ceiling
```

## Budget Proportion Guidelines

```
Typical healthy distribution:
- Personnel: 40-60%
- Equipment: 10-20%
- Materials: 5-15%
- Outsourcing: 10-30%
- Travel: 3-5%
- Overhead: per regulation

Red flags:
- Personnel > 70% (may indicate lack of R&D activity)
- Equipment > 40% (may indicate equipment shopping)
- Outsourcing > 50% (core research should be internal)
- Travel > 10% (not a research activity)
```

## Compliance Checklist

```
[ ] All cost items justified by technical plan
[ ] Government salary standards applied for personnel
[ ] Equipment costs verified against market rates
[ ] Outsourcing within program caps
[ ] Indirect cost rate correct for institution type
[ ] Co-funding ratio meets requirements
[ ] Total within program funding ceiling
[ ] All required evidence documents identified
```

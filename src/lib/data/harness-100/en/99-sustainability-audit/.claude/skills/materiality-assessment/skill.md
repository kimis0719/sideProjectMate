---
name: materiality-assessment
description: "ESG materiality assessment matrix. Referenced by the esg-reporter and improvement-planner agents when evaluating ESG issue materiality and setting priorities. Use for 'materiality assessment', 'importance analysis', or 'Materiality Matrix' requests. Stakeholder surveys and external certification are out of scope."
---

# Materiality Assessment — ESG Materiality Assessment

Enhances the materiality analysis capabilities of the esg-reporter and improvement-planner agents.

## Double Materiality

### Concept

```
Financial Materiality:
  ESG issue -> Impact on corporate value
  "Does this issue affect revenue, costs, or assets?"

Impact Materiality:
  Corporate activity -> Environmental/social impact
  "What is our business's impact on the environment/society?"

Double Materiality = Consider both financial + impact materiality
(CSRD/ESRS requirement)
```

## Materiality Assessment Process

### 5-Step Procedure

```
Step 1: Develop ESG Issue Pool
  - Reference GRI Standards topics
  - SASB industry-specific indicators
  - Competitor/peer benchmarking
  - Media/regulatory trends

Step 2: Identify Stakeholders
  - Internal: Management, employees, board
  - External: Investors, customers, supply chain, communities, regulators

Step 3: Assess Materiality
  - Stakeholder surveys/interviews
  - Expert panel evaluation
  - Data-driven analysis

Step 4: Build Matrix
  - X-axis: Business impact (financial materiality)
  - Y-axis: Stakeholder concern (impact materiality)
  - Plot issues -> Quadrant classification

Step 5: Validation and Approval
  - Management review/approval
  - Board reporting
  - External verification (optional)
```

## Materiality Matrix

```
Stakeholder Concern
High  +---------------+---------------+
      |  Monitor      |  Top Priority |
      |  (Enhance     |  (Strategic   |
      |   dialogue)   |   core)       |
      +---------------+---------------+
      |  Observe      |  Manage       |
      |  (Minimal     |  (Improvement |
      |   oversight)  |   plan)       |
Low   +---------------+---------------+
      Low        Business Impact     High
```

### Quadrant Response Strategies

| Quadrant | Issue Examples | Response |
|----------|-------------|----------|
| Top Priority | Carbon emissions, human rights, governance | Strategic integration, KPIs, reporting |
| Manage | Waste, supply chain | Improvement plans, monitoring |
| Monitor | Biodiversity, information security | Stakeholder dialogue, trend tracking |
| Observe | Certain philanthropic efforts | Minimal oversight |

## Industry-Specific Material Issues Guide

### Manufacturing

| Issue | E/S/G | Materiality | GRI Indicator |
|-------|-------|------------|--------------|
| Carbon Emissions | E | 5/5 | 305-1 through 305-5 |
| Energy Management | E | 4/5 | 302-1 through 302-4 |
| Occupational Safety | S | 5/5 | 403-1 through 403-10 |
| Waste Management | E | 4/5 | 306-1 through 306-5 |
| Supply Chain Management | S | 3/5 | 308, 414 |

### IT/Services

| Issue | E/S/G | Materiality | GRI Indicator |
|-------|-------|------------|--------------|
| Information Security | G | 5/5 | 418 |
| Talent Management | S | 5/5 | 401, 404 |
| Diversity/Inclusion | S | 4/5 | 405 |
| Energy (Data Centers) | E | 4/5 | 302 |
| Digital Ethics | G | 3/5 | - |

### Financial Services

| Issue | E/S/G | Materiality | GRI Indicator |
|-------|-------|------------|--------------|
| ESG Investment/Finance | E/S | 5/5 | FS7, FS8 |
| Ethics/Compliance | G | 5/5 | 205, 206 |
| Information Security | G | 5/5 | 418 |
| Financial Accessibility | S | 4/5 | FS13, FS14 |
| Climate Risk | E | 4/5 | TCFD |

## ESG Reporting Framework Mapping

| Framework | Primary Audience | Mandatory/Voluntary | Characteristics |
|-----------|-----------------|--------------------|----|
| GRI | All stakeholders | Voluntary (de facto standard) | Universal, topic-specific standards |
| SASB | Investors | Voluntary -> ISSB integration | 77 industry standards |
| TCFD | Financial/Investors | Trending mandatory | Climate financial disclosure |
| ISSB (S1/S2) | Investors | Trending mandatory | Global standard consolidation |
| CSRD/ESRS | EU companies | Mandatory | Double materiality, detailed |
| K-ESG | Domestic companies | Voluntary | Government guidelines |

## KPI Setting Guide

### E (Environmental) KPIs

| KPI | Unit | Calculation |
|-----|------|------------|
| Carbon Emissions | tCO2eq | Scope 1+2+3 |
| Carbon Intensity | tCO2eq/Revenue Unit | Emissions/Revenue |
| Renewable Energy Share | % | Renewable/Total Energy |
| Waste Recycling Rate | % | Recycled/Total Waste |
| Water Usage | cubic meters | Direct measurement |

### S (Social) KPIs

| KPI | Unit | Calculation |
|-----|------|------------|
| Occupational Injury Rate | per mille | Injured/Workers x 1000 |
| Diversity Ratio | % | Female Managers/Total Managers |
| Training Hours | Hours/Person | Total Training Hours/Headcount |
| Employee Satisfaction | Score | Survey score |

### G (Governance) KPIs

| KPI | Unit | Calculation |
|-----|------|------------|
| Board Independence | % | Independent Directors/Total Directors |
| Ethics Violations | Count | Via reporting system |
| Information Security Incidents | Count | Security monitoring |
| Compliance | % | Training completion rate |

## Quality Checklist

| Item | Criteria |
|------|----------|
| Double Materiality | Both financial + impact materiality considered |
| Stakeholders | 5+ groups engaged |
| Issue Pool | 15-25 issues per industry |
| Matrix | 4-quadrant placement |
| Framework | GRI + 1 or more additional frameworks linked |
| KPIs | 3+ per E/S/G pillar |

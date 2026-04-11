---
name: ghg-protocol
description: "GHG Protocol detailed guide. Referenced by the environmental-analyst agent when calculating and reporting greenhouse gas emissions. Use for 'GHG Protocol', 'carbon emissions', 'Scope 1/2/3', or 'carbon footprint' requests. Carbon credit trading and CDM project execution are out of scope."
---

# GHG Protocol — Greenhouse Gas Protocol Guide

Enhances the environmental-analyst agent's carbon emission analysis capabilities.

## Scope 1/2/3 Classification System

### Scope 1: Direct Emissions

| Emission Source | Examples | Calculation Method |
|----------------|---------|-------------------|
| Stationary Combustion | Boilers, generators | Fuel consumption x Emission factor |
| Mobile Combustion | Company vehicles | Fuel consumption x Emission factor |
| Process Emissions | Chemical reactions, manufacturing | Process-specific emission factor |
| Fugitive Emissions | Refrigerant leaks, methane | Charge/refill amount x GWP |

### Scope 2: Indirect Emissions (Electricity)

```
Market-based:
  Emissions = Electricity consumption (MWh) x Supplier emission factor

Location-based:
  Emissions = Electricity consumption (MWh) x Grid average emission factor

Example grid emission factor:
  0.4594 tCO2eq/MWh (varies by country and region)
```

### Scope 3: Other Indirect Emissions

| Category | Description | Data Source |
|----------|------------|------------|
| 1. Purchased Goods/Services | Raw materials, services | Supply chain data, industry average |
| 2. Capital Goods | Equipment, buildings | Purchase records, LCA data |
| 3. Fuel/Energy Related | Grid losses, fuel transport | Utility data |
| 4. Upstream Transportation | Raw material transport | Distance x Mode-specific factor |
| 5. Waste | Operational waste | Waste volume x Disposal method factor |
| 6. Business Travel | Air, rail, hotel | Distance/trips x Mode-specific factor |
| 7. Employee Commuting | Daily commute | Headcount x Distance x Mode |
| 8-15. Other | Leased assets, investments, product use, etc. | Various |

## Emission Calculation Formulas

### Basic Formula

```
Emissions (tCO2eq) = Activity Data x Emission Factor x GWP

Key GWP values (AR6, 100-year basis):
  CO2: 1
  CH4: 27.9
  N2O: 273
  HFCs: 4-14,800
  SF6: 25,200
```

### Common Emission Factors

| Fuel | Unit | Emission Factor (kgCO2/unit) |
|------|------|------------------------------|
| Diesel | L | 2.58 |
| Gasoline | L | 2.17 |
| Natural Gas (LNG) | Nm3 | 2.23 |
| LPG | kg | 3.00 |
| Electricity | kWh | Varies by grid (see regional factors) |

### Business Travel Emission Factors

| Transport Mode | Emission Factor (kgCO2/person-km) |
|---------------|----------------------------------|
| Domestic Flight | 0.255 |
| International Flight (Economy) | 0.171 |
| High-Speed Rail | 0.012 |
| Personal Vehicle | 0.210 |
| City Bus | 0.027 |

## Reporting Framework Alignment

### Major Frameworks

| Framework | Purpose | GHG-Related Indicators |
|-----------|---------|----------------------|
| GRI 305 | General reporting | 305-1 through 305-5 (emissions by scope) |
| TCFD | Climate financial disclosure | Strategy, risk, targets |
| SBTi | Reduction targets | 1.5C / 2C pathways |
| CDP | Investor disclosure | All-scope emissions + strategy |
| ISSB S2 | Financial disclosure | Scope 1/2/3 + risks |

### Reduction Target Setting (SBTi)

```
Target types:
- Absolute reduction: Reduce emissions vs base year (e.g., 42% reduction by 2030)
- Intensity reduction: Reduce per unit of revenue/production (e.g., tCO2/revenue unit)

1.5C pathway: 4.2% annual reduction
2C pathway: 2.5% annual reduction

Base year: Select from most recent 2 years (ensure data completeness)
```

## Data Quality Ratings

| Rating | Description | Example |
|--------|------------|---------|
| Grade 1 | Measured data | Direct instrument measurement |
| Grade 2 | Primary activity data + certified emission factors | Fuel purchase records x National factors |
| Grade 3 | Secondary data, industry averages | Revenue-based estimates |
| Grade 4 | Estimates/assumptions | Similar industry average applied |

## Reporting Checklist

| Item | Criteria |
|------|----------|
| Scope Coverage | Scope 1, 2 required + Scope 3 key categories |
| Base Year | Specified + Recalculation policy |
| Emission Factors | Sources cited |
| Data Quality | Ratings indicated |
| Organizational Boundary | Equity/control approach specified |
| Verification | Third-party verification status/plan |

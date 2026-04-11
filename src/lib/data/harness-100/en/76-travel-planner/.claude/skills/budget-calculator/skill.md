---
name: budget-calculator
description: "A budget calculator that itemizes travel costs and presents savings strategies. The 'budget-manager' agent must use this skill's cost reference tables, budget allocation formulas, and savings tips when calculating travel expenses and allocating budgets. Used for 'travel budget calculation', 'cost comparison', 'savings tips', etc. Itinerary design and local information are outside this skill's scope."
---

# Budget Calculator — Travel Budget Calculator

Itemizes travel costs and compares budget scenarios by spending level.

## Budget Allocation Formula

### Standard Allocation Ratios

```
Total Budget Allocation:
  Flights: 25-35%
  Accommodation: 25-30%
  Meals: 15-25%
  Local Transport: 5-10%
  Sightseeing/Admission: 5-10%
  Shopping/Other: 5-10%
  Reserve: 5-10%
```

### Adjustments by Travel Type

| Type | Flights | Accommodation | Meals | Sightseeing | Other |
|------|---------|---------------|-------|-------------|-------|
| Backpacking | 35% | 15% | 20% | 10% | 20% |
| General Tourism | 30% | 25% | 20% | 10% | 15% |
| Luxury | 25% | 35% | 20% | 10% | 10% |
| Food Tourism | 25% | 20% | 35% | 5% | 15% |
| Family Travel | 30% | 25% | 20% | 15% | 10% |

## Daily Cost Reference by Major City

### Asia

| City | Budget (per person/day) | Standard | Luxury | Currency |
|------|------------------------|----------|--------|----------|
| Tokyo | $60 | $120 | $280 | JPY |
| Osaka | $55 | $100 | $240 | JPY |
| Bangkok | $25 | $55 | $160 | THB |
| Hanoi | $20 | $40 | $120 | VND |
| Singapore | $65 | $120 | $320 | SGD |
| Taipei | $30 | $65 | $160 | TWD |

### Europe

| City | Budget (per person/day) | Standard | Luxury | Currency |
|------|------------------------|----------|--------|----------|
| Paris | $80 | $160 | $400 | EUR |
| London | $95 | $175 | $440 | GBP |
| Rome | $65 | $120 | $320 | EUR |
| Barcelona | $65 | $120 | $320 | EUR |
| Prague | $40 | $80 | $200 | CZK |

### Americas & Oceania

| City | Budget (per person/day) | Standard | Luxury | Currency |
|------|------------------------|----------|--------|----------|
| New York | $120 | $200 | $480 | USD |
| Los Angeles | $95 | $160 | $400 | USD |
| Sydney | $95 | $160 | $400 | AUD |
| Hawaii | $95 | $175 | $440 | USD |

## Itemized Cost Calculation

### Seasonal Airfare Ranges (International)

| Route | Off-Season | Shoulder | Peak | Ultra-Peak |
|-------|-----------|----------|------|-----------|
| Domestic-Japan | $120-200 | $200-320 | $320-480 | $480-800 |
| Domestic-SE Asia | $160-280 | $280-400 | $400-640 | $640-960 |
| Domestic-Europe | $480-720 | $720-1040 | $1040-1440 | $1440-2000 |
| Domestic-USA | $560-800 | $800-1120 | $1120-1600 | $1600-2400 |

### Accommodation Price Ranges by Type

| Type | Price Range (per night) | Best For | Notes |
|------|----------------------|----------|-------|
| Hostel (dorm) | $8-32 | Solo backpacker | Shared facilities |
| Guesthouse | $24-64 | 1-2 persons | Local experience |
| Business Hotel | $64-120 | Business/Couples | Amenities |
| Airbnb | $40-160 | Groups/Long-term | Self-catering |
| 4-Star Hotel | $120-240 | Family/Couples | Service |
| 5-Star Resort | $240-800+ | Luxury | Full service |

## Savings Strategies

### Flight Savings

```
1. Book 2-3 months ahead (lowest price window)
2. Depart Tue-Thu / Return Sun-Tue
3. Use layover flights (20-40% cheaper than direct)
4. LCC + carry-on only (short trips)
5. Use airline miles (accumulated over time)
```

### Accommodation Savings

```
1. Airbnb long-term discounts (7+ days: 10-20% off)
2. Off-season weekday bookings
3. Outside city center (calculate transport cost tradeoff)
4. Hostel private room (50% cheaper than hotel)
5. Hotel comparison site price guarantees
```

### Meal Savings

```
1. Lunch set menus (30-50% cheaper than dinner)
2. Use convenience stores/supermarkets (breakfast/snacks)
3. Local restaurants (40% cheaper than tourist area)
4. Accommodation with breakfast included
5. Eat big meals in cheaper areas
```

## Budget Plan Output Format

```markdown
## Travel Budget Plan

**Destination**: [City] | **Duration**: [X nights Y days] | **Party**: [N people]

| Item | Unit Cost | Quantity | Subtotal | Notes |
|------|----------|---------|----------|-------|
| Flights | $X | 2 tickets | $X | Direct/Layover |
| Accommodation | $X/night | X nights | $X | Hotel/Airbnb |
| Meals | $X/day | X days | $X | 3 meals+snacks |
| Transport | $X/day | X days | $X | Pass/Taxi |
| Sightseeing | $X | X items | $X | Admission |
| Shopping | $X | - | $X | Estimated |
| Reserve | - | - | $X | 10% of total |
| **Total** | | | **$X** | |
| Per Person | | | **$X** | |
```

## Notes

- City costs vary by season and exchange rates
- Detailed city-specific costs: see `references/city-cost-guide.md`

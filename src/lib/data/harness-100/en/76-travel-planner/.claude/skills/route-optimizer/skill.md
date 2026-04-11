---
name: route-optimizer
description: "A route optimization tool that optimizes travel routing and minimizes travel time and cost. The 'itinerary-designer' agent must use this skill's route optimization algorithms, transport comparison matrices, and time block allocation rules when designing daily routes. Used for 'route optimization', 'travel routes', 'transport comparison', etc. Budget calculation and local information are outside this skill's scope."
---

# Route Optimizer — Travel Route Optimization Tool

Daily visit route optimization, transport selection, and time block allocation strategies.

## Route Optimization Principles

### 5 Core Principles

```
1. Clustering: Group nearby attractions on the same day
2. Circular routes: Accommodation→Sightseeing→Accommodation loop (no zigzagging)
3. Time alignment: Reflect operating hours/day-of-week constraints
4. Peak avoidance: Schedule popular attractions early morning or evening
5. Buffer time: Recommend daily transit time under 2 hours
```

### Route Design Algorithm

```
Step 1: Map coordinates for all visit points
Step 2: Cluster by area (within 15-min walk = same cluster)
Step 3: Calculate visit duration per cluster
Step 4: Assign clusters to days (total 8-10 hours per day)
Step 5: Select optimal transport between clusters
Step 6: Arrange time-based schedule (reflecting operating hours)
Step 7: Insert buffer time and meal breaks
```

## Time Block Allocation Template

### General Tourism Schedule (10-hour block)

```
08:00-09:00  Breakfast + transit
09:00-11:30  Morning sightseeing (key attractions, popular spots)
11:30-13:00  Lunch + leisure
13:00-15:30  Afternoon sightseeing 1 (museums, experiences)
15:30-16:00  Snack/cafe break
16:00-17:30  Afternoon sightseeing 2 (street exploration, shopping)
17:30-18:30  Transit + wrap-up
18:30-20:00  Dinner
20:00-21:30  Evening activities (optional: night views, bar)
```

### Time Allocation by Travel Type

| Type | Sightseeing | Meals | Transit | Leisure | Shopping |
|------|------------|-------|---------|---------|----------|
| Adventure | 60% | 15% | 15% | 5% | 5% |
| Culinary | 30% | 40% | 15% | 10% | 5% |
| Relaxation | 40% | 20% | 10% | 25% | 5% |
| Shopping | 25% | 15% | 15% | 10% | 35% |
| Cultural | 50% | 15% | 15% | 15% | 5% |

## Transport Comparison Matrix

### Intra-City Travel

| Transport | Speed | Cost | Convenience | Best For |
|-----------|-------|------|-------------|----------|
| Walking | 4km/h | Free | High | Under 1km, street exploration |
| Metro/Rail | 30km/h | Low | High | 3km+, punctuality needed |
| Bus | 15-25km/h | Low | Medium | Segments not on metro |
| Taxi/Rideshare | 25-40km/h | Med-High | High | 3+ people, with luggage |
| Bike/Scooter | 12km/h | Low | Medium | Flat terrain, good weather |

### Inter-City Travel

| Transport | Suitable Distance | Cost | Time | Notes |
|-----------|-------------------|------|------|-------|
| High-speed Rail | 100-500km | Med-High | 1-3hrs | City-to-city, punctual |
| Intercity Bus | 50-300km | Low-Med | 2-5hrs | Economical |
| Domestic Flight | 300km+ | Med-High | 1-2hrs | Islands, long distances |
| Rental Car | Flexible | Medium | Flexible | Suburbs, rural areas |
| Ferry | Maritime | Medium | 2-12hrs | Island travel |

## City-Specific Transport Tips

### Tokyo

```
Pass: Suica/Pasmo IC card (rechargeable)
Recommended Pass: Tokyo Metro 24-hour ticket (600 yen)
Key: JR Yamanote Line + Metro combination
Taxi base fare: 500 yen (expensive, last resort)
Tip: Avoid rush hour subway (7:30-9:30)
```

### Paris

```
Pass: Navigo Easy (rechargeable)
Recommended Pass: Paris Visite or individual t+ tickets
Key: Metro 16 lines + RER
Taxi base fare: 7.30 euros
Tip: Check zones, Zones 1-2 covered by metro
```

### Bangkok

```
Pass: Rabbit Card (BTS), separate MRT card
Recommended: Grab app essential
Key: BTS (Skytrain) + MRT (Subway)
Taxi base fare: 35 baht (insist on meter)
Tip: Heavy traffic, use river boats (Chao Phraya)
```

## Itinerary Output Format

```markdown
### Day X — [Date] ([Day]) — [Theme]

| Time | Activity | Location | Transit | Notes |
|------|----------|----------|---------|-------|
| 09:00 | Sightseeing | [Place] | 5 min walk | Admission $X |
| 11:00 | Transit | → [Next place] | 20 min metro | Line X |
| 11:30 | Sightseeing | [Place] | - | Reservation needed |
| 13:00 | Lunch | [Restaurant] | 3 min walk | Budget $X |

**Daily transit summary**: Total X trips, X km, approx. X hours
**Daily budget**: Transport $X + Admission $X + Meals $X = Total $X
```

## Notes

- Based on Google Maps and city transit authority information
- Detailed city guides: see `references/city-transport-guide.md`

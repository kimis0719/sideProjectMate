---
name: sla-impact-calculator
description: "Calculation models and business impact matrices for quantitatively assessing incident impact based on SLA/SLO. Use this skill for 'SLA impact', 'SLO violation', 'impact assessment', 'revenue loss estimation', 'error budget', 'availability calculation', 'incident cost assessment', and other tasks quantifying the business impact of incidents. Enhances the impact assessment capabilities of impact-assessor. Note: incident cause analysis and remediation planning are outside the scope of this skill."
---

# SLA Impact Calculator — SLA/SLO-based Impact Assessment Guide

A framework for quantitatively measuring and reporting the business impact of incidents.

## SLA/SLO/SLI Framework

```
SLI (Service Level Indicator): Measurement metric
  e.g.: Request success rate = Successful requests / Total requests

SLO (Service Level Objective): Internal target
  e.g.: Request success rate >= 99.95% (30-day basis)

SLA (Service Level Agreement): External contract
  e.g.: Availability < 99.9% -> 10% credit refund on monthly fee
```

## Allowed Downtime by Availability Level

| Availability | Annual Downtime | Monthly | Weekly | Daily |
|-------------|----------------|---------|--------|-------|
| 99% | 3d 15h | 7h 18m | 1h 41m | 14m 24s |
| 99.5% | 1d 19h | 3h 39m | 50m 24s | 7m 12s |
| 99.9% | 8h 46m | 43m 50s | 10m 5s | 1m 26s |
| 99.95% | 4h 23m | 21m 55s | 5m 2s | 43s |
| 99.99% | 52m 36s | 4m 23s | 1m | 8.6s |
| 99.999% | 5m 16s | 26s | 6s | 0.86s |

## Error Budget Consumption Calculation

```
Monthly error budget = (1 - SLO) x 30 days x 24 hours x 60 minutes

Example: SLO = 99.95%
Error budget = 0.0005 x 30 x 24 x 60 = 21.6 minutes/month

When a 30-minute incident occurs:
+-- Budget exceeded: 30 min - 21.6 min = 8.4 min over
+-- Consumption rate: 30 / 21.6 = 138.9% (exceeded!)
+-- Remaining budget: -8.4 min (no additional incidents allowed for the rest of the period)
```

## Business Impact Matrix

### Revenue Loss Estimation

```
Per-minute revenue loss = Daily average revenue / (24 x 60)

Example: Daily average revenue = $100,000
Per-minute revenue loss = 100,000 / 1,440 = $69.44/min

30-minute incident:
+-- Direct loss: $69.44 x 30 = $2,083
+-- Peak hour adjustment: x 2.5 (if during peak hours)
|   -> $5,208
+-- Churn estimate (5% of affected customers churn):
|   Affected customers x 5% x Customer Lifetime Value (CLV)
+-- Total estimated loss: Direct + Churn + Recovery costs
```

### Impact Severity Levels

| Level | Criteria | Example | Escalation |
|-------|---------|---------|-----------|
| **SEV-1** (Critical) | Core service complete outage | Payments down, entire site down | Immediate -> C-level |
| **SEV-2** (Major) | Core feature partial outage | Specific payment method unavailable | Within 30 min -> VP |
| **SEV-3** (Minor) | Non-core feature outage | Recommendation system malfunction | Within 1 hour -> Manager |
| **SEV-4** (Low) | User experience degradation | Slow page loading | Next business day |

### User Impact Scope Calculation

```
Estimating affected users:
1. Normal traffic for the incident timeframe: DAU x (incident_hours/24)
2. Based on error logs: Unique users receiving 5xx responses
3. Feature usage rate: DAU percentage for the affected feature

Example:
DAU = 100,000
Incident time = 14:00-14:30 (peak)
Time window ratio = 8% (peak hour adjustment)
Affected users = 100,000 x 0.08 x (30/60) = 4,000
```

## Financial Impact of SLA Violations

```
SLA penalty calculation:

Basic structure:
+-- Tier 1: Availability < SLA by 0.1%p -> 10% credit on monthly fee
+-- Tier 2: Availability < SLA by 1.0%p -> 25% credit on monthly fee
+-- Tier 3: Availability < SLA by 5.0%p -> 50% credit on monthly fee

Example: Monthly contract $10,000, SLA 99.9%, actual 99.5%
Shortfall: 0.4%p -> Tier 1
Credit: $10,000 x 10% = $1,000
```

## Composite SLA Calculation

```
Serial system: SLA_total = SLA_A x SLA_B x SLA_C
  e.g.: 99.9% x 99.9% x 99.9% = 99.7% (0.3% = 2h 11m/month)

Parallel system: SLA_total = 1 - (1-SLA_A) x (1-SLA_B)
  e.g.: 1 - (0.001 x 0.001) = 99.9999%

Real system:
API Gateway(99.99%) -> [App Server(99.95%) || App Server(99.95%)] -> DB(99.99%)
= 99.99% x (1-(0.0005)^2) x 99.99%
= 99.99% x 99.99975% x 99.99%
~ 99.97%
```

## Report Template

```markdown
# Incident Impact Assessment Report

## Summary
| Item | Value |
|------|-------|
| Incident Time | YYYY-MM-DD HH:MM ~ HH:MM (N min) |
| Severity Level | SEV-N |
| Affected Users | Approx. N |
| SLA Violation | Yes/No |
| Error Budget Consumption | N% |
| Estimated Revenue Loss | $N |

## Detailed Assessment
### SLI/SLO Impact
### User Impact
### Financial Impact
### Reputation Impact

## Recovery Cost
- Engineering hours: N person-hours
- Infrastructure cost: $N
- External vendor cost: $N
```

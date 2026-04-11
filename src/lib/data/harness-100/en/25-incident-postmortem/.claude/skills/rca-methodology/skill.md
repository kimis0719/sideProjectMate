---
name: rca-methodology
description: "Detailed guide for Root Cause Analysis (RCA) methodologies. Structured RCA techniques including 5 Whys, Fishbone diagrams, Fault Tree Analysis, change analysis, and a cognitive bias prevention checklist. Use this skill for 'root cause analysis', 'RCA', '5 Whys', 'fishbone', 'Fault Tree', 'cause analysis methodology', 'change analysis', and other incident cause analysis tasks. Enhances the analysis capabilities of root-cause-investigator. Note: timeline reconstruction and remediation planning are outside the scope of this skill."
---

# RCA Methodology — Root Cause Analysis Methodology Guide

A collection of structured analysis techniques for systematically tracing incident root causes.

## 1. 5 Whys Technique

### Procedure
```
Problem: Payment service was down for 30 minutes.

Why 1: Why did the payment service go down?
-> The DB connection pool was exhausted.

Why 2: Why was the connection pool exhausted?
-> Slow queries held connections for extended periods.

Why 3: Why did slow queries occur?
-> A full table scan was performed without an index.

Why 4: Why was there no index?
-> The index addition was missed in the migration during the new feature deployment.

Why 5: Why was the missing index not detected?
-> Query performance verification was not included in the deployment pipeline.

Root Cause: Absence of query performance verification step in the deployment pipeline
```

### 5 Whys Pitfalls

| Pitfall | Description | Prevention |
|---------|-------------|-----------|
| Stopping too early | Concluding at step 2-3 | Verify: "Would fixing this prevent recurrence?" |
| Leading to blame | Ending with "who made the mistake" | Focus on system/process causes |
| Single path only | Missing compound causes | Review branches at each step |
| Speculation-based answers | Hypotheses without evidence | Verify with logs/metrics |

## 2. Fishbone Diagram (Ishikawa)

```
                    +- People -------- Insufficient deployer training
                    |                  Code review skipped
                    |
                    +- Process -------- Deployment checklist not followed
                    |                   Performance testing not conducted
                    |
Payment Svc Down <--+- Technology ---- Missing index
                    |                   Connection pool size insufficient
                    |
                    +- Environment ---- Production data scale not reflected
                    |                   Staging environment mismatch
                    |
                    +- Monitoring ----- Slow query alert not configured
                                        DB metrics dashboard absent
```

### 6M Categories (Software Application)

| Traditional 6M | Software Application | Investigation Items |
|----------------|---------------------|-------------------|
| Man | People/Team | Training, communication, on-call structure |
| Method | Process | Deployment procedures, change management, approval flows |
| Machine | Technology/Infrastructure | Servers, DB, network, code |
| Material | Data/Input | Input data, external API responses |
| Measurement | Monitoring | Alerts, metrics, logs, tracing |
| Environment | Environment | Configuration, env vars, dependent services |

## 3. Fault Tree Analysis (FTA)

```
                    Payment Service Outage (Top Event)
                          |
                    +-----| OR |-----+
                    |                |
              DB Failure        Application Failure
                |                    |
          +-----| OR |-----+  +---| AND |---+
          |                |  |             |
    Pool Exhaustion   Disk Full  Slow Queries  High Traffic
          |                        |
    +-----| AND |-----+     +-----| OR |-----+
    |                |     |                |
 Missing Index  Large Data  New Code Deploy  Schema Change
```

**Probability Calculation:**
```
OR gate:  P(A OR B)  = 1 - (1-P(A)) x (1-P(B))
AND gate: P(A AND B) = P(A) x P(B)

Example: P(slow query)=0.3, P(high traffic)=0.2
    P(app failure) = 0.3 x 0.2 = 0.06 (6%)
```

## 4. Change Analysis

```markdown
Investigate changes before and after the incident:

| Change Time | Change Content | Changed By | Impact Scope | Incident Correlation |
|------------|---------------|-----------|-------------|---------------------|
| T-2h | Payment API v2.3 deploy | Dev team | Payment service | HIGH |
| T-1h | Redis config change | Ops team | Cache service | MEDIUM |
| T-30m | CDN cache purge | Marketing | Frontend | LOW |

Correlation criteria:
1. Temporal proximity: Change time <-> Incident time
2. Scope match: Change scope <-> Incident impact scope
3. Rollback effect: Whether rolling back the change resolves the incident
```

## Cognitive Bias Prevention Checklist

| Bias | Description | Prevention |
|------|-------------|-----------|
| **Confirmation bias** | Collecting only evidence matching the first hypothesis | Actively search for counterexamples |
| **Hindsight bias** | "Obviously this was the cause" | Judge based only on information available at the time |
| **Availability bias** | Equating with recently experienced similar incidents | Enforce evidence-based analysis |
| **Fundamental attribution error** | Attributing to human error | Prioritize system/process causes |
| **Anchoring** | Fixating on initial report content | Analyze independently from multiple perspectives |

## RCA Technique Selection Guide

| Situation | Recommended Technique | Reason |
|-----------|----------------------|--------|
| Simple incident, quick analysis needed | 5 Whys | Lightweight, can be done immediately |
| Suspected compound causes | Fishbone | Multi-dimensional cause exploration |
| Safety-related severe incidents | FTA | Quantitative, systematic |
| Post-deployment incidents | Change Analysis | Narrow down cause candidates |
| All cases | 5 Whys + Change Analysis combined | Fast yet systematic |

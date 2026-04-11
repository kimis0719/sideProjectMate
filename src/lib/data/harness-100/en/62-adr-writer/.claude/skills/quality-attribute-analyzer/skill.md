---
name: quality-attribute-analyzer
description: "A specialized skill for systematically analyzing quality attributes in architecture decisions and quantifying tradeoffs. Used by the tradeoff-evaluator agent when evaluating tradeoffs between quality attributes such as performance, scalability, and security. Automatically applied in contexts involving 'quality attributes,' 'QA analysis,' '-ility,' 'performance requirements,' 'scalability,' 'security,' or 'CAP theorem.' Note: actual performance test execution and security audits are outside the scope of this skill."
---

# Quality Attribute Analyzer — Quality Attribute Analysis Tool

A specialized skill that enhances the tradeoff-evaluator agent's quality attribute analysis capabilities.

## Target Agent

- **tradeoff-evaluator** — Quality attribute weighted evaluation, risk-reward analysis

## Core Quality Attribute (-ility) Dictionary

### Runtime Quality Attributes

| Attribute | Definition | Measurement Metrics | Typical Targets |
|-----------|-----------|---------------------|-----------------|
| **Performance** | Response time, throughput | p50/p99 latency, TPS | p99 < 200ms |
| **Scalability** | Ability to handle increased load | Linear scaling capability | Linear at 10x load |
| **Availability** | System uptime | Uptime %, MTBF | 99.9% (Three 9s) |
| **Reliability** | Error-free operation | Failure rate, MTTR | MTTR < 30 min |
| **Security** | Protection from threats | Vulnerability count, breach incidents | OWASP Top 10 coverage |

### Development/Operations Quality Attributes

| Attribute | Definition | Measurement Metrics |
|-----------|-----------|---------------------|
| **Maintainability** | Ease of modification | Code complexity, change lead time |
| **Testability** | Ease of writing tests | Coverage, test execution time |
| **Deployability** | Deployment frequency and safety | Deployment frequency, rollback time |
| **Observability** | System state visibility | Logs, metrics, tracing |

## Quality Attribute Tradeoff Matrix

### Common Tradeoff Relationships

| Attribute A (up) | Attribute B (down) | Reason |
|-------------------|-------------------|--------|
| Performance | Maintainability | Optimized code becomes more complex |
| Security | Performance/Usability | Authentication/encryption overhead |
| Scalability | Consistency | CAP theorem |
| Availability | Consistency | CAP theorem |
| Flexibility | Performance | Abstraction layer overhead |

### CAP Theorem Decision Making

```
In distributed systems, only 2 of 3 can be guaranteed:
- Consistency
- Availability
- Partition tolerance

Practical choices:
+----------+----------+----------+
|    CP    |    AP    |    CA    |
| Consist. | Avail. + | Consist. |
| + Part.  | Part.    | + Avail. |
+----------+----------+----------+
| HBase    | Cassandra| Trad.    |
| MongoDB  | DynamoDB | RDBMS    |
| Redis    | CouchDB  | (single) |
+----------+----------+----------+
```

## Weighted Evaluation Matrix (Weighted Scoring)

### Evaluation Procedure

```
1. Set weights per quality attribute (totaling 100%)
2. Score each alternative 1-5 per attribute
3. Weighted score = Weight x Score
4. Rank alternatives by total score
```

### Template

```markdown
| Quality Attribute | Weight | Alt A | Wtd A | Alt B | Wtd B | Alt C | Wtd C |
|-------------------|--------|-------|-------|-------|-------|-------|-------|
| Performance | 25% | 4 | 1.00 | 3 | 0.75 | 5 | 1.25 |
| Scalability | 20% | 5 | 1.00 | 4 | 0.80 | 3 | 0.60 |
| Security | 20% | 3 | 0.60 | 4 | 0.80 | 4 | 0.80 |
| Maintainability | 15% | 2 | 0.30 | 4 | 0.60 | 3 | 0.45 |
| Cost | 10% | 3 | 0.30 | 5 | 0.50 | 2 | 0.20 |
| Learning Curve | 10% | 4 | 0.40 | 3 | 0.30 | 2 | 0.20 |
| **Total** | **100%** | | **3.60** | | **3.75** | | **3.50** |
```

### Weight Determination Guidelines

| Project Type | Performance | Scalability | Security | Maintainability | Cost |
|-------------|-------------|-------------|----------|-----------------|------|
| Startup MVP | 10% | 15% | 10% | 25% | 25% |
| Fintech | 20% | 15% | 30% | 15% | 10% |
| Social Platform | 25% | 30% | 10% | 15% | 10% |
| Enterprise Internal System | 10% | 10% | 20% | 25% | 25% |

## Simplified ATAM (Architecture Tradeoff Analysis Method)

### 6-Step Analysis

```
1. Identify Architecture Drivers
   -> Core business goals + quality attribute scenarios

2. Create Utility Tree
   -> Quality attributes -> Sub-items -> Scenarios -> Priority (H/M/L)

3. Analyze Architecture Approaches
   -> Impact of each approach on scenarios

4. Identify Sensitivity Points / Tradeoffs
   -> Which decisions are sensitive to which attributes

5. Classify Risks / Non-risks
   -> Resolved tradeoffs vs. unresolved risks

6. Compile Results
   -> List of key tradeoffs to reflect in the ADR
```

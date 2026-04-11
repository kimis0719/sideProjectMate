---
name: madr-template-engine
description: "A specialized skill for structuring ADRs in MADR (Markdown Any Decision Record) standard format and systematizing status management. Used by the adr-author and impact-tracker agents when writing standard-format ADR documents and tracking decision history. Automatically applied in contexts involving 'MADR format,' 'ADR template,' 'decision status,' 'ADR numbering system,' or 'decision history.' Note: Git commit hook setup and CI/CD pipeline construction are outside the scope of this skill."
---

# MADR Template Engine — ADR Standard Format Tool

A specialized skill that enhances the ADR documentation capabilities of the adr-author and impact-tracker agents.

## Target Agents

- **adr-author** — MADR format ADR document writing
- **impact-tracker** — Inter-ADR dependency tracking, status management

## MADR Standard Template

```markdown
# ADR-{NNN}: {Decision Title}

## Status

{Proposed | Accepted | Deprecated | Superseded by ADR-XXX}

## Date

{YYYY-MM-DD}

## Context

{Background, problem situation, and constraints that led to this decision}

## Decision Drivers

* {Driver 1: e.g., Response time must be under 200ms}
* {Driver 2: e.g., Learning curve for a team of 5}
* {Driver 3: e.g., Monthly budget constraint of $X}

## Considered Alternatives

### Alternative 1: {Name}

{Description}

* Pro: {Benefit, because ...}
* Pro: {Benefit, because ...}
* Con: {Drawback, because ...}

### Alternative 2: {Name}

{Description}

* Pro: {Benefit, because ...}
* Con: {Drawback, because ...}
* Con: {Drawback, because ...}

### Alternative 3: {Name}

{Description — compare at least 3 alternatives}

## Decision

We choose Alternative {N}: {Name}.

### Selection Rationale

{Specific reasons for choosing this alternative}

### Rejection Rationale

* Alternative {X} was rejected because: {Reason}
* Alternative {Y} was rejected because: {Reason}

## Consequences

### Positive Impact

* {Expected positive outcome}

### Negative Impact

* {Tradeoff that must be accepted}

### Follow-up Actions

* [ ] {Required follow-up task 1}
* [ ] {Required follow-up task 2}

## Related ADRs

* ADR-{XXX}: {Related decision}
* ADR-{YYY}: {Decision affected by this one}
```

## ADR Status Management

### Status Transition Diagram

```
[Proposed] -> [Accepted] -> [Deprecated]
                    |
              [Superseded by ADR-XXX]
```

| Status | Meaning | Condition |
|--------|---------|-----------|
| Proposed | Under review | Immediately after writing |
| Accepted | Adopted | Stakeholder consensus |
| Deprecated | No longer valid | Premises changed |
| Superseded | Replaced by new ADR | Alternative re-evaluation |

## ADR Numbering System

### Numbering Rules

```
ADR-{Sequence}: {Category Code}-{Decision Title}

Category Codes:
  ARCH - Architecture patterns
  DATA - Data storage/processing
  INFRA - Infrastructure/deployment
  SEC - Security
  API - API design
  UI - Frontend
  PROC - Process/methodology
```

### ADR Directory Structure

```
docs/adr/
├── 0001-arch-monolith-vs-microservice.md
├── 0002-data-postgresql-selection.md
├── 0003-infra-kubernetes-adoption.md
├── 0004-api-rest-vs-graphql.md
├── index.md  <- ADR list and status dashboard
└── template.md
```

## ADR Writing Quality Checklist

### Required Elements

- [ ] Does the context sufficiently explain the background?
- [ ] Are the decision drivers clear?
- [ ] Were at least 3 alternatives compared?
- [ ] Are the pros and cons of each alternative specific?
- [ ] Is the selection rationale logical?
- [ ] Are rejection reasons explicitly stated?
- [ ] Are tradeoffs honestly described?
- [ ] Are follow-up actions specific?

### Common Mistakes

| Mistake | Improvement |
|---------|-------------|
| Decision stated without context | Write "why was this decision needed" first |
| Only one alternative described | Always document rejected alternatives too |
| Only pros listed | Honestly record cons and tradeoffs |
| Too long or too short | 1-3 pages recommended |
| Never updated | Always update when status transitions occur |

## ADR Dependency Graph (for impact-tracker)

```markdown
### ADR Dependency Map

ADR-001 (Microservices)
  ├── ADR-002 (Inter-service communication: gRPC)
  ├── ADR-003 (Service discovery: Consul)
  ├── ADR-004 (Distributed tracing: Jaeger)
  └── ADR-005 (API Gateway: Kong)
       └── ADR-006 (Authentication: OAuth2 + JWT)

Impact Analysis:
If ADR-001 is Deprecated -> ADR-002 through ADR-006 all require re-review
```

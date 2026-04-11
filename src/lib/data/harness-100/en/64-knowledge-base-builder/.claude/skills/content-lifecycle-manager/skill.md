---
name: content-lifecycle-manager
description: "A specialized skill for systematizing knowledge base content lifecycle management and quality governance. Used by the maintenance-planner and wiki-builder agents when managing content update cycles, ownership, and quality scores. Automatically applied in contexts involving 'content lifecycle,' 'governance,' 'update cycle,' 'document quality,' or 'knowledge management process.' Note: CMS server operations and automation script deployment are outside the scope of this skill."
---

# Content Lifecycle Manager — Content Lifecycle Management Tool

A specialized skill that enhances the content management capabilities of the maintenance-planner and wiki-builder agents.

## Target Agents

- **maintenance-planner** — Governance, update cycles, quality management
- **wiki-builder** — Including lifecycle metadata during document creation

## 5-Stage Content Lifecycle

```
[Plan] -> [Create] -> [Review] -> [Publish] -> [Maintain]
  |                                                |
  +------------ [Retire/Archive] <-----------------+
```

### Roles and Deliverables by Stage

| Stage | Responsible | Action | Deliverable |
|-------|------------|--------|-------------|
| Plan | Content Owner | Define topic, set scope | Content brief |
| Create | Author | Draft writing | Draft document |
| Review | Reviewer | Technical accuracy + readability review | Review feedback |
| Publish | Editor | Formatting, metadata, linking | Published document |
| Maintain | Owner | Regular review, updates | Update records |
| Retire | Owner | Archive or delete | Retirement rationale |

## Update Cycles by Content Type

| Content Type | Recommended Cycle | Trigger Events |
|-------------|------------------|----------------|
| API Reference | Every release | API changes |
| Onboarding Guide | Quarterly | Process changes |
| Architecture Docs | Semi-annually | Architecture decisions |
| Coding Conventions | Annually | Convention agreements |
| FAQ | Monthly | Question accumulation |
| Glossary | Quarterly | New terms emerge |
| Incident Runbooks | After incidents | Incident occurrence |

## Document Quality Scorecard

### 5-Dimension Quality Assessment

| Dimension | Weight | 1 Point | 3 Points | 5 Points |
|-----------|--------|---------|----------|----------|
| Accuracy | 30% | Contains errors | Mostly accurate | Fully accurate |
| Currency | 25% | 1+ year without update | Verified within 6 months | Up to date |
| Completeness | 20% | Key content missing | Basic coverage | Comprehensive |
| Readability | 15% | Difficult to read | Average | Very clear |
| Findability | 10% | No metadata | Basic tags | Rich metadata |

### Quality Grades

| Total Score | Grade | Action |
|------------|-------|--------|
| 4.0-5.0 | A (Excellent) | Maintain |
| 3.0-3.9 | B (Good) | Minor improvements |
| 2.0-2.9 | C (Fair) | Update needed |
| 1.0-1.9 | D (Poor) | Immediate rewrite or retire |

## Governance Model

### RACI Matrix

| Activity | Author | Reviewer | Owner | Admin |
|----------|--------|----------|-------|-------|
| New creation | R | C | A | I |
| Review | I | R | A | I |
| Publish | I | C | R | I |
| Update | R | C | A | I |
| Retire | I | C | R | A |

R=Responsible, A=Accountable, C=Consulted, I=Informed

### Ownership Models

| Model | Best For | Pros | Cons |
|-------|---------|------|------|
| Individual ownership | Specialized technical docs | High quality | Bottleneck, bus factor |
| Team ownership | Process docs | Distributed load | Distributed responsibility |
| Community | Wiki-style knowledge | Voluntary contributions | Quality variance |

## Document Status Workflow

```
[draft] -> [review] -> [published] -> [outdated] -> [archived]
                ^                          |
                +---- [revision] <---------+
```

### Status Metadata Management

```yaml
---
status: "published"  # draft | review | published | outdated | archived
owner: "backend-team"
reviewers: ["senior-dev", "tech-lead"]
created: "2024-01-15"
last_reviewed: "2024-06-20"
next_review: "2024-12-20"
review_cycle: "6months"  # monthly | quarterly | 6months | yearly
version: "2.1"
change_log:
  - date: "2024-06-20"
    author: "dev-a"
    summary: "Updated for API v3 changes"
---
```

## Content Audit

### Audit Procedure

```
1. Generate complete document inventory
2. Apply quality scorecard to each document
3. Establish action plans by grade
4. Identify orphan documents (no owner)
5. Identify duplicate/conflicting documents
6. Create update schedule calendar
```

### Audit Report Template

```markdown
## Content Audit Report

**Audit Date**: {Date}
**Scope**: {Scope}

### Summary
- Total documents: {N}
- Grade distribution: A({a}%), B({b}%), C({c}%), D({d}%)
- No owner assigned: {orphan} items
- 1+ year without update: {stale} items

### Immediate Action Required
| Document | Current Grade | Issue | Suggested Action |
|----------|-------------|-------|-----------------|

### Improvement Needed Within Quarter
| Document | Current Grade | Issue | Suggested Action |
|----------|-------------|-------|-----------------|
```

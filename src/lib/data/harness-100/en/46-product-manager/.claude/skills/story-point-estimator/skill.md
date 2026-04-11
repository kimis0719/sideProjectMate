---
name: story-point-estimator
description: "A methodology for systematically estimating user story points. Used during sprint planning for tasks such as 'story point estimation,' 'SP calculation,' 'effort estimation,' 'velocity calculation,' and 'planning poker.' Note: Updating actual Jira tickets or facilitating team meetings is outside the scope of this skill."
---

# Story Point Estimator

A skill that enhances the effort estimation capabilities of sprint-planner and story-writer.

## Target Agents

- **sprint-planner** — Plans sprint capacity and story allocation
- **story-writer** — Evaluates complexity when writing user stories

## Fibonacci Scale Reference

| SP | Complexity | Uncertainty | Effort | Example |
|----|-----------|-------------|--------|---------|
| 1 | Very Low | None | A few hours | Text change, config value update |
| 2 | Low | Very Low | Half a day | Simple UI component addition |
| 3 | Moderate | Low | 1 day | Single CRUD API, simple screen |
| 5 | Medium | Moderate | 2-3 days | Complex business logic, external API integration |
| 8 | High | High | 1 week | New feature module, authentication system |
| 13 | Very High | Very High | 1-2 weeks | Architecture change, large-scale refactoring |
| 21+ | Needs Decomposition | - | - | Story is too large — decomposition required |

## Complexity Assessment Dimensions

### Three-Dimensional Assessment Model

```
Final SP = max(Technical Complexity, Domain Complexity, Uncertainty)

1. Technical Complexity
   - Scope of code changes (number of files, number of layers)
   - Technical difficulty (algorithms, concurrency, security)
   - Testing difficulty (edge cases, integration tests)

2. Domain Complexity
   - Number of business rules
   - Exception handling scenarios
   - Whether stakeholder approval is required

3. Uncertainty
   - Whether a technical spike is needed
   - External dependencies (APIs, libraries, infrastructure)
   - Clarity of requirements
```

## Velocity Calculation

```
Velocity = Total SP completed in a sprint

Stable velocity calculation:
  - Average of the last 3-5 sprints
  - Average after removing outliers (extreme values)
  - Or use the median

Example:
  Sprint 1: 32 SP
  Sprint 2: 28 SP
  Sprint 3: 35 SP
  Sprint 4: 15 SP (outlier due to vacations, etc.)
  Sprint 5: 30 SP

  Average (outliers removed): (32+28+35+30)/4 = 31.25 SP
```

## Sprint Capacity Calculation

```
Sprint Capacity = Velocity x Availability Rate

Availability rate calculation:
  Total person-days = Team size x Sprint days
  Unavailable = Vacations + Training + Meetings + On-call
  Available person-days = Total person-days - Unavailable

  Availability rate = Available person-days / Total person-days

Example:
  5 team members x 10 days = 50 person-days
  3 vacation days + 5 meeting days = 8 days
  Available: 42 days → Availability rate 84%

  Capacity = 31 SP x 0.84 ≈ 26 SP

Buffer:
  Stable team: Plan 80% of capacity (20% buffer)
  New team/uncertain: Plan 70% of capacity (30% buffer)
```

## User Story Decomposition Criteria

```
Decomposition is mandatory for stories of 13 SP or more:

Decomposition strategies:
1. By workflow stage
   "User makes a payment" →
   - Select payment method
   - Enter payment information
   - Process payment
   - Confirm payment

2. By data variation
   "Support multiple formats" →
   - JSON support
   - CSV support
   - XML support

3. By user type
   "User logs in" →
   - Email login
   - Social login
   - SSO login

4. By CRUD operation
   "Product management" →
   - List products
   - Create product
   - Update product
   - Delete product

5. By Happy/Sad path
   - Normal flow
   - Error handling
   - Edge cases
```

## Estimation Bias Prevention

```
1. Anchoring effect prevention
   → Simultaneous reveal (planning poker style)
   → Highest/lowest estimators explain their rationale

2. Optimism bias prevention
   → Consider "worst case" scenarios
   → Include time for testing/review/deployment

3. Parkinson's Law prevention
   → SP measures complexity, not time
   → "3 SP" not "2 days"

4. Reference point alignment
   → Maintain team-wide reference stories
   → Anchors like "Login API = 3 SP"
```

## Deliverable Template

```markdown
## Story Point Estimation Results

### Velocity: [N] SP/sprint
### Available Capacity: [N] SP (including [M]% buffer)

### Estimation Results
| Story | Technical | Domain | Uncertainty | SP | Notes |
|-------|-----------|--------|-------------|-----|-------|

### Sprint Allocation
| Sprint | Total SP | Story List |
|--------|----------|------------|
| Sprint 1 | 26/31 | [list] |
| Sprint 2 | 28/31 | [list] |
```

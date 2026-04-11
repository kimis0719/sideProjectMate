---
name: microservice-designer
description: "A full pipeline for designing, decomposing, communicating, and monitoring microservice architectures. An agent team collaborates to perform domain analysis, service design, communication patterns, and observability. Use this skill for requests like 'design a microservice architecture', 'decompose services', 'MSA design', 'domain analysis', 'event-driven architecture', 'inter-service communication design', 'distributed system design', 'API gateway design', and other microservice design tasks. Also supports transitioning from an existing monolith to MSA. Note: actual infrastructure setup, Kubernetes deployment, and code implementation are outside the scope of this skill."
---

# Microservice Designer — Microservice Architecture Design Pipeline

An agent team collaborates to perform domain analysis -> service design -> communication design -> observability design.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| domain-analyst | `.claude/agents/domain-analyst.md` | Bounded contexts, event storming | general-purpose |
| service-architect | `.claude/agents/service-architect.md` | API contracts, data ownership, deployment units | general-purpose |
| communication-designer | `.claude/agents/communication-designer.md` | Sync/async, event bus, Saga | general-purpose |
| observability-engineer | `.claude/agents/observability-engineer.md` | Metrics, logging, tracing, alerting | general-purpose |
| architecture-reviewer | `.claude/agents/architecture-reviewer.md` | Cross-validation, anti-pattern detection | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by Orchestrator)

1. Extract from user input:
    - **Business Domain**: What system/service is being designed
    - **Current State** (optional): Whether this is a monolith migration or a greenfield design
    - **Scale/Constraints** (optional): Expected traffic, team size, technology stack limitations
    - **Existing Documentation** (optional): ERD, architecture documents, API documentation, etc.
2. Create `_workspace/` directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are available, skip the corresponding Phase

### Phase 2: Team Assembly and Execution

| Order | Task | Assignee | Dependencies | Deliverable |
|-------|------|----------|-------------|-------------|
| 1 | Domain Analysis | analyst | None | `_workspace/01_domain_analysis.md` |
| 2 | Service Design | architect | Task 1 | `_workspace/02_service_design.md` |
| 3a | Communication Design | comm-designer | Tasks 1, 2 | `_workspace/03_communication_design.md` |
| 3b | Observability Design | obs-engineer | Task 2 | `_workspace/04_observability_design.md` |
| 4 | Architecture Review | reviewer | Tasks 1-3b | `_workspace/05_review_report.md` |

Tasks 3a (communication) and 3b (observability) can be **executed in parallel**.

**Inter-team Communication Flow:**
- analyst completes -> delivers bounded contexts and aggregates to architect; delivers domain events to comm-designer
- architect completes -> delivers service catalog and API contracts to comm-designer; delivers service list and dependencies to obs-engineer
- comm-designer completes -> delivers communication matrix and Saga flows to obs-engineer
- reviewer cross-validates all deliverables. When RED Must Fix items are found, requests fixes from the relevant agent -> rework -> re-verification (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Check all files in `_workspace/`
2. Verify that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user

## Modes by Task Scale

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|----------------|-----------------|
| "Design a microservice architecture" | **Full Pipeline** | All 5 agents |
| "Analyze the domain", "Event storming" | **Domain Mode** | analyst + reviewer |
| "Decompose services" (domain analysis exists) | **Service Mode** | architect + reviewer |
| "Design inter-service communication" | **Communication Mode** | comm-designer + reviewer |
| "Design monitoring/observability" | **Observability Mode** | obs-engineer + reviewer |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share main deliverables |
| Message-based | SendMessage | Real-time delivery of key information, fix requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient domain information | Draft using similar domain reference patterns, request user validation |
| Too many services | Suggest modular monolith -> gradual decomposition roadmap |
| Agent failure | Retry once -> if fails, proceed without that deliverable, note omission in review |
| RED found in review | Request fix from relevant agent -> rework -> re-verify (up to 2 times) |
| Distributed monolith signs | Request service boundary readjustment from architect |

## Test Scenarios

### Normal Flow
**Prompt**: "Design an e-commerce platform with microservice architecture. Order, payment, shipping, inventory, and user management are the core features."
**Expected Result**:
- Domain: 5 bounded contexts, context map, event storming results
- Service: 5-7 service catalog, API contracts, data ownership mapping
- Communication: Order-Payment-Shipping Saga, event bus topic design, circuit breaker configuration
- Observability: SLI/SLO definitions, distributed tracing design, alerting system
- Review: Full consistency verification across all items, distributed system anti-pattern checks

### Existing File Utilization Flow
**Prompt**: "I want to migrate a Django monolith to MSA. I have ERD and API documentation." + file attachments
**Expected Result**:
- Reverse-extract bounded contexts from the existing ERD
- Include Strangler Fig pattern-based gradual migration roadmap
- Include existing API backward compatibility maintenance strategy

### Error Flow
**Prompt**: "Build a chat app with microservices"
**Expected Result**:
- Distinguish between "design" and "implementation," performing only design
- Include communication design specialized for real-time communication (WebSocket/SSE)
- Inform that implementation is outside the scope of this skill

## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| ddd-context-mapping | `.claude/skills/ddd-context-mapping/skill.md` | domain-analyst, service-architect | Bounded context identification, event storming, context map relationship types, aggregate design |
| distributed-patterns | `.claude/skills/distributed-patterns/skill.md` | communication-designer, service-architect | Distributed transaction (Saga), CQRS, Circuit Breaker, Event Sourcing implementation patterns |

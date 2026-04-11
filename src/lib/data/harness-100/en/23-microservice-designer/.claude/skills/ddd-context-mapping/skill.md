---
name: ddd-context-mapping
description: "Detailed methodology for DDD (Domain-Driven Design) bounded context identification, context map creation, and event storming execution. Use this skill for 'bounded context', 'DDD', 'domain modeling', 'event storming', 'context map', 'aggregate design', 'ubiquitous language', and other domain analysis tasks. Enhances the domain analysis capabilities of domain-analyst and service-architect. Note: infrastructure deployment and code implementation are outside the scope of this skill."
---

# DDD Context Mapping — Domain-Driven Design Context Mapping Guide

Systematic methodology from bounded context identification to context map creation.

## Event Storming Procedure

### Phase 1: Domain Event Collection
```
Rule: Express in past tense verbs
Examples: "Order was created", "Payment was approved", "Shipping was initiated"

Collection order:
1. List events from core business flows in chronological order
2. Add exception/failure events
3. Add external system events
```

### Phase 2: Command -> Event Mapping
```
[User/System] -> {Command} -> [Aggregate] -> <<Domain Event>>
[Customer]    -> {Create Order} -> [Order]  -> <<Order was created>>
[Payment System] -> {Approve Payment} -> [Payment] -> <<Payment was approved>>
```

### Phase 3: Aggregate Identification
```
Aggregate boundary criteria:
1. Transactional consistency boundary — groups of objects that must change together
2. Invariant protection — units that enforce business rules
3. Concurrency boundary — units that manage conflicts during concurrent access
```

### Phase 4: Bounded Context Derivation

| Signal | Meaning |
|--------|---------|
| Same word with different meanings | Context separation needed (e.g., "Account" = user account vs. financial account) |
| Owned by different teams | Organizational boundary = context boundary |
| Different change cadences | Independent deployment needed -> separate |
| Different data stores | Technical boundary = context boundary |

## Context Map Relationship Types

| Relationship | Symbol | Description | Example |
|-------------|--------|-------------|---------|
| **Shared Kernel** | SK | Shared domain model | Two teams using the same Entity |
| **Customer-Supplier** | C/S | Upstream/downstream relationship | Order (upstream) -> Shipping (downstream) |
| **Conformist** | CF | Downstream accepts upstream model as-is | Accepting external API model |
| **Anti-Corruption Layer** | ACL | Insert model translation layer | Integration with legacy system |
| **Open Host Service** | OHS | Provide public protocol | Public REST API |
| **Published Language** | PL | Shared language (schema) | Protobuf/Avro schema |
| **Separate Ways** | SW | Independent operation | Integration unnecessary |
| **Partnership** | P | Equal collaboration | Joint development by two teams |

```
Context Map Example:

+---------------+     OHS/PL      +-----------------+
| Order Mgmt    | ---------------> | Payment Process |
| (Order BC)    |                  | (Payment BC)    |
+-------+-------+                  +--------+--------+
        | C/S                               | C/S
        v                                   v
+---------------+     ACL          +-----------------+
| Shipping Mgmt | <--------------- | External PG     |
| (Shipping BC) |                  | (3rd Party)     |
+---------------+                  +-----------------+
```

## Aggregate Design Principles

### Sizing Criteria
```
Prefer small aggregates:
+-- Minimize transaction scope -> reduce concurrency conflicts
+-- Reduce memory usage
+-- Shrink change impact scope

Exceptions (larger aggregates allowed):
+-- Invariants span multiple entities
+-- Atomic consistency is absolutely required
+-- Cannot be replaced with eventual consistency
```

### Inter-aggregate Reference Rules
```
OK - ID reference: Order.customerId (only holds the Customer aggregate's ID)
NO - Direct reference: Order.customer (directly holds the Customer object)

Reasons:
1. Respects aggregate boundaries
2. Transaction isolation
3. Enables independent storage usage
```

## Ubiquitous Language Dictionary Template

```markdown
| Term | Context | Definition | Synonyms | Confusion/Antonyms |
|------|---------|-----------|----------|-------------------|
| Order | Order Management | Customer's product purchase request | Purchase order | Distinct from Cart |
| Account | User Management | Loginable user unit | User | Distinct from financial account |
| Account | Settlement Management | Settlement target financial account | Bank account | Distinct from user account |
```

## Service Decomposition Anti-patterns

| Anti-pattern | Symptoms | Resolution |
|-------------|----------|-----------|
| **Nanoservice** | Service is too small, only 1-2 APIs | Merge related services |
| **Distributed Monolith** | All services in synchronous call chains | Switch to event-driven async |
| **CRUD Service** | Acts as DB proxy without domain logic | Internalize domain logic |
| **God Service** | Excessive responsibilities in one service | Re-decompose based on bounded contexts |
| **Shared DB** | Multiple services using the same tables | Separate data ownership |

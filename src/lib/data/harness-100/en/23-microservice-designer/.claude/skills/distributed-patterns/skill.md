---
name: distributed-patterns
description: "Implementation guide and selection matrix for core distributed system patterns (Saga, CQRS, Circuit Breaker, Event Sourcing, etc.). Use this skill for 'distributed transactions', 'Saga pattern', 'CQRS', 'circuit breaker', 'event sourcing', 'distributed patterns', 'compensating transactions', 'eventual consistency', and other distributed system pattern applications. Enhances the distributed system design capabilities of communication-designer and service-architect. Note: infrastructure setup and monitoring configuration are outside the scope of this skill."
---

# Distributed Patterns — Core Distributed System Pattern Guide

Detailed pattern implementations for inter-microservice communication, data consistency, and fault tolerance.

## 1. Saga Pattern

### Choreography vs Orchestration Selection

| Criteria | Choreography | Orchestration |
|----------|-------------|---------------|
| Number of services | 2-4 | 5 or more |
| Flow complexity | Linear | Branching/conditional |
| Coupling | Event-driven loose coupling | Centralized in orchestrator |
| Visibility | Difficult to trace flow | Central state management |
| Failure handling | Each service self-compensates | Orchestrator coordinates compensation |

### Orchestration Saga Implementation

```
Order Saga:
T1: Create Order   --> C1: Cancel Order
T2: Reserve Stock  --> C2: Restore Stock
T3: Process Payment --> C3: Refund Payment
T4: Request Shipping --> C4: Cancel Shipping

Failure scenario (T3 fails):
T1 -> T2 -> T3(fail) -> C2(restore stock) -> C1(cancel order)
```

### Saga State Machine

```
STARTED -> INVENTORY_RESERVED -> PAYMENT_PROCESSED -> SHIPPING_REQUESTED -> COMPLETED
    |           |                    |                    |
 FAILED -> COMPENSATING_INVENTORY -> COMPENSATING_PAYMENT -> COMPENSATING_SHIPPING
                                                              |
                                                         COMPENSATED
```

## 2. CQRS (Command Query Responsibility Segregation)

```
+----------+     Command     +---------------+
|  Client   | -------------->| Write Model   |--> Event Store
|           |                | (Normalized DB)|
|           |     Query      +---------------+
|           | <------------- | Read Model    |<-- Projection
|           |                | (Denormalized) |
+----------+                +---------------+
```

**Application Criteria:**

| When to Apply | When NOT to Apply |
|--------------|-------------------|
| Asymmetric read/write load (100:1) | Simple CRUD apps |
| Read model and write model are very different | Read/write models are nearly identical |
| Complex domain logic + diverse views | Cannot tolerate eventual consistency |
| Used with event sourcing | Small team size (< 3 people) |

## 3. Circuit Breaker

### State Transitions

```
CLOSED --(failure rate > threshold)--> OPEN
   ^                                    |
   |                               (after timeout)
   |                                    v
   +---(success)--- HALF_OPEN ---(failure)---> OPEN
```

### Configuration Guide

| Parameter | Recommended Value | Description |
|-----------|------------------|-------------|
| failureRateThreshold | 50% | Failure rate to trigger OPEN |
| slowCallRateThreshold | 80% | Slow call rate threshold |
| slowCallDurationThreshold | 3s | Slow call criteria |
| waitDurationInOpenState | 30s | Wait before HALF_OPEN transition |
| slidingWindowSize | 100 | Measurement window size |
| minimumNumberOfCalls | 10 | Minimum call count |

### Fallback Strategies

| Strategy | Application | Example |
|----------|-------------|---------|
| Cached response | Read APIs | Return last successful response |
| Default value | Non-critical features | Popular products instead of recommendations |
| Alternate service | Payment | Secondary PG when primary PG fails |
| Queuing | Can be async | Store order in queue for later processing |
| Error response | Critical features | Clear error message |

## 4. Event Sourcing

```
Traditional approach: Store only current state
  Account { balance: 750 }

Event Sourcing: Store all change history
  1. AccountOpened  { id: A1 }
  2. MoneyDeposited { amount: 1000 }
  3. MoneyWithdrawn { amount: 250 }
  -> Reconstruct current state: balance = 0 + 1000 - 250 = 750
```

**Snapshot Strategies:**

| Strategy | Condition | Advantage |
|----------|-----------|-----------|
| Event count-based | Snapshot every N events | Predictable performance |
| Time-based | Snapshot every N minutes | Consistent recovery time |
| On-demand | On cache miss during read | Storage space savings |

## 5. API Gateway Patterns

| Pattern | Description | Application |
|---------|-------------|-------------|
| **API Composition** | Compose responses from multiple services | BFF (Backend for Frontend) |
| **Rate Limiting** | Limit request rate | Token Bucket / Sliding Window |
| **Request Routing** | Path-based routing | /api/v1/orders -> order-service |
| **Protocol Translation** | Protocol conversion | REST -> gRPC, WebSocket -> HTTP |

## Pattern Combination Recipes

### E-commerce Order Processing
```
Saga(Orchestration) + Event Sourcing + CQRS
+-- Order Saga: Coordinate inventory -> payment -> shipping
+-- Each service: Event sourcing for audit trail
+-- Order queries: Fast lookups via CQRS Read Model
```

### Real-time Chat
```
Event-Driven + Circuit Breaker + API Gateway
+-- Messages: Event streaming (Kafka)
+-- Auxiliary features: Circuit Breaker (translation, filtering)
+-- Client: WebSocket Gateway
```

## CAP Theorem Practical Application

```
              Consistency
                    /\
                   /  \
              CP  /    \ CA
                 /      \
                /________\
    Availability -------- Partition Tolerance
                  AP

Practical choices:
- CP: Payment, inventory (accuracy first)
- AP: Product browsing, recommendations (availability first)
- CA: Single-node DB (not distributed)
```

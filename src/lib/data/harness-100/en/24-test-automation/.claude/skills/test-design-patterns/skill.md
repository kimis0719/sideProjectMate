---
name: test-design-patterns
description: "Patterns for effective test design, including boundary value analysis, equivalence partitioning, state transition testing, and other systematic test case derivation methodologies. Use this skill for 'test design', 'test case derivation', 'boundary value analysis', 'equivalence partitioning', 'state transition testing', 'pairwise', 'test matrix', and other test design tasks. Enhances the test design capabilities of test-strategist and unit-tester. Note: test infrastructure setup and CI/CD configuration are outside the scope of this skill."
---

# Test Design Patterns — Systematic Test Design Guide

Methodologies for systematically deriving and effectively structuring test cases.

## Test Case Derivation Techniques

### 1. Equivalence Partitioning

```
Input: Age (integer 1-150)
+-- Valid class: [1, 150] -> representative: 25
+-- Invalid class 1: < 1   -> representative: 0, -1
+-- Invalid class 2: > 150 -> representative: 151, 999
+-- Invalid class 3: non-integer -> representative: 25.5, "abc"
+-- Invalid class 4: null  -> representative: null, undefined
```

### 2. Boundary Value Analysis

```
Range: [1, 150]
Test values: 0, 1, 2, ... , 149, 150, 151
             ^  ^  ^        ^    ^    ^
          invalid boundary valid  valid boundary invalid

3-point boundary: min-1, min, max, max+1
7-point boundary: min-1, min, min+1, nominal, max-1, max, max+1
```

### 3. State Transition Testing

```
Order state transitions:
CREATED -(payment)-> PAID -(shipping start)-> SHIPPING -(delivery)-> DELIVERED
   |                  |                         |                      |
   +-(cancel)-> CANCELLED  +-(refund)-> REFUNDED  +-(return)-> RETURNED  +-(return)-> RETURNED

Test cases:
1. Happy Path: CREATED -> PAID -> SHIPPING -> DELIVERED
2. Order cancel: CREATED -> CANCELLED
3. Post-payment refund: CREATED -> PAID -> REFUNDED
4. In-transit return: CREATED -> PAID -> SHIPPING -> RETURNED
5. Invalid transition: CANCELLED -> PAID (should be rejected)
6. Invalid transition: DELIVERED -> SHIPPING (should be rejected)
```

### 4. Pairwise Testing

```
Parameters:
- OS: Windows, macOS, Linux
- Browser: Chrome, Firefox, Safari
- Language: ko, en, ja

Full combinations: 3x3x3 = 27
Pairwise: Reduced to 9 (covers all 2-way combinations)

| # | OS      | Browser | Language |
|---|---------|---------|----------|
| 1 | Windows | Chrome  | ko       |
| 2 | Windows | Firefox | en       |
| 3 | Windows | Safari  | ja       |
| 4 | macOS   | Chrome  | en       |
| 5 | macOS   | Firefox | ja       |
| 6 | macOS   | Safari  | ko       |
| 7 | Linux   | Chrome  | ja       |
| 8 | Linux   | Firefox | ko       |
| 9 | Linux   | Safari  | en       |
```

### 5. Decision Table

```
Discount rules:
Condition                    | R1 | R2 | R3 | R4 |
-----------------------------+----+----+----+----+
VIP member?                  | Y  | Y  | N  | N  |
Order amount >= $50?         | Y  | N  | Y  | N  |
-----------------------------+----+----+----+----+
15% discount                 | X  |    |    |    |
10% discount                 |    | X  | X  |    |
No discount                  |    |    |    | X  |
```

## Test Structure Patterns

### AAA (Arrange-Act-Assert)
```python
def test_order_total_with_discount():
    # Arrange
    order = Order(items=[Item("A", 10000), Item("B", 20000)])
    discount = PercentageDiscount(10)

    # Act
    total = order.calculate_total(discount)

    # Assert
    assert total == 27000
```

### Given-When-Then (BDD)
```python
def test_vip_customer_gets_extra_discount():
    # Given: A VIP customer places an order of $50 or more
    customer = Customer(tier="VIP")
    order = Order(customer, total=60000)

    # When: Discount is applied
    discounted = pricing_service.apply_discount(order)

    # Then: 15% discount is applied
    assert discounted == 51000
```

### Builder Pattern (Test Data)
```python
class OrderBuilder:
    def __init__(self):
        self._customer = default_customer()
        self._items = []
    def with_vip_customer(self): ...
    def with_item(self, name, price): ...
    def build(self) -> Order: ...

# Usage
order = OrderBuilder().with_vip_customer().with_item("A", 10000).build()
```

## Test Pyramid Ratio Guide

```
        / E2E  \          5-10%   Slow but realistic
       /--------\
      / Integration \     20-30%  Inter-service integration
     /--------------\
    /  Unit Tests    \    60-70%  Fast and isolated
   /------------------\
```

| Layer | Execution Time | Scope | Failure Cause |
|-------|---------------|-------|--------------|
| Unit | < 10ms | Function/class | Logic error |
| Integration | < 5s | Inter-module | Interface mismatch |
| E2E | < 60s | Full flow | Environment, timing |

## Risk-based Test Prioritization

```
Risk = Failure Probability x Business Impact

       High Impact
          |
  P1 Tests | P0 Tests
  (Must)   | (Top Priority)
  ---------+----------> High Probability
  P3 Tests | P2 Tests
  (If time)| (Recommended)
          |
       Low Impact
```

---
name: strangler-fig-patterns
description: "Detailed implementation guide for the Strangler Fig pattern and related migration patterns for incrementally replacing legacy systems. Use this skill for 'strangler fig', 'incremental migration', 'refactoring patterns', 'branch by abstraction', 'parallel run', 'gradual replacement', 'migration pattern selection', and other legacy migration pattern applications. Enhances pattern selection and implementation for refactoring-strategist and migration-engineer. Note: full team orchestration and project management are outside the scope of this skill."
---

# Strangler Fig Patterns — Incremental Migration Pattern Guide

Detailed implementation methodologies for proven patterns for replacing legacy systems.

## Pattern Catalog

### 1. Strangler Fig Pattern

**Applicable Conditions**: When incremental transition from a monolith to a new system is needed

```
+---------------------------------------------+
|              Router/Proxy                    |
|  +----------+    +----------------------+   |
|  | Legacy   | <-> | New System          |   |
|  | (shrink- |    | (expanding)          |   |
|  |  ing)    |    |                      |   |
|  +----------+    +----------------------+   |
+---------------------------------------------+
```

**Implementation Steps:**

| Step | Task | Verification Criteria | Rollback Method |
|------|------|----------------------|-----------------|
| 1. Insert Interceptor | Add router/proxy layer | Confirm 100% existing traffic routes through legacy | Remove interceptor |
| 2. Extract by Feature | Start with most independent feature into new service | Verify identical input/output (Shadow Test) | Restore routing |
| 3. Traffic Migration | Canary -> gradual percentage increase | Error rate, latency, business metrics | Revert to 0% |
| 4. Legacy Removal | Delete fully migrated code | Confirm 100% migration complete | N/A |

**Extraction Priority Matrix:**

```
High Business Value
       |
  (3) Quick | (1) Top Priority
    Wins    |  Extraction Targets
  ----------+-----------> Low Coupling
  (4) Defer | (2) Gradual
    Hold    |  Decouple then Extract
       |
Low Business Value
```

### 2. Branch by Abstraction

**Applicable Conditions**: When replacing internal components (within the same codebase)

```python
# Step 1: Insert abstraction layer
class PaymentGateway(ABC):
    @abstractmethod
    def process(self, amount: Decimal) -> PaymentResult: ...

# Step 2: Wrap legacy implementation
class LegacyPayment(PaymentGateway):
    def process(self, amount):
        return self.old_system.charge(amount)

# Step 3: New implementation
class ModernPayment(PaymentGateway):
    def process(self, amount):
        return self.stripe_client.create_charge(amount)

# Step 4: Switch via feature flag
gateway = ModernPayment() if feature_flag('new_payment') else LegacyPayment()
```

### 3. Parallel Run (Scientist Pattern)

**Applicable Conditions**: When verifying the accuracy of a new system before replacement

```python
class Experiment:
    def run(self, input_data):
        control_result = self.legacy.execute(input_data)
        try:
            candidate_result = self.modern.execute(input_data)
            if not self.compare(control_result, candidate_result):
                self.report_mismatch(input_data, control_result, candidate_result)
        except Exception as e:
            self.report_error(input_data, e)
        return control_result  # Always return legacy result
```

**Comparison Strategies:**

| Comparison Level | Method | Tolerance |
|-----------------|--------|-----------|
| Exact match | `==` | 0% difference |
| Structural match | Schema comparison | Field presence/type match |
| Semantic match | Business rule-based | Domain-specific tolerance |
| Statistical match | Aggregate/distribution comparison | >= 99.9% match rate |

### 4. Anti-Corruption Layer (ACL)

**Applicable Conditions**: When legacy and new systems must coexist, preventing domain contamination

**ACL Components:**

| Component | Role | Implementation |
|-----------|------|---------------|
| Translator | Domain model conversion | DTO <-> Domain Object mapping |
| Adapter | Interface conversion | Legacy API -> Modern interface |
| Facade | Complexity hiding | Multiple legacy calls -> single method |

### 5. Feature Toggle Strategy

```yaml
toggles:
  # Phase 1: Dev team only
  new_user_service: { type: permission, users: ["dev-team"] }
  # Phase 2: Canary (10%)
  new_user_service: { type: gradual-rollout, percentage: 10, sticky: true }
  # Phase 3: Full rollout
  new_user_service: { type: release, enabled: true }
  # Phase 4: Remove toggle (delete legacy code)
```

## Pattern Selection Decision Tree

```
Is legacy replacement needed?
+-- External system/service replacement -> Strangler Fig
+-- Internal component replacement
|   +-- Pre-replacement verification needed -> Parallel Run + Branch by Abstraction
|   +-- Confident in replacement -> Branch by Abstraction
+-- Long-term legacy-new coexistence -> Anti-Corruption Layer
+-- All cases -> Feature Toggle recommended in combination
```

## Warning Signs and Responses

| Warning Sign | Meaning | Response |
|-------------|---------|----------|
| Module to extract has 10+ dependencies | Excessive coupling | Insert ACL then incrementally resolve dependencies |
| Parallel Run mismatch rate > 5% | Excessive behavioral differences | Re-verify business rules, collect edge cases |
| > 20 toggles active simultaneously | Toggle debt | Introduce regular toggle cleanup sprints |
| Migration ongoing for 6+ months | Increasing parallel operation costs | Reduce scope or consider partial Big Bang |

---
name: dependency-analysis
description: "Tools and methodologies for analyzing codebase dependency graphs and quantitatively measuring coupling/cohesion. Use this skill for 'dependency analysis', 'coupling measurement', 'circular dependencies', 'module coupling', 'cohesion analysis', 'dependency graph', 'coupling analysis', and other code dependency-related analysis. Enhances the dependency analysis capabilities of legacy-analyzer and refactoring-strategist. Note: full pipeline orchestration is outside the scope of this skill."
---

# Dependency Analysis — Dependency Graph Analysis Tool

Methodologies and tool guide for quantitative measurement and visualization of code dependencies.

## Dependency Metric System

### 1. Coupling Metrics

| Metric | Formula | Interpretation | Risk Threshold |
|--------|---------|----------------|---------------|
| **Ca (Afferent Coupling)** | Number of packages depending on me | High = large change ripple effect | > 20 |
| **Ce (Efferent Coupling)** | Number of packages I depend on | High = unstable | > 20 |
| **I (Instability)** | Ce / (Ca + Ce) | 0=stable, 1=unstable | Warning in middle zone (0.3-0.7) |
| **D (Distance)** | \|A + I - 1\| | Distance from the main sequence | > 0.3 |

**Stable Dependencies Principle (SDP) Verification:**
```
Dependency direction: Unstable -> Stable (correct)
Violation: Stable -> Unstable (risky — dependency inversion needed)
```

### 2. Cohesion Metrics

| Metric | Measurement Target | Acceptable Threshold |
|--------|-------------------|---------------------|
| **LCOM4** | Number of connected components within a class | = 1 |
| **TCC** (Tight Class Cohesion) | Ratio of directly connected methods | > 0.5 |
| **H** (Henderson-Sellers) | Ratio of intra-package relationships | > 0.7 |

### 3. Circular Dependency Detection — Tarjan SCC Algorithm

```python
def find_cycles(graph):
    """Detect circular dependency groups using Tarjan SCC"""
    index_counter, stack, result = [0], [], []
    lowlink, index, on_stack = {}, {}, {}

    def strongconnect(v):
        index[v] = lowlink[v] = index_counter[0]
        index_counter[0] += 1
        on_stack[v] = True
        stack.append(v)
        for w in graph.get(v, []):
            if w not in index:
                strongconnect(w)
                lowlink[v] = min(lowlink[v], lowlink[w])
            elif on_stack.get(w):
                lowlink[v] = min(lowlink[v], index[w])
        if lowlink[v] == index[v]:
            component = set()
            while True:
                w = stack.pop()
                on_stack[w] = False
                component.add(w)
                if w == v: break
            if len(component) > 1:
                result.append(component)
    for v in graph:
        if v not in index: strongconnect(v)
    return result
```

### 4. Cycle Resolution Patterns

| Pattern | Applicable Situation | Method |
|---------|---------------------|--------|
| **Dependency Inversion (DIP)** | A<->B bidirectional | Extract interface, unify direction |
| **Event-based Decoupling** | A->B->A callback | Indirect communication via event bus |
| **Mediator Pattern** | A<->B<->C complex cycle | Central coordination via Mediator |
| **Common Module Extraction** | A<->B shared logic | Extract shared parts into module C |

## Language-specific Tools

### JavaScript/TypeScript
```bash
npx madge --image graph.svg src/        # Dependency graph
npx madge --circular src/               # Circular detection
npx depcheck                            # Unused dependencies
```

### Python
```bash
pipdeptree --graph-output svg > deps.svg
pydeps src/mypackage --max-bacon=2
```

### Java/Kotlin
```bash
./gradlew dependencies --configuration runtimeClasspath
# Architecture rule testing with ArchUnit
```

## Change Impact Analysis (CIA)

```
Changed file: UserService.java
+-- Direct impact (depth 1): UserController, OrderService, AuthService
+-- Indirect impact (depth 2): OrderController, PaymentService
+-- Test impact: UserServiceTest, OrderIntegrationTest
-> Estimated ripple scope: 8 files, 3 tests
```

## Architecture Fitness Functions

```python
DEPENDENCY_RULES = {
    "domain -> infrastructure prohibited": {
        "from": "domain/**", "to_not": "infrastructure/**", "severity": "ERROR"
    },
    "controller -> repository direct access prohibited": {
        "from": "controller/**", "to_not": "repository/**", "severity": "ERROR"
    },
}
```

## Report Template

```markdown
# Dependency Analysis Report

## Summary
- Total modules: N | Average coupling (Ce): X.X | Circular groups: N

## Per-module Metrics
| Module | Ca | Ce | I | A | D | LCOM4 | Grade |

## Circular Dependencies
- Group 1: [A, B, C] — Resolution strategy: DIP

## Hotspots (High Ca + High Ce)
- ModuleX: Ca=25, Ce=18 — Excessive change ripple scope

## Recommendations
1. [Urgent] Resolve circular dependencies
2. [Important] Separate hotspot modules
3. [Improvement] Automate dependency rules in CI
```

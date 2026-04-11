---
name: lab-scaffolding
description: "A lab scaffolding skill used by the lab-designer agent. Provides lab difficulty calibration, starter code design, capstone project structures, and self-directed learning strategies. Used for 'lab design,' 'project assignments,' 'scaffolding,' 'hands-on labs,' and related topics."
---

# Lab Scaffolding — Lab Scaffolding Methodology

Expert knowledge used by the lab-designer agent when designing hands-on assignments and projects.

## Why Scaffolding

If you tell learners "build a program" without support, 90% will give up. **Scaffolding** is the strategy of gradually providing support for what learners cannot do alone, then reducing support as their ability grows.

## Five-Level Lab Pyramid

```
          /\
         / 5 \  <- Capstone Project (open-ended)
        /-----\
       /   4    \  <- Mini Project (minimal guidance)
      /-----------\
     /      3       \  <- Challenge (hints provided)
    /-----------------\
   /        2          \  <- Guided Lab (step-by-step)
  /---------------------\
 /          1            \  <- Follow-Along (code walkthrough)
/---------------------------\
```

### Design by Level

| Level | Learner Autonomy | Support Level | Lab Format |
|-------|-----------------|---------------|-----------|
| **1. Follow-Along** | 0% | 100% guided | Type instructor's code verbatim |
| **2. Guided Lab** | 20% | 80% guided | Starter code + fill in the blanks |
| **3. Challenge** | 50% | Hints only | Requirements -> Hints -> Verification |
| **4. Mini Project** | 80% | Spec only | Feature requirements -> free implementation |
| **5. Capstone** | 95% | Mentoring only | Choose topic -> Design -> Implement -> Present |

## Starter Code Design

### Starter Code Principles

1. **Runnable state**: Starter code must execute without errors as-is
2. **TODO markers**: Clearly mark where learners should write code
3. **Remove boilerplate**: Pre-write code unrelated to learning objectives
4. **Progressive disclosure**: Provide more code early on, bare files later

### Starter Code Template

```python
"""
Lab: [Lab Title]
Learning Objective: [Skills to practice in this lab]
Estimated Duration: XX minutes
Difficulty: [1-5]
"""

# === Pre-written code (do not modify) ===
import flask
app = flask.Flask(__name__)

# === TODO 1: [Specific instruction] ===
# Hint: [Related concept or method to use]
# Expected lines of code: X


# === TODO 2: [Specific instruction] ===
# Hint: [Related concept or method to use]


# === Tests ===
# If the code below runs without errors, you've succeeded
if __name__ == "__main__":
    # Automated verification code
    pass
```

## Capstone Project Design

### Capstone Structure Template

```
## Capstone Project: [Title]

### Overview
[Purpose of the project and description of final deliverable]

### Learning Objective Mapping
This project comprehensively assesses the following learning objectives:
- [LO1]: [Learning objective]
- [LO2]: [Learning objective]
- ...

### Functional Requirements
#### Must Have
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

#### Nice to Have — Bonus Points
1. [Additional feature 1]
2. [Additional feature 2]

### Milestones
| Week | Deliverable | Checkpoint |
|------|------------|-----------|
| Week 1 | Design document + wireframes | Mentor review |
| Week 2 | Core feature prototype | Working demo |
| Week 3 | Full feature implementation | Code review |
| Week 4 | Testing + documentation + presentation | Final submission |

### Rubric
[Reference assessment-engineering skill rubric]

### Reference Resources
- [Related lesson links]
- [Official documentation links]
- [Example projects (reference only, no copying)]
```

### Capstone Topic Design Rules

1. **Real-world problems**: Have learners build something they can actually use
2. **Appropriate scope**: Completable in 2-4 weeks
3. **Learning objective integration**: Must use all core skills taught in the course
4. **Scalable**: Required features are achievable; bonus features adjust difficulty
5. **Portfolio value**: The finished product should be resume-worthy

## Difficulty Calibration Techniques

### Dynamic Difficulty Adjustment

| Situation | Strategy |
|-----------|---------|
| Learner is stuck | Hint 1 (direction) -> Hint 2 (specific) -> Hint 3 (partial code) -> Full solution |
| Too easy for learner | Add constraints, optimization challenges |
| Wide skill gap among learners | Separate required/optional tasks; assign mentoring roles to advanced learners |

### Hint System Design

```
[Attempt without hints] -> After 5 min
[Hint 1: Direction] "This problem uses the ~ concept" -> After 5 min
[Hint 2: Approach] "Look up the ~ method" -> After 5 min
[Hint 3: Code skeleton] "The structure looks like this: ..." -> After 5 min
[Full solution + explanation]
```

## Recommended Lab Environments

| Course Type | Recommended Environment | Reason |
|------------|------------------------|--------|
| Programming Intro | Browser IDE (Replit, Google Colab) | Start instantly without installation |
| Web Development | GitHub Codespaces / Gitpod | Consistent environment guaranteed |
| Data Analysis | Google Colab / Kaggle Notebooks | GPU access, dataset hosting |
| Systems/Infrastructure | Docker + scripts | Reproducible environment |

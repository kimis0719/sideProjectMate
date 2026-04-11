---
name: assessment-engineering
description: "An assessment engineering skill used by the quiz-maker agent. Provides item type design guides, distractor psychology, rubric construction, and formative/summative assessment strategies. Used for 'quiz design,' 'assessment items,' 'rubrics,' 'exam creation,' and related topics."
---

# Assessment Engineering — Assessment Engineering Methodology

Expert knowledge used by the quiz-maker agent when designing formative and summative assessments.

## Why Assessment Engineering

Good assessment **accurately measures** learner understanding while simultaneously **reinforcing learning**. Poor assessment rewards memorization; good assessment rewards understanding.

## Item Type Design Guide

### 1. Multiple Choice

| Element | Rule |
|---------|------|
| **Stem** | Must be a clear question when read independently |
| **Key (Correct Answer)** | Must be unambiguously the best answer |
| **Distractors** | Plausible but clearly incorrect (see below) |
| **Number of Options** | 4 (5 adds meaningless wrong answers; 3 gives a 33% guess rate) |
| **Option Length** | Keep similar length (longest option being correct is a clue leak) |

### Distractor Design Psychology

| Distractor Type | Purpose | Example (Q: "Which HTTP method deletes a resource in REST?") |
|----------------|---------|------|
| **Common Misconception** | Diagnose incorrect knowledge | "POST" (confusing create and delete) |
| **Partial Answer** | Diagnose superficial understanding | "PUT" (confusing update and delete) |
| **Related Concept** | Diagnose concept discrimination | "PATCH" (partial update, similar concept) |
| **Correct**: | | "DELETE" |

### 2. Code Writing Problems

```
[Scenario Setup]
Write a function that meets the following requirements.

[Input/Output Specification]
- Input: [Type and range]
- Output: [Type and conditions]
- Constraints: [Time/space complexity, restrictions]

[Example]
Input: [Example input]
Output: [Example output]

[Grading Criteria]
- [ ] Correctness: Passes all test cases
- [ ] Code Quality: Readability, naming
- [ ] Efficiency: Time/space complexity
```

### 3. Scenario-Based Problems

```
[Scenario]
You are in the following situation. [Concrete situation description]

[Question]
What is the most appropriate [action/design/solution] in this situation?

[Evaluation Perspective]
- Problem identification ability
- Solution strategy appropriateness
- Trade-off awareness
```

## Formative vs. Summative Assessment

| Attribute | Formative | Summative |
|-----------|----------|-----------|
| **Timing** | During learning (every lesson) | After learning (end of module) |
| **Purpose** | Check understanding, immediate correction | Measure achievement, assign grades |
| **Atmosphere** | Low-stakes, practice | Formal, final |
| **Item Count** | 3-5 | 10-20 |
| **Feedback** | Immediate, detailed | Post-completion, aggregate |
| **Retakes** | Unlimited | 1-2 |
| **Bloom's Level** | 1-3 (Remember, Understand, Apply) | 3-6 (Apply through Create) |

### Formative Assessment Design Principles

1. **3-5 items at the end of each lesson**: Confirm key concept understanding
2. **Immediate feedback**: Correct/incorrect + "Why this is the answer" explanation
3. **Learning-directed wrong answers**: "Review this section: [link]"
4. **Difficulty ordering**: Easy to hard (builds confidence)

### Summative Assessment Design Principles

1. **100% learning objective coverage**: Every objective mapped to at least one item
2. **Bloom's distribution**: Remember 20% + Understand 20% + Apply 30% + Analyze/Evaluate/Create 30%
3. **Time allocation**: 2-3 minutes per item, 30-60 minutes total
4. **Practical weighting**: Labs/projects should account for 40-60% of the total score

## Rubric Construction

### Analytic Rubric Template

| Criterion | Excellent (4) | Good (3) | Satisfactory (2) | Needs Improvement (1) |
|-----------|-------------|---------|-----------------|---------------------|
| **Functionality** | All requirements met | 90% met | 70% met | Below 50% |
| **Code Quality** | Clean, consistent style | Mostly clean | Some inconsistency | Low readability |
| **Error Handling** | All edge cases | Major cases | Basic cases only | No error handling |
| **Documentation** | Detailed comments + README | Key function comments | Minimal comments | No comments |

### Rubric Writing Rules

1. **Describe observable behaviors**: Instead of "understood well," use "can explain..."
2. **Clear distinctions between levels**: Each level must be unambiguously different
3. **3-5 criteria**: Too many makes assessment impractical
4. **Share with learners in advance**: Showing the rubric before assessment sets learning direction

## Feedback Design

### Effective Feedback Formula: EEC

```
E (Evidence): "Your code lacks error handling"
E (Effect): "In this case, the program will crash if the user enters an empty value"
C (Change): "Wrap it in a try-except block and show the user a guidance message"
```

### Feedback Rules

- **Specific**: Instead of "Good job," say "Your variable names clearly describe their purpose"
- **Immediate**: As soon as possible after submission (automated tests preferred)
- **Action-oriented**: Tell the learner what to do next
- **Positive first**: What was done well -> Areas for improvement -> Next steps

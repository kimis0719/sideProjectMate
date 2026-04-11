---
name: learning-design
description: "A learning design skill used by the curriculum-designer and content-writer agents. Provides core instructional design theories and applications including Bloom's Taxonomy, Gagne's Nine Events of Instruction, Backward Design, and Cognitive Load Theory. Used for 'learning objectives,' 'instructional design,' 'curriculum,' 'learning theory,' and related topics."
---

# Learning Design — Learning Design Methodology

Expert knowledge used by the curriculum-designer and content-writer agents when designing curricula and lesson plans.

## Why Learning Design Theory Matters

"I'll teach you this" and "I'll design this so you can learn it" are fundamentally different. Learning design is a **systematic educational structuring technique grounded in cognitive science**.

## Bloom's Taxonomy — Practical Application

### Six Cognitive Levels

| Level | Verbs | Learning Objective Example | Assessment Method |
|-------|-------|--------------------------|-------------------|
| 1. **Remember** | Define, list, identify | "List the 4 HTTP methods" | Multiple choice, fill-in-blank |
| 2. **Understand** | Explain, compare, summarize | "Explain the difference between REST and GraphQL" | Written response, comparison table |
| 3. **Apply** | Use, implement, execute | "Write a Flask route" | Coding lab |
| 4. **Analyze** | Classify, distinguish, examine | "Identify design issues in a given API" | Code review |
| 5. **Evaluate** | Judge, critique, recommend | "Argue which of two architectures is more appropriate" | Essay, discussion |
| 6. **Create** | Design, develop, build | "Design and implement your own REST API" | Project |

### Per-Lesson Bloom's Level Distribution

| Course Phase | Recommended Bloom's Levels | Proportion |
|-------------|--------------------------|-----------|
| Early (Lessons 1-3) | 1-2 (Remember, Understand) | 60% |
| Middle (Lessons 4-7) | 3-4 (Apply, Analyze) | 60% |
| Late (Lessons 8-10) | 4-6 (Analyze, Evaluate, Create) | 70% |

## Backward Design (Understanding by Design)

### UbD Three Stages

```
Step 1: Determine desired results -> "What should learners ultimately be able to do?"
Step 2: Determine assessment evidence -> "What tasks/assessments prove they can do it?"
Step 3: Plan learning experiences -> "What must they learn to pass those assessments?"
```

### Practical Application

```
[Wrong order]
"Let's teach Python variables" -> "How do we assess?" -> "Make some test questions"

[Correct order (Backward)]
"Learners should be able to build a simple calculator program"
-> "They submit a working calculator program"
-> "Therefore they need to learn variables, I/O, conditionals, and functions"
```

## Gagne's Nine Events of Instruction

Design each lesson's structure using these nine events:

| # | Event | Purpose | Practical Example (Programming Education) |
|---|-------|---------|------------------------------------------|
| 1 | **Gain Attention** | Motivate learning | "With just 3 lines of code, you can create a web server" |
| 2 | **State Objectives** | Set expectations | "By the end of this lesson, you will be able to..." |
| 3 | **Stimulate Prior Knowledge** | Connect to existing knowledge | "Remember the variables we covered last lesson?" |
| 4 | **Present Content** | Deliver new material | Lecture, demo, code walkthrough |
| 5 | **Provide Guidance** | Support understanding | Diagrams, analogies, step-by-step breakdowns |
| 6 | **Elicit Performance** | Hands-on practice | Guided lab, follow-along exercise |
| 7 | **Provide Feedback** | Confirm performance | Automated tests, code review, answer comparison |
| 8 | **Assess Performance** | Independent task | Quiz, mini project |
| 9 | **Enhance Retention & Transfer** | Apply in other contexts | "How would you use this concept in a real project?" |

## Cognitive Load Theory

### Three Types of Cognitive Load

| Type | Description | Management Strategy |
|------|-------------|-------------------|
| **Intrinsic** | Inherent complexity of the learning content | Chunking, prerequisite verification |
| **Extraneous** | Unnecessary load from poor design | Remove irrelevant information, improve structure |
| **Germane** | Cognitive effort contributing to learning | The goal is to maximize this |

### Cognitive Load Reduction Strategies

1. **Chunking Principle**: No more than 3 new concepts per lesson
2. **Redundancy Principle**: Don't present identical information in text + audio simultaneously (choose one)
3. **Spatial Contiguity Principle**: Place explanations near related diagrams
4. **Pre-training Principle**: Learn component parts before the complex process
5. **Progressive Complexity**: Start with simplified versions, gradually add complexity

## Learning Path Design Patterns

### Linear Path
```
L1 -> L2 -> L3 -> L4 -> Project
```
- Each lesson is a prerequisite for the next
- Best for: Cumulative skills (programming, mathematics)

### Hub and Spoke
```
      L2
     /
L1 -> L3 -> Project
     \
      L4
```
- After L1, L2/L3/L4 can be taken in any order
- Best for: Independent topics (design tools, marketing channels)

### Spiral
```
L1(basics) -> L2(basics) -> L3(basics) -> ...
L4(advanced) -> L5(advanced) -> L6(advanced) -> ...
^ Same topics revisited at deeper levels
```
- Revisit the same concepts with increasing depth
- Best for: Complex systems (database design, architecture)

## Learning Objective Writing Formula: ABCD

```
A (Audience): The learner
B (Behavior): will be able to [action verb]
C (Condition): given [condition]
D (Degree): to [success criterion]

Example: "Beginner learners (A) will be able to implement a CRUD API with Flask (B),
          referencing the official documentation (C), completing 4 endpoints within 30 minutes (D)"
```

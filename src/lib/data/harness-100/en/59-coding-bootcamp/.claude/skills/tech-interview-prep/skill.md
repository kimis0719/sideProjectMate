---
name: tech-interview-prep
description: "A specialized skill for systematically supporting developer technical interview preparation. Used by the mentor agent to prepare portfolio-based interview strategies, system design interviews, and behavioral interviews (STAR). Automatically applied in contexts such as 'technical interview', 'coding interview', 'system design', 'STAR interview', 'behavioral interview', 'developer interview prep'. However, conducting live mock interviews and providing company internal information are outside the scope of this skill."
---

# Tech Interview Prep — Developer Technical Interview Preparation Tool

A specialized skill that enhances the mentor agent's interview preparation support capabilities.

## Target Agent

- **mentor** — Project design, portfolio, career coaching

## Three Pillars of Technical Interviews

### 1. Coding Interview

#### Key Topics and Frequency

| Topic | Frequency | Essential Patterns |
|-------|----------|-------------------|
| Arrays/Strings | Very high | Two Pointers, Sliding Window |
| Hash Maps | High | Frequency counting, grouping |
| Trees/Graphs | High | DFS, BFS, shortest path |
| DP | Medium | Top-down, Bottom-up |
| Stacks/Queues | Medium | Monotone stack, BFS |
| Binary Search | Medium | Parametric Search |

#### Problem-Solving Framework (UMPIRE)

```
U - Understand: Fully understand the problem (ask about edge cases)
M - Match: Match to known patterns
P - Plan: Write pseudocode
I - Implement: Write the code
R - Review: Code review + time/space complexity analysis
E - Evaluate: Run test cases + discuss optimization
```

### 2. System Design Interview

#### Approach Framework (4 Steps)

```
[Step 1] Requirements Definition (5 min)
  - Functional requirements (3-5 core features)
  - Non-functional requirements (DAU, QPS, latency, availability)
  - Scale estimation (Back-of-the-envelope estimation)

[Step 2] High-Level Design (10 min)
  - Core component diagram
  - API design (RESTful endpoints)
  - Data model (schema design)

[Step 3] Detailed Design (15 min)
  - Identify and resolve bottlenecks
  - Scalability strategy (horizontal/vertical scaling)
  - Caching, messaging, CDN, etc.

[Step 4] Trade-off Discussion (5 min)
  - CAP theorem-based rationale
  - Comparison with alternatives
  - Monitoring/failure response
```

#### Key System Design Topics

| Topic | Key Points | Difficulty |
|-------|-----------|-----------|
| URL Shortener | Hash functions, collision handling, redirect | Beginner |
| Rate Limiter | Token Bucket, distributed counters | Beginner |
| Chat System | WebSocket, message queues, read receipts | Intermediate |
| News Feed | Fan-out, caching, ranking | Intermediate |
| Search Engine | Inverted index, distributed crawling | Advanced |
| Video Streaming | CDN, adaptive bitrate, transcoding | Advanced |

### 3. Behavioral Interview

#### STAR Framework

```
S - Situation: Describe the background/context (briefly)
T - Task: Your role/assignment (specifically)
A - Action: Actions taken (why + how)
R - Result: Outcomes (quantitative + lessons learned)
```

#### Key Question Types and Preparation Points

| Question Type | Example | Answer Focus |
|--------------|---------|-------------|
| Technical challenge | "Tell me about a difficult bug you solved" | Debugging process, systematic approach |
| Conflict resolution | "Describe a disagreement with a teammate" | Active listening, data-driven persuasion |
| Leadership | "Tell me about leading a team" | Goal setting, motivation |
| Failure experience | "What did you learn from a failure?" | Self-awareness, growth |
| Prioritization | "How do you handle multiple tasks?" | Time management, decision criteria |

## Portfolio-to-Interview Connection Strategy

### Project Presentation Framework

```markdown
### Project: [Project Name]

**Tech stack**: [Technologies used]
**Duration**: [Duration]
**Team size**: [N people, your role]

**Why did you choose this technology?**
-> [Alternatives compared + selection rationale]

**What was the most difficult technical challenge?**
-> [Problem -> attempts -> solution -> outcome]

**What would you do differently if you did it again?**
-> [Self-reflection + evidence of growth]

**Quantitative outcomes:**
-> [Performance improvement %, user count, code quality metrics]
```

## Interview Preparation Checklist

### Coding Interview (2-4 weeks before)
- [ ] Solve 2-3 problems for each of the 20 core patterns
- [ ] Practice under time constraints (45 min/problem)
- [ ] Practice explaining thought process out loud

### System Design (1-2 weeks before)
- [ ] Practice designing 6-8 major systems
- [ ] Practice back-of-the-envelope calculations
- [ ] Prepare trade-off discussions

### Behavioral Interview (1 week before)
- [ ] Prepare 5-7 STAR stories
- [ ] Prepare in-depth presentations on 3 projects
- [ ] Research each company's culture/values

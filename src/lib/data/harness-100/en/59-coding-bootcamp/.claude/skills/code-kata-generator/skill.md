---
name: code-kata-generator
description: "A specialized skill for systematically designing coding practice exercises (Code Kata). Used by the exercise-creator agent to create difficulty-tiered, concept-specific coding exercises with test cases and model solutions. Automatically applied in contexts such as 'coding exercises', 'algorithm problems', 'practice problems', 'kata', 'coding tests', 'programming practice'. However, online judge system integration (LeetCode, HackerRank) and automated grading infrastructure are outside the scope of this skill."
---

# Code Kata Generator — Coding Exercise Design Tool

A specialized skill that enhances the exercise-creator agent's exercise creation capabilities.

## Target Agent

- **exercise-creator** — Difficulty-tiered exercises, test cases, model solutions

## Exercise Difficulty System

### 5-Tier Difficulty Classification

| Tier | Name | Concepts | Est. Solving Time | Target Phase |
|------|------|----------|-------------------|-------------|
| T1 | Warm-up | Variables, conditionals, loops, functions | 5-15 min | Week 1-2 |
| T2 | Foundation | Arrays, strings, basic data structures | 15-30 min | Week 3-6 |
| T3 | Intermediate | Hash maps, stacks/queues, recursion, sorting | 30-60 min | Week 7-12 |
| T4 | Advanced | Trees, graphs, DP, binary search | 45-90 min | Week 13-20 |
| T5 | Challenge | Composite algorithms, system design | 60-120 min | Week 20+ |

## Exercise Template

```markdown
## [T{N}] {Exercise Name}

### Problem Description
{Clear problem statement}

### Input
- {Input format and constraints}

### Output
- {Output format}

### Examples
| Input | Output | Explanation |
|-------|--------|-------------|
| {Example 1 input} | {Example 1 output} | {Walkthrough} |
| {Example 2 input} | {Example 2 output} | |

### Constraints
- {Time/space complexity requirements}
- {Input size range}

### Hints (optional)
<details>
<summary>Show hint</summary>
{Directional hint}
</details>

### Test Cases
{Basic + edge + large-input cases}

### Model Solution
{Including time complexity and space complexity analysis}

### Learning Points
- {Concept learned from this problem}
- {Real-world application}
```

## Concept-to-Exercise Map

### Data Structures

| Concept | Required Exercise Types | Tier |
|---------|----------------------|------|
| Arrays | Two Pointers, Sliding Window | T2-T3 |
| Linked Lists | Reversal, merging, cycle detection | T2-T3 |
| Stacks | Bracket matching, histogram | T2-T3 |
| Queues | BFS, circular queue, priority queue | T3 |
| Hash Maps | Frequency counting, Two Sum, grouping | T2-T3 |
| Trees | Traversal, LCA, balance checking | T3-T4 |
| Graphs | DFS/BFS, shortest path, topological sort | T4-T5 |

### Algorithms

| Concept | Required Exercise Types | Tier |
|---------|----------------------|------|
| Sorting | Sort implementation, custom sorting | T2-T3 |
| Binary Search | Range search, Parametric Search | T3-T4 |
| Recursion | Fibonacci, permutations/combinations, divide & conquer | T3 |
| DP | Knapsack, LIS, grid paths | T4-T5 |
| Greedy | Activity selection, interval scheduling | T3-T4 |
| Backtracking | N-Queens, Sudoku, combinations | T4 |

## Test Case Design Principles

### Required Case Types

| Type | Purpose | Example |
|------|---------|---------|
| Basic | Verify normal operation | Same as problem examples |
| Minimum input | Lower boundary value | Empty array, length 1 |
| Maximum input | Performance verification | n = 10^5 |
| Edge | Special situations | All same values, negatives, 0 |
| Reverse/sorted | Sorting-related | Already sorted, reverse sorted |
| Duplicates | Duplicate handling | Many duplicate elements |

### Case Count Guide

| Tier | Public Cases | Hidden Cases | Performance Cases |
|------|-------------|-------------|-----------------|
| T1 | 3 | 3 | 0 |
| T2 | 3 | 5 | 1 |
| T3 | 3 | 7 | 2 |
| T4 | 3 | 8 | 3 |
| T5 | 3 | 10 | 5 |

## Exercise Sequencing Principles

### Scaffolding

Arrange exercises on the same topic progressively:

```
[T2] Find a specific value in an array (linear search)
  |
[T3] Find a value in a sorted array (binary search)
  |
[T3] Find a value in a rotated sorted array
  |
[T4] Find a value in a 2D sorted matrix
  |
[T4] Parametric Search (find optimal value satisfying a condition)
```

### Interleaving

Mix new concepts with previous ones:
- During hash map week -> include 1 array review exercise
- During tree week -> include 1 recursion review exercise

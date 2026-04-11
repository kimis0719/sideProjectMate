---
name: prior-art-search-strategy
description: "A strategic search methodology for patent prior art investigation. The 'prior-art-researcher' agent must use this skill's search strategies, classification code system, and analysis frameworks when searching prior art and determining novelty and inventive step. Used for 'prior art search', 'novelty determination', 'inventive step analysis', etc. Note: Claim drafting or specification writing is outside the scope of this skill."
---

# Prior Art Search Strategy — Prior Art Search Strategy Guide

Search strategies, IPC/CPC classification utilization, and analysis frameworks for systematic prior art investigation.

## 3-Phase Search Strategy Framework

### Phase 1: Invention Decomposition

```
Invention -> Technical Problem -> Solution Means -> Components

Decomposition Matrix:
| Component | Function | Relationship | Tech Field | Core Keywords |
|-----------|----------|-------------|-----------|--------------|
| A         | F1       | A->B        | Sensor    | sensor, detection |
| B         | F2       | B->C        | AI        | neural, learning |
| C         | F3       | C->Output   | Control   | control, adjust |
```

### Phase 2: Search Query Design

**Keyword Expansion Rules**
```
Core keyword -> Synonyms -> Broader concepts -> Narrower concepts

Example: "artificial intelligence"
  Synonyms: AI, machine learning, ML
  Broader: data processing, computer system
  Narrower: CNN, RNN, transformer, deep learning
```

**Search Query Structure**
```
(Component A keywords OR synonyms) AND
(Component B keywords OR synonyms) AND
(Function/Effect keywords OR synonyms)

Scope adjustment:
  Broad search: A AND B (2 elements)
  Medium search: A AND B AND C (3 elements)
  Narrow search: A AND B AND C AND D (4+ elements)
```

### Phase 3: Search Execution Order

| Order | Database | Purpose | Coverage |
|-------|----------|---------|---------|
| 1 | KIPRIS (Korean Patents) | Domestic prior art | Korean registrations/publications |
| 2 | Google Patents | Global overview | Worldwide patents |
| 3 | Espacenet (EPO) | Europe and PCT | EP, WO |
| 4 | USPTO (US) | US patents | US |
| 5 | Academic DB (Google Scholar) | Non-patent literature | Papers, theses |
| 6 | Web search | Publicly known technology | Products, blogs, news |

## IPC/CPC Classification Code Utilization

### Classification Codes by Major Technical Field

| Technical Field | IPC | Description |
|----------------|-----|-------------|
| IoT/Sensors | G01D, H04W | Measurement, wireless communication |
| AI/Machine Learning | G06N | Computer system-based models |
| Image Processing | G06T, G06V | Image data processing, recognition |
| Blockchain | H04L 9/00 | Cryptographic arrangements |
| Mobile Apps | G06F 3/04 | User interfaces |
| Batteries | H01M | Electrochemical energy |
| Autonomous Driving | B60W, G05D | Vehicle control, route control |
| Biotech | C12N, A61K | Genetic engineering, pharmaceuticals |

## Novelty and Inventive Step Judgment Framework

### Novelty Analysis Matrix

```
| Claim Element | Prior Art 1 | Prior Art 2 | Prior Art 3 |
|-------------- |------------|------------|------------|
| A: [element]  | O Same     | O Same     | X Absent   |
| B: [element]  | O Same     | X Absent   | O Same     |
| C: [element]  | X Absent   | O Same     | X Absent   |
| D: [element]  | X Absent   | X Absent   | X Absent   |

Judgment: If all elements exist in a single prior art -> No novelty
          If even one is missing -> Novelty may be recognized
```

### Inventive Step Analysis: TSM Test

```
T (Teaching): Does the prior art teach the combination?
S (Suggestion): Is there a suggestion to combine in the description?
M (Motivation): Does a person skilled in the art have motivation to combine?

Judgment flow:
1. Select the closest prior art (primary)
2. Identify differentiating elements
3. Search for secondary prior art containing the differentiating elements
4. Determine whether combination motivation exists
5. Check for unexpected effects from the combination
```

## Search Report Output Structure

```markdown
## Prior Art Search Report

### Search Strategy
- Search query: [Described]
- DB: [Databases used]
- Search results: [Number of results]

### Key Prior Art (Top 5)

#### [Prior Art 1] — [Document No.]
- **Title**: [Title of invention]
- **Filing/Publication Date**: [Date]
- **Key Technology**: [Summary]
- **Related Components**: A(O), B(O), C(X), D(X)
- **Differentiation**: [Difference from the present invention]

### Novelty and Inventive Step Comprehensive Opinion
- **Novelty**: [Recognized/Denied] — Basis: [Explanation]
- **Inventive Step**: [Recognized/Questionable] — Basis: [Explanation]
- **Design-Around Direction**: [Suggestion]
```

## Notes

- Utilizes KIPRIS, Google Patents, Espacenet
- Detailed search strategies: See `references/search-strategy-detail.md`

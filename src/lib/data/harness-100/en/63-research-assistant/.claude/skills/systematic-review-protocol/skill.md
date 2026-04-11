---
name: systematic-review-protocol
description: "A specialized skill providing PRISMA protocols and literature search strategies for systematic reviews. Used by the literature-searcher and critic-synthesizer agents when systematically searching, screening, and synthesizing academic literature. Automatically applied in contexts involving 'systematic review,' 'PRISMA,' 'literature search strategy,' 'inclusion/exclusion criteria,' or 'Boolean search.' Note: direct access to academic databases (Scopus, WoS) and meta-analysis statistical execution are outside the scope of this skill."
---

# Systematic Review Protocol

A specialized skill that enhances the literature review capabilities of the literature-searcher and critic-synthesizer agents.

## Target Agents

- **literature-searcher** — Search strategy, PRISMA flow diagram, inclusion/exclusion criteria
- **critic-synthesizer** — Critical appraisal, thematic synthesis, research gap identification

## PRISMA 2020 Flow Diagram

```
Identification
├── Database search: n = [X]
├── Registry search: n = [Y]
└── Other sources: n = [Z]
         |
    After deduplication: n = [A]
         |
Screening
├── Title/Abstract screening: n = [A]
│   └── Excluded: n = [B] (classified by reason)
│
Eligibility
├── Full-text assessment: n = [C]
│   └── Excluded: n = [D]
│       ├── Reason 1: n = [d1]
│       ├── Reason 2: n = [d2]
│       └── Reason 3: n = [d3]
│
Included
└── Final included: n = [E]
    ├── Quantitative studies: n = [e1]
    └── Qualitative studies: n = [e2]
```

## Search Strategy Design

### PICO/PICo Framework

**Quantitative Research (PICO):**

| Element | Definition | Example |
|---------|-----------|---------|
| P - Population | Target group | "University students," "Manufacturing workers" |
| I - Intervention | Intervention/exposure | "Flipped learning," "Remote work" |
| C - Comparison | Comparator | "Traditional lectures," "Office work" |
| O - Outcome | Outcome variable | "Academic achievement," "Productivity" |

**Qualitative Research (PICo):**

| Element | Definition |
|---------|-----------|
| P - Population | Target group |
| I - Interest | Phenomenon of interest |
| Co - Context | Context/environment |

### Boolean Search Query Construction

```
("flipped learning" OR "flipped classroom" OR "inverted classroom")
AND
("motivation" OR "learning motivation" OR "academic motivation" OR "intrinsic motivation")
AND
("higher education" OR "university" OR "college" OR "undergraduate")
```

### Search Query Design Principles

| Principle | Method |
|-----------|--------|
| Include synonyms | Connect with OR |
| Cross concepts | Connect with AND |
| Expanded search | Use truncation (*): learn* -> learning, learner, learned |
| Phrase search | Use quotation marks: "flipped classroom" |
| Limiters | Year, language, document type filters |

### Database-Specific Search Strategies

| Database | Field | Characteristics |
|----------|-------|----------------|
| Google Scholar | General | Wide coverage, includes grey literature |
| PubMed | Medicine/Health | Leverage MeSH terms |
| Scopus | Multidisciplinary | Excellent citation analysis |
| Web of Science | Multidisciplinary | JCR Impact Factors |
| ERIC | Education | Education-specific thesaurus |
| IEEE Xplore | Engineering/IT | Includes conference papers |
| RISS | Korean Academic | Domestic papers/dissertations |

## Inclusion/Exclusion Criteria

```markdown
### Inclusion Criteria

| Criterion | Details |
|-----------|---------|
| Publication period | 2015-2025 |
| Language | English, Korean |
| Study design | Experimental, quasi-experimental, survey |
| Population | University students |
| Intervention | Flipped learning application |
| Outcome variable | Includes learning motivation measurement |
| Publication type | Peer-reviewed journal |

### Exclusion Criteria

| Criterion | Details | Rationale |
|-----------|---------|-----------|
| Protocol only | No results | No data |
| Conference abstracts | Insufficient detail | Cannot verify methodology |
| K-12 population | Different context | Scope limitation |
```

## Literature Quality Assessment Tools

### Quantitative Study Quality Assessment (Simplified)

| Criterion | High | Medium | Low |
|-----------|------|--------|-----|
| Sample size | Adequate (power analysis) | Moderate | Insufficient |
| Random assignment | Yes | Quasi-experimental | Non-experimental |
| Valid measurement tool | Validated instrument | Modified instrument | Self-developed |
| Statistical method appropriateness | Appropriate | Partially appropriate | Inappropriate |
| Attrition rate | < 10% | 10-20% | > 20% |

### Qualitative Study Quality Assessment

| Criterion | Guiding Question |
|-----------|-----------------|
| Clarity of purpose | Is the research question clear? |
| Methodological appropriateness | Is the qualitative method suitable? |
| Research design | Is the design aligned with the purpose? |
| Data collection | Is the data sufficiently in-depth? |
| Analytical rigor | Is the analysis process transparent? |
| Researcher reflexivity | Has the researcher reflected on their influence? |

## Thematic Synthesis

### 3-Stage Synthesis Process

```
Stage 1: Coding (Line-by-line coding)
  -> Extract key findings from each study as codes

Stage 2: Descriptive Themes
  -> Group similar codes to form descriptive themes

Stage 3: Analytical Themes
  -> Derive interpretive insights that go beyond descriptive themes
```

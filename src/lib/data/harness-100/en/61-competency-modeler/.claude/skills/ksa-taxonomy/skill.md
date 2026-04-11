---
name: ksa-taxonomy
description: "A specialized skill for building KSA (Knowledge, Skill, Ability) taxonomies in job analysis and mapping them to NCS/O*NET standards. Used by the job-analyst and competency-architect agents when writing job descriptions and systematically classifying competencies. Automatically applied in contexts involving 'KSA analysis,' 'job description,' 'NCS,' 'O*NET,' 'task analysis,' or 'competency classification system.' Note: actual NCS system access or HR system data integration is outside the scope of this skill."
---

# KSA Taxonomy — KSA Classification System and Standards Mapping Tool

A specialized skill that enhances the job analysis capabilities of the job-analyst and competency-architect agents.

## Target Agents

- **job-analyst** — Job analysis, KSA extraction
- **competency-architect** — Competency definition, classification system design

## KSA Framework

### K-S-A-O Definitions

| Category | Definition | Examples |
|----------|-----------|----------|
| **K**nowledge | Theoretical and factual understanding required for the job | Programming language syntax, accounting principles |
| **S**kill | Execution abilities acquired through training | Code debugging, financial statement preparation |
| **A**bility | Cognitive or physical capacities that are innate or developed over time | Logical thinking, communication ability |
| **O**ther Characteristics | Personality, values, motivation, etc. | Conscientiousness, stress tolerance |

### Job Description (JD) Standard Structure

```markdown
## Job Description

### Basic Information
- Job Title:
- Job Family/Track:
- Grade Range:
- Reporting Structure:

### Job Purpose
[1-2 sentences describing why this job exists]

### Key Tasks
1. [Task name] — [Frequency] [Importance H/M/L]
2. [Task name] — [Frequency] [Importance]
...

### Required KSAs
#### Knowledge
- [Knowledge item] — [Level: Basic/Intermediate/Expert]

#### Skill
- [Skill item] — [Level: Basic/Intermediate/Expert]

#### Ability
- [Ability item] — [Level: Basic/Intermediate/Expert]

### Qualifications
- Education:
- Experience:
- Certifications/Licenses:
```

## Competency Classification System

### 3-Layer Competency Structure

```
[Core Competencies] — Common across all roles
  e.g., Communication, Problem-solving, Teamwork, Ethics
      |
[Job Family Competencies] — Shared within a job family
  e.g., (Engineering Family) Code quality, Technology trend awareness
      |
[Job-Specific Competencies] — Unique to the specific role
  e.g., (Backend Developer) API design, DB optimization, System architecture
```

### Proficiency Level Framework (5 Levels)

| Level | Label | Definition | Grade Mapping (Example) |
|-------|-------|-----------|------------------------|
| L1 | Novice | Performs tasks as directed | Staff |
| L2 | Practitioner | Performs tasks independently | Associate/Senior Associate |
| L3 | Skilled | Resolves non-routine situations | Manager/Senior Manager |
| L4 | Expert | Contributes to the organization, mentors others | Director/Team Lead |
| L5 | Master | Drives innovation, makes strategic decisions | Executive level |

## NCS (National Competency Standards) Mapping

### NCS Classification System

```
Major Category (24) > Middle Category (80) > Minor Category (257) > Sub-category (1,022)
Example: Information & Communication > Information Technology > IT Development > Application SW Engineering
```

### NCS Competency Unit Structure

| Component | Description |
|-----------|-------------|
| Competency Unit | A unit-level competency required for job performance |
| Competency Unit Element | Sub-components of a competency unit |
| Performance Criteria | Success criteria for each element |
| Knowledge/Skills/Attitudes | Detailed KSA items |
| Scope and Conditions | Performance environment |

## O*NET Mapping (Global Standard)

### O*NET Content Model Key Categories

| Category | Sub-items | Purpose |
|----------|-----------|---------|
| Worker Characteristics | Abilities, Interests, Values | Fit assessment |
| Worker Requirements | Skills, Knowledge, Education | Qualification requirements |
| Experience Requirements | Experience, Training, Licensing | Hiring criteria |
| Occupational Requirements | Work Activities, Work Context | Work environment |

### General Competency Dictionary (Reference)

| Competency | Definition | Behavioral Indicator Examples |
|-----------|-----------|------------------------------|
| Analytical Thinking | Decomposes complex problems into components for resolution | Data-driven decision-making, root cause analysis |
| Communication | Conveys information clearly and effectively | Writing, presentations, active listening |
| Collaboration | Works effectively with others | Conflict resolution, feedback, role allocation |
| Customer Orientation | Identifies and fulfills customer needs | Empathy, service quality, complaint handling |
| Innovation | Generates and implements new ideas | Improvement proposals, experimentation, change acceptance |
| Leadership | Sets direction and guides others | Vision, motivation, delegation |
| Self-Development | Continuously learns and grows | Feedback acceptance, learning plans, reflection |

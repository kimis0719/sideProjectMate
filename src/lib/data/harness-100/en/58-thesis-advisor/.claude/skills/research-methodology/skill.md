---
name: research-methodology
description: "A specialized skill providing a detailed framework for academic research methodology design. Used by the methodology-expert agent when designing quantitative, qualitative, or mixed-methods research and selecting samples, instruments, and analysis methods. Automatically applied in contexts such as 'research methodology', 'research design', 'sample design', 'measurement instruments', 'validity and reliability', 'statistical analysis methods'. However, running statistical software (SPSS, R) directly and filing IRB applications are outside the scope of this skill."
---

# Research Methodology — Research Methodology Design Framework

A specialized skill that enhances the methodology-expert agent's research design capabilities.

## Target Agent

- **methodology-expert** — Research design, sample, instrument, and analysis method selection

## Research Design Type Selection Matrix

### Research Question -> Design Type Mapping

| Research Question Type | Suitable Design | Data Type |
|-----------------------|----------------|-----------|
| "What is ~?" (exploratory) | Qualitative (grounded theory, phenomenology) | Interviews, observation |
| "What is the relationship between ~?" (correlational) | Quantitative (survey, secondary data) | Numerical data |
| "Does ~ affect ~?" (causal) | Experimental / quasi-experimental | Experimental data |
| "How is ~ experienced?" (phenomenological) | Phenomenological research | In-depth interviews |
| "How has ~ developed?" (process) | Grounded theory, case study | Multiple sources |
| "For an integrated understanding of ~?" | Mixed methods | Quantitative + qualitative |

### Quantitative Research Designs

| Design Type | Characteristics | Internal Validity | Application |
|------------|----------------|------------------|-------------|
| True experiment (RCT) | Random assignment + control group | High | Medicine, educational interventions |
| Quasi-experiment | Non-random + control/comparison group | Medium | Field education research |
| Non-experimental (survey) | Observational, correlational | Low | Exploratory, descriptive |
| Longitudinal | Tracks changes over time | Medium | Developmental, panel studies |
| Cross-sectional | Single-point measurement | Low | Status assessment |

### Qualitative Research Designs

| Design Type | Purpose | Data Collection | Participant Count |
|------------|---------|----------------|-------------------|
| Phenomenology | Explore the essence of experience | In-depth interviews | 5-25 |
| Grounded theory | Generate theory | Interviews, observation | 20-30 |
| Case study | Understand phenomena in context | Multiple sources | 1-10 cases |
| Ethnography | Understand cultural context | Participant observation | Extended period |
| Narrative | Personal experience narrative | Life history interviews | 1-5 |

## Sample Design

### Quantitative Sample Size Calculation

```
n = (Z^2 x p x (1-p)) / e^2

Z = Confidence level (95% -> 1.96, 99% -> 2.576)
p = Expected proportion (if unknown, use 0.5)
e = Margin of error (typically +/-5% = 0.05)
```

| Population | 95% conf, +/-5% | 95% conf, +/-3% |
|-----------|-----------------|------------------|
| 100 | 80 | 92 |
| 500 | 217 | 341 |
| 1,000 | 278 | 516 |
| 10,000 | 370 | 964 |
| 100,000+ | 384 | 1,067 |

### Minimum Sample for Regression Analysis

```
N >= 50 + 8 x (number of independent variables)  (Tabachnick & Fidell)
or
N >= 15 x (number of independent variables)  (Stevens)
```

## Measurement Instrument Validity and Reliability

### Validity

| Type | Verification Method | Criterion |
|------|-------------------|----------|
| Content validity | Expert panel review (CVI) | CVI >= 0.80 |
| Construct validity | Factor analysis (EFA/CFA) | Factor loading >= 0.40 |
| Convergent validity | AVE | AVE >= 0.50 |
| Discriminant validity | sqrt(AVE) > correlation | Fornell-Larcker criterion |
| Criterion validity | Correlation with external criterion | r >= 0.40 |

### Reliability

| Type | Verification Method | Criterion |
|------|-------------------|----------|
| Internal consistency | Cronbach's alpha | alpha >= 0.70 |
| Composite reliability | CR (SEM) | CR >= 0.70 |
| Test-retest | Repeated measurement with same instrument | r >= 0.70 |
| Inter-rater | Cohen's Kappa | kappa >= 0.60 |

## Analysis Method Selection Guide

### Research Purpose -> Analysis Method

| Research Purpose | Independent Variable | Dependent Variable | Analysis Method |
|-----------------|--------------------|--------------------|----------------|
| Difference test (2 groups) | Categorical | Continuous | t-test |
| Difference test (3+ groups) | Categorical | Continuous | ANOVA |
| Relationship analysis | Continuous | Continuous | Correlation analysis |
| Impact analysis | Continuous/Categorical | Continuous | Regression analysis |
| Structural relationships | Latent variables | Latent variables | SEM |
| Group classification | Continuous/Categorical | Categorical | Logistic regression |
| Categorical relationship | Categorical | Categorical | Chi-square test |

### Alternatives When Assumptions Are Violated

| Assumption | Alternative |
|-----------|------------|
| Normality | Mann-Whitney, Kruskal-Wallis |
| Equal variance | Welch's t-test, Games-Howell |
| Independence | Repeated measures ANOVA, paired t-test |
| Linearity | Nonlinear regression, variable transformation |

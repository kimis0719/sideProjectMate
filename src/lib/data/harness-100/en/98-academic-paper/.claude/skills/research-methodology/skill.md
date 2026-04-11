---
name: research-methodology
description: "Research methodology guide. Referenced by the research-designer and statistical-analyst agents when selecting research designs and analysis methods. Use for 'research methodology', 'experiment design', or 'statistical analysis' requests. Actual data collection and IRB review processing are out of scope."
---

# Research Methodology — Research Methodology Guide

Enhances the methodology design capabilities of the research-designer and statistical-analyst agents.

## Research Design Types

### Quantitative Research

| Design | Purpose | Variable Control | Causal Inference |
|--------|---------|-----------------|-----------------|
| Experiment (RCT) | Verify causation | High | Strong |
| Quasi-experiment | Causation (limited control) | Medium | Medium |
| Correlational Study | Identify relationships | Low | Weak |
| Survey | Assess current status | None | None |
| Longitudinal Study | Change over time | Varies | Medium |

### Qualitative Research

| Design | Purpose | Data Collection |
|--------|---------|----------------|
| Case Study | Deep contextual understanding | Interviews, observation, documents |
| Grounded Theory | Theory generation | Interviews, field notes |
| Phenomenology | Essence of experience | In-depth interviews |
| Ethnography | Cultural/group understanding | Participant observation |

### Mixed Methods

```
Sequential: Quantitative -> Qualitative (explain results)
            Qualitative -> Quantitative (generate hypotheses)
Concurrent: Quantitative + Qualitative (triangulation)
```

## Sampling Design

### Sample Size Calculation

```
Quantitative (mean comparison):
  n = (Z_alpha/2 + Z_beta)^2 x 2*sigma^2 / d^2

  Z_alpha/2 = 1.96 (significance level 0.05)
  Z_beta = 0.84 (power 80%)
  sigma = standard deviation (from prior research)
  d = effect size (minimum meaningful difference)

Survey:
  n = Z^2 x p(1-p) / e^2
  Z = 1.96, p = 0.5 (maximum variance), e = margin of error

  e.g.: 95% confidence, 5% margin -> n = 384 participants
```

### Sampling Methods

| Method | Description | Suitable For |
|--------|------------|-------------|
| Simple Random | Random from population | Small, homogeneous populations |
| Stratified | Proportional by subgroup | Heterogeneous populations |
| Cluster | By natural group unit | Region-based surveys |
| Convenience | Accessible participants | Exploratory research (limited) |

## Statistical Analysis Method Selection

### Analysis Method Decision Tree

```
Q1: Variable type?
+-- Continuous -> Q2
+-- Categorical -> Q3

Q2: Number of comparison groups?
+-- 1-2 -> t-test (independent/paired)
+-- 3+ -> ANOVA
+-- Relationship analysis -> Regression/Correlation

Q3: Number of variables?
+-- 2 -> Chi-square
+-- 3+ -> Logistic regression
```

### Key Statistical Methods Summary

| Method | Purpose | Requirements | Reported Items |
|--------|---------|-------------|---------------|
| t-test | Compare 2 group means | Normality, equal variance | t, df, p, Cohen's d |
| ANOVA | Compare 3+ group means | Normality, equal variance | F, df, p, partial eta-squared |
| Chi-square | Categorical variable relationship | Expected frequency >= 5 | chi-square, df, p, Cramer's V |
| Correlation | Relationship between 2 variables | Linearity | r, p |
| Regression | Prediction/explanation | Linearity, independence | beta, R-squared, p, VIF |

### Effect Size Guide

| Metric | Small | Medium | Large |
|--------|-------|--------|-------|
| Cohen's d | 0.2 | 0.5 | 0.8 |
| r (correlation) | 0.1 | 0.3 | 0.5 |
| partial eta-squared (ANOVA) | 0.01 | 0.06 | 0.14 |
| R-squared (regression) | 0.02 | 0.13 | 0.26 |

## Research Ethics

### IRB Considerations

| Item | Verification |
|------|-------------|
| Informed Consent | Research purpose, procedure, risks, voluntariness |
| Personal Data | De-identification, retention period, destruction |
| Vulnerable Populations | Special protections for minors, patients |
| Conflicts of Interest | Funding source, interest disclosure |

## Quality Checklist

| Item | Criteria |
|------|----------|
| Research Question | PICO or SPIDER structure |
| Design Fit | Design matches the research question |
| Sampling | Calculation basis + sampling method |
| Analysis Method | Suited to data characteristics |
| Effect Size | Statistical significance + practical meaning |
| Ethics | IRB approval or exemption justification |

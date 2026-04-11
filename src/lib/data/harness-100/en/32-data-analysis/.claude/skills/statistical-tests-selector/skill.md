---
name: statistical-tests-selector
description: "Statistical test selection decision tree, per-test assumptions/formulas/interpretation guide, effect size, and power analysis. Use this skill for statistical analysis method selection involving 'statistical test', 't-test', 'ANOVA', 'chi-squared', 'correlation analysis', 'p-value', 'hypothesis testing', 'normality test', 'nonparametric test', 'effect size', etc. Enhances the analyst's statistical analysis capabilities. Note: data cleaning and visualization are outside this skill's scope."
---

# Statistical Tests Selector — Statistical Test Selection Guide

A guide for selecting and interpreting appropriate statistical tests based on data type and analysis purpose.

## Test Selection Decision Tree

```
What are you comparing?
├── Mean difference between two groups
│   ├── Independent samples → Normal? → Yes: Independent t-test
│   │                                  → No: Mann-Whitney U
│   └── Paired samples → Normal? → Yes: Paired t-test
│                                 → No: Wilcoxon signed-rank
├── Mean difference among three or more groups
│   ├── Independent → Normal? → Yes: One-way ANOVA → Post-hoc: Tukey HSD
│   │                          → No: Kruskal-Wallis → Post-hoc: Dunn
│   └── Repeated measures → Repeated Measures ANOVA / Friedman
├── Relationship between two variables
│   ├── Continuous × Continuous → Linear? → Yes: Pearson correlation
│   │                                      → No: Spearman rank correlation
│   └── Categorical × Categorical → Chi-squared independence test
├── Proportion difference
│   ├── Two groups → Z-test (proportions)
│   └── Three or more groups → Chi-squared homogeneity test
└── Distribution testing
    ├── Normality → Shapiro-Wilk (n<5000) / K-S test
    └── Homogeneity of variance → Levene's test / Bartlett's test
```

## Core Test Details

### Independent Samples t-test

```python
from scipy import stats

# Assumption checks
# 1. Normality
stat, p = stats.shapiro(group_a)
print(f"Normality test: p={p:.4f}")

# 2. Homogeneity of variance
stat, p = stats.levene(group_a, group_b)
print(f"Levene's test: p={p:.4f}")

# Conduct test
if levene_p >= 0.05:
    t, p = stats.ttest_ind(group_a, group_b)  # Equal variance
else:
    t, p = stats.ttest_ind(group_a, group_b, equal_var=False)  # Welch's

# Effect size (Cohen's d)
d = (group_a.mean() - group_b.mean()) / np.sqrt(
    ((len(group_a)-1)*group_a.std()**2 + (len(group_b)-1)*group_b.std()**2)
    / (len(group_a) + len(group_b) - 2)
)
```

### Effect Size Interpretation

| Metric | Small | Medium | Large |
|--------|-------|--------|-------|
| Cohen's d | 0.2 | 0.5 | 0.8 |
| Pearson r | 0.1 | 0.3 | 0.5 |
| eta-squared (η²) | 0.01 | 0.06 | 0.14 |
| Cramer's V | 0.1 | 0.3 | 0.5 |

### ANOVA + Post-hoc Tests

```python
# One-way ANOVA
f_stat, p = stats.f_oneway(group_a, group_b, group_c)

if p < 0.05:
    # Post-hoc test (which groups differ?)
    from statsmodels.stats.multicomp import pairwise_tukeyhsd
    tukey = pairwise_tukeyhsd(
        endog=all_values, groups=all_labels, alpha=0.05
    )
    print(tukey.summary())
```

### Chi-squared Test

```python
# Independence test (categorical × categorical)
contingency = pd.crosstab(df['gender'], df['purchase'])
chi2, p, dof, expected = stats.chi2_contingency(contingency)

# Effect size (Cramer's V)
n = contingency.sum().sum()
v = np.sqrt(chi2 / (n * (min(contingency.shape) - 1)))
```

## Multiple Comparison Correction

| Method | Conservatism | Formula | Usage |
|--------|-------------|---------|-------|
| Bonferroni | Very conservative | α/n | Few comparisons |
| Holm-Bonferroni | Conservative | Stepwise adjustment | General purpose |
| Benjamini-Hochberg | Less conservative | FDR control | Exploratory analysis |
| Tukey HSD | Moderate | ANOVA post-hoc | All pairwise comparisons |

```python
from statsmodels.stats.multitest import multipletests

reject, pvals_corrected, _, _ = multipletests(
    p_values, alpha=0.05, method='holm'
)
```

## Power Analysis

```python
from statsmodels.stats.power import TTestIndPower

analysis = TTestIndPower()

# Required sample size calculation
n = analysis.solve_power(
    effect_size=0.5,    # Cohen's d = 0.5 (medium effect)
    alpha=0.05,         # Significance level
    power=0.8,          # 80% power
    alternative='two-sided'
)
print(f"Required sample size per group: {int(np.ceil(n))}")
```

| Effect Size | Required n for 80% Power (per group) |
|------------|--------------------------------------|
| d = 0.2 (small) | 394 |
| d = 0.5 (medium) | 64 |
| d = 0.8 (large) | 26 |

## Correct Interpretation of p-values

```
When p = 0.03:

✅ Correct interpretation:
"Under the null hypothesis, the probability of observing results this extreme is 3%."

❌ Incorrect interpretations:
"The probability that the alternative hypothesis is true is 97%." (Not Bayesian)
"The effect is large." (Effect size is measured separately)
"The result is important." (Statistical significance ≠ practical importance)
```

## Reporting Template

```markdown
### Analysis: A/B Group Conversion Rate Comparison

**Hypothesis**: The new design (B) has a higher conversion rate than the original (A)
**Test**: Two-sample proportion z-test (one-tailed)
**Sample**: A: n=1000, conversion 5.2% | B: n=1000, conversion 6.8%
**Result**: z=1.58, p=0.057, 95% CI: [-0.05%, 3.25%]
**Effect Size**: h=0.067 (small)
**Conclusion**: Not statistically significant at the 5% level (p=0.057).
         Power analysis: To achieve 80% power at this effect size,
         n=3,500 per group is needed. Sample expansion recommended.
```

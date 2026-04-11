---
name: feature-engineering-cookbook
description: "Feature engineering techniques catalog: numeric/categorical/time-series/text transformations, feature selection, feature store design. Use this skill for data preprocessing and feature design involving 'feature engineering', 'variable transformation', 'encoding', 'scaling', 'feature selection', 'feature store', 'feature importance', etc. Enhances the data-engineer's feature engineering capabilities. Note: model design and training management are outside this skill's scope."
---

# Feature Engineering Cookbook — Feature Engineering Techniques Catalog

Transformation techniques by data type, feature selection methods, and feature store design guide.

## Numeric Transformations

### Scaling

| Method | Formula | Suitable | Not Suitable |
|--------|---------|----------|-------------|
| StandardScaler | (x - μ) / σ | Normal distribution, SVM, logistic regression | Sensitive to outliers |
| MinMaxScaler | (x - min) / (max - min) | [0,1] required, neural networks | Sensitive to outliers |
| RobustScaler | (x - Q2) / (Q3 - Q1) | When outliers exist | — |
| PowerTransformer | Box-Cox / Yeo-Johnson | Highly skewed distributions | Negative values (Box-Cox) |
| QuantileTransformer | Quantile-based | Uniform/normal distribution transformation | Destroys order relationships |

### Binning (Discretization)

```python
# Equal Width
pd.cut(df['age'], bins=5)

# Equal Frequency
pd.qcut(df['income'], q=5)

# Domain-based
bins = [0, 18, 30, 50, 65, 100]
labels = ['Minor', 'Young Adult', 'Middle-aged', 'Senior', 'Elderly']
pd.cut(df['age'], bins=bins, labels=labels)
```

### Mathematical Transformations

```python
# Log transformation (right-skewed distribution)
df['log_income'] = np.log1p(df['income'])

# Square root (count data)
df['sqrt_count'] = np.sqrt(df['count'])

# Reciprocal (inverse relationship)
df['inv_distance'] = 1 / (df['distance'] + 1)
```

## Categorical Encoding

| Method | Cardinality | Order | Tree Models | Linear Models |
|--------|------------|-------|------------|--------------|
| Label Encoding | Any | Yes | ✅ | ❌ |
| One-Hot Encoding | Low (<20) | No | ✅ | ✅ |
| Target Encoding | High | N/A | ✅ | ✅ |
| Frequency Encoding | High | N/A | ✅ | ✅ |
| Binary Encoding | Medium | N/A | ✅ | ✅ |
| Ordinal Encoding | Any | Yes | ✅ | ✅ |

### Target Encoding (Overfitting Prevention)

```python
from sklearn.model_selection import KFold

def target_encode_cv(train, col, target, n_folds=5):
    """K-Fold based target encoding — prevents data leakage"""
    global_mean = train[target].mean()
    encoded = pd.Series(index=train.index, dtype=float)

    kf = KFold(n_splits=n_folds, shuffle=True, random_state=42)
    for train_idx, val_idx in kf.split(train):
        means = train.iloc[train_idx].groupby(col)[target].mean()
        encoded.iloc[val_idx] = train.iloc[val_idx][col].map(means)

    encoded.fillna(global_mean, inplace=True)
    return encoded
```

## Time-Series Features

```python
# Date decomposition
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month
df['dayofweek'] = df['date'].dt.dayofweek
df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
df['hour'] = df['date'].dt.hour
df['is_business_hour'] = df['hour'].between(9, 18).astype(int)

# Cyclic encoding (periodic variables like month, hour)
df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

# Lag features
df['sales_lag_1'] = df['sales'].shift(1)
df['sales_lag_7'] = df['sales'].shift(7)

# Rolling statistics
df['sales_ma_7'] = df['sales'].rolling(7).mean()
df['sales_std_7'] = df['sales'].rolling(7).std()
```

## Feature Selection Methods

### Filter Methods

| Method | Numeric→Numeric | Categorical→Numeric | Numeric→Categorical |
|--------|----------------|--------------------|--------------------|
| Pearson Correlation | ✅ | — | — |
| Mutual Information (MI) | ✅ | ✅ | ✅ |
| Chi-squared | — | — | ✅ |
| ANOVA F-test | — | — | ✅ |
| Variance-based | ✅ (remove var=0) | — | — |

### Wrapper/Embedded Methods

```python
# Tree-based feature importance
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier().fit(X, y)
importances = pd.Series(model.feature_importances_, index=X.columns)
top_features = importances.nlargest(20).index

# Permutation Importance (model-agnostic)
from sklearn.inspection import permutation_importance
result = permutation_importance(model, X_test, y_test, n_repeats=10)

# SHAP (interpretable feature importance)
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
shap.summary_plot(shap_values, X_test)
```

## Missing Value Treatment Decision

```
Check missing ratio
├── < 5%: Remove or simple imputation (mean/median/mode)
├── 5~30%: Model-based imputation (KNN, MICE, tree-based)
├── 30~50%: Use missingness as a feature + imputation
│           df['col_missing'] = df['col'].isna().astype(int)
└── > 50%: Consider column removal (check business importance)
```

## Data Leakage Prevention Checklist

- [ ] No features derived from the target variable?
- [ ] No features using future information?
- [ ] Encoding/scaling was not done before train/test split?
- [ ] CV was applied to Target Encoding?
- [ ] Time-series data does not reference future data?

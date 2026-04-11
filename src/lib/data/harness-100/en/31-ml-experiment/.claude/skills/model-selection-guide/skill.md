---
name: model-selection-guide
description: "ML model selection matrix by problem type, hyperparameter tuning strategies, and ensemble methodology guide. Use this skill for ML model selection and design involving 'model selection', 'algorithm comparison', 'hyperparameter tuning', 'Optuna', 'ensemble', 'XGBoost vs LightGBM', 'model comparison', 'cross-validation', etc. Enhances the model-designer and evaluation-analyst's model design capabilities. Note: data preprocessing and training infrastructure management are outside this skill's scope."
---

# Model Selection Guide — ML Model Selection Matrix Guide

Optimal model selection and tuning strategies based on problem type, data characteristics, and constraints.

## Model Recommendations by Problem Type

### Tabular Data

| Problem Type | Baseline | Best Candidates | Notes |
|-------------|----------|----------------|-------|
| Binary Classification | LogisticRegression | XGBoost, LightGBM | Tree-based usually optimal |
| Multi-class Classification | LogisticRegression(OVR) | LightGBM, CatBoost | CatBoost: many categoricals |
| Regression | LinearRegression | XGBoost, LightGBM | RandomForest: overfitting prevention |
| Ranking | — | LambdaMART (LightGBM) | Search/recommendation |
| Anomaly Detection | IsolationForest | AutoEncoder, LOF | Unsupervised/semi-supervised |
| Time Series | ARIMA | Prophet, LightGBM | Feature-based time-series: trees |

### Unstructured Data

| Data | Model | Framework |
|------|-------|-----------|
| Image | ResNet, EfficientNet, ViT | PyTorch, timm |
| Text | BERT, RoBERTa | HuggingFace Transformers |
| Audio | Whisper, Wav2Vec | HuggingFace |
| Graph | GCN, GAT | PyG, DGL |

## XGBoost vs LightGBM vs CatBoost

| Criterion | XGBoost | LightGBM | CatBoost |
|-----------|---------|----------|----------|
| Speed | Medium | Fast | Slow |
| Memory | High | Low | Medium |
| Categorical Handling | Encoding required | Built-in support | Best performance |
| Missing Value Handling | Built-in | Built-in | Built-in |
| Overfitting Prevention | regularization | GOSS, EFB | Ordered Boosting |
| GPU Support | ✅ | ✅ | ✅ |
| Default Recommendation | General purpose | Large data, speed priority | Many categoricals |

## Hyperparameter Tuning

### Optuna Basic Structure

```python
import optuna

def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
    }
    model = XGBClassifier(**params)
    score = cross_val_score(model, X, y, cv=5, scoring='f1').mean()
    return score

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

### Tuning Priority

```
LightGBM tuning order:
Stage 1 (High impact): learning_rate, n_estimators, num_leaves
Stage 2 (Medium impact): max_depth, min_child_samples, subsample
Stage 3 (Low impact): reg_alpha, reg_lambda, colsample_bytree
Stage 4 (Fine-tuning): min_split_gain, path_smooth
```

## Cross-Validation Strategies

| Strategy | Suitable For | Code |
|----------|-------------|------|
| K-Fold | General (sufficient data) | `KFold(n_splits=5)` |
| Stratified K-Fold | Imbalanced classification | `StratifiedKFold(n_splits=5)` |
| Time Series Split | Time series | `TimeSeriesSplit(n_splits=5)` |
| Group K-Fold | Prevent group data leakage | `GroupKFold(n_splits=5)` |
| Repeated K-Fold | More stable estimation | `RepeatedKFold(n_splits=5, n_repeats=3)` |

## Ensemble Methods

### Stacking

```python
from sklearn.ensemble import StackingClassifier

estimators = [
    ('xgb', XGBClassifier()),
    ('lgbm', LGBMClassifier()),
    ('cat', CatBoostClassifier(verbose=0)),
]
stack = StackingClassifier(
    estimators=estimators,
    final_estimator=LogisticRegression(),
    cv=5
)
```

### Blending Weights

```python
# Optimal weight search
from scipy.optimize import minimize

def objective(weights):
    pred = sum(w * p for w, p in zip(weights, predictions))
    return -f1_score(y_true, pred > 0.5)

result = minimize(objective, x0=[1/3]*3, constraints={'type': 'eq', 'fun': lambda w: sum(w)-1})
```

## Model Selection Decision Tree

```
Data type?
├── Tabular
│   ├── Rows < 1,000 → Logistic Regression / SVM
│   ├── 1,000 < Rows < 1M → XGBoost / LightGBM
│   └── Rows > 1M → LightGBM (speed priority)
├── Image → CNN (EfficientNet, ViT)
├── Text → Transformer (BERT)
└── Time Series
    ├── Univariate → Prophet / ARIMA
    └── Multivariate → LightGBM (feature-based) / LSTM
```

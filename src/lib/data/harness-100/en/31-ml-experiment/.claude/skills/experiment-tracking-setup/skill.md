---
name: experiment-tracking-setup
description: "Guide for experiment tracking tool setup (MLflow, Weights & Biases, etc.), reproducibility assurance, model registry, and experiment comparison methodology. Use this skill for ML experiment management involving 'experiment tracking', 'MLflow', 'W&B', 'Weights and Biases', 'reproducibility', 'model registry', 'experiment comparison', 'hyperparameter logging', etc. Enhances the training-manager's experiment management capabilities. Note: model architecture design and feature engineering are outside this skill's scope."
---

# Experiment Tracking Setup — Experiment Tracking and Reproducibility Guide

A practical guide for ML experiment tracking, reproducibility assurance, and model version management.

## MLflow Setup

### Basic Structure

```python
import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("order-prediction")

with mlflow.start_run(run_name="xgboost-v2"):
    # Parameter logging
    mlflow.log_params({
        "model": "XGBClassifier",
        "n_estimators": 500,
        "max_depth": 6,
        "learning_rate": 0.1,
    })

    # Training
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    # Metric logging
    mlflow.log_metrics({
        "accuracy": accuracy_score(y_test, predictions),
        "f1": f1_score(y_test, predictions),
        "precision": precision_score(y_test, predictions),
        "recall": recall_score(y_test, predictions),
    })

    # Save model
    mlflow.sklearn.log_model(model, "model")

    # Save artifacts
    mlflow.log_artifact("confusion_matrix.png")
    mlflow.log_artifact("feature_importance.csv")
```

### Auto-logging

```python
# Framework-specific auto-logging
mlflow.sklearn.autolog()     # scikit-learn
mlflow.xgboost.autolog()     # XGBoost
mlflow.lightgbm.autolog()    # LightGBM
mlflow.pytorch.autolog()     # PyTorch
mlflow.tensorflow.autolog()  # TensorFlow
```

## Reproducibility Assurance Checklist

### Required Recording Items

```python
import platform, sys

reproducibility_info = {
    # Environment
    "python_version": sys.version,
    "os": platform.platform(),
    "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A",

    # Seeds
    "random_seed": 42,
    "numpy_seed": 42,
    "torch_seed": 42,

    # Data
    "data_version": "v2.1",
    "data_hash": hashlib.md5(open('data.csv','rb').read()).hexdigest(),
    "train_size": len(X_train),
    "test_size": len(X_test),
    "split_method": "StratifiedKFold(5)",

    # Code
    "git_commit": subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip(),
    "git_branch": subprocess.check_output(['git', 'branch', '--show-current']).decode().strip(),
}
mlflow.log_params(reproducibility_info)
```

### Seed Fixing

```python
import random, numpy as np, torch

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    os.environ['PYTHONHASHSEED'] = str(seed)
```

### Dependency Pinning

```bash
# requirements.txt with exact versions
pip freeze > requirements.txt

# pip-compile (recommended)
pip-compile requirements.in --generate-hashes

# conda
conda env export --no-builds > environment.yml
```

## Model Registry

### MLflow Model Registry Workflow

```
Experiment
└── Run
    └── Model Artifact
        └── Model Registration (Model Registry)
            ├── Stage: Staging → Validation
            ├── Stage: Production → Deployment
            └── Stage: Archived → Archive
```

```python
# Register model
mlflow.register_model(
    model_uri=f"runs:/{run_id}/model",
    name="order-prediction-model"
)

# Stage transition
client = mlflow.tracking.MlflowClient()
client.transition_model_version_stage(
    name="order-prediction-model",
    version=3,
    stage="Production"
)

# Load Production model
model = mlflow.pyfunc.load_model("models:/order-prediction-model/Production")
```

## Experiment Comparison Framework

### Statistical Verification

```python
from scipy import stats

# Compare 5-fold CV results
model_a_scores = [0.85, 0.87, 0.84, 0.86, 0.88]
model_b_scores = [0.82, 0.84, 0.83, 0.81, 0.85]

# Paired t-test
t_stat, p_value = stats.ttest_rel(model_a_scores, model_b_scores)
print(f"p-value: {p_value:.4f}")
if p_value < 0.05:
    print("Statistically significant difference")
```

### Experiment Comparison Table

```markdown
| Experiment | Model | F1 | Precision | Recall | Training Time | Inference Time |
|-----------|-------|-----|-----------|--------|--------------|---------------|
| exp-001 | LogReg (baseline) | 0.78 | 0.80 | 0.76 | 2s | 0.1ms |
| exp-002 | XGBoost | 0.85 | 0.87 | 0.83 | 45s | 0.5ms |
| exp-003 | LightGBM | 0.86 | 0.88 | 0.84 | 20s | 0.3ms |
| exp-004 | LightGBM + Optuna | 0.88 | 0.89 | 0.87 | 2h | 0.3ms |
| exp-005 | Stacking (top3) | 0.89 | 0.90 | 0.88 | 3h | 1.2ms |
```

## Project Structure Template

```
ml-project/
├── data/
│   ├── raw/              # Original data (do not modify)
│   ├── processed/        # Preprocessed
│   └── external/         # External data
├── notebooks/            # Exploratory analysis
├── src/
│   ├── data/             # Data loading/preprocessing
│   ├── features/         # Feature engineering
│   ├── models/           # Model definitions
│   └── evaluation/       # Evaluation logic
├── configs/              # Hyperparameter YAML
├── models/               # Trained models
├── reports/              # Analysis reports
├── requirements.txt
└── Makefile              # Reproducible execution
```

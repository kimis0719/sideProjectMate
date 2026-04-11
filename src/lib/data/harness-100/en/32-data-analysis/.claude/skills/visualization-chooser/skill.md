---
name: visualization-chooser
description: "Visualization type selection matrix by data type and analysis purpose, matplotlib/seaborn/plotly implementation pattern guide. Use this skill for data visualization design involving 'visualization selection', 'chart type', 'graph types', 'matplotlib', 'seaborn', 'plotly', 'heatmap', 'scatter plot', 'box plot', 'dashboard layout', etc. Enhances the visualizer's visualization design capabilities. Note: statistical analysis and data cleaning are outside this skill's scope."
---

# Visualization Chooser — Visualization Type Selection Matrix Guide

A framework for selecting optimal visualizations based on data type and communication purpose.

## Visualization Selection Matrix

### Comparison

| Purpose | Chart | Suitable | Example |
|---------|-------|----------|---------|
| Item comparison | Bar chart | 5-15 categories | Sales by product |
| Time trend comparison | Line chart | Continuous time, 2-5 series | Monthly sales trend |
| Part-to-whole | Stacked bar | Ratio comparison | Sales by channel share |
| Few ratios | Pie chart | 2-5 items only | Market share |
| Many ratios | Treemap | Hierarchical data | Sales by category |

### Distribution

| Purpose | Chart | Suitable | Example |
|---------|-------|----------|---------|
| Single distribution | Histogram | Continuous variable | Age distribution |
| Distribution comparison | Box plot | Group comparison | Salary by department |
| Density comparison | Violin plot | Distribution shape matters | Score distribution |
| Outlier emphasis | Strip plot | Small data | Individual data points |

### Relationship

| Purpose | Chart | Suitable | Example |
|---------|-------|----------|---------|
| Two-variable relationship | Scatter plot | Continuous×Continuous | Ad spend vs sales |
| Multi-variable correlation | Heatmap | Correlation matrix | Inter-variable correlation |
| Trend line | Regression plot | Linear relationship | Experience vs salary |
| Density scatter | 2D density | Too many data points | Location data |
| Bubble chart | Scatter + size | 3 variables | GDP/population/life expectancy by country |

### Time

| Purpose | Chart | Suitable | Example |
|---------|-------|----------|---------|
| Trend | Line chart | Continuous time series | Daily stock price |
| Seasonality | Decomposition chart | Periodic patterns | Monthly electricity usage |
| Event highlight | Annotated line | Specific time points | Marketing campaign effect |
| Range | Area chart | Cumulative/ratio | Traffic by channel |

## Implementation Code Patterns

### Font Configuration (Essential for non-Latin scripts)

```python
import matplotlib.pyplot as plt
import platform

if platform.system() == 'Darwin':  # macOS
    plt.rcParams['font.family'] = 'AppleGothic'
elif platform.system() == 'Windows':
    plt.rcParams['font.family'] = 'Malgun Gothic'
else:  # Linux
    plt.rcParams['font.family'] = 'NanumGothic'
plt.rcParams['axes.unicode_minus'] = False
```

### Color Palettes

```python
# Sequential (continuous values)
palette_sequential = 'YlOrRd'

# Categorical (discrete)
palette_categorical = ['#4C72B0', '#55A868', '#C44E52', '#8172B3', '#CCB974']

# Diverging (bipolar)
palette_diverging = 'RdBu_r'

# Accessibility-friendly
palette_colorblind = sns.color_palette('colorblind')
```

### Dashboard Layout

```python
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('Sales Analysis Dashboard', fontsize=16, fontweight='bold')

# KPI Card (text-based)
axes[0,0].text(0.5, 0.5, f'Total Sales\n${total:,.0f}', ha='center', va='center', fontsize=20)

# Trend chart
axes[0,1].plot(dates, sales, '-o')

# Distribution
axes[0,2].boxplot([q1, q2, q3, q4])

# Comparison
axes[1,0].barh(categories, values)

# Correlation
sns.heatmap(corr_matrix, ax=axes[1,1], annot=True, cmap='RdBu_r')

# Pie
axes[1,2].pie(shares, labels=channels, autopct='%1.1f%%')

plt.tight_layout()
```

## Visualization Anti-patterns

| Anti-pattern | Problem | Solution |
|-------------|---------|----------|
| 3D charts | Distortion, hard to read | Use 2D |
| Dual Y-axes | Misleading comparisons | Separate charts or normalize |
| Pie with >5 slices | Cannot compare | Switch to bar chart |
| Rainbow colors | Hard to distinguish patterns | Use sequential/categorical palettes |
| Y-axis not starting at 0 | Exaggerates differences | Start Y-axis from 0 |
| Information overload | Misses the point | Focus on one highlight |
| No legend | Cannot interpret | Clear legends/labels |

## Interactive Visualization (Plotly)

```python
import plotly.express as px

# Scatter + color + size + hover
fig = px.scatter(
    df, x='ad_spend', y='sales',
    color='category', size='customers',
    hover_data=['product_name'],
    title='Ad Spend vs Sales Analysis'
)
fig.show()

# Plotly → HTML export
fig.write_html('interactive_chart.html')
```

## Executive Report Visualization Principles

```
1. One key message: One insight per chart
2. Title = Conclusion: "Sales declined 15%" (O) vs "Monthly Sales" (X)
3. Color = Meaning: Red=bad, Green=good, Gray=baseline
4. Annotations: Display key figures directly
5. Comparison baseline: Prior month, prior year, target, industry average
```

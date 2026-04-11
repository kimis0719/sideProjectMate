---
name: chart-selector
description: "Methodology for selecting optimal chart types based on data type and analysis purpose. Use this skill for 'chart recommendation', 'visualization type selection', 'graph types', 'dashboard visualization design', and other data visualization design tasks. Note: writing D3.js/Chart.js code and operating Tableau/PowerBI are outside the scope of this skill."
---

# Chart Selector — Data Visualization Chart Selection Guide

A skill that enhances visualization design for the dashboard-builder.

## Target Agents

- **dashboard-builder** — Selects the optimal chart for the data
- **kpi-designer** — Determines metric presentation methods

## Chart Selection Decision Tree

```
Question 1: What are you trying to show?

├── Comparison > Question 2a
│   ├── Between items > Horizontal bar / Vertical bar
│   ├── Over time > Line chart / Area chart
│   └── Part-to-whole > Stacked bar / Pie (5 or fewer)
│
├── Trend > Line chart / Area chart
│   ├── Single metric > Line chart
│   ├── Multiple metrics > Multi-line (max 5)
│   └── Range display > Area chart
│
├── Distribution > Histogram / Box plot
│   ├── Single variable > Histogram
│   ├── Group comparison > Box plot
│   └── 2-variable relationship > Scatter plot
│
├── Composition > Pie / Donut / Treemap
│   ├── 2-5 items > Pie/Donut
│   ├── 6+ items > Treemap
│   └── Composition change over time > 100% stacked area
│
└── Relationship > Scatter / Bubble / Heatmap
    ├── 2 variables > Scatter plot
    ├── 3 variables > Bubble chart
    └── Matrix > Heatmap
```

## Detailed Chart Type Guide

### KPI Card
```
Purpose: Display key metrics at a glance
Suited for: Single number + change rate
Elements: Current value, period-over-period change, trend sparkline
Rules:
- Place at top of dashboard
- 3-6 cards is optimal
- Colors: Increase=green, Decrease=red (reverse for costs)
```

### Line Chart
```
Purpose: Trends over time
Suited for: Continuous data, time series
Rules:
- Maximum 5 lines (excess: highlight + gray)
- Y-axis starts at 0 (except ratios)
- Hide markers with 10+ data points
- Annotate events (promotions, outages, etc.)
```

### Bar Chart
```
Purpose: Comparison between items
Suited for: Categorical data
Rules:
- Vertical: Time-axis comparison (monthly, weekly)
- Horizontal: Item comparison (by product, by region) — better label readability
- Sort: By size (except time-based)
- Color: Same color, highlight only with accent
```

### Pie/Donut
```
Purpose: Part-to-whole ratios
Suited for: 2-5 categories
Prohibited:
- 6+ items > Use treemap/horizontal bar
- Similar proportions > Incomparable, use bar
- 3D pie > Never use
Rules:
- Start at 12 o'clock, go clockwise
- Largest item first
- "Other" item last
```

### Heatmap
```
Purpose: Express intensity in a 2D matrix
Suited for: Time x category, correlation matrix
Rules:
- Single color gradient (sequential)
- Diverging data: 2 colors from center
- Display values in cells (ensure readability)
```

### Table
```
Purpose: Provide exact figures
Suited for: Multiple measures, detailed comparison
Rules:
- Sortable columns
- Conditional formatting (highlight top/bottom)
- Optional sparkline column
- 10-20 rows optimal (pagination)
```

## Color Palette Guide

### Sequential — Size/intensity
```
Low ──────────────── High
#F7FBFF > #6BAED6 > #08306B (blue)
```

### Diverging — Bidirectional from center
```
Negative ──── 0 ──── Positive
#D73027 > #FFFFBF > #1A9850 (red-yellow-green)
```

### Categorical — Distinction
```
Maximum 8 colors: supplement with patterns/labels if more needed
Accessibility: Use colorblind-safe palettes (viridis, ColorBrewer)
```

## Dashboard Layout Principles

```
1. F-pattern: Left to right, top to bottom reading flow
2. Priority order: Key KPIs at top, details at bottom
3. Grouping: Place related charts close together
4. Whitespace: Sufficient spacing between charts
5. Responsive: 2 columns mobile, 3-4 columns desktop
6. Interaction: Filter > drill-down > detail sequence

Layout grid:
+----------+----------+----------+----------+
|  KPI 1   |  KPI 2   |  KPI 3   |  KPI 4   |  <- Summary
+----------+----+-----+----------+----------+
|  Trend Chart  |  Comparison   | Composition|  <- Analysis
+---------------+--------------+------------+
|            Detail Table                    |  <- Detail
+-------------------------------------------+
```

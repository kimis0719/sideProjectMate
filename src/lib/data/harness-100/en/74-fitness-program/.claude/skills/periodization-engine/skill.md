---
name: periodization-engine
description: "Periodization design and progressive overload strategy engine for training programs. When 'program-architect' and 'template-builder' agents design programs and create progress tracking templates, they must utilize this skill's periodization models, volume/intensity calculation methods, and deload strategies. Use for 'periodization design', 'progressive overload', 'volume calculation', etc. Note: exercise form explanations and nutrition strategies are outside the scope of this skill."
---

# Periodization Engine

Meso/microcycle design, volume/intensity management, and deload strategies for training programs.

## Periodization Models

### Linear Periodization

```
Best for: Beginners, hypertrophy goals

12-week block structure:
  Week 1-3: Adaptation — 3×12 @60-65% 1RM
  Week 4-6: Accumulation — 4×10 @70-75% 1RM
  Week 7-9: Intensification — 4×6-8 @75-82% 1RM
  Week 10-11: Peak — 5×3-5 @85-90% 1RM
  Week 12: Deload — 2×10 @50-60% 1RM

Progression rules:
  - Weekly volume increase: max 10%
  - Weekly intensity increase: 2-5% (beginner) / 1-2.5% (intermediate)
```

### Undulating Periodization (Nonlinear)

```
Best for: Intermediate+, multiple goals

Daily Undulating Periodization (DUP):
  Mon: Hypertrophy — 4×10 @70%
  Wed: Strength — 5×5 @82%
  Fri: Power — 3×3 @88%

Weekly undulation:
  Week 1: High volume (4×10-12)
  Week 2: Moderate (4×6-8)
  Week 3: High intensity (5×3-5)
  Week 4: Deload (2×8)
```

### Block Periodization

```
Best for: Advanced athletes, competition prep

Accumulation block (3-4 weeks):
  - High volume, moderate intensity
  - Hypertrophy + work capacity development
  - 4×8-12 @65-75%

Transmutation block (3-4 weeks):
  - Moderate volume, high intensity
  - Strength development
  - 4×4-6 @80-87%

Realization block (1-2 weeks):
  - Low volume, maximal intensity
  - Peak performance expression
  - 3×1-3 @90-100%
```

## Volume & Intensity Calculations

### Weekly Set Volume Guide (per muscle group)

| Training Level | Maintenance Volume | Minimum Effective | Maximum Adaptive | Maximum Recoverable |
|---------------|-------------------|-------------------|-----------------|---------------------|
| Beginner | 4 sets | 6 sets | 12 sets | 16 sets |
| Intermediate | 6 sets | 8 sets | 16 sets | 22 sets |
| Advanced | 8 sets | 10 sets | 20 sets | 28 sets |

### RPE (Rate of Perceived Exertion) Scale

| RPE | Description | Reps in Reserve | Estimated %1RM |
|-----|-------------|-----------------|----------------|
| 10 | Maximum effort | 0 | 100% |
| 9.5 | Barely completed | 0.5 | 97% |
| 9 | 1 more possible | 1 | 95% |
| 8.5 | 1-2 more possible | 1-2 | 92% |
| 8 | 2 more possible | 2 | 90% |
| 7.5 | 2-3 more possible | 2-3 | 87% |
| 7 | 3 more possible | 3 | 85% |
| 6 | 4 more possible | 4 | 80% |

### 1RM Estimation Formula (Epley)

```
1RM = Weight × (1 + Reps/30)

Example: 80kg × 8 reps = 80 × (1 + 8/30) = 80 × 1.267 = 101.3kg
```

## Progressive Overload Strategies

### Overload Variable Priority

```
1st: Volume increase (sets +1)
2nd: Rep increase (same weight, +1-2 reps)
3rd: Weight increase (2.5-5% increase)
4th: Frequency increase (+1 session per week)
5th: Tempo variation (emphasize eccentric)
6th: Rest period reduction (shorten by 30 seconds)
```

### Double Progression Model

```
Target rep range: 8-12 reps

Stage 1: 3×8 @70kg
Stage 2: 3×10 @70kg (reps increased)
Stage 3: 3×12 @70kg (upper limit reached)
Stage 4: 3×8 @72.5kg (weight increased, reps reset)
→ Repeat
```

## Deload Strategies

### Deload Indicators

```
Warning signs:
  - 3-4 consecutive weeks of stagnation (no increase in weight/reps)
  - Chronic fatigue, sleep disturbances
  - Persistent joint pain
  - Loss of motivation, avoidance of training

Recommended frequency:
  Beginner: every 8-12 weeks
  Intermediate: every 4-8 weeks
  Advanced: every 3-6 weeks
```

### Deload Methods

| Method | Volume Adjustment | Intensity Adjustment | Best For |
|--------|------------------|---------------------|----------|
| Volume deload | 50% reduction | Maintained | Most common |
| Intensity deload | Maintained | 40-60% reduction | Joint recovery |
| Frequency deload | 2x/week | Maintained | Limited time |
| Full rest | 0 | 0 | Severe accumulated fatigue |

## Program Split Templates

| Sessions/Week | Split | Structure |
|--------------|-------|-----------|
| 3 | Full body | A-B-A / B-A-B alternating |
| 4 | Upper/Lower | Upper-Lower-Upper-Lower |
| 4 | PPL+1 | Push-Pull-Legs-Weakness |
| 5 | PPL 2x | P-P-L-P-P (extra leg session optional) |
| 6 | PPL 2x | P-P-L-P-P-L |

## References

- Based on NSCA Essentials of Strength Training and Periodization (Bompa)
- Detailed program examples: see `references/program-templates.md`
eferences

- Based on NSCA Essentials of Strength Training and Periodization (Bompa)
- Detailed program examples: see `references/program-templates.md`

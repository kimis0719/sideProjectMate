---
name: performance-optimizer
description: "this performance optimization profiling, bottleneck analysis, optimization , benchmark verificationuntil inthisbefore teamthis to countlower  pipeline. 'performance optimization', 'slow API improvement', 'query optimization', 'between ', 'performance profiling', 'bottleneck analysis', 'benchmark test', 'as speed improvement', 'P95 between this', 'throughput ' etc. performance improvement beforein this  for.  query optimization profilingonly necessary inalso supported. , infrastructure provisioning direct execution, as configuration, CDN setup direct deployment this of scope ."
---

# Performance Optimizer — performance optimization  pipeline

thisof profiling→bottleneckanalysis→optimization→benchmark inthisbefore teamthis to  in count.

## execution 

**inthisbefore team** — 5peoplethis SendMessageas direct and  verification.

## inthisbefore setup

| inthisbefore | day | role | type |
|---------|------|------|------|
| profiler | `.claude/agents/profiler.md` | CPU, memory, I/O, network profiling | general-purpose |
| bottleneck-analyst | `.claude/agents/bottleneck-analyst.md` | hotspot identification, , impactcalculate | general-purpose |
| optimization-engineer | `.claude/agents/optimization-engineer.md` | code/query/architecture optimization | general-purpose |
| benchmark-manager | `.claude/agents/benchmark-manager.md` | test, execution, analysis | general-purpose |
| perf-reviewer | `.claude/agents/perf-reviewer.md` | verification, regression, finalreport | general-purpose |

## workflow

### Phase 1:  (this direct count)

1. user from :
    - **optimization upper**: code, API, query, system before
    - **performance target**: between, throughput, memory for etc. -based count
    - ** stack**: language, framework, DB, infrastructure
    - **current ** (optional): -based upper, error log, user only
    - **existing day** (optional): profiling result, execution plan, code
2. `_workspace/`  project rootin creation
3.  to `_workspace/00_input.md`in 
4. existing daythis  `_workspace/`in and corresponding Phase cases
5. request scopein  **execution  decision**

### Phase 2: team setup and execution

|  |  | responsible | of |  |
|------|------|------|------|--------|
| 1 | profiling | profiler |  | `_workspace/01_profiling_report.md` |
| 2 | bottleneck analysis | bottleneck-analyst |  1 | `_workspace/02_bottleneck_analysis.md` |
| 3 | optimization  | optimization-engineer |  2 | `_workspace/03_optimization_plan.md` |
| 4 | benchmark verification | benchmark-manager |  1, 3 | `_workspace/04_benchmark_results.md` |
| 5 | performance review | perf-reviewer |  1~4 | `_workspace/05_review_report.md` |

**team between  :**
- profiler completed → analystto hotspot·resources pattern before, benchmarkto baseline count before
- analyst completed → engineerto bottleneck priority· before, benchmarkto performance budget before
- engineer completed → benchmarkto optimization code· count before
- benchmark completed → reviewerto  analysis result before
- reviewer all   verification. 🔴 required modification   corresponding inthisbeforeto modification request →  → verification (maximum 2)

### Phase 3: integrated and final 

1. `_workspace/` within all day confirmation
2. review reportof 🔴 required modificationthis   confirmation
3. final  userto report:
    - profiling — `01_profiling_report.md`
    - bottleneck analysis — `02_bottleneck_analysis.md`
    - optimization plan — `03_optimization_plan.md`
    - benchmark — `04_benchmark_results.md`
    - review report — `05_review_report.md`

##  per 

| user request pattern | execution  |  inthisbefore |
|----------------|----------|-------------|
| "performance before optimization" | ** pipeline** | 5people before |
| "this code profiling" | **profiling ** | profiler + reviewer |
| "this query optimization" | **query optimization ** | profiler + analyst + engineer + reviewer |
| "benchmark test " | **benchmark ** | benchmark + reviewer |
| "this optimization result verification" | **review ** | reviewer  |

## data before as

| strategy |  | foralso |
|------|------|------|
| day  | `_workspace/`  | week   and shared |
| message  | SendMessage | real-time core information before, modification request |
|   | TaskCreate/TaskUpdate | in progress upper tracking, of   |

## error 

| error type | strategy |
|----------|------|
| profiling also execution impossible | code -based analysisas , also configuration guide provided |
| execution   | benchmark script + execution guide provided, expected result this |
| performance target  |  (P95 < 200ms, error < 1%)  target proposal |
| inthisbefore failure | 1 retry → failure  corresponding  this in progress, review reportin  people |
| reviewfrom 🔴  | corresponding inthisbeforein modification request →  → verification (maximum 2) |

## test 

### normal 
****: "Django REST APIof betweenthis P95 criteria 2seconds, 500ms or lessas this . code analysisand optimization."
** result**:
- profiling: Django middleware, ORM query, -ize and analysis, N+1 query detection
- bottleneckanalysis: DB query before betweenof 70%  → ORM N+1 + index  
- optimization: select_related/prefetch_related -basedfor, index addition, queryset caching
- benchmark: k6 scriptas beforeafter , P95 2s → 400ms verification
- review:  confirmation, regression risk evaluation

### existing day for 
****: "this profiling result analysisand optimization  " + flame graph 
** result**:
- existing profiling data `_workspace/01_profiling_report.md`as for
- profiler cases analyst + engineer + benchmark + reviewer 

### error 
****: "this slow   "
** result**:
- code -based analysis  profiling count
- day-based performance pattern list -basedfor
- "detailed profiling also -basedfor " people


## inthisbeforeper extension 

|  | as | -ize upper inthisbefore | role |
|------|------|-----------------|------|
| query-optimization-patterns | `.claude/skills/query-optimization-patterns/skill.md` | bottleneck-analyst, optimization-engineer | execution plan analysis, index , N+1 resolution, thisthis |
| caching-strategy-selector | `.claude/skills/caching-strategy-selector/skill.md` | optimization-engineer | Cache Aside/Write Through/Behind, invalid-ize,   |

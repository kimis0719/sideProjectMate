---
name: web-scraper
description: "Full pipeline for building web scraping systems with agent team collaboration. Use this skill for requests like 'build a web scraper', 'develop a crawler', 'collect site data', 'web crawling system', 'build a scraper', 'data collection automation', 'site parsing', 'web data extraction', etc. Also supports target-analysis-only mode for specific site analysis. Note: real-time streaming data processing (Kafka/Flink), browser automation testing (Selenium testing), and website performance monitoring are outside the scope of this skill."
---

# Web Scraper — Web Scraping System Construction Pipeline

An agent team collaborates to build target analysis, crawler design, parsing, storage, and monitoring for web scraping systems.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| target-analyst | `.claude/agents/target-analyst.md` | Target site analysis, risk assessment | general-purpose |
| crawler-developer | `.claude/agents/crawler-developer.md` | Crawler architecture and implementation | general-purpose |
| parser-engineer | `.claude/agents/parser-engineer.md` | Parsing logic design and implementation | general-purpose |
| data-manager | `.claude/agents/data-manager.md` | Data storage, validation, export | general-purpose |
| monitor-operator | `.claude/agents/monitor-operator.md` | Monitoring, alerting, scheduling | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Target site URL**: Website to scrape
    - **Target data**: What data to extract
    - **Purpose**: Intended use of collected data (analysis/monitoring/archiving)
    - **Scale**: Expected data volume, collection frequency
    - **Constraints** (optional): Tech stack limitations, budget, legal requirements
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. Create the `_workspace/src/` directory
5. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
6. **Determine the execution mode** based on the scope of the request (see "Execution Modes" below)

### Phase 2: Team Assembly and Execution

Assemble the team and assign tasks. Inter-task dependencies are as follows:

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Target site analysis | analyst | None | `_workspace/01_target_analysis.md` |
| 2a | Crawler design and implementation | crawler | Task 1 | `_workspace/02_crawler_design.md` + `src/` |
| 2b | Parsing logic design and implementation | parser | Task 1 | `_workspace/03_parser_logic.md` + `src/` |
| 3 | Data storage design | data-mgr | Task 2b | `_workspace/04_data_storage.md` + `src/` |
| 4 | Monitoring configuration | monitor | Tasks 2a, 2b, 3 | `_workspace/05_monitor_config.md` + `src/` |

Tasks 2a (crawler) and 2b (parser) run **in parallel** since both depend only on Task 1 (analysis).

**Inter-agent communication flow:**
- analyst completes > passes URL patterns, anti-bot info, rate limits to crawler; data points and DOM structure to parser
- crawler completes > passes raw data format to parser; crawler health checkpoints to monitor
- parser completes > passes data schema to data-mgr; parsing metrics to monitor
- data-mgr completes > passes data quality metrics to monitor
- monitor integrates all components to finalize operations configuration

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/` and `_workspace/src/`
2. Validate cross-deliverable consistency (analysis > crawler > parser > storage > monitoring)
3. Present the final summary and execution instructions to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Build a full scraping system" | **Full pipeline** | All 5 agents |
| "Analyze target site only" | **Analysis mode** | target-analyst only |
| "Build crawler only" | **Crawler mode** | target-analyst + crawler-developer |
| "Design parser only" | **Parser mode** | target-analyst + parser-engineer |
| "Monitor existing scraper" | **Monitor mode** | monitor-operator only |

**Reusing existing files**: If the user provides existing analysis results or crawler code, copy to `_workspace/` and skip the corresponding agent.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Design documents |
| Code-based | `_workspace/src/` | Executable scraping code |
| Message-based | SendMessage | Key information transfer, feedback |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Target site inaccessible | Analyze via cached/archived versions; explore alternative URLs |
| robots.txt blocks all crawling | Check for public API; propose API-based approach |
| Anti-bot blocks all requests | Escalate difficulty; propose headless browser or API alternatives |
| Dynamic rendering failure | Switch to Playwright; increase timeouts |
| Agent failure | Retry once; if still failing, proceed without that deliverable |

## Test Scenarios

### Normal Flow
**Prompt**: "Build a scraper to collect product prices from this e-commerce site daily"
**Expected result**:
- Analysis: Site structure, pagination, anti-bot mechanisms, robots.txt compliance plan
- Crawler: Async httpx-based crawler with rate limiting and retry logic
- Parser: CSS selector-based price/title/URL extraction with validation
- Storage: SQLite with upsert deduplication, CSV daily export
- Monitoring: Cron schedule, parsing success rate alerts, site change detection

### Analysis-Only Flow
**Prompt**: "Analyze whether this site can be scraped"
**Expected result**:
- target-analyst performs full analysis and risk assessment
- Other agents are not deployed

### Error Flow
**Prompt**: "Scrape data from this SPA with Cloudflare protection"
**Expected result**:
- target-analyst identifies Cloudflare challenge and SPA rendering
- crawler-developer uses Playwright with appropriate wait strategies
- parser-engineer handles dynamic DOM with robust selectors
- monitor-operator sets up change detection for frequently updated selectors


## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| selector-generator | `.claude/skills/selector-generator/skill.md` | parser-engineer | CSS/XPath selector generation, robustness scoring, change detection |
| anti-bot-analyzer | `.claude/skills/anti-bot-analyzer/skill.md` | target-analyst, crawler-developer | Anti-bot defense layer analysis, rate limit detection, legal risk assessment |

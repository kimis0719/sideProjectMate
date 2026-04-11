---
name: test-automation
description: "A full test automation pipeline. An agent team collaborates to perform strategy formulation, unit/integration test writing, CI integration, and coverage analysis. Use this skill for requests like 'automate tests', 'write test code', 'create unit tests', 'write integration tests', 'analyze test coverage', 'create a test strategy', 'integrate tests into CI', 'design test pyramid', and other test automation tasks. Also supports coverage analysis and improvements for existing tests. Note: E2E/UI test execution, browser automation execution, and load test execution are outside the scope of this skill."
---

# Test Automation — Test Automation Pipeline

An agent team collaborates to perform test strategy formulation -> test writing -> CI integration -> coverage analysis.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| test-strategist | `.claude/agents/test-strategist.md` | Test pyramid, tools, CI design | general-purpose |
| unit-tester | `.claude/agents/unit-tester.md` | Unit test writing, mocking | general-purpose |
| integration-tester | `.claude/agents/integration-tester.md` | API/DB/external service testing | general-purpose |
| coverage-analyst | `.claude/agents/coverage-analyst.md` | Coverage gap analysis, improvement plan | general-purpose |
| qa-reviewer | `.claude/agents/qa-reviewer.md` | Cross-validation, test quality evaluation | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by Orchestrator)

1. Extract from user input:
    - **Target Code**: Codebase or module to test
    - **Tech Stack** (optional): Language, framework, existing test tools
    - **Constraints** (optional): Coverage targets, CI platform, time constraints
    - **Existing Tests** (optional): Already written test code
2. Create `_workspace/` directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are available, copy them to `_workspace/` and skip the corresponding Phase
5. Determine **execution mode** based on the scope of the request (see "Modes by Task Scale" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Assignee | Dependencies | Deliverable |
|-------|------|----------|-------------|-------------|
| 1 | Test Strategy | strategist | None | `_workspace/01_test_strategy.md` |
| 2a | Unit Test Writing | unit-tester | Task 1 | `_workspace/02_unit_tests.md` |
| 2b | Integration Test Writing | integration-tester | Task 1 | `_workspace/03_integration_tests.md` |
| 3 | Coverage Analysis | coverage-analyst | Tasks 1, 2a, 2b | `_workspace/04_coverage_report.md` |
| 4 | Final Review | qa-reviewer | Tasks 1-3 | `_workspace/05_review_report.md` |

Tasks 2a (unit) and 2b (integration) can be **executed in parallel**.

**Inter-team Communication Flow:**
- strategist completes -> delivers test scope and mocking strategy to unit-tester; delivers integration test scope and environment strategy to integration-tester
- unit-tester completes -> shares mocked interface list with integration-tester; delivers test list to coverage-analyst
- integration-tester completes -> delivers integration test list to coverage-analyst
- coverage-analyst completes -> requests additional tests from unit-tester/integration-tester when gaps are found
- qa-reviewer cross-validates all deliverables. Requests fixes for RED Must Fix items (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Check all files in `_workspace/`
2. Verify all RED Must Fix items have been addressed
3. Report the final summary to the user

## Modes by Task Scale

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|----------------|-----------------|
| "Automate tests", "Full testing" | **Full Pipeline** | All 5 agents |
| "Write unit tests only" | **Unit Test Mode** | strategist + unit-tester + reviewer |
| "Write integration tests only" | **Integration Test Mode** | strategist + integration-tester + reviewer |
| "Analyze coverage" | **Coverage Mode** | coverage-analyst + reviewer |
| "Create test strategy only" | **Strategy Mode** | strategist + reviewer |

**Leveraging Existing Files**: If the user provides existing test code, coverage reports, etc., copy the files to the appropriate location in `_workspace/` and skip the corresponding agent's step.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share main deliverables |
| Message-based | SendMessage | Real-time delivery of key information, fix requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Code inaccessible | Write general tests based on user description, note "estimation-based" in report |
| Test framework not installed | Provide test code with installation guide |
| Agent failure | Retry once -> if fails, proceed without that deliverable, note omission in review |
| RED found in review | Request fix from relevant agent -> rework -> re-verify (up to 2 times) |
| Coverage tool cannot run | Substitute with static analysis-based estimated coverage |

## Test Scenarios

### Normal Flow
**Prompt**: "Apply test automation to a REST API built with NestJS. Currently there are no tests at all."
**Expected Result**:
- Strategy: Jest + Supertest selection, risk-based priorities, CI (GitHub Actions) design
- Unit: Service class tests, Repository mocking, DTO validation
- Integration: API endpoint tests, PostgreSQL integration via Testcontainers
- Coverage: Per-module gap analysis, P0/P1 additional test suggestions
- Review: Full consistency verification across all items

### Existing File Utilization Flow
**Prompt**: "Current test coverage is 40% and I want to get it to 80%" + code/tests attached
**Expected Result**:
- Start in coverage mode, analyze current gaps
- Establish additional test plan with risk-based priorities
- Phased improvement roadmap (40% -> 60% -> 80%)

### Error Flow
**Prompt**: "Write test code for this function" (only one function provided)
**Expected Result**:
- Switch to unit test mode
- Write boundary value, normal/abnormal case tests for the function
- Provide tests immediately using basic AAA pattern even without a strategy

## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| test-design-patterns | `.claude/skills/test-design-patterns/skill.md` | test-strategist, unit-tester | Boundary value analysis, equivalence partitioning, state transition, pairwise, risk-based prioritization |
| mocking-strategy | `.claude/skills/mocking-strategy/skill.md` | unit-tester, integration-tester | Mock/Stub/Spy/Fake selection, per-layer mocking, anti-pattern prevention |

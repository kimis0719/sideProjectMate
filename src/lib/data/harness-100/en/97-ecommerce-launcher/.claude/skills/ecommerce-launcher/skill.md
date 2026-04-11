---
name: ecommerce-launcher
description: "Full launch pipeline for e-commerce products where an agent team collaborates to generate product planning, detail pages, pricing strategy, marketing, and CS setup all at once. Use this skill for requests such as 'launch an e-commerce product', 'prepare a product launch', 'register a product on Naver Smart Store', 'launch on Coupang', 'create a detail page', 'develop a pricing strategy', 'create a marketing plan', 'launch prep', 'product planning brief', 'e-commerce CS manual', and other e-commerce product launch tasks. Also supports supplementing pricing/marketing/CS even when existing briefs or detail pages are provided. However, actual platform API integration (automated product registration), payment system development, logistics system integration, and real-time order management are outside the scope of this skill."
---

# E-commerce Launcher — E-commerce Product Launch Full Pipeline

An agent team collaborates to generate product planning, detail pages, pricing strategy, marketing, and CS setup for an e-commerce product launch.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| product-planner | `.claude/agents/product-planner.md` | Market research, competitive analysis, product positioning | general-purpose |
| detail-page-writer | `.claude/agents/detail-page-writer.md` | Detail page copy, SEO, conversion optimization | general-purpose |
| pricing-strategist | `.claude/agents/pricing-strategist.md` | Cost analysis, pricing design, promotions | general-purpose |
| marketing-manager | `.claude/agents/marketing-manager.md` | Launch campaigns, channel strategy, ad copy | general-purpose |
| cs-architect | `.claude/agents/cs-architect.md` | FAQ, response manuals, return policies, VOC | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Product Information**: Product name, category, key features
    - **Target Market** (optional): Target customer segment, price range
    - **Platform** (optional): Naver/Coupang/Own Store, etc.
    - **Constraints** (optional): Budget, timeline, special considerations
    - **Existing Files** (optional): Existing briefs, detail pages, etc.
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it as `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request (see "Execution Modes by Scope" below)

### Phase 2: Team Assembly and Execution

Assemble the team and assign tasks. Task dependencies are as follows:

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Product Planning | planner | None | `_workspace/01_product_brief.md` |
| 2a | Detail Page Writing | writer | Task 1 | `_workspace/02_detail_page.md` |
| 2b | Pricing Strategy | pricing | Task 1 | `_workspace/03_pricing_plan.md` |
| 3 | Marketing Plan | marketing | Tasks 1, 2a, 2b | `_workspace/04_marketing_plan.md` |
| 4 | CS Manual | cs | Tasks 1, 2b | `_workspace/05_cs_manual.md` |
| 5 | Integrated Review | orchestrator | All | `_workspace/06_review_report.md` |

Tasks 2a (Detail Page) and 2b (Pricing) run **in parallel**. Both depend only on Task 1 (Planning) and can start simultaneously.

**Inter-Agent Communication Flow:**
- planner completes -> delivers USP and target to writer, competitive pricing and costs to pricing, target and trends to marketing, specs and certifications to cs
- writer completes -> delivers detail page keywords to marketing, FAQ section to cs
- pricing completes -> delivers price display format to writer, promotion strategy to marketing, pricing policy to cs
- marketing completes -> delivers promotion-related anticipated inquiries to cs
- orchestrator cross-validates all deliverables and produces the review report

### Phase 3: Integration and Final Deliverables

Cross-validate all deliverables for consistency and finalize:

1. Verify all files in `_workspace/`
2. Detect inconsistencies across detail page, pricing, marketing, and CS
3. Generate the integrated review report (`_workspace/06_review_report.md`)
4. Report the final summary to the user:
    - Product Planning Brief — `01_product_brief.md`
    - Detail Page Copy — `02_detail_page.md`
    - Pricing Strategy Document — `03_pricing_plan.md`
    - Marketing Plan — `04_marketing_plan.md`
    - CS Operations Manual — `05_cs_manual.md`
    - Review Report — `06_review_report.md`

## Execution Modes by Scope

Adjust agent deployment based on the scope of the user's request:

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Launch an e-commerce product", "Full product launch prep" | **Full Pipeline** | All 5 agents |
| "Just create the detail page" | **Detail Page Mode** | planner + writer |
| "Develop a pricing strategy" | **Pricing Mode** | planner + pricing |
| "Create a marketing plan" (existing brief available) | **Marketing Mode** | marketing only |
| "Create a CS manual" | **CS Mode** | planner + cs |
| "Prepare the rest using this brief" + existing file | **Supplement Mode** | Relevant agents only |

**Using Existing Files**: When the user provides existing files such as briefs or detail pages, copy them to the appropriate numbered position in `_workspace/` and skip the corresponding agent's phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-Based | `_workspace/` directory | Store and share main deliverables |
| Message-Based | SendMessage | Real-time key information delivery, correction requests |
| Task-Based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Web search failure | Planner works from general knowledge, notes "Data limitations" in report |
| Cost information absent | Reverse-engineer from category-average margin rate, request user confirmation |
| Platform unspecified | Write based on Naver Smart Store standards + append multi-platform guide |
| Agent failure | Retry once -> if still fails, proceed without that deliverable, note omission in review report |
| Consistency discrepancy found | Request corrections from relevant agent -> rework (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "I want to launch a handmade granola brand on Naver Smart Store. Manufacturing cost is $5 per unit and it's a healthy snack concept."
**Expected Results**:
- Planning Brief: 3+ competitive analyses in the healthy snack category, target customer definition, USP development
- Detail Page: Health-benefit-focused copy, mobile-optimized structure
- Pricing: Margin design based on $5 manufacturing cost, BEP calculation, promotional pricing
- Marketing: Launch plan centered on health/lifestyle channels
- CS: Food-related FAQ, shelf life/allergen information included

### Existing File Flow
**Prompt**: "Use this detail page draft to develop pricing and marketing plans" + detail page file
**Expected Results**:
- Copy existing detail page to `_workspace/02_detail_page.md`
- Reverse-extract product information from the detail page to generate a planning brief
- Deploy pricing + marketing + cs agents

### Error Flow
**Prompt**: "Prepare a product launch, but I haven't decided what to sell yet"
**Expected Results**:
- Planner suggests 3 trend-based categories and requests user selection
- Or selects the most promising category and proceeds as an example
- Review report notes "Product undetermined — proceeded on example basis"

## Agent Extension Skills

| Extension Skill | Path | Target Agent | Role |
|----------------|------|-------------|------|
| conversion-optimization | `.claude/skills/conversion-optimization/skill.md` | detail-page-writer, pricing-strategist | Purchase psychology, conversion structure, CTA, pricing psychology |
| product-copy-formulas | `.claude/skills/product-copy-formulas/skill.md` | detail-page-writer, marketing-manager | PAS/FAB/AIDA copy formulas, channel-specific guides |

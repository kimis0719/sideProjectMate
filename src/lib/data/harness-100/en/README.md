# Harness 100 — Production-Grade Agent Team Harness Collection

**100 ready-to-use agent team harnesses** for everyday life and work, built for Claude Code.

Each harness orchestrates 4-5 domain-expert agents collaborating via SendMessage in production-grade workflows.

## Project Scale

| Item | Count |
|------|-------|
| Harnesses | 100 |
| Agent definitions | 489 |
| Skills (orchestrator + agent-extending) | 315 |
| Total files | 904 |

## Quick Start

Copy any harness folder's `.claude/` directory into your project:

```bash
# Example: apply the youtube-production harness to your project
cp -r 01-youtube-production/.claude/ /path/to/my-project/.claude/
```

Each harness folder contains a `CLAUDE.md` with structure and usage details.

## Harness Structure

Every harness follows a consistent structure:

```
{NN}-{harness-name}/
└── .claude/
    ├── CLAUDE.md                          # Project overview
    ├── agents/
    │   ├── {agent-1}.md                   # Specialist agent definition
    │   ├── {agent-2}.md
    │   ├── {agent-3}.md
    │   ├── {agent-4}.md
    │   └── {agent-5}.md (optional)
    └── skills/
        ├── {orchestrator}/
        │   └── skill.md                   # Orchestrator skill
        ├── {agent-skill-1}/
        │   └── skill.md                   # Agent-extending skill
        └── {agent-skill-2}/
            └── skill.md                   # Agent-extending skill
```

## Quality Standards

Every harness meets these criteria:

- **Agent Team Mode** — Direct communication via SendMessage, cross-validation
- **Domain Expertise** — Real-world frameworks and methodologies embedded
- **Output Templates** — Structured output formats per agent
- **Dependency Management** — Task ordering with parallel execution
- **Error Handling** — Fallback strategies for failure scenarios
- **Scale-Based Modes** — Full / reduced / single-agent modes
- **Test Scenarios** — Normal / existing-file / error flows (3 types)
- **Trigger Boundaries** — Should-trigger + NOT-trigger defined
- **Agent-Extending Skills** — 2-3 domain-specific skills that amplify agent capabilities

---

## Category 1: Content Creation & Creative (01-15)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 01 | [youtube-production](01-youtube-production/) | YouTube video: planning, script, thumbnail, SEO | 5 |
| 02 | [podcast-studio](02-podcast-studio/) | Podcast: research, script, show notes | 5 |
| 03 | [newsletter-engine](03-newsletter-engine/) | Newsletter: curation, writing, A/B variants | 5 |
| 04 | [content-repurposer](04-content-repurposer/) | One source to blog, social, newsletter, slides | 5 |
| 05 | [game-narrative](05-game-narrative/) | Game: world, quests, dialogue, branching scenarios | 5 |
| 06 | [brand-identity](06-brand-identity/) | Naming, slogan, tone & manner, guidelines | 5 |
| 07 | [comic-creator](07-comic-creator/) | Comics: storyboard, dialogue, image generation | 5 |
| 08 | [course-builder](08-course-builder/) | Online course: curriculum, lessons, quizzes, labs | 5 |
| 09 | [documentary-research](09-documentary-research/) | Documentary: research, structure, interviews, narration | 5 |
| 10 | [social-media-manager](10-social-media-manager/) | Social media: content calendar, posts, hashtags | 5 |
| 11 | [book-publishing](11-book-publishing/) | E-book: editing, cover, metadata, distribution | 5 |
| 12 | [advertising-campaign](12-advertising-campaign/) | Ad campaign: targeting, copy, creative, media plan | 5 |
| 13 | [presentation-designer](13-presentation-designer/) | Presentation: storyboard, slides, speaker notes | 5 |
| 14 | [translation-localization](14-translation-localization/) | Translation, localization, cultural adaptation | 5 |
| 15 | [visual-storytelling](15-visual-storytelling/) | Visual storytelling: AI images + HTML layout | 5 |

## Category 2: Software Development & DevOps (16-30)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 16 | [fullstack-webapp](16-fullstack-webapp/) | Full-stack web app: design, frontend, backend, test, deploy | 5 |
| 17 | [mobile-app-builder](17-mobile-app-builder/) | Mobile app: UI/UX, code, API, store deployment | 5 |
| 18 | [api-designer](18-api-designer/) | REST/GraphQL API: design, docs, mocks, tests | 5 |
| 19 | [database-architect](19-database-architect/) | DB: modeling, migration, indexing, optimization | 5 |
| 20 | [cicd-pipeline](20-cicd-pipeline/) | CI/CD pipeline: design, build, optimization | 5 |
| 21 | [code-reviewer](21-code-reviewer/) | Code review: style, security, performance, architecture | 5 |
| 22 | [legacy-modernizer](22-legacy-modernizer/) | Legacy modernization: analysis, refactoring, migration | 5 |
| 23 | [microservice-designer](23-microservice-designer/) | Microservices: architecture, decomposition, communication | 5 |
| 24 | [test-automation](24-test-automation/) | Test automation: strategy, writing, CI, coverage | 5 |
| 25 | [incident-postmortem](25-incident-postmortem/) | Incident postmortem: timeline, root cause, prevention | 5 |
| 26 | [infra-as-code](26-infra-as-code/) | IaC: Terraform/Pulumi, security, cost optimization | 5 |
| 27 | [data-pipeline](27-data-pipeline/) | Data pipeline: ETL, quality validation, monitoring | 5 |
| 28 | [security-audit](28-security-audit/) | Security audit: vulnerability, code analysis, pentest | 5 |
| 29 | [performance-optimizer](29-performance-optimizer/) | Performance: profiling, bottleneck, optimization, benchmark | 5 |
| 30 | [open-source-launcher](30-open-source-launcher/) | Open source launch: code cleanup, docs, license, community | 5 |

## Category 3: Data & AI/ML (31-42)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 31 | [ml-experiment](31-ml-experiment/) | ML experiment: data, model, training, evaluation, deploy | 5 |
| 32 | [data-analysis](32-data-analysis/) | Data analysis: explore, clean, analyze, visualize, report | 5 |
| 33 | [text-processor](33-text-processor/) | Text processing: summarize, classify, extract, sentiment | 5 |
| 34 | [data-migration](34-data-migration/) | Data migration: schema mapping, transform, validation | 5 |
| 35 | [api-client-generator](35-api-client-generator/) | API client SDK auto-generation | 5 |
| 36 | [design-system](36-design-system/) | UI design system: tokens, components, Storybook | 5 |
| 37 | [web-scraper](37-web-scraper/) | Web scraping: crawler, parser, storage, monitoring | 5 |
| 38 | [chatbot-builder](38-chatbot-builder/) | Chatbot: conversation design, NLU, integration, test | 5 |
| 39 | [changelog-generator](39-changelog-generator/) | Release: git analysis, release notes, migration guide | 5 |
| 40 | [cli-tool-builder](40-cli-tool-builder/) | CLI tool: command design, code, test, docs, deploy | 5 |
| 41 | [llm-app-builder](41-llm-app-builder/) | LLM app: prompt, RAG, evaluation, optimization, deploy | 5 |
| 42 | [bi-dashboard](42-bi-dashboard/) | BI dashboard: KPI, visualization, auto-reporting | 5 |

## Category 4: Business & Strategy (43-55)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 43 | [startup-launcher](43-startup-launcher/) | Startup: idea validation, BM, MVP, pitch | 5 |
| 44 | [market-research](44-market-research/) | Market research: industry, competitor, consumer, trends | 5 |
| 45 | [gov-funding-plan](45-gov-funding-plan/) | Government funding proposal writing | 5 |
| 46 | [product-manager](46-product-manager/) | PM: roadmap, PRD, user stories, sprint | 5 |
| 47 | [strategy-framework](47-strategy-framework/) | Strategy: OKR, BSC, SWOT, vision, roadmap | 5 |
| 48 | [sales-enablement](48-sales-enablement/) | Sales: customer analysis, proposal, presentation | 5 |
| 49 | [customer-support](49-customer-support/) | Customer support: FAQ, response manual, escalation | 5 |
| 50 | [pricing-strategy](50-pricing-strategy/) | Pricing: cost, competitive, value-based, simulation | 5 |
| 51 | [investor-report](51-investor-report/) | Investor report: financials, KPI, market, strategy | 5 |
| 52 | [scenario-planner](52-scenario-planner/) | Scenario planning: variables, matrix, impact, response | 5 |
| 53 | [financial-modeler](53-financial-modeler/) | Financial modeling: revenue, cost, scenario, valuation | 5 |
| 54 | [grant-writer](54-grant-writer/) | Grant application: analysis, plan, budget, submission | 5 |
| 55 | [rfp-responder](55-rfp-responder/) | RFI/RFP response writing | 5 |

## Category 5: Education & Learning (56-65)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 56 | [language-tutor](56-language-tutor/) | Language learning: level test, curriculum, lessons, quizzes | 5 |
| 57 | [exam-prep](57-exam-prep/) | Exam prep: trends, diagnosis, mock exams, error analysis | 5 |
| 58 | [thesis-advisor](58-thesis-advisor/) | Thesis: topic, literature, methodology, writing, proofread | 5 |
| 59 | [coding-bootcamp](59-coding-bootcamp/) | Coding education: curriculum, exercises, code review | 4 |
| 60 | [debate-simulator](60-debate-simulator/) | Debate simulation: pro/con, cross-exam, judge, report | 5 |
| 61 | [competency-modeler](61-competency-modeler/) | Competency modeling: job analysis, dictionary, rubrics | 4 |
| 62 | [adr-writer](62-adr-writer/) | ADR: tech context, alternatives, tradeoffs, documentation | 5 |
| 63 | [research-assistant](63-research-assistant/) | Academic research: literature search, notes, synthesis | 5 |
| 64 | [knowledge-base-builder](64-knowledge-base-builder/) | Knowledge management: collect, classify, markdown wiki | 5 |
| 65 | [personal-branding](65-personal-branding/) | Personal branding: resume, portfolio, LinkedIn | 5 |

## Category 6: Legal & Compliance (66-72)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 66 | [contract-analyzer](66-contract-analyzer/) | Contract analysis, drafting, review, risk assessment | 5 |
| 67 | [compliance-checker](67-compliance-checker/) | Compliance: law mapping, gap analysis, remediation | 4 |
| 68 | [patent-drafter](68-patent-drafter/) | Patent: prior art, claims, specification, drawings | 5 |
| 69 | [privacy-engineer](69-privacy-engineer/) | Privacy: GDPR/PIPA, PIA, consent forms | 4 |
| 70 | [legal-research](70-legal-research/) | Legal research: case law, analysis, opinion letter | 4 |
| 71 | [service-legal-docs](71-service-legal-docs/) | Service legal docs: ToS, privacy policy, cookie, refund | 4 |
| 72 | [regulatory-filing](72-regulatory-filing/) | Regulatory filing: requirements, application, attachments | 4 |

## Category 7: Health & Lifestyle (73-80)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 73 | [meal-planner](73-meal-planner/) | Meal planning: nutrition, menu, recipes, grocery list | 4 |
| 74 | [fitness-program](74-fitness-program/) | Fitness: program design, guides, nutrition, tracking | 4 |
| 75 | [tax-calculator](75-tax-calculator/) | Tax: income analysis, deduction optimization, simulation | 4 |
| 76 | [travel-planner](76-travel-planner/) | Travel: destination, itinerary, budget, local info | 4 |
| 77 | [space-concept-board](77-space-concept-board/) | Interior concept board: mood board, colors, furniture | 5 |
| 78 | [personal-finance](78-personal-finance/) | Personal finance: budget, investment, retirement planning | 5 |
| 79 | [side-project-launcher](79-side-project-launcher/) | Side project: idea, tech stack, MVP, launch checklist | 5 |
| 80 | [wedding-planner](80-wedding-planner/) | Wedding: timeline, budget, vendor comparison, checklist | 5 |

## Category 8: Communication & Documents (81-88)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 81 | [technical-writer](81-technical-writer/) | Technical docs: structure, writing, diagrams, review | 5 |
| 82 | [report-generator](82-report-generator/) | Business reports: data, analysis, visualization, writing | 5 |
| 83 | [sop-writer](83-sop-writer/) | SOP: process analysis, procedures, checklists, training | 5 |
| 84 | [meeting-strategist](84-meeting-strategist/) | Meeting strategy: agenda, background, decision framework | 5 |
| 85 | [public-speaking](85-public-speaking/) | Public speaking: speech, presentation, debate, Q&A | 5 |
| 86 | [proposal-writer](86-proposal-writer/) | Proposal: client analysis, solution, pricing, differentiation | 5 |
| 87 | [crisis-communication](87-crisis-communication/) | Crisis comms: situation, messaging, press release, Q&A | 5 |
| 88 | [risk-register](88-risk-register/) | Risk register: identify, assess, respond, monitor | 5 |

## Category 9: Operations & Process (89-95)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 89 | [event-organizer](89-event-organizer/) | Event: concept, program, promotion, execution, evaluation | 5 |
| 90 | [hiring-pipeline](90-hiring-pipeline/) | Hiring: JD, sourcing, screening, interview, offer | 5 |
| 91 | [onboarding-system](91-onboarding-system/) | Onboarding: checklist, training, mentor, 30-60-90 | 5 |
| 92 | [operations-manual](92-operations-manual/) | Operations manual: analysis, flowchart, FAQ, training | 5 |
| 93 | [feedback-analyzer](93-feedback-analyzer/) | Feedback analysis: sentiment, topics, trends, insights | 5 |
| 94 | [audit-report](94-audit-report/) | Internal audit: scope, checklist, findings, recommendations | 5 |
| 95 | [procurement-docs](95-procurement-docs/) | Procurement: requirements, vendor comparison, evaluation | 5 |

## Category 10: Specialized Domains (96-100)

| # | Harness | Description | Agents |
|---|---------|-------------|--------|
| 96 | [real-estate-analyst](96-real-estate-analyst/) | Real estate: market, location, profitability, risk, report | 5 |
| 97 | [ecommerce-launcher](97-ecommerce-launcher/) | E-commerce: product planning, detail pages, pricing, marketing | 5 |
| 98 | [academic-paper](98-academic-paper/) | Academic paper: research design, experiment, analysis, writing | 5 |
| 99 | [sustainability-audit](99-sustainability-audit/) | ESG audit: environment, social, governance, report | 5 |
| 100 | [ip-portfolio](100-ip-portfolio/) | IP portfolio: patent, trademark, copyright, licensing strategy | 5 |

---

## Domain Expertise Highlights

Each harness embeds real-world frameworks and methodologies:

| Domain | Frameworks / Methodologies |
|--------|--------------------------|
| Content | AIDA, Pattern Interrupt, SEO Keyword Mapping, Platform Specs |
| Development | SOLID, DDD, OWASP Top 10, Test Pyramid, DORA Metrics |
| Data | Star/Snowflake Schema, Great Expectations, SHAP/LIME |
| Business | BMC, TAM/SAM/SOM, Porter's 5 Forces, RICE, OKR |
| Education | Bloom's Taxonomy, ADDIE, CEFR, Spaced Repetition |
| Legal | IRAC, MQM, GDPR/PIPA, IPC/CPC Classification |
| Lifestyle | BMR/TDEE, KDRIs, ACSM Guidelines, Van Westendorp |
| Documents | Diataxis, PREP, STAR, MADR, SemVer |
| Operations | SIPOC/RACI, 4C Framework, SMART, NPS/CSAT |
| Specialized | GHG Protocol, Cap Rate/IRR, IMRaD, Georgia-Pacific |

## License

Apache License 2.0 — See [LICENSE](../LICENSE)

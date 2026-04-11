# E-commerce Launcher Harness

An e-commerce launch harness. An agent team collaborates to produce product planning, product detail pages, pricing strategy, marketing plans, and customer service architecture for online store launches.

## Structure

```
.claude/
├── agents/
│   ├── product-planner.md        — Product planning (market analysis, positioning, competitive differentiation)
│   ├── detail-page-writer.md     — Product detail page writing (copy, structure, SEO)
│   ├── pricing-strategist.md     — Pricing strategy (cost analysis, competitive pricing, promotions)
│   ├── marketing-manager.md      — Marketing plan (channel strategy, launch campaigns, CRM)
│   └── cs-architect.md           — CS architecture (FAQ, response templates, escalation)
├── skills/
│   ├── ecommerce-launcher/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── conversion-optimization/
│   │   └── skill.md              — Conversion optimization (detail-page-writer extension)
│   └── product-copy-formulas/
│       └── skill.md              — Product copywriting formulas (detail-page-writer extension)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/ecommerce-launcher` skill, or make a natural language request such as "Help me launch a product online."

## Outputs

All outputs are saved to the `_workspace/` directory:
- `00_input.md` — Product information and launch conditions
- `01_product_plan.md` — Product planning document
- `02_detail_page.md` — Product detail page
- `03_pricing_strategy.md` — Pricing strategy
- `04_marketing_plan.md` — Marketing plan
- `05_cs_guide.md` — Customer service guide
- `06_launch_checklist.md` — Launch checklist

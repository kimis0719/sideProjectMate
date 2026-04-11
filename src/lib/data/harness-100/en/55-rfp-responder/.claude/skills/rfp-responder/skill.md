---
name: rfp-responder
description: "RFI/RFP response full pipeline. An agent team collaborates to generate requirements analysis, capability matching, technical proposal, pricing proposal, and differentiation strategy. Use this skill for requests like 'RFP response', 'write a proposal', 'RFP analysis', 'bid proposal', 'technical proposal', 'pricing proposal', 'public procurement bid', 'RFP response document', 'SI proposal', 'IT project bidding', and other RFP/RFI response needs. Also supports review of existing proposals. However, direct access to government procurement systems, real-time bid price retrieval, and electronic bidding participation are outside the scope of this skill."
---

# RFP Responder — RFI/RFP Response Full Pipeline

An agent team collaborates to generate requirements analysis, capability matching, technical proposal, pricing proposal, and differentiation strategy.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| requirement-analyst | `.claude/agents/requirement-analyst.md` | RFP analysis, evaluation criteria, hidden needs | general-purpose |
| capability-matcher | `.claude/agents/capability-matcher.md` | Track record matching, team composition, gap analysis | general-purpose |
| technical-proposer | `.claude/agents/technical-proposer.md` | Methodology, architecture, schedule, quality management | general-purpose |
| pricing-strategist | `.claude/agents/pricing-strategist.md` | Cost estimation, bidding strategy, price simulation | general-purpose |
| proposal-reviewer | `.claude/agents/proposal-reviewer.md` | Cross-validation, differentiation consistency, score estimation | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by orchestrator)
1. Extract from user input: RFP document, company info, track record, team info
2. Create `_workspace/` and save input to `00_input.md`

### Phase 2: Team Assembly and Execution
| Order | Task | Assigned To | Dependencies | Deliverable |
|-------|------|-------------|-------------|-------------|
| 1 | Requirements Analysis | requirement-analyst | None | `01_requirement_analysis.md` |
| 2 | Capability Matching | capability-matcher | Task 1 | `02_capability_matrix.md` |
| 3 | Technical Proposal | technical-proposer | Tasks 1, 2 | `03_technical_proposal.md` |
| 4 | Pricing Proposal | pricing-strategist | Tasks 1, 2, 3 | `04_pricing_proposal.md` |
| 5 | Review + Differentiation | proposal-reviewer | Tasks 1-4 | `05_differentiation_strategy.md`, `06_review_report.md` |

### Phase 3: Integration and Final Deliverables

## Execution Modes by Request Scale
| Pattern | Mode | Agents |
|---------|------|--------|
| "Full RFP response" | **Full Pipeline** | All 5 |
| "Analyze this RFP" | **Analysis Mode** | requirement-analyst only |
| "Write a technical proposal" | **Technical Mode** | requirement-analyst + capability-matcher + technical-proposer + reviewer |
| "Review this proposal" | **Review Mode** | proposal-reviewer only |

## Agent Extension Skills
| Agent | Extension Skill | Role |
|-------|----------------|------|
| capability-matcher, proposal-reviewer | `win-theme-builder` | Win Theme construction, strength mapping, competitive analysis, proposal strategy |
| pricing-strategist | `pricing-calculator` | Labor cost calculation, overhead/profit calculation, bidding strategy simulation |

---
name: design-system
description: "Full pipeline for systematically building a UI design system. An agent team collaborates to create design tokens, React/Vue component libraries, Storybook, WCAG accessibility verification, and documentation. Use this skill for requests like 'build a design system', 'component library', 'UI kit', 'design tokens', 'Storybook setup', 'accessibility verification', 'WCAG verification', 'UI components', 'create a button component', etc. Note: Figma plugin development, design system SaaS construction, and native app components (SwiftUI/Jetpack Compose) are outside the scope of this skill."
---

# Design System — UI Design System Full Pipeline

An agent team collaborates to build design tokens, components, Storybook, accessibility verification, and documentation.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| token-designer | `.claude/agents/token-designer.md` | Design token design | general-purpose |
| component-developer | `.claude/agents/component-developer.md` | Component development | general-purpose |
| a11y-auditor | `.claude/agents/a11y-auditor.md` | Accessibility verification | general-purpose |
| storybook-builder | `.claude/agents/storybook-builder.md` | Storybook setup | general-purpose |
| doc-writer | `.claude/agents/doc-writer.md` | Documentation | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Brand information**: Brand colors, logo, tone and manner
    - **Framework**: React/Vue/Angular/Web Components
    - **Component scope**: Required component list (or "all")
    - **Accessibility level**: WCAG AA (default) / AAA
    - **Existing system** (optional): Existing design system to migrate from
2. Create the `_workspace/` directory and subdirectories
3. Organize the input and save it to `_workspace/00_input.md`
4. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Token design | token-designer | None | `01_design_tokens/` |
| 2 | Component development | component-developer | Task 1 | `02_components/` |
| 3a | Storybook setup | storybook-builder | Tasks 1, 2 | `03_storybook/` |
| 3b | Accessibility verification | a11y-auditor | Tasks 1, 2 | `04_a11y_report.md` |
| 4 | Documentation | doc-writer | Tasks 1, 2, 3a, 3b | `05_docs/` |

Tasks 3a (Storybook) and 3b (accessibility) run **in parallel**.

**Inter-agent communication flow:**
- token-designer completes > passes token import methods to component-developer, contrast verification to a11y-auditor
- component-developer completes > passes props types to storybook-builder, ARIA status to a11y-auditor
- a11y-auditor > requests fixes from component-developer for P0/P1 issues (up to 2 rounds)
- storybook-builder completes > passes Storybook structure to doc-writer
- a11y-auditor completes > passes accessibility guide to doc-writer
- doc-writer performs final consistency verification across all deliverables

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm all accessibility P0 issues are resolved
3. Present the final summary to the user:
    - Token system — `01_design_tokens/`
    - Components — `02_components/`
    - Storybook — `03_storybook/`
    - Accessibility report — `04_a11y_report.md`
    - Documentation — `05_docs/`

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Build a complete design system" | **Full pipeline** | All 5 agents |
| "Just design tokens" | **Token mode** | token-designer only |
| "Build components from these tokens" | **Component mode** | component-developer + storybook-builder |
| "Accessibility verification only" | **Verification mode** | a11y-auditor only |
| "Just add Storybook" | **Storybook mode** | storybook-builder only |
| "Just write documentation" | **Doc mode** | doc-writer only |
| "Add just a Button component" | **Single component** | component-developer + a11y-auditor + storybook-builder |

**Reusing existing systems**: If existing tokens are available, skip token-designer. If only adding Storybook to existing components, deploy storybook-builder only.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Code, configuration, documentation |
| Message-based | SendMessage | Key information, fix requests, verification results |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Brand color not provided | Start with neutral palette (slate); request colors from user |
| Framework unspecified | Default to React + TypeScript; change after user confirmation |
| Contrast ratio not met | Auto-adjust and report both original and adjusted values |
| Accessibility P0 unresolved | Block release; request re-fix from component-developer |
| Agent failure | Retry once; if still failing, proceed without that deliverable |

## Test Scenarios

### Normal Flow
**Prompt**: "Build a React design system with blue brand colors. I need Button, Input, Card, and Modal"
**Expected result**:
- Tokens: Blue-based color scale, semantic colors, typography, spacing, dark mode
- Components: Button (4 variants, 3 sizes), Input (text/password/search), Card, Modal + shared hooks
- Storybook: Token visualization, Default/AllVariants/Playground stories per component
- Accessibility: WCAG AA compliance verification, keyboard tests, contrast matrix
- Documentation: Design principles, getting started guide, per-component Do/Don't, contribution guide

### Existing File Reuse Flow
**Prompt**: "Add a DatePicker component to the existing design system"
**Expected result**:
- component-developer implements DatePicker using existing tokens
- a11y-auditor verifies date picker accessibility (keyboard, screen reader)
- storybook-builder adds DatePicker stories
- token-designer and doc-writer have minimal involvement

### Error Flow
**Prompt**: "Build a design system" (no colors or framework specified)
**Expected result**:
- token-designer starts with a neutral palette while requesting brand colors from user
- component-developer defaults to React + TypeScript
- a11y-auditor verifies contrast ratios of the default palette
- doc-writer emphasizes the customization guide (how to change colors)

## Agent Extension Skills

Skills that enhance each agent's domain expertise:

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| wcag-checker | `.claude/skills/wcag-checker/skill.md` | a11y-auditor, component-developer | WCAG 2.1 accessibility checklist, contrast calculation, ARIA patterns, keyboard matrix |
| token-generator | `.claude/skills/token-generator/skill.md` | token-designer, component-developer | Design token 3-tier structure, color scale algorithm, typography/spacing/motion system |

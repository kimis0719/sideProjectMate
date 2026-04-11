---
name: wcag-checker
description: "WCAG 2.1/2.2 accessibility verification checklist and automated audit methodology skill. Use for requests like 'verify accessibility', 'WCAG check', 'check contrast ratio', 'ARIA audit', 'keyboard accessibility', 'screen reader test', etc. Note: running actual assistive technology (JAWS/NVDA), legal consultation, and accessibility certification issuance are outside the scope of this skill."
---

# WCAG Checker — Accessibility Verification Checklist + Tools

A domain knowledge skill that enhances the a11y-auditor agent's accessibility verification capabilities.

## Target Agents

- **a11y-auditor** — Uses this skill's checklist and formulas to verify per-component accessibility
- **component-developer** — Checks accessibility requirements proactively during development

## WCAG 2.1 AA Mandatory Criteria Checklist

### 1. Perceivable

| Criterion | Item | Verification Method | Severity |
|----------|------|-------------------|----------|
| 1.1.1 | Alt text for non-text content | `img` has `alt`, decorative images have `alt=""` | P0 |
| 1.3.1 | Info and relationships programmatically determined | Semantic HTML, ARIA roles | P0 |
| 1.3.2 | Meaningful sequence | DOM order = visual order | P1 |
| 1.4.1 | Color not sole means of conveying info | Supplemented with icons/text | P0 |
| 1.4.3 | Contrast ratio minimum 4.5:1 (normal), 3:1 (large) | Contrast ratio formula calculation | P0 |
| 1.4.4 | No content loss at 200% zoom | Use `rem`/`em` units | P1 |
| 1.4.11 | Non-text UI contrast ratio 3:1+ | Focus rings, borders, icons | P0 |

### 2. Operable

| Criterion | Item | Verification Method | Severity |
|----------|------|-------------------|----------|
| 2.1.1 | Keyboard accessible | Tab/Enter/Space/Esc/Arrow behavior | P0 |
| 2.1.2 | No keyboard trap | Tab out possible from all elements | P0 |
| 2.4.3 | Logical focus order | No positive `tabindex` values | P0 |
| 2.4.7 | Visual focus indicator | `:focus-visible` styling | P0 |

### 3. Understandable

| Criterion | Item | Verification Method | Severity |
|----------|------|-------------------|----------|
| 3.1.1 | Page language specified | `<html lang="en">` | P0 |
| 3.2.1 | No context change on focus | Focus alone must not trigger navigation | P0 |
| 3.3.1 | Error identification text provided | Text error messages beyond color alone | P0 |
| 3.3.2 | Labels or instructions | `<label>` association; no placeholder-only usage | P0 |

### 4. Robust

| Criterion | Item | Verification Method | Severity |
|----------|------|-------------------|----------|
| 4.1.2 | Name, role, value programmatically determined | ARIA attribute accuracy | P0 |
| 4.1.3 | Status messages conveyed to assistive technology | `aria-live`, `role="status"` | P1 |

## Contrast Ratio Calculation Formula

### Relative Luminance

```
L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin

Where:
- Normalize sRGB to 0-1 (e.g., #FF -> 1.0)
- C_lin = C_srgb <= 0.04045 ? C_srgb/12.92 : ((C_srgb+0.055)/1.055)^2.4
```

### Contrast Ratio Formula

```
CR = (L_lighter + 0.05) / (L_darker + 0.05)

AA criteria:
- Normal text (< 18pt or < 14pt bold): CR >= 4.5
- Large text (>= 18pt or >= 14pt bold): CR >= 3.0
- UI components/graphics: CR >= 3.0

AAA criteria:
- Normal text: CR >= 7.0
- Large text: CR >= 4.5
```

### Auto-Adjustment When Contrast Not Met

```
1. Calculate contrast ratio of current foreground and background
2. If CR < target:
   a. Adjust L only in HSL color space to preserve hue
   b. Back-calculate L_target: (L_fg + 0.05) / target_CR - 0.05
3. Report both pre- and post-adjustment colors
```

## Per-Component ARIA Patterns

### Button
```html
<button type="button" aria-label="Close" aria-pressed="false">
  <svg aria-hidden="true">...</svg>
</button>
```

### Modal/Dialog
```html
<div role="dialog" aria-modal="true" aria-labelledby="title-id">
  <h2 id="title-id">Title</h2>
  <!-- Focus trap: Tab cycles within dialog only -->
  <!-- Close with Esc, return focus to trigger element on close -->
</div>
```

### Select/Combobox
```html
<div role="combobox" aria-expanded="false" aria-haspopup="listbox">
  <input aria-autocomplete="list" aria-controls="listbox-id" />
  <ul id="listbox-id" role="listbox">
    <li role="option" aria-selected="true">Option 1</li>
  </ul>
</div>
```

### Tab
```html
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Content</div>
```

## Keyboard Interaction Matrix

| Component | Tab | Enter | Space | Esc | Arrow | Home/End |
|----------|-----|-------|-------|-----|-------|----------|
| Button | Focus | Click | Click | - | - | - |
| Checkbox | Focus | Toggle | Toggle | - | - | - |
| Radio | Group focus | Select | Select | - | Cycle | First/Last |
| Select | Focus | Open | Open | Close | Move items | First/Last |
| Modal | Cycle within | - | - | Close | - | - |
| Tab | Tab focus | Activate | Activate | - | Move tabs | First/Last |
| Menu | Focus | Open/Execute | Open/Execute | Close | Move items | First/Last |
| Slider | Focus | - | - | - | Adjust value | Min/Max |

## Verification Report Template

```markdown
## Accessibility Verification Report

### Summary
- Verification Level: WCAG 2.1 AA
- P0 Issues: N (release blocker)
- P1 Issues: N (recommended)

### P0 Issues (Must Fix)
| # | Component | Criterion | Issue | Fix Proposal |

### Contrast Ratio Matrix
| Foreground | Background | Contrast Ratio | AA Normal | AA Large |

### Keyboard Test Results
| Component | Tab | Enter | Space | Esc | Arrow | Result |
```

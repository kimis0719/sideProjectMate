---
name: token-generator
description: "Methodology and tools for systematically generating design tokens. Use for requests like 'create design tokens', 'token system design', 'color scale generation', 'typography scale', 'spacing system', 'dark mode tokens', etc. Note: Figma token plugin execution and Style Dictionary runtime builds are outside the scope of this skill."
---

# Token Generator — Design Token Generation Methodology

A domain knowledge skill that enhances the token-designer agent's token design capabilities.

## Target Agents

- **token-designer** — Uses this methodology when designing color, typography, spacing, and other token systems
- **component-developer** — References naming conventions when consuming tokens in components

## Token Hierarchy (3-Tier)

```
Global (Primitive) > Alias (Semantic) > Component
----------------------------------------------------
blue-500: #3B82F6   primary: blue-500    button-bg: primary
gray-100: #F3F4F6   surface: gray-100    card-bg: surface
```

### Tier 1: Primitive — `{category}-{scale}` (e.g., `blue-500`)
### Tier 2: Semantic — `{purpose}` (e.g., `primary`, `surface`)
### Tier 3: Component — `{component}-{property}-{variant}-{state}`

## Color Scale Generation Algorithm

Input: One brand color > Convert to HSL, then generate a 10-step scale:

| Step | L Adjustment | S Adjustment | Purpose |
|------|-------------|-------------|---------|
| 50   | 95-97% | S x 0.3  | Background tint |
| 100  | 90-93% | S x 0.5  | Hover background |
| 200  | 82-87% | S x 0.7  | Secondary background |
| 300  | 70-76% | S x 0.85 | Border |
| 400  | 58-64% | S x 0.95 | Secondary text |
| 500  | 45-55% | S x 1.0  | Default (input value) |
| 600  | 38-44% | S x 1.0  | Hover |
| 700  | 30-36% | S x 0.95 | Active |
| 800  | 22-28% | S x 0.9  | Emphasized text |
| 900  | 14-20% | S x 0.85 | Maximum emphasis |
| 950  | 8-12%  | S x 0.8  | Near-black |

## Semantic Color Mapping Standard

| Semantic Token | Light Mode | Dark Mode | Purpose |
|---------------|-----------|----------|---------|
| `primary` | blue-500 | blue-400 | Primary action |
| `on-primary` | white | white | Text on primary action |
| `surface` | white | gray-900 | Default background |
| `surface-raised` | white | gray-800 | Card/modal |
| `on-surface` | gray-900 | gray-50 | Default text |
| `on-surface-muted` | gray-500 | gray-400 | Secondary text |
| `border` | gray-200 | gray-700 | Default border |
| `success` | green-500 | green-400 | Success |
| `warning` | amber-500 | amber-400 | Warning |
| `error` | red-500 | red-400 | Error |

## Typography Scale (Major Third 1.250)

```
base = 16px (1rem), ratio = 1.250

| Token | px | rem | Purpose |
|-------|----|-----|---------|
| text-xs | 10.24 | 0.64 | Caption |
| text-sm | 12.80 | 0.80 | Secondary text |
| text-base | 16.00 | 1.00 | Body |
| text-lg | 20.00 | 1.25 | Emphasized body |
| text-xl | 25.00 | 1.563 | Subtitle |
| text-2xl | 31.25 | 1.953 | Title |
| text-3xl | 39.06 | 2.441 | Large title |
| text-4xl | 48.83 | 3.052 | Hero |

Line height: heading 1.2-1.3, body 1.5-1.7, compact 1.25-1.4
Weight: light(300), regular(400), medium(500), semibold(600), bold(700)
```

## Spacing System (4px Base)

| Token | Value | rem | Purpose |
|-------|-------|-----|---------|
| space-1 | 4px | 0.25 | Minimum spacing |
| space-2 | 8px | 0.5 | Inline spacing |
| space-3 | 12px | 0.75 | Compact padding |
| space-4 | 16px | 1.0 | Default padding |
| space-6 | 24px | 1.5 | Section spacing |
| space-8 | 32px | 2.0 | Large spacing |
| space-12 | 48px | 3.0 | Layout spacing |
| space-16 | 64px | 4.0 | Large layout |

## Shadow System

| Token | Value | Purpose |
|-------|-------|---------|
| shadow-sm | 0 1px 3px rgba(0,0,0,0.1) | Card |
| shadow-md | 0 4px 6px rgba(0,0,0,0.1) | Dropdown |
| shadow-lg | 0 10px 15px rgba(0,0,0,0.1) | Modal |
| shadow-xl | 0 20px 25px rgba(0,0,0,0.1) | Popover |

## Motion Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| duration-fast | 150ms | Hover, toggle |
| duration-normal | 250ms | Transition |
| duration-slow | 400ms | Complex animation |
| easing-default | cubic-bezier(0.4, 0, 0.2, 1) | Default |

## Output Formats

### CSS Custom Properties
```css
:root { --color-primary: #3B82F6; --space-4: 1rem; }
[data-theme="dark"] { --color-primary: #60A5FA; }
```

### TypeScript
```typescript
export const tokens = {
  color: { primary: '#3B82F6' },
  space: { 4: '1rem' },
} as const;
```

### JSON (Style Dictionary)
```json
{ "color": { "primary": { "value": "#3B82F6", "type": "color" } } }
```

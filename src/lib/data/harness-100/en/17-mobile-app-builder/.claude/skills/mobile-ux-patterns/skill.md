---
name: mobile-ux-patterns
description: "Mobile UX design pattern library. Provides iOS HIG/Material Design 3 guidelines, navigation patterns, gesture interactions, responsive layouts, and accessibility checklists as a ux-designer extension skill. Use for requests like 'mobile UX', 'iOS guidelines', 'Material Design', 'navigation patterns', 'gestures', 'design tokens', 'mobile accessibility', and other mobile UI/UX design tasks. However, actual design file creation or code implementation is outside this skill's scope."
---

# Mobile UX Patterns — Mobile UX Design Pattern Library

A reference for platform guidelines, navigation patterns, and design tokens that the ux-designer agent uses during mobile app UX design.

## Target Agent

`ux-designer` — Applies this skill's UX patterns and guidelines directly to app design.

## Platform Guideline Core Comparison

### iOS (Human Interface Guidelines) vs Android (Material Design 3)

| Element | iOS HIG | Material Design 3 |
|---------|---------|-------------------|
| **Navigation** | Tab Bar (bottom) + Nav Bar (top) | Bottom Navigation + Top App Bar |
| **Button Style** | Rounded, system blue, minimal | Filled, Outlined, Tonal, Text |
| **Typography** | SF Pro (system) | Roboto (system), customizable |
| **Icons** | SF Symbols, line style | Material Symbols, fill option |
| **Modals** | Sheet (bottom), Alert | Bottom Sheet, Dialog |
| **Swipe** | Back navigation (edge swipe) | Gesture navigation |
| **Colors** | Dynamic Color (light/dark) | Material You (dynamic color) |
| **Touch Targets** | Minimum 44x44pt | Minimum 48x48dp |

## Navigation Patterns

### Pattern Selection Guide

| Pattern | Suited For | Tab Count | Example Apps |
|---------|-----------|-----------|-------------|
| **Tab Bar** | 3-5 main sections | 3-5 | Instagram, YouTube |
| **Drawer** | 6+ sections, includes settings | Unlimited | Gmail, Notion |
| **Stack** | Hierarchical content | - | Settings, detail screens |
| **Tab + Stack** | Deep navigation within sections | 3-5 | Most apps |
| **Bottom Sheet** | Temporary selection/filters | - | Maps, music players |

### Navigation Depth Rules
- Maximum 3-4 depths (Home → Category → List → Detail)
- Must be able to return home from anywhere
- Back navigation always available (back button or edge swipe)
- Current location always identifiable (title, highlight)

## Screen Type Layouts

### List Screen
- Item height: minimum 48dp (iOS 44pt)
- Thumbnail: 40-56dp square/circle
- Title: 16-17sp, 1 line
- Subtitle: 14sp, 1-2 lines, secondary color
- Action: trailing area (icon or switch)
- Divider: 1dp, starting from text start point

### Detail Screen
- Hero image: 100% screen width, 250-300dp height
- Collapsing Toolbar on scroll
- Title: 24-28sp Bold
- Body: 16sp, 1.5 line height
- FAB or bottom-fixed CTA

### Form Screen
- Field spacing: 16-24dp
- Label: above field or floating
- Error message: below field, in red
- Keyboard: match field type (email, number, tel)
- Button: bottom-fixed, shown above keyboard

### Empty State
- Center-aligned illustration/icon
- Title (what is empty)
- Description (what can be done)
- CTA button

## Gesture Interaction Guide

| Gesture | Purpose | Notes |
|---------|---------|-------|
| **Tap** | Select, execute | Always provide visual feedback (ripple/highlight) |
| **Long Press** | Context menu, multi-select | Needs hint (visual cue) |
| **Swipe Left/Right** | Delete/archive, tab switch | Watch for back navigation conflicts |
| **Pull Down** | Refresh | Use standard Pull-to-Refresh |
| **Pinch** | Zoom in/out | Only for images/maps |
| **Drag** | Reorder, move | Show handle icon |

## Design Tokens

### Spacing Scale (8dp base)
| Token | Value | Purpose |
|-------|-------|---------|
| xs | 4dp | Inline element spacing |
| sm | 8dp | Card internal padding |
| md | 16dp | Section spacing, screen margin |
| lg | 24dp | Section separation |
| xl | 32dp | Major section spacing |
| 2xl | 48dp | Hero/header spacing |

### Typography Scale
| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Display | 34-57sp | Bold | 1.12 |
| Headline | 24-32sp | SemiBold | 1.25 |
| Title | 16-22sp | Medium | 1.27 |
| Body | 14-16sp | Regular | 1.5 |
| Label | 11-14sp | Medium | 1.45 |
| Caption | 11-12sp | Regular | 1.33 |

### Color System (Material 3 Based)
| Role | Purpose |
|------|---------|
| Primary | Main CTA, active elements |
| On Primary | Text/icons on Primary |
| Primary Container | Background emphasis |
| Secondary | Secondary buttons, chips |
| Surface | Card, sheet backgrounds |
| Error | Error states |
| Outline | Borders, inactive |

## Accessibility Checklist

- [ ] Touch targets minimum 48x48dp (iOS 44x44pt)
- [ ] Color contrast 4.5:1 or above (text), 3:1 (large text)
- [ ] Do not convey information by color alone (use icons/text alongside)
- [ ] Screen reader labels (contentDescription/accessibilityLabel)
- [ ] Dynamic font size support (Dynamic Type/sp units)
- [ ] Reduced motion setting support (prefers-reduced-motion)
- [ ] Keyboard/external input support
- [ ] Logical focus order

## Performance UX Patterns

| Situation | Pattern | Description |
|-----------|---------|-------------|
| Loading | Skeleton UI | Show layout preview |
| Slow response | Progress Indicator | Show after 0.5 seconds |
| Offline | Cache + Banner | Show cached data + offline notice |
| Error | Retry + Fallback | Retry button + last known good data |
| Optimistic UI | Optimistic Update | Apply immediately, rollback on failure |

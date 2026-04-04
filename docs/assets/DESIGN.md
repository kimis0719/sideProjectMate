# Design System Strategy: The Curated Workspace

## 1. Overview & Creative North Star: "The Digital Curator"
To move beyond a generic "project board" look, this design system is built on the **"Digital Curator"** North Star. We are not building a database; we are building an editorial gallery for innovation. 

The aesthetic is heavily influenced by high-end Korean digital editorial design—characterized by extreme white space, asymmetric balance, and a "paper-on-paper" layering philosophy. We reject the rigid, boxed-in nature of standard SaaS templates. Instead, we use intentional breathing room and tonal shifts to create a professional environment that feels premium, calm, and intellectually stimulating.

---

## 2. Colors & Surface Philosophy
We are moving away from the "line-based" web. This system relies on light and depth to organize information.

### The "No-Line" Rule
Explicitly prohibit the use of `1px` solid borders for sectioning. Structural boundaries must be defined solely through background color shifts. 
- A section of content should sit on `surface_container_low` against a `surface` background.
- This creates an organic transition that feels integrated, not "caged."

### Surface Hierarchy & Nesting
Treat the UI as physical layers. Use the following hierarchy to define importance:
1.  **Base Layer:** `surface` (#f9f9f8) — The canvas.
2.  **Section Layer:** `surface_container_low` (#f3f4f3) — For grouped content areas.
3.  **Component Layer:** `surface_container_lowest` (#ffffff) — For cards and active input areas. This "pure white" pop against the warm ivory base creates a subtle, high-end lift.

### The "Glass & Gradient" Rule
To add "soul" to the professional palette:
- **Glassmorphism:** Floating navigation bars or modal overlays must use `surface` with a `backdrop-blur` of 12px-20px and 80% opacity.
- **Vibrant Accents:** Use the `primary_container` (#2563eb) for high-impact CTAs. For hero areas, apply a subtle linear gradient from `primary` (#004ac6) to `primary_container` (#2563eb) at a 135-degree angle to provide a sense of motion and energy.

---

## 3. Typography
We utilize a dual-font approach to balance editorial authority with functional readability.

| Category | Token | Font | Size | Weight | Intent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope | 3.5rem | 700 | Hero headlines, bold statements. |
| **Headline** | `headline-sm` | Manrope | 1.5rem | 600 | Board section titles. |
| **Title** | `title-md` | Inter | 1.125rem | 600 | Card titles, project names. |
| **Body** | `body-md` | Inter | 0.875rem | 400 | Project descriptions, long-form text. |
| **Label** | `label-md` | Inter | 0.75rem | 600 | Metadata, status badges (Uppercase). |

**Hierarchy Note:** Always pair a `display` heading with a significantly smaller `body-lg` sub-header. This high-contrast scale ratio is the hallmark of premium editorial layouts.

---

## 4. Elevation & Depth
We eschew traditional "box-shadows" in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_lowest` card placed on a `surface_container_low` background creates a natural elevation without the visual clutter of a shadow.
*   **Ambient Shadows:** If a floating element (like a dropdown) requires a shadow, use a custom diffuse shadow: `0 20px 40px rgba(26, 28, 28, 0.04)`. The shadow color must be derived from `on_surface` to keep it natural.
*   **The Ghost Border:** If a boundary is strictly required for accessibility (e.g., in high-contrast modes), use a "Ghost Border": `outline_variant` (#c3c6d7) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Signature Components

### Cards (The "Mate" Board)
*   **Structure:** No borders. Background: `surface_container_lowest`. 
*   **Spacing:** Use `spacing-6` (1.5rem) for internal padding.
*   **Hover State:** Shift background to `surface_bright` and apply a subtle `0.5rem` lift via an ambient shadow. Avoid "growing" the card size; keep the layout stable.

### Buttons (Actionable Logic)
*   **Primary:** Background: `primary_container`. Text: `on_primary`. Roundedness: `lg` (0.5rem).
*   **Tertiary:** Transparent background. Text: `primary`. Used for secondary actions like "Learn More."
*   **Signature Interaction:** On hover, primary buttons should have a slight horizontal expansion (e.g., 4px) rather than just a color change, signaling AI-powered responsiveness.

### Status Badges (The "Board" Pulse)
*   **Recruiting:** Text: `on_secondary_fixed_variant`. Background: A 10% opacity tint of Emerald.
*   **Closed:** Text: `on_tertiary_fixed_variant`. Background: `tertiary_fixed` (#ffdbcd) at 40% opacity.
*   **Layout:** Badges must always use `label-md` uppercase for a "stamped" editorial feel.

### Filters & Chips
*   **Logic:** Filter chips should use `surface_container_high` as their default state. When active, they transition to `primary` with `on_primary` text. No dividers between chips—use `spacing-2` (0.5rem) gaps.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical spacing. A wider left margin (e.g., `spacing-24`) vs. a tighter right margin creates a modern, non-template look.
*   **Do** prioritize vertical rhythm. Use `spacing-12` (3rem) between major board sections to allow the eye to rest.
*   **Do** use `surface_tint` for very subtle "AI-active" highlights in the background of cards.

### Don't
*   **Don't** use lines to separate list items. Use a background shift of 1% or simply `spacing-4` of whitespace.
*   **Don't** use pure black (#000) for text. Always use `on_surface` (#1a1c1c) to maintain the warmth of the ivory base.
*   **Don't** use the `full` (9999px) roundedness for buttons; keep it to `lg` (0.5rem) to maintain a professional, architectural structure. Reserve `full` only for status chips.
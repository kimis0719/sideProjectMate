---
name: color-harmony-engine
description: "A color harmony engine for designing interior color palettes. The 'moodboard-designer' and 'style-analyst' agents must use this skill's color theory, palette formulas, and style-specific palette database when composing color palettes and analyzing styles. Used for 'color palette design', 'color harmony', 'color psychology', etc. Furniture selection and budget management are outside this skill's scope."
---

# Color Harmony Engine — Interior Color Harmony Engine

Provides systematic color theory, palette formulas, and psychological effects for interior design.

## Basic Palette Formulas

### 60-30-10 Rule

```
60% — Dominant: Walls, ceiling, large furniture
30% — Secondary: Fabric, curtains, rugs, small furniture
10% — Accent: Cushions, accessories, artwork

Example (Scandinavian):
  60% White (#FAFAFA)
  30% Light Gray (#D5D5D5) + Natural Wood
  10% Mustard Yellow (#E8B730)
```

### Color Harmony Types

| Type | Description | Feel | Suitable Spaces |
|------|-------------|------|-----------------|
| Monochromatic | Value/saturation shifts of a single hue | Unity, sophistication | Bedroom, study |
| Analogous | Adjacent hues (30 degrees on color wheel) | Natural, comfortable | Living room, cafe |
| Complementary | Opposite hues (180 degrees) | Bold, dynamic | Accent wall, kids' room |
| Split-complementary | Adjacent to complement (150 degrees) | Harmony + energy | Living room, dining |
| Triadic | 3 hues at 120 degree intervals | Balanced energy | Kids' room, playroom |
| Neutral | Achromatics + natural tones | Refined, calm | Minimal spaces |

## Interior Style Color Palettes

### Scandinavian

```
Dominant: White #FFFFFF, Off-White #F5F0EB
Secondary: Light Gray #D5D5D5, Natural Oak #C4A574
Accent: Mustard #E8B730, Dusty Pink #D4A5A5, Sage Green #8FA98C
Materials: Solid wood, linen, wool
```

### Modern

```
Dominant: White #FFFFFF, Cool Gray #9E9E9E
Secondary: Charcoal #333333, Black #1A1A1A
Accent: Electric Blue #2979FF, Red #D32F2F
Materials: Metal, glass, high-gloss
```

### Natural/Organic

```
Dominant: Ivory #FFFFF0, Beige #F5F0DC
Secondary: Terracotta #C2703E, Olive Green #6B8E23
Accent: Mud Brown #6F4E37, Rust #B7410E
Materials: Rattan, hemp, cotton, earthenware
```

### Mid-Century Modern

```
Dominant: White #FAFAFA, Warm Wood #A67B5B
Secondary: Teal #008080, Olive #808000
Accent: Orange #FF6D00, Gold #FFD700
Materials: Walnut, leather, velvet
```

### Industrial

```
Dominant: Concrete Gray #B0B0B0, Dark Gray #4A4A4A
Secondary: Black #1A1A1A, Dark Brown #3E2723
Accent: Orange #E65100, Amber #FFAB00
Materials: Exposed brick, steel, aged wood
```

## Color Psychology — Application by Space

| Color Family | Psychological Effect | Suitable Spaces | Unsuitable Spaces |
|-------------|---------------------|-----------------|-------------------|
| Blue | Stability, focus, trust | Study, bedroom, bathroom | Dining room (suppresses appetite) |
| Green | Relaxation, nature, balance | Living room, bedroom, balcony | - |
| Yellow | Brightness, energy, creativity | Kitchen, kids' room, entryway | Bedroom (overstimulating) |
| Red | Passion, appetite, energy | Dining room, accent wall | Bedroom, study |
| Purple | Luxury, mystery, creativity | Bedroom, study | Kitchen, living room |
| Orange | Warmth, sociability, energy | Living room, dining area | Bedroom |
| Neutral | Stability, refinement, openness | All spaces | - |

## Color Strategy by Space Size

```
Small spaces (<330 sq ft):
  - Light-toned dominant color (creates sense of expansion)
  - Ceiling color = wall color or lighter
  - Minimize accent colors (prevents visual clutter)
  - Use mirrors (visual expansion)

Large spaces (>660 sq ft):
  - Medium to dark tones are viable (creates coziness)
  - Color zoning by area is possible
  - Bold accent colors can be used
  - Texture variation adds depth

High ceilings:
  - Paint ceiling 1-2 shades darker than walls (cozier feel)

Low ceilings:
  - Paint ceiling lighter than walls (appears taller)
  - Vertical stripe patterns
```

## Color Palette Output Format

```markdown
## Color Palette

**Style**: [Style Name]
**Harmony type**: [Monochromatic/Analogous/Complementary, etc.]

| Role | Color Name | HEX | Application | Ratio |
|------|-----------|-----|-------------|-------|
| Dominant | Off-White | #F5F0EB | Walls, ceiling | 60% |
| Secondary 1 | Warm Gray | #B8AFA6 | Sofa, curtains | 20% |
| Secondary 2 | Natural Oak | #C4A574 | Table, shelving | 10% |
| Accent | Sage Green | #8FA98C | Cushions, planters | 10% |
```

## References

- Pantone and NCS color system references
- Detailed palette combinations: see `references/color-palettes.md`

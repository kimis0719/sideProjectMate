---
name: color-psychology
description: "A color psychology skill used by the visual-director agent. Provides color-emotion mapping, industry-specific color strategies, accessibility-based palette design, and color system construction methodologies. Used for 'color palette,' 'color strategy,' 'color psychology,' 'brand colors,' and related topics."
---

# Color Psychology — Color Psychology Methodology

Expert knowledge used by the visual-director agent when designing brand color systems.

## Why Color Defines a Brand

Color is perceived before the logo. Research shows that **62-90% of consumers form their first impression based on color alone**. Coca-Cola's red, Tiffany's teal, Starbucks' green — color is brand.

## Color-Emotion Response Matrix

### Primary Colors

| Color | Positive Associations | Negative Associations | Industry Fit | Representative Brands |
|-------|---------------------|---------------------|-------------|---------------------|
| **Red** | Passion, energy, urgency | Danger, aggression | Food, media, sales | Coca-Cola, YouTube, Netflix |
| **Blue** | Trust, stability, expertise | Coldness, conservatism | Finance, IT, healthcare | Samsung, Facebook, IBM |
| **Green** | Nature, growth, health | Immaturity, greed | Eco-friendly, health, finance | Starbucks, Spotify, Whole Foods |
| **Yellow** | Optimism, warmth, creativity | Caution, anxiety | Food, children, entertainment | McDonald's, IKEA, Snapchat |
| **Orange** | Friendliness, vitality, fun | Cheapness | Telecom, sports, food | Amazon, Nickelodeon, Fanta |
| **Purple** | Luxury, creativity, mystery | Exaggeration, unease | Beauty, luxury, tech | Twitch, Yahoo, Cadbury |
| **Black** | Luxury, authority, sophistication | Heaviness, mourning | Luxury, fashion, tech | Chanel, Apple, Nike |
| **White** | Purity, minimalism, cleanliness | Emptiness, coldness | Healthcare, tech, beauty | Apple, Muji |

### Color Temperature and Brand Positioning

```
Warm <----------------------------------> Cool
Red    Orange   Yellow  |  Green   Blue   Purple
Passion Friendly Optimism| Balance  Trust  Luxury
Impulsive <--------------------------------> Rational
```

## Building a Brand Color Palette

### The 60-30-10 Rule

| Ratio | Role | Use |
|-------|------|-----|
| **60%** | Primary Color | Backgrounds, large areas |
| **30%** | Secondary Color | Section dividers, highlighted areas |
| **10%** | Accent Color | CTA buttons, key elements |

### Palette Composition Types

| Type | Color Relationship | Feel | Suited For |
|------|-------------------|------|-----------|
| **Monochromatic** | Lightness/saturation variations of one color | Refined, consistent | Minimal, luxury |
| **Analogous** | 3-4 adjacent colors on the color wheel | Harmonious, stable | Nature, wellness |
| **Complementary** | Opposite sides of the color wheel | Contrasting, energetic | Sports, entertainment |
| **Split-Complementary** | Two colors flanking the complement | Contrast + stability | Versatile |
| **Triadic** | 120-degree intervals on the color wheel | Vibrant, diverse | Children, creative |

### Palette Design Process

1. **Extract emotional keywords from brand essence**: "Trust + Innovation" -> Blue family + orange as accent
2. **Analyze competitor colors**: Avoid identical colors or differentiate intentionally
3. **Determine primary color**: Select the optimal color from the emotion matrix
4. **Determine palette type**: Choose composition matching brand personality
5. **Verify accessibility**: Ensure WCAG AA contrast ratios or higher
6. **Test across applications**: Test on logos, web, print, social media, and all touchpoints

## Color Accessibility Standards

| Standard | Contrast Ratio | Use |
|----------|---------------|-----|
| **WCAG AA** | 4.5:1 (body text), 3:1 (large text) | Minimum requirement |
| **WCAG AAA** | 7:1 (body text), 4.5:1 (large text) | Recommended standard |

### Accessibility Checklist
- [ ] Text-background contrast ratio meets AA or higher
- [ ] Color blindness simulation (red-green, blue-yellow, total color blindness)
- [ ] Distinguishable in grayscale conversion
- [ ] Dark mode color variants defined

## Color Code Specification Format

```
## Brand Color System

### Primary Color
- Name: [Brand-specific name]
- HEX: #XXXXXX
- RGB: R, G, B
- CMYK: C, M, Y, K
- Pantone: XXXX C
- Use: Logo, primary backgrounds, headers

### Secondary Color
- ...

### Accent Color
- ...

### Neutral Colors
- White: #FFFFFF
- Light Gray: #F5F5F5
- Dark Gray: #333333
- Black: #000000

### Prohibited Usage Rules
- No secondary color text on primary color background
- Accent color must not exceed 10% of total area
- [Specific color combination] prohibited - fails accessibility
```

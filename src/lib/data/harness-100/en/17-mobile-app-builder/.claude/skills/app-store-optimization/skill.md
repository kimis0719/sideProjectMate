---
name: app-store-optimization
description: "App Store Optimization (ASO) guide. Provides App Store/Google Play metadata optimization, keyword strategy, screenshot guidelines, review rejection response, and category selection as a store-manager extension skill. Use for requests like 'ASO', 'app store optimization', 'keyword strategy', 'screenshot guide', 'review response', 'app description writing', and other store deployment optimization tasks. However, actual store submission or ad management is outside this skill's scope."
---

# App Store Optimization — ASO Guide

A reference for metadata optimization, keyword strategy, and review guidelines that the store-manager agent uses during app store deployment.

## Target Agent

`store-manager` — Applies this skill's ASO strategies and guidelines directly to store deployment preparation.

## Metadata Optimization Matrix

### App Store (iOS) vs Google Play

| Field | App Store | Google Play | ASO Impact |
|-------|----------|-------------|-----------|
| **App Name** | 30 chars | 30 chars | Highest |
| **Subtitle** | 30 chars | N/A | High (iOS) |
| **Keywords** | 100 chars (hidden field) | N/A (extracted from description) | High |
| **Short Description** | N/A | 80 chars | High (Android) |
| **Long Description** | 4,000 chars | 4,000 chars | Medium (High for Android) |
| **Screenshots** | Up to 10 | Up to 8 | High |
| **Preview Video** | 30 sec, up to 3 | 30 sec-2 min, 1 | Medium |
| **Category** | Primary + Secondary | 1 | Medium |

## Keyword Strategy

### Keyword Selection Process
1. **Seed Keywords**: Extract from app core features (5-10)
2. **Expanded Keywords**: Synonyms, related terms, long-tail (20-30)
3. **Competitive Analysis**: Check competitor app keywords
4. **Filtering**: Prioritize by search volume + difficulty + relevance
5. **Placement**: Priority order: title > subtitle > keyword field > description

### iOS Keyword Field Optimization (100 chars)
- Separate with commas, no spaces
- Do not duplicate words already in app name/subtitle (waste)
- Singular form only (plural auto-matched)
- Exclude articles and prepositions
- Example: `todo,task,schedule,checklist,memo,plan,productivity,habit,routine,reminder`

### Google Play Description Optimization
- First 5 lines are key (before fold)
- Naturally repeat keywords 3-5 times
- List features with bullet points
- Include CTA ("Download now")

## Screenshot Guidelines

### Size Specifications
| Device | App Store (px) | Google Play (px) |
|--------|---------------|-----------------|
| iPhone 6.7" | 1290 x 2796 | - |
| iPhone 6.5" | 1284 x 2778 | - |
| iPad 12.9" | 2048 x 2732 | - |
| Android Phone | - | 1080 x 1920 (16:9) |
| Android Tablet | - | 1200 x 1920 |

### Screenshot Content Strategy
| Order | Content | Purpose |
|-------|---------|---------|
| 1st | Core value proposition (hero) | "Why do you need this app" |
| 2nd | Core Feature #1 | Most-used feature |
| 3rd | Core Feature #2 | Differentiating feature |
| 4th | Core Feature #3 | Additional feature |
| 5th | Social proof | Awards, ratings, press |

### Screenshot Design Principles
- Caption text within 20-30 characters
- Text top / app screen bottom layout (or reverse)
- Consistent color theme (brand colors)
- Device frame optional (trend: frameless)
- Show realistic data in app UI (no Lorem ipsum)

## Major Review Rejection Reasons & Responses

### App Store (Apple) Top Rejection Reasons

| Rank | Guideline | Reason | Response |
|------|----------|--------|---------|
| 1 | 4.0 Design | Bugs, crashes, incomplete features | Fully test all features before submission |
| 2 | 2.1 Performance | Insufficient app completeness | Even MVP must have fully working core flow |
| 3 | 4.3 Spam | Duplicate of existing app | Clearly describe differentiators |
| 4 | 5.1.1 Data Collection | Privacy collection not explained | Privacy Policy + purpose disclosure |
| 5 | 3.1.1 In-App Purchase | Non-IAP payment used | Digital content must use IAP |
| 6 | 2.5.1 Software Requirements | Private API usage | Use only public APIs |

### Google Play Top Rejection Reasons

| Reason | Response |
|--------|---------|
| Crashes/ANR | Test automation, crash reporting |
| Excessive permission requests | Minimum permission principle, request at point of use |
| Incomplete Data Safety section | Accurately fill Data Safety Form |
| Target age not set | Clearly specify children targeting |
| IP infringement | Do not use third-party logos/names without permission |

## App Description Writing Formula

### Structure
```
[Headline: One sentence core value]

[3-5 core feature bullets]

[Social proof: Download count, ratings, awards]

[Detailed feature description]

[CTA: Download now]

[Natural keyword insertion area]
```

## Category Selection Guide

| App Type | Recommended iOS Category | Recommended Google Play Category |
|---------|------------------------|-------------------------------|
| To-do/Productivity | Productivity | Productivity |
| Social/Community | Social Networking | Social |
| Shopping | Shopping | Shopping |
| Health/Fitness | Health & Fitness | Health & Fitness |
| Education | Education | Education |
| Finance | Finance | Finance |
| Utilities | Utilities | Tools |
| Food Delivery | Food & Drink | Food & Drink |

### Category Strategy
- Primary category: Most accurate classification (search visibility priority)
- Secondary category (iOS): Additional exposure opportunity → choose lower-competition category
- Category rank matters more than overall rank

## Release Notes Writing Guide

| Item | Rule |
|------|------|
| Length | 3-5 lines (considering user read rate) |
| Structure | New features > Improvements > Bug fixes |
| Tone | Friendly and clear (avoid jargon) |
| Emojis | Moderate (1-2, for category separation) |
| Keywords | Naturally include key keywords (ASO) |

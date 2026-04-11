---
name: character-design-system
description: "A character design system skill used by the storyboarder and image-generator agents. Provides character sheet design, silhouette testing, expression charts, and AI image generation consistency methodologies. Used for 'character design,' 'character sheet,' 'visual consistency,' 'character setup,' and related topics."
---

# Character Design System — Character Design Methodology

Expert knowledge used by the storyboarder and image-generator agents when designing characters and generating consistent images.

## Why a System Is Needed

The biggest challenge in AI image generation is **character consistency**. If the face changes from panel to panel, the comic falls apart. A systematic character sheet and prompt strategy are the keys to consistency.

## Character Sheet Design

### Required Components

```
Character Sheet
├── Full-body front view (default pose)
├── Full-body side view
├── Full-body back view
├── Face close-up (3/4 angle)
├── Expression chart (6 basic emotions)
├── Outfit design (default + variations)
└── Props/Accessories
```

### Character Specification Template

```
## [Character Name]

### Basic Info
- Age: / Gender: / Height: / Body type:
- Role: Protagonist / Antagonist / Supporting / Extra

### Key Visual Traits (AI Prompt Fixed Values)
- Hair: [Color], [Length], [Style] (e.g., "short black hair, messy")
- Eyes: [Color], [Distinctive features] (e.g., "sharp dark brown eyes")
- Body type: [Type] (e.g., "athletic build, broad shoulders")
- Distinguishing features: [Scars, glasses, tattoos, etc.]

### Outfit
- Default: [Detailed description]
- Variations: [Context-specific outfits]

### Prompt Anchor Phrase
"[gender] [age range], [hair], [eyes], [body type], [clothing], [distinctive feature]"
-> Insert this phrase identically into every panel's prompt
```

## Silhouette Test

Good character design should be **identifiable from the silhouette alone**.

### Silhouette Differentiation Elements

| Element | Differentiation Method |
|---------|----------------------|
| **Body Type** | Exaggerate height and build differences |
| **Hairstyle** | Give each character a unique silhouette shape |
| **Posture** | Assign different default poses (habitual stances) |
| **Props** | Items they always carry (staff, book, hat) |
| **Clothing Silhouette** | Capes, coat tails, hoods, etc. |

### Key Character Differentiation Checklist

- [ ] When three characters are side by side, can they be distinguished by silhouette alone?
- [ ] Can each character be identified when converted to black and white?
- [ ] Can characters be told apart in a reduced thumbnail?

## Expression Chart (Expression Sheet)

### Six Basic Expressions

| Emotion | Eyes | Eyebrows | Mouth | Other |
|---------|------|----------|-------|-------|
| **Joy** | Crescent-shaped, narrowed | Raised | Wide open/Smile | Flushed cheeks |
| **Sadness** | Drooping, moist | Inner ends raised | Downturned | Tears, head lowered |
| **Anger** | Sharp, narrowed | V-shaped downward | Clenched/Open | Forehead veins |
| **Fear** | Wide open, small pupils | Raised | Open | Sweat, trembling |
| **Surprise** | Wide open, dilated pupils | Raised | O-shaped | Leaning back |
| **Contempt** | Half-closed | One side raised | Smirk/One side up | Head turned away |

### Character-Specific Expression Variations

The same emotion is **expressed differently based on character personality**:

| Emotion | Energetic Character | Cool Character | Timid Character |
|---------|-------------------|----------------|-----------------|
| Joy | Cheering, jumping | Subtle smile | Shy smile, averted eyes |
| Anger | Shouting, violent gestures | Cold stare | Teary-eyed, clenched fists |
| Surprise | "Whoa!" exaggerated reaction | Eyes widen slightly | Steps back, covers mouth |

## AI Image Generation Consistency Strategy

### Reference-Based Generation

1. Generate character sheet first as a reference image
2. Use the reference in all subsequent panel generation prompts

### Prompt Consistency Rules

1. **Anchor Phrase**: Copy identical character appearance description into every prompt
2. **Style Lock**: Consistently use the same style instruction (e.g., "Korean manhwa style")
3. **Negative Prompt**: Include prevention phrases like "different face, inconsistent design"
4. **Reference Image Required**: Always include the character sheet as reference
5. **Outfit Changes Must Be Explicit**: When outfit changes, start with "same character, new outfit:"

### Handling Consistency Breaks

| Problem | Cause | Solution |
|---------|-------|---------|
| Face changes | Appearance description missing from prompt | Reinsert anchor phrase + reference |
| Body type changes | Distortion from angle | Explicitly specify body type ("athletic build," etc.) |
| Outfit changes | Outfit not specified in prompt | Always include outfit description |
| Color changes | Lighting variation | Specify intrinsic colors ("always red jacket") |

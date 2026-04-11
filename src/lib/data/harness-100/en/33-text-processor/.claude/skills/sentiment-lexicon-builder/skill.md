---
name: sentiment-lexicon-builder
description: "Sentiment lexicon construction, ABSA (Aspect-Based Sentiment Analysis) design, sentiment score calibration, and domain-specific sentiment analysis methodology guide. Use this skill for requests involving 'sentiment lexicon', 'sentiment analysis model', 'ABSA', 'aspect-based sentiment', 'sentiment score', 'polarity lexicon', 'domain sentiment', 'emotion classification', etc. Enhances the sentiment analysis capabilities of the sentiment-analyzer agent. Note: text preprocessing and report writing are outside the scope of this skill."
---

# Sentiment Lexicon Builder — Sentiment Lexicon and ABSA Design Guide

Methodology for designing and building domain-specific sentiment analysis systems.

## Sentiment Analysis Approach Comparison

| Approach | Advantages | Disadvantages | Best For |
|----------|-----------|---------------|----------|
| Lexicon-based | Fast, interpretable | Domain limitations, ignores context | Small-scale, rapid prototyping |
| ML-based (traditional) | Domain adaptation | Requires training data | When labeled data is available |
| Deep learning (BERT) | Context understanding, high accuracy | Resource-intensive | Large-scale, accuracy-focused |
| LLM (prompt-based) | Zero-shot, flexible | Cost, speed | Diverse domains, small volumes |

## Sentiment Lexicon Construction

### Basic Lexicon (Korean)

```python
SENTIMENT_LEXICON = {
    # Positive (1.0 to 0.1)
    "good": 0.8, "excellent": 0.9, "satisfied": 0.7, "recommend": 0.8,
    "convenient": 0.7, "clean": 0.6, "best": 0.9, "friendly": 0.8,
    "fast": 0.6, "affordable": 0.5,

    # Negative (-0.1 to -1.0)
    "bad": -0.8, "complaint": -0.7, "disappointed": -0.8, "slow": -0.6,
    "expensive": -0.5, "inconvenient": -0.7, "worst": -0.9, "unfriendly": -0.8,
    "broken": -0.7, "refund": -0.6,

    # Intensity modifiers
    "very": 1.5,    # Intensifier
    "slightly": 0.5,    # Diminisher
    "really": 1.5,
    "a bit": 0.5,
    "too": 1.3,    # Can modify both positive and negative depending on context
}

NEGATION_WORDS = {"not", "no", "never", "cannot", "without", "none"}
```

### Automated Domain-Specific Lexicon Construction

```python
def build_domain_lexicon(corpus, labels, base_lexicon, top_n=200):
    """
    Automated domain sentiment lexicon construction using TF-IDF + PMI

    1. Extract top TF-IDF words from positive and negative reviews respectively
    2. Calculate sentiment polarity using PMI (Pointwise Mutual Information)
    3. Merge with the base lexicon
    """
    pos_texts = [t for t, l in zip(corpus, labels) if l == 'positive']
    neg_texts = [t for t, l in zip(corpus, labels) if l == 'negative']

    # Occurrence probability within each class
    for word in vocabulary:
        p_word = count(word, corpus) / len(corpus)
        p_pos = count(word, pos_texts) / len(pos_texts)
        p_neg = count(word, neg_texts) / len(neg_texts)

        pmi_pos = log2(p_pos / p_word) if p_pos > 0 else 0
        pmi_neg = log2(p_neg / p_word) if p_neg > 0 else 0

        polarity = pmi_pos - pmi_neg  # Positive value = positive sentiment, negative value = negative sentiment

    return domain_lexicon
```

## ABSA (Aspect-Based Sentiment Analysis)

### Design Structure

```
Input: "Shipping was fast but the product quality is poor"

1. Aspect Extraction:
   - "Shipping" -> [Shipping/Service]
   - "Quality" -> [Product/Quality]

2. Aspect-Level Sentiment Analysis:
   - Shipping: "fast" -> Positive (0.6)
   - Quality: "poor" -> Negative (-0.7)

3. Result:
   {
     "overall": -0.05,
     "aspects": {
       "Shipping": {"sentiment": "positive", "score": 0.6, "keywords": ["fast"]},
       "Quality": {"sentiment": "negative", "score": -0.7, "keywords": ["poor"]}
     }
   }
```

### Aspect Category Design (E-commerce Example)

```yaml
aspects:
  Product:
    Quality: [quality, material, fabric, texture, finish, durability]
    Design: [design, color, shade, shape, appearance]
    Size: [size, dimensions, fit, fitting]
    Price: [price, value for money, expensive, affordable, reasonable]
  Service:
    Shipping: [shipping, delivery, courier, arrival]
    Packaging: [packaging, box, package]
    Returns: [exchange, refund, return, warranty, after-sales]
    Customer Support: [support, consultation, friendly, unfriendly, responsive]
```

## Sentiment Score Calibration

### Negation Handling

```python
def handle_negation(tokens, scores):
    """Reverse sentiment for up to 3 tokens following a negation word"""
    negation_window = 0
    adjusted = []
    for token, score in zip(tokens, scores):
        if token in NEGATION_WORDS:
            negation_window = 3
        elif negation_window > 0:
            score = -score * 0.8  # 80% reversal rather than full inversion
            negation_window -= 1
        adjusted.append(score)
    return adjusted
```

### Intensity Modifier Handling

```python
def apply_intensifiers(tokens, scores):
    """Adjust scores based on intensity modifiers"""
    adjusted = []
    for i, (token, score) in enumerate(zip(tokens, scores)):
        if i > 0 and tokens[i-1] in INTENSIFIERS:
            score *= INTENSIFIERS[tokens[i-1]]
        adjusted.append(score)
    return adjusted
```

### Emoji Sentiment Mapping

```python
EMOJI_SENTIMENT = {
    "😊": 0.8, "😍": 0.9, "👍": 0.7, "❤️": 0.8, "🙏": 0.5,
    "😡": -0.9, "😤": -0.7, "👎": -0.8, "😢": -0.6, "💔": -0.7,
    "😐": 0.0, "🤔": -0.1,
}
```

## Sentiment Analysis Evaluation Metrics

```python
# Sentiment classification evaluation
from sklearn.metrics import classification_report

print(classification_report(y_true, y_pred,
    target_names=['Negative', 'Neutral', 'Positive']))

# ABSA evaluation
# - Aspect extraction: Precision, Recall, F1
# - Aspect-level sentiment: Accuracy, Macro-F1
# - Overall: Micro-F1 (both aspect extraction and sentiment must be correct)
```

## Report Structure

```markdown
## Sentiment Analysis Results

### Overall Summary
| Polarity | Count | Percentage |
|----------|-------|------------|
| Positive | 650 | 65% |
| Neutral | 150 | 15% |
| Negative | 200 | 20% |

### Aspect-Level Sentiment
| Aspect | Positive | Negative | Score | Key Terms |
|--------|----------|----------|-------|-----------|
| Shipping | 80% | 10% | +0.6 | fast, accurate |
| Quality | 40% | 45% | -0.2 | poor, weak |

### Time Series Trends
### Key Negative Patterns (Action Items)
```

---
name: nlp-preprocessing-toolkit
description: "Text preprocessing technique catalog: tokenization, normalization, stopwords, morphological analysis, embedding selection, and language-specific processing guides. Use this skill for requests involving 'text preprocessing', 'tokenization', 'morphological analysis', 'KoNLPy', 'stopwords', 'normalization', 'TF-IDF', 'embeddings', 'Word2Vec', 'NLP preprocessing', etc. Enhances the text processing capabilities of the preprocessor and extractor agents. Note: sentiment analysis models and classification algorithm selection are outside the scope of this skill."
---

# NLP Preprocessing Toolkit — Text Preprocessing Tools Guide

A catalog of preprocessing techniques for transforming text data into analysis-ready formats.

## Preprocessing Pipeline

```
Raw Text
├── 1. Encoding normalization (UTF-8)
├── 2. HTML/special character removal
├── 3. Unicode normalization (NFKC)
├── 4. Lowercasing (for alphabetic scripts)
├── 5. Tokenization
├── 6. Stopword removal
├── 7. Morphological analysis / stemming
├── 8. Regex filtering
└── 9. Vectorization (TF-IDF / embeddings)
```

## Language-Specific Processing (Korean)

### Morphological Analyzer Comparison

| Analyzer | Speed | Accuracy | Custom Dictionary | Installation |
|----------|-------|----------|-------------------|-------------|
| Mecab | Fastest | High | Yes | C dependency |
| Okt (Twitter) | Fast | Medium | Yes | Java dependency |
| Komoran | Medium | High | Yes | Java dependency |
| Kkma | Slow | High | No | Java dependency |
| Kiwi | Fast | High | Yes | Python native |

```python
# Kiwi (easiest installation, excellent performance)
from kiwipiepy import Kiwi
kiwi = Kiwi()

tokens = kiwi.tokenize("FatherEnteredTheRoom")
# [Token(form='Father', tag='NNG'), Token(form='subject', tag='JKS'),
#  Token(form='Room', tag='NNG'), Token(form='to', tag='JKB'),
#  Token(form='entered', tag='VV'), Token(form='hon', tag='EP'),
#  Token(form='past', tag='EP'), Token(form='decl', tag='EF')]

# Extract nouns only
nouns = [t.form for t in tokens if t.tag.startswith('NN')]
```

### Korean Text Normalization

```python
import re, unicodedata

def normalize_korean(text):
    # Unicode normalization (compatibility decomposition + canonical composition)
    text = unicodedata.normalize('NFKC', text)

    # Remove repeated characters ("xxxxx" -> "xx")
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)

    # Remove standalone consonants/vowels (repeated consonants/vowels, etc. may be preserved for sentiment analysis)
    # text = re.sub(r'[\u3131-\u3163]+', '', text)

    # Keep only alphanumeric characters, Korean characters, and whitespace
    text = re.sub(r'[^\w\s\u3131-\uD79D]', ' ', text)

    # Remove multiple whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text
```

### Korean Stopwords

```python
KOREAN_STOPWORDS = {
    # Particles (Korean grammatical markers)
    'i', 'ga', 'eun', 'neun', 'eul', 'reul', 'e', 'ui', 'wa', 'gwa',
    'do', 'ro', 'eseo', 'kkaji', 'buteo', 'man', 'euro',
    # Pronouns
    'geu', 'i', 'jeo', 'geot', 'su', 'deung', 'deul',
    # Adverbs
    'maeu', 'aju', 'jeongmal', 'neomu', 'jal', 'tto', 'deo',
    # Conjunctions/Interjections
    'geurigo', 'hajiman', 'geureonde', 'geuraeseo',
}
```

## Text Vectorization

### TF-IDF

```python
from sklearn.feature_extraction.text import TfidfVectorizer

vectorizer = TfidfVectorizer(
    max_features=10000,
    min_df=2,           # Must appear in at least 2 documents
    max_df=0.95,        # Exclude if appearing in more than 95% of documents
    ngram_range=(1, 2), # Unigrams + bigrams
    sublinear_tf=True,  # 1 + log(tf) — dampens high-frequency terms
)
tfidf_matrix = vectorizer.fit_transform(texts)
```

### Embedding Selection Guide

| Method | Dimensions | Best For | Characteristics |
|--------|-----------|----------|----------------|
| TF-IDF | High-dimensional (sparse) | Keyword-centric, small-scale | Interpretable, fast |
| Word2Vec | 100-300 | Similarity, analogies | Word-level, limited context |
| FastText | 100-300 | Korean, OOV handling | Subword-based, robust to unseen words |
| BERT | 768 | Classification, NER, QA | Context-dependent, bidirectional |
| Sentence-BERT | 384-768 | Document similarity, search | Sentence-level embeddings |

```python
# Sentence-BERT (Korean)
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('jhgan/ko-sroberta-multitask')
embeddings = model.encode(texts, show_progress_bar=True)
# Cosine similarity
from sklearn.metrics.pairwise import cosine_similarity
sim_matrix = cosine_similarity(embeddings)
```

## Text Quality Metrics

| Metric | Calculation | Threshold |
|--------|------------|-----------|
| Average token count | Tokens per text | < 3 indicates analysis limitations |
| Vocabulary diversity | Unique tokens / total tokens | 0.2-0.8 is acceptable |
| Language purity | Proportion of primary language | > 90% recommended |
| Missing rate | Proportion of empty texts | < 5% |
| Duplication rate | Proportion of identical texts | < 10% |

## Preprocessing Decision Checklist

- [ ] Encoding issues resolved (e.g., CP949)
- [ ] HTML tags/URLs removed
- [ ] Emoji handling decided (remove vs. convert to text vs. use for sentiment)
- [ ] Number handling decided (remove vs. tokenize vs. replace with [NUM])
- [ ] Morphological analyzer selected
- [ ] Stopword list customized for domain
- [ ] Minimum token count filtering applied
- [ ] Vectorization method selected

# Text Processor Harness

Text processing pipeline: a harness in which an agent team collaborates to transform bulk text into summaries, classifications, entity extractions, and sentiment analyses, producing structured data and reports.

## Structure

```
.claude/
├── agents/
│   ├── preprocessor.md      — Preprocessing (tokenization, normalization, noise removal, language detection)
│   ├── classifier.md        — Classification engine (topic classification, intent classification, multi-label tagging)
│   ├── extractor.md         — Extraction specialist (named entities, keywords, relations, summary generation)
│   ├── sentiment-analyzer.md — Sentiment analysis (polarity, emotion, aspect-based sentiment, opinion mining)
│   └── report-writer.md     — Report writing (structured data integration, insights, visualization)
├── skills/
│   ├── text-processor/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── nlp-preprocessing-toolkit/
│   │   └── skill.md              — Text preprocessing tools guide
│   └── sentiment-lexicon-builder/
│       └── skill.md              — Sentiment lexicon and ABSA design guide
└── CLAUDE.md                — This file
```

## Usage

Trigger the `/text-processor` skill, or make a natural language request such as "Analyze this text."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — User input and text source summary
- `01_preprocessing_result.md` — Preprocessing results and text statistics
- `02_classification_result.md` — Classification results
- `03_extraction_result.md` — Extraction results (entities, keywords, summaries)
- `04_sentiment_result.md` — Sentiment analysis results
- `05_final_report.md` — Final integrated report
- `structured_data/` — JSON/CSV structured data

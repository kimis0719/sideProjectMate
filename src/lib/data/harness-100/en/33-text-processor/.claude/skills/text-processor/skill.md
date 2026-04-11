---
name: text-processor
description: "Text processing pipeline: an agent team collaborates to perform preprocessing, classification, entity/keyword extraction, sentiment analysis, summarization, structured data conversion, and report generation on bulk text. Use this skill for requests like 'analyze this text', 'text processing', 'classify documents', 'run sentiment analysis', 'extract keywords', 'named entity recognition', 'NER', 'text summarization', 'review analysis', 'survey text analysis', 'comment analysis', and other general text NLP tasks. Note: speech recognition (STT), machine translation, chatbot dialogue management, and LLM fine-tuning are outside the scope of this skill."
---

# Text Processor — Full Text Processing Pipeline

An agent team collaborates to perform bulk text preprocessing, classification, extraction, sentiment analysis, structuring, and report generation.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| preprocessor | `.claude/agents/preprocessor.md` | Text preprocessing, noise removal | general-purpose |
| classifier | `.claude/agents/classifier.md` | Topic/intent classification, tagging | general-purpose |
| extractor | `.claude/agents/extractor.md` | Entity, keyword, relation, summary extraction | general-purpose |
| sentiment-analyzer | `.claude/agents/sentiment-analyzer.md` | Sentiment/emotion/opinion analysis | general-purpose |
| report-writer | `.claude/agents/report-writer.md` | Final report, quality assurance | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Text source**: File path, format, document count, language
    - **Analysis objective**: What the user wants to learn (classification, sentiment, keywords, etc.)
    - **Domain information** (optional): Industry, text type (reviews/news/social media/documents)
    - **Classification taxonomy** (optional): User-defined classification categories
2. Create the `_workspace/` directory and the `_workspace/structured_data/` subdirectory
3. Organize the input and save it to `_workspace/00_input.md`
4. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Preprocessing | preprocessor | None | `01_preprocessing_result.md` |
| 2a | Classification | classifier | Task 1 | `02_classification_result.md` |
| 2b | Extraction | extractor | Task 1 | `03_extraction_result.md` |
| 3 | Sentiment analysis | sentiment-analyzer | Tasks 1, 2a, 2b | `04_sentiment_result.md` |
| 4 | Report | report-writer | Tasks 2a, 2b, 3 | `05_final_report.md` |

Tasks 2a (classification) and 2b (extraction) run **in parallel**. Sentiment analysis leverages classification and extraction results to improve aspect-level analysis accuracy.

**Inter-agent communication flow:**
- preprocessor completes > passes cleaned text and metadata to classifier, extractor, and sentiment-analyzer
- classifier completes > passes topic classification results to extractor (for topic-specific extraction) and sentiment-analyzer
- extractor completes > passes entity lists to sentiment-analyzer (for entity-level sentiment analysis)
- sentiment-analyzer completes > passes results to report-writer
- report-writer cross-validates all deliverables; requests corrections from the relevant agent if discrepancies are found (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/` and the `structured_data/` directory
2. Confirm that all required corrections have been incorporated into the report
3. Present the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Analyze this text", "full pipeline" | **Full pipeline** | All 5 agents |
| "Just classify", "categorize" | **Classification mode** | preprocessor + classifier |
| "Sentiment analysis only", "review sentiment" | **Sentiment mode** | preprocessor + sentiment-analyzer |
| "Extract keywords", "named entity recognition" | **Extraction mode** | preprocessor + extractor |
| "Summarize", "text summary" | **Summary mode** | preprocessor + extractor (summary function) |
| "Write a report" (existing analyses available) | **Report mode** | report-writer only |

**Reusing existing files**: If the user provides pre-processed text or existing classification results, copy those files to the appropriate location in `_workspace/` and skip the corresponding agent.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Markdown deliverables |
| Structured data | `_workspace/structured_data/` | JSON/CSV data for programmatic use |
| Message-based | SendMessage | Key information transfer, correction requests |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Encoding errors | Auto-detect with chardet > force UTF-8 conversion, log losses |
| Large text volumes (>100K documents) | Batch processing; analyze a sample first, then apply to full dataset |
| Mixed languages | Separate into language-specific segments and process individually |
| NER domain mismatch | Supplement with pattern-based extraction; propose custom dictionary creation |
| Agent failure | Retry once; if still failing, proceed without that deliverable |
| Report discrepancy found | Request correction from the relevant agent (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "Analyze 1,000 customer reviews and extract product-level satisfaction and complaints"
**Expected result**:
- Preprocessing: Normalize review text, remove duplicates, compute statistics
- Classification: Classify by product category and review intent (praise/complaint/inquiry/suggestion)
- Extraction: Product names, feature names, key keywords, per-review summaries
- Sentiment: Overall sentiment distribution, product- and feature-level sentiment (ABSA), complaint patterns
- Report: Product satisfaction rankings, top 5 complaints, improvement recommendations

### Existing File Reuse Flow
**Prompt**: "I already have preprocessed text data; just run sentiment analysis" + preprocessed file attached
**Expected result**:
- Copy existing preprocessing results to `_workspace/01_preprocessing_result.md`
- Sentiment mode: Skip preprocessor, deploy only sentiment-analyzer
- Do not deploy classifier, extractor, or report-writer

### Error Flow
**Prompt**: "Analyze the comments in this CSV file" (mixed languages, many emojis, short text)
**Expected result**:
- preprocessor separates text by language, determines emoji handling strategy
- classifier flags reduced confidence for short text classification
- sentiment-analyzer leverages emoji sentiment information
- report-writer documents the analytical limitations of multilingual and short text in the report


## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| nlp-preprocessing-toolkit | `.claude/skills/nlp-preprocessing-toolkit/skill.md` | preprocessor, extractor | Tokenization, morphological analysis, embedding selection, vectorization |
| sentiment-lexicon-builder | `.claude/skills/sentiment-lexicon-builder/skill.md` | sentiment-analyzer | Sentiment lexicon construction, ABSA, negation/intensity correction, emoji mapping |

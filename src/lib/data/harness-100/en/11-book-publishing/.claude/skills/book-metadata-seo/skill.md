---
name: book-metadata-seo
description: "A specialized skill for the metadata-manager agent covering e-book metadata SEO. Provides BISAC/KDC classification, keyword optimization, bookstore-specific description strategies, pricing psychology, and platform-specific distribution settings. Use for 'metadata,' 'book classification,' 'keywords,' 'e-book distribution,' and similar topics."
---

# Book Metadata SEO — E-Book Metadata SEO Methodology

Specialized knowledge used by the metadata-manager agent when configuring metadata and distribution settings.

## Why Metadata SEO

Over **70% of how readers discover books** in online bookstores is through search and recommendation algorithms. Metadata is the only means of telling the algorithm "who this book is for."

## Book Classification Systems

### BISAC (Book Industry Standards and Communications)

US/international standard. Domestic bookstores like Kyobo and Aladin also reference it.

| Main Category | Popular Subcategories | Code Example |
|--------------|--------------------|-------------|
| BUSINESS | Small Business, Leadership, Marketing | BUS060000 |
| SELF-HELP | Personal Growth, Motivational | SEL027000 |
| COMPUTERS | Programming, AI | COM051300 |
| FICTION | Literary, Thriller, Romance | FIC019000 |

**Selection Rule**: Maximum 3, prioritize the most specific category

### KDC (Korean Decimal Classification)

Standard for domestic libraries and bookstores.

| Main Category | Number |
|--------------|--------|
| General Works | 000 |
| Philosophy | 100 |
| Religion | 200 |
| Social Sciences | 300 |
| Natural Sciences | 400 |
| Technology | 500 |
| Arts | 600 |
| Language | 700 |
| Literature | 800 |
| History | 900 |

## Keyword Optimization Strategy

### Keyword Selection Process

1. **Seed Keywords**: 3-5 core topics of the book
2. **Expanded Keywords**: Related terms derived from seeds
3. **Competitive Analysis**: Check keywords of similar books
4. **Long-tail**: Longer keywords reflecting specific search intent

### Keyword Types

| Type | Description | Example (Leadership Book) |
|------|-------------|--------------------------|
| **Topic** | Core content of the book | Leadership, management, organizational management |
| **Reader** | Target readership | New employees, middle managers, CEOs |
| **Problem** | Reader's concerns | Team management, decision-making, conflict resolution |
| **Comparison** | Similar books/authors | ~style leadership, like ~ |
| **Format** | Book format | Self-help, practical guide, essay |

### Platform-Specific Keyword Entry

| Platform | Keyword Count | Rules |
|----------|--------------|-------|
| **Amazon KDP** | 7 keyword phrases | Phrase format (not comma-separated), 50 bytes per phrase |
| **Kyobo** | 10 tags | Words or short phrases |
| **Ridibooks** | 5-10 keywords | Word-level |
| **Aladin** | No tag limit | Free entry of related keywords |

## Book Description Strategy

### Description Formula: AIDA

```
[A — Attention: Grab attention with the first sentence]
A question/statement that directly targets the reader's pain or desire

[I — Interest: Generate interest]
Core content this book covers, unique perspective

[D — Desire: Stimulate desire]
Specific benefits, reader reviews/endorsements, author credentials

[A — Action: Prompt action]
"Start reading now," mention bonus content
```

### Bookstore-Specific Description Length

| Bookstore | Recommended Length | Key Area |
|-----------|-------------------|----------|
| **Kyobo** | 500-1,000 chars | First 200 chars shown in preview |
| **Ridibooks** | 400-800 chars | Concise and focused |
| **Aladin** | 500-1,000 chars | Table of contents integration possible |
| **Amazon KDP** | 1,000-2,000 chars (HTML) | Use bold/italic, list structure |

### Description HTML Format (KDP)

```html
<h2>Is Your Leadership Safe?</h2>

<p>70% of team members consider quitting because of their boss.
You might be creating that 70%.</p>

<p><b>What you will learn in this book:</b></p>
<ul>
<li>5 conversation techniques that build trust</li>
<li>A framework for turning conflicts into opportunities</li>
<li>Digital leadership for remote teams</li>
</ul>

<p><b>About the Author:</b> [Credentials and experience]</p>

<p><i>"The best leadership book I have read this year" — [Endorser]</i></p>
```

## Pricing Strategy

### E-Book Pricing Psychology

| Price Range | Positioning | Suitable Books |
|------------|------------|----------------|
| Free-$2.99 | Lead magnet, first in series | Introductory, short essays |
| $5.99-$9.99 | Mass market | Self-help, essays, fiction |
| $9.99-$14.99 | Premium | Professional, thick business books |
| $14.99-$19.99 | Expert-level | Technical, academic |
| $19.99+ | High-end | Art books, professional references |

### Price Ending Effect

- **X.99**: Most common ("under $10" psychology)
- **X.50**: Feels reasonable
- **Round number**: Premium positioning ($10.00 = high-end)

## Distribution Platform Checklists

### Kyobo E-Book

- [ ] BISAC + KDC classification codes
- [ ] Book description (500+ chars)
- [ ] Keywords/tags (10)
- [ ] Author bio
- [ ] Table of contents
- [ ] Preview range setting (10-15%)
- [ ] Price setting
- [ ] DRM setting

### Ridibooks

- [ ] Category selection (max 3)
- [ ] Book introduction (400+ chars)
- [ ] Keywords (5-10)
- [ ] Author bio
- [ ] Preview settings
- [ ] Pricing (Ridi Select inclusion)
- [ ] Sales region setting

### Amazon KDP

- [ ] BISAC categories (2)
- [ ] 7 keyword phrases
- [ ] Book Description (HTML, under 4,000 chars)
- [ ] Pricing (35%/70% royalty based on KDP Select exclusivity)
- [ ] Sales territory (Worldwide/Specific)
- [ ] Lending permission

## ISBN Management

| Item | Description |
|------|-------------|
| **Issuance** | Korea: National Library (free) / US: Bowker ($125/1) |
| **Per Format** | Separate ISBNs needed for print, e-book, and audiobook |
| **Required** | Optional for self-publishing (KDP auto-assigns ASIN) / Required for bookstore distribution |

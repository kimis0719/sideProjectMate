---
name: information-architecture
description: "A specialized skill for designing the information architecture (IA) of knowledge bases. Used by the taxonomy-designer agent when designing classification systems, navigation, and labeling systems. Automatically applied in contexts involving 'information architecture,' 'IA design,' 'category design,' 'navigation,' 'sitemap,' or 'card sorting.' Note: UX research execution and UI prototyping are outside the scope of this skill."
---

# Information Architecture — IA Design Tool

A specialized skill that enhances the taxonomy-designer agent's classification system design capabilities.

## Target Agent

- **taxonomy-designer** — Classification systems, tags, navigation design

## 4 IA Design Systems

### 1. Organization System

| Classification Method | When to Apply | Examples |
|----------------------|---------------|----------|
| By topic | When domains are clearly defined | Development / Design / Marketing |
| By audience | When user groups differ | New hires / Experienced / Managers |
| By task | When centered on user actions | Getting Started / Developing / Deploying |
| Hybrid | For complex knowledge bases | Categories + Tags |

### Depth Guidelines

```
Optimal: 3-4 levels (7 plus/minus 2 rule)

Level 1: 5-9 top-level categories
Level 2: 3-7 subcategories per category
Level 3: 3-10 documents per subcategory
Level 4: (if needed) Handle as sections within documents
```

### 2. Labeling System

| Principle | Good Example | Bad Example |
|-----------|-------------|-------------|
| User language | "Getting Started" | "Initial Configuration Procedures" |
| Consistent grammar | Uniform verb form | Mix of nouns and verb phrases |
| Specific | "Writing React Components" | "Components" |
| No duplicates | One meaning per label | Same content, different names |

### 3. Navigation System

| Type | Purpose | Location |
|------|---------|----------|
| Global Navigation | Access to overall structure | Sidebar / Top bar |
| Local Navigation | Browse current section | Sub-menu / TOC |
| Contextual Navigation | Connect related content | Inline links, "Related Articles" |
| Breadcrumb | Show current location | Top of page |
| Search | Direct access | Global search bar |

### 4. Search System

| Element | Design Items |
|---------|-------------|
| Search scope | Entire / By category / By tag |
| Indexing | Title / Body / Tags / Metadata |
| Synonym dictionary | deploy = deployment, config = configuration |
| Facet filters | Category, tag, date, author |

## Taxonomy Design Process

### Step 1: Card Sorting

```
1. List all knowledge items as cards
2. Group similar cards
3. Assign labels to each group
4. Establish relationships between groups (parent-child, sibling)
5. Visualize results as a dendrogram
```

### Step 2: Sitemap Construction

```markdown
## Knowledge Base Sitemap

+-- Getting Started
|   +-- Environment Setup
|   +-- First Project
|   +-- Core Concepts
+-- Development Guide
|   +-- Architecture
|   +-- Coding Conventions
|   +-- API Reference
|   +-- Testing
+-- Deployment
|   +-- CI/CD
|   +-- Environment-Specific Configuration
|   +-- Monitoring
+-- Operations
|   +-- Incident Response
|   +-- Backup/Recovery
|   +-- Security
+-- Reference
    +-- FAQ
    +-- Glossary
    +-- Changelog
```

### Step 3: Cross-Reference Map

```
[Document A] <--related--> [Document B]
    |                          |
  prerequisite              follow-up
    |                          |
[Document C]              [Document D]
```

## Tag System Design

### Tag Types

| Type | Examples | Purpose |
|------|---------|---------|
| Topic tags | #react, #docker | Technology classification |
| Level tags | #beginner, #intermediate, #advanced | Difficulty filtering |
| Type tags | #tutorial, #reference, #guide | Content format |
| Status tags | #draft, #in-review, #published | Document status |

### Tag Governance

| Rule | Description |
|------|-------------|
| Controlled vocabulary | Only use predefined tags |
| Hierarchical tags | Define parent/child relationships |
| Synonym management | JS = JavaScript, unify to one |
| Tag review | Clean up unused tags quarterly |

## YAML Front Matter Standard

```yaml
---
title: "Document Title"
category: "Development Guide"
subcategory: "Architecture"
tags: [react, frontend, intermediate]
author: "Author Name"
created: "2024-01-15"
updated: "2024-03-20"
status: "published"
related:
  - /development/coding-conventions
  - /reference/api
---
```

---
name: commit-parser
description: "Methodology for parsing git commit messages and extracting structured change information. Use this skill for 'commit parsing', 'commit message analysis', 'Conventional Commits parsing', 'git history structuring', and other commit analysis tasks. Note: git hook configuration and commit lint tool installation are outside the scope of this skill."
---

# Commit Parser — Commit Message Parsing and Structuring Methodology

A skill that enhances the commit analysis capabilities of the commit-analyst.

## Target Agents

- **commit-analyst** — Extracts meaningful change information from git history
- **change-classifier** — Classifies changes using parsed results

## Conventional Commits Parsing Rules

### Regex Pattern

```
^(?<type>feat|fix|docs|style|refactor|perf|test|ci|chore|build|revert)
(?:\((?<scope>[^)]+)\))?
(?<breaking>!)?
:\s*
(?<subject>.+)$

Body: BREAKING CHANGE: <description>
Footer: Refs: #123, Closes #456
```

### Parsed Result Structure

```python
ParsedCommit = {
    "hash": "abc1234",
    "type": "feat",           # Change type
    "scope": "auth",          # Impact scope (optional)
    "breaking": True/False,   # Breaking Change
    "subject": "add OAuth2",  # Subject
    "body": "...",            # Body
    "footer": {
        "refs": ["#123"],     # Referenced issues
        "closes": ["#456"],   # Closed issues
        "breaking_change": "" # BREAKING CHANGE description
    },
    "author": "name <email>",
    "date": "2025-01-15",
    "files_changed": ["src/auth.py"],
    "insertions": 50,
    "deletions": 10
}
```

## Non-Conventional Commit Classification Strategy

For projects that do not use Conventional Commits:

### Keyword-Based Classification

```python
classification_rules = {
    "feat": ["add", "new", "implement", "introduce", "support"],
    "fix": ["fix", "bug", "patch", "resolve", "correct", "hotfix"],
    "refactor": ["refactor", "restructure", "reorganize", "clean"],
    "perf": ["performance", "optimize", "speed", "faster", "cache"],
    "docs": ["doc", "readme", "comment"],
    "test": ["test", "spec", "coverage"],
    "ci": ["ci", "pipeline", "workflow", "deploy"],
    "style": ["format", "lint", "whitespace"],
    "chore": ["bump", "update dep", "upgrade", "dependency"]
}
```

### Diff-Based Classification (when keyword matching fails)

```
1. Analyze changed file extensions:
   - .md/.rst -> docs
   - test_*.py / *.test.js -> test
   - .yml/.yaml (CI paths) -> ci

2. Analyze change patterns:
   - New file added + export -> feat
   - Existing file modified + error/exception -> fix
   - Code moved without new imports -> refactor

3. Analyze change scale:
   - +500 lines or more -> likely feat
   - +/-10 lines or fewer -> likely fix/style
```

## PR/Issue Mapping Strategy

```python
# Extract issue numbers from commits
issue_patterns = [
    r'#(\d+)',                    # #123
    r'(?:close|fix|resolve)s?\s+#(\d+)',  # closes #123
    r'([A-Z]+-\d+)',              # JIRA-123
    r'GH-(\d+)',                  # GH-123
]

# Extract related issues from PRs (Merge commit)
merge_pattern = r'Merge pull request #(\d+)'

# Extract PR number from squash merges
squash_pattern = r'\(#(\d+)\)$'
```

## Change Impact Score Calculation

```python
def impact_score(commit):
    score = 0

    # Based on file count
    score += min(len(commit.files), 10) * 2  # Max 20

    # Based on lines changed
    changes = commit.insertions + commit.deletions
    if changes > 500: score += 30
    elif changes > 100: score += 20
    elif changes > 30: score += 10
    else: score += 5

    # Breaking Change
    if commit.breaking: score += 50

    # Public API changes
    if any('api' in f or 'public' in f for f in commit.files):
        score += 15

    # Database migrations
    if any('migration' in f for f in commit.files):
        score += 20

    return min(score, 100)

# Score interpretation:
# 80-100: Critical — Release note highlight
# 50-79: High — Include in release notes
# 20-49: Medium — Include in change list
# 0-19: Low — Include in detailed list only
```

## Git Command Recipes

```bash
# Commits between two tags
git log v1.2.0..v2.0.0 --oneline --no-merges

# Include changed files
git log v1.2.0..v2.0.0 --name-only --pretty=format:"%H|%s|%an|%ai"

# Diff statistics
git diff v1.2.0..v2.0.0 --stat

# Contributor list
git log v1.2.0..v2.0.0 --format="%aN" | sort -u

# Breaking Change commits only
git log v1.2.0..v2.0.0 --grep="BREAKING" --grep="!" --all-match
```

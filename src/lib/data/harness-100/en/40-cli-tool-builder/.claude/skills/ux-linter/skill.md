---
name: ux-linter
description: "Checklist and best practices for validating CLI tool user experience. Use this skill for 'CLI UX validation', 'usability check', 'output format verification', 'error message review', 'interaction pattern inspection', and other CLI UX quality checks. Note: GUI usability testing and accessibility certification are outside the scope of this skill."
---

# UX Linter — CLI User Experience Validation Checklist

A skill that enhances UX quality verification for the test-engineer and docs-writer.

## Target Agents

- **test-engineer** — Systematically performs CLI usability testing
- **docs-writer** — Writes documentation from the user's perspective

## CLI UX 12-Principle Checklist

### 1. Discoverability
```
[ ] Does --help provide useful information?
[ ] Is the subcommand list displayed with descriptions?
[ ] Is there a "Did you mean...?" suggestion for wrong commands?
[ ] Is there an Examples section?
```

### 2. Feedback
```
[ ] Is there progress indication during operations? (bar/spinner)
[ ] Is success/failure clearly distinguished?
[ ] Is estimated time shown for long operations?
[ ] Is a result summary provided?
```

### 3. Error Handling
```
[ ] Are error messages specific? (what went wrong and how to fix it)
[ ] Are errors and warnings distinguished?
[ ] Are errors output to stderr? (prevents stdout contamination)
[ ] Are exit codes appropriate? (0: success, non-0: failure)
```

### 4. Pipe-Friendly
```
[ ] Does stdout output structured data?
[ ] Can output be switched between human/machine format? (--json, --quiet)
[ ] Can input be read from stdin? (pipe)
[ ] Are colors auto-disabled when piped? (isatty check)
```

### 5. Configuration
```
[ ] Is the config file path displayed?
[ ] Is the priority of env vars + config file + CLI options clear?
[ ] Are defaults reasonable?
[ ] Is there a command to check current settings?
```

## Error Message Format Standard

### BAD (patterns to avoid)
```
Error: invalid input
Error: operation failed
Exception: NullPointerException at line 42
```

### GOOD (recommended patterns)
```
Error: Input file not found: data.json
  Check the path or specify with the --input option.
  Example: mytool convert --input /path/to/data.json

Error: JSON parsing failed (line 15, column 8)
  There is an unclosed brace.
  Hint: Check syntax with jsonlint data.json
```

### Error Message Components

```
1. [What happened] — Problem description
2. [Why it happened] — Cause (when possible)
3. [How to fix it] — Resolution
4. [More info] — Documentation link, related commands
```

## Output Format Guide

### Table Output

```
NAME        STATUS    SIZE     MODIFIED
config.yml  active    2.4 KB   2025-01-15
data.json   pending   156 KB   2025-01-14
```

### JSON Output (--json)

```json
[
  {"name": "config.yml", "status": "active", "size": 2400},
  {"name": "data.json", "status": "pending", "size": 156000}
]
```

### Progress Indicators

```
TTY (terminal):
  Processing... [████████░░░░░░░░] 50% (15/30 files)

Non-TTY (pipe/redirect):
  Processing 15/30 files...
  Processing 30/30 files... done.
```

## Color Usage Guide

| Meaning | Color | ANSI |
|---------|-------|------|
| Success | Green | `\033[32m` |
| Warning | Yellow | `\033[33m` |
| Error | Red | `\033[31m` |
| Info | Blue | `\033[34m` |
| Emphasis | Bold | `\033[1m` |
| Secondary | Gray | `\033[90m` |

```
Rules:
1. Disable colors when NO_COLOR environment variable is present
2. Auto-disable when piped/redirected
3. Provide --no-color option
4. Content must be meaningful without colors
```

## Interactive Patterns

```
Confirmation prompt (dangerous operations):
  Are you sure you want to delete? [y/N]: _
  -> Uppercase is the default (N = default No)
  -> Skip with --force / --yes

Selection prompt:
  Select output format:
  > json
    yaml
    toml
  -> Arrow key selection (TTY only)

Dry run:
  --dry-run option for preview without actual changes
```

## UX Validation Report Template

```markdown
## CLI UX Validation Report

### 12-Principle Status
| Principle | Status | Notes |
|-----------|--------|-------|

### Error Message Quality
| Scenario | Current Message | Suggested Improvement |

### Output Format Verification
| Command | Terminal Output | Pipe Output | JSON |
```

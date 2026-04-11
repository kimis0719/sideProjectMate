---
name: semver-analyzer
description: "Methodology for analyzing changes according to Semantic Versioning (SemVer) rules and determining the appropriate version number. Use this skill for 'SemVer analysis', 'version number determination', 'Breaking Change assessment', 'version bump decisions', and other version management tasks. Note: automatic git tag creation and CI/CD release execution are outside the scope of this skill."
---

# SemVer Analyzer — Semantic Versioning Analysis Methodology

A skill that enhances version determination capabilities for the change-classifier and release-note-writer.

## Target Agents

- **change-classifier** — Determines the SemVer impact of changes
- **release-note-writer** — Determines version numbers and highlights

## SemVer 2.0.0 Core Rules

```
MAJOR.MINOR.PATCH[-prerelease][+build]

MAJOR: Incompatible API changes (Breaking Change)
MINOR: Backward-compatible feature additions
PATCH: Backward-compatible bug fixes
```

## Breaking Change Assessment Matrix

### API/Library

| Change Type | Breaking? | Example |
|------------|-----------|---------|
| Public function removed | YES | `remove_user()` deleted |
| Public function signature changed | YES | Required parameter added/removed |
| Return type changed | YES | `dict` to `list` |
| Exception type changed | YES | `ValueError` to `TypeError` |
| Default value changed | MAYBE | Depends on behavioral change |
| New optional parameter added | NO | `def func(x, new=None)` |
| New public function added | NO | No impact on existing code |
| Internal function changed | NO | `_private_func()` |
| Performance improvement | NO | Behavior unchanged |

### Web API (REST/GraphQL)

| Change Type | Breaking? |
|------------|-----------|
| Endpoint removed/moved | YES |
| Required field added (request) | YES |
| Response field removed | YES |
| Response structure changed | YES |
| Authentication method changed | YES |
| New optional field added (request) | NO |
| New response field added | NO |
| New endpoint added | NO |

### Database

| Change Type | Breaking? |
|------------|-----------|
| Table/column removed | YES |
| NOT NULL constraint added | YES |
| Column type changed | YES |
| New nullable column added | NO |
| New index added | NO |

## Version Bump Decision Algorithm

```
Input: List of changes

1. Breaking Change present? -> MAJOR bump
2. New features present? -> MINOR bump
3. Bug fixes only? -> PATCH bump

Special rules:
- MAJOR = 0 (in development): Breaking Changes allowed as MINOR
- Pre-release versions: 0.x.y-alpha.1 -> MAJOR on stable release
- Mixed types: Apply the highest level
```

## Conventional Commits Mapping

| Prefix | SemVer Impact | Release Notes Section |
|--------|-------------|----------------------|
| `feat:` | MINOR | Added |
| `fix:` | PATCH | Fixed |
| `feat!:` / `BREAKING CHANGE:` | MAJOR | Breaking Changes |
| `perf:` | PATCH | Performance |
| `refactor:` | - | Changed |
| `docs:` | - | Documentation |
| `test:` | - | - (may exclude from notes) |
| `chore:` | - | - (may exclude from notes) |
| `ci:` | - | - (may exclude from notes) |
| `style:` | - | - (may exclude from notes) |
| `deps:` | PATCH~MAJOR | Dependencies |

## Keep a Changelog Format

```markdown
# Changelog

## [Unreleased]

## [2.0.0] - 2025-01-15

### Breaking Changes
- `createUser()` API renamed to `registerUser()` (#123)

### Added
- Team management feature (#456)
- Dark mode support (#789)

### Changed
- Login screen UI improvements (#234)

### Deprecated
- `v1` API endpoints (will be removed in v3.0)

### Fixed
- Password reset email not sending (#567)

### Security
- XSS vulnerability patch (#890)
```

## Pre-Release Version System

```
1.0.0-alpha.1 -> Initial alpha
1.0.0-alpha.2 -> Alpha fix
1.0.0-beta.1  -> Beta entry
1.0.0-beta.2  -> Beta fix
1.0.0-rc.1    -> Release candidate
1.0.0         -> Stable release

Precedence: alpha < beta < rc < release
```

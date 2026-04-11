---
name: arg-parser-generator
description: "Methodology for systematically designing and generating CLI tool argument parser structures. Use this skill for 'CLI argument design', 'option structure', 'subcommand design', 'argument parser generation', 'help text design', and other CLI argument system design tasks. Note: GUI interface design and TUI framework integration are outside the scope of this skill."
---

# Arg Parser Generator — CLI Argument Parser Design + Code Generation

A skill that enhances argument parser design for the command-designer and core-developer.

## Target Agents

- **command-designer** — Designs command structure and option layout
- **core-developer** — Implements argument parser code

## CLI Argument Type Classification

| Type | Format | Example |
|------|--------|---------|
| Positional argument | `<arg>` | `convert input.json` |
| Required option | `--name VALUE` | `--output out.yaml` |
| Optional option | `[--name VALUE]` | `[--indent 2]` |
| Flag | `[--flag]` | `[--verbose]` |
| Multiple values | `--name V1 V2` | `--files a.txt b.txt` |
| Enum | `--type {a,b,c}` | `--format {json,yaml}` |
| Environment variable | `$ENV_VAR` | `$API_KEY` |

## Subcommand Design Patterns

### Pattern 1: Verb-Based (CRUD)

```
mytool create <resource> [options]
mytool list [resource] [--filter]
mytool get <id> [--format]
mytool update <id> [options]
mytool delete <id> [--force]
```

### Pattern 2: Resource-Based (kubectl style)

```
mytool user list
mytool user create --name "name"
mytool project deploy --env prod
```

### Pattern 3: Pipeline-Based (Unix philosophy)

```
mytool parse input.json | mytool transform --schema s.yaml | mytool output
```

## Option Naming Rules

```
1. Short/long option pairs: -o / --output
2. Boolean + negation: --color / --no-color
3. Consistent nouns: --output-dir (not verbs like --write-to)
4. Abbreviation when unambiguous: --config -> --cfg

Prohibited patterns:
- -h (reserved for help), -V (reserved for version)
- Uppercase short options (-A, -B) — cause confusion
- Overly long options (--output-directory-path)
```

## Per-Language Parser Library + Boilerplate

### Python (typer — recommended)

```python
import typer
from typing import Optional
from enum import Enum

app = typer.Typer(help="File conversion CLI")

class Format(str, Enum):
    json = "json"
    yaml = "yaml"
    toml = "toml"

@app.command()
def convert(
    input_file: str = typer.Argument(..., help="Input file"),
    from_format: Format = typer.Option(..., "--from", "-f", help="Input format"),
    to_format: Format = typer.Option(..., "--to", "-t", help="Output format"),
    output: Optional[str] = typer.Option(None, "--output", "-o", help="Output file"),
    indent: int = typer.Option(2, "--indent", help="Indentation"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose logging"),
):
    """Convert file formats."""
    ...

if __name__ == "__main__":
    app()
```

### Node.js (commander)

```javascript
const { Command } = require('commander');
const program = new Command();

program
  .name('mytool')
  .description('File conversion CLI')
  .version('1.0.0');

program
  .command('convert <input>')
  .option('-f, --from <format>', 'Input format', 'json')
  .option('-t, --to <format>', 'Output format', 'yaml')
  .option('-o, --output <file>', 'Output file')
  .action((input, options) => { ... });

program.parse();
```

### Go (cobra)

```go
var convertCmd = &cobra.Command{
    Use:   "convert [input]",
    Short: "Convert file formats",
    Args:  cobra.ExactArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        from, _ := cmd.Flags().GetString("from")
        to, _ := cmd.Flags().GetString("to")
        // ...
        return nil
    },
}

func init() {
    convertCmd.Flags().StringP("from", "f", "json", "Input format")
    convertCmd.Flags().StringP("to", "t", "yaml", "Output format")
    convertCmd.Flags().StringP("output", "o", "", "Output file")
}
```

## Help Output Standard

```
Usage: mytool <command> [options]

Commands:
  convert    Convert file formats
  validate   Validate file syntax
  diff       Compare two files

Options:
  -h, --help       Show help
  -V, --version    Show version
  -v, --verbose    Verbose output
  --no-color       Disable colors

Examples:
  mytool convert input.json --to yaml
  mytool validate schema.json data.json

Environment:
  MYTOOL_CONFIG    Config file path
```

## Exit Code Standard

| Code | Meaning | Usage |
|------|---------|-------|
| 0 | Success | Normal completion |
| 1 | General error | Runtime error |
| 2 | Argument error | Invalid argument/option |
| 126 | Permission denied | File access denied |
| 127 | Dependency missing | Required tool not installed |
| 130 | User interrupt | Ctrl+C |

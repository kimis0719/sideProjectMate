# SOP Writer Harness

standard operating procedure(SOP) processanalysis→procedure document→checklist→training materials→versionmanagement A harness where an agent team collaborates to produce deliverables.

## structure

```
.claude/
├── agents/
│ ├── process-analyst.md — process analysis (current work flow analysis, identification)
│ ├── procedure-writer.md — procedure document writing (stageby procedure, decision-making minutebasis)
│ ├── checklist-designer.md — checklist design (execution inspectiontable, quality )
│ ├── training-developer.md — training materials work (learning guide, assessment document)
│ └── version-controller.md — version management and cross-verification (change capability, consistency confirm)
├── skills/
│ ├── sop-writer/
│ │ └── skill.md — Orchestrator (team , workflow, error handling)
│ ├── process-mapping/
│ │ └── skill.md — process mapping method (process-analyst extension)
│ └── checklist-design/
│ └── skill.md — checklist design principle (checklist-designer extension)
└── CLAUDE.md — file
```

## usage

`/sop-writer` skill , "SOP create it" specialistannual request.

## deliverable

all deliverable `_workspace/` save:
- `00_input.md` — user input organization
- `01_process_analysis.md` — process analysis result
- `02_procedure_document.md` — tablelevel procedure document
- `03_checklists.md` — checklist tax
- `04_training_materials.md` — training materials
- `05_version_control.md` — version management and verify report

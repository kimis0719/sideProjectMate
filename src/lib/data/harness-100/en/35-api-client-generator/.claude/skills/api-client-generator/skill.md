---
name: api-client-generator
description: "Full pipeline for auto-generating API client SDKs. An agent team collaborates to parse API specs (OpenAPI/GraphQL/gRPC), generate types, write client code, create tests, and produce usage documentation. Use this skill for requests like 'create an API client', 'SDK generation', 'client from OpenAPI', 'API wrapper', 'REST client', 'GraphQL client', 'API type generation', 'SDK from Swagger', etc. Note: API server implementation, API gateway configuration, and API monitoring dashboard setup are outside the scope of this skill."
---

# API Client Generator — SDK Generation Full Pipeline

An agent team collaborates to generate API spec parsing, type generation, client code, tests, and documentation.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| spec-parser | `.claude/agents/spec-parser.md` | API spec analysis, endpoint extraction | general-purpose |
| type-generator | `.claude/agents/type-generator.md` | Type definition generation | general-purpose |
| sdk-developer | `.claude/agents/sdk-developer.md` | Client SDK code development | general-purpose |
| test-engineer | `.claude/agents/test-engineer.md` | Test code authoring | general-purpose |
| doc-writer | `.claude/agents/doc-writer.md` | Usage documentation | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **API spec**: File path/URL, spec format (OpenAPI/GraphQL/gRPC)
    - **Target language**: TypeScript, Python, Go, Java, etc.
    - **SDK name**: Package/module name
    - **Settings** (optional): Authentication priority, naming conventions, additional features
2. Create the `_workspace/` directory and subdirectories
3. Organize the input and save it to `_workspace/00_input.md`
4. Copy the API spec file to `_workspace/`
5. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
6. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Spec analysis | spec-parser | None | `01_spec_analysis.md` |
| 2 | Type generation | type-generator | Task 1 | `02_types/` |
| 3 | SDK development | sdk-developer | Tasks 1, 2 | `03_client/` |
| 4a | Test authoring | test-engineer | Tasks 2, 3 | `04_tests/` |
| 4b | Documentation | doc-writer | Tasks 1, 3 | `05_docs/` |

Tasks 4a (tests) and 4b (docs) run **in parallel**.

**Inter-agent communication flow:**
- spec-parser completes > passes model details to type-generator, endpoint groupings to sdk-developer
- type-generator completes > passes type import info to sdk-developer, factory data to test-engineer
- sdk-developer completes > passes public API list to test-engineer, usage examples to doc-writer
- test-engineer/doc-writer > requests fixes from sdk-developer if code/doc inconsistencies are found

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Final consistency check across code, types, tests, and documentation
3. Report the final summary along with build/test execution commands

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Generate full SDK", "full client" | **Full pipeline** | All 5 agents |
| "Just generate types" | **Type mode** | spec-parser + type-generator |
| "Client code only" | **Code mode** | spec-parser + type-generator + sdk-developer |
| "Write tests only" (existing SDK) | **Test mode** | test-engineer only |
| "Write docs only" (existing SDK) | **Doc mode** | doc-writer only |
| "Spec analysis only" | **Analysis mode** | spec-parser only |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Code, types, tests, documentation |
| Message-based | SendMessage | Key information transfer, fix requests |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Spec parsing failure | Report syntax error location; proceed with parseable portions only |
| Incomplete spec | Supplement with type inference; mark as "inferred" |
| Circular references | Auto-apply lazy reference pattern |
| Non-standard authentication | Provide custom interceptor extension points |
| Agent failure | Retry once; if still failing, proceed without that deliverable |
| Code-doc inconsistency | doc-writer/test-engineer requests fix from sdk-developer (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "Generate a TypeScript SDK from this OpenAPI 3.1 spec"
**Expected result**:
- Spec analysis: Endpoint groupings, model list, authentication method identification
- Types: TypeScript interfaces/types, enums, union types, serialization helpers
- SDK: Resource-based client classes, authentication, pagination, retry
- Tests: Per-resource unit tests, authentication integration tests, mock server
- Docs: README, quick start, API reference, code examples

### Existing File Reuse Flow
**Prompt**: "Extract just Python types from this Swagger file"
**Expected result**:
- spec-parser analyzes the schema
- type-generator produces Python dataclass/Pydantic models
- sdk-developer, test-engineer, and doc-writer are not deployed

### Error Flow
**Prompt**: "Create an SDK for this API" (incomplete spec, many undefined response types)
**Expected result**:
- spec-parser catalogs and reports the incomplete portions
- type-generator generates types within the inferrable scope, adds "inferred" comments
- sdk-developer adds a runtime type-check layer
- doc-writer records the undefined response list in a "Known Limitations" section


## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| openapi-spec-patterns | `.claude/skills/openapi-spec-patterns/skill.md` | spec-parser | Endpoint grouping, auth mapping, pagination/error patterns, GraphQL/gRPC |
| sdk-design-patterns | `.claude/skills/sdk-design-patterns/skill.md` | sdk-developer | Builder pattern, interceptor chain, retry, type safety, pagination wrapper |

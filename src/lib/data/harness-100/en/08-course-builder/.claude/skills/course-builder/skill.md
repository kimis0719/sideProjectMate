---
name: course-builder
description: "A full production pipeline where an agent team collaborates to design online courses all at once — curriculum, lesson plans, quizzes, and hands-on labs. Use this skill for 'create an online course,' 'design a curriculum,' 'write lesson plans,' 'course design,' 'syllabus,' 'learning course development,' 'curriculum development,' 'course design,' 'create lab assignments,' and all other course development tasks. Also supports lesson plan writing or quiz creation when an existing curriculum is provided. Note: actual LMS construction, video recording/editing, student management, and certificate issuance are outside this skill's scope."
---

# Course Builder — Online Course Full Production Pipeline

Collaboratively produce an online course's curriculum, lesson plans, quizzes, and hands-on labs through an agent team, all in one pass.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| curriculum-designer | `.claude/agents/curriculum-designer.md` | Learning objectives, curriculum structure | general-purpose |
| content-writer | `.claude/agents/content-writer.md` | Lesson plans, slides, instructor notes | general-purpose |
| quiz-maker | `.claude/agents/quiz-maker.md` | Formative assessment, summative assessment, feedback | general-purpose |
| lab-designer | `.claude/agents/lab-designer.md` | Hands-on labs, projects, rubrics | general-purpose |
| course-reviewer | `.claude/agents/course-reviewer.md` | Learning objective alignment, coverage validation | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by the Orchestrator)

1. Extract from user input:
   - **Course Topic**: Subject/field the course covers
   - **Target Learner**: Beginner/Intermediate/Advanced, background knowledge
   - **Course Scale**: Total learning time, number of modules
   - **Lab Environment** (optional): Tools, languages, platforms to use
   - **Existing Files** (optional): Curriculum, lesson plans, etc.
2. Create the `_workspace/` directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are available, copy to `_workspace/` and skip the corresponding phase
5. Determine execution mode based on scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependency | Deliverable |
|-------|------|-------|------------|-------------|
| 1 | Curriculum design | curriculum-designer | None | `_workspace/01_curriculum.md` |
| 2a | Lesson plan writing | content-writer | Task 1 | `_workspace/02_lesson_plans.md` |
| 2b | Quiz creation | quiz-maker | Task 1 | `_workspace/03_quizzes.md` |
| 2c | Lab design | lab-designer | Task 1 | `_workspace/04_labs.md` |
| 3 | Course review | course-reviewer | Tasks 2a, 2b, 2c | `_workspace/05_review_report.md` |

Tasks 2a (lessons), 2b (quizzes), and 2c (labs) run **in parallel**. All depend only on Task 1 (curriculum).

**Inter-agent communication flow:**
- curriculum-designer completes -> delivers per-lesson objectives and concepts to content-writer; Bloom's level ratios to quiz-maker; lab environment and scenarios to lab-designer
- content-writer completes -> delivers key concepts and examples to quiz-maker (as item material); lesson content to lab-designer (for lab alignment)
- course-reviewer cross-validates all deliverables. On RED Must Fix findings, sends revision requests -> rework -> re-validate (up to 2 cycles)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm all RED Must Fix items have been addressed
3. Report final summary to user

## Execution Modes by Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Create an online course," "full course design" | **Full Pipeline** | All 5 agents |
| "Just design the curriculum" | **Curriculum Mode** | curriculum-designer + reviewer |
| "Write lesson plans for this curriculum" (existing file) | **Lesson Plan Mode** | content-writer + reviewer |
| "Just create quizzes" | **Quiz Mode** | quiz-maker + reviewer |
| "Just design lab assignments" | **Lab Mode** | lab-designer + reviewer |

**Using Existing Files**: If the user provides a curriculum, lesson plans, etc., copy to `_workspace/` and skip the corresponding agent.

## Data Transfer Protocol

| Strategy | Method | Use Case |
|----------|--------|----------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information delivery, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order_number}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient domain expertise | Supplement with web search; note "External verification recommended" in report |
| Lab environment unclear | Default to free cloud tools (Google Colab, etc.) |
| Agent failure | Retry once -> proceed without that deliverable; note in review report |
| RED found in review | Send revision request -> rework -> re-validate (up to 2 cycles) |
| Learning objective gap discovered | Request supplementary content from the relevant agent |

## Test Scenarios

### Normal Flow
**Prompt**: "Design a 10-hour online course for Python web development beginners, focused on the Flask framework."
**Expected Result**:
- Curriculum: 3-4 modules, 3-5 lessons each, Bloom's-based learning objectives
- Lesson plans: Per-lesson teaching flow, slide outlines, code examples
- Quizzes: Formative (3-5 items per lesson) + Summative (10 items per module)
- Labs: Per-lesson coding labs + Capstone project (simple web app)
- Review: Learning objective coverage matrix with full mapping

### Existing File Flow
**Prompt**: "Create quizzes and lab assignments from this curriculum" + attached curriculum file
**Expected Result**:
- Copy existing curriculum to `_workspace/01_curriculum.md`
- Combined quiz + lab mode: deploy quiz-maker + lab-designer + reviewer
- Skip curriculum-designer and content-writer

### Error Flow
**Prompt**: "Just design a quick curriculum on data analysis"
**Expected Result**:
- Switch to curriculum mode (curriculum-designer + reviewer)
- Target learner unclear; default to "beginner (non-specialist)" and note in report
- Review report notes "Lesson plans/quizzes/labs not generated"

## Agent Extension Skills

| Agent | Extension Skill | Knowledge Provided |
|-------|----------------|-------------------|
| curriculum-designer, content-writer | `/learning-design` | Bloom's Taxonomy, Backward Design, Gagne's 9 Events, Cognitive Load Theory |
| quiz-maker | `/assessment-engineering` | Item type design, distractor psychology, rubric construction, feedback formulas |
| lab-designer | `/lab-scaffolding` | 5-level pyramid, starter code design, capstone structure, hint systems |

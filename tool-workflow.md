# AI Tool Workflow

This is the short-form summary of how AI was used across this exercise. The full write-up (required by the assessment brief under this exact filename) is `project-info.md` — read that first; this file exists only to satisfy a checklist that expects a `tool-workflow.md` by name, and points back to `project-info.md` + `ai-prompts/` rather than duplicating content.

## Summary
- **Tools:** Claude Code for requirement analysis, risk analysis, test design, and automation build; live browser/API access (not just static reading) to verify every claim about the app before encoding it into a test.
- **Workflow shape:** decode requirements → generate a wide candidate scenario bank → risk-rank → cap to the required 5-8-per-type suite → verify real app behavior before automating → automate → run → debug real failures → document. See `project-info.md`, "Setup Summary," for the numbered breakdown against each of the brief's Part-A questions.
- **Validation discipline:** every non-trivial AI-generated claim (field names, password rules, API endpoints/payload shapes, the double-confirm behavior itself) was checked against the live site/API rather than trusted from memory or the brief's own examples — this caught a real 422 bug in the test data and a real defect in the app itself (see `defect-report.md`).
- **Full prompt-by-prompt record:** `ai-prompts/requirements-and-planning.md`, `test-design.md`, `test-data.md`, `automation-and-debugging.md`, `documentation-and-summary.md`.

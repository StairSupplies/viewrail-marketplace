---
name: audit-workspace
version: 0.2.1
description: Re-runnable health check for a Claude workspace. Surfaces drift from the Viewrail Claude Starter Package standard — workspace CLAUDE.md gaps, folder structure issues, memory hygiene, and unresolved conflict markers from prior adoption runs. Read-only by default; offers an opt-in remediation mode that walks findings one at a time. Triggers "/audit-workspace", "audit my workspace", "check my workspace", "is my workspace aligned", "workspace health check", "any drift in my workspace".
---

# Audit Workspace

**Role:** Lightweight, re-runnable health check for an already-adopted workspace. Detect drift from the universal baseline, surface findings as a concise report, and offer optional remediation. Designed to be run anytime the user wants to check workspace alignment — after a starter-package release, after a stretch of active work, or as a quarterly hygiene pass.

**Audience:** A user who has already adopted the standard (`.standard-adopted` marker exists at workspace root) and wants a quick alignment check. Also useful for users who never ran `adopt-standard` but want a read-only diagnostic before deciding whether to.

**Tone:** Diagnostic, not corrective. Concise. Read-only by default — the skill does not change anything unless the user explicitly opts into remediation.

---

## Invocation

- `/audit-workspace` — full audit across all three dimensions, read-only
- `/audit-workspace claude-md` — just the workspace CLAUDE.md audit
- `/audit-workspace folders` — just the folder structure audit
- `/audit-workspace memory` — just the memory hygiene audit
- `/audit-workspace --remediate` — run the audit, then walk through findings one at a time for remediation (same flow as `adopt-standard` Phases 1–3)
- `/audit-workspace --save` — write the report to `Claude/.audits/audit-YYYY-MM-DD-HHMM.md` in addition to printing in chat

---

## Workflow

### Phase 0 — Setup

**0.1 — Check for the adoption marker.** Look for `Claude/.standard-adopted`. If it doesn't exist, surface this gently:

> "Looks like this workspace hasn't been formally adopted into the standard yet — you can run `/adopt-standard` for the full guided alignment. I'll still run the audit so you can see what's there, but expect more findings than usual."

Continue regardless. The user may be using audit as a preview before running adopt-standard.

**0.2 — Read the exceptions file.** Look for `Claude/.standard-exceptions.md`. Parse the listed rule IDs and stash them — findings tied to those rules will be suppressed in the report (but still noted in a single "Suppressed by exceptions" line at the end).

**0.3 — Detect mode.** Default is read-only. If `--remediate` was passed, prepare for the remediation walkthrough at the end.

---

### Phase 1 — Audit the workspace CLAUDE.md

Read `Claude/CLAUDE.md` and compare against the bundled baseline.

The baseline file `baseline-claude-md.md` ships **inside this skill's own directory**, alongside this SKILL.md — *not* in the user's workspace. At runtime your working directory is the user's `Claude/` folder, so a bare or workspace-relative read of `baseline-claude-md.md` will fail. Resolve its absolute path first:

- The directory containing the SKILL.md you are currently executing is this skill's directory. Read `<that-directory>/baseline-claude-md.md`.
- If you cannot determine that directory directly, locate the file with Glob using the pattern `**/audit-workspace/baseline-claude-md.md` (it lives in the installed-plugin cache) and read the match.

If both resolution methods fail, stop and tell the user the baseline could not be located rather than reporting a comparison that didn't actually happen.

**Checks:**

- **Missing baseline sections** — section headers present in the baseline but absent from the user's file.
- **Outdated baseline sections** — section content significantly diverged from the current baseline (e.g., user has an older version of a rule that the baseline has since refined).
- **Line count drift** — flag if the file exceeds 200 lines (baseline cap is 150 with headroom).
- **Unresolved `<!-- CONFLICT -->` markers** — count any remaining conflict markers from a prior `adopt-standard` run.

Each check produces a finding with:

- **Severity:** `aligned`, `info`, `drift`, or `conflict`
- **Rule ID:** the kebab-case identifier matching the rule-IDs reference
- **Description:** one line
- **Recommended action:** one line, what would resolve it

---

### Phase 2 — Audit folder structure

Quick scan only — no proposals, no moves.

**Checks:**

- Misplaced files at workspace root (anything besides `CLAUDE.md`, `MEMORY.md`, `README.md`, marker files, and known top-level conventions).
- Memory files outside `Claude/memory/`.
- Project files outside `Claude/projects/`.
- Missing expected folders (`Claude/projects/`, `Claude/memory/`).
- Projects without a `PROJECT.md`.

---

### Phase 3 — Audit memory hygiene

**Checks:**

- Entity/rule files missing YAML frontmatter (`people/*.md`, `feedback_*.md`, `project_*.md`, `user_*.md`).
- `MEMORY.md` index drift (files present but not indexed, or indexed but not present).
- Duplicate content across multiple memory files (people referenced twice, learnings duplicated).

---

### Phase 4 — Compose the report

Print a concise report to chat. Format:

```
Workspace Audit — YYYY-MM-DD HH:MM
Adoption status: [adopted on YYYY-MM-DD | never adopted]
Exceptions file:  [loaded — N rules suppressed | not present]

Summary:
  CLAUDE.md:        N aligned, N drifted, N conflicts
  Folder structure: N aligned, N misplaced, N missing
  Memory hygiene:   N aligned, N drift items

Findings (drift):
  [claude-md-line-cap-150]             CLAUDE.md is 218 lines (cap is 150). Trim or graduate content to skills/memory.
  [memory-entity-missing-frontmatter]  memory/people/jane.md missing YAML frontmatter.
  [folder-top-level-misplaced]         meeting-notes-2026-04-22.md at workspace root. Move into a project.

Findings (conflicts):
  [claude-md-conflict-markers]  CLAUDE.md:142  unresolved <!-- CONFLICT --> marker
  [claude-md-conflict-markers]  CLAUDE.md:178  unresolved <!-- CONFLICT --> marker

Next steps:
  - Run `/audit-workspace --remediate` to walk through findings one at a time.
  - Or address findings manually and re-run when ready.
```

If `--save` was passed, also write this report to `Claude/.audits/audit-YYYY-MM-DD-HHMM.md`.

---

### Phase 5 — Optional remediation walkthrough

Only if `--remediate` was passed (or the user asks for it after seeing the report).

1. Take a snapshot to `Claude/.backups/audit-remediation-YYYY-MM-DD-HHMM/` before any change.
2. For each drift finding, walk the user through a yes/skip/modify proposal — same flow as `adopt-standard` Phases 1–3.
3. Conflict markers are NOT remediated automatically — they require manual user resolution. The Phase 4 report lists each one with its file path and line number; the remediation flow just reminds the user to open the file and resolve them.
4. At the end, write a short summary: "N applied, N skipped, N still outstanding."

---

## Exceptions handling

Same as `adopt-standard` — `.standard-exceptions.md` at workspace root lists rule IDs to suppress. The audit reports a single line at the end indicating how many findings were suppressed. If the user wants to opt out of a rule mid-audit, offer to add it to `.standard-exceptions.md`.

---

## File-writing rules

- **Default mode is strictly read-only.** No file changes without `--remediate`.
- **Report file (optional).** If `--save` is passed, write to `Claude/.audits/audit-YYYY-MM-DD-HHMM.md`. This directory accumulates over time as a drift trend record.
- **Remediation mode** follows the same rules as `adopt-standard`: snapshot first, confirm every change, never delete without explicit consent.

---

## Notes

- The skill is idempotent in read-only mode. Re-runs produce the same report given the same workspace state.
- Audit reports in `Claude/.audits/` form a useful drift-trend record over time. Users (or a future skill) can compare audits month-over-month to see whether the workspace is staying aligned or accumulating debt.
- The bundled `baseline-claude-md.md` is the source of truth for the universal baseline — same file as the one in `adopt-standard`. Both skills bump in lockstep with the workspace zip baseline at package release time.
- This skill does NOT touch global instructions. Global CLAUDE.md drift (if any) is outside the audit's scope.

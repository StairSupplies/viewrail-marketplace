---
name: adopt-standard
version: 0.2.1
description: Adopts the Viewrail Claude Starter Package into an existing workspace. Snapshots the workspace for rollback, audits three dimensions (CLAUDE.md structure, folder structure, memory hygiene), walks the user through findings one at a time, applies approved changes, and respects a `.standard-exceptions.md` file for documented opt-outs. Invoked automatically by `personalize` when it detects existing content; can also be invoked directly. Triggers "/adopt-standard", "adopt the standard", "align my workspace", "audit and align my workspace", "bring my workspace into the standard".
---

# Adopt Standard

**Role:** Bring an existing Claude workspace into alignment with the Viewrail Claude Starter Package. Snapshot the workspace first, audit three dimensions (workspace CLAUDE.md, folder structure, memory hygiene), walk findings one at a time, apply approved changes, and respect documented exceptions.

**Audience:** A user who has been using Claude Cowork for a while and has an existing workspace at `Claude/` with their own CLAUDE.md, projects, and memory files. The skill is invoked either by `personalize` (when it detects existing content) or directly by the user.

**Tone:** Coach, not lecturer. Patient. One finding at a time. Confirm before any change. The user is in control of every modification — destructive defaults are not allowed.

---

## The two-file CLAUDE.md model (orient briefly if user is unfamiliar)

> "Claude reads two instruction files. The **global** one lives in Cowork Settings → Global Instructions and applies to every session. The **workspace** one lives at `Claude/CLAUDE.md` and applies only in this folder. This skill works on the workspace file and the workspace folder structure — it does not touch your global instructions. If you also want to set up your global file, I can hand you off to `personalize` at the end."

---

## Invocation

- `/adopt-standard` — full audit, all three dimensions
- `/adopt-standard claude-md` — just the workspace CLAUDE.md audit
- `/adopt-standard folders` — just the folder structure audit
- `/adopt-standard memory` — just the memory hygiene audit
- "skip" — skip the current finding
- "skip all" — skip all remaining findings in the current dimension
- "stop" — pause the skill; nothing more will be changed this session

---

## Workflow

### Phase 0 — Pre-flight

Before reading or proposing anything, do the following in order.

**0.1 — Read the exceptions file.** Look for `Claude/.standard-exceptions.md`. If it exists, parse the listed rule IDs and stash them — the audit will respect each one (the corresponding finding will not be raised).

**0.2 — Take the snapshot.** Create `Claude/.backups/standard-adoption-YYYY-MM-DD-HHMM/` and copy the full contents of `Claude/` into it, excluding the `.backups/` directory itself (to avoid recursion). This covers the three audit dimensions plus any top-level files Phase 2 might propose moving, so the user has a clean rollback for every change the skill could make. Tell the user where the snapshot lives and how to roll back (replace files in `Claude/` with their counterparts in the backup directory).

**0.3 — Orient the user.** One paragraph:

> "I'm going to walk through three sets of findings — your workspace CLAUDE.md, your folder structure, and your memory hygiene. For each one I'll show you what I found and propose a change. Nothing will move or get rewritten without your yes. I've already taken a snapshot at `Claude/.backups/standard-adoption-YYYY-MM-DD-HHMM/` so you can roll back anything later. Ready?"

Wait for confirmation before proceeding.

---

### Phase 1 — Audit the workspace CLAUDE.md (three-way merge)

**Goal:** produce a workspace CLAUDE.md that contains every baseline section the user is missing, preserves all of their custom content, and surfaces conflicts inline for manual resolution.

**1.1 — Read both files.** Read the user's `Claude/CLAUDE.md` and the universal baseline.

The baseline file `baseline-claude-md.md` ships **inside this skill's own directory**, alongside this SKILL.md — *not* in the user's workspace. At runtime your working directory is the user's `Claude/` folder, so a bare or workspace-relative read of `baseline-claude-md.md` will fail. Resolve its absolute path first:

- The directory containing the SKILL.md you are currently executing is this skill's directory. Read `<that-directory>/baseline-claude-md.md`.
- If you cannot determine that directory directly, locate the file with Glob using the pattern `**/adopt-standard/baseline-claude-md.md` (it lives in the installed-plugin cache) and read the match.

**Do not** fall back to a structural eyeball comparison if the baseline read fails — that silently degrades the three-way merge into a shallow review (the exact failure mode reported in the v0.3.0 pilot). If both resolution methods fail, stop and tell the user the baseline could not be located rather than proceeding without it.

**1.2 — Classify the user's content.** For each section in the user's file, decide whether it:

- **Matches a baseline section** (e.g., user has a "File Safety" section and the baseline does too) → mark for three-way merge.
- **Has no baseline counterpart** (user has a custom section) → preserve verbatim, no change proposed.
- **Conflicts with a baseline rule** (e.g., user's File Safety rule says something the baseline contradicts) → flag for manual resolution with `<!-- CONFLICT: ... -->` markers.

**1.3 — Walk the user through each finding, one at a time.** For each section that needs a change:

- Show the user's current content (if present).
- Show the baseline content.
- Show the proposed merged result.
- Ask: "Apply this change, skip, or modify?"

**Three response branches:**

- **Apply** → write the merged section into `Claude/CLAUDE.md` in place.
- **Skip** → leave the section alone. Note in the session log.
- **Modify** → ask the user what they'd prefer, draft a new merged version, repeat the confirmation.

**1.4 — Handle missing sections.** For baseline sections the user does not have at all, propose adding them as new sections. Default position is at the same ordering as the baseline. User can decline.

**1.5 — Handle the user's custom content.** Anything in the user's file that does not match a baseline category is preserved verbatim in its original position. Surface a short summary at the end of Phase 1: "I left these sections of yours untouched: [list]."

**1.6 — Conflict markers.** If a conflict is unresolvable in conversation (user wants both versions, or wants to think about it), write both into the file with markers:

```markdown
<!-- CONFLICT: existing rule below vs baseline rule. Resolve manually. -->
[user's rule]
[baseline rule]
<!-- END CONFLICT -->
```

These markers stay in the file until the user removes them. The `audit-workspace` skill flags them on every run as outstanding items.

---

### Phase 2 — Audit folder structure

**Goal:** propose moves for files in the wrong location and propose new folders where the user's content suggests they're needed. Never auto-move.

**2.1 — Scan for misplaced files.** Common issues:

- Top-level files at workspace root that should live inside a project (anything that isn't `CLAUDE.md`, `MEMORY.md`, `README.md`, or a standard top-level convention).
- Memory files outside `Claude/memory/`.
- Project files outside `Claude/projects/`.

**2.2 — Propose moves one at a time.** For each misplaced file:

- Show the current path.
- Propose a destination path.
- Ask: "Move it, leave it, or pick a different destination?"

**2.3 — Cluster proposals where possible.** If several misplaced files appear related (same topic, same date range, similar names), propose creating a project to hold them:

> "These four files look like they belong together. Want me to create a `customer-feedback/` project to hold them?"

If yes, scaffold the project folder with a `PROJECT.md` (use the same template as `personalize` Phase 2).

**2.4 — Surface missing expected folders.** If `Claude/projects/` or `Claude/memory/` doesn't exist, propose creating them and ask before doing so.

**2.5 — Never auto-move.** Every move requires explicit user yes. "Skip all" advances past the remaining proposals in this dimension.

---

### Phase 3 — Audit memory hygiene

**Goal:** surface stale entries, missing frontmatter on entity/rule files, duplicate content across files, and `MEMORY.md` index drift.

**3.1 — Check frontmatter.** Per the baseline rule, entity/rule files (`people/*.md`, `feedback_*.md`, `project_*.md`, `user_*.md`) use YAML frontmatter. Curated reference docs (`company.md`, `glossary.md`, `reference.md`, etc.) are exempt. For each entity/rule file missing frontmatter, propose adding a minimal stub.

**3.2 — Check `MEMORY.md` index.** Compare the files actually in `memory/` against what `MEMORY.md` lists. Flag drift:

- Files present in `memory/` but not in `MEMORY.md` → propose adding to the index.
- Files listed in `MEMORY.md` but not present → propose removing from the index.

**3.3 — Surface duplicates.** Look for content that appears in multiple memory files (people referenced in two places, learnings duplicated across `learnings.md` and other files). Show the duplicates and ask whether to consolidate.

**3.4 — Check for stale conventions.** Look for memory files that reference deprecated patterns (e.g., specific deprecated tools or workflows named in the user's existing CLAUDE.md). Surface them but do not auto-fix — the user knows their context better than the skill does.

**3.5 — Walk each finding one at a time.** Same approach as the other two phases: show finding, propose change, ask for yes/skip/modify.

---

### Phase 4 — Offer global setup handoff

Once the workspace audit is complete:

1. Tell the user the workspace is now aligned with the standard.
2. Offer: "Want me to also set up your global instructions? That's a separate file in Cowork Settings — it carries your identity and personal communication style, and it's different from anything we just did. Takes about three minutes."
3. If yes, hand off to `personalize global` (Phase 1 of the personalize skill).
4. If no, proceed to close.

---

### Phase 5 — Close

1. Write a `.standard-adopted` marker file at the workspace root (`Claude/.standard-adopted`) containing today's date, the skill version, and a count of changes applied vs skipped.
2. Show the user a one-screen summary:
   - Snapshot location (in case rollback is needed)
   - CLAUDE.md changes applied / skipped / conflicts
   - File moves applied / skipped
   - Memory changes applied / skipped
   - Whether global setup was completed
3. Suggest the next step:
   - "Run `/audit-workspace` anytime to check for drift."
   - If conflicts were flagged, mention them: "You have N unresolved conflicts in CLAUDE.md — search for `CONFLICT` to find them."

---

## Exceptions handling

If the user has `Claude/.standard-exceptions.md`, the listed rule IDs are skipped in the audit. The file format is one rule ID per bullet with a short reason:

```markdown
# Standard Exceptions

- `file-naming-date-suffix`: Evergreen reference docs use descriptive names without dates.
- `claude-md-line-cap-150`: My CLAUDE.md is 200 lines because of role-specific routing.
```

Rule IDs are the kebab-case identifiers the skill uses for each audit check. The skill maintains the canonical list of rule IDs in a reference file alongside the SKILL.md (`rule-ids.md`).

If the user wants to opt out of something during the walkthrough, offer to add it to `.standard-exceptions.md` for next time.

---

## Rollback

The snapshot at `Claude/.backups/standard-adoption-YYYY-MM-DD-HHMM/` contains the pre-change state of `CLAUDE.md`, `projects/`, and `memory/`. To roll back, the user replaces the corresponding files in `Claude/` with their snapshot counterparts. The skill does not provide an automatic rollback command — restoring is a deliberate action the user takes manually.

---

## File-writing rules

- **Always show the user the change before writing.** Confirm with yes/no.
- **Never modify or delete files outside the three audit dimensions** (CLAUDE.md, projects/, memory/). Other content is out of scope.
- **Never write directly to Cowork's global instructions on disk** — that's `personalize`'s territory and goes through Cowork Settings.
- **Preserve user content by default.** When in doubt, leave it.
- **Conflicts go in the file, not into chat.** `<!-- CONFLICT -->` markers persist until the user resolves them; they are not lost between sessions.

---

## Notes

- The skill is idempotent on a clean workspace — if no findings, it reports "your workspace is already aligned" and writes the `.standard-adopted` marker without modifying anything.
- The skill is one-time-on-first-run by design. For re-runs or ongoing drift checks, the user runs `/audit-workspace` instead. If `/adopt-standard` is invoked after a `.standard-adopted` marker exists, it surfaces the marker and asks whether the user really wants to re-run the heavy flow.
- The bundled `baseline-claude-md.md` is the source of truth for the universal baseline. It bumps in lockstep with the workspace zip baseline — both come from the same release.

# Viewrail Claude Starter (Plugin)

System-setup skills for getting a Viewrail knowledge worker's Claude Cowork system structured correctly. Designed to be installed alongside the **Viewrail Claude Workspace** zip.

## What's included

| Skill | Purpose |
|---|---|
| `personalize` | First-run onboarding for new workspaces. Generates a global CLAUDE.md (identity + personal communication style) for pasting into Cowork Settings → Global Instructions, scaffolds 2–3 starter projects, walks through connector setup. Also routes existing-workspace users to `adopt-standard`. |
| `adopt-standard` | One-time alignment for users with an existing workspace. Snapshots the workspace, audits CLAUDE.md / folder structure / memory hygiene, walks findings one at a time, applies approved changes. |
| `audit-workspace` | Re-runnable health check. Read-only by default; surfaces drift from the standard. Optional `--remediate` mode walks findings interactively. |

## Install order for users

1. Download the **Viewrail Claude Workspace** zip and unzip to `~/Desktop/Claude`.
2. Install this plugin in Cowork.
3. Open Cowork with the `Claude/` folder selected.
4. Run `/personalize`.

Fresh installs go through identity → starter projects → connectors. Existing workspaces are routed to `adopt-standard` for alignment.

## Versioning

- Plugin version: `0.3.1` (see `.claude-plugin/plugin.json`).
- Versioned independently from the workspace zip. Bump on any skill change.

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.3.1 | 2026-06-05 | Bugfix from R&D pilot (Raun). Fixed baseline path resolution in `adopt-standard` 0.2.1 (step 1.1) and `audit-workspace` 0.2.1 (Phase 1): both now resolve `baseline-claude-md.md` by the skill's own absolute directory (with a Glob fallback on the plugin cache) instead of a bare workspace-relative read. Prevents the silent fall-back to a shallow structural review when the baseline can't be found; skills now stop and report if the baseline can't be located. Baseline files themselves unchanged. |
| 0.3.0 | 2026-06-02 | Full file-review pass. `personalize` 0.2.1 — sharper Communication Style questions, simpler connector detection. `adopt-standard` 0.2.0 — snapshot widened to full `Claude/` folder; `rule-ids.md` added. `audit-workspace` 0.2.0 — Phase 3 stale-entries check removed for parity; report aligned with canonical rule IDs; exceptions status promoted to header; conflict findings list per-occurrence file:line; `rule-ids.md` added. Both bundled `baseline-claude-md.md` files updated with `baseline-version` frontmatter and content reconciliation (drop `writing-voice` skill reference, standardize on `.md`/`.docx` file defaults, refine Communication Style Q1). |
| 0.2.0 | 2026-05-29 | Baseline CLAUDE.md revision propagated to both skills' `baseline-claude-md.md` reference files: project-creation triggers, MEMORY.md usage rules, `projects/PROJECT.md` guide vs per-project `PROJECT.md` status disambiguation. |
| 0.1.0 | 2026-05-21 | Initial release. Three skills: `personalize`, `adopt-standard`, `audit-workspace`. R&D pilot. |

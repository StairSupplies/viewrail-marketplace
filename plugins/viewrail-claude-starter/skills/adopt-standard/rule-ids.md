# Audit Rule IDs

Canonical list of the kebab-case rule identifiers used by `adopt-standard` and `audit-workspace`. Each rule corresponds to one check the audit performs. Users can opt out of any check by listing its rule ID in `Claude/.standard-exceptions.md`.

> Keep this file in sync with the matching copy in the `audit-workspace/` skill folder.

## How to use this file

To suppress a rule, add a bullet to `Claude/.standard-exceptions.md` with the rule ID and a short reason:

```markdown
# Standard Exceptions

- `file-naming-date-suffix`: Evergreen reference docs use descriptive names without dates.
- `claude-md-line-cap-150`: My CLAUDE.md is 200 lines because of role-specific routing.
```

The audit will skip the matching check on every run and report it once at the end under "Suppressed by exceptions."

---

## CLAUDE.md rules (Phase 1)

| Rule ID | What it checks | What it surfaces |
|---|---|---|
| `claude-md-missing-section` | Section header present in the baseline but absent from the user's CLAUDE.md | Proposes adding the missing section, preserving original ordering |
| `claude-md-outdated-section` | Section content significantly diverged from the current baseline | Proposes a three-way merge — apply / skip / modify |
| `claude-md-line-cap-150` | User's CLAUDE.md exceeds 200 lines (baseline target is 150 with headroom) | Flags as drift; suggests graduating content to skills/agents/memory |
| `claude-md-conflict-markers` | Unresolved `<!-- CONFLICT -->` markers left from a prior `adopt-standard` run | Lists each marker location for manual resolution |

## Folder structure rules (Phase 2)

| Rule ID | What it checks | What it surfaces |
|---|---|---|
| `folder-top-level-misplaced` | File at workspace root that isn't `CLAUDE.md`, `MAP.md`, `README.md`, a marker file, or a known top-level convention | Proposes a move to the appropriate folder (often a project) |
| `folder-memory-outside-memory-dir` | Memory-style file (people profile, learnings, gotchas) outside `Claude/memory/` | Proposes move into `Claude/memory/` |
| `folder-project-outside-projects-dir` | Project-style file or folder outside `Claude/projects/` | Proposes move into `Claude/projects/` |
| `folder-missing-projects-dir` | `Claude/projects/` doesn't exist | Proposes creating it |
| `folder-missing-memory-dir` | `Claude/memory/` doesn't exist | Proposes creating it |
| `folder-project-without-projectmd` | A folder under `Claude/projects/` has no `PROJECT.md` | Proposes scaffolding one with the standard format |

## Memory hygiene rules (Phase 3)

| Rule ID | What it checks | What it surfaces |
|---|---|---|
| `memory-entity-missing-frontmatter` | Entity/rule file (`people/*.md`, `feedback_*.md`, `project_*.md`, `user_*.md`) missing YAML frontmatter | Proposes adding a minimal frontmatter stub |
| `memory-index-drift-missing` | File present in `Claude/memory/` but not listed in `MEMORY.md` | Proposes adding to the index |
| `memory-index-drift-extra` | File listed in `MEMORY.md` but not present on disk | Proposes removing the entry from the index |
| `memory-duplicate-content` | Same person, learning, or fact appears in multiple memory files | Surfaces both occurrences and asks whether to consolidate |
| `memory-stale-convention` | Memory file references deprecated patterns or removed tools | Surfaces the reference; never auto-fixes |

## File-naming rule

| Rule ID | What it checks | What it surfaces |
|---|---|---|
| `file-naming-date-suffix` | Files outside known evergreen documents do not follow `description-YYYY-MM-DD.ext` | Lists offenders; suggests rename (not auto-applied — renames are the most invasive change and are out of scope for v1) |

---

## Versioning

Bump this file's matching skill version when adding, renaming, or removing a rule ID. The audit will reference unknown rule IDs in exceptions files as warnings — don't change an existing ID without a migration note.

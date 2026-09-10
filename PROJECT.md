# Viewrail Claude Code Plugin Marketplace

A catalog of internal Claude Code plugins for Viewrail employees, published from `.claude-plugin/marketplace.json` (marketplace name `viewrail`). The repo is public on purpose so any employee can add it without being granted repo access first; everything in it is therefore visible to the internet. Write access is Garrett-only, and that is the real trust boundary: anything merged to `main` reaches every subscribed employee automatically.

This file is the single project document; there is no separate README or CONTRIBUTING file. Git history is the changelog. Each plugin keeps its own `README.md` inside `plugins/<name>/` for end users.

## Install

```
/plugin marketplace add StairSupplies/viewrail-marketplace
/plugin install leadership-coach@viewrail
```

Adding the marketplace is a one-time step per user; Claude Code then checks it in the background and pulls updates. It does not enroll employees with zero setup; an IT-managed rollout would be a separate, unbuilt project.

## Catalog

| Plugin | Version | Author | Purpose |
|---|---|---|---|
| `leadership-coach` | 0.1.0 | Viewrail | Coaching partner for leaders: difficult conversations, change narratives, role play, development, grounded in the six Leadership Performance Drivers |
| `order-splitter` | 1.2.1 | Alex Stout | Redistributes order dollars across Terminal shipments, reconciled to the active quote, behind one PM confirmation gate |
| `viewrail-claude-starter` | 0.3.1 | Garrett Ledbetter | Workspace setup skills: `personalize`, `adopt-standard`, `audit-workspace` |

`plugins/a3-problem-solving/` (0.1.0) is in the tree but not in `marketplace.json`; it was trimmed from the published catalog and is installed manually per its own README until it is re-listed.

## Release rule

Claude Code detects a plugin update only when its resolved `version` changes. Content changed without a version bump silently never reaches anyone who already installed it. On every content change to a published plugin, bump `version` in both places together:

1. `plugins/<name>/.claude-plugin/plugin.json`
2. That plugin's entry in `.claude-plugin/marketplace.json`

`.github/workflows/version-bump-check.yml` enforces this on every pull request and push to `main`, but only for `leadership-coach`. Bumps for `order-splitter` and `viewrail-claude-starter` are on the author to remember until the check is generalized.

## Conventions

- Default branch `main`. Work on a branch and open a PR so the version check runs before content ships.
- Plugin layout: `plugins/<name>/.claude-plugin/plugin.json`, plus `commands/` and `skills/<skill>/SKILL.md` as needed.
- No customer data in test cases or fixtures; the repo is public.
- Adding a new plugin to the catalog means a new entry in `marketplace.json` with `name`, `source`, `description`, `version`, and `keywords` matching its `plugin.json`.

### Do not

- Merge a content change to a listed plugin without bumping both version fields.
- Commit `.pytest_cache/`, `__pycache__/`, `*.pyc`, `*.swp`, or `.DS_Store` (all gitignored).
- Put anything confidential in this repo.

## Deliberately omitted

- Automated enrollment of all employees. Requires an IT-managed rollout.
- A generalized version-bump check across all plugins. Only `leadership-coach` is guarded today.

## History

Scaffolded 2026-07 with an initial import, trimmed to `leadership-coach` for the first publish, then guarded by the version-bump CI check. `order-splitter` and `viewrail-claude-starter` were added to the catalog afterward.

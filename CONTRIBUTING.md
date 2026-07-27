# Release checklist

Claude Code only detects a plugin update when its resolved `version` changes. If you change a published plugin's content without bumping its version, the update **silently never reaches anyone** who already installed it — no error, no notification.

## Every time you change `leadership-coach`'s content

Before merging to `main`, bump the `version` field in **both** places:

1. `plugins/leadership-coach/.claude-plugin/plugin.json`
2. The `leadership-coach` entry in `.claude-plugin/marketplace.json`

Both must move together. A CI check (`.github/workflows/version-bump-check.yml`) enforces this automatically on every pull request — it will fail the check if either file changed without a matching version bump, or if you bumped only one of the two.

## Adding a new plugin to the catalog

Not yet supported — v1 is Garrett-only. This is deferred; see the plan doc for context.

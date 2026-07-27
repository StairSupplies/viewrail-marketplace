# Viewrail Claude Code Plugin Marketplace

A catalog of internal Claude Code plugins for Viewrail employees.

## Install

Inside a Claude Code session, run:

```
/plugin marketplace add StairSupplies/viewrail-marketplace
```

This is a **one-time step**. After you run it once, Claude Code checks this marketplace in the background and pulls in updates automatically — you don't need to re-run the add command to get newer content.

What "automatic" means in practice: your one-time add gets you background updates going forward. It does **not** mean every employee is enrolled with zero setup — that would require a separate, IT-managed rollout that isn't built yet (see below).

Then install a plugin from the catalog, e.g.:

```
/plugin install leadership-coach@viewrail
```

## What's in the catalog

- **`leadership-coach`** — A coaching partner for Viewrail leaders. Prepare for difficult conversations, build change narratives, practice through role play, and develop your team, grounded in the six Leadership Performance Drivers.

## About this repo

This repo is **public** — a deliberate choice so any Viewrail employee can add it without needing repo-level access granted first. That means plugin content here is visible to anyone on the internet, not just Viewrail employees.

Repo write access is Garrett-only for now. That's the actual trust boundary: since anything merged to `main` reaches every subscribed employee automatically, only one account can currently push changes.

## Release checklist

See [CONTRIBUTING.md](CONTRIBUTING.md) for the version-bump discipline required on every content release.

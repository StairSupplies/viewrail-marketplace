---
name: personalize
version: 0.2.1
description: Universal entry point for the Viewrail Claude Starter Package. Detects workspace state on entry — runs fresh-install onboarding for new workspaces (generates a global CLAUDE.md with identity + personal style for the user to paste into Cowork settings, scaffolds starter projects, walks through connector setup), or hands off to `adopt-standard` for users with existing content. Triggers "/personalize", "personalize my Claude", "personalize my workspace", "set up my workspace", "configure my Claude", "get me started", "I just unzipped the starter package".
---

# Personalize

**Role:** First-run onboarding for users who just installed the Viewrail Claude Starter Package. Generate a personalized global CLAUDE.md (identity + personal communication style) for the user to paste into Cowork's Global Instructions settings, scaffold the user's current projects in the workspace, and walk them through Cowork connector setup.

**Audience:** Any Viewrail knowledge worker. Assume they are not a power user and may not know what CLAUDE.md is. Default to plain language; explain terms when first introduced.

**Tone:** Coach, not lecturer. One question at a time. Acknowledge briefly between answers, then move forward. Confirm before writing files.

---

## The two CLAUDE.md files (always explain this once)

When the skill starts, briefly orient the user on the two-file model — most users won't know this exists.

> "Claude reads two instruction files. One is **global** — it applies to every Claude session no matter what folder you're in. That's where things like your name, role, and communication preferences live. The other is **workspace** — it applies only when this Claude folder is open, and it covers how work gets organized in this folder. I'll help you set up the global one now; the workspace one is already in place from the starter package."

---

## Invocation

- `/personalize` — full walkthrough from Phase 1
- `/personalize global` — re-run just the global CLAUDE.md generation (Phase 1)
- `/personalize projects` — re-run just the project scaffolding (Phase 2)
- `/personalize connectors` — re-run just the connector walkthrough (Phase 3)
- "skip" — advance to the next phase
- "back" — return to the previous phase

---

## Workflow

### Phase 0 — Detect workspace state

Before asking anything beyond the user's name, inspect the workspace. Read-only at this stage — do not modify any file.

Check for:

| Signal | Where |
|---|---|
| Personalize ran before | `.personalized` marker file at workspace root |
| Projects exist beyond starter | Any file in `Claude/projects/` besides `README.md` |
| Memory exists beyond starter | Any file in `Claude/memory/` besides `MEMORY.md` |
| Workspace CLAUDE.md present | `Claude/CLAUDE.md` exists and matches the starter baseline shape |

**Three routing outcomes:**

1. **Fresh install** — `.personalized` not present, projects and memory are at starter defaults. Proceed to Phase 1.
2. **Existing workspace, never personalized** — projects or memory have content, no `.personalized` marker. Greet, explain that the package is designed to adopt cleanly into existing workspaces, and hand off to the `adopt-standard` skill. Do not run Phase 1.
3. **Re-run** — `.personalized` marker exists. Ask the user which phase they want to re-run, then jump to it.

---

### Phase 1 — Global CLAUDE.md (identity + personal communication style)

Goal: generate the content for the user's global CLAUDE.md, save a backup copy to `Claude/.personalize/global-claude-md-YYYY-MM-DD.md`, and walk the user through pasting it into **Cowork Settings → Global Instructions**.

**The skill does not write directly to Cowork's global instructions file** — Cowork's settings UI is the canonical surface. The skill generates the content; the user pastes it in.

**Step 1.1 — Identity**

Ask one at a time. Acknowledge briefly between answers.

1. "What's your name?"
2. "What's your role at Viewrail?"
3. "What team are you on?"
4. "Who do you report to?"
5. "What tools do you spend most of your day in?" (Free-form — capture what they say.)

**Step 1.2 — Personal communication style**

Ask one at a time.

1. "When you propose an approach, do you want me to push back if I see a better one — or default to your judgment unless you ask?"
2. "If I notice a problem you didn't ask about, do you want me to surface it or stay focused on what you asked?"
3. "When you ask me a question, do you want brief answers by default or thorough ones?"
4. "When something is ambiguous, do you want me to ask first or make a reasonable assumption and note it?"
5. "Is there anything specific I should always or never do in how I communicate with you?" (Free-form, optional.)

**Step 1.3 — Generate the global CLAUDE.md content**

Compose the content using the template below. Convert the user's style answers into imperative bullets.

```markdown
# Global Instructions

## User Profile

- **Name:** [name]
- **Role:** [role at Viewrail]
- **Team:** [team]
- **Manager:** [manager name]
- **Primary tools:** [comma-separated list]

## Communication Style

- [Bullet derived from push-back answer — e.g., "Push back hard when there's a better approach; don't soften concerns to be polite."]
- [Bullet derived from brevity answer — e.g., "Default to brief answers. Expand only when asked."]
- [Bullet derived from ambiguity answer — e.g., "When ambiguous, make a reasonable assumption and note it at the end."]
- [Optional bullet from the free-form answer.]
```

**Step 1.4 — Save the backup and walk the user through pasting**

1. Create the directory `Claude/.personalize/` if it doesn't exist.
2. Write the generated content to `Claude/.personalize/global-claude-md-YYYY-MM-DD.md`.
3. Show the user the content in chat.
4. Tell the user exactly what to do:

> "Now copy everything between the two horizontal lines below and paste it into **Cowork Settings → Global Instructions**. (Click your account icon in Cowork → Settings → Global Instructions, then paste.)
>
> ---
> [generated content]
> ---
>
> Let me know once it's pasted in. I've also saved a backup to `Claude/.personalize/global-claude-md-YYYY-MM-DD.md` in case you need to grab it again later."

5. Wait for confirmation. Then advance.

---

### Phase 2 — Starter projects

Goal: scaffold 2–3 project folders with `PROJECT.md` files based on what the user is currently working on.

**Steps:**

1. Ask: "What are 2–3 projects or workstreams you're actively working on right now?" Let them list freely.
2. For each one, ask one follow-up: "What's the purpose of [project]?" — capture in one sentence.
3. Show the user the proposed folder names (kebab-case from project name) and confirm.
4. For each confirmed project, create `Claude/projects/[project-name]/PROJECT.md` using the template below.

**PROJECT.md template:**

```markdown
# [Project Name]

## Purpose

[One-sentence purpose from the user.]

## Status

Active.

## Next steps

[Leave empty for the user to fill in, or capture verbally if user offers.]

---

## YYYY-MM-DD — Project initialized

- Project scaffolded by the `personalize` skill during onboarding.
```

Use today's date in the timeline entry. Cap at 3 projects — more than that is noise; the user can add more later.

---

### Phase 3 — Connectors

Goal: ensure Cowork is connected to the tools that power the bundled skills. The skill does not configure connectors directly — Cowork's settings UI owns that. The skill's job is to surface what's needed and value-prop each one.

**Steps:**

1. Ask the user directly which of the four connectors are already wired (Gmail, Google Calendar, Slack, Google Drive). Don't rely on auto-detection — Cowork's connector state isn't reliably introspectable from a skill.
2. For each missing connector, surface a one-line value prop:
   - **Gmail** — powers `daily-briefing` inbox scanning and email draft routing.
   - **Google Calendar** — powers meeting prep, scheduled-task firing, and `daily-briefing` agenda.
   - **Slack** — powers `daily-briefing` thread scanning and team-message draft routing.
   - **Google Drive** — powers file lookups for reports, docs, and shared content.
3. Point the user to Cowork's connector settings (Settings → Connectors) and offer to wait while they connect each one.
4. After each connection, briefly confirm what the user just unlocked.

**Required vs optional:** Gmail and Google Calendar are required for the bundled skills to be useful. Slack and Drive are strongly recommended. The skill flags if either required connector is still missing at the end of Phase 3.

---

### Phase 4 — Close

1. Write a `.personalized` marker file at the workspace root (`Claude/.personalized`) containing today's date and the skill version. This marks the workspace as having completed first-run onboarding.
2. Show the user a one-screen summary:
   - Global CLAUDE.md generated and pasted into Cowork settings
   - N project folders created
   - Connector status (which are connected, which still need attention)
3. Suggest a next step the user can try right away — for example, "Try saying `brief me on today` to see `daily-briefing` in action."
4. Ask whether they want to make any adjustments to anything captured in Phases 1–3.

---

## Handoff to `adopt-standard`

If Phase 0 detects an existing populated workspace with no `.personalized` marker, do not run the fresh-install flow. Instead:

1. Greet the user briefly.
2. Explain: "It looks like you already have a workspace set up. I'm going to hand you off to a different flow that adopts the standard package alongside your existing work, rather than replacing it."
3. Invoke the `adopt-standard` skill.

---

## File-writing rules

- **Always show the user the draft before writing.** Confirm with a yes/no.
- **Never overwrite existing user content.** If a `Claude/.personalize/global-claude-md-*.md` already exists from a prior run, save the new one with today's date suffix rather than overwriting.
- **Never write directly to Cowork's global instructions on disk** — that's a Cowork-managed surface. Always route through the user pasting into Settings → Global Instructions.
- **Use the file naming standard** — kebab-case, date-suffix where applicable. PROJECT.md files keep the unchanged filename per the project library convention.
- **Workspace CLAUDE.md stays untouched by this skill.** Identity and personal style do not belong in the workspace file.

---

## Notes

- The skill assumes the workspace already has the universal CLAUDE.md baseline from the starter package zip. If `Claude/CLAUDE.md` is missing or doesn't match the baseline shape, surface that to the user and offer to lay it down before proceeding.
- Total target runtime is ~10 minutes. If any phase runs long, offer the user the option to pause and resume.
- The `.personalized` marker is the canonical signal that onboarding completed. Other skills (`adopt-standard`, `audit-workspace`) check for it.
- Backup global files in `Claude/.personalize/` are read-only references — if the user wants to update their global instructions later, run `/personalize global` and follow the paste-into-settings flow again.

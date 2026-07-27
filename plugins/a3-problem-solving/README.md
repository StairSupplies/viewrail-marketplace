# A3 Problem-Solving (Viewrail)

A conversational A3 skill for Viewrail leaders. Run `/a3` and Claude will interview you through the seven sections of an A3 Problem-Solving Report, push back on weak answers, render a polished DOCX in Viewrail blue/gold landscape style, and offer to submit it to the shared Viewrail A3 Library on Google Drive.

## Status

v0.1.0 , code complete, awaiting Garrett's dogfood pass before broader rollout.

## What you get

- A `/a3` slash command that walks through all 7 A3 sections one at a time.
- Lean coaching that pushes back on weak answers (max one probe per answer, easy escape).
- Atomic save after every section: a session crash never loses work.
- DOCX output in Viewrail blue/gold landscape A3 layout, rendered via docxtpl.
- Optional auto-submit to a shared Viewrail A3 Library Google Drive folder, organized by department.
- Section-by-section edit on existing A3s.

## Install (manual, while plugin marketplace install is a manual task at Viewrail)

1. Copy or symlink this plugin folder into `~/.claude/plugins/a3-problem-solving/` on the user's machine.
2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```
3. (Optional) Set `A3_LIBRARY_PATH` to override where local A3s are stored. Default is `~/Desktop/Claude/a3-library/`.
4. Restart Claude Code so the plugin is detected.
5. Type `/a3` in the chat to confirm the command appears.

## Local A3 storage

Each user's A3s live at:

```
~/Desktop/Claude/a3-library/<slug>/
├── state.json          # source of truth (atomic writes)
├── a3.docx             # rendered DOCX (regenerated on demand)
└── upload-receipt.json # Drive file id + url after upload
```

## Drive library

Shared folder: set via the `A3_DRIVE_LIBRARY_FOLDER_ID` environment variable (see `scripts/drive_submit.py`).

A3s are uploaded into department subfolders (auto-created if missing) on the user's confirmation. Drive submit is opt-in per A3, not mandatory; private A3s (HR, performance issues) can stay local.

## Tests

```
cd skills/a3-problem-solving
python3 -m pytest tests/ -v
```

## Architecture

Full architecture: `../../../projects/a3-problem-solving/architecture.md`.
Scoping brief: `../../../projects/a3-problem-solving/briefs/a3-problem-solving.md`.

## Sample render

A sample render lives at `~/Desktop/sample-a3-render.docx` after the engineer build. To regenerate:

```
cd skills/a3-problem-solving
python3 -c "import json, sys; sys.path.insert(0, '.'); \
  from scripts import render_docx as rd; \
  rd.render(json.load(open('examples/sample_state.json')), '~/Desktop/sample-a3-render.docx')"
```

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-04-29 | Initial implementation. Template, all 8 Python modules, 26 tests passing, SKILL.md prose, reference docs. Awaits dogfood pass. |

# Changelog

## 0.1.0 - 2026-04-29

- Initial implementation.
- DOCX template authored programmatically via `templates/build_template.py`, generates a Viewrail blue/gold landscape A3 with all 7 sections and Jinja merge fields.
- Eight Python modules: state (atomic writes, slug, history), coaching (prompts, probes), coaching_rules (per-section probes as data), conversation (orchestration), library (find / index / status table), render_docx (docxtpl render), drive_submit (submission plan, success / failure recording, manual-instructions fallback), departments (canonical list).
- 26 pytest tests passing across state, render, and drive_submit (no Drive MCP integration test, end-to-end Drive upload covered by dogfood).
- SKILL.md prose with workflow router (NEW / EDIT / REVIEW), per-section quick-reference, hard constraints.
- Reference docs filled out: coaching-rules.md (editorial-review companion), lean-glossary.md, viewrail-context.md.
- Architecture deviation noted: template was authored programmatically rather than visually in Word (engineer agent has no Word UI). Output is a normal docxtpl-compatible .docx; future visual tuning happens by opening the file in Word.
- Schema deviation: list keys renamed from `items` (collides with `dict.items` under Jinja attribute access) to section-specific names (`actions`, `comparisons`). architecture.md updated to match.

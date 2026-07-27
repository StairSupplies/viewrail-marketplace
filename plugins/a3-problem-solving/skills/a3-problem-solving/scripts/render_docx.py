"""DOCX render via docxtpl.

Loads templates/a3_template.docx, flattens any list fields into display strings
(so the template can use plain Jinja substitution rather than paragraph-loop
control tags), and saves the rendered DOCX to the requested path.

See architecture.md sections 3, 9, and decision D1.
"""

from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from docxtpl import DocxTemplate

from .state import append_history, library_root

TEMPLATE_PATH = Path(__file__).parent.parent / "templates" / "a3_template.docx"


def render(state: dict, out_path: str | Path | None = None) -> Path:
    """Render the A3 DOCX from the state dict. Returns the absolute path written.

    If `out_path` is None, defaults to <library_root>/<slug>/a3.docx.
    """
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(
            f"A3 template not found at {TEMPLATE_PATH}. Run "
            "`python3 templates/build_template.py` from the skill directory to build it."
        )
    if out_path is None:
        slug = state.get("slug")
        if not slug:
            raise ValueError("State has no slug; cannot derive default output path.")
        out_path = library_root() / slug / "a3.docx"
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    ctx = _flatten_for_template(state)
    tpl = DocxTemplate(str(TEMPLATE_PATH))
    tpl.render(ctx)
    tpl.save(str(out_path))
    append_history(state, "docx_rendered", path=str(out_path))
    return out_path


def _flatten_for_template(state: dict) -> dict:
    """Return a copy of state with display-string fields injected for list sections.

    The template uses simple {{ ... }} substitution for variable-length list
    sections (5 Whys, baseline metrics, root causes identified). This helper
    builds the joined display strings the template expects.
    """
    s = deepcopy(state)

    s2 = s.setdefault("section_2_current_condition", {})
    s2["baseline_metrics_display"] = "\n".join(
        f"  - {m.get('name', '')} = {m.get('value', '')} (measured {m.get('measured_on', '')})"
        for m in s2.get("baseline_metrics", []) or []
    ) or "  (none recorded)"

    s4 = s.setdefault("section_4_root_cause", {})
    s4["five_whys_display"] = "\n".join(
        f"  Why {w.get('level', i + 1)}: {w.get('why', '')}"
        for i, w in enumerate(s4.get("five_whys", []) or [])
    ) or "  (5 Whys not yet captured)"
    s4["root_causes_identified_display"] = "\n".join(
        f"  - {r}" for r in s4.get("root_causes_identified", []) or []
    ) or "  (none yet)"

    return s

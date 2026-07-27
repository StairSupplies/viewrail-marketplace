"""State store for A3 documents.

One JSON file per A3 at $A3_LIBRARY_PATH/<slug>/state.json. Atomic writes via
os.replace so a session crash never leaves a half-written file.

See architecture.md sections 2 (schema), 3 (interface), and 4 (file layout).
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = "1.0"
SECTIONS = (
    "section_1_background",
    "section_2_current_condition",
    "section_3_goal_target",
    "section_4_root_cause",
    "section_5_countermeasures",
    "section_6_effect_confirmation",
    "section_7_follow_up",
)


def library_root() -> Path:
    """Return the user's A3 library root, honoring the A3_LIBRARY_PATH env var."""
    p = os.environ.get("A3_LIBRARY_PATH") or str(Path.home() / "Desktop" / "Claude" / "a3-library")
    root = Path(p).expanduser()
    root.mkdir(parents=True, exist_ok=True)
    return root


def state_path(slug: str) -> Path:
    """Path to the state.json for a given slug."""
    return library_root() / slug / "state.json"


def slug_for(title: str, date: str) -> str:
    """Generate a kebab-case slug from a title plus ISO date.

    Trims to first 5 hyphen-delimited tokens of the title, appends the date,
    and tacks on -v2/-v3/... if a directory of the same name already exists.
    """
    cleaned = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    cleaned = re.sub(r"-+", "-", cleaned)
    parts = cleaned.split("-")[:5]
    base = "-".join(parts) + "-" + date
    candidate = base
    suffix = 2
    while (library_root() / candidate).exists():
        candidate = f"{base}-v{suffix}"
        suffix += 1
    return candidate


def new_state(title: str, owner: str, department: str, date: str | None = None) -> dict:
    """Create a fresh state dict for a new A3 (does not write to disk)."""
    today = date or datetime.now().strftime("%Y-%m-%d")
    slug = slug_for(title, today)
    return {
        "schema_version": SCHEMA_VERSION,
        "slug": slug,
        "status": "in-progress",
        "header": {
            "title": title,
            "owner": owner,
            "team_or_area": department,
            "date": today,
            "revision": "01",
        },
        "section_1_background": {
            "narrative": "", "business_impact": "", "first_observed": "",
            "frequency_or_scope": "", "constraint_created": "", "complete": False,
        },
        "section_2_current_condition": {
            "narrative": "", "baseline_metrics": [],
            "process_observation": "", "where_in_flow": "", "complete": False,
        },
        "section_3_goal_target": {
            "metrics": [], "value_expected": "", "target_date": "", "complete": False,
        },
        "section_4_root_cause": {
            "problem_statement": "", "five_whys": [],
            "root_cause_confirmed_by": "", "root_causes_identified": [], "complete": False,
        },
        "section_5_countermeasures": {"actions": [], "complete": False},
        "section_6_effect_confirmation": {"comparisons": [], "key_insight": "", "complete": False},
        "section_7_follow_up": {"actions": [], "standardize_next_steps": "", "complete": False},
        "footer": {"approved_by": "", "review_date": "", "status": ""},
        "department": department,
        "history": [{
            "timestamp": _now_iso(),
            "action": "created",
        }],
        "library": {
            "local_path": str(library_root() / slug),
            "drive_file_id": None,
            "drive_file_url": None,
            "last_uploaded_at": None,
        },
    }


def append_history(state: dict, action: str, **kwargs) -> dict:
    """Append an entry to state.history. History is append-only."""
    entry = {"timestamp": _now_iso(), "action": action}
    entry.update(kwargs)
    state.setdefault("history", []).append(entry)
    return state


def load(slug: str) -> dict:
    """Load and return the state for a slug. Raises FileNotFoundError if missing."""
    path = state_path(slug)
    with path.open("r", encoding="utf-8") as f:
        state = json.load(f)
    if state.get("schema_version") != SCHEMA_VERSION:
        raise ValueError(
            f"State file {path} has schema_version {state.get('schema_version')!r}; "
            f"expected {SCHEMA_VERSION!r}. Manual migration required."
        )
    return state


def save(slug: str, state: dict) -> None:
    """Atomically write state to disk. Creates the slug subfolder on first save."""
    if state.get("slug") and state["slug"] != slug:
        raise ValueError(f"Slug mismatch: state.slug={state['slug']!r} vs argument {slug!r}")
    state.setdefault("slug", slug)
    folder = library_root() / slug
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / "state.json"
    # Write to a temp file in the same dir, then atomically replace.
    fd, tmp = tempfile.mkstemp(prefix=".state.", suffix=".tmp", dir=str(folder))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        os.replace(tmp, target)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def list_library() -> list[dict]:
    """Return a list of summary dicts (one per A3 in the local library)."""
    rows = []
    for slug_dir in sorted(library_root().iterdir()):
        if not slug_dir.is_dir():
            continue
        sp = slug_dir / "state.json"
        if not sp.exists():
            continue
        try:
            with sp.open("r", encoding="utf-8") as f:
                s = json.load(f)
        except (OSError, json.JSONDecodeError):
            continue
        completed_count = sum(1 for k in SECTIONS if s.get(k, {}).get("complete"))
        rows.append({
            "slug": s.get("slug", slug_dir.name),
            "title": s.get("header", {}).get("title", ""),
            "owner": s.get("header", {}).get("owner", ""),
            "department": s.get("department", ""),
            "status": s.get("status", "unknown"),
            "completed_sections": completed_count,
            "date": s.get("header", {}).get("date", ""),
        })
    return rows


def all_sections_complete(state: dict) -> bool:
    """True iff every section has complete=True."""
    return all(state.get(k, {}).get("complete") for k in SECTIONS)


def _now_iso() -> str:
    """ISO 8601 timestamp with timezone."""
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")

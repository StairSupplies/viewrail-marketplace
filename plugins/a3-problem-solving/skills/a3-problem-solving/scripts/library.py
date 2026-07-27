"""Local A3 library scan and index.

See architecture.md sections 3 and 4 (Local user data layout).
"""

from __future__ import annotations

import json
from pathlib import Path

from .state import library_root, list_library


def index_path() -> Path:
    """Return the path to the library index.json (rebuilt from per-A3 state files)."""
    return library_root() / "index.json"


def rebuild_index() -> Path:
    """Re-derive the library index from on-disk state files; return the path."""
    rows = list_library()
    p = index_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump({"a3s": rows}, f, indent=2, ensure_ascii=False)
    return p


def find_by_slug(slug: str) -> dict | None:
    """Return the summary row for an A3 by slug, or None if missing."""
    for row in list_library():
        if row.get("slug") == slug:
            return row
    return None


def find_by_title_substring(query: str) -> list[dict]:
    """Return all summary rows whose title contains the query (case-insensitive)."""
    if not query:
        return []
    needle = query.lower().strip()
    return [r for r in list_library() if needle in r.get("title", "").lower()]


def section_status_table(state: dict) -> list[dict]:
    """Return a 7-row summary of section completion + last-edited dates for the EDIT view."""
    section_titles = {
        "section_1_background": "1 Background",
        "section_2_current_condition": "2 Current Condition",
        "section_3_goal_target": "3 Goal / Target",
        "section_4_root_cause": "4 Root Cause",
        "section_5_countermeasures": "5 Countermeasures",
        "section_6_effect_confirmation": "6 Effect Confirmation",
        "section_7_follow_up": "7 Follow-Up",
    }
    rows = []
    for key, label in section_titles.items():
        sec = state.get(key, {})
        status = "complete" if sec.get("complete") else (
            "partial" if any(v for k, v in sec.items() if k != "complete" and v) else "empty"
        )
        # Last history entry whose 'section' matches.
        last_edited = ""
        for h in reversed(state.get("history", [])):
            if h.get("section") == key:
                last_edited = h.get("timestamp", "")[:10]
                break
        rows.append({"key": key, "label": label, "status": status, "last_edited": last_edited})
    return rows

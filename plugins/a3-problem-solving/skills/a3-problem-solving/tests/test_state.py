"""Round-trip tests for state.py.

Run with: pytest tests/test_state.py from the skill directory.
"""

import json
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts import state as st  # noqa: E402


@pytest.fixture
def isolated_library(tmp_path, monkeypatch):
    """Point A3_LIBRARY_PATH at a temp directory for the duration of one test."""
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    return tmp_path


def test_slug_for_basic(isolated_library):
    s = st.slug_for("Reduce warranty costs", "2026-04-29")
    assert s == "reduce-warranty-costs-2026-04-29"


def test_slug_for_trims_to_five_tokens(isolated_library):
    s = st.slug_for("PM late orders root cause analysis follow-up", "2026-04-29")
    # First 5 tokens: pm-late-orders-root-cause
    assert s == "pm-late-orders-root-cause-2026-04-29"


def test_slug_collision_appends_suffix(isolated_library):
    first = st.slug_for("Reduce warranty costs", "2026-04-29")
    (isolated_library / first).mkdir()
    second = st.slug_for("Reduce warranty costs", "2026-04-29")
    assert second.endswith("-v2")


def test_new_state_shape(isolated_library):
    s = st.new_state("Test problem", "Owner", "Operations")
    assert s["schema_version"] == "1.0"
    assert s["status"] == "in-progress"
    assert s["header"]["title"] == "Test problem"
    assert s["header"]["owner"] == "Owner"
    assert s["department"] == "Operations"
    assert s["history"][0]["action"] == "created"
    assert s["section_5_countermeasures"]["actions"] == []
    assert s["section_6_effect_confirmation"]["comparisons"] == []


def test_save_load_round_trip(isolated_library):
    s = st.new_state("Round trip", "Tester", "Operations")
    slug = s["slug"]
    st.save(slug, s)
    loaded = st.load(slug)
    assert loaded["slug"] == slug
    assert loaded["header"]["title"] == "Round trip"


def test_atomic_write_does_not_leave_tmp(isolated_library):
    s = st.new_state("Atomic write", "Tester", "Operations")
    slug = s["slug"]
    st.save(slug, s)
    folder = isolated_library / slug
    leftover = [p for p in folder.iterdir() if p.name.startswith(".state.")]
    assert leftover == []


def test_save_rejects_slug_mismatch(isolated_library):
    s = st.new_state("Mismatch", "Tester", "Operations")
    with pytest.raises(ValueError):
        st.save("different-slug", s)


def test_append_history(isolated_library):
    s = st.new_state("History", "Tester", "Operations")
    initial = len(s["history"])
    st.append_history(s, "section_completed", section="section_1_background")
    assert len(s["history"]) == initial + 1
    assert s["history"][-1]["action"] == "section_completed"
    assert s["history"][-1]["section"] == "section_1_background"


def test_list_library_returns_summary(isolated_library):
    a = st.new_state("Alpha", "Tester", "Operations")
    b = st.new_state("Bravo", "Tester", "Marketing")
    st.save(a["slug"], a)
    st.save(b["slug"], b)
    rows = st.list_library()
    titles = sorted(r["title"] for r in rows)
    assert titles == ["Alpha", "Bravo"]


def test_load_rejects_bad_schema(isolated_library):
    s = st.new_state("Bad schema", "Tester", "Operations")
    s["schema_version"] = "9.9"
    st.save(s["slug"], s)
    with pytest.raises(ValueError):
        st.load(s["slug"])


def test_all_sections_complete_false_initial(isolated_library):
    s = st.new_state("Incomplete", "Tester", "Operations")
    assert not st.all_sections_complete(s)

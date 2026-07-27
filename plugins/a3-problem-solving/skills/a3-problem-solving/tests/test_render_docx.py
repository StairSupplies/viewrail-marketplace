"""Render-from-fixture test, highest priority per architecture.md.

Catches drift between the Word template's Jinja tags and the JSON schema. If the
template loses a tag or the schema renames a field, this test fails loudly.
"""

import json
import re
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts import render_docx as rd  # noqa: E402


FIXTURE = Path(__file__).resolve().parent / "fixtures" / "golden_state.json"


def _read_text(docx_path: Path) -> str:
    """Concatenate all <w:t> text content from a .docx for assertion."""
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    return " ".join(re.findall(r"<w:t[^>]*>([^<]+)</w:t>", xml))


def _unrendered_jinja(docx_path: Path) -> list[str]:
    """Return any leftover Jinja tags in the rendered docx (should be empty)."""
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    return re.findall(r"\{[%{][^}]*[%}]\}", xml)


@pytest.fixture
def golden_state():
    with FIXTURE.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_template_exists():
    assert rd.TEMPLATE_PATH.exists(), (
        f"Template missing at {rd.TEMPLATE_PATH}. Run "
        "`python3 templates/build_template.py` to build it."
    )


def test_render_produces_docx(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    assert out.exists()
    assert out.stat().st_size > 0


def test_render_no_unrendered_tags(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    leftover = _unrendered_jinja(out)
    assert leftover == [], f"Unrendered Jinja tags in output: {leftover[:5]}"


def test_render_contains_header_substitutions(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    text = _read_text(out)
    assert golden_state["header"]["title"] in text
    assert golden_state["header"]["owner"] in text
    assert golden_state["header"]["team_or_area"] in text


def test_render_contains_countermeasure_rows(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    text = _read_text(out)
    for action in golden_state["section_5_countermeasures"]["actions"]:
        assert action["action"] in text
        assert action["owner"] in text


def test_render_contains_effect_rows(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    text = _read_text(out)
    for cmp in golden_state["section_6_effect_confirmation"]["comparisons"]:
        assert cmp["category"] in text


def test_render_contains_followup_rows(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    text = _read_text(out)
    for fu in golden_state["section_7_follow_up"]["actions"]:
        assert fu["item"] in text


def test_render_contains_five_whys(tmp_path, golden_state, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    out = rd.render(golden_state, tmp_path / "out.docx")
    text = _read_text(out)
    for w in golden_state["section_4_root_cause"]["five_whys"]:
        assert w["why"] in text


def test_render_handles_empty_lists(tmp_path, monkeypatch):
    """Render must not crash if a list section is empty (e.g., new A3 mid-build)."""
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from scripts import state as st
    s = st.new_state("Empty lists", "Tester", "Operations")
    s["header"]["date"] = "2026-04-29"
    out = rd.render(s, tmp_path / "empty.docx")
    assert out.exists()

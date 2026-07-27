"""Drive submit tests.

The Drive MCP tools are not callable from pytest, so these tests cover the pure-Python
helpers (plan generation, success recording, manual instructions). End-to-end Drive
upload is covered by Garrett's dogfood pass.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts import drive_submit as ds  # noqa: E402
from scripts import state as st  # noqa: E402


@pytest.fixture
def isolated_library(tmp_path, monkeypatch):
    monkeypatch.setenv("A3_LIBRARY_PATH", str(tmp_path))
    return tmp_path


@pytest.fixture
def saved_a3(isolated_library):
    s = st.new_state("Drive submit test", "Tester", "Operations")
    st.save(s["slug"], s)
    docx = isolated_library / s["slug"] / "a3.docx"
    docx.write_bytes(b"PK fake docx bytes")
    return s, docx


def test_submission_plan_lists_two_files(saved_a3):
    state, docx = saved_a3
    plan = ds.submission_plan(state, docx)
    assert plan["root_folder_id"] == ds.DRIVE_LIBRARY_FOLDER_ID
    assert plan["department"] == "Operations"
    assert plan["subfolder_name"] == "Operations"
    assert len(plan["files"]) == 2
    docx_entry = plan["files"][0]
    json_entry = plan["files"][1]
    assert docx_entry["drive_filename"].endswith(".docx")
    assert json_entry["drive_filename"].endswith(".state.json")
    assert docx_entry["mime_type"].startswith("application/vnd.openxmlformats")


def test_submission_plan_falls_back_to_unassigned(saved_a3):
    state, docx = saved_a3
    state["department"] = ""
    plan = ds.submission_plan(state, docx)
    assert plan["department"] == ds.UNASSIGNED_FOLDER_NAME


def test_submission_plan_raises_for_missing_docx(saved_a3):
    state, _ = saved_a3
    with pytest.raises(FileNotFoundError):
        ds.submission_plan(state, "/nonexistent/path/a3.docx")


def test_record_success_writes_receipt(saved_a3, isolated_library):
    state, _ = saved_a3
    ds.record_success(state, "drive_id_123", "https://drive.google.com/file/d/drive_id_123/view")
    receipt = isolated_library / state["slug"] / "upload-receipt.json"
    assert receipt.exists()
    data = json.loads(receipt.read_text())
    assert data["drive_file_id"] == "drive_id_123"
    assert data["drive_file_url"].endswith("/view")
    assert state["status"] == "complete"
    last = state["history"][-1]
    assert last["action"] == "drive_submitted"


def test_record_failure_appends_history(saved_a3):
    state, _ = saved_a3
    ds.record_failure(state, "Drive MCP not connected")
    last = state["history"][-1]
    assert last["action"] == "drive_submit_failed"
    assert last["error"] == "Drive MCP not connected"


def test_manual_instructions_mentions_folder(saved_a3):
    state, docx = saved_a3
    msg = ds.manual_upload_instructions(state, docx)
    assert ds.DRIVE_LIBRARY_FOLDER_ID in msg
    assert "Operations" in msg
    assert str(docx) in msg

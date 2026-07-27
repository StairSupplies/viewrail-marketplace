"""Drive submit via Google Drive MCP.

Uploads a rendered A3 DOCX (and the source state.json) to a department subfolder
under the shared Viewrail A3 Library Drive folder. Uses the Google Drive MCP
tools that are available to the Claude session at runtime.

This module exposes pure-Python helpers and a small "instruction-builder" pattern:
because Python cannot directly invoke MCP tools, the SKILL.md prose calls the
MCP tools by name, then passes the results back into these helpers to update
state and produce a manifest. That pattern keeps the Python code testable and
keeps the actual tool invocation in the skill's natural-language workflow.

See architecture.md sections 3, 8, 9.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from .state import append_history, library_root

DRIVE_LIBRARY_FOLDER_ID = os.environ.get(
    "A3_DRIVE_LIBRARY_FOLDER_ID",
    "SET_A3_DRIVE_LIBRARY_FOLDER_ID_ENV_VAR",
)
UNASSIGNED_FOLDER_NAME = "_Unassigned"


def submission_plan(state: dict, docx_path: str | Path) -> dict:
    """Return a structured plan the SKILL.md prose executes against the Drive MCP.

    The SKILL.md workflow uses the returned plan to know:
      1. Which department subfolder to ensure (creating if needed).
      2. Which two files to upload (DOCX + state.json).
      3. What metadata to record back into state on success.

    Returns:
        dict with keys:
          - root_folder_id: the shared library root.
          - department: the picked department string.
          - subfolder_name: the department subfolder name.
          - files: list of {local_path, drive_filename, mime_type}.
          - on_success: 'instructions for state mutation, evaluated by record_success()'.
    """
    docx_path = Path(docx_path)
    if not docx_path.exists():
        raise FileNotFoundError(f"DOCX not found at {docx_path}")
    slug = state.get("slug") or "untitled"
    department = state.get("department") or UNASSIGNED_FOLDER_NAME
    state_path = docx_path.parent / "state.json"
    return {
        "root_folder_id": DRIVE_LIBRARY_FOLDER_ID,
        "department": department,
        "subfolder_name": department,
        "files": [
            {
                "local_path": str(docx_path),
                "drive_filename": f"{slug}.docx",
                "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
            {
                "local_path": str(state_path),
                "drive_filename": f"{slug}.state.json",
                "mime_type": "application/json",
            },
        ],
    }


def record_success(state: dict, drive_file_id: str, drive_file_url: str) -> dict:
    """Update state after a successful Drive upload of the DOCX."""
    state.setdefault("library", {})
    from datetime import datetime, timezone
    state["library"].update({
        "drive_file_id": drive_file_id,
        "drive_file_url": drive_file_url,
        "last_uploaded_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
    })
    state["status"] = "complete"
    append_history(state, "drive_submitted",
                   drive_file_id=drive_file_id, drive_file_url=drive_file_url)
    # Also drop a local upload-receipt next to the DOCX for traceability.
    receipt_path = library_root() / state["slug"] / "upload-receipt.json"
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    with receipt_path.open("w", encoding="utf-8") as f:
        json.dump(state["library"], f, indent=2)
    return state


def record_failure(state: dict, error: str) -> dict:
    """Update state after a failed Drive upload (or unavailable Drive MCP)."""
    append_history(state, "drive_submit_failed", error=error)
    return state


def manual_upload_instructions(state: dict, docx_path: str | Path) -> str:
    """Return user-facing instructions for manual upload when Drive MCP is unavailable."""
    department = state.get("department", UNASSIGNED_FOLDER_NAME)
    return (
        f"Drive auto-submit is unavailable. Your DOCX is saved locally at:\n"
        f"  {docx_path}\n\n"
        f"To add it to the Viewrail A3 Library, open this folder in Drive:\n"
        f"  https://drive.google.com/drive/folders/{DRIVE_LIBRARY_FOLDER_ID}\n\n"
        f"Then drop your DOCX into the '{department}' subfolder (create it if it doesn't exist)."
    )

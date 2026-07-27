"""Interview loop orchestration.

next_question(state) returns the next thing to ask the user.
apply_answer(state, section, answer) writes the answer into state and marks the
section complete.

See architecture.md sections 3 and 7.
"""

from __future__ import annotations

from typing import Any

from .coaching import opening_prompt
from .state import SECTIONS, all_sections_complete, append_history


def next_question(state: dict) -> dict:
    """Return the next question for the model to ask the user.

    Returns:
        dict with keys:
          - state_class: one of START, IN_SECTION_n, REVIEW, EDIT
          - section: the section key (or None for START / REVIEW)
          - kind: 'open' | 'review' | 'start'
          - prompt: the text to ask
    """
    # If there's no header data, we're at START.
    if not state.get("header", {}).get("title"):
        return {
            "state_class": "START",
            "section": None,
            "kind": "start",
            "prompt": (
                "Let's set up the A3. What's the title of the problem? "
                "(Then I'll ask for owner and department.)"
            ),
        }
    # Walk sections in order; find the first incomplete one.
    for sec in SECTIONS:
        if not state.get(sec, {}).get("complete"):
            return {
                "state_class": f"IN_{sec.upper()}",
                "section": sec,
                "kind": "open",
                "prompt": opening_prompt(sec, state),
            }
    # All complete: REVIEW.
    return {
        "state_class": "REVIEW",
        "section": None,
        "kind": "review",
        "prompt": (
            "All seven sections are complete. Ready to render the DOCX and submit to "
            "the Viewrail A3 Library. Anything you want to revise first?"
        ),
    }


def apply_answer(state: dict, section: str, answer: dict[str, Any]) -> dict:
    """Merge an answer dict into the section, mark complete=True, append history.

    `answer` should be a dict whose keys match the section's schema fields. The
    caller (the model, via SKILL.md prose) is responsible for parsing the user's
    free-text reply into this structured shape.
    """
    if section not in SECTIONS:
        raise ValueError(f"Unknown section: {section!r}")
    state.setdefault(section, {})
    state[section].update(answer)
    state[section]["complete"] = True
    append_history(state, "section_completed", section=section)
    if all_sections_complete(state):
        state["status"] = "complete"
    return state


def is_complete(state: dict) -> bool:
    """True iff every section's complete flag is True."""
    return all_sections_complete(state)


def edit_section(state: dict, section: str, answer: dict[str, Any]) -> dict:
    """Edit an existing section. Same as apply_answer but tagged 'section_edited' in history."""
    if section not in SECTIONS:
        raise ValueError(f"Unknown section: {section!r}")
    state.setdefault(section, {})
    state[section].update(answer)
    state[section]["complete"] = True
    append_history(state, "section_edited", section=section)
    return state

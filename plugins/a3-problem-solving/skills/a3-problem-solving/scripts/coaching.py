"""Coaching prompts and answer evaluation.

Provides deterministic helpers the SKILL.md prose calls into:

- opening_prompt(section, state) returns the question the model asks to start a section.
- evaluate_answer(section, draft_value, state) returns a hint dict the model uses
  to decide whether to push back. The model is the actual judge; this module
  just supplies the rule names and probe text.
- followup_prompt(section, prior_pushback, state) returns the warm probe text.

The probes themselves live in coaching_rules.py.

See architecture.md sections 3 and 7.
"""

from __future__ import annotations

from .coaching_rules import GOOD_ENOUGH_SIGNALS, PROBES

OPENING_PROMPTS: dict[str, str] = {
    "section_1_background": (
        "Section 1, Background. In two or three sentences, what's the problem and why does "
        "it matter? Try to name the constraint it creates in the flow, plus a rough sense of "
        "the business impact, when you first noticed it, and how often or where it shows up."
    ),
    "section_2_current_condition": (
        "Section 2, Current Condition. Describe what is happening today, not what should be. "
        "Then we'll capture baseline metrics, the actual numbers, with the date you measured "
        "them. Where in the flow does this show up?"
    ),
    "section_3_goal_target": (
        "Section 3, Goal and Target. For each baseline metric, what's the target you're "
        "committing to? What's the value expected if we hit it? And what's the target date?"
    ),
    "section_4_root_cause": (
        "Section 4, Root Cause Analysis. Start with the problem statement in one line. Then "
        "let's walk the 5 Whys, one at a time. Each Why should be verifiable, not speculation. "
        "We're aiming for a system root cause, not a person."
    ),
    "section_5_countermeasures": (
        "Section 5, Countermeasures. For each root cause from section 4, what action will "
        "address it? Each countermeasure needs an owner, a due date, and a clear trace back "
        "to a named root cause."
    ),
    "section_6_effect_confirmation": (
        "Section 6, Effect Confirmation. For the metrics in section 3, what's the realistic "
        "after-value once countermeasures are in place? What's the key insight, the one "
        "thing you want a reader to take from the before vs after?"
    ),
    "section_7_follow_up": (
        "Section 7, Follow-Up. What concrete checkpoints will tell you the countermeasures "
        "worked? Each one needs a measure, an owner, and a date. And if it works, where "
        "does the new standard live?"
    ),
}


def opening_prompt(section: str, state: dict) -> str:
    """Return the opening question for a section. `state` may be used to personalize."""
    base = OPENING_PROMPTS.get(section, "")
    title = state.get("header", {}).get("title")
    if title and section == "section_1_background":
        return f"{base}\n\n(A3: {title})"
    return base


def evaluate_answer(section: str, draft_value, state: dict) -> dict:
    """Return guidance to the model about whether the answer is weak.

    The model itself decides whether to apply a probe (it has full context); this
    function just supplies the candidate probes for the section so the model is
    consistent across users.

    Returns a dict with keys:
      - probes: list of {label, condition, ask} entries the model can choose from.
      - good_enough_signals: phrases the user might use to opt out.
      - max_probes_per_answer: integer cap on how many to apply (always 1).
    """
    return {
        "probes": list(PROBES.get(section, [])),
        "good_enough_signals": list(GOOD_ENOUGH_SIGNALS),
        "max_probes_per_answer": 1,
    }


def followup_prompt(section: str, prior_pushback_label: str | None, state: dict) -> str:
    """Return the next probe text given the prior probe (if any).

    If `prior_pushback_label` is None, return the first probe. Otherwise return
    the next probe in the list (or empty string if exhausted).
    """
    probes = PROBES.get(section, [])
    if not probes:
        return ""
    if prior_pushback_label is None:
        return probes[0]["ask"]
    for i, p in enumerate(probes):
        if p["label"] == prior_pushback_label:
            if i + 1 < len(probes):
                return probes[i + 1]["ask"]
            return ""
    return probes[0]["ask"]


def is_good_enough_signal(text: str) -> bool:
    """True if the user's reply contains a signal to stop probing this section."""
    if not text:
        return False
    lowered = text.lower().strip()
    return any(sig in lowered for sig in GOOD_ENOUGH_SIGNALS)

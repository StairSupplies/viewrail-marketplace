"""Per-section coaching probes as data.

Source-of-truth for the per-section probes the model uses to push back on weak
answers. The model applies AT MOST ONE probe per answer and accepts the second
answer with warm tone. Skipping a probe is allowed if user says "good enough",
"that's all I have", "move on", "skip", "next", or this is the third answer
on the same section.

See architecture.md section 7 (Conversation State Machine) for the design.

Joe Cooper or Garrett can edit this file to tune coaching depth without touching
SKILL.md prose. The companion `references/coaching-rules.md` is the human-readable
mirror that gets shared for editorial review.
"""

from __future__ import annotations

# Each entry is a list of probes. The model picks the FIRST probe whose condition
# matches the user's answer; if none match, the answer is accepted as-is.
PROBES: dict[str, list[dict]] = {
    "section_1_background": [
        {
            "label": "vague-impact",
            "condition": "Business impact is qualitative ('it's frustrating', 'a lot') or absent.",
            "ask": "What's the cost or scale of this? Even a rough number (dollars per quarter, "
                   "hours per week, percent of orders) anchors the rest of the A3.",
        },
        {
            "label": "no-flow-constraint",
            "condition": "User has named a complaint but not the constraint it creates in the flow.",
            "ask": "Where does this show up as a constraint, what step or handoff in the flow "
                   "gets blocked or slowed because of this?",
        },
    ],
    "section_2_current_condition": [
        {
            "label": "no-baseline-numbers",
            "condition": "Baseline metrics are vague ('a lot', 'often', 'most of the time') or missing.",
            "ask": "Can you put a number on the baseline? Even an approximation, with the date "
                   "you measured. We need something to compare against later.",
        },
        {
            "label": "should-vs-is",
            "condition": "User describes what should happen, not what is happening.",
            "ask": "Step me through what's actually happening today, not the standard. "
                   "What does the work look like right now, in practice?",
        },
    ],
    "section_3_goal_target": [
        {
            "label": "non-numeric-target",
            "condition": "Targets are qualitative ('better', 'faster') instead of numeric.",
            "ask": "What's the number you'd be willing to commit to? "
                   "If you can't say it with a number, the team can't tell when you've hit it.",
        },
        {
            "label": "no-target-date",
            "condition": "Target date is missing or vague.",
            "ask": "By when? If we revisit this A3 and the metric hasn't moved, on what date "
                   "do we say the countermeasures didn't work?",
        },
    ],
    "section_4_root_cause": [
        {
            "label": "person-cause",
            "condition": "5-Whys ends at a person ('Bob didn't do it', 'the team forgot') instead "
                         "of a system cause.",
            "ask": "If Bob were replaced tomorrow, would this problem still happen? If yes, the "
                   "root cause is a system or process issue, not Bob. Try one more Why.",
        },
        {
            "label": "shallow-whys",
            "condition": "User stopped at Why 2 or Why 3 with a generic answer.",
            "ask": "Push one more Why, what's underneath that? The root is usually 4 or 5 levels "
                   "down. Each Why should be verifiable, not speculation.",
        },
        {
            "label": "no-confirmation",
            "condition": "Root cause is asserted but not confirmed with data or observation.",
            "ask": "How do we know that's actually the root cause? What data, audit, or "
                   "observation would confirm it?",
        },
    ],
    "section_5_countermeasures": [
        {
            "label": "no-root-cause-link",
            "condition": "Countermeasure is not tied to a named root cause from section 4.",
            "ask": "Which root cause does this countermeasure address? If it doesn't trace back "
                   "to one, it's treating a symptom.",
        },
        {
            "label": "no-owner-or-due",
            "condition": "Countermeasure has no owner or no concrete due date.",
            "ask": "Who's the owner and by when? Without a name and a date, this won't move.",
        },
    ],
    "section_6_effect_confirmation": [
        {
            "label": "aspirational-after",
            "condition": "After-values are perfect-world ('100%', 'zero defects') without justification.",
            "ask": "What's the realistic after-value, given the countermeasures actually planned? "
                   "Aspirational numbers undermine the credibility of the A3 if we miss them.",
        },
        {
            "label": "no-cost-account",
            "condition": "User listed benefits but didn't account for the cost of the fix.",
            "ask": "What does it cost to implement these countermeasures, time, money, "
                   "headcount? Net impact matters more than gross.",
        },
    ],
    "section_7_follow_up": [
        {
            "label": "unmeasurable",
            "condition": "Follow-up measure cannot be observed or counted in 30/60/90 days.",
            "ask": "How will you measure this in practice? What's the specific data point "
                   "or audit that tells you the countermeasure worked?",
        },
        {
            "label": "no-standardize",
            "condition": "User has not described what to do if it works (standardize) "
                         "or if it doesn't (re-A3).",
            "ask": "If this works, where does the new standard live? If it doesn't, what's "
                   "the next step, a fresh A3, or a different countermeasure?",
        },
    ],
}


# Phrases the model treats as "user opting out" of further pushback for the section.
GOOD_ENOUGH_SIGNALS = (
    "good enough",
    "that's all i have",
    "thats all i have",
    "move on",
    "skip",
    "next",
    "no more",
    "leave it",
)

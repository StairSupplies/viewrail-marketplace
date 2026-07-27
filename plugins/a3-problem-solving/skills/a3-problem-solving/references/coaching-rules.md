# Coaching Rules

Per-section probes the skill uses to push back on weak A3 answers. The skill applies at most ONE probe per answer and accepts the second answer with a warm tone. The source of truth is `scripts/coaching_rules.py`; this Markdown copy is for editorial review (Joe Cooper, Garrett).

If you want to change a probe, edit it here AND in `coaching_rules.py`. They must agree.

---

## Section 1, Background

| Probe | Condition | Ask |
|---|---|---|
| vague-impact | Business impact is qualitative ("frustrating", "a lot") or absent. | What's the cost or scale of this? Even a rough number (dollars per quarter, hours per week, percent of orders) anchors the rest of the A3. |
| no-flow-constraint | User has named a complaint but not the constraint it creates in the flow. | Where does this show up as a constraint, what step or handoff in the flow gets blocked or slowed because of this? |

## Section 2, Current Condition

| Probe | Condition | Ask |
|---|---|---|
| no-baseline-numbers | Baseline metrics are vague or missing. | Can you put a number on the baseline? Even an approximation, with the date you measured. We need something to compare against later. |
| should-vs-is | User describes what should happen, not what is happening. | Step me through what's actually happening today, not the standard. What does the work look like right now, in practice? |

## Section 3, Goal / Target

| Probe | Condition | Ask |
|---|---|---|
| non-numeric-target | Targets are qualitative ("better", "faster") instead of numeric. | What's the number you'd be willing to commit to? If you can't say it with a number, the team can't tell when you've hit it. |
| no-target-date | Target date is missing or vague. | By when? If we revisit this A3 and the metric hasn't moved, on what date do we say the countermeasures didn't work? |

## Section 4, Root Cause Analysis

| Probe | Condition | Ask |
|---|---|---|
| person-cause | 5-Whys ends at a person ("Bob didn't do it"). | If Bob were replaced tomorrow, would this problem still happen? If yes, the root cause is a system issue, not Bob. Try one more Why. |
| shallow-whys | User stopped at Why 2 or 3 with a generic answer. | Push one more Why, what's underneath that? The root is usually 4 or 5 levels down. Each Why should be verifiable, not speculation. |
| no-confirmation | Root cause is asserted but not confirmed with data. | How do we know that's actually the root cause? What data, audit, or observation would confirm it? |

## Section 5, Countermeasures

| Probe | Condition | Ask |
|---|---|---|
| no-root-cause-link | Countermeasure is not tied to a named root cause from §4. | Which root cause does this countermeasure address? If it doesn't trace back to one, it's treating a symptom. |
| no-owner-or-due | Countermeasure has no owner or no concrete due date. | Who's the owner and by when? Without a name and a date, this won't move. |

## Section 6, Effect Confirmation

| Probe | Condition | Ask |
|---|---|---|
| aspirational-after | After-values are perfect-world without justification. | What's the realistic after-value, given the countermeasures actually planned? Aspirational numbers undermine the credibility of the A3 if we miss them. |
| no-cost-account | User listed benefits but didn't account for the cost of the fix. | What does it cost to implement these countermeasures, time, money, headcount? Net impact matters more than gross. |

## Section 7, Follow-Up

| Probe | Condition | Ask |
|---|---|---|
| unmeasurable | Follow-up measure cannot be observed or counted in 30/60/90 days. | How will you measure this in practice? What's the specific data point or audit that tells you the countermeasure worked? |
| no-standardize | User has not described what to do if it works (standardize) or if it doesn't (re-A3). | If this works, where does the new standard live? If it doesn't, what's the next step, a fresh A3, or a different countermeasure? |

---

## "Good enough" exit signals

The skill stops probing immediately when the user's reply contains any of:

- "good enough"
- "that's all I have"
- "move on"
- "skip"
- "next"
- "no more"
- "leave it"

Or when the user has already given two answers on the same section (no third probe).

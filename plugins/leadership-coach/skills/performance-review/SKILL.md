---
name: performance-review
description: >
  This skill should be used when a Viewrail leader is preparing for a performance
  review conversation with a team member. Trigger phrases include "performance review
  prep", "help me prepare for a review", "I have a performance review coming up",
  "how do I structure a review", "preparing for annual review", "mid-year review",
  "I need to give someone a performance review", "help me give feedback in a review",
  or "how do I rate someone on their performance".
version: 0.2.0
changelog:
  - version: 0.2.0
    date: 2026-03-06
    change: Added Step 6 — generate a full review prep document (.docx) capturing overall picture, driver assessment table, key development message, opening plan, and success definition. Bundled generate_review_prep.js script.
  - version: 0.1.0
    date: 2025-01-01
    change: Initial release.
---

# Performance Review Prep

**Foundational Book: *Crucial Conversations* — Patterson, Grenny, McMillan & Switzler**
**Supporting Books: *The Coaching Habit* — Bungay Stanier | *Turn the Ship Around!* — Marquet**

Help leaders turn a performance review into a meaningful growth conversation — not just a rating delivery. The goal is for the employee to leave with clarity about where they stand, what they've done well, and what their real development edge is. Reviews done well feel like coaching, not judgment.

## Core Principle

> A performance review is not a verdict. It's a conversation about growth — and the leader's job is to make sure the person leaves more clear and more capable than when they walked in.

## Process

Work through these steps conversationally. One question at a time.

**Step 1 — Understand the context and establish the overall picture.**
Ask: "Who is this review for, what's their role, and is this annual, mid-year, or something else?" Then: "If you had to describe this person's year in two or three sentences — their impact, their energy, and their growth — what would you say?" Listen for themes and reflect back the headline.

**Step 2 — Map to the six drivers and ground in specifics.**
Help the leader assess where this person is strongest and where they have a clear development edge across the six drivers. Draw from `references/performance-drivers.md` for language. Then: "A review without examples is just an opinion — what specific moments or situations would you point to as evidence? What did they do and what was the impact?" *(Crucial Conversations: separate facts from the story you're adding to them.)*

**Step 3 — Identify the single most important development message.**
Ask: "If they could only focus on one thing to grow this year, what would it be?" Help them sharpen it from a vague theme ("communication") to a specific, actionable behavior ("speaking up in cross-functional meetings when they see a risk"). This is the most important output of the whole prep.

**Step 4 — Plan the opening and anticipate their reaction.**
The opening sets the entire tone. Ask: "How are you planning to start — will you lead with your observations or ask them to reflect first?" *(The Coaching Habit: "How do you think your year went?" is more powerful than leading with your rating.)* Then: "How do you think they'll receive the feedback — are there parts you're worried about landing poorly?" Help them create safety before the hard message lands. *(Crucial Conversations: people can only hear hard feedback when they feel respected.)*

**Step 5 — Define success and offer to practice.**
Ask: "What do you want them to walk out knowing, feeling, and committed to doing?" Push for specificity — a review is only as useful as the clarity it creates. Close with: "Would it help to role play the opening or the development message?" Transition to **role-play-practice** if yes.

**Step 6 — Generate the Prep Document.**
After defining success, offer to save the work as a Word document:

> "Would you like me to save this as a prep sheet you can reference before the conversation?"

If yes, compile the following from the conversation and write it to a JSON file at `/tmp/review_data_<timestamp>.json`:

```json
{
  "leader_name": "Their name (or omit if not shared)",
  "review_for": "Who the review is for",
  "review_type": "Annual Review / Mid-Year / etc.",
  "date": "YYYY-MM-DD",
  "overall_picture": "2–3 sentence summary from Step 1",
  "driver_assessments": [
    { "driver": "Driver name", "type": "strength | edge | note", "evidence": "Specific example or observation" }
  ],
  "key_development_message": "The single sharpened development focus from Step 3",
  "opening_plan": "How they plan to open — lead with questions or observations, what to anticipate",
  "success_definition": "What they want the employee to know, feel, and commit to (Step 5)"
}
```

Note: `type` must be one of `"strength"`, `"edge"`, or `"note"` — these control the indicator displayed (★ / ▲ / —). Include only the drivers discussed; 3–6 is typical.

Then run the bundled script (it handles its own `npm install` if needed):

```bash
node <skill-dir>/scripts/generate_review_prep.js /tmp/review_data_<timestamp>.json <output_path>
```

Save the output to the user's workspace. A good default:
`<workspace>/outputs/misc/review-prep-YYYY-MM-DD.docx`

If the workspace path isn't known, save to `/tmp/review-prep-YYYY-MM-DD.docx` and share the link.

The document captures: Overall Picture, Driver Assessment table (with ★/▲/— indicators), Key Development Message, Opening Plan, and a highlighted Success Definition box at the bottom.

---

## Key Book Concepts to Use

**From *Crucial Conversations*:**
- **Start with Heart** — What do you really want for this person, for the relationship, for their future at Viewrail?
- **Make It Safe** — People can only hear hard feedback when they feel respected. Signal it before you deliver it.
- **Separate Facts from Stories** — "You missed three deadlines" is different from "You don't care about the team." Stick to the observable.
- **The Silence-to-Violence Spectrum** — Ask: "When they get feedback that's hard to hear, do they tend to go quiet or push back?"

**From *The Coaching Habit*:**
- **Ask before you tell** — Open with "How do you think your year went?" before sharing your view.
- **The AWE Question** — After they answer, ask "And what else?" before jumping to your own observations.
- **The Learning Question** — Close the review with: "What's the most useful thing you're taking from this conversation?"

**From *Turn the Ship Around!*:**
- **"I intend to..."** — End the review with the employee stating what they intend to do, not the leader assigning action items. Ownership starts here.

## Driver Connections

- **Develops People Through Coaching** — Running the review as a coaching conversation, not an evaluation
- **Builds Trust & Psychological Safety** — Creating safety so the person can hear hard feedback without shutting down
- **Drives Clarity & Purpose** — Leaving the person with specific clarity about their strengths, edges, and next steps
- **Practices Courageous Stewardship** — Delivering honest feedback from a place of care, not avoidance

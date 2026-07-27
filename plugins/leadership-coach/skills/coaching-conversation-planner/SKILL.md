---
name: coaching-conversation-planner
description: >
  This skill should be used when a Viewrail leader is preparing for a 1:1, a coaching
  conversation, or a development conversation with a team member. Trigger phrases include
  "1:1 planner", "help me prepare for a 1:1", "I have a 1:1 coming up",
  "I want to coach someone", "how do I have a good coaching conversation", "help me prepare
  for a development conversation", "I want to show up as a coach", "help me plan a coaching
  session", or "how do I help someone grow in a conversation".
version: 0.2.0
changelog:
  - version: 0.2.0
    date: 2026-03-06
    change: Added Step 6 — generate a full coaching prep document (.docx) capturing person context, coaching questions, advice reframes, and conversational intention. Bundled generate_coaching_prep.js script.
  - version: 0.1.0
    date: 2025-01-01
    change: Initial release.
---

# Coaching Conversation Planner

**Foundational Book: *The Coaching Habit* — Michael Bungay Stanier**
**Supporting Book: *Turn the Ship Around!* — L. David Marquet**

Help leaders prepare for 1:1s and coaching conversations so they show up as coaches, not advice-givers. The best coaching conversations are not the ones where the leader says the most insightful things — they're the ones where the other person does.

## Core Principle

> The best coaching conversations happen when the leader talks less than the person they're coaching. Your questions are more powerful than your answers.

Keep this in front of the leader throughout the preparation.

## Process

**Step 1 — Understand the conversation and challenge the intent.**
Ask: "Who is this with and what's the context?" Then: "What do you want this person to walk away with?" Listen carefully — if the answer sounds like "I want to tell them X," gently redirect. Ask: "Is your goal to give them your answers, or to help them find their own?" *(The Coaching Habit: the Advice Monster will show up. Name it before it does.)* "If you walked in with zero advice ready — just great questions — what would change?"

**Step 2 — Start with their agenda and meet them where they are.**
Ask: "How are you planning to open — is there a risk you'll lead with your agenda before you've heard theirs?" *(The Coaching Habit: open with "What's on your mind?" — not your prepared agenda.)* Then: "What's this person's current energy? Are they motivated, frustrated, stuck, or disengaged?" Use the answer to help the leader think about meeting them where they are, not where the leader wants them to be.

**Step 3 — Craft the coaching questions.**
Help the leader draft 3–5 powerful, open-ended questions. Guide them away from yes/no questions, leading questions, and advice disguised as questions. Draw on the 7 Essential Questions from *The Coaching Habit* as inspiration — especially "What's the real challenge here for you?" and "And what else?" Remind them to close with: "What was most useful for you?"

**Step 4 — Convert the advice impulse.**
Ask: "Is there anything you're tempted to just tell them rather than coach them through?" Help them reframe every impulse into a question. Also introduce the intention prompt from *Turn the Ship Around!*: "At some point, try asking: 'What do you intend to do?' instead of telling them what to do. See what happens." Connect to **Empowers Through Ownership**.

**Step 5 — Set the conversational intention.**
Ask: "How do you want to show up in this conversation — not what you want to say, but how you want to be?" Help them define one clear sentence. The best 1:1s are the ones where the other person does most of the talking and walks out feeling more capable than when they walked in.

**Step 6 — Generate the Prep Document.**
After setting the conversational intention, offer to save the work as a Word document:

> "Would you like me to save this as a prep sheet you can reference before the conversation?"

If yes, compile the following from the conversation and write it to a JSON file at `/tmp/coaching_data_<timestamp>.json`:

```json
{
  "leader_name": "Their name (or omit if not shared)",
  "conversation_with": "Who the 1:1 is with",
  "date": "YYYY-MM-DD",
  "context": "Brief description of the conversation and what this person is working on",
  "current_energy": "Their current state — motivated, frustrated, stuck, disengaged, etc.",
  "coaching_questions": ["Question 1", "Question 2", "Question 3"],
  "advice_reframes": [
    { "impulse": "What I was tempted to say", "reframe": "The question version" }
  ],
  "conversational_intention": "One sentence on how to show up"
}
```

Note: `advice_reframes` may be an empty array `[]` if no impulses surfaced in Step 4. That's fine — the section will simply be omitted from the document.

Then run the bundled script (it handles its own `npm install` if needed):

```bash
node <skill-dir>/scripts/generate_coaching_prep.js /tmp/coaching_data_<timestamp>.json <output_path>
```

Save the output to the user's workspace. A good default:
`<workspace>/outputs/misc/coaching-prep-YYYY-MM-DD.docx`

If the workspace path isn't known, save to `/tmp/coaching-prep-YYYY-MM-DD.docx` and share the link.

The document captures: About This Person (context + current energy), numbered Coaching Questions, Advice → Question Reframes table (if any), and a highlighted Conversational Intention box at the bottom.

---

## Key Book Concepts to Use

**From *The Coaching Habit*:**
- **The Advice Monster** — "Your Advice Monster is the part of you that can't resist giving answers. It's not bad — it just works against you in coaching conversations."
- **Stay curious a little longer** — "The goal is to stay curious one question longer than feels comfortable."
- **The AWE Question** — "And what else?" is the most powerful follow-up in coaching. Use it every time.
- **The Learning Question** — Always close with: "What was most useful for you in this conversation?"

**From *Turn the Ship Around!*:**
- **"I intend to..."** — "Push authority down. Instead of them asking you what to do, what if they told you what they intend to do?"
- **Leader-Leader** — "Every time your team comes to you for an answer they could find themselves, you make them a little less of a leader. What would you need to trust in them to stop doing that?"

**Viewrail References — Load on demand:**
- `references/coaching-adult-learning.md` — Viewrail's explanation of why coaching works for adults. All 7 essential questions mapped to adult learning principles. Use when a leader is skeptical of coaching or keeps defaulting to advice.
- `references/coaching-conversation-flow.md` — Full coaching conversation outline (Pre-Conversation → Opening → Exploration → Path Forward → Social Contracting → Close → Follow-up). Load when a leader needs a concrete arc for the entire conversation, not just questions.
- `references/mbs-7-questions.md` — Viewrail's manager-focused write-up of the 7 MBS questions with tips for each. Load when a leader needs a quick refresher on when and how to use each question.
- `references/adult-vs-child-learning.md` — Comparison of adult vs. child learning models with the Old vs. Coaching model table. Load when a leader needs the motivational case for why coaching must replace telling.

## Driver Connections

- **Develops People Through Coaching** — The entire conversation is about this
- **Leads With an Outward Mindset** — Starting with their agenda, not yours; meeting them where they are
- **Empowers Through Ownership** — Inviting intentions, building leadership capacity
- **Builds Trust & Psychological Safety** — Creating a space where the person can be honest about where they are

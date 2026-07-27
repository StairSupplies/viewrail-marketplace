---
name: difficult-conversation
description: >
  This skill should be used when a Viewrail leader wants to prepare for a difficult,
  high-stakes, or uncomfortable conversation. Trigger phrases include "prepare for a
  difficult conversation", "help me prepare for a hard conversation", "I have a tough
  conversation coming up", "I need to talk to someone about", "I'm nervous about a
  conversation", "how do I approach this conversation", "I need to give hard feedback",
  "I've been avoiding a conversation", or "help me before a performance conversation".
version: 0.2.0
changelog:
  - version: 0.2.0
    date: 2026-03-06
    change: Added Step 6 — generate a full conversation prep document (.docx) capturing situation, core message, perspective notes, intent, talking points, and the one thing to remember. Bundled generate_prep_doc.js script.
  - version: 0.1.0
    date: 2025-01-01
    change: Initial release.
---

# Prepare for a Difficult Conversation

**Foundational Book: *Crucial Conversations* — Patterson, Grenny, McMillan & Switzler**
**Supporting Book: *Leadership and Self-Deception* — The Arbinger Institute**

Help the leader show up to a high-stakes conversation with clarity, empathy, and intention. The goal is not to script the conversation — it's to help them get clear on what they really want, see the other person clearly, and walk in grounded.

## Process

Work through these steps conversationally — not as a checklist. Ask one question at a time and listen deeply before moving on.

**Step 1 — Understand the situation and what's making it hard.**
Ask the leader to briefly describe the conversation: who it's with, what it's about, and what outcome they're hoping for. Then ask: "What's making this feel difficult?" Listen for the real answer — the first answer is often the surface, not the depth.

**Step 2 — Identify the core message.**
Help them articulate what they actually need to say — clearly and honestly. Strip away the qualifications, the softening, and the spin. Ask: "If you had to say the essential thing in two sentences, what would it be?"

**Step 3 — Shift the perspective and surface the story.**
Guide them to consider the other person's reality: their needs, their pressures, their likely emotional state. Connect to **Leads With an Outward Mindset**: "What's going on for this person right now — what are they carrying, what do they care about?" Then ask: "What's the story you're telling yourself about this person — and is that story helping you or limiting you?" *(Crucial Conversations: separate facts from the story you're adding to them)*

**Step 4 — Clarify intent and create safety.**
Use *Crucial Conversations* Start with Heart: "What do you really want — for yourself, for this person, for the relationship?" Help them get honest: are they going in to be right, or to move forward together? Then ask: "Have you signaled to this person that you're on their side? People can only hear hard things when they feel safe." Connect to **Builds Trust & Psychological Safety**.

**Step 5 — Draft talking points and offer to practice.**
Help them draft 2–3 talking points: clear, honest, and grounded in care for the person. Not a script — a compass. Close with: "What's the one thing you most need to remember walking in?" Then offer: "Would it help to practice this conversation before you have it?" Transition to the **role-play-practice** skill if yes.

**Step 6 — Generate the Prep Document.**
After finalizing the talking points, offer to save the work as a Word document:

> "Would you like me to save this as a prep sheet you can reference before walking in?"

If yes, compile the following from the conversation and write it to a JSON file at `/tmp/prep_data_<timestamp>.json`:

```json
{
  "leader_name": "Their name (or omit if not shared)",
  "conversation_with": "Who the conversation is with",
  "date": "YYYY-MM-DD",
  "situation": "2–3 sentence summary from Step 1",
  "core_message": "The essential message from Step 2",
  "their_reality": "What you surfaced about the other person in Step 3",
  "story_check": "The story they're telling themselves + whether it's helping or limiting",
  "intent": "What they really want — for themselves, the person, the relationship (Step 4)",
  "talking_points": ["Talking point 1", "Talking point 2", "Talking point 3"],
  "one_thing_to_remember": "The closing anchor from Step 5"
}
```

Then run the bundled script (it handles its own `npm install` if needed):

```bash
node <skill-dir>/scripts/generate_prep_doc.js /tmp/prep_data_<timestamp>.json <output_path>
```

Save the output to the user's workspace. A good default:
`<workspace>/outputs/misc/difficult-conversation-prep-YYYY-MM-DD.docx`

If the workspace path isn't known, save to `/tmp/conversation-prep-YYYY-MM-DD.docx` and share the link.

The document captures: Situation, Core Message, Their Reality (with story check), Your Intent, numbered Talking Points, and a highlighted "Walking In" anchor at the bottom.

---

## Key Book Concepts to Use

**From *Crucial Conversations*:**
- **Start with Heart** — Before anything else: what do you really want?
- **Make It Safe** — Mutual purpose + mutual respect. People go silent or violent when safety breaks down.
- **Separate Facts from Stories** — "Just the facts" is different from the meaning you're adding.
- **The Silence-to-Violence Spectrum** — Ask: "When this gets uncomfortable, do you tend to go quiet or push harder?"

**From *Leadership and Self-Deception*:**
- **In the Box** — When we're frustrated, we're often in the box. "The box doesn't feel like a box — it feels like clarity."
- **Self-Betrayal** — Did you know how to treat this person well at some point and then not do it? That's often where the story started.

**Viewrail References — Load on demand:**
- `references/beliefs-and-accountability.md` — When the conversation involves resistance rooted in a belief rather than a skill gap. Key frameworks: Pivot from Intent to Impact, Can't vs. Won't diagnosis, the Conditional Accountability Agreement (30-day trial), and Contrast Statements. Use for performance conversations, change resistance, or any situation where the leader is avoiding accountability because they don't know how to address the belief without attacking the person.
- `references/positive-opposites.md` — When the leader needs to deliver feedback about a negative behavior pattern. The Positive Opposite Framework reframes the conversation from "stop doing X" to "here's the constructive behavior I want to see" — keeping the person open rather than defensive. Use when the leader is worried about the feedback shutting the person down.

## Driver Connections

- **Leads With an Outward Mindset** — Seeing the other person as a full human being, not an obstacle
- **Builds Trust & Psychological Safety** — Creating safety before candor
- **Practices Courageous Stewardship** — Having the conversation at all, from a values-grounded place
- **Drives Clarity & Purpose** — Knowing exactly what you need to say and why

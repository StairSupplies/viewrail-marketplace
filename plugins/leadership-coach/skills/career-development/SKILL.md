---
name: career-development
description: >
  This skill should be used when a Viewrail leader wants to prepare for a career
  development conversation with a team member. Trigger phrases include "career
  development conversation", "career conversation", "where do they want to go",
  "growth conversation", "helping someone think about their career", "development
  planning", "I want to help someone grow", "career pathing", "what's next for
  someone on my team", "I want to talk to someone about their future", or
  "how do I have a career conversation".
version: 0.2.0
changelog:
  - version: 0.2.0
    date: 2026-03-06
    change: Added Step 6 — generate a full career development prep document (.docx) capturing context, aspirations, strengths, development edge, opening question, stretch opportunities, next step, and conversational intention. Bundled generate_career_prep.js script.
  - version: 0.1.0
    date: 2025-01-01
    change: Initial release.
---

# Career Development Conversation

**Foundational Book: *The Coaching Habit* — Michael Bungay Stanier**
**Supporting Books: *The Servant Leader* — Blanchard | *Turn the Ship Around!* — Marquet**

Help leaders have career conversations that actually go somewhere. The goal is not to give the employee a roadmap — it's to help them discover their own direction, articulate their aspirations, and leave with a concrete next step they own. A great career conversation is one of the most motivating things a leader can do for someone.

## Core Principle

> The best career conversation isn't one where the leader lays out a path. It's one where the employee walks out clearer about who they are, what they want, and what they're going to do next.

## Process

Work through these steps conversationally. One question at a time.

**Step 1 — Understand the context and what you already know.**
Ask: "Who is this conversation with, what's their role, and what's prompting it?" Then: "What do you already know about what this person wants — do they have stated ambitions, or is this more of an exploration?" Help the leader name whether this person has a clear direction, has never been asked, or wants to grow but doesn't know what's possible.

**Step 2 — Map their strengths and identify their development edge.**
Ask: "What are their standout strengths right now — in their role and as a person? Where would you say they're strongest across the six drivers?" Then: "What's the gap between where they are and where they seem to want to go — what would they need to develop?" Keep this grounded as honest clarity, not a deficit.

**Step 3 — Prepare the opening and plan for common responses.**
The opening determines everything. Help the leader choose one strong opening question: "What's energizing you most right now?", "What do you want more of — and less of — in your day-to-day?", or "What kind of work makes you feel most like yourself?" *(The Coaching Habit: "What do you want?" is more powerful than "Where do you see yourself in five years?")* Then prepare for the three most common responses: they don't know what they want ("What's been lighting you up lately?"), they want something outside their current path ("What is it about that direction that appeals to you?"), or they want to leave ("Let's talk about what would need to be true here for this to be the right place.").

**Step 4 — Connect aspirations to opportunities and define the next step.**
Ask: "Given what you know about what they want, what stretch opportunities exist right now — projects, visibility, mentorship, expanded scope?" Then push for a concrete commitment: "What's one specific thing they could do in the next 30 days to move in the direction they care about?" *(Turn the Ship Around!: the next step should be theirs to own — "I intend to..." not the leader's to assign.)*

**Step 5 — Set the conversational intention.**
Ask: "How do you want to show up in this conversation — not what you want to say, but how you want to be?" The best career conversations feel like a thinking partnership, not a performance meeting. Close with: "Would it help to practice the opening or any part of this?" Transition to **role-play-practice** if yes.

**Step 6 — Generate the Prep Document.**
After setting the conversational intention, offer to save the work as a Word document:

> "Would you like me to save this as a prep sheet you can reference before the conversation?"

If yes, compile the following from the conversation and write it to a JSON file at `/tmp/career_data_<timestamp>.json`:

```json
{
  "leader_name": "Their name (or omit if not shared)",
  "conversation_with": "Who the conversation is with",
  "date": "YYYY-MM-DD",
  "context": "Who this person is, their role, and what's prompting this conversation",
  "aspirations": "What you know about what they want — stated or inferred",
  "strengths": "Their standout strengths across role and drivers",
  "development_edge": "The gap between where they are and where they want to go",
  "opening_question": "The specific question they'll open with",
  "stretch_opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "next_step": "The concrete 30-day commitment the employee will own",
  "conversational_intention": "One sentence on how to show up"
}
```

Note: `stretch_opportunities` may be an empty array `[]` if none were identified. `opening_question` renders as a visually highlighted green box.

Then run the bundled script (it handles its own `npm install` if needed):

```bash
node <skill-dir>/scripts/generate_career_prep.js /tmp/career_data_<timestamp>.json <output_path>
```

Save the output to the user's workspace. A good default:
`<workspace>/outputs/misc/career-dev-prep-YYYY-MM-DD.docx`

If the workspace path isn't known, save to `/tmp/career-dev-prep-YYYY-MM-DD.docx` and share the link.

The document captures: Context & Aspirations, Strengths & Development Edge, Opening Question (green highlighted box), Stretch Opportunities & 30-day next step, and a Conversational Intention box at the bottom.

---

## Key Book Concepts to Use

**From *The Coaching Habit*:**
- **The Foundation Question — "What do you want?"** — Simple, powerful, and almost never asked directly. Use it when the conversation is circling.
- **The AWE Question — "And what else?"** — What someone says first about their career is rarely the deepest thing. Use this to go further.
- **Stay curious longer** — Resist the urge to suggest a path before you've really understood their aspirations.
- **The Lazy Question — "How can I help?"** — Ask before assuming. Their definition of support might be very different from yours.

**From *The Servant Leader*:**
- **Serve their growth first** — A servant leader asks: "What does this person need to flourish?" Not: "What does the org need from them?"
- **Believe in their potential before they do** — Sometimes the leader's job in a career conversation is just to hold the vision of what's possible for someone who can't see it yet.

**From *Turn the Ship Around!*:**
- **Leader-Leader** — The career conversation is one of the most important moments for moving someone from follower to leader of their own growth.
- **"I intend to..."** — End the conversation with them stating what they intend to do — not you assigning action items.

## Driver Connections

- **Develops People Through Coaching** — Career conversations are the highest-leverage form of development coaching
- **Empowers Through Ownership** — Helping the employee own their own career, not depend on the leader to define it
- **Builds Trust & Psychological Safety** — Creating a space safe enough for someone to share what they actually want
- **Practices Courageous Stewardship** — Being honest about what's available, what's possible, and what they'd need to develop

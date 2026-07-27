# Order Splitter (Viewrail)

Packages the **Order Splitter** skill for distribution to the Project Management team.

## What it does

Redistributes a Viewrail deal's dollars across its Terminal orders, end to end:

- **Fresh Split** — divide one Terminal order into multiple shipments (steel-first, install-only, handrails-ahead, glass-railing hardware-first, temp-treads-ride-with-steel, etc.). The PM defines what to split and which order each portion lands on; the skill reconciles every split back to the active quote in the quoting tool and executes the Terminal actions behind a single confirmation gate.
- **Change-Order Repush** — after a change order updates the quote, replace the products on existing Terminal orders and reconcile sales.

The skill reads the active quote (HubSpot → quotes.viewrail.com), calculates the correct dollars per split, previews a plan, executes in Terminal only after the PM approves, verifies the accounting balance, and drafts (never sends) an AR balance email when a manual balance is needed.

## Who it's for

Viewrail project managers.

## Connectors used

The skill drives tools the PM already has connected — HubSpot (deals/quotes), the quoting tool and Terminal (via the Chrome browser tools), and Gmail (AR draft). No additional MCP servers are bundled in this plugin.

## How to trigger

"split this order", "split off [X]", "steel first with temp treads", "run the order split", "push change order", "update Terminal with the new quote", "change order came through — fix Terminal", and similar.

## Distribution note

Intended to be assigned to the PM group as a plugin with **Sync automatically** on, so updates to the skill reach the whole team on their next session without re-installing.

## Version

1.2.1

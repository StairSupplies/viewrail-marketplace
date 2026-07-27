---
name: order-splitter
description: >-
  Redistributes Viewrail order dollars across Terminal shipments end-to-end.
  Fresh split (steel-first, install-only, handrails-ahead, glass-railing
  hardware-first, temp-treads-ride-with-steel) or change-order repush. The PM
  defines which portion lands on which order; the skill reconciles to the active
  quote in quotes.viewrail.com and executes Terminal actions behind one PM
  confirmation gate. Triggers - "split this order", "split off [X]", "steel
  first with temp treads", "calculate split totals", "run the order split",
  "ship [X] ahead of time and split the costs", "push change order", "repush
  change order", "update Terminal with the new quote", "change order came
  through -- fix Terminal".
---

# Order Splitter

Redistributes dollars across a Viewrail deal's Terminal orders end-to-end. Two workflow branches share the same core (read the active quote, plan the Terminal action, execute after one PM confirmation, verify balance, flag issues for manual correction):

- **Part A -- Fresh Split** (validated on 6 deals): divide an untouched Terminal order into multiple shipments. Full workflow in Steps 1-17 below.
- **Part B -- Change Order Repush** (DRAFT as of 7/21/2026, awaiting Alex's demo revisions): update existing Terminal orders' products after a change order lands. Full workflow at the end of this document.

The reconciliation target is **the active quote subtotal**, not the HubSpot deal amount.

> **CHANGELOG 1.2.0 (7/24/2026):** (1) Removed the hard-coded "steel goes to the new -02" rule — the PM now defines which portion lands on which order, and the skill confirms that mapping up front. (2) Split orders keep the existing job/customer/order name and append the split type. (3) On steel-first splits, temporary treads/panels ride with the steel. (4) New glass-railing / bundled-assembly line-item breakout via ADD ITEM + SKU tables. (5) Documented that a manual Override Subtotal re-scales the discount as a % of the entered value. (6) Added Terminal line-item mechanics (ADD ITEM / edit price / Product Notes). (7) v1.2.1: edited line-item prices are pre-discount/pre-override — enter quoted value + markup, Terminal applies discount on top.

## What the skill does vs. what stays manual

| Skill does | Stays manual (PM) |
|---|---|
| Reads active quote and calculates the correct dollar per split | Deciding what to split AND which order each portion lands on (PM defines the split + the order mapping) |
| Shows a preview plan of every Terminal action before executing | Approving the plan (one confirmation gate) |
| Executes the Select Items → Split Order flow in Terminal | Final sign-off on money movement |
| Breaks a bundled line into multiple lines via ADD ITEM and edits line prices to reconcile | — |
| Applies an Override Subtotal / line-price edit to hit the quote-accurate target | Any judgment call on non-standard allocations |
| Verifies the post-split accounting balance is green | Post-split accounting-team follow-through (sale reconciliation + deposit reallocation) |
| Drafts the AR balance email to `ar@viewrail.com` | Sending the email (PM reviews and sends) |
| Flags any HubSpot pipeline anomalies (e.g., wrong stage after split) | Moving the split to the correct HubSpot pipeline stage |

## Key Workflow Detail: Terminal vs. Coding Tool

The quoting tool has columns for **Discount AND Markup**. Terminal has a **Discount column but NO Markup column**. Tax and shipping are auto-applied by Terminal based on the order's zip code and freight settings.

This means:

- The **Terminal-entry subtotal** the skill outputs for each split = `component_subtotal × (1 + markup%)` (markup baked in, discount NOT applied yet).
- Terminal then auto-applies the deal's discount, then tax, then shipping.
- For deals with no markup (most deals), the Terminal-entry value equals the pre-discount component subtotal directly.

The skill always presents both the Terminal-entry value (what the PM types) and the post-discount verification value (for reconciling against the quote) so nothing is ambiguous.

> **Important behavior of Override Subtotal / discounted orders (learned on deal 664244):** when you type a value into **Override Subtotal**, Terminal applies the order's blended **discount as a percentage of that value** — it does NOT hold the discount at a fixed dollar amount. So if the order carries any discount, the Override value you type is a **pre-discount** number; Terminal will reduce it by the discount % to produce the Items figure. To land a specific **post-discount** target, compute `override = post_discount_target / (1 - blended_discount%)`. Empirically: read the current pre-discount subtotal and current post-discount Items once, derive the ratio, then solve. Prefer **editing individual line-item prices** (which is more surgical) over an order-level Override whenever the split maps to discrete lines.

---

## Part A: Fresh Split Workflow

Use this branch when the PM wants to divide a single Terminal order into multiple shipments -- steel-first, install-off, handrails-ahead, glass-railing hardware-first, etc. Trigger phrases: "split this order", "split off [X]", "calculate split totals". Full end-to-end workflow follows.

### Workflow Overview

**Calculation phase:**

1. Gather inputs from the PM (deal + split description + which order each portion lands on)
2. Pull deal data from HubSpot MCP
3. Open the HubSpot deal in Chrome and identify the active quote
4. Open the active quote in the quoting tool (quotes.viewrail.com)
5. Read the quote-level pricing breakdown
6. Walk every system and item, capturing component-level prices
7. Match the PM's split description to actual components
8. Compute per-split subtotals (with each system's discount applied)
9. Ask the PM how to allocate shipping
10. Output two views (subtotal-only AND predicted-with-tax)
11. Reconcile: every split must sum back to the active quote subtotal

**Execution phase (single confirmation gate before executing):**

12. Preview the Terminal execution plan (including the split-to-order mapping) and wait for PM approval
13. Execute each split via Terminal's Select Items → Split Order flow, or via line-item breakout (ADD ITEM) where a single line must be divided
14. Verify post-split balance on the Accounting tab
15. Reconcile to the quote-accurate target (line-price edit or Override Subtotal), accounting for the discount-rescaling behavior above
16. Draft AR balance email to `ar@viewrail.com` when a manual balance is required
17. Flag HubSpot pipeline anomalies (e.g., splits landing in wrong stage)

---

## Step 1: Gather Inputs from PM

The PM provides these at trigger time:

1. **Deal identifier** -- one of:
   - HubSpot deal URL (`https://app.hubspot.com/contacts/3944142/record/0-3/{deal_id}`)
   - HubSpot deal ID (numeric, ~11 digits)
   - Terminal order number (6 digits, e.g., `657998`)
   - Customer name (last resort -- search HubSpot)

2. **Split description** -- in any of these styles:
   - **By system name**: "Stair 1 first, Stair 2 second", "Baserail by itself"
   - **By category**: "all the steel first", "handrails ship ahead", "interior vs exterior"
   - **By line item**: "the cable rail kit only", "the floating treads"
   - **By bucket**: "install-only split", "shipping-only split"
   - **With temp products**: "steel first with temp treads" (see Step 7 — temp treads/panels ride with the steel)
   - Mixed combinations are common

3. **The split-to-order mapping** -- which portion lands on which order (the original base order vs. a new split, and first/second/third). **There is no default direction.** Do NOT assume steel goes to the new split. If the PM says "steel on the original, wood/railing on -02," honor that exactly.

If the PM only gave the deal and no split description, ask: "How do you want to divide this order, and which order should each portion land on?" **Always confirm the split-to-order mapping before executing** (it is restated in the Step 13 plan for one-shot approval).

---

## Step 2: Pull Deal Data from HubSpot MCP

Call `mcp__de3c6ea9-...__get_crm_objects` (or `search_crm_objects` if only the order number was given) on `objectType: deals` with these properties:

```
dealname, dealstage, amount, quote_subtotal, install_amount,
shipping_amount, freight_charge, discount_amount,
quote_markup_total, total, terminal_quote_link,
office_stairsupplies_quote, hubspot_owner_id
```

**Note these values mentally:**
- `quote_subtotal` -- HubSpot's stored post-discount product subtotal (often matches active quote; may be blank/0 on migrated deals — fall back to the quote itself)
- `install_amount` -- if non-zero, this is the answer for any "install-only" split (HubSpot is authoritative)
- `shipping_amount` -- the freight cost that needs allocation
- `dealname` -- for the Terminal note header and the split order names

**Whole-bucket shortcut:** If the PM is splitting only a HubSpot summary field (install-only, shipping-only), you can answer from HubSpot data alone -- no need to open the quoting tool. Confirm the value and proceed to Step 11 (Terminal note).

For per-system or per-component splits, continue to Step 3.

---

## Step 3: Open HubSpot Deal in Chrome and Find the Active Quote

1. Call `tabs_context_mcp`. Reuse an existing HubSpot tab if available; otherwise create a new one.
2. Navigate to: `https://app.hubspot.com/contacts/3944142/record/0-3/{deal_id}`
3. Wait for the page to load (~5 seconds). Take a screenshot.
4. Locate the **Quote Tools** section. It contains a list of quotes. There may also be a `Migration (N)` tab next to `Quotes` -- legacy/migrated quotes live there.

**Identify the active quote -- the platform is mid-migration and there are THREE possible formats:**

A quote is "the one to use" if any of these apply:

1. **Format A -- "Is Active?" toggle ON** (newer quote tool format)
   - Found inside the Quote Tools section on the deal page
   - Click each quote header to expand it; use `find` to locate `"Is Active?"` checkbox
   - The expanded section also contains a "Go to Quote" link pointing to `quotes.viewrail.com/quotes/quotesummary/{quote_id}`

2. **Format B -- "Primary" badge in Quote Tools** (mid-migration format)
   - Same Quote Tools section; quote shows a "Primary" badge
   - Often visible under the `Migration` tab if there's one (e.g., `Migration (5)`)
   - "Go to Quote" link is present once the quote is expanded

3. **Format C -- HubSpot-native Viewrail Quotes object** (fully-migrated format)
   - Quote Tools section says **"All migrated"** with 0 entries
   - Instead, look at the top **Quotes** section on the deal page (above Quote Tools)
   - The quote header shows status like "$X,XXX.XX Partially Paid" with a "Create Change Order" button
   - **Fastest path to the quoting tool:** expand **Versions (N)** under that quote — each version card has a **"View Quote"** link that opens `quotes.viewrail.com/quotes/quotesummary/{quote_id}` directly. (Clicking the quote *name* may route to a settings page; use the Versions → View Quote link instead.)
   - The Viewrail Quotes custom-object record shows **Quote Status: Primary** as the marker but does not surface a direct quoting-tool link.
   - If Versions has no link, ask the PM to paste the quoting tool URL, or search the quoting tool by order number / customer name.

**If multiple quotes are flagged active or primary:** stop and ask the PM which one to use. Show them the quote names and totals.

**If no quote is flagged:** stop and tell the PM no active/primary quote was found -- they need to mark one before the skill can proceed.

---

## Step 4: Open the Active Quote in the Coding Tool

Once the active quote is identified, open its `quotes.viewrail.com/quotes/quotesummary/{quote_id}` page (via the "Go to Quote" or Versions → "View Quote" link) in a new tab.

Capture the new `tabId` from `tabs_context_mcp`. Wait 5-8 seconds for the quoting tool to load. If it times out, wait longer -- the tool can be slow.

If the tab shows a login screen instead of the quote, ask the PM to log into the quoting tool, then continue.

---

## Step 5: Read the Quote-Level Pricing Breakdown

On the **Overview** tab, the right-side **Pricing Breakdown** panel contains:

- **Product Subtotal** -- pre-discount sum of all systems and items
- **Installation/Measurements** -- install line (if any)
- **Discount Total (X.XX%)** -- the blended effective discount rate (NOT a single applied rate; per-system discounts can vary)
- **Markup Total (X.XX%)** -- only present when one or more systems carry a markup; applied AFTER discount
- **Estimated Shipping** -- the freight estimate
- **Estimated Tax** -- the tax estimate based on the shipping zip code
- **Subtotal** -- the all-in pre-tax-paid total

Capture all of these. The **Subtotal** minus the Estimated Tax minus the Estimated Shipping is the reconciliation target for the sum of split product subtotals (this also equals the HubSpot `quote_subtotal` field, modulo migration-era anomalies).

Also note the customer's **shipping zip code** from the General Information section -- the skill uses this to explain tax behavior to the PM if asked.

---

## Step 6: Walk Every System and Item

Click the **Order** tab. The page lists:

**Systems section** -- one card per system, each with:
- System name (e.g., "Flight Structure - Treads, Column, Steel", "Baserail", "Stair Railing - Vedera", "Post to Post Glass", "Baserail Glass Railing System")
- Configuration / Description bullets (includes **Features** flags such as "Includes Temporary Treads: Yes" and "Includes LEDs in Treads: Yes")
- System Price (pre-discount)
- Discount (X.XX%) -- per-system discount rate
- Markup (X.XX%) -- per-system markup rate, when applicable (shown in green)
- System Total (post-discount, post-markup)
- A **View More Details** link

**Items section** -- standalone line items (e.g., "Glass Installation Kit", temporary-tread items) with their own Price per Item, Discount, Quantity, Subtotal. These are NOT inside a system.

For each system, click **View More Details** to open a modal. Click the **Advance Pricing Breakdown** tab. Read every component price.

---

### Component naming patterns to expect

These are stable section labels in the Advance Pricing Breakdown across systems:

**Flight stair systems** (Flight Structure - Treads, Column, Steel; etc.):
- **Flight Metal Pricing Breakdown**: Stringer Price, Supports Price, Hardware Price, Finish Price
- **Flight Wood Pricing Breakdown**: Total Tread Price, Total Platform Price, Vedera Price, **Temporary Treads Price**, SmartPlank Price
- **Flight Feature Pricing Breakdown**: Ramboard Total, Riser Total, LED Total, Cover Plate Total, Grip Strip Total
- **Flight Finepoint Feature Pricing Breakdown**: Hidden Header/Birdsmouth, Landing Plate Covers, Hidden Hockey Stick Bolts, Welded Hockey Stick Joint, Seamless Welded Tread Bracket

**Railing systems** (Baserail, Post to Post Glass, Stair Railing - Vedera, Level Baserail):
- **Railing Post Pricing Breakdown**: Total Post Count, Total Post Price
- **Railing Glass Panels Pricing Breakdown**: Total Glass Panels Count, Total Glass Panel Price
- **Railing Infill Pricing Breakdown**: Total Infill Length, Total Infill Price
- **Railing Handrail Pricing Breakdown**: Total Handrail Length, **Total Handrail Price** -- THIS is the line item to use for any "handrail" split
- **Railing Hardware Pricing Breakdown**: Total Hardware Price -- includes the base channel/base rail extrusion AND the mounting screws
- **Railing Feature Pricing Breakdown**: Uninterrupted Metal Welded Handrail, etc.

The component prices in a system always sum to the **Total System Price** (pre-discount) -- this is the verification math.

**Temporary treads / panels** appear two ways (see Step 7): (a) as a **Temporary Treads Price** line inside the flight system's Flight Wood Pricing Breakdown, flagged by "Includes Temporary Treads: Yes" in the Features config; or (b) as a **standalone entry in the Additional Items list** at the bottom of the Order tab. Scan both.

---

## Step 7: Match the PM's Split Description to Actual Components

Use the PM's words to identify which components belong on which split. Common mappings:

| PM phrase | Maps to |
|---|---|
| "steel of the stairs" / "the steel structure" / "steel only" | Flight Metal section (Stringer + Supports + Hardware + Finish) of every Flight stair system |
| "the wood treads" / "wood / treads" | Flight Wood section of every Flight stair system (Total Tread + Total Platform + Vedera + SmartPlank) -- but see temp-tread rule below |
| "handrails" / "the top caps" / "the handrail wood" | Total Handrail Price line in every railing system |
| "the railing" / "railings" / "all the railings" | Entire railing systems (Baserail, Post to Post Glass, Stair Railing, Level Baserail) at the system-total level |
| "the cable rail kit" / "the install kit" | Standalone Items (the Items section, NOT a system) |
| "install-only" | HubSpot `install_amount` field |
| "shipping-only" | HubSpot `shipping_amount` field |
| "the baserail" / "baserail and hardware" / "the base channel" | **Total Hardware Price line** in the railing system. There is NO standalone "Baserail" line item -- the base rail extrusion is bundled into Hardware along with clips, brackets, fasteners, screws, and other mounting components. |
| "the glass" / "glass panels" | Total Glass Panel Price line |
| "the hardware" (without baserail context) | Total Hardware Price line (same as baserail) |
| Specific system name (e.g., "Stair 1", "the Vedera", "the Trampoline Railing") | That whole system at the system-total level |
| "interior" / "exterior" | Ask PM which systems are interior vs exterior -- not a stable structural marker |

### Temporary treads / panels on steel-first splits

When a flight system was sold with **temporary treads** (or temporary panels), those temporary products physically ship **with the steel** so the stairs are usable during construction while the permanent wood treads (often on hold for stain) come later.

- **Detection:** the flight system's Features config shows "Includes Temporary Treads: Yes", AND/OR the Advance Pricing Breakdown shows a **Temporary Treads Price** line (> $0) inside the **Flight Wood** section. Temp products may instead be a **standalone Additional Item** — scan there too.
- **Allocation rule:** on any **steel-first** split, INCLUDE the **Temporary Treads Price** (and Temporary Panels Price) on the steel split — even though it is grouped under Flight Wood. Leave the permanent wood (Total Tread, Total Platform, Vedera, SmartPlank) on the "everything else" side.
- **Trigger shorthand:** "steel first with temp treads" is explicit confirmation the temp products ride with the steel — no need to ask.
- Real example: quote 87808 ("1st to 2nd - Flight Mono") — "Includes Temporary Treads: Yes" with **Temporary Treads Price $255.00** in the Flight Wood breakdown.

### Cross-system aggregation phrases

These phrases pull the same component type from EVERY system on the quote:

| PM phrase | Behavior |
|---|---|
| "all posts and hardware" / "every post and hardware piece" | Sum Total Post Price + Total Hardware Price across **all** systems |
| "all the glass" / "every glass panel" | Sum Total Glass Panel Price across **all** systems |
| "all the handrails" / "every handrail" | Sum Total Handrail Price across **all** systems |

### System-name-as-filter phrases

When a system name is followed by a component name, treat the system name as a **scope filter**, not a whole-system pull:

| PM phrase | Behavior |
|---|---|
| "Trampoline glass" / "Trampoline Railing glass" | ONLY the Total Glass Panel Price from the Trampoline Railing system; NOT the whole Trampoline Railing system |
| "Baserail handrail" | ONLY the Total Handrail Price from the Baserail system |
| "Stair 1 steel" | ONLY the Flight Metal section of Stair 1 (the first Flight Structure system) |

### "Rest of" phrases

These pull a component from every system EXCEPT the one explicitly named on another split:

| PM phrase | Behavior |
|---|---|
| "rest of the glass" (after a "Trampoline glass" split) | Total Glass Panel Price from every system OTHER than Trampoline Railing |
| "rest of the steel" (after a "Stair 1 steel" split) | Flight Metal section from every Flight Structure system OTHER than Stair 1 |

The skill processes splits in order and tracks which components have been allocated; "rest of X" claims whatever is left of component X.

**When ambiguous:** stop and ask the PM. Examples requiring clarification:
- "Steel structure" could mean Flight Metal only, OR Flight Metal + Flight Feature (cover plates/LEDs ride with the steel). Ask.
- "Hardware" can mean Hardware Price (within Flight Metal) OR all the metal hardware components. Ask.
- "First flight" when there are multiple flight systems -- ask the PM to point at one.

**For each component placed on a split:** record the system it came from, the component name, and the pre-discount price.

---

## Step 8: Compute Per-Split Subtotals

**Critical workflow detail:** Terminal has a **Discount field but NO Markup field**. The number the PM types into Terminal's split subtotal must therefore have **markup already baked in**, with discount left for Terminal to auto-apply. Tax and shipping are also auto-applied by Terminal.

This means the skill computes TWO related numbers for each split, and labels both clearly so the PM knows which to use where:

| Number | Formula | Used for |
|---|---|---|
| **Terminal-entry subtotal** | `component_subtotal × (1 + markup%)` | What the PM types into Terminal (the "subtotal" field on the split). This includes markup; Terminal will apply discount on top. |
| **Post-discount verification subtotal** | `Terminal_entry × (1 - discount%)` = `component_subtotal × (1 + markup%) × (1 - discount%)` | What the split will be worth after Terminal applies the discount. Used to reconcile against the active quote's post-discount product subtotal. |

For each split:

1. Sum the pre-adjustment component prices placed on this split, **grouped by source system**.
2. For each source system's contribution, multiply by `(1 + that system's markup rate)` to compute its Terminal-entry value. Most deals have no markup -- in that case the Terminal-entry value equals the pre-discount component subtotal directly.
3. Sum all Terminal-entry values to get the split's Terminal-entry subtotal.
4. Multiply each split's Terminal-entry subtotal by `(1 - that system's discount rate)` to compute its post-discount verification value (or use a blended factor if the split spans multiple systems with different discount rates).

**Per-system markup and discount rates** are visible on the system card on the Order tab (e.g., "Discount (15.00%)" in red and "Markup (4.00%)" in green). The Advance Pricing Breakdown modal also shows "Total System Discount" and "Total System Markup" line items in dollars. Standalone Items use their own Discount rate (markup uncommon on items).

**Verification math:**

1. Sum of Terminal-entry subtotals across all splits must equal the quoting tool's **Product Subtotal + Markup Total** (i.e., the pre-discount, post-markup product total).
2. Sum of post-discount verification subtotals must equal the quoting tool's **post-discount, post-markup product subtotal** (Product Subtotal − Discount Total + Markup Total), which usually equals HubSpot's `quote_subtotal` field.

If splits don't reconcile, something was missed -- recount.

**Whole-system shortcut:** if a split contains an entire system, use that system's **System Price** (pre-discount, *includes* markup if any) as the Terminal-entry value, and the **System Total** (post-discount, post-markup) as the verification value -- no need to walk components.

**Examples:**

| Scenario | Markup % | Discount % | Pre-component | Terminal-entry | Post-discount verification |
|---|---|---|---|---|---|
| No markup, 15% discount | 0% | 15% | $14,706.26 | $14,706.26 | $12,500.32 |
| No markup, 10% discount | 0% | 10% | $5,030.78 | $5,030.78 | $4,527.70 |
| 4% markup, 15% discount | 4% | 15% | $1,447.84 | $1,505.75 | $1,279.89 |

---

## Step 9: Ask the PM How to Allocate Shipping

The active quote stores one combined shipping figure. The PM decides how to allocate it per job:

```
Estimated shipping on this quote is $X. How do you want to allocate it?
  1. Proportional by subtotal (each split gets its share of the freight)
  2. Lump it all on the biggest/main shipment
  3. Lump it all on a specific split (you tell me which)
  4. Two real shipping legs (you give me the second number)
```

Wait for the PM's answer. Apply it to every split. (Note: leaving shipping where it already sits is also a valid PM choice — don't move freight unless asked.)

---

## Step 10: Output Two Views

Display both in the chat. The PM enters the **Terminal-entry subtotal** into Terminal's product subtotal field for each split. Terminal auto-applies the discount, tax, and shipping. The post-discount verification view is for sanity-checking that the splits reconcile to the active quote and predicting the final all-in total.

### View A -- Terminal-Entry Subtotals (what the PM types into Terminal)

This is the primary, highlighted view. The PM should copy these numbers directly into Terminal's product subtotal field on each split.

```
SPLIT PRICING -- Order {order_number} -- {dealname}
Active Quote: {quote_name} ({quote_subtotal_formatted} before tax)

ENTER THESE SUBTOTALS IN TERMINAL (Terminal will auto-apply discount + tax + shipping):

Split 1 -- {label} -> {target order}: ${split_1_terminal_entry}
  - {component or system breakdown lines, pre-discount with markup baked in}
Split 2 -- {label} -> {target order}: ${split_2_terminal_entry}
  - ...

Reconciliation: ${sum_of_terminal_entry_subtotals} = ${product_subtotal_plus_markup} (Product Subtotal + Markup from quote) [PASS / FAIL]
```

### View B -- Post-Discount Verification + Predicted Total

For sanity-checking that the math reconciles AND predicting the all-in total per split (including tax and shipping). PM uses this to verify Terminal's auto-calculations look right after entering Split A's numbers.

Calculate the quote's effective tax rate: `tax_rate = Estimated_Tax / (Product_Subtotal_post-discount + Install_Amount)`.

For each split:
- `post_discount_subtotal = terminal_entry_subtotal × (1 - discount%)`
- `predicted_tax = post_discount_subtotal × tax_rate`
- `predicted_total = post_discount_subtotal + allocated_shipping + predicted_tax`

Display:
```
POST-DISCOUNT VERIFICATION + PREDICTED FINAL TOTALS
Effective tax rate from quote: X.XX% (zip {zip_code})

Split 1: Terminal will discount to ${post_discount_1}, add ${shipping_1} ship + ${predicted_tax_1} tax = ${predicted_total_1}
Split 2: Terminal will discount to ${post_discount_2}, add ${shipping_2} ship + ${predicted_tax_2} tax = ${predicted_total_2}

Sum of post-discount subtotals: ${sum} (should match active quote subtotal ${active_quote_subtotal})
Sum of predicted totals: ${sum} (should match active quote Subtotal ${coding_tool_subtotal})
```

If `Estimated Tax = $0`, skip the tax math and note "This deal is tax-exempt or zero-rated -- splits inherit the same."

---

## Step 11: Generate Terminal Note Draft Text

Output a code-block formatted note the PM copies and pastes into Terminal. The note must clearly label which numbers go into Terminal's subtotal field (pre-discount, with markup) vs. which are for verification only (post-discount). Use this template:

```
SPLIT PRICING -- Order {order_number} -- {dealname}
Active Quote: {quote_name} -- ${active_quote_subtotal} before tax
{optional: customer context line, e.g., "Customer requested ___ to ship first"}

ENTER THESE SUBTOTALS IN TERMINAL (Terminal auto-applies discount + tax + shipping):

Split 1 -- {label} -> {target order}: ${split_1_terminal_entry}
  - {bulleted lines: component subtotal per source system, with markup added if any}
Split 2 -- {label} -> {target order}: ${split_2_terminal_entry}
  - ...

After Terminal auto-applies the {X}% discount:
  Split 1: ${post_discount_1}  |  Split 2: ${post_discount_2}  (sum: ${quote_subtotal} matches active quote)
Shipping allocation: {method used}
Tax handled automatically by Terminal at customer zip {zip_code}.
```

Keep it terse -- one screenful, copy-paste ready.

---

## Step 12: Reconciliation Check (Mandatory)

Before proceeding to Terminal execution, verify:

1. **Subtotals reconcile:** sum of split subtotals = active quote `quote_subtotal`. Tolerance: ±$0.02 for rounding.
2. **Components accounted for:** every component price from the quoting tool is on exactly one split.
3. **Shipping allocated:** sum of allocated shipping = the quote's Estimated Shipping figure (or "left as-is" if PM chose not to move it).

If any check fails, do not proceed to execution. Report what failed and walk the PM through fixing it.

---

## Step 13: Preview the Terminal Execution Plan

Before writing anything to Terminal, present a clear plan the PM confirms in one shot. The plan is a table of every Terminal action the skill is about to take, and **it must state the split-to-order mapping explicitly** (which portion goes on which order number). Format:

```
PROPOSED TERMINAL SPLITS -- Order {order_number} -- {dealname}

SPLIT-TO-ORDER MAPPING (confirm this is the direction you want):
  {portion A} -> {order, e.g., 664244 (original)}: ${terminal_entry_subtotal}
  {portion B} -> {order, e.g., 664244-02 (new "..." split)}: ${terminal_entry_subtotal}

PRE-FLIGHT CHECK
  [ ] Verify original order is balanced (all sale statuses green on Accounting tab)
  [ ] Note existing sub-orders so the new suffix is known ahead of time

FOR EACH SPLIT:
  {portion} -> {order}: ${terminal_entry_subtotal}
    - Terminal action: {Split Order of line X} OR {ADD ITEM SKUs + edit source line price}
    - Line items involved: {list}
    - Order Name to enter (new orders): {existing job name} - {Split Type} Split
    - Order Type: {Materials | Installation}

POST-SPLIT CHECKS I WILL RUN:
  [ ] Accounting tab all sale statuses green on original + each new split
  [ ] Each order's Items reconcile to the quote-accurate target
  [ ] If a manual balance is needed, compute the correct Override / line-price value
      (accounting for the discount-rescaling behavior) and apply it

FOLLOW-UPS I WILL DRAFT (not send):
  [ ] AR balance email to ar@viewrail.com (only if a manual balance / deposit reallocation is needed)
  [ ] Any HubSpot pipeline anomalies (e.g., split landed in "Terminal landing zone")

Approve to execute? (yes / no / adjust)
```

**Wait for explicit approval** ("yes" or equivalent) before writing anything to Terminal. If the PM says "adjust," loop back and ask what to change; re-present the plan; wait again.

If the PM says "no" or opts out of execution, drop back to calculator-only mode: output Step 10's two views + Terminal note draft, and stop.

---

## Step 14: Execute Each Split in Terminal

Once approved, run each split sequentially (not in parallel — Terminal state must be verified between operations).

### 14a: Open the Terminal order

Navigate the Chrome tab through this confirmed path:

1. Navigate to the Terminal deal page: `https://terminal.viewrail.com/admin/deals/{deal_number}/info`
2. Click the **ORDERS** dropdown in the header (top-right, next to "EDIT DEAL")
3. In the popup that appears, find the Materials order (usually the base order number with no suffix, e.g., `664244`, not `664244-02` which is often a sample or existing split)
4. Click **VIEW ORDER** on that card
5. The URL will land at `https://terminal.viewrail.com/admin/deals/{deal}/order/{order}/status` — this is the correct order page

If the deal has existing sub-orders (like `-02` Sample, or `-02` from a prior split), Terminal will assign the next available suffix to the new split (e.g., if `-02` is used, new split becomes `-03`). The skill should note existing sub-orders in the plan preview so the PM knows the suffix ahead of time.

Wait for the page to fully load before proceeding.

### 14b: Pre-flight balance check

Click the **Accounting** tab. Read the transaction summary and the Order Summary rows. Verify:

- Order Sales = Accounting Sales (within $0.02)
- All sale statuses show green

**If not balanced pre-split:** stop and report to the PM. Do not attempt to split an unbalanced order. Example message: *"Order {X} is unbalanced before splitting -- {details}. Splitting will make this worse. Please balance manually, then re-run me."*

### 14c: Determine the Terminal mechanic for each split

Two mechanics, chosen by how the split maps to Terminal's line items:

- **Whole-line / whole-system split → use Split Order (14d).** The portion being moved is one or more discrete Terminal lines (e.g., a "Structure" line, an Installation line, a full system). Check those lines and Split Order.
- **Part of one line must be divided → use line-item breakout (14e / see "Bundled-Assembly Line-Item Split" section).** The portion lives inside a single bundled Terminal line (e.g., a glass railing line that contains glass panels + base rail + hardware). You cannot Split-Order a fraction of a line, so instead you ADD ITEM the split-off SKUs onto the target order and edit the source line's price down.

### 14d: Run a Split Order (whole-line / whole-system)

1. Click **Select Items**
2. Check the appropriate line item(s) / group(s)
3. Click **Split Order**
4. In the modal, choose **Create a new order** (unless the plan explicitly says "Move items to an existing order")
5. **Order Name:** keep the existing job/customer/order name and append the split type — e.g., `{Existing Job Name} - Revised 7.16.26 - Steel First Split` (NOT a bare "Steel First"). Split types: "Steel First Split", "Wood & Railing Split", "Glass Split", "Install Split", etc.
6. Select **Order Type** (Materials or Installation)
7. Click **Create Split Order**
8. Wait for Terminal to finish processing (page reload / new -0N order appears)

### 14e: Direction is PM-defined — NO fixed rule

There is **no built-in assumption** about which portion goes to the new split vs. stays on the original. Follow the **split-to-order mapping the PM confirmed in Step 13**. The item Terminal's Select Items → Split Order flow moves is the item(s) you checked; if the PM wanted the steel to stay on the original and the wood/railing to be split off, then check the wood/railing lines (not the steel). If the resulting direction doesn't match the confirmed mapping, report the mismatch and ask the PM to intervene — do not silently proceed.

### 14f: Terminal line-item operations (mechanics)

**Add a line item (ADD ITEM):**
1. Click **ADD ITEM**
2. Type **#** followed by the part number (usually 6 digits), OR type the part name/description
3. Click **Select**
4. Set the **Quantity**. **Do not change the price when adding** — added parts (base channel, mounting screws, drain blocks, talons, etc.) come in at their standard price; you only set the quantity.

**Edit an existing line item's price:**
1. Click **Select Items**
2. Check the box next to the line item to edit
3. Click the **pencil (Edit)** button at the top
4. You'll see **price per quantity** and quantity; delete the old price, type the new one
5. Click **Save Current Item**

> **The edited line-item price is PRE-discount and PRE-override.** Enter the **quoted value for that line + any markup on that line item** (i.e., the Terminal-entry basis: `component × (1 + markup%)`). Terminal then applies the order's discount on top. So to reduce a source line by a hardware amount, set its price to `(quoted line value − hardware value) × (1 + markup%)`, pre-discount.

**Edit in-house notes (Product Notes) on a line:**
1. Select Items → check the line → **Edit** (pencil)
2. Edit the **Product Notes** field (these are the in-house notes that show on the order)
3. This is where you add the split-off note, e.g., "Base channel / surface talons & hardware split off to {order}"

---

## Bundled-Assembly Line-Item Split (Glass Railing "Ship Hardware First")

Use this when a single Terminal product line is a **bundled Viewrail assembly** (most common: a glass railing line containing glass panels + base rail/talon mounting hardware) and the PM wants to **ship the mounting hardware ahead of the glass**. You cannot Split-Order a fraction of a line, so you build the hardware onto the ship-first order with **ADD ITEM** and reconcile dollars to the quote.

### Which mounting system (read from the quote)

A glass railing uses **one** of these mounting methods — detect it from the system's mounting spec on the quote (Mounting Style / spec bullets):

- **Base rail (channel) system** — glass sits in a base rail channel; ship-first bundle = base rail assemblies + mounting kit + drain blocks.
- **Talon (surface-mount) system** — glass mounts via surface talons; ship-first bundle = talons + (screws if aluminum).

Interior vs. exterior and wood vs. concrete come from the system's group and its **Mounting Surface** bullet.

### SKU reference

**Base rail assemblies** (only length currently is 4'6"):

| SKU | Assembly |
|---|---|
| 681299 | Base Rail Assembly 4'6" — Interior |
| 390316 | Base Rail Assembly 4'6" — Exterior |
| 623511 | 3/4" Glass Base Rail Assembly 4'6" |

**Base rail mounting kits** (one per assembly; pick by interior/exterior × wood/concrete):

| SKU | Mounting kit |
|---|---|
| 681723 | Baserail Wood Mounting Kit — Interior |
| 509765 | Baserail Concrete Mounting Kit — Interior |
| 509764 | Baserail Wood Mounting Kit — Exterior |
| 950570 | Baserail Concrete Mounting Kit — Exterior |

**Drain blocks:**

| SKU | Item | Qty |
|---|---|---|
| 589309 | Base Rail Drain Block | **5 per base rail assembly shipped**, when the quote says "Includes drain blocks" |

**Surface talons** (2 per glass panel; panel count = quote's Total Glass Panels Count):

| SKU | Talon | Notes |
|---|---|---|
| 876343 | Stainless Surface Mount Talon — Assembly | Hardware **included**; nothing else to add |
| 559854 | Aluminum Surface Mount Talon with Inserts — Assembly | Powder-coat finish matched to the system's finish from the quote; hardware **NOT included** → add screws below |

**Talon mounting screws** (for the aluminum 559854 only — **4 per talon**):

| SKU | Screw | Use |
|---|---|---|
| 727852 | 5/16" x 3-1/2" Mounting Screw — Stainless Steel | Exterior |
| 302720 | 5/16" x 3-1/2" Mounting Screw — Case Hardened | Interior |

**Talon type selection:** read the talon material/finish from the quote spec (it will tell you stainless vs. aluminum).

### Quantity rules

- **Base rail assemblies:** count **each run independently** and **round up** `run_length ÷ 4.5` per run; then sum across runs. Never total the footage and divide once. (e.g., 8 ft → 2, 10 ft → 3.) Only the 4'6" length exists today.
- **Mounting kits:** **one per assembly**.
- **Drain blocks:** **5 per assembly** (when the quote says "Includes drain blocks").
- **Talons:** **2 per glass panel**.
- **Talon screws (aluminum only):** **4 per talon** → total = 4 × 2 × panel count = 8 × panel count.

### Build + reconcile

1. On the **ship-first** order, **ADD ITEM** each split-off SKU with the correct quantity (per rules above). Leave the default SKU prices as-is when adding.
2. **Reconcile the ship-first order's subtotal to the quote's `Total Hardware Price`** (which covers the base channel + screws). If the summed SKU list prices don't land on that target, adjust to hit it — preferably by **editing the line-item price** (14f), otherwise via Override Subtotal (remember the discount-rescaling behavior — the value you type is pre-discount).
3. On the **source railing line** (the bundled line the hardware came out of): **edit its price down by the reconciled hardware amount** so the deal total still ties. The **glass panels stay in the existing railing line** — do not break them out.
4. Add a **Product Note** to that source railing line: "Base channel / surface talons & hardware split off to {order}".
5. Verify the two orders' Items still sum to the quote's product subtotal.

> **Edited line prices are pre-discount and pre-override** — set each line to its quoted value + any markup on that line (Terminal applies the discount on top). So the added-SKU / source-line prices should reflect the quote's per-line figures with markup baked in; the order will then discount to the correct place and reconcile to the quote's Total Hardware Price.

---

## Step 15: Verify Balance After Each Split / Reconcile to Target

Immediately after each Terminal action, verify:

### 15a: Both orders' accounting

- Open the **Accounting** tab on the original order and each new/target order.
- Confirm all sale statuses are green and each order's Order Sales = Accounting Sales.
- Read each order's **Items** figure.

### 15b: Compare against the skill's calculated target

Compare Terminal's post-split **Items** against the skill's calculated Terminal-entry / post-discount values from Step 8.

**A. Match (auto-balanced case):** Items agree within ±$0.02. Continue to Step 16.

**B. Mismatch (expected on component-level / bundled splits, or when forcing a specific allocation):** apply the correct value via **line-price edit** (preferred) or **Override Subtotal**.

- **Compute the override correctly for discounted orders.** Override Subtotal is a **pre-discount** value; Terminal re-applies the order's blended discount % to it. To land a target **post-discount** Items figure: `override = post_discount_target / (1 - blended_discount%)`. Derive the blended rate empirically from the order's current pre-discount subtotal vs. current post-discount Items, then solve. Verify the resulting Items on the Accounting tab after saving.
- **Keep the deal total constant.** If you push value onto one order via override, reduce the counterpart order by the same amount so the sum of Items across all orders still equals the pre-split product total. This usually means TWO offsetting overrides (one up, one down).
- **After overrides, the sale transactions won't auto-match the new order values.** Terminal will show a symmetric "Missing / Over Sold" imbalance (equal and opposite) between the orders. This sale-transaction reconciliation — plus reallocating any paid deposit across the orders — is **AR's job**; hand it off via the Step 16 email with exact figures. (The order-level product values and deal total should be correct before handoff.)

#### Legacy note — Terminal Split-Order double-discount bug (patched July 2026)

Historically, a Split Order on a discounted line re-applied the discount, producing a target ~(discount%) too low (signature: `target_line_total = source_line_total × (1 - discount%)`). IT patched this after the deal-663592 report. Keep the check as a **regression safety net**: if a fresh Split Order's target comes out at `source × (1 - discount%)`, flag it and set the correct Override to `source_line_total`.

---

## Step 16: Draft AR Balance Email (When Needed)

If any order required a manual override / line-price edit (so the sale transactions need reconciling), or a paid deposit needs reallocating across the split orders, draft a **brief** email using the Gmail integration and **save as a draft — do not send**.

- **To:** `ar@viewrail.com`
- **Subject:** `Please balance order {order_number}`
- **Body (keep it short — move money + follow the payment terms on the Accounting tab):**

```
Hi AR team,

Order {order_number} was split into {-02 / -03 ...}. Please move ${amount} of sale from
{order A} to {order B} so both orders balance, and reallocate payments per the payment
terms shown on the Accounting tab.

Thanks,
{PM name}
```

Only include specific figures the team needs (the amount to move, and which order to which). Skip the AR email entirely for the fully-auto-balanced case (no override, no deposit to move).

---

## Step 17: Flag HubSpot Pipeline Anomalies

After all splits are complete, briefly check the HubSpot deal page to catch known post-split anomalies:

- **If any new order landed in "Terminal landing zone" pipeline stage**: report to the PM: *"New order {order}-02 is in Terminal landing zone. Manually move to Order Discovery (or the correct downstream stage). Suggested close date: {close_date}."*
- **If order names don't match the plan** (e.g., Terminal renamed something): report the mismatch.
- Confirm the new split synced to HubSpot as an order under the deal.

The skill does not attempt to move HubSpot pipeline stages itself -- pipeline moves are the PM's call. Just surface anything worth double-checking.

---

---

## Things That Should Make the Skill Stop and Ask

**During calculation:**

- Multiple quotes flagged active/primary
- No quote flagged active/primary
- A PM term that maps to multiple things (e.g., "the steel" could be Flight Metal only or Flight Metal + cover plates)
- A flight system contains both metal and wood and the PM split description doesn't clarify which goes where
- The split-to-order mapping (which portion on which order) is not clear — always confirm before executing
- The quoting tool times out or shows a login screen
- The components don't sum to the system price (data issue in the quoting tool)
- The PM mentions a system name not present on the quote

**During execution:**

- Original order is not balanced before splitting begins -- do not attempt to split an unbalanced order
- The direction Terminal produced (which items moved vs stayed) doesn't match the PM-confirmed mapping
- A validation error or unexpected modal appears in Terminal
- The plan preview in Step 13 was not explicitly approved
- A split fails halfway through -- do not attempt subsequent splits until it's resolved
- A reconciliation can't be made to tie to the quote — stop and report the exact figures rather than guessing

---

## Quote-Direct Trigger Path

The PM may sometimes give a quoting tool URL directly (e.g., `https://quotes.viewrail.com/quotes/quotesummary/81742`) instead of a HubSpot deal. When that happens:

1. Skip Steps 2-4 (HubSpot lookup and Quote Tools navigation)
2. Navigate the given URL directly
3. Treat the loaded quote as the active quote (the PM has already chosen it)
4. Continue from Step 5 onward
5. The reconciliation target becomes the System Total sum (post-discount, post-markup) since there's no HubSpot `quote_subtotal` cross-check

If the PM later asks for HubSpot integration (e.g., "post this as a deal note"), prompt them for the deal ID at that point.

---

## Notes for Future Skill Improvements

- Once the migration completes, the "Primary" marker fallback can be retired.
- If the team standardizes split shipping rules, the Step 9 question can become a default with override.
- Per-flight splits on multi-flight deals haven't been tested yet -- verify behavior on first such deal.
- Additional base rail assembly lengths beyond 4'6" (and their SKUs) should be added to the table as they come up.
- Markups beyond 4% haven't been tested; verify behavior if a deal carries 10%+ markup or per-component markups.
- Once AR email drafting is validated, consider whether the skill should also draft a Terminal-side note documenting the split so the audit trail lives in both Gmail and Terminal.

---

## Part B: Change Order Repush Workflow (DRAFT — refined 7/21/2026 pending live demo)

> **Status:** Second-pass draft incorporating Alex Stout's revisions after his 7/21/2026 video walkthrough. Refined workflow includes a push-mode routing decision, override-subtotal cleanup moved earlier, an explicit PM verification checkpoint before reconciliation, and a final report step. Awaiting live demo against a real change order.

Change orders are the other common reason PMs need to redistribute dollars across Terminal orders. Unlike a fresh split (which divides an untouched order), a change-order repush **replaces** the products on existing Terminal orders after a quote has been updated.

### When this branch applies

Trigger this branch when the PM says any of:

- "Push a change order into Terminal"
- "Repush the change order for {deal}"
- "Update Terminal with the new quote for {deal}"
- "The customer changed their quote -- push the new version to Terminal"
- "Change order came through -- fix Terminal"

Signals that a change order is in play:

- A change order ticket exists on the HubSpot deal
- The PM received an email notification from HubSpot naming the change order and its new quote
- The current Terminal Products tab does not match the currently-active quote (line items look wrong for the customer's latest selections)

### Assumed starting state

- The change-order ticket has already been created and processed on the HubSpot side
- A NEW active/primary quote exists on the deal reflecting the updated selections
- One or more Terminal orders already exist (e.g., `01` and `03` from a prior split)
- The PM's goal is to make Terminal's products match the new active quote, and reconcile sales

### Step 1: Confirm the change-order context

Before touching anything in Terminal:

1. Pull the HubSpot deal and confirm which quote is now Primary (per Step 3 of Part A)
2. Read the change-order ticket details (associated to the deal) -- summarize what changed for the PM
3. Read the PM's email notification if attached (contains the diff summary)
4. Confirm with the PM which existing Terminal orders should receive the updated products (e.g., "push everything to 01 except the spiral which goes to 03")

### Step 2: Verify accounting is balanced before making changes

Run the same pre-flight balance check from Part A Step 14b on every existing Terminal order the PM plans to modify:

- Accounting tab all sale statuses green
- Order Sales = Accounting Sales within $0.02

**If any order is not balanced, stop and flag** -- do not repush into an unbalanced order. Fixing balance first is the PM's manual step.

### Step 3: Delete existing products from each target order

For each existing Terminal order that will receive updated products:

1. Navigate to that order's Products tab
2. Click **Select Items** (same button used in Part A)
3. Select every product line item
4. Delete them

**Watch-outs (per Alex's video):**

- Some items are labeled "custom" or "don't delete" -- leave those alone
- Multi-function hand tools and similar utility items may or may not need to be preserved -- **confirm with PM before deleting anything flagged custom**
- Install line items also get deleted here (video shows deleting them explicitly)
- Materials line items also get deleted

**Result after Step 3:** each target order has zero products (except any custom/preserved items).

### Step 4: Clean up Override Subtotals (before pushing)

Per Alex's video: *"I'm going to get rid of the override subtotals -- sometimes that can mess with things."* This step now runs BEFORE the push (moved up from later in the workflow) so Terminal starts from a clean state when the new products land.

On each target order:

1. Products tab → check for any active Override Subtotal
2. Remove/clear any overrides that were carried over from before the repush
3. Let Terminal recalculate the subtotal from whatever products it currently contains (which after Step 3 is zero-ish)

**Why:** Override Subtotals from a prior state will still be sitting on the order after products are deleted. If we push new products with a stale override in place, Terminal will produce inaccurate accounting sales. Clearing first prevents that.

### Step 5: Determine push mode (routing decision)

Before pushing, the skill must choose between the two push modes available in the quoting tool. **The routing rule (per Alex's revisions):**

- **If the deal has already been split** (one or more `-02`, `-03`... orders exist beyond samples/remakes):
  - Use **"Individual line items and pricing"** mode
  - Push per-system/per-item selectively to the correct target order
  - **Known limitation:** the individual push tool does NOT currently push Install line items — install must be handled manually (see Step 8). Fix request outbound to Filip.
- **If the deal has not been split** (only the base order exists):
  - Use **"Line items and pricing"** mode (bulk push everything)
  - This mode correctly handles Install line items, so no manual install workaround needed

The skill should determine this automatically by checking Terminal for split sub-orders before opening the push UI. If ambiguous, ask the PM.

### Step 6: Push updated products from the quoting tool

From the currently-active quote in the quoting tool, execute the push using the mode chosen in Step 5.

**"Line items and pricing" (bulk push -- unsplit deals):**

1. In the quoting tool, select the target Terminal order (there's only one)
2. Click the push button that sends everything at once
3. Terminal populates all products including Install

**"Individual line items and pricing" (per-item push -- already-split deals):**

1. In the quoting tool, select the systems and/or items being pushed as one batch
2. Choose the target Terminal order number (`01`, `03`, etc.)
3. Confirm the push
4. Repeat for the next batch → next target order

**Splitting products across multiple target orders (per Alex's example):** everything except the spiral → target order 01; spiral system + install kit → target order 03.

The PM decides which systems/items go where. **If the change order adds a NEW system not previously on any split, ask the PM which target order should receive it.** Do not guess.

**If the change order removes a system entirely:** the delete step removed the old product line; no push replaces it; verify no orphan sale remains.

### Step 7: Verify the pushed products landed

For each target order: refresh the Products tab, confirm the expected line items appear, confirm pricing matches the quote. If items are missing or prices don't match, flag to the PM. Do NOT correct automatically.

### Step 8: Manually add anything that couldn't push

Only relevant on the **individual push mode** path:

- **Install line items** (known limitation — fix pending)
- **Measurement / scan services** if not part of the pushed selection
- **Preserved custom items** don't need re-adding (they weren't deleted)

For bulk push mode this is a no-op; if items are still missing, flag it and ask the PM.

### Step 9: PM verification checkpoint (before reconciliation)

Present a checkpoint before touching sales. Show: what was deleted, what was pushed (per order, with subtotals), what was manually added, current per-order Products subtotal, whether overrides were cleared. Ask the PM to eyeball each order and confirm. If "looks good" → Step 10. If wrong → stop and hand off.

### Step 10: Reconcile missing sales

After the PM confirms products, each order shows a "missing sales" state. For each target order: Accounting tab → **Add Sale** → enter the amount matching the current products total → Save.

**Where the amount comes from:** the value that makes Total Accounting Sales match BOTH the active quote's Subtotal AND the skill's per-split proposal. All three should agree; if not, stop and flag which pair doesn't reconcile.

**Result:** all target orders return to "All Sold" / green.

### Step 11: Final verification

- **Per-order:** each shows Order Sales = Accounting Sales (within $0.02), status green
- **Deal-level:** sum of Accounting Sales = new active quote's Subtotal (product + shipping + tax)
- **Cross-check:** skill's per-split proposal matches Terminal's post-repush state
- Run the double-discount regression check as a safety net.

### Step 12: Final Report

```
CHANGE ORDER REPUSHED — {deal_number} — {dealname}
Change-order source: {ticket ID or reference}
New active quote: {quote name}, subtotal ${quote_subtotal}

Orders modified:
  {order} — {name}: ${after}  (was ${before})
  ...

Products pushed:
  → {order}: {systems/items}
Manually added (individual push mode only):
  → {order}: {items} — reason: {install workaround / missing scan fee / etc.}

Override subtotals cleared: {list or "none present"}
Push mode used: {individual | bulk}
Reconciliation:
  ✓ Terminal Accounting Sales total = active quote Subtotal
  ✓ Each order individually balanced
  ✓ No double-discount regression detected
```

Save to `Active-Work/Analysis/YYYY-MM-DD_ChangeOrderRepush-{order}.pdf`.

### Step 13: (Out of scope) Invoice regeneration

Regenerating the invoice happens after the repush but is NOT part of this workflow. Left to the PM.

### Open gaps (Part B)

- ⏳ **Push button location in the quoting tool** — Alex to walk through the exact UI location during his next demo.
- ⏳ **Multiple change orders on the same deal** — handle each as an independent repush; cumulative drift not yet validated.

### Trigger phrases for this branch

"push change order" / "repush change order" / "push the change order to Terminal for {deal}" / "update Terminal with the new quote" / "the customer changed the quote, fix Terminal" / "change order came through" / "redo the Terminal products from the new quote".

### Comparison to Part A (fresh split)

| Aspect | Part A: Fresh Split | Part B: Change Order Repush |
|---|---|---|
| Starting state | One clean Terminal order | Existing orders with outdated products |
| Terminal action | Split Order, or ADD ITEM line-item breakout | Delete products → push updated products |
| New orders created | Yes (`-02`, `-03`, etc.) | No -- reuses existing order numbers |
| Sales reconciliation | Terminal handles it, unless a manual override is used | Manual Add Sale on each order |
| Override Subtotal | Used when forcing a specific allocation | Removed before push, then not needed |
| AR email needed | Only if a manual balance / deposit reallocation is needed | *[TODO: confirm whether AR needs to know about repushed change orders]* |

---

## Validated Test Cases

**Deal A (install + steel split):** install-only split $15,979.98 (HubSpot install_amount); steel-structure split $12,500.32 (Flight Metal × 0.85).

**Deal B (Hardware Only):** handrails-ship-ahead $5,474.52; remaining $18,614.37; reconciled to $24,088.89; tax = $0 (tax-exempt state).

**Quote C (Baserail Glass Railing System):** entered via quoting tool URL; first with system-level Markup (4%) + 15% Discount; combined factor 0.85 × 1.04 = 0.884; baserail+hardware (Hardware line only) $1,447.84 × 0.884 = $1,279.89; reconciled to System Total $3,200.58.

**Deal D (Glass Railing):** 5 quotes (active was 5th); 3-way split with cross-system aggregation, system-name-as-filter, and "rest of" phrases; reconciled to $42,999.40; first non-zero tax (8.4419%).

**Deal E:** first Format C (migrated Viewrail Quotes, Quote Status: Primary); 2-way whole-system split; reconciled to $30,844.40 post-discount / $34,271.55 product subtotal; established the Terminal-entry vs post-discount-verification distinction.

**Deal F — first end-to-end Terminal execution:** Steel First split (Structure line → new -03, Materials); surfaced the (now-patched) Split-Order double-discount bug; validated the plan-preview + one-confirmation-gate pattern and manual Override Subtotal correction.

**Deal G — 7/24/2026:**
- Primary quote (Format C, reached via Versions → View Quote); all-in $84,523.64; one Flight system (4.96% markup on the flight, 0% discount) + interior/exterior rod railing + items; exterior railing carried the only discount (6.5% / $1,849.99).
- Steel-first split: PM defined steel = Flight Metal + Flight Feature + full flight markup = **$18,676.67**; everything else = **$54,881.45**; reconciled to product total $73,558.12.
- Terminal stored the flight as two discrete lines ("Structure" $16,795.49 and "Wood" $14,673.02) — checking the **Structure** line was a clean Split Order (→ new -02).
- **Confirmed the Override Subtotal discount-rescaling behavior:** overriding the base order to $56,731.96 produced Items $54,940.84 (discount re-scaled as a % of the entered value), not the intended $54,881.45. Corrected by solving pre-discount = post_target / (1 − blended%): override $56,670.63 → Items $54,881.45 exactly.
- Two offsetting overrides kept the deal total constant; left a symmetric $2,044.85 sale-transaction imbalance + a paid 50% deposit to reallocate — both handed to AR via a brief draft email.
- **Lessons baked into 1.2.0:** confirm the split-to-order mapping up front (PM wanted steel on the *original*, not the new split); Override is pre-discount and re-scales the discount; hand sale-transaction reconciliation + deposit reallocation to AR.

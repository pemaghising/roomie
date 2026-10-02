# Roomie Milestone 2: Pantry design

**Status:** approved in conversation on 2026-10-03; this written spec is awaiting review.
**Builds on:** `2026-10-01-roomie-app-design.md` (M1: household, chores, nudges, profile). Every M1 rule still holds. This spec only adds to it.
**Sources:** hi-fi screens 13–21 (`roomie-experience/assets/screens`) and the case study.

## 1. Purpose

Roommates fight over groceries because of **unspoken rules**: who owns this, can I use it, who buys the next one. The pantry makes those rules visible, and it turns "we're out of X" into a chore anyone can pick up. As the case study puts it, "a restock request becomes a claimable chore, so groceries plug into the chore system instead of building a second one."

**Success:** nobody has to ask in the group chat "who finished the milk?", "can I use your oat milk?" or "can someone buy paper towels?".

**Out of scope for M2:**
- quantities and expiry dates (the faded background items in screens 16–17 show these; they are not built);
- a combined shopping list;
- barcode or receipt scanning;
- anything to do with money;
- per-item photos.

## 2. Concepts

| Concept | Meaning |
|---|---|
| **Item** | A thing in the household's pantry. It is either **shared** (owner is null) or **personal** (it has an owner). |
| **Sharing rule** | Personal items only: **Ask first** or **Do not touch**. Shared items are usable by anyone by definition. |
| **Stock** | Every item is `in_stock`, `low` or `out`. There are no counts. |
| **Restock request** | A one-off task saying "someone please buy X", with an effort level of Light 1, Medium 2 or Heavy 3. It lives in the Chores **up-for-grabs pool** alongside missed chores. It is only for shared items, or free text from the FAB menu. |
| **Ask** | A request to use a roommate's *Ask first* item. The owner answers *Sure* or *Not this time*. |

## 3. Screens & flows (mobile, matching the hi-fi)

**Tab bar.** It becomes Home · Chores · **Pantry** · Profile, as in the hi-fi. It keeps the existing sliding-pill tab bar and the shared motion and press system.

**Pantry screen (13 / 15).**
- Serif title "Pantry", with the underline tabs **Shared · My Items · Roommates**. The underline slides between tabs; this is a new underline variant of the segmented control.
- Items appear as rows: an icon tile, the name, and an optional right-hand tag:
  - Shared tab: the stock tag, *Running low* (butter) or *Out* (peach). Nothing is shown when the item is in stock.
  - My Items tab: the rule tag, *Ask first* (peach) or *Do not touch* (pink).
  - Roommates tab: name chips for each roommate (screen 15). Each item shows its rule tag.
- Shared items with an open restock request show a small "Requested · Priya's on it" or "Requested" subline.
- Sort order:
  - Shared tab: out first, then low, then in stock; alphabetical within each group.
  - Other tabs: alphabetical.
- **FAB menu (20).** The "+" opens two pills, **Add to Pantry** and **Request Restock**. The FAB rotates to "×", and the pills spring up staggered.

**Item actions.** Tapping a row opens a bottom sheet titled with the item name. The available actions depend on the tab:

| Tab | Actions |
|---|---|
| Shared item | Mark: In stock · Running low · Out (segmented); **Request restock**, or "Requested" if one is already open; Remove item |
| My Items | Mark stock; change rule (Ask first / Do not touch); Remove |
| Roommate's item, Ask first | **Ask {name}**; disabled with "Asked · waiting" while an ask is pending |
| Roommate's item, Do not touch | Label only: "This is {name}'s. Do not touch." No actions. |

**Add to Pantry (16 / 17 / 21).**
- A bottom sheet with a Shared/Personal segmented control and a name field. The placeholder is "e.g., Paper Towels" for Shared and "e.g., Almond Milk" for Personal.
- When Personal is selected, it also shows **Sharing rule**: Do not touch / Ask first. The default is Ask first.
- The primary button reads "Add to Shared List" or "Add to My Shelf".
- New items start `in_stock`.
- If a matching item already exists, the duplicate name (case-insensitive) is rejected with the message "Already in the pantry". A match means the same name in the shared list, or on the same owner's shelf.

**Request Restock (14 / 18).**
- A bottom sheet.
- From an item, the description reads "We're out of {item}. Send this to the Chores pool so a roommate can pick it up."
- From the FAB, there is a free-text name field with the description "This will create a task in the Chores pool for a roommate to pick up."
- **Effort level:** Light / Medium / Heavy. The default is Light.
- The button reads "Send to Chores Pool".
- Sending marks the item `out`, unless it was already `low` or `out`.
- If the free text matches a shared item, the request links to it. Otherwise the request stands alone, with no item.

**Request Sent (19).** A full-screen confirmation: a mint circle with a cart icon that springs in. The copy reads "{item} has been added to the Chores pool. A roommate will pick it up soon." The pill says "Added to Shared Tasks", and the button reads **Back to Pantry**.

**Chores tab: up-for-grabs pool.** Open restock requests appear in the existing "Missed by roommates" section, which is renamed **"Up for grabs"**. Each request shows a cart icon tile, "Buy {item}", its effort chip and "Requested by Priya".
- **Claim** reserves the request for you; you can unclaim it.
- **Done** completes it. It can be done without claiming first.
- The requester can **Cancel**. Anyone can cancel it by marking the item In stock.

**Empty states.**
- Shared tab with nothing in it: the Sprout, the line "Nothing on the shelf yet", and **Add the basics**. This shows six one-tap chips: Olive oil, Rice, Salt, Milk, Bread, Paper towels. Tapping a chip adds it as a shared, in-stock item, and the chip animates into the list.
- My Items: "Your shelf is empty. Add things that are yours."
- Roommates: "No one has a personal shelf yet."

**Icons.** A small local dictionary maps names to emoji (milk → 🥛, rice → 🍚, eggs → 🥚, …, at least 40 entries). It is case- and plural-insensitive. Unknown items get 🛒. The tile tint is derived from the icon, using the existing pastel set.

## 4. Behaviour rules

1. **Completing a restock** sets the linked item to `in_stock`, logs the activity "{name} restocked {item}", and notifies the requester ("{name} picked up {item}"). The completer gets the effort toward **this week's fair-share totals**, in the "Why me?" weekly points and plan review. **No effort debt is created** for anyone, because nobody missed anything.
2. **One open request per item.** A second request on an item that already has one is refused with the error "already_requested". The UI shows "Requested" instead.
3. **Marking an item In stock** closes any open request on it as cancelled. A claimer who has already claimed it gets notified ("{item} was restocked").
4. **Open requests never expire.** They don't break the household streak, because the pool is optional help. One that has been open longer than 48 h is mentioned once in the morning digest: "Still needed: Paper towels."
5. **Asks** are only valid on another member's Ask-first item, with one pending ask per (item, asker). The owner answers yes or no, and the asker is notified. A pending ask disappears after 24 h with no notification. Asks are logged to the owner's and asker's activity only; there is no household-wide feed entry.
6. **Removing items.** A shared item can be removed by anyone; a personal item only by its owner. Removal archives the item. An open request on it is cancelled.
7. **Leaving the household** archives the leaving member's personal items.
8. **Privacy.**
   - Items and their rules are visible to the whole household; that is the point of the Roommates tab.
   - Asks are visible only to the two people involved.
   - Pantry activity never mentions effort balances.
   - No ranking of any kind.

## 5. Data model (Postgres, RLS on everything, writes only through security-definer RPCs, as in M1)

```
pantry_items
  id uuid pk, household_id → households, owner_id → profiles (null = shared),
  name text 1–40, icon text, rule pantry_rule ('ask_first','do_not_touch') null (null iff shared),
  stock stock_level ('in_stock','low','out') default 'in_stock',
  archived_at timestamptz, created_by → profiles, created_at, updated_at
  unique (household_id, coalesce(owner_id, '00000000-…'), lower(name)) where archived_at is null
  check ((owner_id is null) = (rule is null))

restock_requests
  id uuid pk, household_id, item_id → pantry_items null, name text 1–40 (snapshot), effort 1–3,
  requested_by → profiles, claimed_by → profiles null,
  status restock_status ('open','done','cancelled'), done_by → profiles null, done_at, created_at
  unique (item_id) where status = 'open' and item_id is not null

pantry_asks
  id uuid pk, household_id, item_id → pantry_items, from_user, to_user (= item owner),
  status ask_status ('pending','yes','no'), created_at, answered_at
  unique (item_id, from_user) where status = 'pending'
```

**RLS.**
- Members can read items and requests in their own household.
- Asks are readable only when `auth.uid()` is in (from_user, to_user).
- No client table writes. M1's default-privilege revokes apply to these tables automatically; re-assert them.

**RPCs** (security definer, `search_path public, private, pg_temp`). Each one scopes to `private.my_household()` and raises the M1 error codes, plus `already_requested` and `duplicate_item`:
- `add_pantry_item(p_name, p_owner_personal boolean, p_rule pantry_rule default null) → uuid`
- `add_pantry_basics(p_names text[]) → void`
- `set_item_stock(p_id, p_stock) → void`
- `set_item_rule(p_id, p_rule) → void`
- `remove_pantry_item(p_id) → void`
- `request_restock(p_item uuid default null, p_name text default null, p_effort smallint) → uuid`
- `claim_restock(p_id) → void`, `unclaim_restock(p_id) → void`
- `complete_restock(p_id) → void`
- `cancel_restock(p_id) → void`
- `ask_to_use(p_item) → uuid`
- `answer_ask(p_ask, p_yes boolean) → void`

**`get_state()`** gains three fields:
- `pantry`: active items;
- `restocks`: open requests, plus requests completed this week, for the totals;
- `asks`: only the caller's own pending asks, in either direction.

`weekTotals` adds the effort of restocks completed this week to the person who completed them.

**Notifications.** New kinds:
- `restock`: to all other active members. It is batched by the existing drain and exempt from the 3-a-day cap, like `pool`.
- `restock_done`: to the requester.
- `ask`: to the owner.
- `ask_answer`: to the asker.

All kinds have motivate and facts copy in `copy.ts`. Deep links: `/chores` for restock, `/pantry?tab=roommates` for asks.

**Realtime.** Subscribe to `pantry_items` and `restock_requests` for the household. Do not subscribe to `pantry_asks`; it is fetched via `get_state` on refetch.

## 6. Architecture

- **Domain** (`supabase/functions/_shared/domain/pantry.ts`), pure functions:
  - `iconFor(name)`
  - `sortShelf(items, tab)`
  - `canAsk(item, me, asks)`
  - `restockTotals(restocks, weekStart)`
  - the stock and rule copy helpers
- **App:**
  - `src/features/pantry/`: Pantry screen, ItemSheet, AddItemSheet, RestockSheet, RequestSent, FabMenu, pantry.css
  - selectors in `src/lib/selectors.ts`
  - RPC names added to `ACTION_RPCS` so offline replay covers them
  - the Chores pool section extended for restock rows
- **Tick:**
  - the digest includes stale-request lines;
  - the drain handles the new kinds;
  - no new cron work.
- **Motion and visuals:**
  - reuse `SPRING`, `press.ts`, `haptic()`, `layout` on rows (moving between stock groups), the sheet, and the celebration pattern for Request Sent;
  - keep everything compositor-only, per the frame-rate fixes;
  - colours for rule and stock tags come from the existing effort-chip palette tokens (pink `#fee2e2`/`#991b1b`, peach and butter as already defined);
  - no new dependencies;
  - Pantry is a lazy route chunk, so the entry bundle must not grow.

## 7. Testing

- **Domain:** unit tests for the icon dictionary, sorting, `canAsk` and totals.
- **DB** (`tests/db/pantry.test.ts`, live dev project, with cleanup):
  - RLS: no cross-household reads; asks are visible only to the two people involved; no direct writes.
  - Each RPC's happy path and refusals: duplicate item, already requested, asking on Do not touch or on your own item, answering someone else's ask, a non-owner removing a personal item.
  - Completing a restock sets the item in stock, notifies the requester, and creates no ledger change.
- **UI** (Vitest + Testing Library): tab switching, the add sheet's rule visibility, the restock flow through to Request Sent, the ask button states, and the pool rows in Chores.
- **e2e:** an extension of the two-roommate test. Priya marks Paper Towels Out and requests a restock; Aarav sees it in Chores and completes it; Priya sees it In stock.
- **Width sweep** (20 widths) and Lighthouse mobile at 90 or above. Accessibility stays at 100.

## 8. Rollout

- New migrations go on dev, then prod.
- Redeploy tick.
- The Pantry tab appears for existing households with an empty pantry, which shows the "Add the basics" empty state.
- No data migration is needed.

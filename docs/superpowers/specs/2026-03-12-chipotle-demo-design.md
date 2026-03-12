# Chipotle Operations Genie Demo - Design Spec

## Overview

Create a Chipotle-branded demo of the E2E Genie App, deployed as a separate Databricks Asset Bundle. The demo includes sample restaurant sales & operations data tables, a Genie space for natural language querying, and a rebranded frontend — all on a git worktree branch (`chipotle`) based off current HEAD (`main`) to keep the Panda P&L Genie codebase untouched.

**Workspace**: DEFAULT profile
**Catalog**: `jdub_demo`
**Schema**: `chipotle`

## Data Model

### `jdub_demo.chipotle.dim_store` (~25 rows)

| Column | Type | Description |
|--------|------|-------------|
| store_id | STRING | PK, e.g. "STORE-001" |
| store_name | STRING | e.g. "Chipotle Downtown Austin" |
| city | STRING | US cities |
| state | STRING | US state abbreviation |
| region | STRING | West, Southeast, Northeast, Midwest |
| format | STRING | Standard, Chipotlane (drive-thru), Digital Kitchen |
| open_date | DATE | When the store opened |

### `jdub_demo.chipotle.dim_date` (~365 rows)

Standard date spine covering 2025-06-01 through 2026-05-31.

| Column | Type | Description |
|--------|------|-------------|
| date | DATE | PK |
| day_of_week | STRING | Monday-Sunday |
| month | STRING | January-December |
| quarter | STRING | Q1-Q4 |
| year | INT | 2025 or 2026 |
| is_weekend | BOOLEAN | Saturday or Sunday |

### `jdub_demo.chipotle.dim_menu_item` (~15 rows)

| Column | Type | Description |
|--------|------|-------------|
| item_id | STRING | PK, e.g. "MENU-001" |
| item_name | STRING | e.g. "Chicken Burrito" |
| category | STRING | Burritos, Bowls, Tacos, Sides, Drinks |
| base_price | DECIMAL(10,2) | Standard menu price |

### `jdub_demo.chipotle.fact_transactions` (~800-1000 rows)

One row per line item (each transaction_id is unique — a multi-item order generates multiple rows with distinct IDs).

| Column | Type | Description |
|--------|------|-------------|
| transaction_id | STRING | PK — unique per line item, e.g. "TXN-000001" |
| store_id | STRING | FK to dim_store |
| transaction_date | DATE | FK to dim_date |
| item_id | STRING | FK to dim_menu_item |
| quantity | INT | Items in this line |
| unit_price | DECIMAL(10,2) | Price charged (varies slightly from base) |
| line_total | DECIMAL(10,2) | quantity * unit_price |
| order_channel | STRING | in-store, app, web, third-party-delivery |
| order_type | STRING | dine-in, takeout, delivery |
| is_catering | BOOLEAN | Catering order flag |

**Data generation**: SQL statements executed via Databricks SDK (`execute_sql` tool). Each SQL statement must be a separate `execute_sql` call (no multi-statement batches). Prices vary realistically by category. Seasonal and day-of-week patterns included. `rand()` thresholds should be calibrated ~10x higher than naive estimates to hit target row counts. Use `date_sub()` instead of `INTERVAL (expression) DAY` for dynamic date arithmetic.

## Genie Space

- **Name**: "Chipotle Operations Analytics"
- **Tables**: All four tables above
- **Instructions**: Guide toward restaurant KPIs — revenue per store, average ticket size, menu mix percentage, digital vs in-store order share, catering revenue, day-of-week trends
- **Sample questions**:
  - "What are our top 5 stores by revenue this quarter?"
  - "Show me average ticket size by order channel"
  - "Which menu categories drive the most revenue?"
  - "How do digital orders compare to in-store over time?"

Created via Databricks SDK (`create_or_update_genie` tool) on the DEFAULT profile workspace. The resulting Genie space ID is captured and used in `databricks.yml` as the `genie_space_id` variable.

## Branding

### Color Palette — Light Mode

Derived from the Chipotle logo SVG: Red `#A81612` → hsl(1, 80%, 37%), Brown `#451400` → hsl(18, 100%, 14%).

| Token | Current (Panda) | New (Chipotle) |
|-------|-----------------|----------------|
| --primary | hsl(358 68% 49%) | hsl(1 80% 37%) |
| --primary-foreground | hsl(0 0% 100%) | hsl(0 0% 100%) |
| --accent | hsl(358 68% 95%) | hsl(1 40% 95%) |
| --accent-foreground | hsl(358 68% 30%) | hsl(1 80% 25%) |
| --ring | hsl(358 68% 49%) | hsl(1 80% 37%) |
| --chart-1 | hsl(358 68% 49%) | hsl(1 80% 37%) |
| --chart-5 | hsl(358 60% 65%) | hsl(18 60% 40%) |

### Color Palette — Dark Mode

| Token | Current (Panda) | New (Chipotle) |
|-------|-----------------|----------------|
| --primary | hsl(358 68% 49%) | hsl(1 80% 45%) |
| --primary-foreground | hsl(0 0% 100%) | hsl(0 0% 100%) |
| --accent | hsl(358 68% 15%) | hsl(1 50% 15%) |
| --accent-foreground | hsl(358 68% 70%) | hsl(1 60% 70%) |
| --ring | hsl(358 68% 49%) | hsl(1 80% 45%) |
| --chart-1 | hsl(358 68% 49%) | hsl(1 80% 45%) |
| --chart-5 | hsl(340 75% 55%) | hsl(18 70% 45%) |

All other tokens (background, foreground, card, muted, sidebar, etc.) remain unchanged. Dark mode `--primary` is used on user message bubbles via `is-user:dark` variant even in light mode — both blocks must be updated.

### Logo

Use the provided `logos/chipotle-mexican-grill.svg` — copy to `client/public/chipotle-logo.svg`. All references to `Panda_Express_logo.svg` updated to point to the new file.

**Logo references** (confirmed from codebase):
- `client/src/components/greeting.tsx` line 35: `src="/Panda_Express_logo.svg"`, alt text "Panda Express Logo"
- `client/src/components/app-sidebar.tsx` line 42: `src="/Panda_Express_logo.svg"`, alt text "Panda Express"

### Favicon

Update `client/index.html` line 5: change `<link rel="icon" type="image/x-icon" href="/favicon.ico" />` to `<link rel="icon" type="image/svg+xml" href="/chipotle-logo.svg" />`. This uses the SVG logo directly as the favicon.

### Sidebar App Name

In `client/src/components/app-sidebar.tsx` line 47, change `Panda P&amp;L Genie` to `Chipotle Ops Genie`.

### Greeting Text

Replace the current greeting in `client/src/components/greeting.tsx`:
- Heading: "Hello there!" -> "Welcome to Chipotle Operations Analytics"
- Subheading: "How can I help you today?" -> "Ask questions about sales, menu performance, and store operations"
- Logo: swap `Panda_Express_logo.svg` -> `chipotle-logo.svg`, alt text -> "Chipotle Logo"

### Suggested Actions

Replace the 2 existing starter questions in `client/src/components/suggested-actions.tsx` with 4 new ones:
1. "What are our top 5 stores by revenue this quarter?"
2. "Show me average ticket size by order channel"
3. "Which menu categories drive the most revenue?"
4. "How do digital orders compare to in-store over time?"

### App Title

`client/index.html` title -> "Chipotle Operations Genie"

## Files Modified (in worktree)

| # | File | Change |
|---|------|--------|
| 1 | `client/public/chipotle-logo.svg` | **New file** — copy from `logos/chipotle-mexican-grill.svg` |
| 2 | `client/index.html` | Title -> "Chipotle Operations Genie", favicon -> chipotle-logo.svg |
| 3 | `client/src/index.css` | Primary color variables -> Chipotle red (light + dark mode) |
| 4 | `client/src/components/app-sidebar.tsx` | Logo ref + app name text |
| 5 | `client/src/components/greeting.tsx` | Heading, subheading, logo path + alt text |
| 6 | `client/src/components/suggested-actions.tsx` | 4 new starter questions |
| 7 | `databricks.yml` | All variable defaults updated (see below) |

## Deployment (databricks.yml)

The existing `databricks.yml` structure is preserved. Only the variable defaults change:

| Variable | Current | New |
|----------|---------|-----|
| Bundle name | genie-e2e-app | genie-chipotle-app |
| `serving_endpoint_name` | `mas-cfcbc058-endpoint` | Keep as-is (user provides new MAS endpoint after Genie space creation) |
| `genie_space_id` | `01f0aae3f2a812ceb9f489fa0317532a` | New Chipotle Genie space ID (set after creation) |
| `database_instance_name` | `lakebase-e2e` | `lakebase-chipotle` |
| `resource_name_suffix` | `lce` | `chipotle` |
| App name | `genie-e2e-app-{suffix}` | `genie-chipotle-app-{suffix}` |
| App description | "Agentic Chat application for Genie Space" | "Chipotle Operations Analytics - Genie Space Demo" |
| Genie resource name | `genie-space-e2e` | `genie-space-chipotle` |

Auth remains OBO via `app.yaml` (unchanged).

## Execution Order

1. **Generate sample data** (independent) — SQL via Databricks SDK creates schema + 4 tables in `jdub_demo.chipotle`
2. **Create Genie space** (depends on 1) — points at the four tables, capture space ID
3. **Create git worktree** (independent of 1-2) — branch `chipotle` from current HEAD of `main`
4. **Rebrand app** (depends on 3) — modify ~7 files listed above
5. **Update databricks.yml with Genie space ID + MAS endpoint** (depends on 2, 3) — set captured IDs
6. **Build frontend** (depends on 4, 5) — `npm run build` in worktree (required per CLAUDE.md before deploy)
7. **Deploy** (depends on 6) — `databricks bundle deploy` + `databricks bundle run` from worktree

Steps 1 and 3 can run in parallel. Step 2 follows 1. Steps 4-5 follow 2+3. Step 6 follows 4+5. Step 7 follows 6.

## Out of Scope

- Multi-modal inputs
- Custom backend logic changes
- New API endpoints
- Database schema changes (uses existing `ai_chatbot` schema for chat history)
- Modifying the Panda P&L Genie codebase in any way

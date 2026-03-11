# Wyndham Hotels Genie Demo - Design Spec

## Overview

Create a Wyndham Hotels-branded demo of the E2E Genie App, deployed as a separate Databricks Asset Bundle. The demo includes sample hospitality data tables, a Genie space for natural language querying, and a rebranded frontend — all on a git worktree branch (`wyndham`) based off current HEAD (`remove-nextjs`) to keep the Panda P&L Genie codebase untouched.

**Workspace**: DEFAULT profile
**Catalog**: `jdub_demo`
**Schema**: `wyndham`

## Data Model

### `jdub_demo.wyndham.dim_property` (~25 rows)

| Column | Type | Description |
|--------|------|-------------|
| property_id | STRING | PK, e.g. "PROP-001" |
| property_name | STRING | e.g. "Days Inn Orlando Airport" |
| brand | STRING | Days Inn, Ramada, La Quinta, Wingate, Wyndham Grand |
| city | STRING | US cities |
| state | STRING | US state abbreviation |
| region | STRING | Southeast, Northeast, West, Midwest |
| room_count | INT | Total rooms at property (50-500 range) |

### `jdub_demo.wyndham.dim_date` (~365 rows)

Standard date spine covering 2025-06-01 through 2026-05-31.

| Column | Type | Description |
|--------|------|-------------|
| date | DATE | PK |
| day_of_week | STRING | Monday-Sunday |
| month | STRING | January-December |
| quarter | STRING | Q1-Q4 |
| year | INT | 2025 or 2026 |
| is_weekend | BOOLEAN | Saturday or Sunday |

### `jdub_demo.wyndham.fact_bookings` (~800 rows)

One row per booking.

| Column | Type | Description |
|--------|------|-------------|
| booking_id | STRING | PK, e.g. "BK-000001" |
| property_id | STRING | FK to dim_property |
| check_in_date | DATE | FK to dim_date |
| check_out_date | DATE | |
| nights | INT | Derived: check_out - check_in |
| room_rate | DECIMAL(10,2) | Nightly rate ($60-$350 depending on brand) |
| total_revenue | DECIMAL(10,2) | rate x nights |
| booking_channel | STRING | web, mobile, OTA, phone, walk-in |
| guest_type | STRING | loyalty_member, corporate, leisure |
| booking_status | STRING | confirmed, cancelled, completed |
| created_at | TIMESTAMP | When booking was made |

**Data generation**: SQL statements executed via Databricks SDK (`execute_sql` tool). Rates vary realistically by brand (Wyndham Grand $200-350, Days Inn $60-120). Seasonal patterns (summer/holidays higher occupancy). ~15% cancellation rate. The SQL is run ad-hoc and not committed to the repo.

## Genie Space

- **Name**: "Wyndham Hotels Analytics"
- **Tables**: All three tables above
- **Instructions**: Guide toward hospitality KPIs — occupancy rate (bookings vs available room-nights), ADR (average daily rate), RevPAR (revenue per available room), booking trends by brand/region/channel, cancellation analysis
- **Sample questions**:
  - "What's the average daily rate by brand?"
  - "Show occupancy trends by region over the last quarter"
  - "Which properties have the highest cancellation rate?"
  - "Compare revenue by booking channel"

Created via Databricks SDK (`create_or_update_genie` tool) on the DEFAULT profile workspace. The resulting Genie space ID is captured and used in `databricks.yml` as the `genie_space_id` variable.

## Branding

### Color Palette - Light Mode

| Token | Current (Panda) | New (Wyndham) |
|-------|-----------------|---------------|
| --primary | hsl(358 68% 49%) | hsl(210 70% 35%) |
| --primary-foreground | hsl(0 0% 100%) | hsl(0 0% 100%) |
| --accent | hsl(358 68% 95%) | hsl(210 30% 95%) |
| --accent-foreground | hsl(358 68% 30%) | hsl(210 70% 25%) |
| --ring | hsl(358 68% 49%) | hsl(210 70% 35%) |
| --chart-1 | hsl(358 68% 49%) | hsl(210 70% 35%) |
| --chart-5 | hsl(358 60% 65%) | hsl(210 50% 60%) |

### Color Palette - Dark Mode

| Token | Current (Panda) | New (Wyndham) |
|-------|-----------------|---------------|
| --primary | hsl(358 68% 49%) | hsl(210 70% 50%) |
| --primary-foreground | hsl(0 0% 100%) | hsl(0 0% 100%) |
| --accent | hsl(358 68% 15%) | hsl(210 40% 15%) |
| --accent-foreground | hsl(358 68% 70%) | hsl(210 60% 70%) |
| --ring | hsl(358 68% 49%) | hsl(210 70% 50%) |
| --chart-1 | hsl(358 68% 49%) | hsl(210 70% 50%) |
| --chart-5 | hsl(340 75% 55%) | hsl(210 50% 55%) |

All other tokens (background, foreground, card, muted, sidebar, etc.) remain unchanged.

### Logo

Create a simple Wyndham-branded SVG text logo (stylized "W" or "Wyndham Hotels" wordmark in the primary blue). Saved as `client/public/wyndham_logo.svg`. All references to `Panda_Express_logo.svg` updated to point to the new file.

**Logo references** (confirmed from codebase):
- `client/src/components/greeting.tsx` line 35: `src="/Panda_Express_logo.svg"`, alt text "Panda Express Logo"
- `client/src/components/app-sidebar.tsx` line 42: `src="/Panda_Express_logo.svg"`, alt text "Panda Express"

### Sidebar App Name

In `client/src/components/app-sidebar.tsx` line 47, change `Panda P&amp;L Genie` → `Wyndham Hotels Genie`.

### Greeting Text

Replace the current greeting in `client/src/components/greeting.tsx`:
- Line 1 (heading): "Hello there!" → "Welcome to Wyndham Hotels Analytics"
- Line 2 (subheading): "How can I help you today?" → "Ask questions about bookings, revenue, and property performance"
- Logo: swap `Panda_Express_logo.svg` → `wyndham_logo.svg`, alt text → "Wyndham Hotels Logo"

### Suggested Actions

Replace the 2 existing starter questions in `client/src/components/suggested-actions.tsx` (lines 18-21) with 4 new ones. The grid CSS (`sm:grid-cols-2`) already supports this layout:
1. "What's the average daily rate by brand?"
2. "Show me occupancy trends by region"
3. "Which booking channel drives the most revenue?"
4. "What's our cancellation rate by property?"

### App Title

`client/index.html` title → "Wyndham Hotels Genie"

## Files Modified (in worktree)

| # | File | Change |
|---|------|--------|
| 1 | `client/public/wyndham_logo.svg` | **New file** - Wyndham logo SVG |
| 2 | `client/index.html` | Title → "Wyndham Hotels Genie" |
| 3 | `client/src/index.css` | Primary color variables → Wyndham blue (light + dark mode) |
| 4 | `client/src/components/app-sidebar.tsx` | Logo ref + app name text |
| 5 | `client/src/components/greeting.tsx` | Heading, subheading, logo path + alt text |
| 6 | `client/src/components/suggested-actions.tsx` | 4 new starter questions |
| 7 | `databricks.yml` | All variable defaults updated (see below) |

## Deployment (databricks.yml)

The existing `databricks.yml` structure is preserved. Only the variable defaults change:

| Variable | Current | New |
|----------|---------|-----|
| `serving_endpoint_name` | `mas-cfcbc058-endpoint` | Keep as-is (app still binds a serving endpoint resource, can be updated later) |
| `genie_space_id` | `01f0aae3f2a812ceb9f489fa0317532a` | New Wyndham Genie space ID (set after creation) |
| `database_instance_name` | `lakebase-e2e` | `lakebase-wyndham` |
| `resource_name_suffix` | `lce` | `wyndham` |
| Bundle name | `genie-e2e-app` | `genie-wyndham-app` |
| App name | `genie-e2e-app-{suffix}` | `genie-wyndham-app-{suffix}` |
| App description | "Agentic Chat application for Genie Space" | "Wyndham Hotels Analytics - Genie Space Demo" |
| Genie resource name | `genie-space-e2e` | `genie-space-wyndham` |

Auth remains OBO via `app.yaml` (unchanged).

## Execution Order

1. **Generate sample data** (independent) — SQL via Databricks SDK creates schema + 3 tables in `jdub_demo.wyndham`
2. **Create Genie space** (depends on 1) — points at the three tables, capture space ID
3. **Create git worktree** (independent of 1-2) — branch `wyndham` from current HEAD of `remove-nextjs`
4. **Rebrand app** (depends on 3) — modify ~7 files listed above
5. **Build frontend** (depends on 4) — `npm run build` in worktree (required per CLAUDE.md before deploy)
6. **Update databricks.yml with Genie space ID** (depends on 2, 3) — set the captured ID
7. **Deploy** (depends on 5, 6) — `databricks bundle deploy` + `databricks bundle run` from worktree

Steps 1 and 3 can run in parallel. Step 2 follows 1. Steps 4-6 follow 2+3. Step 7 follows 5+6.

## Out of Scope

- Multi-modal inputs
- Custom backend logic changes
- New API endpoints
- Database schema changes (uses existing `ai_chatbot` schema for chat history)
- Modifying the Panda P&L Genie codebase in any way

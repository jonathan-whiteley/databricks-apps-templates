# Wyndham Hotels Genie Demo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a Wyndham Hotels-branded Genie demo app with sample hospitality data on a separate git worktree branch.

**Architecture:** Two parallel workstreams — (A) data + Genie space on Databricks, (B) git worktree + branding changes. They converge when the Genie space ID and user-provided MAS endpoint ID are plugged into `databricks.yml`, then build and deploy.

**Tech Stack:** Databricks SQL, Databricks Genie Spaces, React/TypeScript/Tailwind, Databricks Asset Bundles

**Spec:** `docs/superpowers/specs/2026-03-11-wyndham-demo-design.md`

---

## Chunk 1: Data Generation (Databricks)

### Task 1: Create schema

**Files:** None (ad-hoc SQL on Databricks)

- [ ] **Step 1: Create the wyndham schema in jdub_demo catalog**

```sql
CREATE SCHEMA IF NOT EXISTS jdub_demo.wyndham;
```

Run via `execute_sql` tool on DEFAULT profile.

- [ ] **Step 2: Verify schema exists**

```sql
SHOW SCHEMAS IN jdub_demo LIKE 'wyndham';
```

Expected: one row returned.

---

### Task 2: Create dim_property table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create and populate dim_property**

```sql
CREATE OR REPLACE TABLE jdub_demo.wyndham.dim_property (
  property_id STRING,
  property_name STRING,
  brand STRING,
  city STRING,
  state STRING,
  region STRING,
  room_count INT
);

INSERT INTO jdub_demo.wyndham.dim_property VALUES
  ('PROP-001', 'Wyndham Grand Orlando Resort', 'Wyndham Grand', 'Orlando', 'FL', 'Southeast', 450),
  ('PROP-002', 'La Quinta Inn & Suites Dallas', 'La Quinta', 'Dallas', 'TX', 'West', 180),
  ('PROP-003', 'Days Inn by Wyndham Miami Airport', 'Days Inn', 'Miami', 'FL', 'Southeast', 120),
  ('PROP-004', 'Ramada by Wyndham Nashville Downtown', 'Ramada', 'Nashville', 'TN', 'Southeast', 200),
  ('PROP-005', 'Wingate by Wyndham Atlanta Buckhead', 'Wingate', 'Atlanta', 'GA', 'Southeast', 150),
  ('PROP-006', 'Wyndham Grand Chicago Riverfront', 'Wyndham Grand', 'Chicago', 'IL', 'Midwest', 380),
  ('PROP-007', 'La Quinta Inn & Suites Phoenix West', 'La Quinta', 'Phoenix', 'AZ', 'West', 160),
  ('PROP-008', 'Days Inn by Wyndham New York City', 'Days Inn', 'New York', 'NY', 'Northeast', 100),
  ('PROP-009', 'Ramada by Wyndham Seattle Downtown', 'Ramada', 'Seattle', 'WA', 'West', 175),
  ('PROP-010', 'Wingate by Wyndham Boston Logan', 'Wingate', 'Boston', 'MA', 'Northeast', 130),
  ('PROP-011', 'Wyndham Grand Denver Downtown', 'Wyndham Grand', 'Denver', 'CO', 'West', 320),
  ('PROP-012', 'La Quinta Inn & Suites Houston Galleria', 'La Quinta', 'Houston', 'TX', 'West', 190),
  ('PROP-013', 'Days Inn by Wyndham Los Angeles LAX', 'Days Inn', 'Los Angeles', 'CA', 'West', 110),
  ('PROP-014', 'Ramada by Wyndham Minneapolis Downtown', 'Ramada', 'Minneapolis', 'MN', 'Midwest', 165),
  ('PROP-015', 'Wingate by Wyndham Charlotte Airport', 'Wingate', 'Charlotte', 'NC', 'Southeast', 140),
  ('PROP-016', 'La Quinta Inn & Suites San Francisco', 'La Quinta', 'San Francisco', 'CA', 'West', 145),
  ('PROP-017', 'Days Inn by Wyndham Washington DC', 'Days Inn', 'Washington', 'DC', 'Northeast', 95),
  ('PROP-018', 'Ramada by Wyndham Las Vegas Strip', 'Ramada', 'Las Vegas', 'NV', 'West', 250),
  ('PROP-019', 'Wyndham Grand Pittsburgh Downtown', 'Wyndham Grand', 'Pittsburgh', 'PA', 'Northeast', 290),
  ('PROP-020', 'Wingate by Wyndham Kansas City', 'Wingate', 'Kansas City', 'MO', 'Midwest', 125),
  ('PROP-021', 'La Quinta Inn & Suites Portland', 'La Quinta', 'Portland', 'OR', 'West', 155),
  ('PROP-022', 'Days Inn by Wyndham San Diego', 'Days Inn', 'San Diego', 'CA', 'West', 105),
  ('PROP-023', 'Ramada by Wyndham Philadelphia Airport', 'Ramada', 'Philadelphia', 'PA', 'Northeast', 185),
  ('PROP-024', 'Wingate by Wyndham Austin', 'Wingate', 'Austin', 'TX', 'West', 135),
  ('PROP-025', 'Wyndham Grand Salt Lake City', 'Wyndham Grand', 'Salt Lake City', 'UT', 'West', 275);
```

- [ ] **Step 2: Verify**

```sql
SELECT brand, COUNT(*) as cnt, AVG(room_count) as avg_rooms
FROM jdub_demo.wyndham.dim_property
GROUP BY brand ORDER BY brand;
```

Expected: 5 brands, 5 properties each.

---

### Task 3: Create dim_date table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create and populate dim_date**

```sql
CREATE OR REPLACE TABLE jdub_demo.wyndham.dim_date AS
SELECT
  d AS date,
  date_format(d, 'EEEE') AS day_of_week,
  date_format(d, 'MMMM') AS month,
  CONCAT('Q', QUARTER(d)) AS quarter,
  YEAR(d) AS year,
  CASE WHEN dayofweek(d) IN (1, 7) THEN true ELSE false END AS is_weekend
FROM (
  SELECT explode(sequence(DATE '2025-06-01', DATE '2026-05-31', INTERVAL 1 DAY)) AS d
);
```

- [ ] **Step 2: Verify**

```sql
SELECT COUNT(*) as total_days, MIN(date) as start_date, MAX(date) as end_date
FROM jdub_demo.wyndham.dim_date;
```

Expected: 365 days, 2025-06-01 to 2026-05-31.

---

### Task 4: Create fact_bookings table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create fact_bookings with realistic data**

```sql
CREATE OR REPLACE TABLE jdub_demo.wyndham.fact_bookings AS
WITH
-- Rate ranges by brand
brand_rates AS (
  SELECT property_id, brand, room_count,
    CASE brand
      WHEN 'Wyndham Grand' THEN 200
      WHEN 'Ramada' THEN 110
      WHEN 'La Quinta' THEN 90
      WHEN 'Wingate' THEN 100
      WHEN 'Days Inn' THEN 65
    END AS base_rate,
    CASE brand
      WHEN 'Wyndham Grand' THEN 150
      WHEN 'Ramada' THEN 70
      WHEN 'La Quinta' THEN 50
      WHEN 'Wingate' THEN 60
      WHEN 'Days Inn' THEN 40
    END AS rate_range
  FROM jdub_demo.wyndham.dim_property
),
-- Generate ~800 bookings across properties and dates
booking_seeds AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY p.property_id, d.date) AS rn,
    p.property_id,
    p.brand,
    p.base_rate,
    p.rate_range,
    d.date AS check_in_date,
    d.is_weekend
  FROM brand_rates p
  CROSS JOIN jdub_demo.wyndham.dim_date d
  WHERE rand() < (
    -- Higher booking probability for larger brands and peak seasons
    CASE
      WHEN MONTH(d.date) IN (6,7,8,12) THEN 0.012  -- summer + holidays
      WHEN MONTH(d.date) IN (3,4,5,9,10) THEN 0.009  -- shoulder
      ELSE 0.006  -- winter low
    END
    * CASE WHEN d.is_weekend THEN 1.3 ELSE 1.0 END
  )
),
bookings_raw AS (
  SELECT
    CONCAT('BK-', LPAD(CAST(rn AS STRING), 6, '0')) AS booking_id,
    property_id,
    check_in_date,
    -- Stay 1-5 nights, weighted toward shorter stays
    CAST(1 + FLOOR(ABS(rand() * 3) + ABS(rand() * 2)) AS INT) AS nights,
    -- Rate varies by brand + seasonal + random noise
    ROUND(base_rate + (rand() * rate_range)
      * CASE WHEN MONTH(check_in_date) IN (6,7,8,12) THEN 1.25 ELSE 1.0 END
      * CASE WHEN is_weekend THEN 1.15 ELSE 1.0 END,
    2) AS room_rate,
    -- Booking channel distribution
    CASE
      WHEN rand() < 0.30 THEN 'web'
      WHEN rand() < 0.55 THEN 'mobile'
      WHEN rand() < 0.75 THEN 'OTA'
      WHEN rand() < 0.90 THEN 'phone'
      ELSE 'walk-in'
    END AS booking_channel,
    -- Guest type distribution
    CASE
      WHEN rand() < 0.40 THEN 'loyalty_member'
      WHEN rand() < 0.70 THEN 'leisure'
      ELSE 'corporate'
    END AS guest_type,
    -- ~15% cancellation rate
    CASE
      WHEN rand() < 0.15 THEN 'cancelled'
      WHEN check_in_date < CURRENT_DATE() THEN 'completed'
      ELSE 'confirmed'
    END AS booking_status,
    -- Created 1-60 days before check-in
    CAST(check_in_date - INTERVAL (CAST(1 + FLOOR(rand() * 59) AS INT)) DAY AS TIMESTAMP) AS created_at
  FROM booking_seeds
)
SELECT
  booking_id,
  property_id,
  check_in_date,
  date_add(check_in_date, nights) AS check_out_date,
  nights,
  room_rate,
  ROUND(room_rate * nights, 2) AS total_revenue,
  booking_channel,
  guest_type,
  booking_status,
  created_at
FROM bookings_raw;
```

- [ ] **Step 2: Verify row count and distribution**

```sql
SELECT
  COUNT(*) as total_bookings,
  COUNT(DISTINCT property_id) as properties,
  ROUND(AVG(room_rate), 2) as avg_rate,
  ROUND(AVG(total_revenue), 2) as avg_revenue,
  ROUND(SUM(CASE WHEN booking_status = 'cancelled' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as cancel_pct
FROM jdub_demo.wyndham.fact_bookings;
```

Expected: ~600-1000 bookings, 25 properties, ~15% cancellation rate.

- [ ] **Step 3: Verify brand-level rates make sense**

```sql
SELECT p.brand, COUNT(*) as bookings, ROUND(AVG(f.room_rate), 2) as avg_rate
FROM jdub_demo.wyndham.fact_bookings f
JOIN jdub_demo.wyndham.dim_property p ON f.property_id = p.property_id
GROUP BY p.brand ORDER BY avg_rate DESC;
```

Expected: Wyndham Grand highest ADR, Days Inn lowest.

---

### Task 5: Create Genie space

**Files:** None (Databricks SDK)

- [ ] **Step 1: Create Genie space via `create_or_update_genie` tool**

Parameters:
- **display_name**: "Wyndham Hotels Analytics"
- **description**: "Analyze Wyndham Hotels booking data — occupancy, revenue, ADR, cancellations by brand, region, and channel"
- **table_names**: `["jdub_demo.wyndham.fact_bookings", "jdub_demo.wyndham.dim_property", "jdub_demo.wyndham.dim_date"]`
- **warehouse_id**: Use `get_best_warehouse` tool to find one
- **instructions**: See below

Genie instructions:
```
You are a hospitality analytics assistant for Wyndham Hotels & Resorts. You help analyze booking data across the Wyndham portfolio of brands: Wyndham Grand, La Quinta, Days Inn, Ramada, and Wingate.

Key metrics to support:
- ADR (Average Daily Rate): AVG(room_rate) for completed/confirmed bookings
- RevPAR (Revenue Per Available Room): total_revenue / (room_count * days_in_period)
- Occupancy Rate: bookings / (room_count * days_in_period) — note each booking occupies 1 room per night
- Cancellation Rate: cancelled bookings / total bookings

When joining tables:
- fact_bookings.property_id → dim_property.property_id
- fact_bookings.check_in_date → dim_date.date

Always exclude cancelled bookings from revenue/occupancy calculations unless specifically asked about cancellations.
Group by brand, region, or booking_channel when the user asks for comparisons.
```

- [ ] **Step 2: Record the Genie space ID from the response**

Save the returned `space_id` — needed for `databricks.yml` in Task 8.

- [ ] **Step 3: Notify user that Genie space is ready**

Tell the user the Genie space ID and that they can now create a Multi-Agent Supervisor endpoint linked to it, then provide the MAS endpoint name back.

**BLOCKING**: Wait for user to provide the MAS endpoint name before proceeding to Task 8.

---

## Chunk 2: Git Worktree + Branding

### Task 6: Create git worktree

**Files:** None (git operations)

- [ ] **Step 1: Create worktree on branch `wyndham` from current HEAD**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app
git worktree add -b wyndham ../e2e-genie-app-wyndham HEAD
```

This creates a new directory at `../e2e-genie-app-wyndham` on branch `wyndham`.

- [ ] **Step 2: Verify worktree**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
git branch --show-current
```

Expected: `wyndham`

- [ ] **Step 3: Install dependencies in worktree**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
npm install
```

---

### Task 7: Rebrand app

**Files (all paths relative to worktree `/Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham/`):**
- Create: `client/public/wyndham_logo.svg`
- Modify: `client/index.html`
- Modify: `client/src/index.css`
- Modify: `client/src/components/app-sidebar.tsx`
- Modify: `client/src/components/greeting.tsx`
- Modify: `client/src/components/suggested-actions.tsx`

- [ ] **Step 1: Create Wyndham logo SVG**

Write `client/public/wyndham_logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" fill="none">
  <text x="10" y="42" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#1a5276">
    W
  </text>
  <text x="38" y="42" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="#1a5276">
    WYNDHAM
  </text>
  <text x="38" y="55" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="400" fill="#5b7d95" letter-spacing="2">
    HOTELS &amp; RESORTS
  </text>
  <rect x="10" y="48" width="24" height="2" rx="1" fill="#2980b9"/>
</svg>
```

- [ ] **Step 2: Update `client/index.html` title**

Change line 8:
```
<title>Panda P&L Genie</title>
```
to:
```
<title>Wyndham Hotels Genie</title>
```

- [ ] **Step 3: Update light mode colors in `client/src/index.css`**

In the `:root` block, replace these values:
- Line 25: `--primary: hsl(358 68% 49%)` → `--primary: hsl(210 70% 35%)`
- Line 31: `--accent: hsl(358 68% 95%)` → `--accent: hsl(210 30% 95%)`
- Line 32: `--accent-foreground: hsl(358 68% 30%)` → `--accent-foreground: hsl(210 70% 25%)`
- Line 37: `--ring: hsl(358 68% 49%)` → `--ring: hsl(210 70% 35%)`
- Line 38: `--chart-1: hsl(358 68% 49%)` → `--chart-1: hsl(210 70% 35%)`
- Line 42: `--chart-5: hsl(358 60% 65%)` → `--chart-5: hsl(210 50% 60%)`

- [ ] **Step 4: Update dark mode colors in `client/src/index.css`**

In the `.dark` block, replace these values:
- Line 63: `--primary: hsl(358 68% 49%)` → `--primary: hsl(210 70% 50%)`
- Line 69: `--accent: hsl(358 68% 15%)` → `--accent: hsl(210 40% 15%)`
- Line 70: `--accent-foreground: hsl(358 68% 70%)` → `--accent-foreground: hsl(210 60% 70%)`
- Line 75: `--ring: hsl(358 68% 49%)` → `--ring: hsl(210 70% 50%)`
- Line 76: `--chart-1: hsl(358 68% 49%)` → `--chart-1: hsl(210 70% 50%)`
- Line 80: `--chart-5: hsl(340 75% 55%)` → `--chart-5: hsl(210 50% 55%)`

- [ ] **Step 5: Update `client/src/components/app-sidebar.tsx`**

Line 42: `src="/Panda_Express_logo.svg"` → `src="/wyndham_logo.svg"`
Line 43: `alt="Panda Express"` → `alt="Wyndham Hotels"`
Line 47: `Panda P&amp;L Genie` → `Wyndham Hotels Genie`

- [ ] **Step 6: Update `client/src/components/greeting.tsx`**

Line 16 text: `Hello there!` → `Welcome to Wyndham Hotels Analytics`
Line 24 text: `How can I help you today?` → `Ask questions about bookings, revenue, and property performance`
Line 35: `src="/Panda_Express_logo.svg"` → `src="/wyndham_logo.svg"`
Line 36: `alt="Panda Express Logo"` → `alt="Wyndham Hotels Logo"`

- [ ] **Step 7: Update `client/src/components/suggested-actions.tsx`**

Replace lines 18-21:
```typescript
const suggestedActions = [
  'How can you help me?',
  'Tell me something I might not know',
];
```
with:
```typescript
const suggestedActions = [
  "What's the average daily rate by brand?",
  'Show me occupancy trends by region',
  'Which booking channel drives the most revenue?',
  "What's our cancellation rate by property?",
];
```

- [ ] **Step 8: Commit branding changes**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
git add client/public/wyndham_logo.svg client/index.html client/src/index.css client/src/components/app-sidebar.tsx client/src/components/greeting.tsx client/src/components/suggested-actions.tsx
git commit -m "feat: rebrand app for Wyndham Hotels demo"
```

---

## Chunk 3: Configure + Build + Deploy

### Task 8: Update databricks.yml

**Files:**
- Modify: `databricks.yml` (in worktree)

**Prerequisite:** Genie space ID from Task 5, MAS endpoint name from user.

- [ ] **Step 1: Update databricks.yml variables and resource names**

Changes to make:
- Line 2: `name: genie-e2e-app` → `name: genie-wyndham-app`
- Line 8: `default: "mas-cfcbc058-endpoint"` → `default: "<USER_PROVIDED_MAS_ENDPOINT>"`
- Line 11: `default: "01f0aae3f2a812ceb9f489fa0317532a"` → `default: "<GENIE_SPACE_ID_FROM_TASK_5>"`
- Line 14: `default: "lakebase-e2e"` → `default: "lakebase-wyndham"`
- Line 17: `default: "lce"` → `default: "wyndham"`
- Line 29: `name: genie-e2e-app-${var.resource_name_suffix}` → `name: genie-wyndham-app-${var.resource_name_suffix}`
- Line 30: `description:` → `"Wyndham Hotels Analytics - Genie Space Demo"`
- Line 43: `name: "genie-space-e2e"` → `name: "genie-space-wyndham"`

- [ ] **Step 2: Commit**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
git add databricks.yml
git commit -m "feat: configure databricks.yml for Wyndham demo"
```

---

### Task 9: Build and deploy

**Files:** None (build + CLI commands)

- [ ] **Step 1: Build frontend**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
npm run build
```

Expected: clean build with no errors.

- [ ] **Step 2: Validate bundle**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
databricks bundle validate
```

Expected: no errors.

- [ ] **Step 3: Deploy bundle**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
databricks bundle deploy
```

- [ ] **Step 4: Run app**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
databricks bundle run databricks_chatbot
```

- [ ] **Step 5: Verify deployment**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-wyndham
databricks bundle summary
```

Check that the app URL is accessible and shows Wyndham branding.

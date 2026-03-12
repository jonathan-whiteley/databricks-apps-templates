# Chipotle Operations Genie Demo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a Chipotle-branded Genie demo app with sample restaurant operations data on a separate git worktree branch.

**Architecture:** Two parallel workstreams — (A) data + Genie space on Databricks, (B) git worktree + branding changes. They converge when the Genie space ID and user-provided MAS endpoint ID are plugged into `databricks.yml`, then build and deploy.

**Tech Stack:** Databricks SQL, Databricks Genie Spaces, React/TypeScript/Tailwind, Databricks Asset Bundles

**Spec:** `docs/superpowers/specs/2026-03-12-chipotle-demo-design.md`

---

## Chunk 1: Data Generation (Databricks)

### Task 1: Create schema

**Files:** None (ad-hoc SQL on Databricks)

- [ ] **Step 1: Create the chipotle schema in jdub_demo catalog**

```sql
CREATE SCHEMA IF NOT EXISTS jdub_demo.chipotle;
```

Run via `execute_sql` tool on DEFAULT profile.

- [ ] **Step 2: Verify schema exists**

```sql
SHOW SCHEMAS IN jdub_demo LIKE 'chipotle';
```

Expected: one row returned.

---

### Task 2: Create dim_store table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create dim_store**

```sql
CREATE OR REPLACE TABLE jdub_demo.chipotle.dim_store (
  store_id STRING,
  store_name STRING,
  city STRING,
  state STRING,
  region STRING,
  format STRING,
  open_date DATE
);
```

- [ ] **Step 2: Populate dim_store**

```sql
INSERT INTO jdub_demo.chipotle.dim_store VALUES
  ('STORE-001', 'Chipotle Downtown Austin', 'Austin', 'TX', 'West', 'Standard', '2018-03-15'),
  ('STORE-002', 'Chipotle Buckhead Atlanta', 'Atlanta', 'GA', 'Southeast', 'Chipotlane', '2019-06-01'),
  ('STORE-003', 'Chipotle Times Square', 'New York', 'NY', 'Northeast', 'Standard', '2015-01-20'),
  ('STORE-004', 'Chipotle Magnificent Mile', 'Chicago', 'IL', 'Midwest', 'Standard', '2016-09-10'),
  ('STORE-005', 'Chipotle Santa Monica', 'Los Angeles', 'CA', 'West', 'Chipotlane', '2020-02-14'),
  ('STORE-006', 'Chipotle South Beach', 'Miami', 'FL', 'Southeast', 'Standard', '2017-11-03'),
  ('STORE-007', 'Chipotle Capitol Hill', 'Seattle', 'WA', 'West', 'Digital Kitchen', '2022-05-20'),
  ('STORE-008', 'Chipotle Uptown Dallas', 'Dallas', 'TX', 'West', 'Chipotlane', '2019-08-12'),
  ('STORE-009', 'Chipotle Fenway', 'Boston', 'MA', 'Northeast', 'Standard', '2016-04-05'),
  ('STORE-010', 'Chipotle Cherry Creek', 'Denver', 'CO', 'West', 'Standard', '2017-07-22'),
  ('STORE-011', 'Chipotle Midtown Phoenix', 'Phoenix', 'AZ', 'West', 'Chipotlane', '2020-10-01'),
  ('STORE-012', 'Chipotle French Quarter', 'New Orleans', 'LA', 'Southeast', 'Standard', '2018-12-15'),
  ('STORE-013', 'Chipotle Pearl District', 'Portland', 'OR', 'West', 'Standard', '2017-03-30'),
  ('STORE-014', 'Chipotle Dupont Circle', 'Washington', 'DC', 'Northeast', 'Standard', '2015-08-18'),
  ('STORE-015', 'Chipotle Wicker Park', 'Chicago', 'IL', 'Midwest', 'Digital Kitchen', '2023-01-10'),
  ('STORE-016', 'Chipotle Scottsdale', 'Scottsdale', 'AZ', 'West', 'Chipotlane', '2021-04-25'),
  ('STORE-017', 'Chipotle Midtown Manhattan', 'New York', 'NY', 'Northeast', 'Standard', '2014-06-12'),
  ('STORE-018', 'Chipotle River North', 'Chicago', 'IL', 'Midwest', 'Standard', '2016-11-08'),
  ('STORE-019', 'Chipotle The Domain', 'Austin', 'TX', 'West', 'Chipotlane', '2021-09-15'),
  ('STORE-020', 'Chipotle Coconut Grove', 'Miami', 'FL', 'Southeast', 'Standard', '2019-02-28'),
  ('STORE-021', 'Chipotle Ballard', 'Seattle', 'WA', 'West', 'Standard', '2018-05-10'),
  ('STORE-022', 'Chipotle Back Bay', 'Boston', 'MA', 'Northeast', 'Standard', '2017-10-20'),
  ('STORE-023', 'Chipotle Plano', 'Plano', 'TX', 'West', 'Chipotlane', '2022-03-01'),
  ('STORE-024', 'Chipotle Music Row', 'Nashville', 'TN', 'Southeast', 'Standard', '2020-07-14'),
  ('STORE-025', 'Chipotle LoDo Denver', 'Denver', 'CO', 'West', 'Digital Kitchen', '2023-06-01');
```

- [ ] **Step 3: Verify**

```sql
SELECT region, COUNT(*) as cnt, COUNT(DISTINCT format) as formats
FROM jdub_demo.chipotle.dim_store
GROUP BY region ORDER BY region;
```

Expected: 25 stores across 4 regions, 3 formats represented.

---

### Task 3: Create dim_date table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create and populate dim_date**

```sql
CREATE OR REPLACE TABLE jdub_demo.chipotle.dim_date AS
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
FROM jdub_demo.chipotle.dim_date;
```

Expected: 365 days, 2025-06-01 to 2026-05-31.

---

### Task 4: Create dim_menu_item table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create dim_menu_item**

```sql
CREATE OR REPLACE TABLE jdub_demo.chipotle.dim_menu_item (
  item_id STRING,
  item_name STRING,
  category STRING,
  base_price DECIMAL(10,2)
);
```

- [ ] **Step 2: Populate dim_menu_item**

```sql
INSERT INTO jdub_demo.chipotle.dim_menu_item VALUES
  ('MENU-001', 'Chicken Burrito', 'Burritos', 10.75),
  ('MENU-002', 'Steak Burrito', 'Burritos', 12.50),
  ('MENU-003', 'Carnitas Burrito', 'Burritos', 11.25),
  ('MENU-004', 'Chicken Bowl', 'Bowls', 10.75),
  ('MENU-005', 'Steak Bowl', 'Bowls', 12.50),
  ('MENU-006', 'Veggie Bowl', 'Bowls', 10.00),
  ('MENU-007', 'Barbacoa Bowl', 'Bowls', 12.00),
  ('MENU-008', 'Chicken Tacos (3)', 'Tacos', 10.75),
  ('MENU-009', 'Steak Tacos (3)', 'Tacos', 12.50),
  ('MENU-010', 'Chips & Guacamole', 'Sides', 5.95),
  ('MENU-011', 'Chips & Queso', 'Sides', 4.95),
  ('MENU-012', 'Side of Guacamole', 'Sides', 3.25),
  ('MENU-013', 'Fountain Drink', 'Drinks', 2.75),
  ('MENU-014', 'Bottled Water', 'Drinks', 2.50),
  ('MENU-015', 'Mexican Coca-Cola', 'Drinks', 3.50);
```

- [ ] **Step 3: Verify**

```sql
SELECT category, COUNT(*) as items, ROUND(AVG(base_price), 2) as avg_price
FROM jdub_demo.chipotle.dim_menu_item
GROUP BY category ORDER BY avg_price DESC;
```

Expected: 5 categories — Burritos (3), Bowls (4), Tacos (2), Sides (3), Drinks (3).

---

### Task 5: Create fact_transactions table

**Files:** None (ad-hoc SQL)

- [ ] **Step 1: Create fact_transactions with realistic data**

Note: `rand()` thresholds are calibrated higher per LEARNINGS.md to hit ~800-1000 rows. No dynamic date arithmetic is needed in this query, but if adjustments require it, use `date_sub()` instead of `INTERVAL (expression) DAY`.

```sql
CREATE OR REPLACE TABLE jdub_demo.chipotle.fact_transactions AS
WITH
-- Weight menu items by popularity (bowls and burritos dominate)
item_weights AS (
  SELECT item_id, item_name, category, base_price,
    CASE category
      WHEN 'Bowls' THEN 0.35
      WHEN 'Burritos' THEN 0.25
      WHEN 'Tacos' THEN 0.12
      WHEN 'Sides' THEN 0.18
      WHEN 'Drinks' THEN 0.10
    END AS category_weight
  FROM jdub_demo.chipotle.dim_menu_item
),
-- Generate transaction seeds via cross join with sampling
txn_seeds AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY s.store_id, d.date, m.item_id) AS rn,
    s.store_id,
    d.date AS transaction_date,
    d.is_weekend,
    m.item_id,
    m.base_price,
    m.category
  FROM jdub_demo.chipotle.dim_store s
  CROSS JOIN jdub_demo.chipotle.dim_date d
  CROSS JOIN item_weights m
  WHERE rand() < (
    m.category_weight * 0.005
    * CASE
        WHEN MONTH(d.date) IN (6,7,8) THEN 1.3       -- summer boost
        WHEN MONTH(d.date) IN (11,12) THEN 1.15       -- holiday boost
        ELSE 1.0
      END
    * CASE WHEN d.is_weekend THEN 1.25 ELSE 1.0 END
  )
),
txn_raw AS (
  SELECT
    CONCAT('TXN-', LPAD(CAST(rn AS STRING), 6, '0')) AS transaction_id,
    store_id,
    transaction_date,
    item_id,
    -- Quantity: mostly 1, sometimes 2-3 for sides/drinks
    CASE
      WHEN category IN ('Sides', 'Drinks') AND rand() < 0.3 THEN CAST(2 + FLOOR(rand() * 2) AS INT)
      ELSE 1
    END AS quantity,
    -- Price varies slightly from base (+/- 10% noise)
    ROUND(base_price * (0.95 + rand() * 0.10), 2) AS unit_price,
    -- Order channel
    CASE
      WHEN rand() < 0.30 THEN 'in-store'
      WHEN rand() < 0.55 THEN 'app'
      WHEN rand() < 0.75 THEN 'web'
      ELSE 'third-party-delivery'
    END AS order_channel,
    -- Order type
    CASE
      WHEN rand() < 0.35 THEN 'dine-in'
      WHEN rand() < 0.70 THEN 'takeout'
      ELSE 'delivery'
    END AS order_type,
    -- ~5% catering
    CASE WHEN rand() < 0.05 THEN true ELSE false END AS is_catering
  FROM txn_seeds
)
SELECT
  transaction_id,
  store_id,
  transaction_date,
  item_id,
  quantity,
  unit_price,
  ROUND(quantity * unit_price, 2) AS line_total,
  order_channel,
  order_type,
  is_catering
FROM txn_raw;
```

- [ ] **Step 2: Verify row count and distribution**

```sql
SELECT
  COUNT(*) as total_txns,
  COUNT(DISTINCT store_id) as stores,
  COUNT(DISTINCT item_id) as items,
  ROUND(AVG(line_total), 2) as avg_line_total,
  ROUND(SUM(line_total), 2) as total_revenue
FROM jdub_demo.chipotle.fact_transactions;
```

Expected: ~800-1000 rows, 25 stores, 15 items.

- [ ] **Step 3: Verify channel and category distribution**

```sql
SELECT order_channel, COUNT(*) as txns, ROUND(SUM(line_total), 2) as revenue
FROM jdub_demo.chipotle.fact_transactions
GROUP BY order_channel ORDER BY revenue DESC;
```

Expected: 4 channels with in-store and app dominating.

- [ ] **Step 4: If row count is too low, adjust and re-run**

If fewer than 600 rows, increase the base threshold (`0.005`) by 2-3x and re-run the CREATE OR REPLACE statement. The `rand()` sampling is non-deterministic so exact counts will vary.

---

### Task 6: Create Genie space

**Files:** None (Databricks SDK)

- [ ] **Step 1: Create Genie space via `create_or_update_genie` tool**

Parameters:
- **display_name**: "Chipotle Operations Analytics"
- **description**: "Analyze Chipotle restaurant operations — sales, menu performance, order channels, and store metrics"
- **table_names**: `["jdub_demo.chipotle.fact_transactions", "jdub_demo.chipotle.dim_store", "jdub_demo.chipotle.dim_date", "jdub_demo.chipotle.dim_menu_item"]`
- **warehouse_id**: Use `get_best_warehouse` tool to find one
- **instructions**:

```
You are a restaurant operations analytics assistant for Chipotle Mexican Grill. You help analyze sales data, menu performance, and store operations across the Chipotle portfolio.

Key metrics to support:
- Revenue: SUM(line_total) for transactions
- Average Ticket Size: SUM(line_total) / COUNT(DISTINCT transaction_id) — but since each transaction_id is unique per line item, use approximate grouping by (store_id, transaction_date, order_channel) for ticket-level analysis
- Menu Mix %: category revenue / total revenue
- Digital Order Share: (app + web + third-party-delivery) / total transactions
- Catering Revenue: SUM(line_total) WHERE is_catering = true

When joining tables:
- fact_transactions.store_id → dim_store.store_id
- fact_transactions.transaction_date → dim_date.date
- fact_transactions.item_id → dim_menu_item.item_id

Group by store, region, format, category, or order_channel when the user asks for comparisons.
Use dim_date for time-based analysis (day_of_week, month, quarter, is_weekend).
```

- [ ] **Step 2: Record the Genie space ID from the response**

Save the returned `space_id` — needed for `databricks.yml` in Task 9.

- [ ] **Step 3: Notify user that Genie space is ready**

Tell the user the Genie space ID and that they can now create a Multi-Agent Supervisor endpoint linked to it, then provide the MAS endpoint name back.

**BLOCKING**: Wait for user to provide the MAS endpoint name before proceeding to Task 9.

---

## Chunk 2: Git Worktree + Branding

### Task 7: Create git worktree

**Files:** None (git operations)

- [ ] **Step 1: Create worktree on branch `chipotle` from current HEAD**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app
git worktree add -b chipotle ../e2e-genie-app-chipotle HEAD
```

This creates a new directory at `../e2e-genie-app-chipotle` on branch `chipotle`.

- [ ] **Step 2: Verify worktree**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
git branch --show-current
```

Expected: `chipotle`

- [ ] **Step 3: Install dependencies in worktree**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
npm install
```

---

### Task 8: Rebrand app

**Files (all paths relative to worktree `/Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle/`):**
- Create: `client/public/chipotle-logo.svg`
- Modify: `client/index.html`
- Modify: `client/src/index.css`
- Modify: `client/src/components/app-sidebar.tsx`
- Modify: `client/src/components/greeting.tsx`
- Modify: `client/src/components/suggested-actions.tsx`
- Modify: `client/src/components/message.tsx`

- [ ] **Step 1: Copy Chipotle logo to client/public/**

```bash
cp /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle/logos/chipotle-mexican-grill.svg \
   /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle/client/public/chipotle-logo.svg
```

- [ ] **Step 2: Update `client/index.html` title and favicon**

Change line 5:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```
to:
```html
<link rel="icon" type="image/svg+xml" href="/chipotle-logo.svg" />
```

Change line 8:
```html
<title>Panda P&amp;L Genie</title>
```
to:
```html
<title>Chipotle Operations Genie</title>
```

- [ ] **Step 3: Update light mode colors in `client/src/index.css`**

In the `:root` block, replace these values (note: `--primary-foreground` is already `hsl(0 0% 100%)` — no change needed):
- `--primary: hsl(358 68% 49%)` → `--primary: hsl(1 80% 37%)`
- `--accent: hsl(358 68% 95%)` → `--accent: hsl(1 40% 95%)`
- `--accent-foreground: hsl(358 68% 30%)` → `--accent-foreground: hsl(1 80% 25%)`
- `--ring: hsl(358 68% 49%)` → `--ring: hsl(1 80% 37%)`
- `--chart-1: hsl(358 68% 49%)` → `--chart-1: hsl(1 80% 37%)`
- `--chart-5: hsl(358 60% 65%)` → `--chart-5: hsl(18 60% 40%)`

- [ ] **Step 4: Update dark mode colors in `client/src/index.css`**

In the `.dark` block, replace these values (note: `--primary-foreground` is already `hsl(0 0% 100%)` — no change needed):
- `--primary: hsl(358 68% 49%)` → `--primary: hsl(1 80% 45%)`
- `--accent: hsl(358 68% 15%)` → `--accent: hsl(1 50% 15%)`
- `--accent-foreground: hsl(358 68% 70%)` → `--accent-foreground: hsl(1 60% 70%)`
- `--ring: hsl(358 68% 49%)` → `--ring: hsl(1 80% 45%)`
- `--chart-1: hsl(358 68% 49%)` → `--chart-1: hsl(1 80% 45%)`
- `--chart-5: hsl(340 75% 55%)` → `--chart-5: hsl(18 70% 45%)`

- [ ] **Step 5: Fix user message bubble in `client/src/components/message.tsx`**

**CRITICAL**: Remove the hardcoded inline style at lines 185-189:
```tsx
                      style={
                        message.role === 'user'
                          ? { backgroundColor: '#D1282E' }
                          : undefined
                      }
```

Replace with nothing (delete the `style` prop entirely). Then add `bg-primary text-primary-foreground` to the className on the user message condition at line 180:

Change:
```tsx
'w-fit break-words rounded-2xl px-3 py-2 text-right text-white':
  message.role === 'user',
```
to:
```tsx
'w-fit break-words rounded-2xl px-3 py-2 text-right bg-primary text-primary-foreground':
  message.role === 'user',
```

This ensures the bubble color is driven by CSS variables instead of a hardcoded hex.

- [ ] **Step 6: Update `client/src/components/app-sidebar.tsx`**

Line 42: `src="/Panda_Express_logo.svg"` → `src="/chipotle-logo.svg"`
Line 43: `alt="Panda Express"` → `alt="Chipotle"`
Line 47: `Panda P&amp;L Genie` → `Chipotle Ops Genie`

- [ ] **Step 7: Update `client/src/components/greeting.tsx`**

Line 16 text: `Hello there!` → `Welcome to Chipotle Operations Analytics`
Line 25 text: `How can I help you today?` → `Ask questions about sales, menu performance, and store operations`
Line 35: `src="/Panda_Express_logo.svg"` → `src="/chipotle-logo.svg"`
Line 36: `alt="Panda Express Logo"` → `alt="Chipotle Logo"`

- [ ] **Step 8: Update `client/src/components/suggested-actions.tsx`**

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
  "What are our top 5 stores by revenue this quarter?",
  'Show me average ticket size by order channel',
  'Which menu categories drive the most revenue?',
  'How do digital orders compare to in-store over time?',
];
```

- [ ] **Step 9: Commit branding changes**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
git add client/public/chipotle-logo.svg client/index.html client/src/index.css client/src/components/app-sidebar.tsx client/src/components/greeting.tsx client/src/components/suggested-actions.tsx client/src/components/message.tsx
git commit -m "feat: rebrand app for Chipotle Operations demo"
```

---

## Chunk 3: Configure + Build + Deploy

### Task 9: Update databricks.yml

**Files:**
- Modify: `databricks.yml` (in worktree)

**Prerequisite:** Genie space ID from Task 6, MAS endpoint name from user.

- [ ] **Step 1: Update databricks.yml variables and resource names**

Changes to make:
- Line 2: `name: genie-e2e-app` → `name: genie-chipotle-app`
- Line 8: `default: "mas-cfcbc058-endpoint"` → `default: "<USER_PROVIDED_MAS_ENDPOINT>"`
- Line 11: `default: "01f0aae3f2a812ceb9f489fa0317532a"` → `default: "<GENIE_SPACE_ID_FROM_TASK_6>"`
- Line 14: `default: "lakebase-e2e"` → `default: "lakebase-chipotle"`
- Line 17: `default: "lce"` → `default: "chipotle"`
- Line 29: `name: genie-e2e-app-${var.resource_name_suffix}` → `name: genie-chipotle-app-${var.resource_name_suffix}`
- Line 30: `description:` → `"Chipotle Operations Analytics - Genie Space Demo"`
- Line 43: `name: "genie-space-e2e"` → `name: "genie-space-chipotle"`

- [ ] **Step 2: Commit**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
git add databricks.yml
git commit -m "feat: configure databricks.yml for Chipotle demo"
```

---

### Task 10: Build and deploy

**Files:** None (build + CLI commands)

- [ ] **Step 1: Build frontend**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
npm run build
```

Expected: clean build with no errors.

- [ ] **Step 2: Validate bundle**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
databricks bundle validate
```

Expected: no errors.

- [ ] **Step 3: Deploy bundle**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
databricks bundle deploy
```

- [ ] **Step 4: Run app**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
databricks bundle run databricks_chatbot
```

- [ ] **Step 5: Verify deployment**

```bash
cd /Users/jonathan.whiteley/Desktop/Projects/e2e-genie-app-chipotle
databricks bundle summary
```

Check that the app URL is accessible and shows Chipotle branding.

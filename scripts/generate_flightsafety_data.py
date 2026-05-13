"""Generate fact table data for FlightSafety demo and insert via Databricks SQL.

Run locally: python scripts/generate_flightsafety_data.py
Or as bundle job: see databricks.yml resources.jobs.bootstrap_data
Requires: databricks-sdk
"""

import os
import random
from datetime import date, timedelta
from databricks.sdk import WorkspaceClient

CATALOG = os.environ.get("FLIGHTSAFETY_CATALOG", "flightsafety_demo")
SCHEMA = os.environ.get("FLIGHTSAFETY_SCHEMA", "core")
PROFILE = os.environ.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT")

w = WorkspaceClient(profile=PROFILE)

random.seed(42)

# --- Dimension data (mirrors what's in the tables) ---
commercial_sims = [
    ("SIM-001", "B737 MAX"), ("SIM-002", "B787"), ("SIM-003", "A320neo"),
    ("SIM-004", "B777"), ("SIM-005", "E175"), ("SIM-006", "C680A"),
    ("SIM-007", "B737-800"), ("SIM-008", "A350"), ("SIM-009", "B767"),
    ("SIM-015", "B737 MAX"), ("SIM-016", "A220"), ("SIM-017", "F8X"),
]
military_sims = [
    ("SIM-010", "F-16C"), ("SIM-011", "F-35A"), ("SIM-012", "C-130J"),
    ("SIM-013", "UH-60M"), ("SIM-014", "F/A-18E"), ("SIM-018", "AH-64E"),
]
sim_max_daily = {
    "SIM-001": 22, "SIM-002": 22, "SIM-003": 21, "SIM-004": 22,
    "SIM-005": 20, "SIM-006": 20, "SIM-007": 22, "SIM-008": 22,
    "SIM-009": 21, "SIM-010": 20, "SIM-011": 20, "SIM-012": 21,
    "SIM-013": 20, "SIM-014": 20, "SIM-015": 20, "SIM-016": 22,
    "SIM-017": 20, "SIM-018": 20,
}
dod_custs = ["CUST-012", "CUST-013", "CUST-014", "CUST-015", "CUST-016", "CUST-017", "CUST-018"]
comm_custs = ["CUST-001", "CUST-002", "CUST-003", "CUST-004", "CUST-005",
              "CUST-006", "CUST-007", "CUST-008", "CUST-009", "CUST-010", "CUST-011"]

# Instructor specialties (simplified — just pick from active instructors)
instructors = [f"INST-{i:03d}" for i in range(1, 35)]

seasonal = {1: 1.15, 2: 1.12, 3: 1.10, 4: 0.95, 5: 0.90, 6: 0.85,
            7: 1.05, 8: 1.12, 9: 1.15, 10: 0.95, 11: 0.90, 12: 0.85}


def weighted_choice(options):
    r = random.random()
    cum = 0
    for val, wt in options:
        cum += wt
        if r <= cum:
            return val
    return options[-1][0]


# --- Generate sessions ---
tt_commercial = [("Recurrent Training", .40), ("Initial Type Rating", .20),
                 ("Line Oriented Flight Training (LOFT)", .15), ("Emergency Procedures", .25)]
tt_dod = [("Recurrent Training", .30), ("Initial Type Rating", .15),
          ("Emergency Procedures", .15), ("Line Oriented Flight Training (LOFT)", .10),
          ("Mission Rehearsal", .30)]
statuses = [("Completed", .88), ("Cancelled", .05), ("No-Show", .04), ("Interrupted", .03)]

sessions = []
counter = 0
current = date(2025, 1, 1)
end = date(2025, 12, 31)

while current <= end:
    n = max(1, int(random.gauss(7, 2) * seasonal[current.month]))
    for _ in range(n):
        is_dod = random.random() < 0.40
        if is_dod:
            sim_id, ac_type = random.choice(military_sims)
            cust_id = random.choice(dod_custs)
            tt = weighted_choice(tt_dod)
        else:
            sim_id, ac_type = random.choice(commercial_sims)
            cust_id = random.choice(comm_custs)
            tt = weighted_choice(tt_commercial)

        inst_id = random.choice(instructors)
        dur = round(max(1.5, min(4.5, random.gauss(3.0, 0.6))), 2)
        hr = random.randint(5, 20)
        mn = random.choice([0, 15, 30, 45])
        status = weighted_choice(statuses)
        counter += 1
        sid = f"SESS-{current.strftime('%Y%m%d')}-{counter:04d}"

        sessions.append((sid, sim_id, inst_id, cust_id, str(current),
                         f"{current} {hr:02d}:{mn:02d}:00", str(dur), tt, ac_type, status))
    current += timedelta(days=1)

print(f"Generated {len(sessions)} sessions")


def escape(s):
    return s.replace("'", "''")


# Insert sessions in batches of 200
def get_warehouse():
    """Get first available SQL warehouse."""
    for wh in w.warehouses.list():
        if wh.state and wh.state.value in ("RUNNING", "STARTING"):
            return wh.id
    raise RuntimeError("No running SQL warehouse found")

wh_id = get_warehouse()
print(f"Using warehouse: {wh_id}")

batch_size = 200
for i in range(0, len(sessions), batch_size):
    batch = sessions[i:i + batch_size]
    values = ",\n".join(
        f"('{s[0]}', '{s[1]}', '{s[2]}', '{s[3]}', DATE '{s[4]}', "
        f"TIMESTAMP '{s[5]}', {s[6]}, '{escape(s[7])}', '{s[8]}', '{s[9]}')"
        for s in batch
    )
    sql = f"INSERT INTO {CATALOG}.{SCHEMA}.fact_simulator_sessions VALUES\n{values}"
    result = w.statement_execution.execute_statement(
        warehouse_id=wh_id,
        statement=sql,
        wait_timeout="50s",
    )
    print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rows): {result.status.state.value}")

print("fact_simulator_sessions done")

# --- Generate capacity ---
maintenance_spike = {"SIM-003", "SIM-004", "SIM-007", "SIM-012"}
all_sims = [s[0] for s in commercial_sims + military_sims]

capacity = []
for sim_id in all_sims:
    weekly_max = sim_max_daily[sim_id] * 7
    wk = date(2025, 1, 6)
    wk_num = 0
    while wk <= date(2025, 12, 29):
        avail = round(weekly_max - random.uniform(0, 10), 2)
        if sim_id in maintenance_spike and wk_num % 13 in (3, 7, 10, 12):
            maint = round(random.uniform(20, 40), 2)
        else:
            maint = round(random.uniform(2, 8), 2)
        sched = round(max(0, avail * random.uniform(0.70, 0.90) - maint * 0.3), 2)
        util = round((sched / avail) * 100, 2) if avail > 0 else 0
        capacity.append((sim_id, str(wk), str(avail), str(sched), str(maint), str(util)))
        wk += timedelta(days=7)
        wk_num += 1

print(f"Generated {len(capacity)} capacity rows")

for i in range(0, len(capacity), batch_size):
    batch = capacity[i:i + batch_size]
    values = ",\n".join(
        f"('{c[0]}', DATE '{c[1]}', {c[2]}, {c[3]}, {c[4]}, {c[5]})"
        for c in batch
    )
    sql = f"INSERT INTO {CATALOG}.{SCHEMA}.fact_simulator_capacity VALUES\n{values}"
    result = w.statement_execution.execute_statement(
        warehouse_id=wh_id,
        statement=sql,
        wait_timeout="50s",
    )
    print(f"  Inserted batch {i // batch_size + 1} ({len(batch)} rows): {result.status.state.value}")

print("fact_simulator_capacity done")
print(f"\nTotal: {len(sessions)} sessions, {len(capacity)} capacity rows")

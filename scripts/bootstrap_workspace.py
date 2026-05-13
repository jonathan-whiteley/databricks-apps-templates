#!/usr/bin/env python3
"""FlightSafety workspace bootstrap orchestrator.

Creates resources that DABs don't natively support:
catalog, Genie space, KA endpoint, MAS endpoint.
Writes resulting IDs to .bundle-config/ids.env, renders app.yaml.

Run: python scripts/bootstrap_workspace.py
Idempotent: safe to rerun.
"""

import argparse
import os
import sys
from pathlib import Path

from databricks.sdk import WorkspaceClient

# Defer imports of the per-resource modules so partial failures
# (e.g., missing fpdf2 in env) don't break catalog setup.
from scripts.bootstrap.catalog import ensure_catalog


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", default=os.environ.get("DATABRICKS_CONFIG_PROFILE", "DEFAULT"))
    parser.add_argument("--catalog", default=os.environ.get("FLIGHTSAFETY_CATALOG", "flightsafety_demo"))
    parser.add_argument("--schema", default=os.environ.get("FLIGHTSAFETY_SCHEMA", "core"))
    parser.add_argument("--volume", default=os.environ.get("FLIGHTSAFETY_VOLUME", "simulator_issue_docs"))
    parser.add_argument("--stage", choices=["catalog", "genie", "ka", "mas", "all"], default="all")
    args = parser.parse_args()

    w = WorkspaceClient(profile=args.profile)
    ids: dict[str, str] = {}

    if args.stage in ("catalog", "all"):
        ensure_catalog(w, args.catalog)

    if args.stage in ("genie", "all"):
        from scripts.bootstrap.genie import ensure_genie_space
        ids["GENIE_SPACE_ID"] = ensure_genie_space(w, args.catalog, args.schema)

    if args.stage in ("ka", "all"):
        from scripts.bootstrap.ka import ensure_ka_endpoint
        ids["KA_ENDPOINT_NAME"] = ensure_ka_endpoint(w, args.catalog, args.schema, args.volume)

    if args.stage in ("mas", "all"):
        from scripts.bootstrap.mas import ensure_mas_endpoint
        ids["MAS_ENDPOINT_NAME"] = ensure_mas_endpoint(
            w,
            genie_space_id=ids.get("GENIE_SPACE_ID") or os.environ.get("GENIE_SPACE_ID", ""),
            ka_endpoint_name=ids.get("KA_ENDPOINT_NAME") or os.environ.get("KA_ENDPOINT_NAME", ""),
        )

    if ids:
        write_ids_env(ids)
        render_app_yaml(ids)

    print("\n[bootstrap] done. IDs written to .bundle-config/ids.env")
    return 0


def write_ids_env(ids: dict[str, str]) -> None:
    out = Path(".bundle-config/ids.env")
    out.parent.mkdir(exist_ok=True)
    existing = {}
    if out.exists():
        for line in out.read_text().splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                existing[k] = v
    existing.update(ids)
    out.write_text("\n".join(f"{k}={v}" for k, v in existing.items()) + "\n")
    print(f"[bootstrap] wrote {len(ids)} ID(s) to {out}")


def render_app_yaml(ids: dict[str, str]) -> None:
    from scripts.bootstrap.render_app_yaml import render
    render(ids)


if __name__ == "__main__":
    sys.exit(main())

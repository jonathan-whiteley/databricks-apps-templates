"""Idempotent Unity Catalog creation."""

from databricks.sdk import WorkspaceClient
from databricks.sdk.errors import NotFound


def ensure_catalog(w: WorkspaceClient, name: str) -> str:
    """Create catalog if missing. Returns catalog name."""
    try:
        w.catalogs.get(name)
        print(f"[catalog] {name} already exists")
    except NotFound:
        w.catalogs.create(name=name, comment="FlightSafety demo catalog")
        print(f"[catalog] created {name}")
    return name

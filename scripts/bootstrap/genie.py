"""Idempotent Genie space creation for FlightSafety demo."""

from databricks.sdk import WorkspaceClient

GENIE_TITLE = "FlightSafety Simulator Operations"
GENIE_DESCRIPTION = (
    "Natural language queries over simulator session and capacity fact tables "
    "for the FlightSafety operations demo."
)


def ensure_genie_space(w: WorkspaceClient, catalog: str, schema: str) -> str:
    """Create or find the Genie space. Returns space_id."""
    existing = find_existing(w)
    if existing:
        print(f"[genie] reusing existing space {existing}")
        return existing

    space_id = create_space(w, catalog, schema)
    print(f"[genie] created space {space_id}")
    return space_id


def find_existing(w: WorkspaceClient) -> str | None:
    """Look up by title via REST. Returns space_id or None."""
    resp = w.api_client.do("GET", "/api/2.0/genie/spaces", query={"page_size": 100})
    for space in resp.get("spaces", []):
        if space.get("title") == GENIE_TITLE:
            return space["space_id"]
    return None


def create_space(w: WorkspaceClient, catalog: str, schema: str) -> str:
    """POST a new Genie space scoped to the FlightSafety tables."""
    body = {
        "title": GENIE_TITLE,
        "description": GENIE_DESCRIPTION,
        "tables": [
            {"catalog": catalog, "schema": schema, "table": "fact_simulator_sessions"},
            {"catalog": catalog, "schema": schema, "table": "fact_simulator_capacity"},
        ],
    }
    resp = w.api_client.do("POST", "/api/2.0/genie/spaces", body=body)
    return resp["space_id"]

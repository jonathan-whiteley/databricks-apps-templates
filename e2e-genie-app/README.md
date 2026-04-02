# LCE Genie E2E Chat Application

A production-ready chat application for interacting with Databricks Genie Spaces via Multi-Agent Supervisor (MAS) endpoints. Built with ExpressJS, React, Vercel AI SDK, and Databricks authentication, with optional Lakebase (database) integration.

## Features

- **Genie Space Integration**: Chat with Databricks Genie Spaces through MAS serving endpoints
- **Stop / Cancel Query**: Users can cancel in-flight Genie queries
- **Collapsible Tables**: Query results render as collapsible, scrollable tables
- **Message Feedback**: Thumbs-up/down feedback with Genie monitoring integration
- **OAuth Error Handling**: Graceful handling of OAuth token expiration and re-authentication
- **On-Behalf-Of (OBO) Authentication**: Uses the end user's identity for Genie API calls
- **Persistent Chat History (Optional)**: Databricks Lakebase (Postgres) storage with governance

## Prerequisites

1. **Databricks serving endpoint**: Access to a workspace with a MAS endpoint configured for your Genie Space.
2. **Databricks CLI authentication**:
   ```bash
   brew install databricks && brew upgrade databricks
   export DATABRICKS_CONFIG_PROFILE='chatbot_template'
   databricks auth login --profile "$DATABRICKS_CONFIG_PROFILE"
   ```

## Deployment

This project uses a [Databricks Asset Bundle (DAB)](https://docs.databricks.com/aws/en/dev-tools/bundles/apps-tutorial) for deployment.

1. **Update `databricks.yml`**: Set `serving_endpoint_name` and `genie_space_id` defaults. Optionally adjust `database_instance_name`.

2. **Validate and deploy**:
   ```bash
   databricks bundle validate
   databricks bundle deploy
   databricks bundle run databricks_chatbot
   ```

3. **View status**:
   ```bash
   databricks bundle summary
   ```

### Deployment Targets

| Target    | Command                                  |
|-----------|------------------------------------------|
| dev       | `databricks bundle deploy` (default)     |
| staging   | `databricks bundle deploy -t staging`    |
| prod      | `databricks bundle deploy -t prod`       |

## Running Locally

**Deploy first** (see above) to provision the database instance and permissions.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `DATABRICKS_CONFIG_PROFILE`, `DATABRICKS_SERVING_ENDPOINT`, `GENIE_SPACE_ID`, and database variables (see `.env.example` for details).

3. **Start the app**:
   ```bash
   npm run dev
   ```
   Opens on [localhost:3000](http://localhost:3000).

### Database Modes

- **Persistent** (default when DB env vars are set): Chats saved to Lakebase, history in sidebar.
- **Ephemeral** (no DB env vars): Chats work but are not persisted.

## Testing

```bash
npm test                              # All tests
npx playwright test --ui              # UI mode
npx playwright test --headed --project=e2e  # Headed E2E
```

## Troubleshooting

### "reference does not exist" errors
Update the Databricks CLI: `brew upgrade databricks`

### "Resource not found" errors during deploy
Inspect with `databricks bundle summary`. If resources were manually deleted, run `databricks bundle unbind <resource-name>`.

## Known Limitations

- No multi-modal input support (images, etc.)
- Auth: Databricks CLI (local) and service principal (production) only
- One database per app (fixed `ai_chatbot` schema)

# LCE Enhancements Design Spec

**Branch**: `feature/lce-enhancements` (from `lce`)
**Date**: 2026-04-01
**Scope**: 4 features — stop/kill query, collapsible tables, message feedback, OAuth error handling

---

## Feature 1: Stop/Kill Query

### Problem
The Stop button currently aborts the client-side SSE stream but does not cancel the underlying SQL query running on Databricks. The Genie agent continues processing (and the SQL warehouse continues executing) even after the user stops.

### Design

**Architecture**: Explicit server-side cancel endpoint + client-side abort.

#### Backend

**New endpoint**: `POST /api/chat/:id/cancel`
- Authenticated via `requireAuth` middleware
- Looks up the active `AbortController` for the chat from `StreamCache`
- Calls `controller.abort()` which propagates through `streamText()` to the Databricks fetch, closing the HTTP connection
- Clears the stream from cache
- Saves partial assistant message to DB (so it persists in history)
- Returns `{ cancelled: true }`

**StreamCache changes** (`packages/core/src/stream-cache.ts`):
- Add `abortController` field to `CachedStream` interface
- `storeStream()` accepts and stores an `AbortController`
- New `abortStream(chatId)` method: calls `controller.abort()`, clears cache

**Chat route changes** (`server/src/routes/chat.ts`):
- Create an `AbortController` before calling `streamText()`
- Pass `abortSignal: controller.signal` to `streamText()` options
- Pass the controller to `streamCache.storeStream()`

#### Frontend

**chat.tsx changes**:
- `stop()` callback now also fires `POST /api/chat/:id/cancel` (fire-and-forget, no await needed)
- Track `isCancelled` state: set to `true` when user clicks stop while status is `streaming` or `submitted`

**multimodal-input.tsx**: No changes needed — StopButton already calls `stop()`.

**message.tsx changes**:
- Accept `cancelledMessageIds: Set<string>` prop (passed from Chat)
- When rendering an assistant message whose ID is in the cancelled set, show a "Response cancelled" badge below the message content
- Badge: amber/orange background, warning icon, text "Response cancelled"

**tool.tsx changes**:
- Add `'cancelled'` to `ToolState` type
- Add cancelled state styling: amber background, stop icon, "Cancelled" label
- When a tool is in `input-available` state (running) and the message is cancelled, show as cancelled

### Behaviour
1. User clicks Stop while agent is streaming
2. Frontend calls `abort()` (kills SSE) and `POST /api/chat/:id/cancel` in parallel
3. Backend aborts the `streamText()` call, which closes the fetch to Databricks
4. Databricks agent detects disconnection, SQL query is cancelled
5. Backend saves partial message, clears stream cache
6. Frontend shows partial content + "Response cancelled" badge
7. Chat returns to `ready` state, user can send new message

---

## Feature 2: Collapsible Long Tables

### Problem
Genie SQL results with many rows render fully inline, making the chat scroll excessively long and hard to navigate.

### Design

**New component**: `client/src/components/elements/collapsible-table.tsx`

#### Props
```typescript
interface CollapsibleTableProps {
  children: ReactNode;       // The tool output content (may contain HTML tables)
  previewRows?: number;      // Rows to show in preview (default: 5)
  collapseThreshold?: number; // Min rows to trigger collapse (default: 10)
  maxExpandedHeight?: number; // Max height when expanded in px (default: 400)
}
```

#### Logic
1. Render children into a ref'd container
2. After mount, query for `<table>` elements within the container
3. For each table, count `<tbody> tr` elements
4. If row count > `collapseThreshold`:
   - Hide rows beyond `previewRows`
   - Add a fade gradient overlay at the bottom of the preview
   - Show "Show all N rows" button below
5. On expand:
   - Wrap table in a scrollable container (`max-height: 400px`, `overflow-y: auto`)
   - Make `<thead>` sticky (`position: sticky; top: 0`)
   - Show all rows with zebra striping
   - Change button to "Collapse to 5 rows"
6. On collapse: return to preview state

#### Integration
In `message.tsx`, wrap the tool output content with `<CollapsibleTable>`:

```tsx
// In the regular tool call render (line ~308)
<ToolOutput
  output={
    <CollapsibleTable>
      <div className="whitespace-pre-wrap font-mono text-sm">
        {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
      </div>
    </CollapsibleTable>
  }
/>
```

Same wrapping for MCP tool output (~line 277).

#### Edge Cases
- Non-table content: passes through unchanged (no table detected)
- Tables with ≤ 10 rows: rendered as-is, no collapse
- Multiple tables in one output: each independently collapsible
- Empty tables: passes through unchanged

---

## Feature 3: Message Feedback

### Problem
No way for users to provide quality feedback on assistant responses. The upstream template has this feature but it's missing from the LCE branch.

### Design

Port from upstream `e2e-chatbot-app-next` with LCE adaptations.

#### Database

**New table**: `vote` in `ai_chatbot` schema

```sql
CREATE TABLE ai_chatbot.vote (
  chat_id UUID NOT NULL REFERENCES ai_chatbot.chat(id),
  message_id UUID NOT NULL,
  is_upvoted BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (chat_id, message_id)
);
```

Migration generated via `npm run db:generate` after adding to `packages/db/src/schema.ts`.

#### Backend

**New route file**: `server/src/routes/feedback.ts`

- `POST /api/feedback` — upsert a vote for a message
  - Body: `{ chatId, messageId, isUpvoted }`
  - Auth: `requireAuth`
  - Validates user owns the chat
  - Upserts into `vote` table (ON CONFLICT update `is_upvoted`)
  - Optional: log to MLflow experiment if configured

- `GET /api/feedback/chat/:chatId` — get all votes for a chat
  - Auth: `requireAuth` + chat access check
  - Returns array of `{ messageId, isUpvoted }`

Register routes in `server/src/index.ts`.

#### Frontend

**message-actions.tsx changes**:
- Add thumbs up/down buttons for assistant messages (after Copy button)
- Buttons show filled icon when voted, outline when not
- Click toggles vote state and calls `POST /api/feedback`
- Only visible when `feedbackEnabled` config flag is true

**Config**: Add `feedback: isDatabaseAvailable()` to `/api/config` response.

**New hook**: `useFeedback(chatId)` — fetches votes for a chat, provides `submitVote()` mutation.

---

## Feature 4: OAuth Error Handling

### Problem
When Genie requires OBO (On-Behalf-Of) authentication and the user hasn't granted consent, the error displays as a generic error message. The upstream template has a dedicated component for this.

### Design

#### New Component

**`client/src/components/message-oauth-error.tsx`**

Renders a card-style error with:
- Shield/lock icon
- "Authentication Required" heading
- Explanation that the app needs permission to query on the user's behalf
- List of missing OAuth scopes (if available)
- "Grant Access" button linking to the OAuth consent flow (or instructions)

#### Config Enhancement

**`server/src/routes/config.ts`** changes:
- Extract JWT from session when available
- Parse token to detect granted scopes
- Compare against required scopes (e.g., `sql`, `unity-catalog`)
- Return `missingScopes: string[]` in config response
- Return `oboEnabled: boolean` flag

#### Integration

**`message.tsx`** or **`message-error.tsx`** changes:
- When rendering `data-error` parts, check if error string contains OAuth-related patterns (e.g., "OAuth", "consent", "unauthorized", "credential")
- If detected, render `<MessageOAuthError>` instead of generic `<MessageError>`
- Pass `missingScopes` from config context if available

---

## Files Changed Summary

### New Files
| File | Feature |
|------|---------|
| `client/src/components/elements/collapsible-table.tsx` | 2 |
| `server/src/routes/feedback.ts` | 3 |
| `client/src/hooks/use-feedback.ts` | 3 |
| `client/src/components/message-oauth-error.tsx` | 4 |

### Modified Files
| File | Features |
|------|----------|
| `packages/core/src/stream-cache.ts` | 1 |
| `server/src/routes/chat.ts` | 1 |
| `client/src/components/chat.tsx` | 1 |
| `client/src/components/message.tsx` | 1, 2, 4 |
| `client/src/components/elements/tool.tsx` | 1 |
| `client/src/components/message-actions.tsx` | 3 |
| `server/src/routes/config.ts` | 3, 4 |
| `server/src/index.ts` | 1, 3 |
| `packages/db/src/schema.ts` | 3 |
| `packages/db/src/queries.ts` | 3 |

### Migration Files
| File | Feature |
|------|---------|
| `packages/db/migrations/XXXX_add_vote_table.sql` | 3 |

---

## Testing Strategy

- **Feature 1**: E2E test — send message, click stop during streaming, verify "Cancelled" badge appears and chat returns to ready state. Unit test the cancel endpoint.
- **Feature 2**: Unit test `CollapsibleTable` with various row counts (0, 5, 10, 11, 100). Verify collapse/expand toggle. Verify non-table content passes through.
- **Feature 3**: Route tests for feedback CRUD. E2E test — send message, click thumbs up, verify vote persists on reload.
- **Feature 4**: Unit test OAuth error detection regex. E2E test — mock an OAuth error response, verify dedicated error card renders.

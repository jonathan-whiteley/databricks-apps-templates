# LCE Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stop/kill query, collapsible long tables, message feedback, and OAuth error handling to the LCE Genie chatbot app.

**Architecture:** Four independent features implemented on a `feature/lce-enhancements` branch from `lce`. Feature 1 adds server-side query cancellation via AbortController stored in StreamCache. Feature 2 adds a CollapsibleTable component that wraps tool output. Feature 3 ports the upstream feedback system (DB + routes + UI). Feature 4 ports upstream OAuth error handling.

**Tech Stack:** React 18, TypeScript, Express 5, Vercel AI SDK, Drizzle ORM, PostgreSQL, Tailwind CSS, Radix UI, Playwright

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `client/src/components/elements/collapsible-table.tsx` | Table collapse/expand UI with row-aware rendering |
| `client/src/components/elements/cancelled-badge.tsx` | "Response cancelled" indicator badge |
| `server/src/routes/feedback.ts` | Feedback CRUD routes (POST upsert, GET by chat) |
| `client/src/hooks/use-feedback.ts` | Client hook for fetching/submitting feedback |
| `client/src/components/message-oauth-error.tsx` | Dedicated OAuth error display card |

### Modified Files
| File | Changes |
|------|---------|
| `packages/core/src/stream-cache.ts` | Store AbortController, add `abortStream()` method |
| `server/src/routes/chat.ts` | Create AbortController, pass to streamText + StreamCache, new cancel endpoint |
| `client/src/components/chat.tsx` | Track cancelled message IDs, call cancel endpoint on stop |
| `client/src/components/message.tsx` | Show cancelled badge, wrap tool output with CollapsibleTable |
| `client/src/components/elements/tool.tsx` | Add 'cancelled' to ToolState |
| `client/src/components/message-actions.tsx` | Add feedback thumbs up/down buttons |
| `client/src/contexts/AppConfigContext.tsx` | Add `feedbackEnabled` flag |
| `server/src/routes/config.ts` | Add `feedback` feature flag |
| `server/src/index.ts` | Register feedback routes |
| `packages/db/src/schema.ts` | Add `vote` table |
| `packages/db/src/queries.ts` | Add vote query helpers |
| `packages/db/src/index.ts` | Re-export vote queries |

---

### Task 0: Create Feature Branch

**Files:**
- None (git only)

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout lce
git checkout -b feature/lce-enhancements
```

- [ ] **Step 2: Verify branch**

Run: `git branch --show-current`
Expected: `feature/lce-enhancements`

---

### Task 1: StreamCache — Store AbortController

**Files:**
- Modify: `packages/core/src/stream-cache.ts`

- [ ] **Step 1: Add abortController to CachedStream interface and storeStream**

In `packages/core/src/stream-cache.ts`, update the `CachedStream` interface to include an optional `AbortController`, update `storeStream` to accept and store it, and add an `abortStream` method:

```typescript
// Update the CachedStream interface (line 13)
interface CachedStream {
  chatId: string;
  streamId: string;
  cache: CacheableStream<string>;
  abortController?: AbortController;
  createdAt: number;
  lastAccessedAt: number;
}
```

Update `storeStream` method signature to accept `abortController`:

```typescript
storeStream({
  streamId,
  chatId,
  stream,
  abortController,
}: {
  streamId: string;
  chatId: string;
  stream: ReadableStream<string>;
  abortController?: AbortController;
}) {
  console.log('[StreamCache] storeStream', streamId, chatId);
  this.activeStreams.set(chatId, streamId);
  const entry = {
    chatId,
    streamId,
    abortController,
    cache: makeCacheableStream({
      source: stream,
      onPush: () => {
        entry.lastAccessedAt = Date.now();
      },
    }),
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  };
  this.cache.set(streamId, entry);
}
```

Add `abortStream` method after `clearActiveStream`:

```typescript
/**
 * Abort an active stream for a chat (cancels the underlying request)
 */
abortStream(chatId: string): boolean {
  const streamId = this.activeStreams.get(chatId);
  if (!streamId) return false;

  const entry = this.cache.get(streamId);
  if (!entry?.abortController) return false;

  console.log(`[StreamCache] Aborting stream ${streamId} for chat ${chatId}`);
  entry.abortController.abort('SERVER_CANCEL');
  this.clearActiveStream(chatId);
  return true;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build --workspace=@chat-template/core`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/stream-cache.ts
git commit -m "feat: add AbortController storage and abortStream to StreamCache"
```

---

### Task 2: Backend Cancel Endpoint + AbortController Plumbing

**Files:**
- Modify: `server/src/routes/chat.ts`

- [ ] **Step 1: Create AbortController and pass signal to streamText**

In `server/src/routes/chat.ts`, add an AbortController before the `streamText` call (around line 206). Replace lines 206-219:

```typescript
    // Create abort controller for server-side cancellation
    const abortController = new AbortController();

    // Pass session to provider for OBO authentication
    const model = await myProvider.languageModel(selectedChatModel, session);
    const result = streamText({
      model,
      messages: convertToModelMessages(uiMessages),
      abortSignal: abortController.signal,
      onFinish: ({ usage }) => {
        finalUsage = usage;
      },
      tools: {
        [DATABRICKS_TOOL_CALL_ID]: DATABRICKS_TOOL_DEFINITION,
      },
    });
```

- [ ] **Step 2: Pass abortController to streamCache.storeStream**

Update the `consumeSseStream` call (around line 282) to pass the abort controller:

```typescript
    pipeUIMessageStreamToResponse({
      stream,
      response: res,
      consumeSseStream({ stream }) {
        streamCache.storeStream({
          streamId,
          chatId: id,
          stream,
          abortController,
        });
      },
    });
```

- [ ] **Step 3: Add POST cancel endpoint**

Add the cancel route after the PATCH visibility route (before the `generateTitleFromUserMessage` helper, around line 445):

```typescript
/**
 * POST /api/chat/:id/cancel - Cancel an active stream
 */
chatRouter.post(
  '/:id/cancel',
  [requireAuth],
  async (req: Request, res: Response) => {
    const { id: chatId } = req.params;

    console.log(`[Chat Cancel] Cancel request for chat ${chatId}`);

    const aborted = streamCache.abortStream(chatId);

    if (aborted) {
      console.log(`[Chat Cancel] Successfully cancelled stream for chat ${chatId}`);
      return res.status(200).json({ cancelled: true });
    }

    console.log(`[Chat Cancel] No active stream to cancel for chat ${chatId}`);
    return res.status(200).json({ cancelled: false });
  },
);
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@databricks/chatbot-server`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/chat.ts
git commit -m "feat: add server-side cancel endpoint with AbortController propagation"
```

---

### Task 3: Frontend — Cancel on Stop + Cancelled Badge

**Files:**
- Create: `client/src/components/elements/cancelled-badge.tsx`
- Modify: `client/src/components/chat.tsx`
- Modify: `client/src/components/elements/tool.tsx`
- Modify: `client/src/components/message.tsx`

- [ ] **Step 1: Create CancelledBadge component**

Create `client/src/components/elements/cancelled-badge.tsx`:

```tsx
import { AlertTriangleIcon } from 'lucide-react';

export function CancelledBadge() {
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      <AlertTriangleIcon className="size-3" />
      <span>Response cancelled</span>
    </div>
  );
}
```

- [ ] **Step 2: Add 'cancelled' to ToolState in tool.tsx**

In `client/src/components/elements/tool.tsx`, update the `ToolState` type (line 24):

```typescript
export type ToolState =
  | ToolUIPart['state']
  | 'awaiting-approval'
  | 'approved'
  | 'denied'
  | 'cancelled';
```

Add entries in the `labels`, `icons`, and `variants` objects inside `ToolStatusBadge`:

In `labels` (add after `denied: 'Denied'`):
```typescript
    cancelled: 'Cancelled',
```

In `icons` (add after `denied`):
```typescript
    cancelled: <XCircleIcon className="size-3" />,
```

In `variants` (add after `denied`):
```typescript
    cancelled:
      'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
```

Also add `StopCircleIcon` to the lucide-react import:
```typescript
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  StopCircleIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
```

Note: We use `XCircleIcon` (already imported) for the cancelled state icon to keep it consistent with errors but in amber styling.

- [ ] **Step 3: Update chat.tsx to track cancelled messages and call cancel endpoint**

In `client/src/components/chat.tsx`:

Add `cancelledMessageIds` state after the `lastPart` state declarations (around line 62):

```typescript
  const [cancelledMessageIds, setCancelledMessageIds] = useState<Set<string>>(
    new Set(),
  );
```

Replace the `stop` callback (lines 83-85) to also call the cancel endpoint:

```typescript
  const stop = useCallback(() => {
    // Track the current assistant message as cancelled
    const lastMessage = messages.at(-1);
    if (lastMessage?.role === 'assistant') {
      setCancelledMessageIds((prev) => new Set(prev).add(lastMessage.id));
    }

    // Abort client-side stream
    abortController.current?.abort('USER_ABORT_SIGNAL');

    // Fire-and-forget server-side cancel
    fetch(`/api/chat/${id}/cancel`, { method: 'POST' }).catch(() => {});
  }, [id, messages]);
```

Pass `cancelledMessageIds` to `Messages` component (around line 256):

```tsx
        <Messages
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setMessages}
          addToolResult={addToolResult}
          sendMessage={sendMessage}
          regenerate={regenerate}
          isReadonly={isReadonly}
          selectedModelId={initialChatModel}
          cancelledMessageIds={cancelledMessageIds}
        />
```

- [ ] **Step 4: Update Messages component to pass cancelledMessageIds through**

In `client/src/components/messages.tsx`, add `cancelledMessageIds` to the props interface and pass it to each `PreviewMessage`. Find the `PreviewMessage` render and add the prop. (The exact changes depend on the file, but the prop is: `cancelledMessageIds: Set<string>`)

- [ ] **Step 5: Update message.tsx to show cancelled badge and tool state**

In `client/src/components/message.tsx`:

Add import for CancelledBadge at the top:

```typescript
import { CancelledBadge } from './elements/cancelled-badge';
```

Add `cancelledMessageIds` to `PurePreviewMessage` props (around line 47):

```typescript
const PurePreviewMessage = ({
  message,
  isLoading,
  setMessages,
  addToolResult,
  sendMessage,
  regenerate,
  isReadonly,
  requiresScrollPadding,
  cancelledMessageIds,
}: {
  // ... existing props ...
  cancelledMessageIds?: Set<string>;
}) => {
```

Add a derived boolean inside the component:

```typescript
  const isCancelled = cancelledMessageIds?.has(message.id) ?? false;
```

For regular tool calls (around line 300), override the tool state when cancelled:

```typescript
              // Render regular tool calls
              const displayState: ToolState =
                isCancelled && effectiveState === 'input-available'
                  ? 'cancelled'
                  : effectiveState;

              return (
                <Tool key={toolCallId} defaultOpen={true}>
                  <ToolHeader
                    type={toolName || 'tool-call'}
                    state={displayState}
                  />
```

Do the same for MCP tool calls (around line 247).

After the `MessageActions` section (around line 357), add the cancelled badge:

```tsx
          {isCancelled && message.role === 'assistant' && <CancelledBadge />}
```

Update the memo comparison (around line 375) to include cancelledMessageIds:

```typescript
export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (prevProps.cancelledMessageIds !== nextProps.cancelledMessageIds)
      return false;

    return false;
  },
);
```

- [ ] **Step 6: Verify build**

Run: `npm run build:client`
Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/elements/cancelled-badge.tsx client/src/components/elements/tool.tsx client/src/components/chat.tsx client/src/components/messages.tsx client/src/components/message.tsx
git commit -m "feat: show cancelled badge and call server cancel on stop"
```

---

### Task 4: CollapsibleTable Component

**Files:**
- Create: `client/src/components/elements/collapsible-table.tsx`
- Modify: `client/src/components/message.tsx`

- [ ] **Step 1: Create CollapsibleTable component**

Create `client/src/components/elements/collapsible-table.tsx`:

```tsx
import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface CollapsibleTableProps {
  children: ReactNode;
  previewRows?: number;
  collapseThreshold?: number;
  maxExpandedHeight?: number;
}

export function CollapsibleTable({
  children,
  previewRows = 5,
  collapseThreshold = 10,
  maxExpandedHeight = 400,
}: CollapsibleTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tableInfo, setTableInfo] = useState<{
    rowCount: number;
    hasTable: boolean;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const table = containerRef.current.querySelector('table');
    if (!table) {
      setTableInfo({ rowCount: 0, hasTable: false });
      return;
    }

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');
    setTableInfo({ rowCount: rows.length, hasTable: true });
  }, [children]);

  const shouldCollapse =
    tableInfo?.hasTable && tableInfo.rowCount > collapseThreshold;

  // Apply row hiding via CSS when collapsed
  useEffect(() => {
    if (!containerRef.current || !shouldCollapse) return;

    const table = containerRef.current.querySelector('table');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = tbody
      ? tbody.querySelectorAll('tr')
      : table.querySelectorAll('tr');

    rows.forEach((row, index) => {
      if (isExpanded) {
        (row as HTMLElement).style.display = '';
      } else {
        (row as HTMLElement).style.display =
          index < previewRows ? '' : 'none';
      }
    });
  }, [isExpanded, shouldCollapse, previewRows]);

  if (!shouldCollapse) {
    return <div ref={containerRef}>{children}</div>;
  }

  return (
    <div>
      <div
        ref={containerRef}
        className={isExpanded ? 'overflow-y-auto' : 'relative'}
        style={isExpanded ? { maxHeight: maxExpandedHeight } : undefined}
      >
        {children}
        {!isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/50 to-transparent" />
        )}
      </div>
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="size-3" />
              Collapse to {previewRows} rows
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-3" />
              Show all {tableInfo?.rowCount} rows
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wrap tool output in message.tsx with CollapsibleTable**

In `client/src/components/message.tsx`, add import at top:

```typescript
import { CollapsibleTable } from './elements/collapsible-table';
```

Replace the regular tool output rendering (around line 308) — wrap the output content:

```tsx
                    {state === 'output-available' && (
                      <ToolOutput
                        output={
                          errorText ? (
                            <div className="rounded border p-2 text-red-500">
                              Error: {errorText}
                            </div>
                          ) : (
                            <CollapsibleTable>
                              <div className="whitespace-pre-wrap font-mono text-sm">
                                {typeof output === 'string'
                                  ? output
                                  : JSON.stringify(output, null, 2)}
                              </div>
                            </CollapsibleTable>
                          )
                        }
                        errorText={undefined}
                      />
                    )}
```

Do the same for MCP tool output (around line 275):

```tsx
                      {state === 'output-available' &&
                        !isApprovalStatusOutput(output) && (
                          <ToolOutput
                            output={
                              errorText ? (
                                <div className="rounded border p-2 text-red-500">
                                  Error: {errorText}
                                </div>
                              ) : (
                                <CollapsibleTable>
                                  <div className="whitespace-pre-wrap font-mono text-sm">
                                    {typeof output === 'string'
                                      ? output
                                      : JSON.stringify(output, null, 2)}
                                  </div>
                                </CollapsibleTable>
                              )
                            }
                            errorText={undefined}
                          />
                        )}
```

- [ ] **Step 3: Add sticky thead styles**

In `client/src/components/elements/collapsible-table.tsx`, update the expanded container class to make table headers sticky:

The container div when expanded already has `overflow-y-auto`. Add a CSS class for sticky headers in the style block. Update the expanded container:

```tsx
        className={
          isExpanded
            ? 'overflow-y-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-muted'
            : 'relative'
        }
```

- [ ] **Step 4: Verify build**

Run: `npm run build:client`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/elements/collapsible-table.tsx client/src/components/message.tsx
git commit -m "feat: add collapsible table component for long SQL results"
```

---

### Task 5: Vote Table Schema + Migration

**Files:**
- Modify: `packages/db/src/schema.ts`

- [ ] **Step 1: Add vote table to schema**

In `packages/db/src/schema.ts`, add the vote table after the `message` table definition (after line 53):

```typescript
export const vote = createTable('Vote', {
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  messageId: uuid('messageId').notNull(),
  isUpvoted: varchar('isUpvoted', { enum: ['up', 'down'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  {
    name: 'vote_pk',
    columns: [table.chatId, table.messageId],
    primaryKey: true,
  },
]);

export type Vote = InferSelectModel<typeof vote>;
```

Note: Drizzle doesn't support composite PKs directly in the table builder. Use a unique index + primary key constraint instead. Actually, the simplest approach with Drizzle is:

```typescript
import {
  varchar,
  timestamp,
  json,
  jsonb,
  uuid,
  text,
  pgSchema,
  primaryKey,
} from 'drizzle-orm/pg-core';
```

Then:

```typescript
export const vote = createTable('Vote', {
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  messageId: uuid('messageId').notNull(),
  isUpvoted: varchar('isUpvoted', { enum: ['up', 'down'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.chatId, table.messageId] }),
]);

export type Vote = InferSelectModel<typeof vote>;
```

- [ ] **Step 2: Generate migration**

Run: `npm run db:generate`
Expected: A new SQL migration file is created in `packages/db/migrations/` that creates the `Vote` table.

- [ ] **Step 3: Review migration file**

Read the generated SQL file and verify it creates the `ai_chatbot.Vote` table with correct columns and composite primary key.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/schema.ts packages/db/migrations/
git commit -m "feat: add Vote table schema and migration for message feedback"
```

---

### Task 6: Vote Query Helpers

**Files:**
- Modify: `packages/db/src/queries.ts`
- Modify: `packages/db/src/index.ts`

- [ ] **Step 1: Add vote query helpers to queries.ts**

In `packages/db/src/queries.ts`, add import for `vote` schema at the top (line 16):

```typescript
import { chat, message, vote, type DBMessage, type Chat } from './schema';
```

Add vote query functions at the bottom of the file (after `updateChatLastContextById`):

```typescript
export async function getVotesByChatId({ chatId }: { chatId: string }) {
  if (!isDatabaseAvailable()) {
    console.log('[getVotesByChatId] Database not available, returning empty');
    return [];
  }

  try {
    return await (await ensureDb())
      .select()
      .from(vote)
      .where(eq(vote.chatId, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function upsertVote({
  chatId,
  messageId,
  isUpvoted,
}: {
  chatId: string;
  messageId: string;
  isUpvoted: 'up' | 'down';
}) {
  if (!isDatabaseAvailable()) {
    console.log('[upsertVote] Database not available, skipping persistence');
    return;
  }

  try {
    return await (await ensureDb())
      .insert(vote)
      .values({
        chatId,
        messageId,
        isUpvoted,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [vote.chatId, vote.messageId],
        set: {
          isUpvoted: sql`excluded."isUpvoted"`,
        },
      });
  } catch (_error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to upsert vote',
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build --workspace=@chat-template/db`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/queries.ts
git commit -m "feat: add vote query helpers (getVotesByChatId, upsertVote)"
```

---

### Task 7: Feedback Backend Routes

**Files:**
- Create: `server/src/routes/feedback.ts`
- Modify: `server/src/index.ts`
- Modify: `server/src/routes/config.ts`

- [ ] **Step 1: Create feedback route**

Create `server/src/routes/feedback.ts`:

```typescript
import {
  Router,
  type Request,
  type Response,
  type Router as RouterType,
} from 'express';
import {
  authMiddleware,
  requireAuth,
} from '../middleware/auth';
import {
  getVotesByChatId,
  upsertVote,
  isDatabaseAvailable,
} from '@chat-template/db';
import { checkChatAccess } from '@chat-template/core';
import { ChatSDKError } from '@chat-template/core/errors';

export const feedbackRouter: RouterType = Router();
feedbackRouter.use(authMiddleware);

/**
 * POST /api/feedback - Submit feedback for a message
 */
feedbackRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { chatId, messageId, isUpvoted } = req.body;

    if (!chatId || !messageId || !isUpvoted) {
      const error = new ChatSDKError('bad_request:api');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    if (!['up', 'down'].includes(isUpvoted)) {
      const error = new ChatSDKError('bad_request:api');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    const { allowed } = await checkChatAccess(chatId, req.session?.user.id);
    if (!allowed) {
      const error = new ChatSDKError('forbidden:chat');
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }

    await upsertVote({ chatId, messageId, isUpvoted });
    return res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      const response = error.toResponse();
      return res.status(response.status).json(response.json);
    }
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/feedback/chat/:chatId - Get feedback for a chat
 */
feedbackRouter.get(
  '/chat/:chatId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params;

      const { allowed } = await checkChatAccess(chatId, req.session?.user.id);
      if (!allowed) {
        const error = new ChatSDKError('forbidden:chat');
        const response = error.toResponse();
        return res.status(response.status).json(response.json);
      }

      const votes = await getVotesByChatId({ chatId });
      return res.status(200).json(votes);
    } catch (error) {
      if (error instanceof ChatSDKError) {
        const response = error.toResponse();
        return res.status(response.status).json(response.json);
      }
      console.error('Error getting feedback:', error);
      return res.status(500).json({ error: 'Failed to get feedback' });
    }
  },
);
```

- [ ] **Step 2: Register feedback routes in index.ts**

In `server/src/index.ts`, add import (after line 18):

```typescript
import { feedbackRouter } from './routes/feedback';
```

Add route registration (after line 56):

```typescript
app.use('/api/feedback', feedbackRouter);
```

- [ ] **Step 3: Add feedback feature flag to config route**

In `server/src/routes/config.ts`, update the response:

```typescript
configRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    features: {
      chatHistory: isDatabaseAvailable(),
      feedback: isDatabaseAvailable(),
    },
  });
});
```

- [ ] **Step 4: Verify build**

Run: `npm run build --workspace=@databricks/chatbot-server`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/feedback.ts server/src/index.ts server/src/routes/config.ts
git commit -m "feat: add feedback routes and feature flag"
```

---

### Task 8: Feedback Frontend — Hook + UI

**Files:**
- Create: `client/src/hooks/use-feedback.ts`
- Modify: `client/src/contexts/AppConfigContext.tsx`
- Modify: `client/src/components/message-actions.tsx`

- [ ] **Step 1: Update AppConfigContext to include feedback flag**

In `client/src/contexts/AppConfigContext.tsx`, update the `ConfigResponse` interface (line 6):

```typescript
interface ConfigResponse {
  features: {
    chatHistory: boolean;
    feedback: boolean;
  };
}
```

Update `AppConfigContextType` (add after `chatHistoryEnabled`):

```typescript
interface AppConfigContextType {
  config: ConfigResponse | undefined;
  isLoading: boolean;
  error: Error | undefined;
  chatHistoryEnabled: boolean;
  feedbackEnabled: boolean;
}
```

Update the value object in `AppConfigProvider`:

```typescript
  const value: AppConfigContextType = {
    config: data,
    isLoading,
    error,
    chatHistoryEnabled: data?.features.chatHistory ?? true,
    feedbackEnabled: data?.features.feedback ?? false,
  };
```

- [ ] **Step 2: Create useFeedback hook**

Create `client/src/hooks/use-feedback.ts`:

```typescript
import useSWR from 'swr';
import { useCallback } from 'react';
import { fetcher } from '@/lib/utils';
import { useAppConfig } from '@/contexts/AppConfigContext';

interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: 'up' | 'down';
}

export function useFeedback({ chatId }: { chatId: string }) {
  const { feedbackEnabled } = useAppConfig();

  const { data: votes, mutate } = useSWR<Vote[]>(
    feedbackEnabled ? `/api/feedback/chat/${chatId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const submitVote = useCallback(
    async (messageId: string, isUpvoted: 'up' | 'down') => {
      // Optimistic update
      const optimisticVotes = [
        ...(votes?.filter((v) => v.messageId !== messageId) ?? []),
        { chatId, messageId, isUpvoted },
      ];
      mutate(optimisticVotes, false);

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, messageId, isUpvoted }),
        });
        mutate();
      } catch (error) {
        console.error('Failed to submit vote:', error);
        mutate(); // Revert optimistic update
      }
    },
    [chatId, votes, mutate],
  );

  const getVote = useCallback(
    (messageId: string): 'up' | 'down' | undefined => {
      return votes?.find((v) => v.messageId === messageId)?.isUpvoted;
    },
    [votes],
  );

  return { votes, submitVote, getVote, feedbackEnabled };
}
```

- [ ] **Step 3: Add feedback buttons to message-actions.tsx**

In `client/src/components/message-actions.tsx`, add imports:

```typescript
import { ChevronDown, ChevronUp, CopyIcon, PencilLineIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
```

Update `PureMessageActions` props to accept feedback:

```typescript
function PureMessageActions({
  message,
  isLoading,
  setMode,
  errorCount = 0,
  showErrors = false,
  onToggleErrors,
  vote,
  onVote,
  feedbackEnabled = false,
}: {
  message: ChatMessage;
  isLoading: boolean;
  setMode?: (mode: 'view' | 'edit') => void;
  errorCount?: number;
  showErrors?: boolean;
  onToggleErrors?: () => void;
  vote?: 'up' | 'down';
  onVote?: (isUpvoted: 'up' | 'down') => void;
  feedbackEnabled?: boolean;
}) {
```

In the assistant message return block (after the copy action, around line 73), add feedback buttons:

```tsx
  return (
    <Actions className="-ml-0.5">
      {textFromParts && (
        <Action tooltip="Copy" onClick={handleCopy}>
          <CopyIcon />
        </Action>
      )}
      {feedbackEnabled && onVote && (
        <>
          <Action
            tooltip="Good response"
            onClick={() => onVote('up')}
            className={vote === 'up' ? 'text-green-600 dark:text-green-400' : ''}
          >
            <ThumbsUpIcon className={vote === 'up' ? 'fill-current' : ''} />
          </Action>
          <Action
            tooltip="Bad response"
            onClick={() => onVote('down')}
            className={vote === 'down' ? 'text-red-600 dark:text-red-400' : ''}
          >
            <ThumbsDownIcon className={vote === 'down' ? 'fill-current' : ''} />
          </Action>
        </>
      )}
      {errorCount > 0 && onToggleErrors && (
        <Action
          tooltip={showErrors ? 'Hide errors' : 'Show errors'}
          onClick={onToggleErrors}
          iconOnly={false}
        >
          <div className="flex items-center gap-1.5">
            {showErrors ? <ChevronUp /> : <ChevronDown />}
            <span className="text-xs">
              {errorCount} {errorCount === 1 ? 'error' : 'errors'}
            </span>
          </div>
        </Action>
      )}
    </Actions>
  );
```

Update the memo comparison to include `vote` and `feedbackEnabled`:

```typescript
export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.errorCount !== nextProps.errorCount) return false;
    if (prevProps.showErrors !== nextProps.showErrors) return false;
    if (prevProps.vote !== nextProps.vote) return false;
    if (prevProps.feedbackEnabled !== nextProps.feedbackEnabled) return false;

    return true;
  },
);
```

- [ ] **Step 4: Wire feedback into message.tsx**

In `client/src/components/message.tsx`, the `useFeedback` hook needs to be called in the parent (`Messages`) component and passed down. Add `vote` and `onVote` props to `PurePreviewMessage` and pass them to `MessageActions`:

Add to PurePreviewMessage props:
```typescript
  vote?: 'up' | 'down';
  onVote?: (isUpvoted: 'up' | 'down') => void;
  feedbackEnabled?: boolean;
```

Update the `MessageActions` call (around line 348):

```tsx
          {!isReadonly && !hasOnlyErrors && (
            <MessageActions
              key={`action-${message.id}`}
              message={message}
              isLoading={isLoading}
              setMode={setMode}
              errorCount={errorParts.length}
              showErrors={showErrors}
              onToggleErrors={() => setShowErrors(!showErrors)}
              vote={vote}
              onVote={onVote}
              feedbackEnabled={feedbackEnabled}
            />
          )}
```

In the parent `Messages` component (messages.tsx), import and use the `useFeedback` hook, pass `vote` and `onVote` to each `PreviewMessage`.

- [ ] **Step 5: Verify build**

Run: `npm run build:client`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add client/src/hooks/use-feedback.ts client/src/contexts/AppConfigContext.tsx client/src/components/message-actions.tsx client/src/components/message.tsx client/src/components/messages.tsx
git commit -m "feat: add message feedback UI with thumbs up/down"
```

---

### Task 9: OAuth Error Component

**Files:**
- Create: `client/src/components/message-oauth-error.tsx`
- Modify: `client/src/components/message.tsx`

- [ ] **Step 1: Create MessageOAuthError component**

Create `client/src/components/message-oauth-error.tsx`:

```tsx
import { ShieldAlertIcon } from 'lucide-react';

interface MessageOAuthErrorProps {
  error: string;
}

export function MessageOAuthError({ error }: MessageOAuthErrorProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-col gap-2">
        <h4 className="font-medium text-amber-800 text-sm dark:text-amber-200">
          Authentication Required
        </h4>
        <p className="text-amber-700 text-xs dark:text-amber-300">
          This application needs permission to query data on your behalf. Please
          grant access through your Databricks workspace to continue.
        </p>
        <details className="mt-1">
          <summary className="cursor-pointer text-amber-600 text-xs dark:text-amber-400">
            Error details
          </summary>
          <pre className="mt-1 max-h-24 overflow-auto rounded bg-amber-100 p-2 font-mono text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {error}
          </pre>
        </details>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Detect and render OAuth errors in message.tsx**

In `client/src/components/message.tsx`, add import:

```typescript
import { MessageOAuthError } from './message-oauth-error';
```

Add a helper function before the component (or inside it):

```typescript
function isOAuthError(errorText: string): boolean {
  const oauthPatterns = [
    'oauth',
    'consent',
    'unauthorized',
    'credential',
    'token',
    'permission',
    'access_denied',
    'invalid_grant',
  ];
  const lower = errorText.toLowerCase();
  return oauthPatterns.some((pattern) => lower.includes(pattern));
}
```

Update the error rendering section (around line 359):

```tsx
          {errorParts.length > 0 && (hasOnlyErrors || showErrors) && (
            <div className="flex flex-col gap-2">
              {errorParts.map((part, index) =>
                isOAuthError(String(part.data)) ? (
                  <MessageOAuthError
                    key={`error-${message.id}-${index}`}
                    error={String(part.data)}
                  />
                ) : (
                  <MessageError
                    key={`error-${message.id}-${index}`}
                    error={part.data}
                  />
                ),
              )}
            </div>
          )}
```

- [ ] **Step 3: Verify build**

Run: `npm run build:client`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/message-oauth-error.tsx client/src/components/message.tsx
git commit -m "feat: add dedicated OAuth error display component"
```

---

### Task 10: Update Tests

**Files:**
- Modify: `tests/routes/config.test.ts`

- [ ] **Step 1: Update config test to check for feedback flag**

In `tests/routes/config.test.ts`, update the first test:

```typescript
test.describe('/api/config', () => {
  test('GET /api/config returns correct feature flags', async ({
    adaContext,
  }) => {
    const response = await adaContext.request.get('/api/config');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('features');
    expect(data.features).toHaveProperty('chatHistory');
    expect(data.features).toHaveProperty('feedback');
    expect(typeof data.features.chatHistory).toBe('boolean');
    expect(typeof data.features.feedback).toBe('boolean');

    if (process.env.TEST_MODE === 'with-db') {
      expect(data.features.chatHistory).toBe(true);
      expect(data.features.feedback).toBe(true);
    } else {
      expect(data.features.chatHistory).toBe(false);
      expect(data.features.feedback).toBe(false);
    }
  });
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All existing tests pass. Config test validates the new feedback flag.

- [ ] **Step 3: Commit**

```bash
git add tests/routes/config.test.ts
git commit -m "test: update config test to verify feedback feature flag"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Complete build succeeds (db migrate → client → server).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`

Verify:
1. Send a message, click Stop while streaming → see "Response cancelled" badge
2. Send a query that returns a large table → see collapsed preview with "Show all N rows" button
3. Expand the table → see scrollable container with sticky header
4. Check `/api/config` returns `feedback: true/false`
5. If DB enabled: thumbs up/down buttons appear on assistant messages

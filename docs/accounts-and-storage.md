# Accounts, storage and sync

Accounts are **optional**. Everything works signed out; signing in only adds a server copy that
follows you between browsers.

```
                       IndexedDB (Dexie)                Postgres (Prisma)
                       source of truth                  merged copy
  lib/db.ts  ──────────────┬───────────────────────────────────┬──────────
    runs      history      │  (never leaves the browser)       │
    progress  completed    ├── POST /api/sync ─► lib/merge.ts ─┤  Progress
    reads     read to end  │                                   │  LessonRead
    quizzes   best score   │                                   │  QuizResult
    drafts    editor code  │                                   │  Draft
```

Run history is deliberately local-only: it's large, it's noisy, and it's the one table nobody
misses on a second device.

## Keys

Every row is keyed `"<course>/<docKey>"` — `python/print`, `typescript/guide:functions`,
`python/section:2`, `python/final`. `lib/docs.ts` builds these (`storageKey`, `quizStoreKey`) and
both sides use the same format, so nothing has to translate.

This is why renaming a lesson file is a breaking change for learners.

## Dexie (`lib/db.ts`)

| Table | Primary key | Holds |
| --- | --- | --- |
| `runs` | `++id` | one row per Run press: code, output lines, timing, error, check verdict, inspect data |
| `progress` | `lessonId` | `completedAt` — the challenge's check passed |
| `reads` | `lessonId` | `readAt` — the learner reached the end of the prose |
| `quizzes` | `key` | `best`, `total`, `passedAt` |
| `drafts` | `lessonId` | the editor's current code, `updatedAt` |

Three schema versions so far. **v2** is the one to know about: it added the `"<course>/"` prefix
to every key. Because `lessonId` is the primary key on `progress` and `drafts`, `modify()` can't
change it — the upgrade reads the rows, clears the table and re-adds them.

Adding a table or an index means a new `db.version(n).stores({…})` block. Never edit an existing
version: browsers that already ran it won't re-run it.

Components read through `useLiveQuery` (`dexie-react-hooks`), so writes propagate without any
store of our own.

## Postgres (`prisma/schema.prisma`)

Mirrors the four synced tables, each keyed `@@id([userId, lessonId])` or `@@id([userId, key])`,
all `onDelete: Cascade` from `User`. Plus better-auth's `User`, `Session`, `Account` and
`Verification`.

```bash
npx prisma migrate dev --name <what-changed>   # create + apply a migration
npx prisma generate                            # regenerate the client (also runs on npm install)
```

The client is generated into `lib/generated/prisma` (see the `generator` block), not into
`node_modules`. `lib/prisma.ts` keeps a single client on `globalThis` in development so hot
reloads don't open a new pool each time.

## Sync

One endpoint, `POST /api/sync`, and it is always a **merge** — never a replace. The body is the
browser's rows; the response is the merged set, which the browser writes back over its own
tables. An empty body is a pure read.

`lib/merge.ts` is pure and unit-tested (`lib/merge.test.ts`). The rules, per table:

| Table | Conflict wins |
| --- | --- |
| `progress`, `reads` | the **earliest** timestamp — you did finish it, whenever that was |
| `quizzes` | the **highest** `best`; the **earliest** `passedAt` |
| `drafts` | the **newest** `updatedAt` — last edit wins |

Because merges only ever move in one direction per field, a stale client can't undo progress.

`changed(before, after)` narrows the merged set to rows that actually differ, so a sync that
changes nothing writes nothing.

`parseRows()` validates the untrusted body: caps at 5 000 rows per table and 200 000 characters
per draft, requires non-empty ids under 200 characters and safe non-negative integer timestamps.
One bad row rejects the whole body.

On the browser side (`lib/sync.ts`):

- `syncAll()` runs when a session starts (`components/account-sync.tsx` watches
  `authClient.useSession()`), pushing everything and writing the merged result back.
- `pushRow(table, row)` fires a single row in the background after a save. Failures are dropped
  on purpose — the next `syncAll()` catches up.

## Auth (`lib/auth.ts`)

better-auth with the Prisma adapter. Email + password is always on; the GitHub button appears
only when `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are both set. `lib/auth-client.ts`
exposes the React client; `app/api/auth/[...all]/route.ts` is the handler.

Nothing in the app requires a session except `/api/sync`, which returns 401 without one.

## Other client state

| Where | What |
| --- | --- |
| Cookies (`sidebar_state`, `panes-outer`, `panes-inner`) | read server-side in `app/[course]/layout.tsx` so a refresh doesn't jump |
| `localStorage` | theme (next-themes), focus timer |

The focus timer (`lib/focus-timer.ts`) is a pure state machine: time left is always derived from
an absolute `endsAt`, never from counted ticks, so it stays correct in a throttled background tab
and across reloads. It's unit-tested in `lib/focus-timer.test.ts`.

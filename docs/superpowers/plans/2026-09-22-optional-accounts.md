# Optional Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional email/password + GitHub sign-in (Better Auth) that syncs lesson progress, drafts, quiz results and lessons read to the Prisma Postgres database.

**Architecture:** Dexie stays the source of truth. A pure `merge()` in `lib/merge.ts` defines how two copies combine. One authenticated route, `POST /api/sync`, merges the posted rows with the account's rows, stores what changed and returns the merged set. `lib/sync.ts` calls it once per session (`syncAll`) and once per local write (`pushRow`).

**Tech Stack:** Next.js 16.3 App Router, Better Auth 1.7.5 (`better-auth`, CLI `auth@1.7.5`), Prisma 7.10 with `@prisma/adapter-pg`, Dexie, shadcn/ui (radix-nova), `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-22-optional-accounts-design.md`

## Global Constraints

- Run every `npm`/`npx` command with Node 22: prefix the shell with `export PATH=~/.nvm/versions/node/v22.22.3/bin:$PATH`. Prisma 7 refuses Node 23.
- Signed-out behavior must not change. Nothing is gated behind sign-in.
- Run history (`db.runs`) is never synced.
- Timestamps cross the wire as epoch milliseconds (numbers).
- UI primitives come from the shadcn CLI (`npx shadcn@latest add …`); never hand-write files in `components/ui/`.
- Dev URL is `http://localhost:3000` (README, Capacitor default).
- Out of scope: email verification, password reset, account deletion.
- Code style: match the repo (no semicolons in `components/` and `lib/*.ts` app code, double quotes, 2-space indent).

## File map

| File | Responsibility |
|---|---|
| `lib/merge.ts` (new) | Row types, `merge`, `changed`, `parseRows`. Pure, no I/O. |
| `lib/merge.test.ts` (new) | Unit tests for the above. |
| `lib/auth.ts` (new) | Better Auth server instance. |
| `lib/auth-client.ts` (new) | Better Auth React client. |
| `app/api/auth/[...all]/route.ts` (new) | Better Auth handler. |
| `app/api/sync/route.ts` (new) | Session check, load/merge/save. |
| `lib/sync.ts` (new) | Browser side: `syncAll`, `stopSync`, `pushRow`. |
| `components/account-sync.tsx` (new) | Starts/stops sync when the session changes. |
| `components/account-menu.tsx` (new) | Sidebar sign-in button, auth dialog, signed-in menu. |
| `prisma/schema.prisma` | Better Auth models; `Draft.updatedAt` becomes a plain column. |
| `lib/db.ts` | `drafts` rows get optional `updatedAt`. |
| `components/lesson-steps.tsx`, `components/quiz.tsx`, `components/workspace.tsx` | Call `pushRow` after each Dexie write. |
| `components/app-sidebar.tsx` | Render `<AccountMenu />` in the footer. |
| `app/layout.tsx` | Render `<AccountSync />`. |

---

### Task 0: Branch

- [ ] **Step 1:** `git switch -c feature/accounts`
- [ ] **Step 2:** Leave the pre-existing uncommitted work (Capacitor, landing page, `package.json` edits) untouched. When a task below stages `package.json` / `package-lock.json`, ask the user first whether those pre-existing changes may be committed with it.

---

### Task 1: Merge rules

**Files:**
- Create: `lib/merge.ts`
- Test: `lib/merge.test.ts`

**Interfaces:**
- Produces: `type ProgressRow`, `ReadRow`, `QuizRow`, `DraftRow`, `Rows`; `merge(a: Rows, b: Rows): Rows`; `changed(before: Rows, after: Rows): Rows`; `parseRows(body: unknown): Rows | null`.

- [ ] **Step 1: Write the failing tests** in `lib/merge.test.ts`:

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import { changed, merge, parseRows, type Rows } from "./merge.ts"

const rows = (r: Partial<Rows>): Rows => ({ progress: [], reads: [], quizzes: [], drafts: [], ...r })
const sort = (r: Rows): Rows => {
  const by = (k: string) => (x: Record<string, unknown>, y: Record<string, unknown>) =>
    String(x[k]).localeCompare(String(y[k]))
  return {
    progress: [...r.progress].sort(by("lessonId")),
    reads: [...r.reads].sort(by("lessonId")),
    quizzes: [...r.quizzes].sort(by("key")),
    drafts: [...r.drafts].sort(by("lessonId")),
  }
}

test("progress and reads: union, earliest time wins", () => {
  const a = rows({
    progress: [{ lessonId: "python/a", completedAt: 5 }, { lessonId: "python/b", completedAt: 1 }],
    reads: [{ lessonId: "python/a", readAt: 9 }],
  })
  const b = rows({
    progress: [{ lessonId: "python/a", completedAt: 3 }],
    reads: [{ lessonId: "python/a", readAt: 2 }, { lessonId: "python/c", readAt: 4 }],
  })
  assert.deepEqual(sort(merge(a, b)), rows({
    progress: [{ lessonId: "python/a", completedAt: 3 }, { lessonId: "python/b", completedAt: 1 }],
    reads: [{ lessonId: "python/a", readAt: 2 }, { lessonId: "python/c", readAt: 4 }],
  }))
})

test("quizzes: higher best wins with its total, earliest pass kept", () => {
  const a = rows({ quizzes: [{ key: "python/final", best: 7, total: 10, passedAt: 50 }] })
  const b = rows({ quizzes: [{ key: "python/final", best: 9, total: 12 }] })
  assert.deepEqual(merge(a, b).quizzes, [{ key: "python/final", best: 9, total: 12, passedAt: 50 }])
  assert.deepEqual(merge(b, a).quizzes, [{ key: "python/final", best: 9, total: 12, passedAt: 50 }])
})

test("quizzes: no pass on either side leaves passedAt absent", () => {
  const a = rows({ quizzes: [{ key: "k", best: 1, total: 5 }] })
  const b = rows({ quizzes: [{ key: "k", best: 2, total: 5 }] })
  assert.deepEqual(merge(a, b).quizzes, [{ key: "k", best: 2, total: 5 }])
})

test("drafts: newest updatedAt wins", () => {
  const a = rows({ drafts: [{ lessonId: "l", code: "old", updatedAt: 1 }] })
  const b = rows({ drafts: [{ lessonId: "l", code: "new", updatedAt: 2 }] })
  assert.deepEqual(merge(a, b).drafts, [{ lessonId: "l", code: "new", updatedAt: 2 }])
  assert.deepEqual(merge(b, a).drafts, [{ lessonId: "l", code: "new", updatedAt: 2 }])
})

test("changed: only new or different rows", () => {
  const before = rows({ progress: [{ lessonId: "a", completedAt: 1 }, { lessonId: "b", completedAt: 2 }] })
  const after = rows({
    progress: [{ completedAt: 1, lessonId: "a" }, { lessonId: "b", completedAt: 1 }, { lessonId: "c", completedAt: 3 }],
  })
  assert.deepEqual(changed(before, after).progress, [
    { lessonId: "b", completedAt: 1 },
    { lessonId: "c", completedAt: 3 },
  ])
})

test("parseRows: accepts partial bodies and strips unknown fields", () => {
  assert.deepEqual(
    parseRows({ drafts: [{ lessonId: "l", code: "x", updatedAt: 1, extra: true }] }),
    rows({ drafts: [{ lessonId: "l", code: "x", updatedAt: 1 }] })
  )
  assert.deepEqual(parseRows({}), rows({}))
})

test("parseRows: rejects bad input", () => {
  for (const bad of [
    null,
    "x",
    { progress: "x" },
    { progress: [{ lessonId: "", completedAt: 1 }] },
    { reads: [{ lessonId: "a", readAt: -1 }] },
    { quizzes: [{ key: "k", best: 1.5, total: 2 }] },
    { drafts: [{ lessonId: "l", code: "x".repeat(200_001), updatedAt: 1 }] },
    { progress: Array.from({ length: 5001 }, (_, i) => ({ lessonId: `l${i}`, completedAt: 1 })) },
  ]) assert.equal(parseRows(bad), null, JSON.stringify(bad)?.slice(0, 60))
})
```

- [ ] **Step 2: Run to confirm it fails**

Run: `node --no-warnings --test lib/merge.test.ts`
Expected: FAIL, cannot find module `./merge.ts`.

- [ ] **Step 3: Implement** `lib/merge.ts`:

```ts
// How the browser copy and the account copy of a learner's data combine. Pure: no I/O.
// Used by app/api/sync/route.ts; see docs/superpowers/specs/2026-09-22-optional-accounts-design.md.

export type ProgressRow = { lessonId: string; completedAt: number }
export type ReadRow = { lessonId: string; readAt: number }
export type QuizRow = { key: string; best: number; total: number; passedAt?: number }
export type DraftRow = { lessonId: string; code: string; updatedAt: number }
export type Rows = { progress: ProgressRow[]; reads: ReadRow[]; quizzes: QuizRow[]; drafts: DraftRow[] }

const earliest = (a?: number, b?: number) =>
  a === undefined ? b : b === undefined ? a : Math.min(a, b)

function combine<T>(a: T[], b: T[], id: (r: T) => string, pick: (x: T, y: T) => T): T[] {
  const out = new Map(a.map((r) => [id(r), r]))
  for (const r of b) {
    const prev = out.get(id(r))
    out.set(id(r), prev ? pick(prev, r) : r)
  }
  return [...out.values()]
}

export function merge(a: Rows, b: Rows): Rows {
  return {
    progress: combine(a.progress, b.progress, (r) => r.lessonId, (x, y) => ({
      lessonId: x.lessonId,
      completedAt: Math.min(x.completedAt, y.completedAt),
    })),
    reads: combine(a.reads, b.reads, (r) => r.lessonId, (x, y) => ({
      lessonId: x.lessonId,
      readAt: Math.min(x.readAt, y.readAt),
    })),
    quizzes: combine(a.quizzes, b.quizzes, (r) => r.key, (x, y) => {
      const top = y.best > x.best ? y : x
      const passedAt = earliest(x.passedAt, y.passedAt)
      return { key: x.key, best: top.best, total: top.total, ...(passedAt !== undefined && { passedAt }) }
    }),
    drafts: combine(a.drafts, b.drafts, (r) => r.lessonId, (x, y) => (y.updatedAt > x.updatedAt ? y : x)),
  }
}

// Rows are flat, so a sorted key list makes the comparison independent of key order.
const same = (x: object, y: object | undefined) =>
  y !== undefined && JSON.stringify(x, Object.keys(x).sort()) === JSON.stringify(y, Object.keys(y).sort())

function diff<T extends object>(before: T[], after: T[], id: (r: T) => string): T[] {
  const old = new Map(before.map((r) => [id(r), r]))
  return after.filter((r) => !same(r, old.get(id(r))))
}

/** Rows in `after` that are new or differ from `before`: what the server needs to write. */
export function changed(before: Rows, after: Rows): Rows {
  return {
    progress: diff(before.progress, after.progress, (r) => r.lessonId),
    reads: diff(before.reads, after.reads, (r) => r.lessonId),
    quizzes: diff(before.quizzes, after.quizzes, (r) => r.key),
    drafts: diff(before.drafts, after.drafts, (r) => r.lessonId),
  }
}

const MAX_ROWS = 5000
const MAX_CODE = 200_000

const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 200
const isCount = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0

/** Validates an untrusted request body. Missing tables count as empty; any bad row rejects the whole body. */
export function parseRows(body: unknown): Rows | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  const list = <T>(v: unknown, row: (r: Record<string, unknown>) => T | null): T[] | null => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.length > MAX_ROWS) return null
    const out: T[] = []
    for (const r of v) {
      const parsed = typeof r === "object" && r !== null ? row(r) : null
      if (!parsed) return null
      out.push(parsed)
    }
    return out
  }
  const progress = list(b.progress, (r) =>
    isId(r.lessonId) && isCount(r.completedAt) ? { lessonId: r.lessonId, completedAt: r.completedAt } : null
  )
  const reads = list(b.reads, (r) =>
    isId(r.lessonId) && isCount(r.readAt) ? { lessonId: r.lessonId, readAt: r.readAt } : null
  )
  const quizzes = list(b.quizzes, (r): QuizRow | null =>
    isId(r.key) && isCount(r.best) && isCount(r.total) && (r.passedAt === undefined || isCount(r.passedAt))
      ? { key: r.key, best: r.best, total: r.total, ...(r.passedAt !== undefined && { passedAt: r.passedAt }) }
      : null
  )
  const drafts = list(b.drafts, (r) =>
    isId(r.lessonId) && typeof r.code === "string" && r.code.length <= MAX_CODE && isCount(r.updatedAt)
      ? { lessonId: r.lessonId, code: r.code, updatedAt: r.updatedAt }
      : null
  )
  if (!progress || !reads || !quizzes || !drafts) return null
  return { progress, reads, quizzes, drafts }
}
```

- [ ] **Step 4: Run tests**

Run: `node --no-warnings --test lib/merge.test.ts && npm test`
Expected: all PASS (the existing quiz/stats tests too).

- [ ] **Step 5: Commit**

```bash
git add lib/merge.ts lib/merge.test.ts docs/superpowers
git commit -m "feat(sync): merge rules for account progress"
```

---

### Task 2: Better Auth server + schema

**Files:**
- Create: `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`
- Modify: `prisma/schema.prisma`
- Create (generated): `prisma/migrations/<timestamp>_auth/`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`.
- Produces: `auth` (server, `auth.api.getSession({ headers })` returns `{ user: { id, email, name, … } } | null`); `authClient` (`useSession`, `signIn.email`, `signUp.email`, `signIn.social`, `signOut`).

- [ ] **Step 1: Install** `npm i better-auth@1.7.5`

- [ ] **Step 2: Secret + URL.** Add to Vercel, then pull (pull overwrites `.env.local`):

```bash
openssl rand -base64 32 | vercel env add BETTER_AUTH_SECRET production
openssl rand -base64 32 | vercel env add BETTER_AUTH_SECRET preview
openssl rand -base64 32 | vercel env add BETTER_AUTH_SECRET development
printf 'http://localhost:3000' | vercel env add BETTER_AUTH_URL development
vercel env pull .env.local --yes
```

Check (names only): `grep -oE '^[A-Z_]+' .env.local` lists `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
Production `BETTER_AUTH_URL` is set once the production domain is known (handoff note).

- [ ] **Step 3: Write** `lib/auth.ts`:

```ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { prisma } from "./prisma"

const github =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }
    : undefined

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // GitHub is offered only once its OAuth app credentials are configured.
  socialProviders: github ? { github } : {},
})
```

`lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient()
```

`app/api/auth/[...all]/route.ts`:

```ts
import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth"

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 4: Schema.** In `prisma/schema.prisma` delete our `model User { … }` block, then generate Better Auth's models:

```bash
npx auth@1.7.5 generate --config lib/auth.ts --yes
```

Expected: `User`, `Session`, `Account`, `Verification` models appear. Then edit by hand:
1. Add to the generated `User` model: `progress Progress[]`, `drafts Draft[]`, `quizzes QuizResult[]`, `reads LessonRead[]`.
2. In `model Draft` change `updatedAt DateTime @updatedAt` to `updatedAt DateTime` (the client's edit time is stored, not the write time).
3. `npx prisma format`

If the CLI can't load the config, write the four models from the Better Auth "Core schema" docs (Context7 `/better-auth/better-auth`, query "core database schema Prisma") with the `@@map("user")`/`session`/`account`/`verification` names the adapter expects.

- [ ] **Step 5: Migrate** `npx prisma migrate dev --name auth`
Expected: "Your database is now in sync with your schema." The old empty `User` table is dropped.

- [ ] **Step 6: Verify against the dev server.** Start the preview (`preview_start` with the dev server config), then:

```bash
curl -s -X POST http://localhost:3000/api/auth/sign-up/email -H 'content-type: application/json' -H 'origin: http://localhost:3000' \
  -d '{"name":"Plan Test","email":"plan-test@example.com","password":"correct-horse-9"}' -c /tmp/tl-cookies | head -c 200
curl -s http://localhost:3000/api/auth/get-session -b /tmp/tl-cookies | head -c 200
```

Expected: first returns a JSON body with `"user"`; second returns the same user's email. Then delete the test user: `echo "DELETE FROM \"user\" WHERE email='plan-test@example.com';" | npx prisma db execute --stdin`.

- [ ] **Step 7:** `npm run typecheck && npm run lint`
- [ ] **Step 8: Commit** (ask first about pre-existing `package.json` changes, per Task 0)

```bash
git add lib/auth.ts lib/auth-client.ts app/api/auth prisma prisma.config.ts lib/prisma.ts eslint.config.mjs .gitignore package.json package-lock.json
git commit -m "feat(auth): Better Auth with Prisma, email/password and GitHub"
```

---

### Task 3: Sync route and client

**Files:**
- Create: `app/api/sync/route.ts`, `lib/sync.ts`, `components/account-sync.tsx`
- Modify: `lib/db.ts`, `components/lesson-steps.tsx:20`, `components/quiz.tsx:80-85`, `components/workspace.tsx:247,276`, `app/layout.tsx`

**Interfaces:**
- Consumes: `merge`, `changed`, `parseRows`, `Rows` (Task 1); `auth`, `authClient` (Task 2); `prisma`.
- Produces: `syncAll(): Promise<void>`, `stopSync(): void`, `pushRow<K extends keyof Rows>(table: K, row: Rows[K][number]): void`; `<AccountSync />`.

- [ ] **Step 1: Route** `app/api/sync/route.ts`:

```ts
import { auth } from "@/lib/auth"
import { changed, merge, parseRows, type Rows } from "@/lib/merge"
import { prisma } from "@/lib/prisma"

// ponytail: loads all of the learner's rows per request (hundreds at most); filter by id if pushes get heavy.
async function load(userId: string): Promise<Rows> {
  const where = { userId }
  const [progress, reads, quizzes, drafts] = await Promise.all([
    prisma.progress.findMany({ where }),
    prisma.lessonRead.findMany({ where }),
    prisma.quizResult.findMany({ where }),
    prisma.draft.findMany({ where }),
  ])
  return {
    progress: progress.map((r) => ({ lessonId: r.lessonId, completedAt: r.completedAt.getTime() })),
    reads: reads.map((r) => ({ lessonId: r.lessonId, readAt: r.readAt.getTime() })),
    quizzes: quizzes.map((r) => ({
      key: r.key,
      best: r.best,
      total: r.total,
      ...(r.passedAt && { passedAt: r.passedAt.getTime() }),
    })),
    drafts: drafts.map((r) => ({ lessonId: r.lessonId, code: r.code, updatedAt: r.updatedAt.getTime() })),
  }
}

function save(userId: string, rows: Rows) {
  const at = (ms: number) => new Date(ms)
  return prisma.$transaction([
    ...rows.progress.map((r) =>
      prisma.progress.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, completedAt: at(r.completedAt) },
        update: { completedAt: at(r.completedAt) },
      })
    ),
    ...rows.reads.map((r) =>
      prisma.lessonRead.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, readAt: at(r.readAt) },
        update: { readAt: at(r.readAt) },
      })
    ),
    ...rows.quizzes.map((r) => {
      const data = { best: r.best, total: r.total, passedAt: r.passedAt === undefined ? null : at(r.passedAt) }
      return prisma.quizResult.upsert({
        where: { userId_key: { userId, key: r.key } },
        create: { userId, key: r.key, ...data },
        update: data,
      })
    }),
    ...rows.drafts.map((r) =>
      prisma.draft.upsert({
        where: { userId_lessonId: { userId, lessonId: r.lessonId } },
        create: { userId, lessonId: r.lessonId, code: r.code, updatedAt: at(r.updatedAt) },
        update: { code: r.code, updatedAt: at(r.updatedAt) },
      })
    ),
  ])
}

/** Merges the posted rows into the account and returns the merged set. An empty body just reads. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: "Not signed in" }, { status: 401 })
  const local = parseRows(await request.json().catch(() => null))
  if (!local) return Response.json({ error: "Invalid body" }, { status: 400 })

  const server = await load(session.user.id)
  const merged = merge(server, local)
  await save(session.user.id, changed(server, merged))
  return Response.json(merged)
}
```

- [ ] **Step 2: Dexie type.** In `lib/db.ts` change the drafts entry to:

```ts
  drafts: EntityTable<{ lessonId: string; code: string; updatedAt?: number }, "lessonId">
```

- [ ] **Step 3: Client** `lib/sync.ts`:

```ts
import { db } from "./db"
import type { Rows } from "./merge"

// Browser side of account sync. Dexie stays the source of truth; the account is a merged copy.
let enabled = false

const post = (rows: Partial<Rows>) =>
  fetch("/api/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rows),
  })

/** Merges local and account data in both directions. Runs when a session starts. */
export async function syncAll() {
  enabled = true
  const [progress, reads, quizzes, drafts] = await Promise.all([
    db.progress.toArray(),
    db.reads.toArray(),
    db.quizzes.toArray(),
    db.drafts.toArray(),
  ])
  const res = await post({
    progress,
    reads,
    quizzes,
    drafts: drafts.map((d) => ({ ...d, updatedAt: d.updatedAt ?? 0 })),
  }).catch(() => null)
  if (!res?.ok) return
  const merged: Rows = await res.json()
  await db.transaction("rw", [db.progress, db.reads, db.quizzes, db.drafts], () =>
    Promise.all([
      db.progress.bulkPut(merged.progress),
      db.reads.bulkPut(merged.reads),
      db.quizzes.bulkPut(merged.quizzes),
      db.drafts.bulkPut(merged.drafts),
    ])
  )
}

export function stopSync() {
  enabled = false
}

/** Sends one saved row to the account in the background. Failures are dropped; the next syncAll() catches up. */
export function pushRow<K extends keyof Rows>(table: K, row: Rows[K][number]) {
  if (enabled) post({ [table]: [row] }).catch(() => {})
}
```

- [ ] **Step 4: Session watcher** `components/account-sync.tsx`:

```tsx
"use client"

import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"
import { stopSync, syncAll } from "@/lib/sync"

/** Syncs progress with the account whenever someone is signed in. Renders nothing. */
export function AccountSync() {
  const userId = authClient.useSession().data?.user.id
  useEffect(() => {
    if (userId) syncAll()
    else stopSync()
  }, [userId])
  return null
}
```

In `app/layout.tsx` import it and render `<AccountSync />` right after `<TapHaptics />`.

- [ ] **Step 5: Wire the four writes.** Add `import { pushRow } from "@/lib/sync"` to each file.

`components/lesson-steps.tsx` (ReadSentinel):

```ts
      const row = { lessonId: lessonKey, readAt: Date.now() }
      db.reads.put(row)
      pushRow("reads", row)
```

`components/quiz.tsx` (`next`):

```ts
    const row = {
      key: storeKey,
      total,
      best: Math.max(score, prev?.best ?? 0),
      passedAt: prev?.passedAt ?? (passed ? Date.now() : undefined),
    }
    await db.quizzes.put(row)
    pushRow("quizzes", row)
```

`components/workspace.tsx` (draft timer):

```ts
    draftTimer.current = setTimeout(() => {
      const row = { lessonId: saveKey, code: v, updatedAt: Date.now() }
      db.drafts.put(row)
      pushRow("drafts", row)
    }, 400)
```

`components/workspace.tsx` (completion):

```ts
      const row = { lessonId: saveKey, completedAt: Date.now() }
      await db.progress.put(row)
      pushRow("progress", row)
```

- [ ] **Step 6: Verify the route** (dev server running; reuse the Task 2 curl sign-up to get `/tmp/tl-cookies`):

```bash
curl -s -X POST http://localhost:3000/api/sync -d '{}' -w ' %{http_code}\n'                              # 401
curl -s -X POST http://localhost:3000/api/sync -b /tmp/tl-cookies -d '{"progress":"x"}' -w ' %{http_code}\n'  # 400
curl -s -X POST http://localhost:3000/api/sync -b /tmp/tl-cookies -d '{"progress":[{"lessonId":"python/print","completedAt":5}]}'
curl -s -X POST http://localhost:3000/api/sync -b /tmp/tl-cookies -d '{"progress":[{"lessonId":"python/print","completedAt":3}]}'
curl -s -X POST http://localhost:3000/api/sync -b /tmp/tl-cookies -d '{}'
```

Expected: 401, 400, then the last three each return `progress: [{"lessonId":"python/print","completedAt":…}]` with `5`, `3`, `3`. Delete the test user afterwards (Task 2 Step 6 command).

- [ ] **Step 7:** `npm test && npm run typecheck && npm run lint`
- [ ] **Step 8: Commit**

```bash
git add app/api/sync lib/sync.ts lib/db.ts components/account-sync.tsx components/lesson-steps.tsx components/quiz.tsx components/workspace.tsx app/layout.tsx
git commit -m "feat(sync): sync progress, drafts, quizzes and reads to the account"
```

Note: `app/layout.tsx` has pre-existing uncommitted edits; ask before staging it, or stage only the hunk via `git apply --cached` of a hand-made patch.

---

### Task 4: Sign-in UI

**Files:**
- Create: `components/account-menu.tsx`, `components/ui/label.tsx` (via shadcn CLI)
- Modify: `components/app-sidebar.tsx` (footer, ~line 296)

**Interfaces:**
- Consumes: `authClient` (Task 2). Session changes reach `AccountSync` (Task 3) automatically through `useSession`.
- Produces: `<AccountMenu />`.

- [ ] **Step 1:** Invoke the `shadcn` skill, then `npx shadcn@latest add label`. Expected: `components/ui/label.tsx` created, nothing else overwritten (answer "no" to overwrite prompts).

- [ ] **Step 2: Write** `components/account-menu.tsx`:

```tsx
"use client"

import { useState } from "react"
import { GithubIcon, LogInIcon, LogOutIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"

/** Sidebar footer entry: "Sign in" when signed out, the account menu when signed in. */
export function AccountMenu() {
  const { data, isPending } = authClient.useSession()
  const [open, setOpen] = useState(false)
  if (isPending) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {data ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <UserIcon />
                <span className="truncate">{data.user.email}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                Progress syncs to this account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => authClient.signOut()}>
                <LogOutIcon />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <SidebarMenuButton onClick={() => setOpen(true)}>
              <LogInIcon />
              <span>Sign in to save progress</span>
            </SidebarMenuButton>
            <AuthDialog open={open} onOpenChange={setOpen} />
          </>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = (register: boolean) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get("email"))
    const password = String(f.get("password"))
    setBusy(true)
    setError(undefined)
    const { error } = register
      ? await authClient.signUp.email({ name: String(f.get("name")), email, password })
      : await authClient.signIn.email({ email, password })
    setBusy(false)
    if (error) setError(error.message ?? "Something went wrong. Try again.")
    else onOpenChange(false)
  }

  const github = async () => {
    setError(undefined)
    const { error } = await authClient.signIn.social({ provider: "github", callbackURL: window.location.href })
    if (error) setError(error.message ?? "GitHub sign-in isn't available right now.")
  }

  const form = (register: boolean) => (
    <form onSubmit={submit(register)} className="flex flex-col gap-4">
      {register && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-name">Name</Label>
          <Input id="auth-name" name="name" autoComplete="name" required />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor={`auth-email-${register}`}>Email</Label>
        <Input id={`auth-email-${register}`} name="email" type="email" autoComplete="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`auth-password-${register}`}>Password</Label>
        <Input
          id={`auth-password-${register}`}
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={8}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {register ? "Create account" : "Sign in"}
      </Button>
    </form>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save your progress</DialogTitle>
          <DialogDescription>
            Optional. Your progress on this device is kept and merged into your account.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="sign-in" onValueChange={() => setError(undefined)}>
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="pt-4">{form(false)}</TabsContent>
          <TabsContent value="register" className="pt-4">{form(true)}</TabsContent>
        </Tabs>
        <Button variant="outline" onClick={github}>
          <GithubIcon />
          Continue with GitHub
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

If `GithubIcon` is missing from the installed lucide-react (brand icons were removed in some versions), check `node_modules/lucide-react` for it and fall back to no icon.

- [ ] **Step 3: Sidebar.** In `components/app-sidebar.tsx` import `AccountMenu` from `@/components/account-menu` and render `<AccountMenu />` inside `<SidebarFooter>` as its first child, above the Setup menu.

- [ ] **Step 4: Verify in the browser preview** (skills: `webapp-testing`, `superpowers:verification-before-completion`):
  1. Open `http://localhost:3000/python`, confirm "Sign in to save progress" in the sidebar footer and no console errors.
  2. Register `ui-test@example.com` / `correct-horse-9`. Dialog closes; footer shows the email.
  3. Complete a lesson (run a challenge's check so it passes).
  4. `indexedDB.deleteDatabase("thonglearn")` via `javascript_tool`, reload. Progress is gone; after the session loads, `syncAll` restores it (lesson shows as done).
  5. Sign out from the menu; footer returns to "Sign in"; local progress still shown.
  6. Wrong password shows an inline error.
  7. Mobile width (`resize_window` mobile): dialog fits, no horizontal scroll. Reset to desktop.
  8. Delete the test user (Task 2 Step 6 command, with this email).

- [ ] **Step 5:** `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] **Step 6: Commit**

```bash
git add components/account-menu.tsx components/ui/label.tsx components/app-sidebar.tsx
git commit -m "feat(auth): sign-in and register dialog in the sidebar"
```

---

### Task 5: GitHub OAuth (needs the user)

- [ ] **Step 1: Ask the user** to create a GitHub OAuth app at https://github.com/settings/developers → "New OAuth App":
  - Homepage URL: `http://localhost:3000`
  - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
  - Then add the credentials to Vercel's development environment themselves (`vercel env add GITHUB_CLIENT_ID development`, `vercel env add GITHUB_CLIENT_SECRET development`). A separate OAuth app with the production callback URL is needed for production.
- [ ] **Step 2:** `vercel env pull .env.local --yes`, restart the dev server.
- [ ] **Step 3: Verify:** "Continue with GitHub" redirects to github.com. The user completes the GitHub sign-in (their account); afterwards the footer shows their email.
- [ ] **Step 4:** No code changes expected; nothing to commit.

---

## Handoff notes

- Production needs `BETTER_AUTH_URL` set to the production URL and a production GitHub OAuth app.
- The Capacitor apps load `http://localhost:3000`, which matches `BETTER_AUTH_URL`; GitHub sign-in inside the native web view is untested.

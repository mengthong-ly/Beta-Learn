# Optional accounts and progress sync

Status: approved design, 2026-09-22

## Goal

Learners can optionally register and sign in so their progress follows them across devices. Signed-out use is unchanged: everything keeps working from the browser's IndexedDB (Dexie, `lib/db.ts`).

## Decisions

- **Auth:** Better Auth, running in this Next.js app, storing users and sessions in `thonglearn-db` (Prisma Postgres) through the Prisma adapter.
- **Sign-in methods:** email + password, and GitHub OAuth.
- **Out of scope:** email verification, password reset, account deletion (they need an email provider or more screens).
- **Source of truth:** the browser (Dexie). The server is a synced copy for signed-in learners.

## 1. Accounts

- `lib/auth.ts`: Better Auth server config (Prisma adapter, email/password, GitHub provider).
- `lib/auth-client.ts`: Better Auth React client.
- `app/api/auth/[...all]/route.ts`: Better Auth handler.
- Prisma schema: add Better Auth's `Session`, `Account`, `Verification` models and replace our `User` with Better Auth's user shape (`name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`). `Progress`, `Draft`, `QuizResult`, `LessonRead` keep their relation to `User`.
- Env vars (Vercel + `.env.local`): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

## 2. UI

- Sidebar footer (`components/app-sidebar.tsx`): a **Sign in** button when signed out; avatar + email with a **Sign out** item when signed in.
- A dialog with **Sign in** / **Register** tabs (email + password forms) and a **Continue with GitHub** button.
- UI primitives come from the shadcn CLI (dialog, tabs, input, label, dropdown-menu, avatar as needed).
- No new pages; no feature is gated behind sign-in.

## 3. Sync

### Data

Synced tables: `progress`, `drafts`, `quizzes`, `reads`. Run history (`runs`) stays local.

Dexie `drafts` rows gain an optional `updatedAt` (not indexed, so no Dexie version bump). Drafts without it count as `0`.

### Merge rules (`lib/merge.ts`, pure function, server-side)

| Table | Rule |
|---|---|
| progress | union by `lessonId`; keep earliest `completedAt` |
| reads | union by `lessonId`; keep earliest `readAt` |
| quizzes | union by `key`; keep higher `best` (and its `total`); `passedAt` = earliest of either side, if any |
| drafts | union by `lessonId`; keep greater `updatedAt` |

### API: `app/api/sync/route.ts`

Requires a valid Better Auth session (401 otherwise).

- `POST { progress?, drafts?, quizzes?, reads? }`: validates the body (401 without a session, 400 on bad input), merges with the server rows, upserts only the rows that changed, returns the full merged set. There is no `GET`: posting an empty body reads everything.

Timestamps travel as epoch milliseconds, matching Dexie.

### Client: `lib/sync.ts`

- `syncAll()`: posts every local row, writes the merged response back into Dexie. Runs after sign-in and on app load while signed in.
- `pushRow(table, row)`: fire-and-forget POST of a single row. Called next to the four existing Dexie writes (`components/lesson-steps.tsx`, `components/quiz.tsx`, `components/workspace.tsx` ×2). Failures are ignored; the next `syncAll()` catches up.
- Sign-out leaves local data in place.

## 4. Testing

- `lib/merge.test.ts` (`node --test`) covering each rule.
- Browser check in the preview: register → complete a lesson → clear IndexedDB → sign in → progress restored.
- `npm run typecheck`, `npm run lint`, `npm run build`.

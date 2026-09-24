# Start here

ThongLearn is a Next.js app that teaches nine programming courses. Each course pairs Markdown
lessons with a real editor and a real runtime: your code actually compiles and runs, and a
lesson's **check** decides whether you solved the challenge.

This page is the front door. It gets you running in fifteen minutes, then gives you an order to
read everything else in — so you can stop when you've read enough for the job you came to do.

---

## In a hurry?

| I want to… | Go straight to |
| --- | --- |
| Get it running | [Stage 1](#stage-1--get-it-running-15-min) below |
| Write a lesson | [adding-a-lesson.md](adding-a-lesson.md) |
| Understand the system | [architecture.md § Overview](architecture.md#overview) |
| Look up a dependency | [tech-stack.md](tech-stack.md) |
| Change how code runs | [runtimes.md](runtimes.md) + [ADR-0001](adr/0001-local-runner.md) |
| Touch progress / drafts / auth | [accounts-and-storage.md](accounts-and-storage.md) |

Everyone else: read on.

---

## The reading roadmap

```
    STAGE 1           STAGE 2              STAGE 3               STAGE 4        STAGE 5
  Get it running   Understand it    Do what you came for       Deep water     Background
  ──────────────   ─────────────    ────────────────────       ──────────     ──────────

   this page  ──►  architecture ──►  📝 content:          ──►   runtimes      ADR-0001
   (Stage 1)       § Overview          adding-a-lesson          internals     .design/
       │                │              content-authoring           │          specs +
       │                ▼                                          ▼          plans
       ▼           architecture     🎨 frontend:               accounts-      agents/
   /setup page     (the rest)          architecture             and-storage   CLAUDE.md
                        │              tech-stack §UI
                        ▼              .design/
                   tech-stack
                    (skim)          ⚙️ backend:
                                       runtimes
                                       accounts-and-storage
                                       ADR-0001  ← required

    15 min           30 min              45 min                  60 min       as needed
```

Each stage says what you'll be able to do when you finish it. **Stages 1 and 2 are for everyone.
Stage 3 branches** — read only the branch you need, and skip the rest until a task drags you
there.

---

### Stage 1 — Get it running (15 min)

Prerequisites: Node 20.9+ (24 LTS recommended), macOS or Linux. Postgres only if you want
accounts.

```bash
npm install
npm run dev          # http://localhost:3000
```

That's enough for the **Python** and **React** courses — they run entirely in the browser. Open a
Python lesson, press **Run**, and watch a check pass. You now understand the product better than
any doc will explain it.

Dart and Flutter run on your own toolchains (PHP, Laravel, TypeScript, Claude Code and C++ run
in the browser, like Python and React):

```bash
npm run setup:runtimes    # once: creates runtimes/flutter
```

Then open **<http://localhost:3000/setup>**, which tells you per course exactly which tool is
missing and which version it wants. Full requirements and troubleshooting:
[adding-a-lesson.md § 1](adding-a-lesson.md#1-set-up-for-the-course-youre-writing-for) and
[runtimes.md § Troubleshooting](runtimes.md#troubleshooting).

✅ **Done when:** the app runs, and `/setup` is green for at least one non-browser course — or you
know you only care about Python and React.

---

### Stage 2 — Understand the shape (30 min)

1. **[architecture.md § Overview](architecture.md#overview)** — one diagram and the four
   properties the rest of the codebase follows from. If you read nothing else, read this.
2. **[architecture.md](architecture.md)**, the rest — the persistent workspace, the route table,
   courses-as-data, the content pipeline, how run state works.
3. **[tech-stack.md](tech-stack.md)** — skim. Don't memorise it; just learn what's in the box so
   you recognise a name later. Do note the four versions pinned by hand, outside npm's reach.

✅ **Done when:** you can say where a lesson's Markdown turns into a page, and why nothing
untrusted runs on the deployed server.

---

### Stage 3 — Do what you came for (45 min)

Three independent branches. Pick yours.

#### 📝 Writing content

1. **[adding-a-lesson.md](adding-a-lesson.md)** — the procedure, start to finish. Follow it
   literally the first time.
2. **[content-authoring.md](content-authoring.md)** — the format reference: fences, callouts,
   quiz syntax, check helpers per course. Keep it open in a tab while you write.

✅ Done when: `npm run check:content -- <course>` is green on a lesson you wrote.

#### 🎨 Frontend work

1. **[architecture.md § The shape of the app](architecture.md#the-shape-of-the-app)** — the
   workspace shell, and why the editor never unmounts.
2. **[tech-stack.md § Styling and UI](tech-stack.md#styling-and-ui)** — Tailwind v4 has no config
   file, and shadcn components come from the CLI, never hand-written.
3. **`.design/thonglearn/DESIGN.md`** for the token system, `INFORMATION_ARCHITECTURE.md` for the
   site map.

✅ Done when: your change survives light **and** dark mode, and a font switch from the Appearance
menu.

#### ⚙️ Backend / runtime work

1. **[runtimes.md](runtimes.md)** — the three execution paths and the per-course table.
2. **[accounts-and-storage.md](accounts-and-storage.md)** — Dexie, Prisma, the merge rules.
3. **[ADR-0001](adr/0001-local-runner.md)** if you go anywhere near `/api/run`. **Required
   reading, not background** — it is the security model.

✅ Done when: `npm run check:runner` passes and you can explain all three guard checks.

---

### Stage 4 — Deep water (when a task takes you there)

Don't read these up front. Read them when you're in the file.

| Doc | What's in it |
| --- | --- |
| [runtimes.md § Local runner](runtimes.md#local-runner) | the guard, the OS sandbox, why Flutter is serialised, why the Python worker must stay unbundled |
| [accounts-and-storage.md](accounts-and-storage.md) | the Dexie v2 key migration, merge conflict rules, request validation caps |
| [adr/0001-local-runner.md](adr/0001-local-runner.md) | why local execution exists at all, and the residual risk we accepted |
| [tech-stack.md § Code execution](tech-stack.md#code-execution) | the four hand-pinned versions npm can't police |

---

### Stage 5 — Background and process (as needed)

Not required to ship anything. Useful when you're wondering *why*.

| Where | What |
| --- | --- |
| [`../CLAUDE.md`](../CLAUDE.md), [`../AGENTS.md`](../AGENTS.md) | the rules agents follow here: read-the-docs-first, which skills to use, project gotchas |
| [agents/domain.md](agents/domain.md) | how agents should consume domain docs and ADRs |
| [agents/issue-tracker.md](agents/issue-tracker.md) | issues and specs live as Markdown under `.scratch/` |
| [agents/triage-labels.md](agents/triage-labels.md) | the five canonical triage roles |
| `superpowers/specs/` | design specs for shipped features — optional accounts; feedback, progress & quizzes |
| `superpowers/plans/` | the task-by-task implementation plans those specs became |
| `.design/thonglearn/` | design brief, design review, token system, information architecture, and the research behind the courses and the focus timer |

---

## Reference

Lookup material. Skim now, come back later.

### Environment variables

`.env.local` is only needed for accounts. Without it the app runs fine; sign-in just fails.

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string for Prisma |
| `BETTER_AUTH_SECRET` | signing sessions |
| `BETTER_AUTH_URL` | the app's own origin (e.g. `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | the GitHub sign-in button (hidden when unset) |

Runner-only variables (`LOCAL_RUNNER`, `THONGLEARN_UNSANDBOXED`,
`THONGLEARN_SANDBOX_READ`) are documented in [runtimes.md § Environment](runtimes.md#environment).

### Commands

```bash
npm run dev                      # dev server, local runner on, bound to 127.0.0.1
npm run setup:runtimes           # once: creates runtimes/flutter (Dart needs only its own tool)
npm run lint                     # eslint
npm run typecheck                # tsc --noEmit
npm test                         # node:test over lib/*.test.ts (pure logic only)
npm run check:content            # runs every lesson + guide example for real — slow, the real gate
npm run check:content -- --record dart       # save real outputs for write-only courses
npm run check:content -- php     # one or more courses only
npm run check:runner             # self-check for lib/local-runner.ts per toolchain
npm run format                   # prettier (ts/tsx only — not Markdown or CSS)
npm run build && npm start       # production build
```

`npm run check:content` is the one that catches real breakage: it runs every example, asserts each
lesson's solution passes its check, and asserts the starter does *not*. Run it after any content
change and after any runner change.

### Before you open a PR

1. `npm run lint && npm run typecheck && npm test`
2. `npm run check:content` for the courses you touched
3. `npm run check:runner` if you touched `lib/local-runner.ts`, `lib/sandbox.ts` or `app/api/run/`

Branch off `develop`; that's the main branch here.

### Where things are

```
app/            routes (App Router). app/[course]/… is the learner workspace.
components/     React components. components/ui/ is shadcn — add via the CLI, don't hand-roll.
content/<course>/lessons/*.md    the courses
content/<course>/guide/*.md      the Guide Book for that course
lib/            content parsing, runners, storage, auth, pure logic + its tests
public/         python.worker.js, inspect.py, react-preview.html, datasets
runtimes/       generated toolchain sandboxes (gitignored; `npm run setup:runtimes`)
prisma/         schema + migrations for the optional account database
scripts/        check-content, check-runner, setup-runtimes
ios/ android/   Capacitor 8 shells that load the running Next.js server
docs/           you are here
.design/        design brief, tokens, information architecture, research
```

### Native apps

`ios/` and `android/` are thin Capacitor shells: they load the running Next.js server rather than
bundling it, because `/api/run` and server rendering can't ship inside an app.

```bash
npm run dev                    # the apps point at http://localhost:3000 by default
adb reverse tcp:3000 tcp:3000  # Android only
npx cap sync                   # after changing capacitor.config.ts or plugins
npx cap open ios               # or: npx cap open android
```

For a release or a physical device, set `CAP_SERVER_URL` to a reachable URL (the dev server binds
to `127.0.0.1`, which a phone can't reach) and re-run `npx cap sync`.

---

## Every doc, in one list

| Doc | Stage | What it's for |
| --- | --- | --- |
| **README.md** (this page) | 1 | the front door: setup, the roadmap, reference |
| [architecture.md](architecture.md) | 2 | system overview, then the codebase layout |
| [tech-stack.md](tech-stack.md) | 2 | all 49 dependencies, what each one is for |
| [adding-a-lesson.md](adding-a-lesson.md) | 3 | step-by-step: set up → write → verify a lesson |
| [content-authoring.md](content-authoring.md) | 3 | content file format reference |
| [runtimes.md](runtimes.md) | 3–4 | the three execution paths, the guard, the sandbox |
| [accounts-and-storage.md](accounts-and-storage.md) | 3–4 | Dexie, Prisma, sync, auth |
| [adr/0001-local-runner.md](adr/0001-local-runner.md) | 4 | why local execution, and its security model |
| [agents/domain.md](agents/domain.md) | 5 | how agents consume domain docs |
| [agents/issue-tracker.md](agents/issue-tracker.md) | 5 | Markdown issues under `.scratch/` |
| [agents/triage-labels.md](agents/triage-labels.md) | 5 | the five triage roles |
| `superpowers/specs/`, `superpowers/plans/` | 5 | design specs and plans for shipped features |
| `../CLAUDE.md`, `../AGENTS.md` | 5 | repo rules for agents |
| `.design/thonglearn/` | 5 | design brief, tokens, IA, research |

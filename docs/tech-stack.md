# Technology stack

Every dependency in `package.json`, what it's for here, and where it's used. Versions are the
ranges in `package.json` — run `npm ls <name>` for what's actually installed.

Nothing is listed here that isn't in the repo, and nothing in the repo is left out. Two packages
are installed but unused; they're marked and listed again at the [bottom](#unused-dependencies).

---

## At a glance

| Layer | Choice |
| --- | --- |
| Language | TypeScript 5, ESM (`"type": "module"`) |
| Framework | Next.js 16.3.4 — App Router, Turbopack, React Server Components |
| UI runtime | React 19.2.8 |
| Styling | Tailwind CSS v4 (CSS-first, no config file) |
| Component library | shadcn/ui, `radix-nova` style, on Radix UI primitives |
| Icons | lucide-react |
| Animation | motion (Framer Motion), tw-animate-css |
| Fonts | Fontsource: JetBrains Mono, Poppins, Google Sans |
| Editor | Monaco via `@monaco-editor/react`, loaded from jsDelivr |
| Markdown | react-markdown + remark-gfm |
| Browser storage | Dexie (IndexedDB) |
| Server database | PostgreSQL via Prisma 7 + `pg` |
| Auth | better-auth |
| Code execution | Pyodide 314 (browser), `@anthropic-ai/sandbox-runtime` (local) |
| Native shell | Capacitor 8 (iOS + Android) |
| Tooling | ESLint 10, Prettier 3, `node --test` |
| Hosting | Vercel |

---

## Framework and language

| Package | Version | Role |
| --- | --- | --- |
| `next` | 16.3.4 (pinned) | App Router, Turbopack, RSC, route handlers, static generation. **Read `node_modules/next/dist/docs/` before writing Next.js code** — this version differs from most training data |
| `react` | 19.2.8 (pinned) | UI runtime |
| `react-dom` | 19.2.8 (pinned) | DOM renderer |
| `typescript` | ^5 | dev only. `tsconfig.json` is strict; `npm run typecheck` |
| `server-only` | ^0.0.1 | one import in `lib/content.ts` — makes the build fail if a client component pulls the filesystem-reading content loader in |
| `@types/node`, `@types/react`, `@types/react-dom`, `@types/pg` | ^20 / ^19 / ^19 / ^8.23.1 | dev only, type definitions |

Next and React are pinned exactly, not caret-ranged. The runtime gotchas around Next 16 are in
[architecture.md](architecture.md#conventions).

## Styling and UI

Tailwind v4 is **CSS-first**: there is no `tailwind.config.js`. Everything — theme tokens, custom
variants, fonts — lives in [`app/globals.css`](../app/globals.css), which opens with
`@import "tailwindcss"`.

| Package | Version | Role |
| --- | --- | --- |
| `tailwindcss` | ^4 | dev only. Utility CSS, configured entirely in `app/globals.css` |
| `@tailwindcss/postcss` | ^4 | dev only. The only PostCSS plugin (`postcss.config.mjs`) |
| `shadcn` | ^4.21.0 | the CLI that adds components, plus `shadcn/tailwind.css` which `globals.css` imports. **Add components with the CLI — never hand-write into `components/ui/`** |
| `radix-ui` | ^1.6.7 | the unstyled primitives shadcn components are built on (dialog, dropdown, tabs, tooltip, scroll-area…) |
| `class-variance-authority` | ^0.7.1 | typed variant props on shadcn components (`variant`, `size`) |
| `cn` | ^0.3.2 | class-name merging. Re-exported by `lib/utils.ts`, imported as `cn` in 26 components |
| `tw-animate-css` | ^1.4.0 | animation utilities, imported by `globals.css` |
| `lucide-react` | ^1.47.0 | icon set. Set as `iconLibrary` in `components.json` |
| `motion` | ^13.4.0 | Framer Motion. Page and pane transitions, the landing page, output/lesson-step animation |
| `next-themes` | ^0.4.6 | light/dark, persisted to `localStorage`. Also feeds Monaco's theme |
| `sonner` | ^2.0.8 | toasts (`app/layout.tsx`, the timer, setup, the workspace) |
| `cmdk` | ^1.1.1 | the ⌘K command palette, behind `components/ui/command.tsx` |
| `react-resizable-panels` | ^4.13.1 | the draggable editor/output panes. Sizes persist in cookies |
| `prettier-plugin-tailwindcss` | ^0.8.1 | dev only. Sorts class names |

`components.json` records the shadcn setup: style `radix-nova`, base color `neutral`, CSS
variables on, RSC on, alias `@/components`.

### Fonts

Self-hosted through Fontsource — no Google Fonts network request. The UI font is switchable from
the Appearance menu via a `data-font` attribute on `:root`; code is always JetBrains Mono.

| Package | Version | Used as |
| --- | --- | --- |
| `@fontsource-variable/jetbrains-mono` | ^5.3.0 | `--font-mono`, and the default `--font-ui` (`data-font="mono"`) |
| `@fontsource/poppins` | ^5.3.0 | `data-font="poppins"` (400/500/600) |
| `@fontsource/google-sans` | ^5.3.1 | `data-font="google-sans"` (400/500/600) |
| `@fontsource/plus-jakarta-sans` | ^5.3.0 | **unused** — not imported anywhere |

Design tokens (the Notion-derived palette, radii, reading sizes) are defined as CSS custom
properties in `globals.css` and surfaced to Tailwind through `@theme inline`. Source:
`.design/thonglearn/DESIGN.md`.

## Content rendering

| Package | Version | Role |
| --- | --- | --- |
| `react-markdown` | ^10.1.0 | renders lesson and guide Markdown in `components/doc.tsx`, with custom renderers for fences (the **Try it** button) and callout blockquotes |
| `remark-gfm` | ^4.0.1 | tables, strikethrough, task lists |

Parsing of frontmatter, starter/solution/check fences and quizzes is hand-rolled in
`lib/lesson-parser.ts` and `lib/quiz.ts` — no `gray-matter`, no MDX.

## Editor

| Package | Version | Role |
| --- | --- | --- |
| `@monaco-editor/react` | ^4.7.0 | the React wrapper. Loaded client-only via `next/dynamic` — Monaco touches `window` |
| `monaco-editor` | ^0.56.0 | dev only, for types. The editor itself is fetched at runtime from `cdn.jsdelivr.net/npm/monaco-editor@0.56.0`, so **bump both together** |

## Storage and data

| Package | Version | Role |
| --- | --- | --- |
| `dexie` | ^4.4.6 | IndexedDB wrapper. The source of truth for progress, drafts, quiz scores and run history (`lib/db.ts`, schema v3) |
| `dexie-react-hooks` | ^4.4.0 | `useLiveQuery` — components re-render on write without any store of our own |
| `prisma` | ^7.10.0 | dev only. CLI: `migrate`, `generate` |
| `@prisma/client` | ^7.10.0 | generated into `lib/generated/prisma`, not `node_modules` |
| `@prisma/adapter-pg` | ^7.10.0 | driver adapter wrapping `pg` |
| `pg` | ^8.23.0 | PostgreSQL driver |
| `better-auth` | ^1.7.5 | sessions, email+password, optional GitHub OAuth, via the Prisma adapter |

Accounts are optional — everything works signed out. See
[accounts-and-storage.md](accounts-and-storage.md).

## Code execution

The whole point of the app, and three separate runtimes. See [runtimes.md](runtimes.md).

| Package | Version | Role |
| --- | --- | --- |
| `pyodide` | ^314.0.7 | dev only — `scripts/check-content.ts` runs Python under Node. The **browser** loads Pyodide 314 from the jsDelivr CDN inside `public/python.worker.js`; that copy isn't an npm dependency |
| `@anthropic-ai/sandbox-runtime` | 0.0.77 (pinned) | the OS sandbox around every local-runner process — `sandbox-exec` on macOS, bubblewrap on Linux. Listed in `serverExternalPackages` because it spawns vendored helpers |

React lessons run in `public/react-preview.html`, which pulls React 19.3.0 and Sucrase from
esm.sh at runtime — also not npm dependencies. TypeScript and Claude Code lessons compile with
`typescript-6` (npm alias of `typescript@6.0.3`, copied into `public/generated/ts` by
`scripts/build-ts-assets.mjs`) and run with `@modelcontextprotocol/sdk` 1.30.0 and zod 4.6.5 from
esm.sh. PHP and Laravel run on `@php-wasm/web-8-5` 3.1.55 from jsDelivr (GPL, never bundled);
`@php-wasm/node-8-5` is the same build for `check:content`. C++ compiles with `@yowasp/clang`
and runs under `@bjorn3/browser_wasi_shim`, and its Visualize tab parses with `web-tree-sitter`
0.27.0 and `tree-sitter-cpp` 0.23.4, all from jsDelivr in `public/cpp.worker.js`; the devDependency
copies (same versions) are for `check:content` and the tests. Dart and Flutter use the learner's
own toolchains.

Version pinning matters in places that npm doesn't police: Pyodide 314 in the worker, Monaco
0.56.0 in `code-editor.tsx`, React 19.3.0 in the React preview, the SDK and zod versions in
`public/ts-run.html` (keep them equal to the devDependencies), and php-wasm 3.1.55 in
`public/php.worker.js` (equal to `@php-wasm/node-8-5`).

## Native apps

| Package | Version | Role |
| --- | --- | --- |
| `@capacitor/core` | ^8.5.2 | the bridge |
| `@capacitor/ios` | ^8.5.2 | the `ios/` project |
| `@capacitor/android` | ^8.5.2 | the `android/` project |
| `@capacitor/haptics` | ^8.0.2 | tap feedback (`components/haptics.tsx`); falls back to `navigator.vibrate` on the web |
| `@capacitor/cli` | ^8.5.2 | dev only. `npx cap sync`, `npx cap open` |

Both apps are remote shells that load the running Next.js server — see
[docs/README.md § Native apps](README.md#native-apps).

## Tooling

| Package | Version | Role |
| --- | --- | --- |
| `eslint` | ^10 | `npm run lint`, flat config in `eslint.config.mjs` |
| `eslint-config-next` | 16.3.4 | Next's rules, pinned to the framework version |
| `prettier` | ^3.9.6 | `npm run format` — **globs `ts,tsx` only**, so Markdown and CSS are not formatted |

Tests are `node --test` over `lib/*.test.ts` — no Jest, no Vitest, no framework. Only pure logic
is unit-tested (`merge`, `quiz`, `stats`, `focus-timer`); everything else is covered by
`check:content` and `check:runner`, which run the real thing.

## Unused dependencies

Both are in `dependencies` with no import anywhere in `app/`, `components/`, `lib/`, `public/`,
`hooks/` or `scripts/`:

| Package | Note |
| --- | --- |
| `page-mascot` | the mascot in `components/mascot.tsx` is hand-rolled from `public/images/*-directions.webp` sprite sheets |
| `@fontsource/plus-jakarta-sans` | not imported by `globals.css`, not in the `FONTS` list in `components/appearance-menu.tsx` |

Removing them is safe:

```bash
npm uninstall page-mascot @fontsource/plus-jakarta-sans
```

One more placement nit: `shadcn` is a build-time CLI with no runtime import, so it belongs in
`devDependencies` rather than `dependencies`. It does no harm where it is — `globals.css` imports
`shadcn/tailwind.css` at build time either way.

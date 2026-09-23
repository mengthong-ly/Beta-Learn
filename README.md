# ThongLearn

Hands-on programming courses where the code really runs: Python, PHP, Laravel 13, TypeScript, React, C++, Dart, Flutter and Claude Code. Each lesson pairs prose with a real VS Code editor (Monaco) and a challenge whose **check** decides whether you solved it. Python adds a 14-chapter Guide Book with "Behind the scenes" deep-dives and an **Inspect** tab showing bytecode, object identity and reference counts.

In your browser: Python (real CPython 3.14 via Pyodide), React (a sandboxed iframe), TypeScript and Claude Code (TypeScript 6 in a worker), PHP and Laravel (PHP 8.5 compiled to WebAssembly). C++, Dart and Flutter need your own toolchains: on the website they're read-and-write only, and a local copy runs them through the [local runner](docs/adr/0001-local-runner.md). Nothing runs on our server ([ADR-0002](docs/adr/0002-browser-runtimes.md)).

**Building on this?** Start with the [developer docs](docs/README.md).

```bash
npm install
npm run dev              # http://localhost:3000 (everything but C++, Dart and Flutter works right away)
npm run setup:runtimes   # once, for C++, Dart and Flutter (your own toolchains)
npm run check:content    # run every lesson and guide example for real
npm run build && npm start
```

- **Stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, shadcn/ui, Monaco (CDN), Pyodide 314, Dexie (IndexedDB), motion.
- **Content**: `content/<course>/lessons/NN-slug.md` (challenge = fenced `<lang> starter|solution|check` blocks) and `content/python/guide/*.md` (`> 🔍 **Behind the scenes: …**` renders as a collapsible, `> 🧭 **Scenario:**` as a card). See [content-authoring.md](docs/content-authoring.md).
- **Python runtime**: `public/python.worker.js` is an unbundled *module* worker. Turbopack would bundle workers as classic scripts, which Pyodide 314 rejects. `public/inspect.py` collects the Inspect data.
- **Datasets**: `public/data/*.csv` are written into Python's working directory before every run. pandas/numpy download from the Pyodide CDN on first import.
- **History, progress, drafts**: IndexedDB in this browser only.
- **Design docs**: `.design/thonglearn/`.

## Native apps (iOS and Android)

`ios/` and `android/` are Capacitor 8 apps. They are thin shells that load the running Next.js server from `server.url` in `capacitor.config.ts`, because `/api/run` and server rendering can't be bundled. `native-shell/index.html` is the offline fallback page. Taps on links and buttons give haptic feedback (`components/haptics.tsx`, `@capacitor/haptics`); on the web it falls back to `navigator.vibrate` (Android only).

```bash
npm run dev                          # the apps load http://localhost:3000 by default
adb reverse tcp:3000 tcp:3000        # Android only: lets the app reach your Mac
npx cap sync                         # after changing capacitor.config.ts or plugins
npx cap open ios                     # or: npx cap open android
```

- **Release or physical device**: `npm run dev` binds to `127.0.0.1`, so a real phone can't reach it. Set `CAP_SERVER_URL` to the deployed URL (or your Mac's LAN address), then `npx cap sync`.
- **Known issue**: on iOS the status bar sits on a white strip above dark pages. Fix: add `@capacitor/status-bar` and match its color to the theme.

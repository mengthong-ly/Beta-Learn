# ThongLearn

Learn Python and pandas: 59 hands-on lessons grouped into the 12 sessions of a Python-for-data course (basics → files & CSV → pandas cleaning, grouping and analysis), a 14-chapter Guide Book with "Behind the scenes" deep-dives, a real VS Code editor (Monaco), and an **Inspect** tab that shows what your code does inside Python: bytecode, object identity, reference counts. Real CPython 3.14 runs in your browser via Pyodide. Nothing runs on a server.

```bash
npm install
npm run dev              # http://localhost:3000
npm run check:content    # verify every lesson and guide example in real Python
npm run build && npm start
```

- **Stack**: Next.js 16 (App Router, Turbopack), React 19, Tailwind v4, shadcn/ui, Monaco (CDN), Pyodide 314, Dexie (IndexedDB), motion.
- **Content**: `content/lessons/*.md` (challenge = fenced `python starter|solution|check` blocks) and `content/guide/*.md` (`> 🔍 **Behind the scenes: …**` renders as a collapsible, `> 🧭 **Scenario:**` as a card).
- **Python runtime**: `public/python.worker.js` is an unbundled *module* worker. Turbopack would bundle workers as classic scripts, which Pyodide 314 rejects. `public/inspect.py` collects the Inspect data.
- **Datasets**: `public/data/*.csv` are written into Python's working directory before every run. pandas/numpy download from the Pyodide CDN on first import.
- **History, progress, drafts**: IndexedDB in this browser only.
- **Design docs**: `.design/thonglearn/`.

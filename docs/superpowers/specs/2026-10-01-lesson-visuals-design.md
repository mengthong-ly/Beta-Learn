# Lesson visuals: 3D emoji, diagrams and animated scenes

Approved 2026-10-01.

## Why

Beginners learn best by seeing. Lessons explain ideas in prose and in about 37 hand-drawn `text` fences (flows, variable maps, trees, lists), and those look like terminal output. The goal is to make ideas visible, in every course, without making lessons harder to write.

## Decisions

- **Icons:** Fluent Emoji 3D (Microsoft, MIT). We take them from `@lobehub/fluent-emoji-3d@1.1.0`, an MIT repackage that names each file after its codepoints (for example `1f4a1.webp`, `26a0-fe0f.webp`), about 4 KB each. Thiings was rejected: its free tier is non-commercial and needs attribution.
- **Kinds of visual:** 3D emoji, static diagrams **and** animated scenes.
- **Scope:** every course.

## Design

1. **Authors write real emoji in markdown.** `npm run emoji` (`scripts/build-emoji.ts`) scans `content/**/*.md`. It downloads the 3D WebP for each emoji it hasn't fetched yet into `public/emoji/<codepoints>.webp`, and writes `lib/emoji-manifest.ts` listing what's on disk. The files are committed, so builds never hit the network.
2. **Emoji in prose become 3D icons.** A rehype plugin (`lib/rehype-emoji.ts`) replaces emoji in text nodes with `<img alt="<emoji>">`. It skips `code` and `pre`, and skips emoji that aren't in the manifest. Callout detection reads the `alt`, so the 💡 ⚠️ 🎯 🔍 🧭 📝 callouts keep working.
3. **The ` ```diagram ` fence** is a small line language (`lib/diagram.ts`). It has these shapes:
   - `flow: A -> B -> C`
   - `list: a, b, c` (shown with its indexes)
   - `bind: x = 5 | name = "Mia"` (a name tag pointing to a value)
   - `values: 6` (values with no name pointing at them yet)
   - `tree: root`, followed by indented children
   - `caption: …`
   
   An item may start with an emoji, which is shown as its 3D icon. Commas, `|` and `->` inside double quotes don't split items.
4. **The ` ```scene ` fence** is a set of diagram frames separated by `---` lines, each with a caption. Items keep their identity across frames: `layoutId` is the item's kind plus its label, scoped by a per-scene `LayoutGroup`. That makes a value fly from `values:` into a `bind:` row, and a tag move to a new value. The player reuses `usePlayer` and `VizTimeline` with `keys={false}`, because the lesson stepper owns ←/→. The caption is `aria-live`. `MotionConfig reducedMotion="user"` applies.
5. **Checks.** `check:content` parses every diagram and scene fence, and fails when an emoji in prose or in a diagram has no icon.
6. **Rollout:**
   - **A:** the infrastructure, plus 3D callout icons in all courses.
   - **B:** convert the diagram-like `text` fences in all courses.
   - **C:** add scenes. That's about 10 for the key ideas in Fundamentals (how code runs, variables, decisions, loops, functions, lists, tracing, debugging, Git), plus one "how X runs" scene for each course guide.

## Out of scope

- Quiz text and the sidebar keep native emoji.
- No visual editor.
- No new icon sets.

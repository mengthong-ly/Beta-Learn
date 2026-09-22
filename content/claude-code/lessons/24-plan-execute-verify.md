---
title: Plan, execute, verify
section: 5 · Agentic Workflows
---

Letting an agent jump straight to code is fast, and often solves the wrong problem. Anthropic's Claude Code best practices recommend a fixed rhythm instead: **explore, plan, implement, commit**, with a check Claude can run at every step. This lesson covers that loop and the tool that makes "verify" measurable when the thing you build is itself an LLM feature: an **eval**.

## The four phases

| Phase | Mode | What you ask for |
| --- | --- | --- |
| **Explore** | Plan mode | "read /src/auth and understand how we handle sessions and login." Claude reads files and answers questions, no changes. |
| **Plan** | Plan mode | "I want to add Google OAuth. What files need to change? Create a plan." Press `Ctrl+G` to edit the plan in your text editor. |
| **Implement** | Normal mode | "implement the OAuth flow from your plan. write tests for the callback handler, run the test suite and fix any failures." |
| **Commit** | Normal mode | "commit with a descriptive message and open a PR" |

**Plan mode** is what keeps the first two phases honest: Claude reads files and proposes a plan but makes no edits until you approve. The status bar shows `⏸ plan mode on`. Enter it by pressing `Shift+Tab` until that label appears, or start the session in it:

```bash
claude --permission-mode plan
```

Leave it by approving the plan or pressing `Shift+Tab` again.

> 💡 **Tip:** plan mode adds overhead. The docs' rule of thumb: *if you could describe the diff in one sentence, skip the plan.* Plan when you're unsure of the approach, the change spans several files, or the code is unfamiliar.

## Verify: give Claude a check it can run

"Claude stops when the work looks done." Without a check, *you* are the verification loop. With one (a test suite, a build exit code, a linter, a script that diffs output against a fixture, a screenshot compared to a design), Claude runs it, reads the result and keeps going until it passes.

The difference is in the prompt:

| Before | After |
| --- | --- |
| "implement a function that validates email addresses" | "write a validateEmail function. example test cases: user@example.com is true, invalid is false, user@.com is false. run the tests after implementing" |
| "the build is failing" | "the build fails with this error: [paste error]. fix it and verify the build succeeds. address the root cause, don't suppress the error" |

The docs then list ways to make the check harder to skip: ask for it in the prompt; set it as a `/goal` condition that's re-checked after every turn; run it as a **Stop hook** that blocks the turn from ending until it passes; or have a **verification subagent** review the diff in a fresh context, so the agent that did the work isn't the one grading it. Ask for evidence (the command and its output), not "done!".

In code, "a check it can run" is just this: known inputs, expected outputs, a pass/fail verdict.

```typescript
function validateEmail(s: string): boolean {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(s)
}

const cases: [string, boolean][] = [
  ["user@example.com", true],
  ["invalid", false],
  ["user@.com", false],
]

let failures = 0
for (const [input, expected] of cases) {
  const got = validateEmail(input)
  if (got !== expected) failures++
  console.log(got === expected ? "PASS" : "FAIL", input, "->", got)
}
console.log(failures === 0 ? "all checks pass" : `${failures} failing`)
```

## Evals: tests for LLM output

Unit tests work when the output is deterministic. When you build *on top of* Claude (a classifier, an extractor, an agent), outputs vary, so you measure a **pass rate** over many cases. That's an eval. The platform docs start one step earlier, with **success criteria** that are:

- **Specific:** not "good performance" but "accurate sentiment classification".
- **Measurable:** a number. "Safe outputs" is bad; "less than 0.1% of outputs out of 10,000 trials flagged for toxicity" is good.
- **Achievable:** based on benchmarks, prior experiments or expert knowledge.
- **Relevant:** tied to what your users actually need.

Then three eval design principles: be **task-specific** (mirror real inputs, include edge cases), **automate** grading when possible, and **prioritize volume over quality** (many auto-graded cases beat a few hand-graded ones).

## Grading with code

The docs rank graders from fastest to slowest:

| Method | How | Trade-off |
| --- | --- | --- |
| **Code-based** | Exact match `output == golden_answer`; string match `key_phrase in output` | Fastest, most reliable, but lacks nuance |
| Human | A person reads and scores | Flexible and high quality, but slow and expensive; avoid if possible |
| LLM-based | Another model scores with a rubric | Fast and flexible, test its reliability first |

The docs' exact-match example normalizes before comparing (`strip().lower()` in Python), so `" Positive\n"` still matches `"positive"`. In TypeScript:

```typescript
const exactMatch = (output: string, golden: string) => output.trim().toLowerCase() === golden.toLowerCase()
const includes = (output: string, phrase: string) => output.includes(phrase)

console.log(exactMatch(" Positive\n", "positive")) // true
console.log(exactMatch("positive!", "positive")) // false
console.log(includes("Your refund was issued today.", "refund")) // true
```

Below, a **scripted fake model** stands in for Claude so the eval runs offline. It's a stand-in with a deliberate weakness; the eval finds it.

```typescript
// Stand-in for a Claude call that classifies sentiment.
async function fakeClassify(text: string): Promise<string> {
  if (text.includes("love")) return "Positive"
  if (text.includes("hate")) return "negative"
  return "neutral" // never says "mixed": the bug the eval should expose
}

const tweets = [
  { text: "I love this!", sentiment: "positive" },
  { text: "I hate Mondays", sentiment: "negative" },
  { text: "It's a phone.", sentiment: "neutral" },
  { text: "I love the screen but hate the battery", sentiment: "mixed" },
]

let correct = 0
for (const t of tweets) {
  const out = await fakeClassify(t.text)
  if (out.trim().toLowerCase() === t.sentiment) correct++
  else console.log(`FAIL "${t.text}": got ${out}, want ${t.sentiment}`)
}
console.log(`Accuracy: ${(correct / tweets.length) * 100}%`)
```

Swap the fake for the real call and the harness stays the same:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic() // reads ANTHROPIC_API_KEY

async function classify(text: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 10,
    messages: [{ role: "user", content: `Classify this as 'positive', 'negative', 'neutral', or 'mixed': ${text}` }],
  })
  const block = msg.content.find((b) => b.type === "text")
  return block?.type === "text" ? block.text : ""
}
```

Run the eval before and after every prompt change. A change that "feels better" but drops the pass rate isn't better.

## Challenge

> 🎯 **Challenge:** Write `runEvals(cases, fn)`. For each case, `await fn(case.input)` and grade it: `"exact"` means trimmed, case-insensitive equality; `"includes"` means the output contains `expected` (case-sensitive). Return `{ total, passed, passRate, failures }`, where `passRate` is `passed / total` (0 for no cases) and each failure is `{ input, expected, output }`.

```typescript starter
export type EvalCase = { input: string; expected: string; grader: "exact" | "includes" }
export type Failure = { input: string; expected: string; output: string }
export type Report = { total: number; passed: number; passRate: number; failures: Failure[] }

export async function runEvals(
  cases: EvalCase[],
  fn: (input: string) => Promise<string>,
): Promise<Report> {
  // TODO: run every case, grade it, collect failures
  return { total: cases.length, passed: 0, passRate: 0, failures: [] }
}

// Scripted stand-in for a model.
const fakeModel = async (input: string) =>
  input === "2+2" ? " 4 " : input === "capital of France" ? "The capital is Paris." : "no idea"

const report = await runEvals(
  [
    { input: "2+2", expected: "4", grader: "exact" },
    { input: "capital of France", expected: "Paris", grader: "includes" },
    { input: "capital of Peru", expected: "Lima", grader: "includes" },
  ],
  fakeModel,
)
console.log(report)
```

```typescript solution
export type EvalCase = { input: string; expected: string; grader: "exact" | "includes" }
export type Failure = { input: string; expected: string; output: string }
export type Report = { total: number; passed: number; passRate: number; failures: Failure[] }

function grade(c: EvalCase, output: string): boolean {
  if (c.grader === "exact") return output.trim().toLowerCase() === c.expected.trim().toLowerCase()
  return output.includes(c.expected)
}

export async function runEvals(
  cases: EvalCase[],
  fn: (input: string) => Promise<string>,
): Promise<Report> {
  const failures: Failure[] = []
  let passed = 0
  for (const c of cases) {
    const output = await fn(c.input)
    if (grade(c, output)) passed++
    else failures.push({ input: c.input, expected: c.expected, output })
  }
  const total = cases.length
  return { total, passed, passRate: total === 0 ? 0 : passed / total, failures }
}

// Scripted stand-in for a model.
const fakeModel = async (input: string) =>
  input === "2+2" ? " 4 " : input === "capital of France" ? "The capital is Paris." : "no idea"

const report = await runEvals(
  [
    { input: "2+2", expected: "4", grader: "exact" },
    { input: "capital of France", expected: "Paris", grader: "includes" },
    { input: "capital of Peru", expected: "Lima", grader: "includes" },
  ],
  fakeModel,
)
console.log(report)
```

```typescript check
const model = async (input: string) =>
  ({ a: " Positive\n", b: "negative!", c: "It is about refunds.", d: "It is about Refunds." } as Record<string, string>)[input] ?? ""

const r = await lesson.runEvals(
  [
    { input: "a", expected: "positive", grader: "exact" },
    { input: "b", expected: "negative", grader: "exact" },
    { input: "c", expected: "refund", grader: "includes" },
    { input: "d", expected: "refund", grader: "includes" },
  ],
  model,
)
expect(r.total === 4, `total should be 4, got ${r.total}`)
expect(r.passed === 2, `expected 2 passes (" Positive\\n" exact-matches "positive"; "includes" is case-sensitive), got ${r.passed}`)
expect(r.passRate === 0.5, `passRate should be passed / total = 0.5, got ${r.passRate}`)
expect(r.failures.length === 2, `expected 2 failures, got ${r.failures.length}`)
const f = r.failures.find((x: { input: string }) => x.input === "b")
expect(f !== undefined && f.expected === "negative" && f.output === "negative!", "each failure should be { input, expected, output } with the raw model output")

const empty = await lesson.runEvals([], model)
expect(empty.total === 0 && empty.passRate === 0, "an empty case list should give total 0 and passRate 0 (not NaN)")
```

**Reference:** [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices) and [Common workflows](https://code.claude.com/docs/en/common-workflows) in the Claude Code docs, and [Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests) in the Claude Platform docs.

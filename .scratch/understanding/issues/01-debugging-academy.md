# Debugging: teach it as a skill, not an error message

Status: open
Blocked by: nothing

## What
Beginners are told "your answer is wrong, try again". Real debugging is observe → hypothesise →
test → fix → verify. A 2024 systematic review (Yang et al., ACM TOCE,
https://doi.org/10.1145/3690652) finds beginners struggle with all five, and that the struggle
feeds "I'm bad at programming" rather than "this is a normal bug".

Build a lesson kind where the learner is given **working-looking but wrong** code and led through
locating the fault, instead of being shown the fix.

## Shape
A new fenced block, e.g. ```<lang> broken```, alongside the existing `starter`/`solution`/`check`
(`lib/lesson-parser.ts` — note its fence regex is non-validating `\w+`, and `blocks[block]` means
a duplicate fence silently overwrites). The lesson then asks, in order:
1. What *should* this produce? (a prediction — reuse `PredictRun`)
2. Run it. Where does the real output first differ? (reuse `comparePrediction`)
3. Step to that moment. (reuse `divergenceStep` + the visualizer — already wired for Python/C++)
4. Which line is responsible, and what assumption was wrong?
5. Fix it; the existing `check` verifies.

Steps 1–3 already exist and are the whole point of reusing them: the Debugging Academy is mostly
*sequencing* what Phase 1 built, plus authored broken code.

## Also
Teach bug *categories* (syntax / runtime / logic / type / state / off-by-one / bad assumption /
data shape / async / integration) as a vocabulary the learner can name, and a "wrong answer
museum" framing: "programmers commonly make this mistake", never "you are bad at this".
Tone rule from `.design/thonglearn/DESIGN.md`: peach, not red; "Not quite", never "WRONG".

## Done when
A `debugging` section exists in at least the Python course, `npm run check:content -- python`
passes (the broken block must be exempt from the "every example runs clean" rule, or carry the
existing `# error!` marker), and the five steps work end to end in the browser.

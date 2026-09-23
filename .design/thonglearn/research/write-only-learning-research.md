# Learning without running: evidence for write-only lessons

Researched 2026-09-23. On the website, Dart, Flutter and C++ lessons are write-only: learners read, write code and can open the solution, but can't Run or Check. This note collects what the research says helps in that situation, and what ThongLearn builds from it.

## What already exists

- 380 runnable examples across the 99 non-browser lessons; 43 are `error!` examples (33 of them TypeScript type errors).
- 88 of 99 lessons have readable `expect(…, "message")` lines in their checks (about 376). Flutter checks have none.
- `scripts/check-content.ts` runs every example and solution for real and discarded the output until now.
- Before this work, "Show solution" overwrote the learner's draft, and the streak only counted runs.

## Evidence

| Technique | Evidence | Caveats |
|---|---|---|
| PRIMM (Predict → Run → Investigate → Modify → Make) | 493 PRIMM students vs 180 controls in 13 schools scored higher (M 3.28 vs 2.57, p < .05, small effect); teachers rated Predict most useful ([Sentance, Waite & Kallia 2019](https://www.tandfonline.com/doi/full/10.1080/08993408.2019.1608781)) | Quasi-experimental; tests the whole package |
| Reading and tracing before writing | Many novices can't predict short programs' output ([Lister et al. 2004](https://dl.acm.org/doi/10.1145/1041624.1041673)); tracing ability correlates with writing ([Lopez et al. 2008](https://dl.acm.org/doi/10.1145/1404520.1404531); [Venables, Tan & Lister 2009](https://dl.acm.org/doi/10.1145/1584322.1584336)); explicit tracing → writing instruction helped ([Xie et al. 2019](https://doi.org/10.1080/08993408.2019.1565235)) | Correlational; small samples |
| Tracing tables / notional machines | Memory-table tracing strategy: +15% tracing scores ([Xie, Nelson & Ko 2018](https://www.benjixie.com/publication/sigcse-2018/)); PLTutor 60% higher gains than Codecademy ([Nelson, Xie & Ko 2017](https://dl.acm.org/doi/10.1145/3105726.3106178)); [Sorva 2013](https://dl.acm.org/doi/10.1145/2483710.2483713) | Small lab studies |
| Worked and faded examples | Examples beat problem solving early ([Renkl & Atkinson 2003](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_3)); fading + self-explanation prompts improve transfer ([Atkinson, Renkl & Merrill 2003](https://asu.elsevierpure.com/en/publications/transitioning-from-studying-examples-to-solving-problems-effects-/)); completing programs beat writing from scratch ([van Merriënboer 1990](https://journals.sagepub.com/doi/10.2190/4NK5-17L7-TWQV-1EHL)) | Expertise reversal ([Kalyuga et al. 2003](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_4)) |
| Subgoal labels | Better performance and transfer ([Margulieux, Guzdial & Catrambone 2012](https://dl.acm.org/doi/10.1145/2361276.2361291)); fewer drops and fails over a semester ([Margulieux, Morrison & Decker 2020](https://link.springer.com/article/10.1186/s40594-020-00222-7)) | Hand-written content |
| Parsons problems | Faster than writing, similar learning ([Ericson, Margulieux & Rick 2017](https://dl.acm.org/doi/10.1145/3141880.3141895)); faded Parsons beat tracing and writing for patterns ([Weinman, Fox & Hearst 2021](https://dl.acm.org/doi/fullHtml/10.1145/3411764.3445228)) | May not transfer to writing ([thesis](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2022/Archive/EECS-2022-257.pdf)) |
| Self-explanation | Meta-analysis g = 0.55 ([Bisra et al. 2018](https://link.springer.com/article/10.1007/s10648-018-9434-x)); [Chi et al. 1989](https://onlinelibrary.wiley.com/doi/abs/10.1207/s15516709cog1302_1) | Quality of explanation matters |
| Attempt first, then compare with the solution | g = 0.36, up to 0.58 when instruction builds on the learner's own attempt ([Sinha & Kapur 2021](https://journals.sagepub.com/doi/10.3102/00346543211019105)); answer keys split into small idea units make self-scoring more accurate ([Rawson & Dunlosky 2007](https://www.tandfonline.com/doi/abs/10.1080/09541440701326022)) | Self-assessment stays inflated |
| Predict before revealing | Predicting a demo's outcome improved understanding; watching alone didn't ([Crouch et al. 2004](https://mazur.harvard.edu/publications/classroom-demonstrations-learning-tools-or-entertainment)); committing to a prediction beats judging afterwards ([Brod, Hasselhorn & Bunge 2018](https://www.sciencedirect.com/science/article/abs/pii/S0959475217303468)); practice tests beat restudy, g = 0.51 ([Adesope et al. 2017](https://journals.sagepub.com/doi/abs/10.3102/0034654316689306)) | Learner must commit to the guess |

**Takeaway:** write-only learners can still Predict, see the real result, and compare their attempt with the solution. The strongest levers are committing to a prediction before seeing real output, comparing against an explicit checklist, and self-explanation.

## What ThongLearn builds (first slice, no new hand-written content)

1. **Recorded real output** under every example and solution (`npm run check:content -- --record`), shown as "Predict: what will this print?" with an optional guess and a Reveal button.
2. **Compare view** instead of overwriting the draft: a diff of the learner's code against the solution, the solution's real output, a "Your code should…" checklist built from the check's `expect` messages, and three self-explanation prompts.
3. **Reading counts in the streak.**

Later: Parsons problems generated from the solution (verified progress on about 43 lessons), quiz content with verified "what does this print?" answers, subgoal-labelled solutions.

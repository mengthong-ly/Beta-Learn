# Focus timer and ADHD-friendly learning: research

Researched 2026-09-22 against primary sources: PubMed abstracts (fetched through NCBI E-utilities), journal pages, Francesco Cirillo's own Pomodoro Technique paper, W3C/WAI specs, MDN, and capacitorjs.com. Evidence strength is rated **strong** (several meta-analyses agree), **moderate** (one meta-analysis, or several consistent trials), **weak** (a single small study, a survey, or indirect evidence) or **none**. Anything not confirmed from a primary source is marked **UNVERIFIED**.

## TL;DR

- **25/5 is a convention, not a finding.** Cirillo's own paper puts the ideal Pomodoro at 20–35 minutes and let teams pick their own length. Trials with students are mixed: fixed breaks beat self-regulated ones in one study (Biwer 2023), were worse or equal in two others (Smits 2025, Göksu 2026), and **no study found a difference in learning or task completion**. So make both lengths configurable and don't promise results.
- **No Pomodoro study has used an ADHD sample.** A PubMed search for "pomodoro ADHD" returns nothing. Everything ADHD-specific below comes from lab work on timing and attention.
- **Time perception really is impaired in ADHD** (strong: two meta-analyses, 55 and 27 studies). That is the best argument for making elapsed and remaining time *visible* all the time instead of making the learner judge it.
- **Micro-breaks help how learners feel (vigor, fatigue) more than how they perform** (moderate: Albulescu 2022, d≈0.35). Longer breaks help performance more, and demanding tasks may need more than 10 minutes. Breaks on a phone restore less than other breaks (weak to moderate).
- **Evidence-backed learning features, in order of strength:** retrieval practice and spacing (strong, and it works in ADHD samples too), feedback (strong, d=0.48), short learner-paced segments (moderate), implementation intentions / if-then session goals (moderate, possibly stronger in ADHD), gamification (moderate but small, weaker when it is only points and badges). Body doubling has almost no evidence (one survey).
- **A user-started study timer is not a WCAG 2.2.1 "time limit"**, but it still needs pause/stop (2.2.2), `prefers-reduced-motion` for the draining ring (2.3.3), and **silent** screen-reader updates. The ARIA `timer` role defaults to `aria-live="off"`; announce only phase changes.
- **Implementation: store an absolute `Date.now()` deadline and compute what's left from it.** Background tabs throttle timers, down to once a minute in Chrome, and `performance.now()` stops during sleep on most platforms. On native, use `@capacitor/local-notifications` to schedule the end alert.
- **Don't build:** hard-locked breaks, a ticking sound by default, a streak that punishes a missed day, red "time's up" alarms, or per-second announcements.

---

## 1. Pomodoro and timeboxing

| Finding | Strength | Source |
|---|---|---|
| Cirillo's rules: 25 min of work, a 3–5 min break, and a 15–30 min break every four Pomodoros. "A Pomodoro is indivisible", and you stop when it rings, not "a few more minutes". | Primary source (a method, not evidence) | Cirillo, *The Pomodoro Technique* v1.3 (2006/2007, CC BY-NC-ND), §2.1–2.1.2. Official site: https://www.pomodorotechnique.com/ (the book is sold there). Free v1.3 copy used for this note: https://www.northbaycounselling.com/wp-content/uploads/2022/05/Cirillo-Pomodoro-Technique.pdf (a third-party mirror; **UNVERIFIED** that it matches the author's current edition) |
| **Cirillo himself** calls 20–35 min the ideal range, with 40 at most, and says the method "works best with 30-minute time periods". Teams in his mentoring could choose their own length. Break length "depends on how tired you feel". | Primary source | Same PDF, §3.2 "The Length of the Pomodoro", §3.3 "Varying the Length of Breaks" |
| Cirillo describes **"ring anxiety"**: learners feeling controlled, or asking "am I going fast enough?" with every tick. His fix is to *record* Pomodoros rather than race them. | Primary source | Same PDF, §3.7 |
| **Biwer et al. 2023** (n=87 students, one real study day): 24/6 or 12/3 fixed breaks vs self-regulated. Self-regulators studied and rested longer, and reported more fatigue and distraction and less concentration and motivation. **No difference in effort or task completion.** | Moderate (one RCT) | https://pubmed.ncbi.nlm.nih.gov/36859717/ · https://doi.org/10.1111/bjep.12593 |
| **Smits et al. 2025** (n=94, 2-hour session): Pomodoro 25/5 vs Flowtime vs self-regulated. With Pomodoro, fatigue rose *faster*; with Pomodoro and Flowtime, motivation fell faster. **No overall difference** in fatigue, motivation, productivity, task completion or flow. | Moderate | https://pubmed.ncbi.nlm.nih.gov/40723645/ · https://doi.org/10.3390/bs15070861 |
| **Göksu et al. 2026** (n=176, reading and a comprehension test): **self-regulated** breaks gave better mood (energy, concentration, motivation, less distraction). No difference in comprehension. The authors conclude that "flexibility in break-taking may be important". | Moderate | https://pubmed.ncbi.nlm.nih.gov/42510279/ · https://doi.org/10.3390/bs16071158 |
| A 2025 scoping review (32 studies, only 3 RCTs) reports that Pomodoro helps. Most included studies are observational, so treat it as low quality. | Weak | Ogut 2025, https://pubmed.ncbi.nlm.nih.gov/41107936/ |
| Pomodoro in ADHD samples | **None** | A PubMed search for "pomodoro ADHD" (2026-09-22) returned 0 results |

**Answer.** 25/5 is a convention. Even its author gives a range. Outcomes on mood go both ways between studies, and learning outcomes don't differ. **Make work and break lengths configurable** (presets such as 15/3, 25/5 and 45/10), and offer a "flexible" mode where the learner ends the block and the app suggests a break in proportion to it, Flowtime-style.

## 2. Breaks and vigilance

| Finding | Strength | Source |
|---|---|---|
| Meta-analysis (22 samples, N=2,335; micro-break means ≤10 min): vigor up (d=.36), fatigue down (d=.35), overall **performance not significant** (d=.16). Performance improved only on less demanding tasks, and **longer breaks gave bigger performance gains**. "recovering from highly depleting tasks may need more than 10-minute breaks." | Moderate | Albulescu et al. 2022, https://pubmed.ncbi.nlm.nih.gov/36044424/ · https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0272460 |
| Vigilance decrement as "goal habituation": brief, rare switches away from the task prevented the decline in a lab vigilance task. | Weak (single lab study) | Ariga & Lleras 2011, *Cognition* 118(3), https://www.sciencedirect.com/science/article/abs/pii/S0010027710002994 |
| Phone breaks restored less than paper or computer breaks (n=414, anagrams). They were no faster than taking no break, and solved fewer anagrams than the other break groups. | Weak to moderate (one RCT) | Kang & Kurtzberg 2019, https://pubmed.ncbi.nlm.nih.gov/31418586/ |
| Exercise improves executive function in children with ADHD (SMD=0.61). Intensity and acute vs chronic sessions moderate the effect. The studies are about exercise programmes, **not** 5-minute study breaks. | Moderate but indirect | Liang et al. 2021, https://pubmed.ncbi.nlm.nih.gov/34022908/ |
| Cirillo: breaks should be "totally disconnected from work": stand up, walk, don't do anything complex. | Primary source (method) | Cirillo PDF §2.1.1–2.1.2 (link above) |

**Answer.** Breaks reliably help how people feel. Their effect on performance is small and grows with length. "Get up and move, step away from the screen" is well reasoned and has indirect support; there is no trial of *movement* micro-breaks in study sessions. Suggest movement or looking away during breaks, but don't claim it's proven. Break screens should be calm and have no content to scroll.

## 3. ADHD specifics

| Finding | Strength | Source |
|---|---|---|
| **Time perception deficits:** 55 studies. Poorer discrimination (especially sub-second), more variable estimates, an "accelerated internal clock", and reproduction affected by attention (distraction) and motivation (delay aversion). | Strong | Marx et al. 2022, *JAACAP*, https://pubmed.ncbi.nlm.nih.gov/34923055/ |
| Children and adolescents: 27 studies, 1,620 ADHD vs 1,249 controls. Less accurate (g>0.40), less precise (g=0.66), and more likely to overestimate. The type of task didn't moderate the result. | Strong | Zheng et al. 2022, https://pubmed.ncbi.nlm.nih.gov/33302769/ |
| **Delay aversion:** small-to-medium effects; people with ADHD pick small-immediate over large-delayed rewards more often, and real rewards nearly double that. | Moderate to strong | Marx et al. 2021, https://pubmed.ncbi.nlm.nih.gov/29806533/ |
| Reinforcement helps performance and motivation, somewhat more in ADHD. ADHD children prefer immediate reward. | Moderate (narrative review, 22 studies) | Luman et al. 2005, https://pubmed.ncbi.nlm.nih.gov/15642646/ |
| **Sustained attention:** large overall CPT deficits, but only small-to-moderate decline *over time*. The problem is sensitivity (d′), not just fading. | Strong | Huang-Pollock et al. 2012, https://pubmed.ncbi.nlm.nih.gov/22428793/ |
| **Hyperfocus:** more self-reported hyperfocus with higher ADHD symptoms (n=251 + 372), including in school and screen settings. | Weak to moderate (self-report) | Hupfeld et al. 2019, https://pubmed.ncbi.nlm.nih.gov/30267329/ |
| …but a clinical ADHD group didn't differ from matched controls, and hyperfocus was *less* likely in education settings. | Weak to moderate | Groen et al. 2020, https://pubmed.ncbi.nlm.nih.gov/33126147/ |
| **Visual "Time Timer":** n=44 children aged 7–9. Less anticipatory anxiety and less off-task and fidgety behaviour, especially in higher-ADHD-risk children. No gain in maths scores. 25% checked the timer more than 7 times in 5 minutes. | Weak (one small crossover study, a timed test rather than study) | Hallez & Vallier 2025, https://pubmed.ncbi.nlm.nih.gov/41440149/ |

**Answer.** The case for an **always-visible, analog-style remaining-time display** rests mostly on the timing deficit (strong) plus one small visual-timer study (weak). The case for **short blocks with immediate, frequent feedback** rests on delay aversion and reinforcement (moderate to strong). Hyperfocus evidence is mixed and self-reported. Still, it argues for **gentle, dismissable end-of-block cues with a one-tap "+5 min"** rather than hard stops. Note that some learners glance at a visible timer compulsively (Hallez 2025), so it needs a hide or minimise option.

## 4. Other learning features

| Feature | Strength | Source | Notes |
|---|---|---|---|
| Retrieval practice (testing effect) | **Strong** | Rowland 2014 meta-analysis, https://pubmed.ncbi.nlm.nih.gov/25150680/ | Recall tests give bigger benefits than recognition tests. |
| …in ADHD | Moderate | Minear et al. 2023 (n=72), https://pubmed.ncbi.nlm.nih.gov/37546447/ · Stern & Halamish 2023, https://pubmed.ncbi.nlm.nih.gov/38090165/ | It benefits ADHD learners as much as controls, but doesn't fix weak encoding. In one study neither form beat restudying. |
| Spaced practice | **Strong** | Cepeda et al. 2006 (317 experiments), https://pubmed.ncbi.nlm.nih.gov/16719566/ | The best gap grows with how long you need to remember. |
| Feedback | **Strong** | Wisniewski et al. 2020 (435 studies, d=0.48), https://pubmed.ncbi.nlm.nih.gov/32038429/ | Feedback rich in information works best; praise alone does less. |
| Segmenting / short learner-paced steps | Moderate | Rey et al. 2019 (56 studies), https://link.springer.com/article/10.1007/s10648-018-9456-4 | Small-to-medium gains in retention and transfer, and lower cognitive load. |
| Implementation intentions ("If X, then I'll Y") | Moderate | Breitwieser & Reinelt 2026 meta-analysis (42 studies, g=0.31), https://pubmed.ncbi.nlm.nih.gov/41784001/ · Gawrilow & Gollwitzer 2008, https://link.springer.com/article/10.1007/s10608-007-9150-1 | Stronger in younger children and, in some analyses, in ADHD. |
| Gamification | Moderate, small effects | Sailer & Homner 2020, *Educ Psychol Rev*, https://eric.ed.gov/?id=EJ1245270 | Cognitive g=0.49 (stable in rigorous studies); motivational g=0.36 and behavioural g=0.25 (less stable). No ADHD-specific learning-gamification evidence was found. |
| Streaks | Weak (consumer research) | Silverman & Barasch 2023, *J Consumer Res*, https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414 | Intact streaks increase engagement and **broken streaks lower it**, more so when people blame themselves. The effect is smaller when a streak can be "repaired". |
| Focus mode / fewer distractions | Weak (indirect) | Huang-Pollock 2012 (above); Kang & Kurtzberg 2019 (above) | No trial of a "focus mode" UI. The rationale comes from distractibility and attention research. |
| Body doubling | **Weak** | Eagle et al. 2024, *ACM TACCESS*, https://dl.acm.org/doi/full/10.1145/3689648 | A self-report survey (n=220, mostly neurodivergent people) and the first formal study. No controlled outcome data. |
| Progress visibility | Weak (indirect) | Luman 2005; Sailer & Homner 2020 (above) | Supported only as feedback or reinforcement. No direct ADHD trial found. |

## 5. Accessibility constraints on a timer

| Rule | What it means here | Source |
|---|---|---|
| **2.2.1 Timing Adjustable (A)** applies to time limits "set by the content". A timer the learner starts, which never locks or ends content, is not one. If a break ever *blocks* the lesson, it becomes one and must be possible to turn off, adjust (to at least 10×) or extend. | Never lock content, so the SC doesn't apply. | https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html |
| **2.2.2 Pause, Stop, Hide (A):** moving content that starts automatically and runs more than 5 s, and auto-updating information shown next to other content, need a way to pause, stop or hide them. | Add pause, stop and **hide/minimise** controls. Only the learner starts the timer. | https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html |
| **2.3.3 Animation from Interactions (AAA):** motion triggered by interaction can be disabled. Technique C39 is `prefers-reduced-motion`. | Under reduced motion, change the ring in steps (for example each minute) instead of animating continuously, and skip confetti (`celebrate.tsx` already does). | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html · https://www.w3.org/WAI/WCAG22/Techniques/css/C39 |
| **4.1.3 Status Messages (AA):** status must be exposed without moving focus. The Understanding doc warns against being too "chatty". | Announce phase changes only ("Focus block started, 25 minutes", "Break time", "1 minute left"). | https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html |
| **ARIA `timer` role:** implicit `aria-live="off"`. The `status` role is `polite`. | Put the visible countdown in `role="timer"` so it stays silent, and send phase changes to a separate `role="status"` region. | https://www.w3.org/TR/wai-aria-1.2/#timer |
| **1.4.1 Use of Color (A)** and **1.4.11 Non-text Contrast (AA, 3:1)** | Don't show the phase (focus/break) by colour alone. Add a label and icon. The ring's arc needs 3:1 contrast against its track. | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html · https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html |

## 6. Web platform facts

| Fact | Implication | Source |
|---|---|---|
| Background timers are throttled: at least 1 s in inactive tabs (Firefox desktop); Chrome 88+ "intensive throttling" checks timers **once per minute** once a page has been hidden for more than 5 minutes and silent for more than 30 s; timers can always fire late. | Never count down by decrementing on each tick. Store `endsAt` and render `endsAt − Date.now()`. The end cue may fire up to about a minute late in a hidden tab. | https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout |
| `performance.now()` is monotonic but **stops during OS sleep** in Chrome, Firefox and Safari (not on Windows). MDN suggests `Date.now()` for long timings. | Use `Date.now()` for the deadline. Accept the small risk of the system clock being changed. | https://developer.mozilla.org/en-US/docs/Web/API/Performance/now |
| Page Visibility API: `visibilitychange`, `document.hidden`. `requestAnimationFrame` stops in background tabs. Tabs playing audio aren't throttled. | Recompute on `visibilitychange`. If the deadline passed while hidden, show "Break time" on return. **Don't** play silent audio to avoid throttling. | https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API |
| Notifications: `Notification.requestPermission()` only after a user gesture, and only in a secure context. Chrome on Android needs `ServiceWorkerRegistration.showNotification()`. iOS needs the site installed as a web app. Use `tag` to replace rather than stack notifications. | Make notifications opt-in, asked when the learner first starts a timer. Expect them not to work on mobile web; that's fine because native uses Capacitor. | https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API |
| Screen Wake Lock: `navigator.wakeLock.request("screen")`, secure context. It is released when the page is hidden and must be re-acquired on `visibilitychange`. The system may refuse it (low battery). Baseline 2025. | Optional "keep screen on during focus". Fail silently. | https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API |
| Web Audio: create or `resume()` an `AudioContext` inside a user gesture (autoplay policy), and always give the user control over sound. | Unlock audio on the Start click. Synthesize a soft chime with an oscillator and gain envelope, so no audio file is needed. Add a mute toggle. | https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices |
| Vibration API is not Baseline and doesn't work on iOS Safari. | Use the existing `@capacitor/haptics` path (`components/haptics.tsx`), which already falls back to `navigator.vibrate`. | https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API |
| Capacitor Local Notifications: `schedule({ notifications: [{ id, title, body, schedule: { at } }] })`, `requestPermissions()`, `cancel()`. Android 13+ needs `POST_NOTIFICATIONS`. Exact timing on Android 12+ needs `SCHEDULE_EXACT_ALARM`. `allowWhileIdle` fires at most once per 9 minutes in Doze. | On native, schedule the end alert when a block starts and cancel it on pause or stop. It fires even when the app is in the background. It isn't installed yet (`package.json` has only `@capacitor/haptics`). | https://capacitorjs.com/docs/apis/local-notifications |

## 7. Anti-patterns

| Anti-pattern | Evidence / guideline |
|---|---|
| **Timers that feel like pressure.** Cirillo names "ring anxiety" and the "Becoming Syndrome" ("am I going fast enough?"). The visual timer *lowered* anxiety only when it framed the time available rather than a race. | Cirillo PDF §3.7; Hallez & Vallier 2025 (above). Weak, but consistent. |
| **Forced, locking breaks.** Fixed schedules didn't improve learning in any trial, and in two trials they were worse for mood (Smits 2025, Göksu 2026). Locking content would also bring in WCAG 2.2.1. | Sections 1 and 5 above. |
| **Hard interruption of flow or hyperfocus.** Hyperfocus evidence is mixed, and there are no trials of how to interrupt it. Cirillo's "stop when it rings" rule was written for general workers. | Weak. The gentle-cue design is a judgement call, marked here as such. |
| **Punitive streaks.** Broken streaks lower later engagement, more so when people blame themselves. Allowing a "repair" softens this. `StatsBadge` currently shows a day streak with no repair. | Silverman & Barasch 2023 (above). Weak (consumer domain). |
| **Points-only gamification.** Rewards and status alone did less than challenge, goals or narrative. | Sailer & Homner 2020 (above). The owner's own brief lists "gamified kids' coding sites" as an anti-reference (`DESIGN_BRIEF.md`). |
| **Screen-reader spam.** Announcing every second. | WCAG 4.1.3 Understanding warns against "chatty"; ARIA `timer` defaults to `aria-live="off"` (above). |

---

## Recommendations for ThongLearn

Keep it calm. `DESIGN_BRIEF.md` says "Calm chrome, lively feedback" and lists gamified kids' sites as an anti-reference.

### MVP: the focus timer

1. **`components/focus-timer.tsx`, a small ring in `SidebarHeader` next to `<StatsBadge />`** (`components/app-sidebar.tsx`). Build it from `components/progress-ring.tsx`: it drains as time passes, with the minutes left shown as text next to it in `tabular-nums`.
   - State is `{ phase, endsAt, pausedRemaining }` and remaining time is `endsAt − Date.now()` (§6). Re-render every 1 s while visible and recompute on `visibilitychange`.
   - Presets 15/3 · **25/5 (default)** · 45/10, plus custom lengths (§1). Keep them in `localStorage` like the mascot choice (`components/mascot.tsx`). There's no need for a Dexie table.
   - Controls: Start, Pause, Stop, **+5 min**, **Skip break**, and **Hide** (§5, 2.2.2).
   - The countdown sits in `role="timer"`, which stays silent. Phase changes go to a `role="status"` region (§5).
   - Under `prefers-reduced-motion` (`useReducedMotion` from motion, as in the existing components), the ring updates once a minute with no animation.
2. **A gentle end-of-block cue, not a stop.** Show a sonner `toast` ("Break time: stand up, look away from the screen"), fire a Light haptic through `@capacitor/haptics`, and play an optional soft Web Audio chime (muted by default, unlocked on Start). No modal and no lock (§2, §7).
3. **A break card with no content.** The toast offers "Start 5-min break" / "+5 min" / "Skip". During a break the ring shows the break countdown and a single line of movement advice. There's no feed and nothing to scroll (§2).

### Next, in priority order

4. **Native end alert.** Install `@capacitor/local-notifications` (Capacitor 8 major) and schedule it at `endsAt`, cancelling on pause or stop (§6). On the web, show an opt-in `Notification` asked at the first Start, and accept that it may be up to a minute late in hidden tabs.
5. **A session goal as an if-then plan** (moderate evidence, §4). Before Start there's an optional one-line prompt, "This block I'll: finish the challenge in *Loops*". Pre-fill it from the next unchecked item in `LessonSteps` (`components/lesson-steps.tsx`) and tick it off at the end of the block.
6. **A lesson focus mode.** One toggle collapses the sidebar and right pane using the existing pane toggler in `components/workspace.tsx`, and ties it to a running block (§4, weak evidence; low cost).
7. **A retrieval warm-up** (strong evidence, §4). At the start of a block, offer 2–3 questions from quizzes on lessons finished days ago, reusing `components/quiz.tsx` and `db.quizzes` (`lib/db.ts`). A simple "due" rule based on `passedAt` age is enough (Cepeda: the gap should grow). No SM-2 engine.
8. **Record, don't race.** Count finished blocks for today next to the ring (Cirillo §3.7). Don't add XP for minutes spent.
9. **Soften the streak** in `components/stats-badge.tsx` / `lib/stats.ts`: allow one grace day per week, or show "5 of the last 7 days" instead of resetting to 0 (§7). Keep timer blocks out of the streak.
10. **Optional screen wake lock** during a focus block on mobile or tablet (§6).

### Don't build

- **Locked or forced breaks** that hide the lesson or editor (no learning benefit, and it brings in WCAG 2.2.1).
- **A ticking sound**, or any sound on by default.
- **Red "time's up" alarms**, or flashing (WCAG 2.3.1 also limits flashes).
- **Per-second screen-reader announcements.**
- **XP or leaderboards for time spent**, or punishment for stopping a block early.
- **A silent-audio hack** to beat background throttling.
- **Body doubling / co-working rooms.** The evidence is one survey, and it would need accounts, presence and moderation.
- **A full spaced-repetition engine or Pomodoro analytics dashboard.** Revisit only if the simple "due quiz" warm-up gets used.

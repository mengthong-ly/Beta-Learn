import Link from "next/link"
import { ArrowRightIcon, PlusIcon, SparklesIcon } from "lucide-react"

import { CourseLogo, courseColor } from "@/components/course-logo"
import { HeroShrink } from "@/components/landing/hero-shrink"
import {
  CheckMock,
  GuideMock,
  PickMock,
  PredictMock,
  ProgressMock,
  RunMock,
  SolveMock,
  TryMock,
  VizMock,
} from "@/components/landing/mocks"
import { TiltCards } from "@/components/landing/tilt-cards"
import { TypingCode } from "@/components/landing/typing-code"
import { VizShowcase } from "@/components/landing/viz-showcase"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { getCourse } from "@/lib/content"
import { courses } from "@/lib/courses"
import { cn } from "@/lib/utils"

// Page-load entrance (tw-animate-css): fade, rise and unblur, staggered with delay-*.
const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 blur-in-sm fill-mode-both duration-1000 ease-glide motion-reduce:animate-none"

// Pressable: the interface should feel like it heard you.
const PRESS =
  "transition-transform duration-150 ease-glide active:scale-[0.98] motion-reduce:transition-none"

const HEADLINE = "Learn to code by running real code"
// "real code" carries the brand colour, like the one lit word in a sentence.
const ACCENT_FROM = HEADLINE.split(" ").length - 2

// Three courses need the learner's own toolchain; the rest run in the tab. The
// claim is counted from the data so it cannot drift away from the list below.
const IN_TAB = courses.filter((c) => c.runtime !== "local").length
const lessons = courses.reduce((n, c) => n + getCourse(c.id)!.lessons.length, 0)
const lessonCount = (id: string) => {
  const n = getCourse(id)!.lessons.length
  return `${n} lesson${n === 1 ? "" : "s"}`
}
// The line of each course's hello program that says hello: a taste of the syntax.
const helloLine = (hello: string) =>
  hello
    .split("\n")
    .find((l) => /hello,/i.test(l))!
    .trim()
const chapters = courses.reduce((n, c) => n + getCourse(c.id)!.guide.length, 0)

// Real lesson totals; the "done" counts are the picture's, not anyone's.
const progressRows = (
  [
    ["python", 23],
    ["typescript", 6],
    ["php", 0],
  ] as const
).map(([id, done]) => {
  const c = courses.find((c) => c.id === id)!
  return {
    mark: c.mark,
    name: c.name,
    done,
    total: getCourse(id)!.lessons.length,
  }
})

const RUNTIMES = [
  ["Python", "CPython 3.14 · Pyodide"],
  ["PHP", "8.5 · php-wasm"],
  ["Laravel 13", "php-wasm"],
  ["TypeScript", "6 · in a worker"],
  ["React", "sandboxed iframe"],
  ["C++", "clang · wasm"],
  ["Rust", "your rustc"],
  ["Dart", "your SDK"],
  ["Flutter", "your SDK"],
] as const

const FAQ = [
  [
    "Do I need to install anything?",
    `Not for ${IN_TAB} of the ${courses.length} courses. Python, PHP, Laravel, TypeScript, React, C++ and Claude Code run in your browser tab. Rust, Dart and Flutter use your own toolchain through a local copy.`,
  ],
  [
    "Where does my code run?",
    "On your machine. The browser courses run in workers inside this tab: CPython through Pyodide, PHP through php-wasm, C++ through clang compiled to wasm. No server runs your code.",
  ],
  [
    "Do I need an account?",
    "No. Progress, drafts and run history are stored in your browser. Signing in only adds a copy of your progress and drafts that follows you to other browsers; run history never leaves the tab.",
  ],
  [
    "How are challenges checked?",
    "Your code runs first. Then a short check runs against what it printed or built, and tells you whether it passed.",
  ],
  [
    "Can I see what my code is doing?",
    "Yes, for Python. The Visualize tab steps through your own code one line at a time and shows every variable as it changes.",
  ],
] as const

/** Eyebrow, headline and optional lede: the one heading every section uses. */
function Heading({
  eyebrow,
  title,
  children,
  align = "center",
  dark,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
  align?: "center" | "start"
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start"
      )}
    >
      <span
        className={cn(
          "reveal rounded-full border px-3 py-1 font-mono text-xs",
          dark
            ? "border-white/15 bg-white/5 text-white/70"
            : "bg-muted text-muted-foreground"
        )}
      >
        {eyebrow}
      </span>
      <h2 className="wipe max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {children && (
        <p
          className={cn(
            "reveal max-w-xl text-pretty sm:text-lg",
            dark ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {children}
        </p>
      )}
    </div>
  )
}

/** A bento card: the picture on a lit stage, the words under it. */
function Feature({
  title,
  body,
  children,
  className,
}: {
  title: string
  body: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <li
      className={cn(
        "rise-3d tilt flex flex-col rounded-[28px] bg-muted p-2",
        className
      )}
      data-tilt
    >
      <div className="feature-stage flex min-h-72 flex-1 items-center justify-center overflow-hidden rounded-[20px] p-6 sm:p-10">
        {children}
      </div>
      <div className="px-4 pt-5 pb-4 sm:px-6 sm:pb-6">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm text-pretty text-muted-foreground sm:text-base">
          {body}
        </p>
      </div>
    </li>
  )
}

function FooterLinks({
  title,
  links,
  columns,
}: {
  title: string
  links: (readonly [string, string])[]
  columns?: boolean
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <ul
        className={cn(
          "mt-4 grid gap-2.5 text-sm",
          columns && "grid-cols-2 gap-x-6"
        )}
      >
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="transition-colors hover:text-salem-800 dark:hover:text-salem-400"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The questions a learner is already asking themselves, each answered by the product.
const PAINS = [
  {
    q: "You finished the tutorial. Could you write it from a blank file?",
    a: "Every lesson ends in an empty editor with a check that runs your code — not a quiz about it.",
  },
  {
    q: "Three hours on setup. Zero lines written.",
    a: "Nothing to install. Python, PHP, TypeScript, C++ and React run in this tab, right now.",
  },
  {
    q: "It printed the right answer. You still don't know why.",
    a: "Step through your own code and watch every variable change, one line at a time.",
  },
  {
    q: "Nine tabs open. Nine half-finished courses.",
    a: "One place, one editor, one progress bar — across every language you're learning.",
  },
]

export default function Landing() {
  return (
    <main className="landing bg-background text-foreground">
      {/* Hero: opens full-bleed, then pins to the top while it shrinks into its
          inset card (see .hero-runway), and only then scrolls away. Nothing sits
          over it — the nav follows below and sticks once you scroll past. */}
      <HeroShrink />
      <TiltCards />
      <div className="hero-runway">
        {/* The pin and the shrink must live on different elements: a scroll
            timeline goes inactive on a `position: sticky` element, so the
            wrapper pins and the surface inside it animates. */}
        <div className="sticky top-0 h-svh">
          <section className="hero-surface relative isolate flex h-full flex-col items-center overflow-hidden">
            <div
              aria-hidden
              className="hero-grid pointer-events-none absolute inset-0 -z-10"
            />
            <div
              aria-hidden
              className="hero-sun pointer-events-none absolute -z-10 h-[38rem] w-[38rem] rounded-full"
            />
            <div
              aria-hidden
              className="hero-drift pointer-events-none absolute -z-10 h-[34rem] w-[34rem] rounded-full"
            />

            <div className="hero-copy flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pt-16 pb-10 text-center sm:pt-20">
              <span
                className={`${ENTER} glass flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground delay-100`}
              >
                <SparklesIcon className="size-3.5" />
                Nothing to install — {IN_TAB} courses run in this tab
              </span>
              {/* A word at a time, so the line assembles rather than appears. */}
              <h1 className="mt-6 text-[2.5rem] leading-[1.05] font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl">
                {HEADLINE.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className={cn(
                      "word",
                      i >= ACCENT_FROM && "text-accent-gradient"
                    )}
                    style={{ animationDelay: `${180 + i * 65}ms` }}
                  >
                    {word}
                    {i < HEADLINE.split(" ").length - 1 ? " " : ""}
                  </span>
                ))}
              </h1>
              <p
                className={`${ENTER} mt-5 max-w-xl text-base text-pretty text-muted-foreground delay-700 sm:text-lg`}
              >
                Short lessons, a guide book and a real editor for Python, PHP,
                TypeScript, React, C++ and more. Type it, run it, see what
                happened.
              </p>
              <div
                className={`${ENTER} mt-8 flex flex-wrap justify-center gap-3 delay-1000`}
              >
                <Button
                  asChild
                  size="lg"
                  className={`${PRESS} rounded-full bg-foreground text-background hover:bg-foreground/90`}
                >
                  <Link href="/courses">
                    Start learning <ArrowRightIcon />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className={`${PRESS} glass rounded-full border-0`}
                >
                  <Link href="/python/playground">Open playground</Link>
                </Button>
              </div>
            </div>

            {/* Peeks over the bottom edge of the canvas, like an app resting on it. */}
            <div
              className={`${ENTER} w-full max-w-2xl px-5 delay-1000 duration-1000 [perspective:1100px] sm:px-0`}
            >
              {/* Leans back like a laptop lid, and stands up as the hero closes. */}
              <div className="hero-device">
                <TypingCode />
              </div>
            </div>
          </section>
        </div>
      </div>

      <header className="pointer-events-none sticky top-0 z-50 flex h-20 items-center justify-center px-4">
        {/* .nav-morph paints its own glass on a pseudo-element that scales in as
            the hero closes, so the bar arrives with the page instead of sitting
            on the hero from the first frame. */}
        <nav className="nav-morph pointer-events-auto relative flex items-center gap-1 rounded-full p-1.5 pl-3 text-sm">
          <Link href="/" className="flex items-center gap-2 pr-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
              Th
            </span>
            <span className="hidden sm:inline">ThongLearn</span>
          </Link>
          <Link
            href="/courses"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Courses
          </Link>
          <Link
            href="/python/playground"
            className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:block"
          >
            Playground
          </Link>
          <Link
            href="/visualize"
            className="hidden rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:block"
          >
            Visualizer
          </Link>
          <Link
            href="/setup"
            className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            Setup
          </Link>
          <ThemeToggle className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground" />
        </nav>
      </header>

      {/* The runtimes, named. The page claims "real code", so it shows what
          actually runs it. Doubled for a seamless loop; the copy is hidden. */}
      <section aria-label="Runtimes" className="pt-10 pb-24 sm:pb-32">
        <p className="px-5 text-center text-sm text-muted-foreground">
          Real interpreters and compilers — not imitations of them
        </p>
        <div className="marquee mt-6 overflow-hidden">
          <div className="marquee-track flex">
            {[false, true].map((copy) => (
              <ul
                key={String(copy)}
                aria-hidden={copy || undefined}
                className="flex shrink-0 items-center gap-10 pr-10"
              >
                {RUNTIMES.map(([name, how]) => (
                  <li
                    key={name}
                    className="flex items-baseline gap-2 whitespace-nowrap"
                  >
                    <span className="text-lg font-medium">{name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {how}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-28 sm:pb-40">
        <Heading
          eyebrow="What's inside"
          title="Everything between reading it and writing it"
        >
          Most courses stop at the explanation. Here every lesson runs, gets
          checked, and can be taken apart line by line.
        </Heading>

        <ul className="stage-3d mt-14 grid gap-4 lg:grid-cols-12">
          <Feature
            className="lg:col-span-7"
            title="Nothing to install"
            body={`${IN_TAB} of ${courses.length} courses run in this tab: Python, PHP, TypeScript, React and C++ compile and run in your browser.`}
          >
            <RunMock />
          </Feature>
          <Feature
            className="lg:col-span-5"
            title="Checked by running it"
            body="A challenge passes when your code does what it should, not when you pick the right answer."
          >
            <CheckMock />
          </Feature>
          <Feature
            className="lg:col-span-5"
            title="Predict, then run"
            body="Guess the output first. Being wrong before you press Run is where the learning happens."
          >
            <PredictMock />
          </Feature>
          <Feature
            className="lg:col-span-7"
            title="Watch it run, line by line"
            body="Step through your own Python and see each variable change, forwards and back."
          >
            <VizMock />
          </Feature>
          <Feature
            className="lg:col-span-6"
            title="A guide book beside every course"
            body={`${chapters} chapters that go deeper than the lessons, each example one click from the editor.`}
          >
            <GuideMock />
          </Feature>
          <Feature
            className="lg:col-span-6"
            title="Your progress stays yours"
            body="Progress, drafts and history live in your browser. Sign in only if you want them on another device."
          >
            <ProgressMock rows={progressRows} />
          </Feature>
        </ul>
      </section>

      {/* The Visualizer itself, running live: the one feature a picture undersells. */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-28 sm:pb-40">
        <Heading
          eyebrow="Visualizer"
          title="See what the computer does, one step at a time"
        >
          Every variable, list and function call drawn as it happens. Press
          Play, or step forwards and back yourself.
        </Heading>
        <div className="stand-up">
          <VizShowcase />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-28 sm:pb-40">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <Heading
            eyebrow="How it works"
            title="Three steps, then repeat"
            align="start"
          />
          <p className="reveal max-w-md text-pretty text-muted-foreground md:justify-self-end">
            Short lessons, each ending with a blank editor. You learn a piece,
            use it once, then write it yourself.
          </p>
        </div>

        <ol className="stage-3d mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Pick a course",
              body: "Start with the language you need. Each course runs from its first lesson with no setup.",
              mock: <PickMock marks={courses.slice(0, 8)} />,
            },
            {
              title: "Read, then try it",
              body: "Every example has a Try it button that drops it into the editor so you can change it.",
              mock: <TryMock />,
            },
            {
              title: "Write it yourself",
              body: "The challenge starts from an empty file. The check runs your code and tells you what's off.",
              mock: <SolveMock />,
            },
          ].map((step, i) => (
            <li
              key={step.title}
              data-tilt
              className="fan-3d tilt flex flex-col overflow-hidden rounded-[28px] bg-muted"
            >
              <div className="p-6">
                <h3 className="flex gap-2 font-medium">
                  <span className="font-mono text-salem-800 dark:text-salem-500">
                    0{i + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                  {step.body}
                </p>
              </div>
              {/* The mock rests on a lit stage and runs off its bottom edge. */}
              <div className="step-stage relative mt-auto h-64 overflow-hidden">
                <div className="absolute inset-x-6 top-8">{step.mock}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The one dark band, inset like the hero card so the two rhyme. Dark in
          both themes: it is a stage, not a surface that follows the theme. */}
      <section className="band-dark stand-up relative isolate mx-2 overflow-hidden rounded-[28px] px-5 py-24 text-white sm:mx-4 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <Heading
            eyebrow="Why it sticks"
            title="The problem was never that you weren't trying"
            dark
          >
            The gap isn&apos;t effort. It&apos;s practice you can actually run —
            all of it in one place.
          </Heading>

          <ul className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-2">
            {PAINS.map(({ q, a }) => (
              <li key={q} className="reveal bg-[#0b1511] p-6 sm:p-8">
                <p className="text-lg leading-snug font-medium text-balance sm:text-xl">
                  {q}
                </p>
                <p className="mt-3 flex gap-3 text-sm text-pretty text-white/60 sm:text-base">
                  <span
                    aria-hidden
                    className="rule-grow mt-2.5 h-px w-6 shrink-0 bg-salem-500 sm:mt-3"
                  />
                  {a}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-16 grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {[
              [courses.length, "courses"],
              [lessons, "lessons"],
              [chapters, "guide chapters"],
              [IN_TAB, "run in your tab"],
            ].map(([n, label]) => (
              <div
                key={label}
                className="reveal flex flex-col md:border-l md:border-white/10 md:pl-6"
              >
                <dt className="text-sm text-white/60">{label}</dt>
                <dd className="stat-number order-first text-5xl font-medium tracking-tight tabular-nums sm:text-6xl">
                  {n}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* The languages, with where each one actually runs — the page claims
          "nothing to install", so it owes the reader the exceptions. */}
      <section className="mx-auto w-full max-w-6xl px-5 py-28 sm:py-40">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <Heading
            eyebrow="Courses"
            title={`${courses.length} courses, one editor`}
            align="start"
          />
          <Link
            href="/courses"
            className="reveal flex items-center gap-1.5 text-sm font-medium md:justify-self-end"
          >
            See every course <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        {/* Green tiles on the white page: `dark` forces the dark tokens
              inside in both themes. */}
        <ul className="stage-3d dark mt-12 grid gap-4 text-foreground sm:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id} data-tilt className="flip-3d tilt rounded-3xl">
              <Link
                href={`/${c.id}`}
                style={{ "--brand": courseColor(c.id) } as React.CSSProperties}
                // .course-tile: its own green tile, lit in the course's colour.
                className="course-tile flex h-full flex-col gap-4 rounded-3xl p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-7"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--brand)_12%,transparent)]">
                    <CourseLogo id={c.id} className="size-6" />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {c.runtime === "local"
                      ? "Runs on your machine"
                      : "Runs in your browser"}
                  </span>
                </span>
                <span>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {lessonCount(c.id)}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-pretty text-muted-foreground">
                    {c.tagline}
                  </span>
                </span>
                <code className="inset mt-auto truncate rounded-xl px-3 py-2 font-mono text-xs text-foreground/80">
                  {helloLine(c.hello)}
                </code>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-28 sm:pb-40 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-10">
          <Heading eyebrow="Questions" title="Before you start" align="start">
            The short answers. The longer ones are one click into any course.
          </Heading>
          <div className="reveal max-w-sm rounded-3xl bg-muted p-6">
            <p className="font-medium">Learning Rust, Dart or Flutter?</p>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              Those run on your own toolchain, in a local copy of ThongLearn.
              Setup walks you through it.
            </p>
            <Link
              href="/setup"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-link"
            >
              Open setup <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ.map(([q, a], i) => (
            <details
              key={q}
              name="faq"
              open={i === 0}
              className="group reveal rounded-2xl border bg-background transition-colors open:bg-muted/60"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 font-medium focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                {q}
                <PlusIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-glide group-open:rotate-45" />
              </summary>
              <p className="animate-in px-5 pb-5 text-sm text-pretty text-muted-foreground duration-300 fade-in slide-in-from-top-1 motion-reduce:animate-none">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="band-cta stand-up relative isolate mx-2 overflow-hidden rounded-[28px] px-5 py-24 text-center text-white sm:mx-4 sm:py-32">
        <div
          aria-hidden
          className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-60"
        />
        <h2 className="wipe mx-auto max-w-2xl text-4xl font-medium tracking-tight text-balance sm:text-6xl">
          Open the editor. Write a line. Press Run.
        </h2>
        <p className="reveal mx-auto mt-5 max-w-lg text-pretty text-white/70 sm:text-lg">
          No account and no install to begin. Your progress stays in this
          browser until you choose to sync it.
        </p>
        <div className="reveal mt-9 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className={`${PRESS} rounded-full bg-white text-[#0b1511] hover:bg-white/90`}
          >
            <Link href="/courses">
              Start learning <ArrowRightIcon />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className={`${PRESS} rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white`}
          >
            <Link href="/python/playground">Open playground</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-5 pt-20 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
                Th
              </span>
              ThongLearn
            </Link>
            <p className="mt-4 max-w-xs text-sm text-pretty text-muted-foreground">
              Short lessons, a guide book and a real editor, for learning to
              code by running code.
            </p>
          </div>
          <FooterLinks
            title="Courses"
            links={courses.map((c) => [c.name, `/${c.id}`])}
            columns
          />
          <FooterLinks
            title="Tools"
            links={[
              ["All courses", "/courses"],
              ["Playground", "/python/playground"],
              ["Visualizer", "/visualize"],
              ["Setup", "/setup"],
              ["Sign in", "/login"],
            ]}
          />
        </div>
        <p className="mt-16 border-t pt-8 text-center font-mono text-xs text-muted-foreground">
          {`/* ${courses.length} courses, ${IN_TAB} with nothing to install */`}
        </p>
      </footer>
    </main>
  )
}

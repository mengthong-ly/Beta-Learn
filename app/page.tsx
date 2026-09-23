import Link from "next/link"
import { ArrowRightIcon, SparklesIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { courses } from "@/lib/courses"

// Diagonal light beams from the top right: [left %, width px, opacity, delay s].
const RAYS = [
  [52, 240, 0.22, 0],
  [64, 90, 0.35, 1.5],
  [72, 160, 0.18, 3],
  [82, 60, 0.3, 0.8],
  [90, 260, 0.14, 2.2],
] as const

// Page-load entrance (tw-animate-css): fade, rise and unblur, staggered with delay-*.
const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 blur-in-sm fill-mode-both duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none"

export default function Landing() {
  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-foreground dark:bg-[#08080a]">
      <div aria-hidden className="animate-in fade-in fill-mode-both duration-[2000ms] ease-out motion-reduce:animate-none pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-10%] size-[60rem] rounded-full bg-salem-200/40 blur-3xl dark:bg-white/[0.04]" />
        {RAYS.map(([left, width, opacity, delay]) => (
          <span
            key={left}
            className="animate-ray absolute -top-1/4 h-[150%] origin-top rotate-[28deg] bg-gradient-to-b from-salem-300 via-salem-200/40 to-transparent blur-xl dark:from-white dark:via-white/40"
            style={{ left: `${left}%`, width, "--o": opacity, animationDelay: `${delay}s` } as React.CSSProperties}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent dark:from-[#08080a]" />
      </div>

      <header className="animate-in fade-in fill-mode-both duration-1000 ease-out motion-reduce:animate-none mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
            Th
          </span>
          <span className="hidden sm:inline">ThongLearn</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/courses" className="rounded-full px-3 py-1.5 transition-colors hover:text-foreground">
            Courses
          </Link>
          <Link href="/python/playground" className="hidden rounded-full px-3 py-1.5 transition-colors hover:text-foreground sm:block">
            Playground
          </Link>
          <Link href="/setup" className="rounded-full px-3 py-1.5 transition-colors hover:text-foreground">
            Setup
          </Link>
          <ThemeToggle className="rounded-full p-2 transition-colors hover:text-foreground" />
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <span className={`${ENTER} delay-100 flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/5 px-3 py-1 text-xs text-muted-foreground backdrop-blur`}>
          <SparklesIcon className="size-3.5" />
          Python runs right in your browser
        </span>
        <h1 className={`${ENTER} delay-200 mt-6 text-4xl font-medium tracking-tight text-balance sm:text-6xl lg:text-7xl`}>
          Learn to code by running real code
        </h1>
        <p className={`${ENTER} delay-300 mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg`}>
          Short lessons, a guide book and a live editor for Python, PHP,
          TypeScript, React, Flutter and more. Your progress stays in this
          browser.
        </p>
        <div className={`${ENTER} delay-400 mt-8 flex flex-wrap justify-center gap-3`}>
          <Button asChild size="lg" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link href="/courses">
              Start learning <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/python/playground">Open playground</Link>
          </Button>
        </div>
      </section>

      <footer className="animate-in fade-in fill-mode-both duration-1000 ease-out delay-500 motion-reduce:animate-none border-t border-foreground/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 sm:justify-between sm:px-8">
          <span className="hidden font-mono text-sm text-muted-foreground md:block">
            {`/* ${courses.length} courses */`}
          </span>
          <ul className="flex flex-wrap justify-center gap-2">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${c.id}`}
                  className="flex items-center gap-2 rounded-full border border-foreground/10 py-1 pr-3 pl-1 text-sm text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-foreground/10 font-mono text-[10px] font-bold text-foreground">
                    {c.mark}
                  </span>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </main>
  )
}

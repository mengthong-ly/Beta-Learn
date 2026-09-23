"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckIcon,
  CopyIcon,
  RefreshCwIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { CourseMark } from "@/components/course-switcher"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { findCourse } from "@/lib/courses"
import { runnerCommand, runnerUrl } from "@/lib/runner"
import type { Cache, CacheId, Requirement } from "@/lib/runner-status"

type Snapshot = { requirements: Requirement[]; caches: Cache[]; error?: string }
const SETUP = "npm run setup:runtimes"
const HEADERS = { "content-type": "application/json", "x-thonglearn-run": "1" }

async function fetchSnapshot(init?: RequestInit): Promise<Snapshot | "off"> {
  try {
    const res = await fetch(runnerUrl("/api/runtime"), { headers: HEADERS, ...init })
    return res.status === 403 ? "off" : await res.json()
  } catch {
    return "off" // not running, or (on a hosted copy) the browser blocked the call
  }
}

const size = (b: number) =>
  b === 0
    ? "Empty"
    : b < 1e6
      ? `${Math.max(1, Math.round(b / 1e3))} KB`
      : b < 1e9
        ? `${Math.round(b / 1e6)} MB`
        : `${(b / 1e9).toFixed(1)} GB`

const SCOPES = [
  { scope: "project", title: "Build output and caches", note: "Safe to clean any time. The next run rebuilds what it needs." },
  { scope: "sandbox", title: "Sandboxes", note: `Removes the toolchain sandbox. That course stops working until you run ${SETUP}.` },
  { scope: "global", title: "Global caches", note: "Shared with every other project on this computer, not just ThongLearn." },
] as const

export function SetupStatus() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [off, setOff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState<CacheId | null>(null)

  const apply = useCallback((r: Snapshot | "off") => {
    setLoading(false)
    if (r === "off") return setOff(true)
    setData(r)
  }, [])

  useEffect(() => {
    fetchSnapshot().then(apply)
  }, [apply])

  const load = async (init?: RequestInit) => {
    setLoading(true)
    const r = await fetchSnapshot(init)
    apply(r)
    return r
  }

  const clean = async (c: Cache) => {
    setCleaning(c.id)
    const r = await load({ method: "POST", body: JSON.stringify({ id: c.id }) })
    setCleaning(null)
    if (typeof r === "object" && "error" in r && r.error) toast.error(`Couldn't clean ${c.label}`, { description: r.error })
    else if (typeof r === "object") toast.success(`Cleaned ${c.label}`)
  }

  if (off)
    return (
      <p className="mt-8 rounded-xl border p-5 text-sm text-muted-foreground">
        The local runner is off. Start ThongLearn on your own computer with{" "}
        <code className="font-mono text-foreground">{runnerCommand()}</code> to check
        your toolchains.
      </p>
    )

  if (!data)
    return (
      <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner /> Checking your toolchains…
      </p>
    )

  return (
    <>
      <section className="mt-10" aria-labelledby="toolchains">
        <div className="flex items-center justify-between gap-4">
          <h2 id="toolchains" className="text-lg font-semibold">
            Toolchains
          </h2>
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
            Re-check
          </Button>
        </div>
        <ul className="mt-4 grid gap-3">
          {data.requirements.map((r) => {
            const course = findCourse(r.course)
            return (
              <li key={r.course} className="rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <CourseMark mark={course.mark} />
                  <h3 className="font-semibold">{course.name}</h3>
                  <Badge variant={r.ready ? "secondary" : "destructive"} className="ml-auto">
                    {r.ready ? "Ready" : "Not ready"}
                  </Badge>
                </div>
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {r.items.map((i) => (
                    <li key={i.name} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {i.ok ? (
                        <CheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="OK" />
                      ) : (
                        <XIcon className="size-4 text-destructive" aria-label="Missing" />
                      )}
                      <span>{i.name}</span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {i.found ?? "not found"}
                        {!i.sandbox && ` · needs ${i.need}`}
                      </span>
                      {!i.ok && i.sandbox && <CopyCommand />}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </section>

      {SCOPES.map(({ scope, title, note }) => (
        <section key={scope} className="mt-10" aria-labelledby={`caches-${scope}`}>
          <h2 id={`caches-${scope}`} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{note}</p>
          <ul className="mt-4 divide-y rounded-xl border">
            {data.caches
              .filter((c) => c.scope === scope)
              .map((c) => (
                <li key={c.id} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                    {size(c.bytes)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={scope === "project" ? "outline" : "destructive"}
                        size="sm"
                        disabled={c.bytes === 0 || cleaning !== null}
                      >
                        {cleaning === c.id ? <Spinner /> : <Trash2Icon />}
                        {scope === "sandbox" ? "Remove" : "Clean"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {scope === "sandbox" ? "Remove" : "Clean"} {c.label.toLowerCase()}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {c.detail} This frees about {size(c.bytes)}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant={scope === "project" ? "default" : "destructive"}
                          onClick={() => clean(c)}
                        >
                          {scope === "sandbox" ? "Remove" : "Clean"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function CopyCommand() {
  return (
    <Button
      variant="ghost"
      size="xs"
      className="font-mono"
      onClick={() =>
        navigator.clipboard.writeText(SETUP).then(() => toast("Copied", { description: SETUP }))
      }
    >
      <CopyIcon />
      {SETUP}
    </Button>
  )
}

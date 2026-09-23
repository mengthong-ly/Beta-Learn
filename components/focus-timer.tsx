"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { Haptics, ImpactStyle } from "@capacitor/haptics"
import { TimerIcon } from "lucide-react"
import { toast } from "sonner"

import { ProgressRing } from "@/components/progress-ring"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BREAK_MIN,
  extend,
  IDLE,
  left,
  pause,
  PRESETS,
  resume,
  start,
  startBreak,
  tick,
  type Timer,
} from "@/lib/focus-timer"

// Kept in localStorage (like the mascot choice) so a running block survives a reload.
const STORAGE_KEY = "focus-timer"
const TOAST_ID = "focus-timer"
const MIN = 60_000
const listeners = new Set<() => void>()
let cache: { raw: string | null; value: Timer } = { raw: null, value: IDLE }

function read(): Timer {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== cache.raw) cache = { raw, value: raw ? (JSON.parse(raw) as Timer) : IDLE }
  } catch {
    /* private mode or a bad value: treat as idle */
  }
  return cache.value
}

function setTimer(t: Timer) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {
    cache = { raw: null, value: t } // private mode: keep it in memory only
  }
  listeners.forEach((l) => l())
}

function useTimer(): Timer {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    read,
    () => IDLE
  )
}

const buzz = () => Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
const mins = (ms: number) => Math.ceil(ms / MIN)

/** Tell the learner a phase ended. A toast, never a lock: they choose what happens next. */
function cue(ended: Timer) {
  if (ended.phase !== "focus" && ended.phase !== "break") return
  buzz()
  const preset = ended.preset
  if (ended.phase === "focus")
    toast("Break time", {
      id: TOAST_ID,
      description: "Stand up, stretch, look away from the screen.",
      duration: Infinity,
      action: { label: `Start ${BREAK_MIN[preset]}-min break`, onClick: () => setTimer(startBreak(read(), Date.now())) },
      cancel: { label: "+5 min", onClick: () => setTimer(extend(read(), Date.now())) },
    })
  else
    toast("Break's over", {
      id: TOAST_ID,
      description: "Ready when you are.",
      duration: Infinity,
      action: { label: `Focus ${preset} min`, onClick: () => setTimer(start(preset, Date.now())) },
    })
}

/** A focus/break countdown in the sidebar header: a draining ring and the minutes left. */
export function FocusTimer() {
  const t = useTimer()
  const [now, setNow] = useState(() => Date.now())
  const running = t.phase === "focus" || t.phase === "break"

  // Re-render every second while visible; recompute at once when the tab comes back.
  useEffect(() => {
    if (!running) return
    const update = () => setNow(Date.now())
    const id = setInterval(update, 1000)
    document.addEventListener("visibilitychange", update)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", update)
    }
  }, [running])

  useEffect(() => {
    const next = tick(t, now)
    if (next === t) return
    setTimer(next)
    cue(t)
  }, [t, now])

  const act = (f: (t: Timer, now: number) => Timer) => () => {
    toast.dismiss(TOAST_ID)
    setTimer(f(read(), Date.now()))
  }

  const ms = left(t, now)
  const total =
    t.phase === "break" ? BREAK_MIN[t.preset] * MIN : t.phase === "idle" ? 1 : t.preset * MIN
  const label =
    t.phase === "idle"
      ? "Focus timer"
      : t.phase === "done"
        ? "Focus block done"
        : `${t.phase === "break" ? "Break" : t.phase === "paused" ? "Focus paused" : "Focus"}, ${mins(ms)} min left`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        title={label}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.phase === "idle" ? (
          <>
            <TimerIcon className="size-3.5" />
            Focus
          </>
        ) : (
          <>
            <ProgressRing
              value={t.phase === "done" ? 0 : ms}
              max={Math.max(total, ms)}
              className={t.phase === "break" ? "[&>circle:last-child]:stroke-primary" : undefined}
            />
            <span className="tabular-nums">
              {t.phase === "done" ? "Done" : `${mins(ms)}m`}
            </span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {t.phase === "idle" &&
            PRESETS.map((p) => (
              <DropdownMenuItem key={p} onSelect={act((_, now) => start(p, now))}>
                Focus {p} min
                <span className="ml-auto text-muted-foreground">{BREAK_MIN[p]} min break</span>
              </DropdownMenuItem>
            ))}
          {t.phase === "focus" && <DropdownMenuItem onSelect={act(pause)}>Pause</DropdownMenuItem>}
          {t.phase === "paused" && <DropdownMenuItem onSelect={act(resume)}>Resume</DropdownMenuItem>}
          {t.phase === "done" && (
            <DropdownMenuItem onSelect={act(startBreak)}>
              Start {BREAK_MIN[t.preset]}-min break
            </DropdownMenuItem>
          )}
          {(t.phase === "focus" || t.phase === "paused" || t.phase === "done") && (
            <DropdownMenuItem onSelect={act(extend)}>+5 min</DropdownMenuItem>
          )}
          {t.phase === "break" && (
            <DropdownMenuItem onSelect={act((t, now) => start(t.phase === "break" ? t.preset : 25, now))}>
              Skip break
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {t.phase !== "idle" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={act(() => IDLE)}>Stop</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

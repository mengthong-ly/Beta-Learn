"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { useRunner } from "@/lib/runner"

export const MASCOTS = [
  { id: "cat", label: "Cat" },
  { id: "rabbit", label: "Rabbit" },
  { id: "sheep", label: "Sheep" },
  { id: "panda", label: "Panda" },
] as const
export type MascotId = (typeof MASCOTS)[number]["id"]

const STORAGE_KEY = "mascot"
const listeners = new Set<() => void>()
export function setMascot(id: MascotId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* private mode: the choice just won't persist */
  }
  listeners.forEach((l) => l())
}
export function useMascot(): MascotId {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => {
      try {
        const v = localStorage.getItem(STORAGE_KEY)
        return MASCOTS.find((m) => m.id === v)?.id ?? "cat"
      } catch {
        return "cat"
      }
    },
    () => "cat"
  )
}

// Each mascot has two 3×3 sheets, /images/<id>-directions.webp and <id>-reactions.webp.
// Cells are numbered row by row, 0 (top left) to 8.
// Directions: 0 ↖ 1 ↑ 2 ↗ / 3 ← 4 • 5 → / 6 ↙ 7 ↓ 8 ↘
// Reactions: 0 happy 1 heart 2 sparkle / 3 "o" 4 star eyes 5 blush / 6 asleep 7 dizzy 8 laugh
const FACE = { surprised: 3, stars: 4, blush: 5, asleep: 6, dizzy: 7, laugh: 8 }
const POKE = [0, 1, 2, FACE.blush, FACE.laugh]

const SLEEP_MS = 45_000
const REACTION_MS = 2500

function Sheet({ src, cell, on }: { src: string; cell: number; on: boolean }) {
  return (
    <div
      className="absolute inset-0 bg-no-repeat transition-opacity duration-150 motion-reduce:transition-none"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "300% 300%",
        backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%`,
        opacity: on ? 1 : 0,
      }}
    />
  )
}

/** The mascot peeking over the editor: follows the pointer, reacts to runs and to pokes. */
export function Mascot() {
  const mascot = useMascot()
  const ref = useRef<HTMLDivElement>(null)
  const { status, check } = useRunner()
  const [look, setLook] = useState(4)
  const [face, setFace] = useState<number>()
  const [asleep, setAsleep] = useState(false)

  // Look toward the pointer; doze off after a while with no activity.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const wake = () => {
      setAsleep(false)
      clearTimeout(timer)
      timer = setTimeout(() => setAsleep(true), SLEEP_MS)
    }
    const onMove = (e: PointerEvent) => {
      wake()
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      // Close to the mascot: look straight ahead. Otherwise −1/0/1 per axis, with a
      // wide band around each axis so it doesn't flicker between diagonals.
      if (Math.hypot(dx, dy) < r.width) return setLook(4)
      const col = Math.abs(dx) < Math.abs(dy) / 2.4 ? 0 : Math.sign(dx)
      const row = Math.abs(dy) < Math.abs(dx) / 2.4 ? 0 : Math.sign(dy)
      setLook((row + 1) * 3 + col + 1)
    }
    wake()
    window.addEventListener("pointermove", onMove)
    window.addEventListener("keydown", wake)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("keydown", wake)
    }
  }, [])

  // React to a run: gasp while it runs, then a face for how it went.
  const [prevStatus, setPrevStatus] = useState(status)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setFace(
      prevStatus !== "running"
        ? undefined
        : check?.pass
          ? FACE.stars
          : status === "done" && check?.pass !== false
            ? FACE.laugh
            : status === "stopped"
              ? FACE.blush
              : FACE.dizzy
    )
  }
  useEffect(() => {
    if (face === undefined) return
    const t = setTimeout(() => setFace(undefined), REACTION_MS)
    return () => clearTimeout(t)
  }, [face])
  // Poke: a different face each time so repeat pokes restart the reaction.
  const poke = () =>
    setFace((f) => {
      const pool = POKE.filter((p) => p !== f)
      return pool[Math.floor(Math.random() * pool.length)]
    })
  const shown = status === "running" ? FACE.surprised : face

  const reacting = shown !== undefined || asleep
  return (
    <div
      ref={ref}
      aria-hidden
      onPointerDown={poke}
      className="absolute right-6 bottom-0 z-10 size-20 translate-y-[24%] cursor-pointer transition-transform duration-100 select-none active:scale-90 motion-reduce:transition-none"
    >
      <Sheet
        src={`/images/${mascot}-directions.webp`}
        cell={look}
        on={!reacting}
      />
      <Sheet
        src={`/images/${mascot}-reactions.webp`}
        cell={shown ?? FACE.asleep}
        on={reacting}
      />
    </div>
  )
}

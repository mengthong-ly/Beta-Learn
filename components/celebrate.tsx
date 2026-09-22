"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

// One <Celebrations/> is mounted per workspace; celebrate() reaches it like toast() reaches <Toaster/>.
let fire: ((big: boolean) => void) | undefined

/** Confetti burst. `big` for finishing a section, a course, or a perfect quiz. */
export const celebrate = (big = false) => fire?.(big)

const COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]

function Burst({ big }: { big: boolean }) {
  const [bits] = useState(() =>
    Array.from({ length: big ? 60 : 28 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const dist = (big ? 280 : 170) * (0.5 + Math.random() / 2)
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        rotate: Math.random() * 540 - 270,
        size: 6 + Math.random() * 4,
        color: COLORS[i % COLORS.length],
      }
    })
  )
  return (
    <div className="absolute top-1/2 left-1/2">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[2px]"
          style={{ background: `var(${b.color})`, width: b.size, height: b.size * 0.6 }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: b.x,
            y: [0, b.y, b.y + 140],
            opacity: [1, 1, 0],
            rotate: b.rotate,
          }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], times: [0, 0.6, 1] }}
        />
      ))}
    </div>
  )
}

export function Celebrations() {
  const reduce = useReducedMotion()
  const [bursts, setBursts] = useState<{ id: number; big: boolean }[]>([])
  useEffect(() => {
    fire = (big) => {
      if (reduce) return
      const id = Date.now() + Math.random()
      setBursts((b) => [...b, { id, big }])
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600)
    }
    return () => {
      fire = undefined
    }
  }, [reduce])
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((b) => (
        <Burst key={b.id} big={b.big} />
      ))}
    </div>
  )
}

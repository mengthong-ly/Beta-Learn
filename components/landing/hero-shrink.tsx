"use client"

import { useEffect } from "react"

/**
 * Drives the hero's pin-and-shrink: `--hero-t` runs 0 → 1 over the first
 * DISTANCE pixels of scroll, and the hero's clip-path reads it.
 *
 * A scroll listener rather than `animation-timeline: scroll()`. The CSS
 * timeline goes inactive for the hero once it sits inside the sticky pin
 * wrapper — and it fails silently, pinning the hero at its end state with no
 * error anywhere. The listener is passive and coalesced into one frame.
 *
 * Without JS the hero simply stays full-bleed and the page scrolls normally.
 */
const DISTANCE = 340

export function HeroShrink() {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--hero-shrink", `${DISTANCE}px`)

    // Reduced motion gets the settled inset card and no pinning at all.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--hero-t", "1")
      return () => root.style.removeProperty("--hero-t")
    }

    let frame = 0
    const update = () => {
      frame = 0
      const t = Math.min(1, Math.max(0, window.scrollY / DISTANCE))
      root.style.setProperty("--hero-t", String(t))
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }

    // Only pin once we can actually drive the shrink.
    root.dataset.heroShrink = "on"
    update()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
      delete root.dataset.heroShrink
      root.style.removeProperty("--hero-t")
      root.style.removeProperty("--hero-shrink")
    }
  }, [])

  return null
}

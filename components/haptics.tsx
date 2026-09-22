"use client"

import { useEffect } from "react"
import { Haptics, ImpactStyle } from "@capacitor/haptics"

// One light tap for every link, button or tab click. Native haptics inside a
// Capacitor app; navigator.vibrate on the web (Android). Where neither exists
// (desktop, iOS Safari) the plugin rejects and we ignore it.
const TAPPABLE = 'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]'

export function TapHaptics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest(TAPPABLE)
      if (!el || el.matches(":disabled, [aria-disabled='true']")) return
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
    }
    document.addEventListener("click", onClick, { capture: true })
    return () => document.removeEventListener("click", onClick, { capture: true })
  }, [])
  return null
}

"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { CheckIcon, PaletteIcon } from "lucide-react"

import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MASCOTS,
  setMascot,
  useMascot,
  type MascotId,
} from "@/components/mascot"

export const FONTS = [
  {
    id: "mono",
    label: "JetBrains Mono",
    family: "'JetBrains Mono Variable', monospace",
  },
  { id: "poppins", label: "Poppins", family: "Poppins, sans-serif" },
  {
    id: "google-sans",
    label: "Google Sans",
    family: "'Google Sans', sans-serif",
  },
] as const
export type FontId = (typeof FONTS)[number]["id"]

export const FONT_STORAGE_KEY = "font"

// The font lives on <html data-font> (set before first paint by the script in app/layout.tsx).
const listeners = new Set<() => void>()
function setFont(id: FontId) {
  document.documentElement.dataset.font = id
  try {
    localStorage.setItem(FONT_STORAGE_KEY, id)
  } catch {
    /* private mode: the choice just won't persist */
  }
  listeners.forEach((l) => l())
}
function useFont() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => (document.documentElement.dataset.font as FontId) ?? "mono",
    () => "mono" as FontId
  )
}

/** A submenu: render it inside a DropdownMenuContent. */
export function AppearanceMenu() {
  const { theme, setTheme } = useTheme()
  const font = useFont()
  const mascot = useMascot()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <PaletteIcon />
        Appearance
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Font</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={font}
            onValueChange={(v) => setFont(v as FontId)}
          >
            {FONTS.map((f) => (
              <DropdownMenuRadioItem
                key={f.id}
                value={f.id}
                style={{ fontFamily: f.family }}
              >
                {f.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Mascot</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={mascot}
            onValueChange={(v) => setMascot(v as MascotId)}
          >
            {MASCOTS.map((m) => (
              <DropdownMenuRadioItem key={m.id} value={m.id}>
                {m.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
          <CheckIcon className="size-3" />
          Code always uses JetBrains Mono
        </p>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

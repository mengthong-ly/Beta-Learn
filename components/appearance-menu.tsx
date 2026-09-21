"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { CheckIcon, PaletteIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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

export function AppearanceMenu() {
  const { theme, setTheme } = useTheme()
  const font = useFont()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <PaletteIcon />
              <span>Appearance</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {FONTS.find((f) => f.id === font)?.label}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-60">
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
                <DropdownMenuRadioItem value="light">
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground">
              <CheckIcon className="size-3" />
              Code always uses JetBrains Mono
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

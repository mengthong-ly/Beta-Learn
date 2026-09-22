"use client"

import { useSyncExternalStore } from "react"

/**
 * Appearance settings live as data-attributes on <html> (so CSS can react to them) and in
 * localStorage (so they persist). The inline script in app/layout.tsx applies them before
 * first paint; these helpers keep React in sync afterwards.
 */
export const SETTINGS = {
  font: {
    default: "mono",
    values: ["mono", "poppins", "google-sans", "plus-jakarta"],
  },
  style: { default: "glass", values: ["glass", "notion"] },
} as const

export type SettingKey = keyof typeof SETTINGS
export type SettingValue<K extends SettingKey> =
  (typeof SETTINGS)[K]["values"][number]

const listeners = new Set<() => void>()

export function setHtmlSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>
) {
  document.documentElement.dataset[key] = value
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: the choice just won't persist */
  }
  listeners.forEach((l) => l())
}

export function useHtmlSetting<K extends SettingKey>(key: K): SettingValue<K> {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () =>
      (document.documentElement.dataset[key] ??
        SETTINGS[key].default) as SettingValue<K>,
    () => SETTINGS[key].default as SettingValue<K>
  )
}

/** Inline <head> script: apply saved settings before the first paint (no flash). */
export const settingsScript = `try{${Object.entries(SETTINGS)
  .map(
    ([k, s]) =>
      `var ${k}=localStorage.getItem("${k}");document.documentElement.dataset.${k}=${JSON.stringify(s.values)}.indexOf(${k})>-1?${k}:"${s.default}";`
  )
  .join("")}}catch(e){}`

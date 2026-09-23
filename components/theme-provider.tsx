"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// No single-key theme shortcut: pressing "d" while reading kept flipping the theme.
// Theme is changed from the Appearance menu in the sidebar footer.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

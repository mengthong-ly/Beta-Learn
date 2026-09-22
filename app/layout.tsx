import type { Metadata } from "next"

import "./globals.css"
import { TapHaptics } from "@/components/haptics"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export const metadata: Metadata = {
  title: { default: "ThongLearn", template: "%s · ThongLearn" },
  description:
    "Learn Python fast: lessons, a guide book, a real editor, and a look inside what Python is doing.",
}

// Applies the saved font before first paint (no flash). Mirrors setFont() in appearance-menu.tsx.
const fontScript = `try{var f=localStorage.getItem("font");if(f)document.documentElement.dataset.font=f}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-font="mono"
      className="antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontScript }} />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-center" />
            <TapHaptics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

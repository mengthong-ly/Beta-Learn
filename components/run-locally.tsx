"use client"

import { CopyIcon, LaptopIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const STEPS = [
  {
    title: "Get the code",
    commands: ["git clone https://github.com/mengthong-ly/Beta-Learn", "cd Beta-Learn && npm install"],
  },
  { title: "Set up the lesson sandboxes (once)", commands: ["npm run setup:runtimes"] },
  { title: "Start it, then open http://localhost:3000", commands: ["npm run dev"] },
]

export function CopyCommand({ command }: { command: string }) {
  return (
    <Button
      variant="ghost"
      size="xs"
      className="max-w-full font-mono"
      onClick={() =>
        navigator.clipboard.writeText(command).then(() => toast("Copied", { description: command }))
      }
    >
      <CopyIcon />
      <span className="truncate">{command}</span>
    </Button>
  )
}

/** How to run every course on your own toolchains: the website only runs what a browser can. */
export function RunLocallySteps() {
  return (
    <div className="grid gap-4 text-sm">
      <p className="text-muted-foreground">
        You need macOS or Linux, git, Node.js 20.9 or later, and the course&apos;s toolchain (the
        Dart SDK, Flutter or a C++ compiler). Windows can&apos;t run lessons yet: the sandbox that
        keeps lesson code away from your files doesn&apos;t start there.
      </p>
      <ol className="grid gap-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs tabular-nums">
              {i + 1}
            </span>
            <div className="grid min-w-0 gap-1">
              <p className="font-medium">{s.title}</p>
              <div className="grid min-w-0 justify-items-start">
                {s.commands.map((c) => (
                  <CopyCommand key={c} command={c} />
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground">
        Your local copy keeps its own progress, in that browser.
      </p>
    </div>
  )
}

export function RunLocallyDialog({ course }: { course: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LaptopIcon data-icon="inline-start" />
          Run it on your computer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Run it on your computer</DialogTitle>
          <DialogDescription>
            The website can&apos;t run {course}. A copy of ThongLearn on your computer runs every
            course with your own toolchains.
          </DialogDescription>
        </DialogHeader>
        <RunLocallySteps />
      </DialogContent>
    </Dialog>
  )
}

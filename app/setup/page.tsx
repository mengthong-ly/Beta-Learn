import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { SetupStatus } from "@/components/setup-status"

export const metadata = { title: "Setup" }

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10 sm:px-8 sm:py-16">
      <Link
        href="/courses"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> Courses
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-balance">
        Your computer
      </h1>
      <p className="mt-2 text-muted-foreground">
        PHP, Laravel, TypeScript, C++, Dart and Flutter lessons run on the toolchains
        installed here. Check that each one is ready, and clean up what the runs
        leave behind.
      </p>
      <SetupStatus />
    </main>
  )
}

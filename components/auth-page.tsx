"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
} from "motion/react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { FACE, MascotSprite, usePointerLook } from "@/components/mascot"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type Mode = "sign-in" | "register"

const swap: Transition = { type: "spring", duration: 0.8, bounce: 0.15 }

const COPY = {
  "sign-in": {
    title: "Welcome back",
    lead: "Sign in to pick up the lesson where you left off.",
    submit: "Sign in",
    switchText: "New here?",
    switchCta: "Create an account",
    artTitle: "Pick up where you left off.",
    artLead: "Your drafts, streaks and quiz scores are waiting.",
    code: ['streak = load("you")', "streak += 1", 'print(f"Day {streak}")'],
  },
  register: {
    title: "Create your account",
    lead: "Optional. Progress on this device is kept and merged in.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchCta: "Sign in",
    artTitle: "Learn by running real code.",
    artLead:
      "Python, PHP, TypeScript, React, Dart and Flutter, saved to every device.",
    code: [
      "def learn(topic):",
      '    return f"{topic} ✓"',
      'print(learn("Python"))',
    ],
  },
} as const

/** Standalone sign-in / register page. The form and the artwork swap sides when the mode changes. */
export function AuthPage({
  initialMode,
  next,
}: {
  initialMode: Mode
  next: string
}) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState<string>()
  const register = mode === "register"
  const copy = COPY[mode]

  useEffect(() => {
    if (session) router.replace(next)
  }, [session, next, router])

  const switchMode = () => {
    const to: Mode = register ? "sign-in" : "register"
    setMode(to)
    setError(undefined)
    const url = new URL(window.location.href)
    url.searchParams.set("mode", to)
    window.history.replaceState(null, "", url)
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get("email"))
    const password = String(f.get("password"))
    setBusy(true)
    setError(undefined)
    const { error } = register
      ? await authClient.signUp.email({
          name: String(f.get("name")),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password })
    setBusy(false)
    if (error) setError(error.message ?? "Something went wrong. Try again.")
    else router.replace(next)
  }

  const github = async () => {
    setError(undefined)
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: new URL(next, window.location.origin).href,
    })
    // Better Auth's messages here ("Provider not found") are meant for developers.
    if (error) setError("GitHub sign-in isn't available right now.")
  }

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={cn(
          "flex min-h-svh gap-3 bg-background p-3",
          register ? "md:flex-row-reverse" : "md:flex-row"
        )}
      >
        <motion.section
          layout
          transition={swap}
          className="relative z-0 flex w-full flex-col md:w-1/2"
        >
          <Link
            href="/"
            className="w-fit px-3 py-2 font-mono text-sm font-semibold tracking-tight"
          >
            ThongLearn
          </Link>
          <div className="flex flex-1 flex-col items-center justify-center px-3 py-10">
            <div className="w-full max-w-sm">
              <LoginMascot focused={focused} error={!!error} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <h1 className="text-2xl font-semibold tracking-tight text-balance">
                    {copy.title}
                  </h1>
                  <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
                    {copy.lead}
                  </p>
                  <form
                    onSubmit={submit}
                    onFocus={(e) => setFocused(e.target.name)}
                    onBlur={() => setFocused(undefined)}
                  >
                    <FieldGroup>
                      {register && (
                        <Field>
                          <FieldLabel htmlFor="name">Name</FieldLabel>
                          <Input
                            id="name"
                            name="name"
                            autoComplete="name"
                            required
                          />
                        </Field>
                      )}
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete={
                            register ? "new-password" : "current-password"
                          }
                          minLength={8}
                          required
                        />
                      </Field>
                      {error && (
                        <Alert variant="destructive" role="alert">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button type="submit" disabled={busy}>
                        {busy && <Spinner data-icon="inline-start" />}
                        {copy.submit}
                      </Button>
                      <FieldSeparator>or</FieldSeparator>
                      <Button type="button" variant="outline" onClick={github}>
                        Continue with GitHub
                      </Button>
                    </FieldGroup>
                  </form>
                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    {copy.switchText}{" "}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {copy.switchCta}
                    </button>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.section>

        <motion.aside
          layout
          transition={swap}
          aria-hidden
          className="relative z-10 hidden overflow-hidden rounded-3xl bg-salem-950 text-white md:block md:w-1/2"
        >
          <Artwork mode={mode} />
        </motion.aside>
      </main>
    </MotionConfig>
  )
}

/** Follows the pointer, reads along in the email field, and turns away while you type a password. */
function LoginMascot({ focused, error }: { focused?: string; error: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const pointer = usePointerLook(ref)
  const shy = focused === "password"
  // Directions cells: 3 = head turned to the side, 7 = looking down at the fields.
  const look = shy ? 3 : focused ? 7 : pointer
  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="relative mb-4 size-20"
      animate={{ rotate: shy ? -12 : 0, x: shy ? -6 : 0 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
    >
      <MascotSprite
        look={look}
        face={error && !focused ? FACE.dizzy : undefined}
      />
    </motion.div>
  )
}

// Blob spots per mode, so the colours drift across the panel while it slides.
const BLOBS = [
  {
    className: "bg-salem-500",
    "sign-in": { left: "-10%", top: "-5%" },
    register: { left: "45%", top: "50%" },
  },
  {
    className: "bg-pine-green-500",
    "sign-in": { left: "50%", top: "55%" },
    register: { left: "-5%", top: "10%" },
  },
  {
    className: "bg-rusty-nail-500",
    "sign-in": { left: "55%", top: "-15%" },
    register: { left: "10%", top: "65%" },
  },
] as const

function Artwork({ mode }: { mode: Mode }) {
  const copy = COPY[mode]
  const flip = mode === "register"
  return (
    <>
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute size-[60%] rounded-full opacity-70 blur-3xl",
            b.className
          )}
          initial={false}
          animate={{ ...b[mode], scale: flip ? 1.15 : 1 }}
          transition={{
            type: "spring",
            duration: 1.4,
            bounce: 0.2,
            delay: i * 0.06,
          }}
        />
      ))}
      {/* Scrim keeps the white copy readable over the bright blobs. */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-salem-950/90 to-transparent" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(255 255 255 / 0.35) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <motion.div
        className="absolute size-[70%] rounded-full border border-white/20"
        initial={false}
        animate={{
          left: flip ? "-20%" : "50%",
          top: flip ? "40%" : "-25%",
          rotate: flip ? 180 : 0,
        }}
        transition={{ type: "spring", duration: 1.6, bounce: 0.1 }}
      />

      <div className="relative flex h-full flex-col justify-end gap-6 p-10 lg:p-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: flip ? -32 : 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: flip ? 32 : -32 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <pre className="w-fit rounded-2xl border border-white/20 bg-black/25 px-5 py-4 font-mono text-sm leading-relaxed shadow-2xl backdrop-blur-md">
              {copy.code.map((line, i) => (
                <div key={i}>
                  <span className="mr-4 opacity-40 select-none">{i + 1}</span>
                  {line}
                </div>
              ))}
            </pre>
            <div>
              <p className="max-w-md text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
                {copy.artTitle}
              </p>
              <p className="mt-3 max-w-sm text-sm opacity-80">{copy.artLead}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}

import { AuthPage } from "@/components/auth-page"

export const metadata = { title: "Sign in" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>
}) {
  const { mode, next } = await searchParams
  // Only same-origin paths, so ?next= can't bounce people to another site.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/"
  return <AuthPage initialMode={mode === "register" ? "register" : "sign-in"} next={safeNext} />
}

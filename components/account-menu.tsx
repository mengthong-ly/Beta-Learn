"use client"

import { useState } from "react"
import { LogInIcon, LogOutIcon, UserIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authClient } from "@/lib/auth-client"

/** Sidebar footer entry: "Sign in" when signed out, the account menu when signed in. */
export function AccountMenu() {
  const { data, isPending } = authClient.useSession()
  const [open, setOpen] = useState(false)
  if (isPending) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {data ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton>
                <UserIcon />
                <span className="truncate">{data.user.email}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                Progress syncs to this account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => authClient.signOut()}>
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <SidebarMenuButton onClick={() => setOpen(true)}>
              <LogInIcon />
              <span>Sign in to save progress</span>
            </SidebarMenuButton>
            <AuthDialog open={open} onOpenChange={setOpen} />
          </>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const submit = (register: boolean) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get("email"))
    const password = String(f.get("password"))
    setBusy(true)
    setError(undefined)
    const { error } = register
      ? await authClient.signUp.email({ name: String(f.get("name")), email, password })
      : await authClient.signIn.email({ email, password })
    setBusy(false)
    if (error) setError(error.message ?? "Something went wrong. Try again.")
    else onOpenChange(false)
  }

  const github = async () => {
    setError(undefined)
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: window.location.href,
    })
    // Better Auth's messages here ("Provider not found") are meant for developers.
    if (error) setError("GitHub sign-in isn't available right now.")
  }

  const form = (register: boolean) => {
    const id = register ? "register" : "sign-in"
    return (
      <form onSubmit={submit(register)}>
        <FieldGroup>
          {register && (
            <Field>
              <FieldLabel htmlFor={`${id}-name`}>Name</FieldLabel>
              <Input id={`${id}-name`} name="name" autoComplete="name" required />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <Input id={`${id}-email`} name="email" type="email" autoComplete="email" required />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
            <Input
              id={`${id}-password`}
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
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
            {register ? "Create account" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save your progress</DialogTitle>
          <DialogDescription>
            Optional. Progress on this device is kept and merged into your account.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="sign-in" onValueChange={() => setError(undefined)}>
          <TabsList className="w-full">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="pt-4">
            {form(false)}
          </TabsContent>
          <TabsContent value="register" className="pt-4">
            {form(true)}
          </TabsContent>
        </Tabs>
        <Button variant="outline" onClick={github}>
          Continue with GitHub
        </Button>
      </DialogContent>
    </Dialog>
  )
}

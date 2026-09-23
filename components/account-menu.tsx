"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronsUpDownIcon,
  LogInIcon,
  LogOutIcon,
  MonitorCogIcon,
  UserIcon,
} from "lucide-react"

import { AppearanceMenu } from "@/components/appearance-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

/** Sidebar footer: the account row, which expands upward into setup, appearance and sign in/out. */
export function AccountMenu() {
  const { data, isPending } = authClient.useSession()
  const pathname = usePathname()

  return (
    <Collapsible className="group/account">
      <SidebarMenu>
        <CollapsibleContent className="flex flex-col gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/setup">
                <MonitorCogIcon />
                <span>Setup</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <AppearanceMenu />
          {!isPending && (
            <SidebarMenuItem>
              {data ? (
                <SidebarMenuButton onClick={() => authClient.signOut()}>
                  <LogOutIcon />
                  <span>Sign out</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton asChild>
                  <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                    <LogInIcon />
                    <span>Sign in to save progress</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )}
        </CollapsibleContent>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              size="lg"
              title={data ? "Progress syncs to this account" : undefined}
            >
              <UserIcon />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">
                  {data ? data.user.name || data.user.email : "Guest"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {data ? data.user.email : "Settings and sign in"}
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarMenuItem>
      </SidebarMenu>
    </Collapsible>
  )
}

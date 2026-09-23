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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

/** Sidebar footer: the account row, which opens a menu with setup, appearance and sign in/out. */
export function AccountMenu() {
  const { data, isPending } = authClient.useSession()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const name = data ? data.user.name || data.user.email : "Guest"
  // The same avatar + name block heads both the row and the open menu.
  const who = (
    <>
      <Avatar className="rounded-lg after:rounded-lg">
        {data?.user.image && (
          <AvatarImage
            src={data.user.image}
            alt={name}
            className="rounded-lg"
          />
        )}
        <AvatarFallback className="rounded-lg">
          {data ? name[0].toUpperCase() : <UserIcon className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <span className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {data ? data.user.email : "Not signed in"}
        </span>
      </span>
    </>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {who}
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-foreground">
                {who}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/setup">
                  <MonitorCogIcon />
                  Setup
                </Link>
              </DropdownMenuItem>
              <AppearanceMenu />
            </DropdownMenuGroup>
            {!isPending && (
              <>
                <DropdownMenuSeparator />
                {data ? (
                  <DropdownMenuItem onSelect={() => authClient.signOut()}>
                    <LogOutIcon />
                    Log out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href={`/login?next=${encodeURIComponent(pathname)}`}>
                      <LogInIcon />
                      Sign in to save progress
                    </Link>
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

"use client"

import { useEffect } from "react"

import { authClient } from "@/lib/auth-client"
import { stopSync, syncAll } from "@/lib/sync"

/** Syncs progress with the account whenever someone is signed in. Renders nothing. */
export function AccountSync() {
  const userId = authClient.useSession().data?.user.id
  useEffect(() => {
    if (userId) syncAll()
    else stopSync()
  }, [userId])
  return null
}

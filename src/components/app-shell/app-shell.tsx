"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { TopNav } from "./top-nav"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute =
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email"
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/")

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col",
        isChatRoute && "h-dvh overflow-hidden",
      )}
    >
      {isAuthRoute ? null : <TopNav />}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isAuthRoute || isChatRoute ? "pb-0" : "pb-10",
          isChatRoute && "overflow-hidden",
        )}
      >
        {children}
      </main>
    </div>
  )
}

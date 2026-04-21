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

  return (
    <div className="relative flex min-h-screen flex-col">
      {isAuthRoute ? null : <TopNav />}
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isAuthRoute ? "pb-0" : "pb-10",
        )}
      >
        {children}
      </main>
    </div>
  )
}

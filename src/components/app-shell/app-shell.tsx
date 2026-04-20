"use client"

import type { ReactNode } from "react"

import { TopNav } from "./top-nav"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}

"use client"

import Link from "next/link"

import { AddBookDialog } from "@/components/add-book-dialog"

import { SegmentedRouteToggle } from "./segmented-route-toggle"
import { ThemeToggle } from "./theme-toggle"

export function TopNav() {
  return (
    <header className="surface-blur sticky top-0 z-30 border-b border-border">
      <div className="flex h-12 items-center gap-2 px-4 md:px-6">
        <Link
          href="/"
          aria-label="Dona Flora — ir para a biblioteca"
          className="shrink-0 text-base font-semibold tracking-tight text-foreground"
        >
          Dona Flora
        </Link>
        <SegmentedRouteToggle />
        <div className="ml-auto flex items-center gap-2">
          <AddBookDialog />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

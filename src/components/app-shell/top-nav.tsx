"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { AddBookDialog } from "@/components/add-book-dialog"
import { AccountMenu } from "@/components/account/account-menu"
import { useAppLanguage } from "@/components/app-shell/app-language-provider"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "./theme-toggle"

export function TopNav() {
  const pathname = usePathname()
  const { copy } = useAppLanguage()
  const activeKey = pathname.startsWith("/chat") ? "chat" : "library"

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-3 pt-3 md:px-5">
      <div className="page-frame">
        <div className="surface-blur pointer-events-auto flex flex-wrap items-center gap-3 rounded-[1.75rem] border border-glass-border px-4 py-3 md:h-16 md:flex-nowrap md:px-5 md:py-0">
          <Link
            href="/"
            aria-label={copy.nav.homeAriaLabel}
            className="min-w-0 shrink-0"
          >
            <span className="block text-[1.05rem] font-semibold tracking-[-0.05em] text-foreground">
              Dona Flora
            </span>
            <span className="hidden text-[0.72rem] tracking-[0.14em] text-muted-foreground uppercase md:block">
              {copy.nav.brandSubtitle}
            </span>
          </Link>

          <nav
            aria-label={copy.nav.primaryNavigationLabel}
            className="glass-pill order-3 grid h-11 min-w-0 basis-full grid-cols-2 items-center gap-1 rounded-full p-1 md:order-none md:inline-flex md:w-auto md:basis-auto"
          >
            <Link
              href="/"
              aria-current={activeKey === "library" ? "page" : undefined}
              className={cn(
                "surface-transition inline-flex h-9 items-center justify-center truncate rounded-full px-3 text-[0.84rem] font-medium tracking-[-0.02em] md:px-4 md:text-sm",
                activeKey === "library"
                  ? "bg-primary text-primary-foreground shadow-mac-sm"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              {copy.nav.library}
            </Link>

            <Link
              href="/chat"
              aria-current={activeKey === "chat" ? "page" : undefined}
              className={cn(
                "surface-transition inline-flex h-9 items-center justify-center truncate rounded-full px-3 text-[0.84rem] font-medium tracking-[-0.02em] md:px-4 md:text-sm",
                activeKey === "chat"
                  ? "bg-primary text-primary-foreground shadow-mac-sm"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
              )}
            >
              {copy.nav.chat}
            </Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AddBookDialog />
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

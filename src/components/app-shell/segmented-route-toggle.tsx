"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const ROUTES = [
  { href: "/", key: "library", label: "Biblioteca" },
  { href: "/chat", key: "chat", label: "Chat" },
] as const

export function SegmentedRouteToggle() {
  const pathname = usePathname()
  const activeKey = pathname.startsWith("/chat") ? "chat" : "library"

  return (
    <nav
      aria-label="Navegação principal"
      className="glass-pill grid h-11 w-full grid-cols-2 items-center gap-1 rounded-full p-1 md:inline-flex md:w-auto"
    >
      {ROUTES.map((route) => {
        const isActive = route.key === activeKey

        return (
          <Link
            key={route.key}
            href={route.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "surface-transition inline-flex h-9 items-center justify-center truncate rounded-full px-3 text-[0.84rem] font-medium tracking-[-0.02em] md:px-4 md:text-sm",
              isActive
                ? "bg-primary text-primary-foreground shadow-mac-sm"
                : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
            )}
          >
            {route.label}
          </Link>
        )
      })}
    </nav>
  )
}

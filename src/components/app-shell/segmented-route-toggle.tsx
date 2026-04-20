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
      className="inline-flex h-8 items-center rounded-full bg-secondary p-0.5"
    >
      {ROUTES.map((route) => {
        const isActive = route.key === activeKey

        return (
          <Link
            key={route.key}
            href={route.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "surface-transition inline-flex h-7 items-center rounded-full px-3 text-sm font-medium",
              isActive
                ? "shadow-mac-sm bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {route.label}
          </Link>
        )
      })}
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const ROUTES = [
  { href: "/", key: "library", label: "Biblioteca" },
  { href: "/trails", key: "trails", label: "Trilhas" },
  { href: "/chat", key: "chat", label: "Chat" },
] as const

export function SegmentedRouteToggle() {
  const pathname = usePathname()
  const activeKey = pathname.startsWith("/chat")
    ? "chat"
    : pathname.startsWith("/trails")
      ? "trails"
      : "library"

  return (
    <nav
      aria-label="Navegação principal"
      className="brand-chip grid h-11 w-full grid-cols-3 items-center gap-1 p-1 md:inline-flex md:w-auto"
    >
      {ROUTES.map((route) => {
        const isActive = route.key === activeKey

        return (
          <Link
            key={route.key}
            href={route.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "surface-transition inline-flex h-9 items-center justify-center truncate rounded-md px-3 text-[0.84rem] font-medium md:px-4 md:text-sm",
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

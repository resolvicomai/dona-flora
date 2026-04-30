import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton for the sidebar (UI-SPEC §Component Inventory: 5 rows).
 * Used only as a fallback when the sidebar data is loaded async — the
 * current RSC flow (`force-dynamic` + `noStore()`) resolves synchronously
 * on the server, but Next.js Suspense boundaries may surface this as a
 * fallback during revalidation.
 */
export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

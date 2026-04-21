import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "surface-transition flex field-sizing-content min-h-24 w-full rounded-[1.5rem] border border-hairline bg-surface-elevated px-4 py-3 text-base text-foreground shadow-mac-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-surface-elevated focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:shadow-mac-md disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

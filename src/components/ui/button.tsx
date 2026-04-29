import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cloneElement, isValidElement, type ReactElement } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button surface-transition inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-[0.84rem] font-medium tracking-normal whitespace-nowrap outline-none select-none hover:-translate-y-px active:translate-y-px focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground shadow-mac-sm hover:shadow-mac-md",
        outline:
          "border-hairline-strong bg-surface text-foreground shadow-none hover:bg-surface-strong aria-expanded:bg-surface-strong aria-expanded:text-foreground",
        secondary:
          "border-hairline bg-surface text-foreground shadow-none hover:bg-surface-strong aria-expanded:bg-surface-strong aria-expanded:text-foreground",
        ghost:
          "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-foreground/[0.05] hover:text-foreground aria-expanded:bg-foreground/[0.05] aria-expanded:text-foreground",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1.5 px-3 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-[0.8rem] in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10 rounded-md",
        "icon-xs":
          "size-8 rounded-md in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-md in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-11 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  children,
  className,
  nativeButton,
  render,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const classes = cn(buttonVariants({ variant, size, className }))
  const renderProps =
    render && isValidElement(render)
      ? (render.props as { className?: string; href?: unknown })
      : null

  if (renderProps?.href) {
    return cloneElement(
      render as ReactElement<Record<string, unknown>>,
      {
        ...props,
        className: cn(classes, renderProps.className),
        "data-slot": "button",
      },
      children,
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={classes}
      nativeButton={nativeButton}
      render={render}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }

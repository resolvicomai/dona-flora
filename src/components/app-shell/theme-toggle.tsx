"use client"

import { Check, Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type ThemePreference } from "@/lib/theme"

import { useTheme } from "./theme-provider"

const THEME_OPTIONS: Array<{
  description?: string
  icon: LucideIcon
  label: string
  value: ThemePreference
}> = [
  {
    icon: Sun,
    label: "Claro",
    value: "light",
  },
  {
    icon: Moon,
    label: "Escuro",
    value: "dark",
  },
  {
    description: "Acompanha o sistema",
    icon: Monitor,
    label: "Automático",
    value: "system",
  },
]

function ThemeOptionButton({
  isSelected,
  onSelect,
  option,
}: {
  isSelected: boolean
  onSelect: (value: ThemePreference) => void
  option: (typeof THEME_OPTIONS)[number]
}) {
  const Icon = option.icon

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "surface-transition h-auto w-full justify-between rounded-md px-2.5 py-2 text-left hover:bg-accent",
        isSelected && "bg-secondary text-foreground hover:bg-secondary",
      )}
      onClick={() => onSelect(option.value)}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden="true" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{option.label}</span>
          {option.description ? (
            <span className="truncate text-xs text-muted-foreground">
              {option.description}
            </span>
          ) : null}
        </span>
      </span>
      <Check
        aria-hidden="true"
        className={cn(
          "text-muted-foreground transition-opacity",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
    </Button>
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()
  const [open, setOpen] = useState(false)

  const activeOption =
    THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[2]
  const ActiveIcon = activeOption.icon

  const handleSelect = (nextTheme: ThemePreference) => {
    setTheme(nextTheme)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alterar tema"
            className="surface-transition rounded-md text-foreground hover:bg-accent"
            title={`Tema: ${activeOption.label}`}
          >
            <ActiveIcon
              aria-hidden="true"
              className={cn(
                "transition-transform",
                theme === "system" && resolvedTheme === "dark" && "rotate-180",
              )}
            />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="surface-blur-popover w-60 rounded-lg border border-border/60 p-2 shadow-mac-md"
      >
        <PopoverHeader className="px-2 pb-1">
          <PopoverTitle>Aparência</PopoverTitle>
          <PopoverDescription>Escolha como a Dona Flora vai se apresentar.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {THEME_OPTIONS.map((option) => (
            <ThemeOptionButton
              key={option.value}
              isSelected={theme === option.value}
              onSelect={handleSelect}
              option={option}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

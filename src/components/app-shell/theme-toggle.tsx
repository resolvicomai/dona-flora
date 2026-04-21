"use client"

import { Check, Monitor, MoonStar, SunMedium, type LucideIcon } from "lucide-react"
import { useState } from "react"

import { useAppLanguage } from "@/components/app-shell/app-language-provider"
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
    icon: SunMedium,
    label: "Claro",
    value: "light",
  },
  {
    icon: MoonStar,
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

const THEME_COPY = {
  "pt-BR": {
    appearance: "Aparência",
    automatic: "Automático",
    automaticDescription: "Acompanha o sistema",
    dark: "Escuro",
    description: "Escolha como a Dona Flora vai se apresentar.",
    light: "Claro",
    titlePrefix: "Tema",
    triggerLabel: "Alterar tema",
  },
  en: {
    appearance: "Appearance",
    automatic: "System",
    automaticDescription: "Follow the system",
    dark: "Dark",
    description: "Choose how Dona Flora should appear.",
    light: "Light",
    titlePrefix: "Theme",
    triggerLabel: "Change theme",
  },
  es: {
    appearance: "Apariencia",
    automatic: "Sistema",
    automaticDescription: "Sigue al sistema",
    dark: "Oscuro",
    description: "Elige cómo debe presentarse Dona Flora.",
    light: "Claro",
    titlePrefix: "Tema",
    triggerLabel: "Cambiar tema",
  },
  "zh-CN": {
    appearance: "外观",
    automatic: "跟随系统",
    automaticDescription: "跟随系统设置",
    dark: "深色",
    description: "选择 Dona Flora 的显示方式。",
    light: "浅色",
    titlePrefix: "主题",
    triggerLabel: "切换主题",
  },
} as const

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
      variant="secondary"
      className={cn(
        "h-auto w-full justify-between rounded-[1.25rem] px-3 py-3 text-left shadow-none",
        isSelected
          ? "border-hairline bg-foreground/[0.06] text-foreground"
          : "border-transparent bg-transparent text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
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
  const { locale } = useAppLanguage()
  const { setTheme, theme } = useTheme()
  const [open, setOpen] = useState(false)
  const copy = THEME_COPY[locale]
  const themedOptions = [
    {
      ...THEME_OPTIONS[0],
      label: copy.light,
    },
    {
      ...THEME_OPTIONS[1],
      label: copy.dark,
    },
    {
      ...THEME_OPTIONS[2],
      description: copy.automaticDescription,
      label: copy.automatic,
    },
  ] as const

  const activeOption =
    themedOptions.find((option) => option.value === theme) ?? themedOptions[2]
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
            aria-label={copy.triggerLabel}
            className="size-10 text-foreground"
            title={`${copy.titlePrefix}: ${activeOption.label}`}
          >
            <ActiveIcon
              aria-hidden="true"
              className="transition-transform"
            />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-64"
      >
        <PopoverHeader className="px-1 pb-1">
          <PopoverTitle>{copy.appearance}</PopoverTitle>
          <PopoverDescription>{copy.description}</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {themedOptions.map((option) => (
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

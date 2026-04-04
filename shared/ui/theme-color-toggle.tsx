"use client"

import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { THEME_COLORS } from "@/shared/lib/theme-colors"
import { useThemeColor } from "@/shared/ui/theme-color-provider"

export function ThemeColorToggle() {
  const { color, setColor } = useThemeColor()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Cambiar color del tema">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {THEME_COLORS.map((theme) => (
          <DropdownMenuItem
            key={theme.name}
            onClick={() => setColor(theme.name)}
            className="gap-2"
          >
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: theme.activeColor }}
            />
            <span className="flex-1">{theme.label}</span>
            {color === theme.name && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

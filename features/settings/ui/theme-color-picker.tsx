"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { THEME_COLORS } from "@/shared/lib/theme-colors"
import { useThemeColor } from "@/shared/ui/theme-color-provider"
import { Check } from "lucide-react"

export function ThemeColorPicker() {
  const { color, setColor } = useThemeColor()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color del tema</CardTitle>
        <CardDescription>
          Elige el color base de la interfaz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => setColor(theme.name)}
              className="group flex flex-col items-center gap-1.5"
              aria-label={`Color ${theme.label}`}
              aria-pressed={color === theme.name}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  color === theme.name
                    ? "border-foreground scale-110"
                    : "border-transparent hover:border-muted-foreground/40 hover:scale-105"
                }`}
                style={{ backgroundColor: theme.activeColor }}
              >
                {color === theme.name && (
                  <Check className="h-4 w-4 text-white drop-shadow-sm" />
                )}
              </div>
              <span className={`text-[11px] ${
                color === theme.name
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}>
                {theme.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

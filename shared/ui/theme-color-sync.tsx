"use client"

import { ThemeColorProvider } from "@/shared/ui/theme-color-provider"
import { updateThemeColorAction } from "@/features/settings/actions"

interface ThemeColorSyncProps {
  children: React.ReactNode
  initialColor: string
}

/**
 * Wraps children with ThemeColorProvider, syncing color changes to the database.
 * Used in the admin layout where the user is authenticated.
 */
export function ThemeColorSync({ children, initialColor }: ThemeColorSyncProps) {
  return (
    <ThemeColorProvider
      initialColor={initialColor}
      onColorChange={updateThemeColorAction}
    >
      {children}
    </ThemeColorProvider>
  )
}

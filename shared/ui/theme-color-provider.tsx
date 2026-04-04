"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { useTheme } from "next-themes"
import {
  THEME_COLORS,
  STORAGE_KEY,
  DEFAULT_COLOR,
  getThemeColor,
} from "@/shared/lib/theme-colors"

interface ThemeColorContextValue {
  color: string
  setColor: (name: string) => void
}

const ThemeColorContext = createContext<ThemeColorContextValue>({
  color: DEFAULT_COLOR,
  setColor: () => {},
})

export function useThemeColor() {
  return useContext(ThemeColorContext)
}

function applyColorVars(colorName: string, isDark: boolean) {
  const theme = getThemeColor(colorName)
  if (!theme) return

  const vars = isDark ? theme.dark : theme.light
  const style = document.documentElement.style

  // Clear previous theme color vars
  for (const t of THEME_COLORS) {
    for (const key of Object.keys(t.light)) {
      style.removeProperty(key)
    }
  }

  // Apply new vars (skip if neutral — let CSS defaults take over)
  if (colorName !== DEFAULT_COLOR) {
    for (const [key, value] of Object.entries(vars)) {
      style.setProperty(key, value)
    }
  }

  document.documentElement.setAttribute("data-theme-color", colorName)
}

interface ThemeColorProviderProps {
  children: React.ReactNode
  /** Initial color from the database (server-side). Falls back to localStorage. */
  initialColor?: string
  /** Server action to persist color to DB */
  onColorChange?: (color: string) => Promise<{ error?: string }>
}

export function ThemeColorProvider({
  children,
  initialColor,
  onColorChange,
}: ThemeColorProviderProps) {
  const { resolvedTheme } = useTheme()
  const [color, setColorState] = useState(() => {
    // Use server-provided color if valid
    if (initialColor && getThemeColor(initialColor)) return initialColor
    return DEFAULT_COLOR
  })

  // Sync localStorage with server color on mount
  useEffect(() => {
    if (initialColor && getThemeColor(initialColor)) {
      localStorage.setItem(STORAGE_KEY, initialColor)
      setColorState(initialColor)
    } else {
      // Fallback: read from localStorage (for non-authenticated pages)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && getThemeColor(stored)) {
        setColorState(stored)
      }
    }
  }, [initialColor])

  // Re-apply when color or light/dark theme changes
  useEffect(() => {
    if (!resolvedTheme) return
    applyColorVars(color, resolvedTheme === "dark")
  }, [color, resolvedTheme])

  const setColor = useCallback(
    (name: string) => {
      if (!getThemeColor(name)) return
      // Update localStorage immediately (for anti-flash script)
      localStorage.setItem(STORAGE_KEY, name)
      setColorState(name)
      // Persist to DB in background
      onColorChange?.(name)
    },
    [onColorChange]
  )

  return (
    <ThemeColorContext.Provider value={{ color, setColor }}>
      {children}
    </ThemeColorContext.Provider>
  )
}

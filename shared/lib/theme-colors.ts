export interface ThemeColor {
  name: string
  label: string
  activeColor: string // for the preview swatch
  light: Record<string, string>
  dark: Record<string, string>
}

export const THEME_COLORS: ThemeColor[] = [
  {
    name: "neutral",
    label: "Neutro",
    activeColor: "#404040",
    light: {
      "--primary": "oklch(0.205 0 0)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.708 0 0)",
      "--sidebar-primary": "oklch(0.205 0 0)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.922 0 0)",
      "--primary-foreground": "oklch(0.205 0 0)",
      "--ring": "oklch(0.556 0 0)",
      "--sidebar-primary": "oklch(0.922 0 0)",
      "--sidebar-primary-foreground": "oklch(0.205 0 0)",
    },
  },
  {
    name: "blue",
    label: "Azul",
    activeColor: "#3b82f6",
    light: {
      "--primary": "oklch(0.488 0.243 264.376)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.488 0.243 264.376)",
      "--sidebar-primary": "oklch(0.488 0.243 264.376)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.623 0.214 259.815)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.623 0.214 259.815)",
      "--sidebar-primary": "oklch(0.623 0.214 259.815)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
  {
    name: "violet",
    label: "Violeta",
    activeColor: "#8b5cf6",
    light: {
      "--primary": "oklch(0.491 0.267 292.581)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.491 0.267 292.581)",
      "--sidebar-primary": "oklch(0.491 0.267 292.581)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.627 0.243 292.581)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.627 0.243 292.581)",
      "--sidebar-primary": "oklch(0.627 0.243 292.581)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
  {
    name: "green",
    label: "Verde",
    activeColor: "#22c55e",
    light: {
      "--primary": "oklch(0.508 0.175 155.771)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.508 0.175 155.771)",
      "--sidebar-primary": "oklch(0.508 0.175 155.771)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.648 0.200 155.771)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.648 0.200 155.771)",
      "--sidebar-primary": "oklch(0.648 0.200 155.771)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
  {
    name: "orange",
    label: "Naranja",
    activeColor: "#f97316",
    light: {
      "--primary": "oklch(0.553 0.195 38.402)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.553 0.195 38.402)",
      "--sidebar-primary": "oklch(0.553 0.195 38.402)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.680 0.180 38.402)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.680 0.180 38.402)",
      "--sidebar-primary": "oklch(0.680 0.180 38.402)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
  {
    name: "rose",
    label: "Rosa",
    activeColor: "#f43f5e",
    light: {
      "--primary": "oklch(0.514 0.222 16.935)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.514 0.222 16.935)",
      "--sidebar-primary": "oklch(0.514 0.222 16.935)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.650 0.210 16.935)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.650 0.210 16.935)",
      "--sidebar-primary": "oklch(0.650 0.210 16.935)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
  {
    name: "teal",
    label: "Turquesa",
    activeColor: "#14b8a6",
    light: {
      "--primary": "oklch(0.532 0.140 181.071)",
      "--primary-foreground": "oklch(0.985 0 0)",
      "--ring": "oklch(0.532 0.140 181.071)",
      "--sidebar-primary": "oklch(0.532 0.140 181.071)",
      "--sidebar-primary-foreground": "oklch(0.985 0 0)",
    },
    dark: {
      "--primary": "oklch(0.660 0.150 181.071)",
      "--primary-foreground": "oklch(0.145 0 0)",
      "--ring": "oklch(0.660 0.150 181.071)",
      "--sidebar-primary": "oklch(0.660 0.150 181.071)",
      "--sidebar-primary-foreground": "oklch(0.145 0 0)",
    },
  },
]

export const STORAGE_KEY = "theme-color"
export const DEFAULT_COLOR = "neutral"

export function getThemeColor(name: string): ThemeColor | undefined {
  return THEME_COLORS.find((c) => c.name === name)
}

/**
 * Inline script to apply theme color before React hydration (prevents flash).
 * Must be injected as dangerouslySetInnerHTML in a <script> tag.
 */
export function getThemeColorScript(): string {
  return `
(function(){
  try {
    var c = localStorage.getItem("${STORAGE_KEY}");
    if (!c || c === "${DEFAULT_COLOR}") return;
    var presets = ${JSON.stringify(
      THEME_COLORS.reduce(
        (acc, t) => {
          acc[t.name] = { light: t.light, dark: t.dark };
          return acc;
        },
        {} as Record<string, { light: Record<string, string>; dark: Record<string, string> }>
      )
    )};
    var p = presets[c];
    if (!p) return;
    var isDark = document.documentElement.classList.contains("dark") ||
      (!document.documentElement.classList.contains("light") &&
       window.matchMedia("(prefers-color-scheme: dark)").matches);
    var vars = isDark ? p.dark : p.light;
    var s = document.documentElement.style;
    for (var k in vars) s.setProperty(k, vars[k]);
    document.documentElement.setAttribute("data-theme-color", c);
  } catch(e) {}
})();
`.trim()
}

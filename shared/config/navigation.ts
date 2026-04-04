import type { SidebarModule } from "@/entities/module/model"

interface NavGroup {
  title: string
  items: { title: string; icon: string; slug: string }[]
}

const categoryMap: Record<string, string[]> = {
  General: ["dashboard", "reportes", "notificaciones"],
  "Gestión": ["usuarios", "documentos", "instituciones"],
  "Biométrico": ["personas", "sistemas-externos", "biometria-live", "eventos"],
  Sistema: ["modulos", "roles", "configuracion"],
}

const defaultNavigation: NavGroup[] = [
  {
    title: "General",
    items: [
      { title: "Dashboard", icon: "LayoutDashboard", slug: "dashboard" },
      { title: "Reportes", icon: "BarChart3", slug: "reportes" },
      { title: "Notificaciones", icon: "Bell", slug: "notificaciones" },
    ],
  },
  {
    title: "Gestión",
    items: [
      { title: "Usuarios", icon: "Users", slug: "usuarios" },
      { title: "Documentos", icon: "FileText", slug: "documentos" },
      { title: "Instituciones", icon: "Building2", slug: "instituciones" },
    ],
  },
  {
    title: "Biométrico",
    items: [
      { title: "Personas", icon: "ScanFace", slug: "personas" },
      { title: "Sistemas Externos", icon: "KeyRound", slug: "sistemas-externos" },
      { title: "Tiempo Real", icon: "Radio", slug: "biometria-live" },
      { title: "Eventos", icon: "CalendarCheck", slug: "eventos" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { title: "Módulos", icon: "Blocks", slug: "modulos" },
      { title: "Roles y Permisos", icon: "Shield", slug: "roles" },
      { title: "Configuración", icon: "Settings", slug: "configuracion" },
    ],
  },
]

export function buildNavigation(modules?: SidebarModule[]): NavGroup[] {
  if (!modules || modules.length === 0) return defaultNavigation

  const groups: NavGroup[] = Object.entries(categoryMap).map(([title, slugs]) => ({
    title,
    items: modules
      .filter((m) => slugs.includes(m.slug))
      .map((m) => ({ title: m.name, icon: m.icon, slug: m.slug })),
  }))

  return groups.filter((g) => g.items.length > 0)
}

export function getModuleHref(slug: string) {
  return slug === "dashboard" ? "/admin" : `/admin/${slug}`
}

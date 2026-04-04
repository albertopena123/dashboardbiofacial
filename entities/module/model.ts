export interface ModuleItem {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
  order: number
  status: string
}

export interface SidebarModule {
  name: string
  slug: string
  icon: string
}

export interface RoleWithPermissions {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  permissions: {
    permission: {
      id: string
      action: string
      subject: string
      description: string | null
    }
  }[]
}

export interface RoleListItem {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  _count: {
    users: number
    permissions: number
  }
}

import { db } from "@/shared/lib/db"

export interface GetRolesParams {
  search?: string
  type?: string
  page?: number
  pageSize?: number
}

export async function getRoles(params: GetRolesParams = {}) {
  const { search, type, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  if (type === "system") where.isSystem = true
  else if (type === "custom") where.isSystem = false

  const [roles, total, systemCount, customCount] = await Promise.all([
    db.role.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.role.count({ where }),
    db.role.count({ where: { isSystem: true } }),
    db.role.count({ where: { isSystem: false } }),
  ])

  return {
    roles,
    total,
    systemCount,
    customCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getRoleById(id: string) {
  return db.role.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isSystem: true,
      createdAt: true,
      permissions: {
        select: {
          permission: {
            select: {
              id: true,
              action: true,
              subject: true,
              description: true,
            },
          },
        },
      },
      _count: {
        select: { users: true },
      },
    },
  })
}

export async function getAllPermissions() {
  return db.permission.findMany({
    select: {
      id: true,
      action: true,
      subject: true,
      description: true,
    },
    orderBy: [{ subject: "asc" }, { action: "asc" }],
  })
}

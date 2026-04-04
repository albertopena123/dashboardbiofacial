import { db } from "@/shared/lib/db"
import type { Status } from "@/lib/generated/prisma/client"

export interface GetModulesParams {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function getModules(params: GetModulesParams = {}) {
  const { search, status, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status as Status
  }

  const [modules, total, activeCount, inactiveCount] = await Promise.all([
    db.module.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        description: true,
        icon: true,
        status: true,
        order: true,
        createdAt: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { order: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.module.count({ where }),
    db.module.count({ where: { status: "ACTIVE" } }),
    db.module.count({ where: { status: "INACTIVE" } }),
  ])

  // Fetch permissions for each module's subject
  const subjects = modules.map((m) => m.subject).filter(Boolean) as string[]
  const permissions = subjects.length > 0
    ? await db.permission.findMany({
        where: { subject: { in: subjects } },
        select: { action: true, subject: true },
      })
    : []

  // Group permissions by subject
  const permsBySubject = new Map<string, string[]>()
  for (const p of permissions) {
    const list = permsBySubject.get(p.subject) ?? []
    list.push(p.action)
    permsBySubject.set(p.subject, list)
  }

  const modulesWithActions = modules.map((m) => ({
    ...m,
    actions: m.subject ? (permsBySubject.get(m.subject) ?? []) : [],
  }))

  return {
    modules: modulesWithActions,
    total,
    activeCount,
    inactiveCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getModuleById(id: string) {
  return db.module.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      status: true,
      order: true,
      createdAt: true,
      _count: {
        select: { users: true },
      },
      users: {
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              paternalSurname: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        take: 10,
      },
    },
  })
}

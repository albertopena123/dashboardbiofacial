import { db } from "@/shared/lib/db"
import type { Status } from "@/lib/generated/prisma/client"

export interface GetUsersParams {
  search?: string
  status?: string
  roleId?: string
  page?: number
  pageSize?: number
}

export async function getUsers(params: GetUsersParams = {}) {
  const { search, status, roleId, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { paternalSurname: { contains: search, mode: "insensitive" } },
      { maternalSurname: { contains: search, mode: "insensitive" } },
      { documentNumber: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  if (status && (status === "ACTIVE" || status === "INACTIVE")) {
    where.status = status as Status
  }

  if (roleId) {
    where.roleId = roleId
  }

  const [users, total, activeCount, inactiveCount] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        email: true,
        firstName: true,
        paternalSurname: true,
        maternalSurname: true,
        roleId: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { status: "INACTIVE" } }),
  ])

  return {
    users,
    total,
    activeCount,
    inactiveCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      email: true,
      firstName: true,
      paternalSurname: true,
      maternalSurname: true,
      roleId: true,
      status: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      role: {
        select: { id: true, name: true, slug: true },
      },
      modules: {
        include: {
          module: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      },
    },
  })
}

export async function getRolesForSelect() {
  return db.role.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })
}

"use server"

import { db } from "@/shared/lib/db"
import { getSession } from "@/features/auth/lib/session"

export async function getDashboardData() {
  const session = await getSession()
  if (!session) return null

  const [totalUsers, activeUsers, totalModules, recentUsers] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: "ACTIVE" } }),
      db.module.count({ where: { status: "ACTIVE" } }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          paternalSurname: true,
          maternalSurname: true,
          documentNumber: true,
          createdAt: true,
          lastLoginAt: true,
          role: {
            select: { name: true, slug: true },
          },
        },
      }),
    ])

  // Get user's assigned modules
  const userModules = await db.userModule.findMany({
    where: { userId: session.userId },
    include: {
      module: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          description: true,
          order: true,
          status: true,
        },
      },
    },
    orderBy: { module: { order: "asc" } },
  })

  const modules = userModules
    .map((um) => um.module)
    .filter((m) => m.status === "ACTIVE")

  return {
    session,
    stats: {
      totalUsers,
      activeUsers,
      totalModules,
      inactiveUsers: totalUsers - activeUsers,
    },
    recentUsers,
    modules,
  }
}

import { getSession } from "./session"
import { defineAbilityFor } from "@/features/casl/ability"
import { db } from "@/shared/lib/db"
import type { Action, Subject } from "@/features/casl/permissions"

export async function getUserPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  })

  if (!user) return []

  return user.role.permissions.map((rp) => ({
    action: rp.permission.action,
    subject: rp.permission.subject,
  }))
}

// Safe cast: all callers use ActionResult which already includes `error?: string`
export function withPermission<Args extends unknown[], Return>(
  action: Action,
  subject: Subject,
  serverAction: (...args: Args) => Promise<Return>
) {
  return async (...args: Args): Promise<Return> => {
    const session = await getSession()
    if (!session) return { error: "No autenticado" } as Return

    const permissions = await getUserPermissions(session.userId)
    const ability = defineAbilityFor(permissions)

    if (!ability.can(action, subject)) {
      return { error: "No autorizado" } as Return
    }

    return serverAction(...args)
  }
}

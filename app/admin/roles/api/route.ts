import { NextRequest, NextResponse } from "next/server"
import { getRoleById } from "@/entities/role/api"
import { getSession } from "@/features/auth/lib/session"
import { getUserPermissions } from "@/features/auth/lib/guard"
import { defineAbilityFor } from "@/features/casl/ability"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const permissions = await getUserPermissions(session.userId)
  const ability = defineAbilityFor(permissions)
  if (!ability.can("read", "Role"))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const role = await getRoleById(id)
  if (!role) return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 })

  return NextResponse.json(role)
}

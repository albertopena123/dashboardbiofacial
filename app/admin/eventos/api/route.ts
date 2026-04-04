import { NextRequest, NextResponse } from "next/server"
import { getEventoById } from "@/entities/evento/api"
import { getSession } from "@/features/auth/lib/session"
import { getUserPermissions } from "@/features/auth/lib/guard"
import { defineAbilityFor } from "@/features/casl/ability"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const permissions = await getUserPermissions(session.userId)
  const ability = defineAbilityFor(permissions)
  if (!ability.can("read", "Evento"))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const idStr = request.nextUrl.searchParams.get("id")
  if (!idStr)
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  const id = Number(idStr)
  if (isNaN(id))
    return NextResponse.json({ error: "ID no valido" }, { status: 400 })

  const evento = await getEventoById(id)
  if (!evento)
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 }
    )

  return NextResponse.json(evento)
}

import { db } from "@/shared/lib/db"
import type { ResultadoAcceso } from "@/lib/generated/prisma/client"

export interface GetRegistrosAccesoParams {
  personaId?: string
  sistemaId?: string
  resultado?: string
  desde?: string
  hasta?: string
  page?: number
  pageSize?: number
}

export async function getRegistrosAcceso(
  params: GetRegistrosAccesoParams = {}
) {
  const { personaId, sistemaId, resultado, desde, hasta, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (personaId) {
    where.personaId = Number(personaId)
  }

  if (sistemaId) {
    where.sistemaId = Number(sistemaId)
  }

  if (resultado && (resultado === "autorizado" || resultado === "denegado")) {
    where.resultado = resultado as ResultadoAcceso
  }

  if (desde || hasta) {
    const creadoEn: Record<string, Date> = {}
    if (desde) creadoEn.gte = new Date(desde)
    if (hasta) creadoEn.lte = new Date(hasta)
    where.creadoEn = creadoEn
  }

  const [registros, total] = await Promise.all([
    db.registroAcceso.findMany({
      where,
      select: {
        id: true,
        dispositivo: true,
        resultado: true,
        scoreConfianza: true,
        motivo: true,
        creadoEn: true,
        persona: {
          select: { id: true, dni: true, nombres: true, apellidos: true },
        },
        sistema: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.registroAcceso.count({ where }),
  ])

  return {
    registros,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

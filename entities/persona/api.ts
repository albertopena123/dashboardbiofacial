import { db } from "@/shared/lib/db"
import type { TipoPersona } from "@/lib/generated/prisma/client"

export interface GetPersonasParams {
  search?: string
  tipo?: string
  activo?: string
  page?: number
  pageSize?: number
}

export async function getPersonas(params: GetPersonasParams = {}) {
  const { search, tipo, activo, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { dni: { contains: search } },
      { nombres: { contains: search, mode: "insensitive" } },
      { apellidos: { contains: search, mode: "insensitive" } },
    ]
  }

  if (
    tipo &&
    (tipo === "trabajador" ||
      tipo === "estudiante" ||
      tipo === "postulante" ||
      tipo === "egresado")
  ) {
    where.tipo = tipo as TipoPersona
  }

  if (activo === "true") {
    where.activo = true
  } else if (activo === "false") {
    where.activo = false
  }

  const [personas, total, activoCount, inactivoCount] = await Promise.all([
    db.persona.findMany({
      where,
      select: {
        id: true,
        dni: true,
        nombres: true,
        apellidos: true,
        tipo: true,
        fotoUrl: true,
        activo: true,
        creadoEn: true,
        biometria: {
          select: { registradoEn: true },
        },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.persona.count({ where }),
    db.persona.count({ where: { activo: true } }),
    db.persona.count({ where: { activo: false } }),
  ])

  return {
    personas,
    total,
    activoCount,
    inactivoCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getPersonaById(id: number) {
  return db.persona.findUnique({
    where: { id },
    select: {
      id: true,
      dni: true,
      nombres: true,
      apellidos: true,
      tipo: true,
      fotoUrl: true,
      activo: true,
      creadoEn: true,
      biometria: {
        select: { registradoEn: true },
      },
    },
  })
}

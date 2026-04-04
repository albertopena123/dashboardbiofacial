import { db } from "@/shared/lib/db"

export interface GetEventosParams {
  search?: string
  activo?: string
  page?: number
  pageSize?: number
}

export async function getEventos(params: GetEventosParams = {}) {
  const { search, activo, page = 1, pageSize = 10 } = params

  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: "insensitive" } },
      { descripcion: { contains: search, mode: "insensitive" } },
    ]
  }

  if (activo === "true") {
    where.activo = true
  } else if (activo === "false") {
    where.activo = false
  }

  const [eventos, total, activoCount, inactivoCount] = await Promise.all([
    db.evento.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        fechaInicio: true,
        fechaFin: true,
        activo: true,
        creadoEn: true,
        _count: {
          select: { personas: true },
        },
      },
      orderBy: { fechaInicio: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.evento.count({ where }),
    db.evento.count({ where: { activo: true } }),
    db.evento.count({ where: { activo: false } }),
  ])

  return {
    eventos,
    total,
    activoCount,
    inactivoCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getEventoById(id: number) {
  return db.evento.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      fechaInicio: true,
      fechaFin: true,
      activo: true,
      creadoEn: true,
      _count: {
        select: { personas: true },
      },
      personas: {
        select: {
          id: true,
          asistio: true,
          horaRegistro: true,
          persona: {
            select: { id: true, dni: true, nombres: true, apellidos: true },
          },
        },
        orderBy: { persona: { apellidos: "asc" } },
      },
    },
  })
}

export async function getPersonasForEventoSelect() {
  return db.persona.findMany({
    where: { activo: true },
    select: { id: true, dni: true, nombres: true, apellidos: true },
    orderBy: { apellidos: "asc" },
  })
}

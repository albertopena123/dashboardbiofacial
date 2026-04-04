import { db } from "@/shared/lib/db"

export interface GetSistemasExternosParams {
  search?: string
  activo?: string
  page?: number
  pageSize?: number
}

export async function getSistemasExternos(
  params: GetSistemasExternosParams = {}
) {
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

  const [sistemas, total, activoCount, inactivoCount] = await Promise.all([
    db.sistemaExterno.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        permisos: true,
        activo: true,
        creadoEn: true,
        ultimoAcceso: true,
        _count: {
          select: { registrosAcceso: true },
        },
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.sistemaExterno.count({ where }),
    db.sistemaExterno.count({ where: { activo: true } }),
    db.sistemaExterno.count({ where: { activo: false } }),
  ])

  return {
    sistemas,
    total,
    activoCount,
    inactivoCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getSistemaById(id: number) {
  return db.sistemaExterno.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      permisos: true,
      activo: true,
      creadoEn: true,
      ultimoAcceso: true,
      _count: {
        select: { registrosAcceso: true },
      },
    },
  })
}

"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

// --- CREATE ---
export const createEventoAction = withPermission(
  "create",
  "Evento",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const nombre = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim() || null
    const fechaInicioStr = formData.get("fechaInicio") as string
    const fechaFinStr = (formData.get("fechaFin") as string) || null

    const fieldErrors: Record<string, string> = {}

    if (!nombre) fieldErrors.nombre = "Nombre es requerido"
    else if (nombre.length < 3) fieldErrors.nombre = "Minimo 3 caracteres"
    else if (nombre.length > 300) fieldErrors.nombre = "Maximo 300 caracteres"

    if (!fechaInicioStr)
      fieldErrors.fechaInicio = "Fecha de inicio es requerida"

    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : null
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : null

    if (fechaInicio && isNaN(fechaInicio.getTime()))
      fieldErrors.fechaInicio = "Fecha de inicio no valida"

    if (fechaFin && isNaN(fechaFin.getTime()))
      fieldErrors.fechaFin = "Fecha de fin no valida"

    if (fechaInicio && fechaFin && fechaFin <= fechaInicio)
      fieldErrors.fechaFin = "Fecha de fin debe ser posterior al inicio"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    try {
      await db.evento.create({
        data: {
          nombre,
          descripcion,
          fechaInicio: fechaInicio!,
          fechaFin,
        },
      })
    } catch {
      return { error: "Error al crear el evento" }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

// --- UPDATE ---
export const updateEventoAction = withPermission(
  "update",
  "Evento",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const eventoId = Number(formData.get("eventoId"))
    const nombre = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim() || null
    const fechaInicioStr = formData.get("fechaInicio") as string
    const fechaFinStr = (formData.get("fechaFin") as string) || null

    if (!eventoId || isNaN(eventoId)) return { error: "ID de evento requerido" }

    const evento = await db.evento.findUnique({ where: { id: eventoId } })
    if (!evento) return { error: "Evento no encontrado" }

    const fieldErrors: Record<string, string> = {}

    if (!nombre) fieldErrors.nombre = "Nombre es requerido"
    else if (nombre.length < 3) fieldErrors.nombre = "Minimo 3 caracteres"
    else if (nombre.length > 300) fieldErrors.nombre = "Maximo 300 caracteres"

    if (!fechaInicioStr)
      fieldErrors.fechaInicio = "Fecha de inicio es requerida"

    const fechaInicio = fechaInicioStr ? new Date(fechaInicioStr) : null
    const fechaFin = fechaFinStr ? new Date(fechaFinStr) : null

    if (fechaInicio && isNaN(fechaInicio.getTime()))
      fieldErrors.fechaInicio = "Fecha de inicio no valida"

    if (fechaFin && isNaN(fechaFin.getTime()))
      fieldErrors.fechaFin = "Fecha de fin no valida"

    if (fechaInicio && fechaFin && fechaFin <= fechaInicio)
      fieldErrors.fechaFin = "Fecha de fin debe ser posterior al inicio"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    try {
      await db.evento.update({
        where: { id: eventoId },
        data: {
          nombre,
          descripcion,
          fechaInicio: fechaInicio!,
          fechaFin,
        },
      })
    } catch {
      return { error: "Error al actualizar el evento" }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

// --- DELETE ---
export const deleteEventoAction = withPermission(
  "delete",
  "Evento",
  async (eventoId: number): Promise<ActionResult> => {
    const evento = await db.evento.findUnique({ where: { id: eventoId } })
    if (!evento) return { error: "Evento no encontrado" }

    try {
      await db.evento.delete({ where: { id: eventoId } })
    } catch {
      return { error: "Error al eliminar el evento" }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

// --- TOGGLE STATUS ---
export const toggleEventoStatusAction = withPermission(
  "update",
  "Evento",
  async (eventoId: number): Promise<ActionResult> => {
    const evento = await db.evento.findUnique({ where: { id: eventoId } })
    if (!evento) return { error: "Evento no encontrado" }

    try {
      await db.evento.update({
        where: { id: eventoId },
        data: { activo: !evento.activo },
      })
    } catch {
      return { error: "Error al cambiar estado del evento" }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

// --- ADD PERSONAS ---
export const addPersonasToEventoAction = withPermission(
  "update",
  "Evento",
  async (eventoId: number, personaIds: number[]): Promise<ActionResult> => {
    const evento = await db.evento.findUnique({ where: { id: eventoId } })
    if (!evento) return { error: "Evento no encontrado" }

    if (!personaIds.length) return { error: "Debe seleccionar al menos una persona" }

    // Get already assigned persona IDs to avoid duplicates
    const existing = await db.eventoPersona.findMany({
      where: { eventoId },
      select: { personaId: true },
    })
    const existingSet = new Set(existing.map((ep) => ep.personaId))

    const newIds = personaIds.filter((id) => !existingSet.has(id))

    if (newIds.length > 0) {
      try {
        await db.eventoPersona.createMany({
          data: newIds.map((personaId) => ({
            eventoId,
            personaId,
          })),
        })
      } catch {
        return { error: "Error al agregar personas" }
      }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

// --- REMOVE PERSONA ---
export const removePersonaFromEventoAction = withPermission(
  "update",
  "Evento",
  async (eventoId: number, personaId: number): Promise<ActionResult> => {
    try {
      await db.eventoPersona.delete({
        where: {
          eventoId_personaId: { eventoId, personaId },
        },
      })
    } catch {
      return { error: "Error al eliminar persona del evento" }
    }

    revalidatePath("/admin/eventos")
    return { success: true }
  }
)

"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

const VALID_TIPOS = ["trabajador", "estudiante", "postulante", "egresado"] as const

function validateDni(dni: string): string | null {
  if (!/^\d{8}$/.test(dni)) return "DNI debe tener exactamente 8 dígitos"
  return null
}

// --- CREATE ---
export const createPersonaAction = withPermission(
  "create",
  "Persona",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const dni = (formData.get("dni") as string)?.trim()
    const nombres = (formData.get("nombres") as string)?.trim()
    const apellidos = (formData.get("apellidos") as string)?.trim()
    const tipo = (formData.get("tipo") as string)?.trim()

    const fieldErrors: Record<string, string> = {}

    if (!dni) fieldErrors.dni = "DNI es requerido"
    else {
      const dniError = validateDni(dni)
      if (dniError) fieldErrors.dni = dniError
    }

    if (!nombres) fieldErrors.nombres = "Nombres es requerido"
    if (!apellidos) fieldErrors.apellidos = "Apellidos es requerido"

    if (!tipo || !VALID_TIPOS.includes(tipo as (typeof VALID_TIPOS)[number]))
      fieldErrors.tipo = "Tipo de persona es requerido"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const existing = await db.persona.findUnique({ where: { dni } })
    if (existing) {
      return { fieldErrors: { dni: "Este DNI ya está registrado" } }
    }

    try {
      await db.persona.create({
        data: {
          dni,
          nombres,
          apellidos,
          tipo: tipo as (typeof VALID_TIPOS)[number],
        },
      })
    } catch {
      return { error: "Error al crear persona" }
    }

    revalidatePath("/admin/personas")
    return { success: true }
  }
)

// --- UPDATE ---
export const updatePersonaAction = withPermission(
  "update",
  "Persona",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const personaId = formData.get("personaId") as string
    const dni = (formData.get("dni") as string)?.trim()
    const nombres = (formData.get("nombres") as string)?.trim()
    const apellidos = (formData.get("apellidos") as string)?.trim()
    const tipo = (formData.get("tipo") as string)?.trim()

    if (!personaId) return { error: "ID de persona requerido" }

    const fieldErrors: Record<string, string> = {}

    if (!dni) fieldErrors.dni = "DNI es requerido"
    else {
      const dniError = validateDni(dni)
      if (dniError) fieldErrors.dni = dniError
    }

    if (!nombres) fieldErrors.nombres = "Nombres es requerido"
    if (!apellidos) fieldErrors.apellidos = "Apellidos es requerido"

    if (!tipo || !VALID_TIPOS.includes(tipo as (typeof VALID_TIPOS)[number]))
      fieldErrors.tipo = "Tipo de persona es requerido"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const existing = await db.persona.findFirst({
      where: { dni, NOT: { id: Number(personaId) } },
    })
    if (existing) {
      return { fieldErrors: { dni: "Este DNI ya está registrado" } }
    }

    try {
      await db.persona.update({
        where: { id: Number(personaId) },
        data: {
          dni,
          nombres,
          apellidos,
          tipo: tipo as (typeof VALID_TIPOS)[number],
        },
      })
    } catch {
      return { error: "Error al actualizar persona" }
    }

    revalidatePath("/admin/personas")
    return { success: true }
  }
)

// --- DELETE ---
export const deletePersonaAction = withPermission(
  "delete",
  "Persona",
  async (personaId: number): Promise<ActionResult> => {
    const persona = await db.persona.findUnique({ where: { id: personaId } })
    if (!persona) return { error: "Persona no encontrada" }

    try {
      await db.persona.delete({ where: { id: personaId } })
    } catch {
      return { error: "Error al eliminar persona" }
    }

    revalidatePath("/admin/personas")
    return { success: true }
  }
)

// --- TOGGLE STATUS ---
export const togglePersonaStatusAction = withPermission(
  "update",
  "Persona",
  async (personaId: number): Promise<ActionResult> => {
    const persona = await db.persona.findUnique({ where: { id: personaId } })
    if (!persona) return { error: "Persona no encontrada" }

    await db.persona.update({
      where: { id: personaId },
      data: { activo: !persona.activo },
    })

    revalidatePath("/admin/personas")
    return { success: true }
  }
)

// --- REGISTER FACE ---
export const registerFaceAction = withPermission(
  "update",
  "Persona",
  async (personaId: number, imageBase64: string): Promise<ActionResult> => {
    const persona = await db.persona.findUnique({ where: { id: personaId } })
    if (!persona) return { error: "Persona no encontrada" }

    try {
      const res = await fetch(`${process.env.BIOAPI_URL}/v1/faces/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.BIOAPI_KEY!,
        },
        body: JSON.stringify({
          persona_id: personaId,
          image_base64: imageBase64,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return {
          error:
            body?.detail ?? `Error del servicio biométrico (${res.status})`,
        }
      }

      revalidatePath("/admin/personas")
      return { success: true }
    } catch {
      return { error: "No se pudo conectar con el servicio biométrico" }
    }
  }
)

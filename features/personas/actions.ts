"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"

export async function revalidatePersonas() {
  revalidatePath("/admin/personas")
}

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
    } catch (e) {
      console.error("Error al crear persona:", e)
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

// --- LIVENESS CHECK ---
export const checkLivenessAction = withPermission(
  "update",
  "Persona",
  async (
    framesBase64: string[]
  ): Promise<{ error?: string; success?: boolean; blinks?: number }> => {
    if (!framesBase64 || framesBase64.length === 0) {
      return { error: "No se proporcionaron frames para verificación" }
    }

    try {
      const res = await fetch(`${process.env.BIOAPI_URL}/v1/faces/liveness`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.BIOAPI_KEY!,
        },
        body: JSON.stringify({
          frames_base64: framesBase64,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return {
          error:
            body?.detail ?? `Error del servicio biométrico (${res.status})`,
        }
      }

      const body = await res.json()
      const liveness = body.data
      if (liveness?.is_live) {
        return { success: true, blinks: liveness.blinks_detected ?? 0 }
      } else {
        return {
          error: body.message || "No se detectó parpadeo, intenta de nuevo",
          blinks: liveness?.blinks_detected ?? 0,
        }
      }
    } catch {
      return { error: "No se pudo conectar con el servicio biométrico" }
    }
  }
)

// --- REGISTER FACE ---
export const registerFaceAction = withPermission(
  "update",
  "Persona",
  async (personaId: number, imagesJoined: string): Promise<ActionResult> => {
    const persona = await db.persona.findUnique({ where: { id: personaId } })
    if (!persona) return { error: "Persona no encontrada" }

    // Images come joined by "|" separator to avoid array nesting limits
    const images = imagesJoined.split("|")

    try {
      console.log(`Registrando rostro: persona_id=${personaId}, images=${images.length}`)

      const res = await fetch(`${process.env.BIOAPI_URL}/v1/faces/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.BIOAPI_KEY!,
        },
        body: JSON.stringify({
          persona_id: personaId,
          images_base64: images,
        }),
      })

      const body = await res.json().catch(() => null)
      console.log("BioAPI response:", res.status, body?.success, body?.message)

      if (!res.ok) {
        return {
          error:
            body?.detail ?? body?.message ?? `Error del servicio biométrico (${res.status})`,
        }
      }

      if (body && body.success === false) {
        return { error: body.message ?? "Error al registrar rostro en el servicio biométrico" }
      }

      console.log("Registro biométrico exitoso:", body?.message, body?.data)
      revalidatePath("/admin/personas")
      return { success: true }
    } catch (e) {
      console.error("Error conectando con BioAPI:", e)
      return { error: "No se pudo conectar con el servicio biométrico" }
    }
  }
)

"use server"

import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
  data?: { apiKey: string }
}

const VALID_PERMISOS = ["identify", "register", "delete"] as const

// --- CREATE ---
export const createSistemaAction = withPermission(
  "create",
  "SistemaExterno",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const nombre = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim() || null
    const permisos = formData.getAll("permisos") as string[]

    const fieldErrors: Record<string, string> = {}

    if (!nombre) fieldErrors.nombre = "Nombre es requerido"
    else if (nombre.length < 3) fieldErrors.nombre = "Mínimo 3 caracteres"
    else if (nombre.length > 200) fieldErrors.nombre = "Máximo 200 caracteres"

    if (descripcion && descripcion.length > 500)
      fieldErrors.descripcion = "Máximo 500 caracteres"

    if (permisos.length === 0)
      fieldErrors.permisos = "Debe seleccionar al menos un permiso"
    else if (!permisos.every((p) => VALID_PERMISOS.includes(p as typeof VALID_PERMISOS[number])))
      fieldErrors.permisos = "Permisos no válidos"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    // Check duplicate name
    const existing = await db.sistemaExterno.findFirst({
      where: { nombre },
    })
    if (existing) {
      return { fieldErrors: { nombre: "Ya existe un sistema con este nombre" } }
    }

    // Generate a secure random API key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString("hex")}`
    const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

    try {
      await db.sistemaExterno.create({
        data: { nombre, descripcion, apiKeyHash, permisos },
      })
    } catch {
      return { error: "Error al crear el sistema externo" }
    }

    revalidatePath("/admin/sistemas-externos")
    return { success: true, data: { apiKey: rawKey } }
  }
)

// --- UPDATE ---
export const updateSistemaAction = withPermission(
  "update",
  "SistemaExterno",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const sistemaId = Number(formData.get("sistemaId"))
    const nombre = (formData.get("nombre") as string)?.trim()
    const descripcion = (formData.get("descripcion") as string)?.trim() || null
    const permisos = formData.getAll("permisos") as string[]

    if (!sistemaId) return { error: "ID de sistema requerido" }

    const sistema = await db.sistemaExterno.findUnique({ where: { id: sistemaId } })
    if (!sistema) return { error: "Sistema no encontrado" }

    const fieldErrors: Record<string, string> = {}

    if (!nombre) fieldErrors.nombre = "Nombre es requerido"
    else if (nombre.length < 3) fieldErrors.nombre = "Mínimo 3 caracteres"
    else if (nombre.length > 200) fieldErrors.nombre = "Máximo 200 caracteres"

    if (descripcion && descripcion.length > 500)
      fieldErrors.descripcion = "Máximo 500 caracteres"

    if (permisos.length === 0)
      fieldErrors.permisos = "Debe seleccionar al menos un permiso"
    else if (!permisos.every((p) => VALID_PERMISOS.includes(p as typeof VALID_PERMISOS[number])))
      fieldErrors.permisos = "Permisos no válidos"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    // Check duplicate name (exclude current)
    const existing = await db.sistemaExterno.findFirst({
      where: { nombre, NOT: { id: sistemaId } },
    })
    if (existing) {
      return { fieldErrors: { nombre: "Ya existe un sistema con este nombre" } }
    }

    try {
      await db.sistemaExterno.update({
        where: { id: sistemaId },
        data: { nombre, descripcion, permisos },
      })
    } catch {
      return { error: "Error al actualizar el sistema externo" }
    }

    revalidatePath("/admin/sistemas-externos")
    return { success: true }
  }
)

// --- DELETE ---
export const deleteSistemaAction = withPermission(
  "delete",
  "SistemaExterno",
  async (sistemaId: number): Promise<ActionResult> => {
    const sistema = await db.sistemaExterno.findUnique({ where: { id: sistemaId } })
    if (!sistema) return { error: "Sistema no encontrado" }

    try {
      await db.sistemaExterno.delete({ where: { id: sistemaId } })
    } catch {
      return { error: "Error al eliminar el sistema externo" }
    }

    revalidatePath("/admin/sistemas-externos")
    return { success: true }
  }
)

// --- TOGGLE STATUS ---
export const toggleSistemaStatusAction = withPermission(
  "update",
  "SistemaExterno",
  async (sistemaId: number): Promise<ActionResult> => {
    const sistema = await db.sistemaExterno.findUnique({ where: { id: sistemaId } })
    if (!sistema) return { error: "Sistema no encontrado" }

    try {
      await db.sistemaExterno.update({
        where: { id: sistemaId },
        data: { activo: !sistema.activo },
      })
    } catch {
      return { error: "Error al cambiar el estado del sistema" }
    }

    revalidatePath("/admin/sistemas-externos")
    return { success: true }
  }
)

// --- REGENERATE API KEY ---
export const regenerateApiKeyAction = withPermission(
  "update",
  "SistemaExterno",
  async (sistemaId: number): Promise<ActionResult> => {
    const sistema = await db.sistemaExterno.findUnique({ where: { id: sistemaId } })
    if (!sistema) return { error: "Sistema no encontrado" }

    const rawKey = `sk_live_${crypto.randomBytes(32).toString("hex")}`
    const apiKeyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

    try {
      await db.sistemaExterno.update({
        where: { id: sistemaId },
        data: { apiKeyHash },
      })
    } catch {
      return { error: "Error al regenerar la API Key" }
    }

    revalidatePath("/admin/sistemas-externos")
    return { success: true, data: { apiKey: rawKey } }
  }
)

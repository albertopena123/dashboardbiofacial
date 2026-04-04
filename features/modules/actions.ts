"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

const VALID_ACTIONS = ["create", "read", "update", "delete", "export"]

const ACTION_DESCRIPTIONS: Record<string, (moduleName: string) => string> = {
  create: (n) => `Crear ${n.toLowerCase()}`,
  read: (n) => `Ver ${n.toLowerCase()}`,
  update: (n) => `Editar ${n.toLowerCase()}`,
  delete: (n) => `Eliminar ${n.toLowerCase()}`,
  export: (n) => `Exportar ${n.toLowerCase()}`,
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function generateSubject(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("")
}

// --- CREATE MODULE ---
export const createModuleAction = withPermission(
  "update",
  "Module",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string)?.trim() || null
    const icon = (formData.get("icon") as string)?.trim() || "LayoutDashboard"
    const actions = formData.getAll("actions") as string[]

    const fieldErrors: Record<string, string> = {}

    if (!name) fieldErrors.name = "Nombre es requerido"
    else if (name.length < 3) fieldErrors.name = "Mínimo 3 caracteres"
    else if (name.length > 50) fieldErrors.name = "Máximo 50 caracteres"

    const validActions = actions.filter((a) => VALID_ACTIONS.includes(a))
    if (validActions.length === 0) {
      fieldErrors.actions = "Selecciona al menos una acción"
    }

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const slug = generateSlug(name)
    const subject = generateSubject(name)

    // Check uniqueness
    const existing = await db.module.findFirst({
      where: { OR: [{ name }, { slug }, { subject }] },
    })
    if (existing) {
      return { fieldErrors: { name: "Ya existe un módulo con ese nombre" } }
    }

    // Get the highest order value
    const lastModule = await db.module.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const nextOrder = (lastModule?.order ?? -1) + 1

    try {
      await db.$transaction(async (tx) => {
        // Create module
        await tx.module.create({
          data: { name, slug, subject, description, icon, order: nextOrder },
        })

        // Create permissions for this module
        for (const action of validActions) {
          await tx.permission.upsert({
            where: { action_subject: { action, subject } },
            update: { description: ACTION_DESCRIPTIONS[action](name) },
            create: {
              action,
              subject,
              description: ACTION_DESCRIPTIONS[action](name),
            },
          })
        }
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return { fieldErrors: { name: "Ya existe un módulo con ese nombre" } }
      }
      return { error: "Error al crear módulo" }
    }

    revalidatePath("/admin")
    return { success: true }
  }
)

// --- UPDATE MODULE ---
export const updateModuleAction = withPermission(
  "update",
  "Module",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const id = formData.get("id") as string
    if (!id) return { error: "ID requerido" }

    const module = await db.module.findUnique({ where: { id } })
    if (!module) return { error: "Módulo no encontrado" }

    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string)?.trim() || null
    const icon = (formData.get("icon") as string)?.trim() || module.icon
    const actions = formData.getAll("actions") as string[]

    const fieldErrors: Record<string, string> = {}

    if (!name) fieldErrors.name = "Nombre es requerido"
    else if (name.length < 3) fieldErrors.name = "Mínimo 3 caracteres"
    else if (name.length > 50) fieldErrors.name = "Máximo 50 caracteres"

    const validActions = actions.filter((a) => VALID_ACTIONS.includes(a))
    if (validActions.length === 0) {
      fieldErrors.actions = "Selecciona al menos una acción"
    }

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const newSlug = generateSlug(name)
    const newSubject = generateSubject(name)

    // Check uniqueness (exclude current)
    const existing = await db.module.findFirst({
      where: {
        OR: [{ name }, { slug: newSlug }, { subject: newSubject }],
        NOT: { id },
      },
    })
    if (existing) {
      return { fieldErrors: { name: "Ya existe un módulo con ese nombre" } }
    }

    const oldSubject = module.subject

    try {
      await db.$transaction(async (tx) => {
        // Update module
        await tx.module.update({
          where: { id },
          data: { name, slug: newSlug, subject: newSubject, description, icon },
        })

        // If subject changed, update existing permissions
        if (oldSubject && oldSubject !== newSubject) {
          const existingPerms = await tx.permission.findMany({
            where: { subject: oldSubject },
          })
          for (const perm of existingPerms) {
            await tx.permission.update({
              where: { id: perm.id },
              data: {
                subject: newSubject,
                description: ACTION_DESCRIPTIONS[perm.action]?.(name) ?? perm.description,
              },
            })
          }
        }

        // Sync permissions: add missing, remove extra
        const currentPerms = await tx.permission.findMany({
          where: { subject: newSubject },
          select: { id: true, action: true },
        })
        const currentActions = currentPerms.map((p) => p.action)

        // Add new actions
        for (const action of validActions) {
          if (!currentActions.includes(action)) {
            await tx.permission.create({
              data: {
                action,
                subject: newSubject,
                description: ACTION_DESCRIPTIONS[action](name),
              },
            })
          }
        }

        // Remove unchecked actions (cascade deletes role_permissions)
        for (const perm of currentPerms) {
          if (!validActions.includes(perm.action)) {
            await tx.permission.delete({ where: { id: perm.id } })
          }
        }
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return { fieldErrors: { name: "Ya existe un módulo con ese nombre" } }
      }
      return { error: "Error al actualizar módulo" }
    }

    revalidatePath("/admin")
    return { success: true }
  }
)

// --- DELETE MODULE ---
export const deleteModuleAction = withPermission(
  "update",
  "Module",
  async (id: string): Promise<ActionResult> => {
    const module = await db.module.findUnique({
      where: { id },
      select: { name: true, subject: true, _count: { select: { users: true } } },
    })
    if (!module) return { error: "Módulo no encontrado" }

    if (module._count.users > 0) {
      return {
        error: `No se puede eliminar "${module.name}" porque tiene ${module._count.users} usuario(s) asignado(s)`,
      }
    }

    await db.$transaction(async (tx) => {
      // Delete associated permissions (cascades to role_permissions)
      if (module.subject) {
        await tx.permission.deleteMany({ where: { subject: module.subject } })
      }
      await tx.module.delete({ where: { id } })
    })

    revalidatePath("/admin")
    return { success: true }
  }
)

// --- TOGGLE STATUS ---
export const toggleModuleStatusAction = withPermission(
  "update",
  "Module",
  async (id: string): Promise<ActionResult> => {
    const module = await db.module.findUnique({
      where: { id },
      select: { status: true, slug: true },
    })
    if (!module) return { error: "Módulo no encontrado" }

    const coreModules = ["dashboard", "configuracion"]
    if (coreModules.includes(module.slug) && module.status === "ACTIVE") {
      return { error: "No se puede desactivar este módulo del sistema" }
    }

    await db.module.update({
      where: { id },
      data: { status: module.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    })

    revalidatePath("/admin")
    return { success: true }
  }
)

// --- REORDER MODULES ---
export const reorderModulesAction = withPermission(
  "update",
  "Module",
  async (orderedIds: string[]): Promise<ActionResult> => {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.module.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    revalidatePath("/admin")
    return { success: true }
  }
)

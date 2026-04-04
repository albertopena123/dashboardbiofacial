"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { withPermission } from "@/features/auth/lib/guard"
import { getSession } from "@/features/auth/lib/session"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return slug || "rol"
}

// --- CREATE ---
export const createRoleAction = withPermission(
  "create",
  "Role",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string)?.trim() || null
    const permissionIds = formData.getAll("permissionIds") as string[]

    const fieldErrors: Record<string, string> = {}

    if (!name) fieldErrors.name = "Nombre es requerido"
    else if (name.length < 3) fieldErrors.name = "Mínimo 3 caracteres"
    else if (name.length > 50) fieldErrors.name = "Máximo 50 caracteres"

    if (description && description.length > 200)
      fieldErrors.description = "Máximo 200 caracteres"

    if (permissionIds.length === 0)
      fieldErrors.permissions = "Debe seleccionar al menos un permiso"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const slug = generateSlug(name)

    // Validate permission IDs exist
    const validCount = await db.permission.count({
      where: { id: { in: permissionIds } },
    })
    if (validCount !== permissionIds.length) {
      return { fieldErrors: { permissions: "Algunos permisos seleccionados no son válidos" } }
    }

    // Don't allow creating roles with manage:all unless superadmin
    const session = await getSession()
    const manageAllPerm = await db.permission.findFirst({
      where: { action: "manage", subject: "all" },
    })
    if (manageAllPerm && permissionIds.includes(manageAllPerm.id) && session?.roleSlug !== "superadmin") {
      return { fieldErrors: { permissions: "No puedes asignar acceso total" } }
    }

    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.role.findFirst({
          where: { OR: [{ name }, { slug }] },
        })
        if (existing) {
          throw new Error("DUPLICATE")
        }

        await tx.role.create({
          data: {
            name,
            slug,
            description,
            isSystem: false,
            permissions: {
              create: permissionIds.map((id) => ({ permissionId: id })),
            },
          },
        })
      })
    } catch (e) {
      if (e instanceof Error && e.message === "DUPLICATE") {
        return { fieldErrors: { name: "Ya existe un rol con este nombre" } }
      }
      return { error: "Error al crear el rol" }
    }

    revalidatePath("/admin/roles")
    return { success: true }
  }
)

// --- UPDATE ---
export const updateRoleAction = withPermission(
  "update",
  "Role",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const roleId = formData.get("roleId") as string
    const name = (formData.get("name") as string)?.trim()
    const description = (formData.get("description") as string)?.trim() || null
    const permissionIds = formData.getAll("permissionIds") as string[]

    if (!roleId) return { error: "ID de rol requerido" }

    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) return { error: "Rol no encontrado" }

    // Prevent editing system roles by non-superadmins
    const session = await getSession()
    if (role.isSystem && session?.roleSlug !== "superadmin")
      return { error: "No puedes editar un rol del sistema" }

    const fieldErrors: Record<string, string> = {}

    if (!name) fieldErrors.name = "Nombre es requerido"
    else if (name.length < 3) fieldErrors.name = "Mínimo 3 caracteres"
    else if (name.length > 50) fieldErrors.name = "Máximo 50 caracteres"

    if (description && description.length > 200)
      fieldErrors.description = "Máximo 200 caracteres"

    if (permissionIds.length === 0)
      fieldErrors.permissions = "Debe seleccionar al menos un permiso"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    // System roles keep their original slug; custom roles regenerate it
    const slug = role.isSystem ? role.slug : generateSlug(name)

    // Validate permission IDs exist
    const validCount = await db.permission.count({
      where: { id: { in: permissionIds } },
    })
    if (validCount !== permissionIds.length) {
      return { fieldErrors: { permissions: "Algunos permisos seleccionados no son válidos" } }
    }

    // Don't allow assigning manage:all unless superadmin
    const manageAllPerm = await db.permission.findFirst({
      where: { action: "manage", subject: "all" },
    })
    if (manageAllPerm && permissionIds.includes(manageAllPerm.id) && session?.roleSlug !== "superadmin") {
      return { fieldErrors: { permissions: "No puedes asignar acceso total" } }
    }

    try {
      await db.$transaction(async (tx) => {
        const existing = await tx.role.findFirst({
          where: { OR: [{ name }, { slug }], NOT: { id: roleId } },
        })
        if (existing) {
          throw new Error("DUPLICATE")
        }

        await tx.rolePermission.deleteMany({ where: { roleId } })
        await tx.role.update({
          where: { id: roleId },
          data: {
            name,
            slug,
            description,
            permissions: {
              create: permissionIds.map((id) => ({ permissionId: id })),
            },
          },
        })
      })
    } catch (e) {
      if (e instanceof Error && e.message === "DUPLICATE") {
        return { fieldErrors: { name: "Ya existe un rol con este nombre" } }
      }
      return { error: "Error al actualizar el rol" }
    }

    revalidatePath("/admin/roles")
    return { success: true }
  }
)

// --- DELETE ---
export const deleteRoleAction = withPermission(
  "delete",
  "Role",
  async (roleId: string): Promise<ActionResult> => {
    const role = await db.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    })
    if (!role) return { error: "Rol no encontrado" }

    if (role.isSystem)
      return { error: "No se puede eliminar un rol del sistema" }

    if (role._count.users > 0)
      return { error: "No se puede eliminar: tiene usuarios asignados" }

    // Prevent deleting by non-superadmin if role has manage:all
    const session = await getSession()
    if (session?.roleSlug !== "superadmin") {
      const hasManageAll = await db.rolePermission.findFirst({
        where: {
          roleId,
          permission: { action: "manage", subject: "all" },
        },
      })
      if (hasManageAll) return { error: "No tienes permiso para eliminar este rol" }
    }

    await db.role.delete({ where: { id: roleId } })

    revalidatePath("/admin/roles")
    return { success: true }
  }
)

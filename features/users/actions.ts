"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { hashPassword } from "@/features/auth/lib/password"
import { withPermission } from "@/features/auth/lib/guard"
import { getSession } from "@/features/auth/lib/session"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type DocumentType = "DNI" | "CE" | "PASAPORTE"

const VALID_DOC_TYPES: DocumentType[] = ["DNI", "CE", "PASAPORTE"]

function validateDocumentNumber(doc: string, type: DocumentType): string | null {
  switch (type) {
    case "DNI":
      if (!/^\d{8}$/.test(doc)) return "DNI debe tener exactamente 8 dígitos"
      return null
    case "CE":
      if (!/^[A-Za-z0-9]{6,12}$/.test(doc)) return "CE debe tener entre 6 y 12 caracteres alfanuméricos"
      return null
    case "PASAPORTE":
      if (!/^[A-Za-z0-9]{5,20}$/.test(doc)) return "Pasaporte debe tener entre 5 y 20 caracteres alfanuméricos"
      return null
    default:
      return "Tipo de documento no válido"
  }
}

function isUniqueConstraintError(error: unknown): { field: "documentNumber" | "email" } | null {
  if (
    error instanceof Error &&
    error.message.includes("Unique constraint")
  ) {
    if (error.message.includes("document_number")) return { field: "documentNumber" }
    if (error.message.includes("email")) return { field: "email" }
  }
  return null
}

// --- CREATE ---
export const createUserAction = withPermission(
  "create",
  "User",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const documentType = (formData.get("documentType") as string)?.trim() as DocumentType
    const documentNumber = (formData.get("documentNumber") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    const password = formData.get("password") as string
    const firstName = (formData.get("firstName") as string)?.trim()
    const paternalSurname = (formData.get("paternalSurname") as string)?.trim()
    const maternalSurname = (formData.get("maternalSurname") as string)?.trim()
    const roleId = formData.get("roleId") as string

    const fieldErrors: Record<string, string> = {}

    if (!documentType || !VALID_DOC_TYPES.includes(documentType))
      fieldErrors.documentType = "Tipo de documento es requerido"

    if (!documentNumber) fieldErrors.documentNumber = "N° de documento es requerido"
    else if (documentType && VALID_DOC_TYPES.includes(documentType)) {
      const docError = validateDocumentNumber(documentNumber, documentType)
      if (docError) fieldErrors.documentNumber = docError
    }

    if (!email) fieldErrors.email = "Email es requerido"
    else if (!validateEmail(email))
      fieldErrors.email = "Email no tiene formato válido"

    if (!password) fieldErrors.password = "Contraseña es requerida"
    else if (password.length < 6)
      fieldErrors.password = "Contraseña debe tener al menos 6 caracteres"

    if (!firstName) fieldErrors.firstName = "Nombres es requerido"
    if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
    if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
    if (!roleId) fieldErrors.roleId = "Rol es requerido"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const existing = await db.user.findFirst({
      where: { OR: [{ documentNumber }, { email }] },
    })

    if (existing) {
      if (existing.documentNumber === documentNumber)
        return { fieldErrors: { documentNumber: "Este documento ya está registrado" } }
      return { fieldErrors: { email: "Este email ya está registrado" } }
    }

    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) return { fieldErrors: { roleId: "Rol no válido" } }

    // Prevent non-superadmin from assigning superadmin role
    const session = await getSession()
    if (role.slug === "superadmin" && session?.roleSlug !== "superadmin")
      return { fieldErrors: { roleId: "No tienes permiso para asignar este rol" } }

    const hashedPassword = await hashPassword(password)

    try {
      await db.user.create({
        data: { documentType, documentNumber, email, password: hashedPassword, firstName, paternalSurname, maternalSurname, roleId },
      })
    } catch (error) {
      const uniqueErr = isUniqueConstraintError(error)
      if (uniqueErr) {
        const msg = uniqueErr.field === "documentNumber"
          ? "Este documento ya está registrado"
          : "Este email ya está registrado"
        return { fieldErrors: { [uniqueErr.field]: msg } }
      }
      return { error: "Error al crear usuario" }
    }

    revalidatePath("/admin/usuarios")
    return { success: true }
  }
)

// --- UPDATE (sin contraseña) ---
export const updateUserAction = withPermission(
  "update",
  "User",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const userId = formData.get("userId") as string
    const documentType = (formData.get("documentType") as string)?.trim() as DocumentType
    const documentNumber = (formData.get("documentNumber") as string)?.trim()
    const email = (formData.get("email") as string)?.trim()
    const firstName = (formData.get("firstName") as string)?.trim()
    const paternalSurname = (formData.get("paternalSurname") as string)?.trim()
    const maternalSurname = (formData.get("maternalSurname") as string)?.trim()
    const roleId = formData.get("roleId") as string

    if (!userId) return { error: "ID de usuario requerido" }

    const fieldErrors: Record<string, string> = {}

    if (!documentType || !VALID_DOC_TYPES.includes(documentType))
      fieldErrors.documentType = "Tipo de documento es requerido"

    if (!documentNumber) fieldErrors.documentNumber = "N° de documento es requerido"
    else if (documentType && VALID_DOC_TYPES.includes(documentType)) {
      const docError = validateDocumentNumber(documentNumber, documentType)
      if (docError) fieldErrors.documentNumber = docError
    }

    if (!email) fieldErrors.email = "Email es requerido"
    else if (!validateEmail(email))
      fieldErrors.email = "Email no tiene formato válido"

    if (!firstName) fieldErrors.firstName = "Nombres es requerido"
    if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
    if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
    if (!roleId) fieldErrors.roleId = "Rol es requerido"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const existing = await db.user.findFirst({
      where: { OR: [{ documentNumber }, { email }], NOT: { id: userId } },
    })

    if (existing) {
      if (existing.documentNumber === documentNumber)
        return { fieldErrors: { documentNumber: "Este documento ya está registrado" } }
      return { fieldErrors: { email: "Este email ya está registrado" } }
    }

    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) return { fieldErrors: { roleId: "Rol no válido" } }

    const session = await getSession()

    // Prevent non-superadmin from assigning superadmin role
    if (role.slug === "superadmin" && session?.roleSlug !== "superadmin")
      return { fieldErrors: { roleId: "No tienes permiso para asignar este rol" } }

    // Prevent demoting a superadmin if you're not superadmin
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      include: { role: { select: { slug: true } } },
    })
    if (targetUser?.role.slug === "superadmin" && session?.roleSlug !== "superadmin")
      return { fieldErrors: { roleId: "No tienes permiso para cambiar el rol de un Super Administrador" } }

    try {
      await db.user.update({
        where: { id: userId },
        data: { documentType, documentNumber, email, firstName, paternalSurname, maternalSurname, roleId },
      })
    } catch (error) {
      const uniqueErr = isUniqueConstraintError(error)
      if (uniqueErr) {
        const msg = uniqueErr.field === "documentNumber"
          ? "Este documento ya está registrado"
          : "Este email ya está registrado"
        return { fieldErrors: { [uniqueErr.field]: msg } }
      }
      return { error: "Error al actualizar usuario" }
    }

    revalidatePath("/admin/usuarios")
    return { success: true }
  }
)

// --- RESET PASSWORD ---
export const resetPasswordAction = withPermission(
  "update",
  "User",
  async (
    _prevState: ActionResult | null,
    formData: FormData
  ): Promise<ActionResult> => {
    const userId = formData.get("userId") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!userId) return { error: "ID de usuario requerido" }

    const fieldErrors: Record<string, string> = {}

    if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
    else if (newPassword.length < 6)
      fieldErrors.newPassword = "Mínimo 6 caracteres"

    if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
    else if (newPassword !== confirmPassword)
      fieldErrors.confirmPassword = "Las contraseñas no coinciden"

    if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return { error: "Usuario no encontrado" }

    const hashed = await hashPassword(newPassword)
    await db.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    revalidatePath("/admin/usuarios")
    return { success: true }
  }
)

// --- DELETE ---
export const deleteUserAction = withPermission(
  "delete",
  "User",
  async (userId: string): Promise<ActionResult> => {
    const session = await getSession()
    if (!session) return { error: "No autenticado" }

    if (session.userId === userId)
      return { error: "No puedes eliminar tu propia cuenta" }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: { select: { slug: true } } },
    })
    if (!user) return { error: "Usuario no encontrado" }

    if (user.role.slug === "superadmin")
      return { error: "No se puede eliminar un Super Administrador" }

    await db.user.delete({ where: { id: userId } })

    revalidatePath("/admin/usuarios")
    return { success: true }
  }
)

// --- TOGGLE STATUS ---
export const toggleUserStatusAction = withPermission(
  "update",
  "User",
  async (userId: string): Promise<ActionResult> => {
    const session = await getSession()
    if (!session) return { error: "No autenticado" }

    if (session.userId === userId)
      return { error: "No puedes desactivar tu propia cuenta" }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: { select: { slug: true } } },
    })
    if (!user) return { error: "Usuario no encontrado" }

    // Prevent deactivating superadmin
    if (user.role.slug === "superadmin" && session.roleSlug !== "superadmin")
      return { error: "No puedes cambiar el estado de un Super Administrador" }

    await db.user.update({
      where: { id: userId },
      data: { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
    })

    revalidatePath("/admin/usuarios")
    return { success: true }
  }
)

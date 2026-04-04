"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/shared/lib/db"
import { getSession, createSession } from "@/features/auth/lib/session"
import { hashPassword, verifyPassword } from "@/features/auth/lib/password"
import { writeFile, mkdir, unlink } from "node:fs/promises"
import { join, extname } from "node:path"
import { existsSync } from "node:fs"

interface ActionResult {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// --- UPDATE PROFILE ---
export async function updateProfileAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "No autenticado" }

  const firstName = (formData.get("firstName") as string)?.trim()
  const paternalSurname = (formData.get("paternalSurname") as string)?.trim()
  const maternalSurname = (formData.get("maternalSurname") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()

  const fieldErrors: Record<string, string> = {}

  if (!firstName) fieldErrors.firstName = "Nombres es requerido"
  if (!paternalSurname) fieldErrors.paternalSurname = "Apellido paterno es requerido"
  if (!maternalSurname) fieldErrors.maternalSurname = "Apellido materno es requerido"
  if (!email) fieldErrors.email = "Email es requerido"
  else if (!validateEmail(email)) fieldErrors.email = "Email no tiene formato válido"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  // Check email uniqueness
  const existing = await db.user.findFirst({
    where: { email, NOT: { id: session.userId } },
  })
  if (existing) return { fieldErrors: { email: "Este email ya está registrado" } }

  try {
    await db.user.update({
      where: { id: session.userId },
      data: { firstName, paternalSurname, maternalSurname, email },
    })
  } catch (error: unknown) {
    // Race condition: email taken between findFirst and update
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { fieldErrors: { email: "Este email ya está registrado" } }
    }
    return { error: "Error al actualizar perfil" }
  }

  // Refresh session with new data
  await createSession({
    ...session,
    firstName,
    paternalSurname,
    maternalSurname,
  })

  revalidatePath("/admin")
  return { success: true }
}

// --- UPLOAD AVATAR ---
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function uploadAvatarAction(
  formData: FormData
): Promise<ActionResult & { avatarUrl?: string }> {
  const session = await getSession()
  if (!session) return { error: "No autenticado" }

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) return { error: "No se seleccionó archivo" }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Formato no soportado. Usa JPG, PNG, WebP o GIF" }
  }

  if (file.size > MAX_SIZE) {
    return { error: "La imagen no debe superar 2MB" }
  }

  const ext = extname(file.name).toLowerCase() || ".jpg"
  const fileName = `${session.userId}-${Date.now()}${ext}`
  const uploadDir = join(process.cwd(), "uploads", "avatars")

  // Ensure directory exists
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Delete old avatar if exists
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  })
  if (user?.avatarUrl) {
    const oldFileName = user.avatarUrl.split("/").pop()
    if (oldFileName) {
      const oldPath = join(uploadDir, oldFileName)
      if (existsSync(oldPath)) {
        await unlink(oldPath).catch(() => {})
      }
    }
  }

  // Write new file
  const bytes = await file.arrayBuffer()
  const filePath = join(uploadDir, fileName)
  await writeFile(filePath, Buffer.from(bytes))

  const avatarUrl = `/api/uploads/avatars/${fileName}`
  await db.user.update({
    where: { id: session.userId },
    data: { avatarUrl },
  })

  revalidatePath("/admin")
  return { success: true, avatarUrl }
}

// --- DELETE AVATAR ---
export async function deleteAvatarAction(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "No autenticado" }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  })

  if (user?.avatarUrl) {
    const fileName = user.avatarUrl.split("/").pop()
    if (fileName) {
      const filePath = join(process.cwd(), "uploads", "avatars", fileName)
      if (existsSync(filePath)) {
        await unlink(filePath).catch(() => {})
      }
    }
  }

  await db.user.update({
    where: { id: session.userId },
    data: { avatarUrl: null },
  })

  revalidatePath("/admin")
  return { success: true }
}

// --- UPDATE THEME COLOR ---
export async function updateThemeColorAction(colorName: string): Promise<{ error?: string }> {
  const session = await getSession()
  if (!session) return { error: "No autenticado" }

  const validColors = ["neutral", "blue", "violet", "green", "orange", "rose", "teal"]
  if (!validColors.includes(colorName)) return { error: "Color no válido" }

  await db.user.update({
    where: { id: session.userId },
    data: { themeColor: colorName },
  })

  return {}
}

// --- CHANGE PASSWORD ---
export async function changePasswordAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { error: "No autenticado" }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  const fieldErrors: Record<string, string> = {}

  if (!currentPassword) fieldErrors.currentPassword = "Contraseña actual es requerida"
  if (!newPassword) fieldErrors.newPassword = "Nueva contraseña es requerida"
  else if (newPassword.length < 6) fieldErrors.newPassword = "Mínimo 6 caracteres"
  if (!confirmPassword) fieldErrors.confirmPassword = "Confirmar contraseña"
  else if (newPassword !== confirmPassword)
    fieldErrors.confirmPassword = "Las contraseñas no coinciden"

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user) return { error: "Usuario no encontrado" }

  const validPassword = await verifyPassword(currentPassword, user.password)
  if (!validPassword) return { fieldErrors: { currentPassword: "Contraseña actual incorrecta" } }

  const hashed = await hashPassword(newPassword)
  await db.user.update({
    where: { id: session.userId },
    data: { password: hashed },
  })

  return { success: true }
}

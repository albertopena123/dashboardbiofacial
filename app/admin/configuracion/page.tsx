import { getSessionDetails } from "@/features/auth/lib/session"
import { db } from "@/shared/lib/db"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/features/settings/ui/profile-form"
import { ChangePasswordForm } from "@/features/settings/ui/change-password-form"
import { AccountInfo } from "@/features/settings/ui/account-info"
import { SessionInfo } from "@/features/settings/ui/session-info"
import { ThemeColorPicker } from "@/features/settings/ui/theme-color-picker"
import { AvatarUpload } from "@/features/settings/ui/avatar-upload"

export default async function ConfiguracionPage() {
  const session = await getSessionDetails()
  if (!session) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      documentType: true,
      documentNumber: true,
      email: true,
      firstName: true,
      paternalSurname: true,
      maternalSurname: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      role: { select: { name: true, slug: true } },
      modules: {
        include: {
          module: { select: { name: true, icon: true } },
        },
        orderBy: { module: { order: "asc" } },
      },
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu perfil y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AvatarUpload
            avatarUrl={user.avatarUrl}
            initials={`${user.firstName.charAt(0)}${user.paternalSurname.charAt(0)}`}
          />
          <ProfileForm
            profile={{
              firstName: user.firstName,
              paternalSurname: user.paternalSurname,
              maternalSurname: user.maternalSurname,
              email: user.email,
              documentType: user.documentType,
              documentNumber: user.documentNumber,
            }}
          />
          <ChangePasswordForm />
          <ThemeColorPicker />
        </div>
        <div className="space-y-6">
          <AccountInfo user={user} />
          <SessionInfo
            session={{
              issuedAt: session.issuedAt.toISOString(),
              expiresAt: session.expiresAt.toISOString(),
              roleSlug: session.roleSlug,
              firstName: session.firstName,
              paternalSurname: session.paternalSurname,
            }}
          />
        </div>
      </div>
    </div>
  )
}

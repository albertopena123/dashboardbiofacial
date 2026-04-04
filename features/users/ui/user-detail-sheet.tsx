"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  CreditCard,
  ShieldCheck,
  Calendar,
  Clock,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"

type DocumentType = "DNI" | "CE" | "PASAPORTE"

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: "DNI",
  CE: "Carné de Extranjería",
  PASAPORTE: "Pasaporte",
}

interface UserRow {
  id: string
  documentType: DocumentType
  documentNumber: string
  email: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
  roleId: string
  status: string
  avatarUrl: string | null
  lastLoginAt: Date | null
  createdAt: Date
  role: {
    id: string
    name: string
    slug: string
  }
}

interface UserDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserRow | null
  onEdit: () => void
  onResetPassword: () => void
  onToggleStatus: () => void
}

function formatFullDate(date: Date | string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function roleVariant(slug: string) {
  if (slug === "superadmin") return "default" as const
  if (slug === "admin") return "secondary" as const
  return "outline" as const
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}

export function UserDetailSheet({
  open,
  onOpenChange,
  user,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: UserDetailSheetProps) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "User")

  if (!user) return null

  const initials = `${user.firstName?.charAt(0) ?? ""}${user.paternalSurname?.charAt(0) ?? ""}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Detalle de usuario</SheetTitle>
          <SheetDescription className="sr-only">
            Información completa del usuario
          </SheetDescription>
        </SheetHeader>

        {/* Profile header */}
        <div className="flex flex-col items-center gap-3 px-4 pb-2">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary sm:text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {user.firstName} {user.paternalSurname} {user.maternalSurname}
            </h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={roleVariant(user.role.slug)} className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {user.role.name}
            </Badge>
            <Badge
              variant="outline"
              className={
                user.status === "ACTIVE"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  user.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>

        <Separator className="my-2" />

        {/* User info */}
        <div className="space-y-1 px-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Información
          </h4>

          <InfoRow
            icon={CreditCard}
            label={`N° Documento (${DOC_TYPE_LABELS[user.documentType] ?? user.documentType})`}
            value={
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {user.documentNumber}
              </code>
            }
          />

          <InfoRow icon={Mail} label="Correo electrónico" value={user.email} />

          <InfoRow
            icon={ShieldCheck}
            label="Rol asignado"
            value={user.role.name}
          />

          <InfoRow
            icon={Calendar}
            label="Fecha de registro"
            value={formatFullDate(user.createdAt)}
          />

          <InfoRow
            icon={Clock}
            label="Último acceso"
            value={
              user.lastLoginAt ? (
                formatFullDate(user.lastLoginAt)
              ) : (
                <span className="text-muted-foreground">Nunca ha ingresado</span>
              )
            }
          />
        </div>

        {/* Actions */}
        {canUpdate && (
          <>
            <Separator className="my-2" />
            <SheetFooter className="flex-col gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Acciones
              </h4>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  onEdit()
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar información
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onOpenChange(false)
                  onResetPassword()
                }}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Resetear contraseña
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  onToggleStatus()
                }}
              >
                {user.status === "ACTIVE" ? (
                  <>
                    <UserX className="mr-2 h-4 w-4 text-amber-600" />
                    <span>Desactivar usuario</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Activar usuario</span>
                  </>
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

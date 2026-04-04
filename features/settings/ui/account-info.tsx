"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ShieldCheck,
  Calendar,
  Clock,
  Blocks,
} from "lucide-react"

interface AccountInfoProps {
  user: {
    firstName: string
    paternalSurname: string
    maternalSurname: string
    email: string
    avatarUrl: string | null
    createdAt: Date
    lastLoginAt: Date | null
    role: { name: string; slug: string }
    modules: { module: { name: string; icon: string } }[]
  }
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

export function AccountInfo({ user }: AccountInfoProps) {
  const initials = `${user.firstName.charAt(0)}${user.paternalSurname.charAt(0)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi cuenta</CardTitle>
        <CardDescription>
          Información de tu cuenta y sesión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt="Avatar" />
            )}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">
              {user.firstName} {user.paternalSurname} {user.maternalSurname}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Separator />

        {/* Role */}
        <InfoRow
          icon={ShieldCheck}
          label="Rol asignado"
          value={
            <Badge variant={roleVariant(user.role.slug)} className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              {user.role.name}
            </Badge>
          }
        />

        {/* Modules */}
        <InfoRow
          icon={Blocks}
          label="Módulos asignados"
          value={
            user.modules.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {user.modules.map((um) => (
                  <Badge key={um.module.name} variant="secondary" className="text-xs">
                    {um.module.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">Sin módulos asignados</span>
            )
          }
        />

        {/* Dates */}
        <InfoRow
          icon={Calendar}
          label="Cuenta creada"
          value={formatFullDate(user.createdAt)}
        />

        <InfoRow
          icon={Clock}
          label="Último acceso"
          value={
            user.lastLoginAt ? (
              formatFullDate(user.lastLoginAt)
            ) : (
              <span className="text-muted-foreground">Primer acceso</span>
            )
          }
        />
      </CardContent>
    </Card>
  )
}

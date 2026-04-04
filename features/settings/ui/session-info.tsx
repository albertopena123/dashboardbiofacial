"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Monitor,
  Clock,
  Timer,
  LogIn,
  LogOut,
  ShieldCheck,
} from "lucide-react"

interface SessionInfoProps {
  session: {
    issuedAt: string
    expiresAt: string
    roleSlug: string
    firstName: string
    paternalSurname: string
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { text: "Sesión expirada", expired: true }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m ${seconds}s`, expired: false }
  }
  if (minutes > 0) {
    return { text: `${minutes}m ${seconds}s`, expired: false }
  }
  return { text: `${seconds}s`, expired: false }
}

function getSessionProgress(issuedAt: string, expiresAt: string) {
  const start = new Date(issuedAt).getTime()
  const end = new Date(expiresAt).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
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

export function SessionInfo({ session }: SessionInfoProps) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(session.expiresAt))
  const [progress, setProgress] = useState(() => getSessionProgress(session.issuedAt, session.expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(session.expiresAt))
      setProgress(getSessionProgress(session.issuedAt, session.expiresAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [session.expiresAt, session.issuedAt])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesión activa</CardTitle>
        <CardDescription>
          Información de tu sesión actual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Monitor className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {session.firstName} {session.paternalSurname}
              </p>
              <Badge
                variant={remaining.expired ? "destructive" : "default"}
                className="text-[10px] px-1.5 py-0"
              >
                {remaining.expired ? "Expirada" : "Activa"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sesión web actual</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiempo restante</span>
            <span className={`font-mono font-medium ${remaining.expired ? "text-destructive" : progress > 75 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {remaining.text}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                remaining.expired
                  ? "bg-destructive"
                  : progress > 75
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${100 - progress}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Details */}
        <InfoRow
          icon={LogIn}
          label="Inicio de sesión"
          value={formatDateTime(session.issuedAt)}
        />

        <InfoRow
          icon={LogOut}
          label="Expira"
          value={formatDateTime(session.expiresAt)}
        />

        <InfoRow
          icon={Timer}
          label="Duración de sesión"
          value="8 horas"
        />

        <InfoRow
          icon={ShieldCheck}
          label="Tipo de autenticación"
          value="JWT (JSON Web Token)"
        />

        <InfoRow
          icon={Clock}
          label="Zona horaria"
          value={Intl.DateTimeFormat().resolvedOptions().timeZone}
        />
      </CardContent>
    </Card>
  )
}

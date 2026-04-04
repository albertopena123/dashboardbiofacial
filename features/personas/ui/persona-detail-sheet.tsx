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
  CreditCard,
  Calendar,
  ScanFace,
  Pencil,
  UserX,
  UserCheck,
  Briefcase,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import type { PersonaRow } from "@/entities/persona/model"
import { TIPO_PERSONA_LABELS } from "@/entities/persona/model"

interface PersonaDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: PersonaRow | null
  onEdit: () => void
  onToggleStatus: () => void
}

function formatFullDate(date: Date | string | null) {
  if (!date) return "--"
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function tipoVariant(tipo: string) {
  if (tipo === "trabajador") return "default" as const
  if (tipo === "estudiante") return "secondary" as const
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

export function PersonaDetailSheet({
  open,
  onOpenChange,
  persona,
  onEdit,
  onToggleStatus,
}: PersonaDetailSheetProps) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Persona")

  if (!persona) return null

  const initials = `${persona.nombres?.charAt(0) ?? ""}${persona.apellidos?.charAt(0) ?? ""}`
  const hasRostro = !!persona.biometria

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Detalle de persona</SheetTitle>
          <SheetDescription className="sr-only">
            Información completa de la persona
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
              {persona.nombres} {persona.apellidos}
            </h3>
            <p className="text-sm text-muted-foreground">DNI: {persona.dni}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tipoVariant(persona.tipo)} className="gap-1">
              <Briefcase className="h-3 w-3" />
              {TIPO_PERSONA_LABELS[persona.tipo]}
            </Badge>
            <Badge
              variant="outline"
              className={
                persona.activo
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  persona.activo ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {persona.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Persona info */}
        <div className="space-y-1 px-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Información
          </h4>

          <InfoRow
            icon={CreditCard}
            label="DNI"
            value={
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                {persona.dni}
              </code>
            }
          />

          <InfoRow
            icon={Briefcase}
            label="Tipo de persona"
            value={TIPO_PERSONA_LABELS[persona.tipo]}
          />

          <InfoRow
            icon={ScanFace}
            label="Rostro biométrico"
            value={
              hasRostro ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Registrado ({formatFullDate(persona.biometria!.registradoEn)})
                </span>
              ) : (
                <span className="text-muted-foreground">No registrado</span>
              )
            }
          />

          <InfoRow
            icon={Calendar}
            label="Fecha de registro"
            value={formatFullDate(persona.creadoEn)}
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
                  onToggleStatus()
                }}
              >
                {persona.activo ? (
                  <>
                    <UserX className="mr-2 h-4 w-4 text-amber-600" />
                    <span>Desactivar persona</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Activar persona</span>
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

"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CalendarCheck,
  Calendar,
  Users,
  Pencil,
  Check,
  X,
  UserPlus,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"

interface EventoPersonaItem {
  id: number
  asistio: boolean
  horaRegistro: Date | string | null
  persona: {
    id: number
    dni: string
    nombres: string
    apellidos: string
  }
}

interface EventoDetailData {
  id: number
  nombre: string
  descripcion: string | null
  fechaInicio: Date | string
  fechaFin: Date | string | null
  activo: boolean
  creadoEn: Date | string
  _count: { personas: number }
  personas: EventoPersonaItem[]
}

interface EventoDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento: EventoDetailData | null
  onEdit: () => void
  onManagePersonas: () => void
}

function formatFullDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EventoDetailSheet({
  open,
  onOpenChange,
  evento,
  onEdit,
  onManagePersonas,
}: EventoDetailSheetProps) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Evento")

  if (!evento) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Detalle del evento</SheetTitle>
          <SheetDescription className="sr-only">
            Informacion completa del evento y personas asignadas
          </SheetDescription>
        </SheetHeader>

        {/* Profile header */}
        <div className="flex flex-col items-center gap-3 px-4 pb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 sm:h-20 sm:w-20">
            <CalendarCheck className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{evento.nombre}</h3>
            {evento.descripcion && (
              <p className="text-sm text-muted-foreground">
                {evento.descripcion}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={evento.activo ? "default" : "secondary"}>
              {evento.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {evento._count.personas} persona
              {evento._count.personas !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Info */}
        <div className="space-y-2 px-4">
          <div className="flex items-start gap-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha de inicio</p>
              <p className="mt-0.5 text-sm font-medium">
                {formatFullDate(evento.fechaInicio)}
              </p>
            </div>
          </div>

          {evento.fechaFin && (
            <div className="flex items-start gap-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de fin</p>
                <p className="mt-0.5 text-sm font-medium">
                  {formatFullDate(evento.fechaFin)}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Personas */}
        <div className="space-y-3 px-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Personas asignadas ({evento.personas.length})
            </h4>
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={onManagePersonas}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Gestionar
              </Button>
            )}
          </div>

          {evento.personas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No hay personas asignadas
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {evento.personas.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ep.persona.apellidos}, {ep.persona.nombres}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DNI: {ep.persona.dni}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {ep.asistio ? (
                      <Badge
                        variant="default"
                        className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                        Asistio
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <X className="h-3 w-3" />
                        Sin registro
                      </Badge>
                    )}
                    {ep.horaRegistro && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(ep.horaRegistro)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {canUpdate && (
          <>
            <Separator className="my-2" />
            <SheetFooter className="flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onEdit}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar evento
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

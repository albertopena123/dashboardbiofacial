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
  Server,
  Calendar,
  Pencil,
  Clock,
  Activity,
  Shield,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import type { SistemaExternoRow } from "@/entities/sistema-externo/model"

interface SistemaDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sistema: SistemaExternoRow | null
  onEdit: () => void
}

const PERMISO_COLORS: Record<string, string> = {
  identify: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  register: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  delete: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const PERMISO_LABELS: Record<string, string> = {
  identify: "Identificar",
  register: "Registrar",
  delete: "Eliminar",
}

function formatFullDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "Nunca"
  return new Date(date).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function SistemaDetailSheet({
  open,
  onOpenChange,
  sistema,
  onEdit,
}: SistemaDetailSheetProps) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "SistemaExterno")

  if (!sistema) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Detalle del sistema</SheetTitle>
          <SheetDescription className="sr-only">
            Información completa del sistema externo
          </SheetDescription>
        </SheetHeader>

        {/* Profile header */}
        <div className="flex flex-col items-center gap-3 px-4 pb-2">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-xl sm:h-20 sm:w-20 ${
              sistema.activo ? "bg-emerald-500/10" : "bg-muted"
            }`}
          >
            <Server
              className={`h-8 w-8 sm:h-10 sm:w-10 ${
                sistema.activo
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{sistema.nombre}</h3>
            {sistema.descripcion && (
              <p className="text-sm text-muted-foreground">
                {sistema.descripcion}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={sistema.activo ? "default" : "secondary"}
              className={
                sistema.activo
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : ""
              }
            >
              {sistema.activo ? "Activo" : "Inactivo"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              {sistema._count.registrosAcceso} acceso
              {sistema._count.registrosAcceso !== 1 ? "s" : ""}
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
              <p className="text-xs text-muted-foreground">Fecha de creación</p>
              <p className="mt-0.5 text-sm font-medium">
                {formatFullDate(sistema.creadoEn)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último acceso</p>
              <p className="mt-0.5 text-sm font-medium">
                {formatDateTime(sistema.ultimoAcceso)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de accesos</p>
              <p className="mt-0.5 text-sm font-medium">
                {sistema._count.registrosAcceso}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Permisos */}
        <div className="space-y-3 px-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Permisos ({sistema.permisos.length})
          </h4>

          <div className="space-y-2">
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Operaciones permitidas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sistema.permisos.map((permiso) => (
                  <Badge
                    key={permiso}
                    variant="outline"
                    className={`text-xs ${PERMISO_COLORS[permiso] ?? ""}`}
                  >
                    {PERMISO_LABELS[permiso] ?? permiso}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
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
                Editar sistema
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

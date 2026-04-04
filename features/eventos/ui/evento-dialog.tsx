"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createEventoAction, updateEventoAction } from "../actions"
import { toast } from "sonner"

interface EventoData {
  id: number
  nombre: string
  descripcion: string | null
  fechaInicio: Date
  fechaFin: Date | null
  activo: boolean
}

interface EventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento?: EventoData | null
}

function toDatetimeLocalValue(date: Date | string | null) {
  if (!date) return ""
  const d = new Date(date)
  // Format as YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventoDialog({ open, onOpenChange, evento }: EventoDialogProps) {
  const isEditing = !!evento
  const action = isEditing ? updateEventoAction : createEventoAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const [nombre, setNombre] = useState(evento?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? "")
  const [fechaInicio, setFechaInicio] = useState(
    toDatetimeLocalValue(evento?.fechaInicio ?? null)
  )
  const [fechaFin, setFechaFin] = useState(
    toDatetimeLocalValue(evento?.fechaFin ?? null)
  )

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Evento actualizado" : "Evento creado")
      onOpenChangeRef.current(false)
      formRef.current?.reset()
    }
  }, [state, isEditing])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Evento" : "Nuevo Evento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del evento."
              : "Crea un nuevo evento universitario."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && (
            <input type="hidden" name="eventoId" value={evento.id} />
          )}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="eventoNombre">Nombre</Label>
            <Input
              id="eventoNombre"
              name="nombre"
              placeholder="Ej: Ceremonia de Grados 2026"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.nombre}
            />
            {state?.fieldErrors?.nombre && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.nombre}
              </p>
            )}
          </div>

          {/* Descripcion */}
          <div className="space-y-2">
            <Label htmlFor="eventoDescripcion">Descripcion (opcional)</Label>
            <Textarea
              id="eventoDescripcion"
              name="descripcion"
              placeholder="Breve descripcion del evento"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          {/* Fecha inicio */}
          <div className="space-y-2">
            <Label htmlFor="eventoFechaInicio">Fecha de inicio</Label>
            <Input
              id="eventoFechaInicio"
              name="fechaInicio"
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.fechaInicio}
            />
            {state?.fieldErrors?.fechaInicio && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.fechaInicio}
              </p>
            )}
          </div>

          {/* Fecha fin */}
          <div className="space-y-2">
            <Label htmlFor="eventoFechaFin">Fecha de fin (opcional)</Label>
            <Input
              id="eventoFechaFin"
              name="fechaFin"
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.fechaFin}
            />
            {state?.fieldErrors?.fechaFin && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.fechaFin}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

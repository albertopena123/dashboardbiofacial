"use client"

import { useActionState, useEffect, useRef, useState, useCallback } from "react"
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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createPersonaAction, updatePersonaAction } from "../actions"
import { toast } from "sonner"
import type { TipoPersona } from "@/entities/persona/model"
import { TIPO_PERSONA_LABELS } from "@/entities/persona/model"

interface PersonaData {
  id: number
  dni: string
  nombres: string
  apellidos: string
  tipo: TipoPersona
  activo: boolean
}

interface ReniecData {
  NOMBRES: string
  AP_PAT: string
  AP_MAT: string
}

interface PersonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona?: PersonaData | null
}

export function PersonaDialog({ open, onOpenChange, persona }: PersonaDialogProps) {
  const isEditing = !!persona
  const action = isEditing ? updatePersonaAction : createPersonaAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)

  const [dni, setDni] = useState(persona?.dni ?? "")
  const [nombres, setNombres] = useState(persona?.nombres ?? "")
  const [apellidos, setApellidos] = useState(persona?.apellidos ?? "")
  const [tipo, setTipo] = useState<TipoPersona | "">(persona?.tipo ?? "")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  // Reset form when persona prop changes
  useEffect(() => {
    setDni(persona?.dni ?? "")
    setNombres(persona?.nombres ?? "")
    setApellidos(persona?.apellidos ?? "")
    setTipo(persona?.tipo ?? "")
    setLookupDone(false)
  }, [persona])

  // Reset when dialog opens for create
  useEffect(() => {
    if (open && !persona) {
      setDni("")
      setNombres("")
      setApellidos("")
      setTipo("")
      setLookupDone(false)
    }
  }, [open, persona])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Persona actualizada" : "Persona creada")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  // Auto-lookup DNI via UNAMAD API
  const lookupDni = useCallback(async (dniValue: string) => {
    if (dniValue.length !== 8 || !/^\d{8}$/.test(dniValue)) return

    setIsLookingUp(true)
    try {
      const res = await fetch(`/api/consulta/${dniValue}`)
      if (!res.ok) throw new Error("Not found")
      const data: ReniecData = await res.json()

      if (data.NOMBRES) {
        setNombres(data.NOMBRES)
        setApellidos(`${data.AP_PAT} ${data.AP_MAT}`)
        setLookupDone(true)
        toast.success("Datos obtenidos de RENIEC")
      }
    } catch {
      // Silently fail -- user can fill manually
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  // Trigger lookup when 8 digits entered (only for create)
  useEffect(() => {
    if (dni.length !== 8) {
      setLookupDone(false)
      return
    }
    if (isEditing) return

    const timer = setTimeout(() => lookupDni(dni), 400)
    return () => clearTimeout(timer)
  }, [dni, isEditing, lookupDni])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Persona" : "Nueva Persona"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información de la persona."
              : "Ingresa el DNI para buscar automáticamente los datos."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && (
            <input type="hidden" name="personaId" value={persona.id} />
          )}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* DNI */}
          <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <div className="relative">
              <Input
                id="dni"
                name="dni"
                placeholder="12345678"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!state?.fieldErrors?.dni}
                className="pr-8"
              />
              {isLookingUp && (
                <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {lookupDone && !isLookingUp && (
                <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              )}
            </div>
            {state?.fieldErrors?.dni && (
              <p className="text-xs text-destructive">{state.fieldErrors.dni}</p>
            )}
          </div>

          {/* Nombres */}
          <div className="space-y-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              name="nombres"
              placeholder="Nombres completos"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.nombres}
            />
            {state?.fieldErrors?.nombres && (
              <p className="text-xs text-destructive">{state.fieldErrors.nombres}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              name="apellidos"
              placeholder="Apellidos completos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.apellidos}
            />
            {state?.fieldErrors?.apellidos && (
              <p className="text-xs text-destructive">{state.fieldErrors.apellidos}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de persona</Label>
            <Select
              name="tipo"
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoPersona)}
            >
              <SelectTrigger id="tipo" aria-invalid={!!state?.fieldErrors?.tipo}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(TIPO_PERSONA_LABELS) as [TipoPersona, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.tipo && (
              <p className="text-xs text-destructive">{state.fieldErrors.tipo}</p>
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
              {isEditing ? "Guardar cambios" : "Crear persona"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, Copy, Check } from "lucide-react"
import { createSistemaAction, updateSistemaAction } from "../actions"
import { toast } from "sonner"
import type { SistemaExternoRow } from "@/entities/sistema-externo/model"

const PERMISOS_OPTIONS = [
  { value: "identify", label: "Identificar", description: "Identificar personas mediante biometría" },
  { value: "register", label: "Registrar", description: "Registrar nuevas personas y rostros" },
  { value: "delete", label: "Eliminar", description: "Eliminar registros biométricos" },
] as const

interface SistemaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sistema?: SistemaExternoRow | null
  initialApiKey?: string | null
}

export function SistemaDialog({
  open,
  onOpenChange,
  sistema,
  initialApiKey,
}: SistemaDialogProps) {
  const isEditing = !!sistema
  const action = isEditing ? updateSistemaAction : createSistemaAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const [nombre, setNombre] = useState(sistema?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(sistema?.descripcion ?? "")
  const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(
    new Set(sistema?.permisos ?? [])
  )
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(initialApiKey ?? null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      if (state.data?.apiKey) {
        setCreatedApiKey(state.data.apiKey)
        toast.success(isEditing ? "Sistema actualizado" : "Sistema creado exitosamente")
      } else {
        toast.success(isEditing ? "Sistema actualizado" : "Sistema creado")
        onOpenChangeRef.current(false)
        formRef.current?.reset()
      }
    }
  }, [state, isEditing])

  function togglePermiso(value: string) {
    setSelectedPermisos((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  async function copyToClipboard() {
    if (!createdApiKey) return
    try {
      await navigator.clipboard.writeText(createdApiKey)
      setCopied(true)
      toast.success("API Key copiada al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar al portapapeles")
    }
  }

  // If we're showing the created API key, show a simplified dialog
  if (createdApiKey && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sistema Creado</DialogTitle>
            <DialogDescription>
              El sistema externo ha sido registrado exitosamente.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              API Key generada - cópiala ahora, no se mostrará de nuevo
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                {createdApiKey}
              </code>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Sistema" : "Nuevo Sistema Externo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica el nombre, descripción y permisos del sistema."
              : "Registra un nuevo sistema externo y genera una API Key."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && (
            <input type="hidden" name="sistemaId" value={sistema.id} />
          )}
          {/* Hidden inputs for selected permisos */}
          {Array.from(selectedPermisos).map((p) => (
            <input key={p} type="hidden" name="permisos" value={p} />
          ))}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="sistemaNombre">Nombre del sistema</Label>
            <Input
              id="sistemaNombre"
              name="nombre"
              placeholder="Ej: App Móvil, Sistema Asistencia, Torniquete"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.nombre}
            />
            {state?.fieldErrors?.nombre && (
              <p className="text-xs text-destructive">{state.fieldErrors.nombre}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="sistemaDescripcion">Descripción (opcional)</Label>
            <Textarea
              id="sistemaDescripcion"
              name="descripcion"
              placeholder="Breve descripción del sistema externo"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
            {state?.fieldErrors?.descripcion && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.descripcion}
              </p>
            )}
          </div>

          <Separator />

          {/* Permisos */}
          <div className="space-y-3">
            <div>
              <Label>Permisos de la API</Label>
              <p className="text-xs text-muted-foreground">
                Selecciona las operaciones que este sistema puede realizar
              </p>
            </div>

            {state?.fieldErrors?.permisos && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.permisos}
              </p>
            )}

            <div className="space-y-2">
              {PERMISOS_OPTIONS.map((option) => {
                const isSelected = selectedPermisos.has(option.value)
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                    <div
                      className="flex-1"
                      onClick={() => togglePermiso(option.value)}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
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
              {isEditing ? "Guardar cambios" : "Crear sistema"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

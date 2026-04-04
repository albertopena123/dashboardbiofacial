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
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { createModuleAction, updateModuleAction } from "../actions"
import { toast } from "sonner"
import { AVAILABLE_ICONS } from "./icon-picker"

const MODULE_ACTIONS = [
  { value: "create", label: "Crear" },
  { value: "read", label: "Ver" },
  { value: "update", label: "Editar" },
  { value: "delete", label: "Eliminar" },
  { value: "export", label: "Exportar" },
]

interface ModuleData {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  status: string
  order: number
  actions?: string[]
}

interface ModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module?: ModuleData | null
  onSuccess?: () => void
}

export function ModuleDialog({
  open,
  onOpenChange,
  module,
  onSuccess,
}: ModuleDialogProps) {
  const isEditing = !!module
  const action = isEditing ? updateModuleAction : createModuleAction

  const [state, formAction, isPending] = useActionState(action, null)
  const lastHandled = useRef(state)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("LayoutDashboard")
  const [selectedActions, setSelectedActions] = useState<string[]>(["read"])

  const toggleAction = useCallback((action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    )
  }, [])

  const resetForm = useCallback(() => {
    if (module) {
      setName(module.name)
      setDescription(module.description ?? "")
      setSelectedIcon(module.icon)
      setSelectedActions(module.actions ?? ["read"])
    } else {
      setName("")
      setDescription("")
      setSelectedIcon("LayoutDashboard")
      setSelectedActions(["read"])
    }
  }, [module])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Módulo actualizado" : "Módulo creado")
      onOpenChange(false)
      onSuccess?.()
    }
  }, [state, isEditing, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar módulo" : "Nuevo módulo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del módulo."
              : "Crea un nuevo módulo para el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {module && <input type="hidden" name="id" value={module.id} />}
          <input type="hidden" name="icon" value={selectedIcon} />

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="moduleName">Nombre</Label>
            <Input
              id="moduleName"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Reportes"
              aria-invalid={!!state?.fieldErrors?.name}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="moduleDescription">Descripción</Label>
            <Input
              id="moduleDescription"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del módulo"
            />
          </div>

          <div className="space-y-2">
            <Label>Ícono</Label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_ICONS.map(({ name: iconName, icon: Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                    selectedIcon === iconName
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                  aria-label={iconName}
                  aria-pressed={selectedIcon === iconName}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Actions / Permissions */}
          <div className="space-y-2">
            <Label>Acciones permitidas</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MODULE_ACTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <Checkbox
                    checked={selectedActions.includes(value)}
                    onCheckedChange={() => toggleAction(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {state?.fieldErrors?.actions && (
              <p className="text-xs text-destructive">{state.fieldErrors.actions}</p>
            )}
            {/* Hidden inputs for form submission */}
            {selectedActions.map((action) => (
              <input key={action} type="hidden" name="actions" value={action} />
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

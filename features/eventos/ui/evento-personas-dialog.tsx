"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Check, X } from "lucide-react"
import {
  addPersonasToEventoAction,
  removePersonaFromEventoAction,
} from "../actions"
import { toast } from "sonner"

interface PersonaOption {
  id: number
  dni: string
  nombres: string
  apellidos: string
}

interface EventoPersonasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventoId: number
  eventoNombre: string
  assignedPersonaIds: number[]
  allPersonas: PersonaOption[]
  onSaved: () => void
}

export function EventoPersonasDialog({
  open,
  onOpenChange,
  eventoId,
  eventoNombre,
  assignedPersonaIds,
  allPersonas,
  onSaved,
}: EventoPersonasDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(assignedPersonaIds)
  )
  const [isPending, setIsPending] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return allPersonas
    const q = search.toLowerCase()
    return allPersonas.filter(
      (p) =>
        p.dni.includes(q) ||
        p.nombres.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q)
    )
  }, [allPersonas, search])

  function togglePersona(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setIsPending(true)
    try {
      const originalSet = new Set(assignedPersonaIds)
      const toAdd = [...selectedIds].filter((id) => !originalSet.has(id))
      const toRemove = assignedPersonaIds.filter((id) => !selectedIds.has(id))

      // Remove personas no longer selected
      for (const personaId of toRemove) {
        const result = await removePersonaFromEventoAction(eventoId, personaId)
        if (result.error) {
          toast.error(result.error)
          setIsPending(false)
          return
        }
      }

      // Add new personas
      if (toAdd.length > 0) {
        const result = await addPersonasToEventoAction(eventoId, toAdd)
        if (result.error) {
          toast.error(result.error)
          setIsPending(false)
          return
        }
      }

      toast.success("Personas actualizadas")
      onSaved()
      onOpenChange(false)
    } catch {
      toast.error("Error al actualizar personas")
    } finally {
      setIsPending(false)
    }
  }

  const addedCount = [...selectedIds].filter(
    (id) => !assignedPersonaIds.includes(id)
  ).length
  const removedCount = assignedPersonaIds.filter(
    (id) => !selectedIds.has(id)
  ).length
  const hasChanges = addedCount > 0 || removedCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Gestionar personas</DialogTitle>
          <DialogDescription>
            Asigna o retira personas del evento{" "}
            <span className="font-semibold text-foreground">
              {eventoNombre}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por DNI o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{selectedIds.size} seleccionadas</span>
          {hasChanges && (
            <>
              <span>·</span>
              {addedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  +{addedCount} nuevas
                </Badge>
              )}
              {removedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-red-600 dark:text-red-400"
                >
                  -{removedCount} retiradas
                </Badge>
              )}
            </>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <p className="text-sm text-muted-foreground">
                No se encontraron personas
              </p>
            </div>
          ) : (
            filtered.map((persona) => {
              const isSelected = selectedIds.has(persona.id)
              return (
                <div
                  key={persona.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50"
                  onClick={() => togglePersona(persona.id)}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {persona.apellidos}, {persona.nombres}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      DNI: {persona.dni}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import { deleteSistemaAction } from "../actions"
import { toast } from "sonner"

interface SistemaDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sistema: {
    id: number
    nombre: string
  } | null
}

export function SistemaDeleteDialog({
  open,
  onOpenChange,
  sistema,
}: SistemaDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false)

  if (!sistema) return null

  async function handleDelete() {
    setIsPending(true)
    try {
      const result = await deleteSistemaAction(sistema!.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Sistema eliminado")
        onOpenChange(false)
      }
    } catch {
      toast.error("Error al eliminar sistema")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Eliminar sistema</DialogTitle>
          <DialogDescription className="text-center">
            ¿Estás seguro de que deseas eliminar el sistema{" "}
            <span className="font-semibold text-foreground">
              {sistema.nombre}
            </span>
            ? Esta acción no se puede deshacer y la API Key dejará de funcionar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

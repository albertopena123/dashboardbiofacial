"use client"

import { useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2 } from "lucide-react"
import { deleteModuleAction } from "../actions"
import { toast } from "sonner"

interface ModuleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: { id: string; name: string } | null
  onSuccess?: () => void
}

export function ModuleDeleteDialog({
  open,
  onOpenChange,
  module,
  onSuccess,
}: ModuleDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!module) return
    startTransition(async () => {
      const result = await deleteModuleAction(module.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Módulo "${module.name}" eliminado`)
        onOpenChange(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar módulo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el módulo{" "}
            <strong>{module?.name}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
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
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

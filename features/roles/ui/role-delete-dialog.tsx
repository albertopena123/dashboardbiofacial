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
import { deleteRoleAction } from "../actions"
import { toast } from "sonner"

interface RoleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: {
    id: string
    name: string
    isSystem: boolean
    _count: { users: number }
  } | null
}

export function RoleDeleteDialog({ open, onOpenChange, role }: RoleDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false)

  if (!role) return null

  async function handleDelete() {
    setIsPending(true)
    try {
      const result = await deleteRoleAction(role!.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Rol eliminado")
        onOpenChange(false)
      }
    } catch {
      toast.error("Error al eliminar rol")
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
          <DialogTitle className="text-center">Eliminar rol</DialogTitle>
          <DialogDescription className="text-center">
            ¿Estás seguro de que deseas eliminar el rol{" "}
            <span className="font-semibold text-foreground">{role.name}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

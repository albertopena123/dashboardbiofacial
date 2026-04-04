"use client"

import { useActionState, useEffect, useRef, useState, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Check, Minus } from "lucide-react"
import { createRoleAction, updateRoleAction } from "../actions"
import { useAbility } from "@/features/casl/provider"
import { SUBJECT_LABELS, ACTION_LABELS } from "@/entities/permission/labels"
import { toast } from "sonner"

interface PermissionItem {
  id: string
  action: string
  subject: string
  description: string | null
}

interface RoleData {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  permissions: {
    permission: PermissionItem
  }[]
}

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleData | null
  permissions: PermissionItem[]
}

// Group permissions by subject for the matrix UI
function groupPermissions(permissions: PermissionItem[]) {
  const groups: Record<string, PermissionItem[]> = {}
  for (const perm of permissions) {
    if (perm.action === "manage" && perm.subject === "all") continue
    if (!groups[perm.subject]) groups[perm.subject] = []
    groups[perm.subject].push(perm)
  }
  return groups
}

export function RoleDialog({ open, onOpenChange, role, permissions }: RoleDialogProps) {
  const ability = useAbility()
  const isSuperadmin = ability.can("manage", "all")

  const isEditing = !!role
  const action = isEditing ? updateRoleAction : createRoleAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  // Check if role has manage:all (superadmin) — expand to all permissions visually
  const hasManageAll = role?.permissions.some(
    (rp) => rp.permission.action === "manage" && rp.permission.subject === "all"
  ) ?? false

  function buildSelectedIds() {
    if (!role) return new Set<string>()
    if (hasManageAll) return new Set(permissions.map((p) => p.id))
    return new Set(role.permissions.map((rp) => rp.permission.id))
  }

  const [name, setName] = useState(role?.name ?? "")
  const [description, setDescription] = useState(role?.description ?? "")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(buildSelectedIds)

  const grouped = useMemo(() => groupPermissions(permissions), [permissions])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Rol actualizado" : "Rol creado")
      onOpenChangeRef.current(false)
      formRef.current?.reset()
    }
  }, [state, isEditing])

  function togglePermission(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSubjectAll(subject: string) {
    const subjectPerms = grouped[subject] ?? []
    const allSelected = subjectPerms.every((p) => selectedIds.has(p.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const p of subjectPerms) {
        if (allSelected) next.delete(p.id)
        else next.add(p.id)
      }
      return next
    })
  }

  function selectAll() {
    const allIds = permissions
      .filter((p) => !(p.action === "manage" && p.subject === "all"))
      .map((p) => p.id)
    setSelectedIds(new Set(allIds))
  }

  function deselectAll() {
    setSelectedIds(new Set())
  }

  const isSystemRole = role?.isSystem

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Rol" : "Nuevo Rol"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica el nombre, descripción y permisos del rol."
              : "Define un nuevo rol con los permisos que necesites."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="roleId" value={role.id} />}
          {/* Hidden inputs for selected permissions */}
          {Array.from(selectedIds).map((id) => (
            <input key={id} type="hidden" name="permissionIds" value={id} />
          ))}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="roleName">Nombre del rol</Label>
            <Input
              id="roleName"
              name="name"
              placeholder="Ej: Coordinador, Docente, Secretario"
              value={name}
              onChange={(e) => {
                if (isSystemRole && !isSuperadmin) return
                setName(e.target.value)
              }}
              readOnly={isSystemRole && !isSuperadmin}
              tabIndex={isSystemRole && !isSuperadmin ? -1 : undefined}
              className={isSystemRole && !isSuperadmin ? "opacity-50 cursor-not-allowed" : ""}
              aria-invalid={!!state?.fieldErrors?.name}
            />
            {state?.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Descripción (opcional)</Label>
            <Input
              id="roleDescription"
              name="description"
              placeholder="Breve descripción del rol"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          {/* Permissions matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Permisos</Label>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size} permiso{selectedIds.size !== 1 ? "s" : ""} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                  Todos
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
                  Ninguno
                </Button>
              </div>
            </div>

            {state?.fieldErrors?.permissions && (
              <p className="text-xs text-destructive">{state.fieldErrors.permissions}</p>
            )}

            <div className="space-y-1 rounded-lg border p-3">
              {Object.entries(grouped).map(([subject, perms]) => {
                const allChecked = perms.every((p) => selectedIds.has(p.id))
                const someChecked = perms.some((p) => selectedIds.has(p.id))

                return (
                  <div key={subject} className="flex flex-col gap-2 rounded-md px-2 py-2 hover:bg-muted/50 sm:flex-row sm:items-center">
                    <div
                      className="flex items-center gap-2 sm:w-36 cursor-pointer"
                      onClick={() => toggleSubjectAll(subject)}
                    >
                      <span className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
                        allChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : someChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                      }`}>
                        {allChecked ? <Check className="size-3.5" /> : someChecked ? <Minus className="size-3.5" /> : null}
                      </span>
                      <span className="text-sm font-medium">
                        {SUBJECT_LABELS[subject] ?? subject}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6 sm:pl-0">
                      {perms.map((perm) => (
                        <Badge
                          key={perm.id}
                          variant={selectedIds.has(perm.id) ? "default" : "outline"}
                          className="cursor-pointer select-none gap-1 transition-colors"
                          onClick={() => togglePermission(perm.id)}
                        >
                          <Check className={`h-3 w-3 ${selectedIds.has(perm.id) ? "opacity-100" : "opacity-0"}`} />
                          {ACTION_LABELS[perm.action] ?? perm.action}
                        </Badge>
                      ))}
                    </div>
                  </div>
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
              {isEditing ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

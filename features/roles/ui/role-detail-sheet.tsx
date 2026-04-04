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
  Shield,
  ShieldCheck,
  KeyRound,
  Users,
  Calendar,
  Pencil,
  Lock,
  Check,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { SUBJECT_LABELS, ACTION_LABELS } from "@/entities/permission/labels"

interface PermissionItem {
  id: string
  action: string
  subject: string
  description: string | null
}

interface RoleDetailData {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  permissions: {
    permission: PermissionItem
  }[]
  _count: { users: number }
}

interface RoleDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleDetailData | null
  onEdit: () => void
}

function formatFullDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function roleIcon(slug: string) {
  if (slug === "superadmin") return ShieldCheck
  if (slug === "admin") return Shield
  return KeyRound
}

function groupPermissions(permissions: { permission: PermissionItem }[]) {
  const groups: Record<string, PermissionItem[]> = {}
  for (const rp of permissions) {
    const subject = rp.permission.subject
    if (!groups[subject]) groups[subject] = []
    groups[subject].push(rp.permission)
  }
  return groups
}

export function RoleDetailSheet({ open, onOpenChange, role, onEdit }: RoleDetailSheetProps) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Role")

  if (!role) return null

  const Icon = roleIcon(role.slug)
  const grouped = groupPermissions(role.permissions)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Detalle del rol</SheetTitle>
          <SheetDescription className="sr-only">
            Información completa del rol y sus permisos
          </SheetDescription>
        </SheetHeader>

        {/* Profile header */}
        <div className="flex flex-col items-center gap-3 px-4 pb-2">
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl sm:h-20 sm:w-20 ${
            role.slug === "superadmin" ? "bg-primary/10" :
            role.slug === "admin" ? "bg-blue-500/10" :
            "bg-muted"
          }`}>
            <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${
              role.slug === "superadmin" ? "text-primary" :
              role.slug === "admin" ? "text-blue-600 dark:text-blue-400" :
              "text-muted-foreground"
            }`} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{role.name}</h3>
            {role.description && (
              <p className="text-sm text-muted-foreground">{role.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={role.isSystem ? "default" : "outline"}>
              {role.isSystem ? (
                <><Lock className="mr-1 h-3 w-3" /> Sistema</>
              ) : (
                "Personalizado"
              )}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {role._count.users} usuario{role._count.users !== 1 ? "s" : ""}
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
              <p className="mt-0.5 text-sm font-medium">{formatFullDate(role.createdAt)}</p>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Permissions */}
        <div className="space-y-3 px-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Permisos ({role.permissions.length})
          </h4>

          <div className="space-y-2">
            {Object.entries(grouped).map(([subject, perms]) => (
              <div key={subject} className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">
                  {SUBJECT_LABELS[subject] ?? subject}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map((perm) => (
                    <Badge key={perm.id} variant="secondary" className="gap-1 text-xs">
                      <Check className="h-3 w-3 text-emerald-500" />
                      {ACTION_LABELS[perm.action] ?? perm.action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
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
                Editar rol
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

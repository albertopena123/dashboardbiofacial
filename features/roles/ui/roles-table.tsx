"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  ShieldCheck,
  ShieldPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  KeyRound,
  Lock,
  Eye,
  Search,
  X,
  Filter,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { RoleDialog } from "./role-dialog"
import { RoleDeleteDialog } from "./role-delete-dialog"
import { RoleDetailSheet } from "./role-detail-sheet"
import { toast } from "sonner"

interface RoleRow {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  _count: {
    users: number
    permissions: number
  }
}

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

interface RolesTableProps {
  data: {
    roles: RoleRow[]
    total: number
    systemCount: number
    customCount: number
    page: number
    pageSize: number
    totalPages: number
  }
  permissions: PermissionItem[]
}

const ease = [0.22, 1, 0.36, 1] as const

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function roleIcon(slug: string) {
  if (slug === "superadmin") return ShieldCheck
  if (slug === "admin") return Shield
  return KeyRound
}

function roleBadgeVariant(slug: string) {
  if (slug === "superadmin") return "default" as const
  if (slug === "admin") return "secondary" as const
  return "outline" as const
}

// --- Stats Cards ---
function StatsCards({
  total,
  system,
  custom,
}: {
  total: number
  system: number
  custom: number
}) {
  const cards = [
    { label: "Total roles", value: total, icon: Shield, color: "text-primary", bg: "bg-primary/10" },
    { label: "Del sistema", value: system, icon: Lock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Personalizados", value: custom, icon: ShieldPlus, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06, ease }}
        >
          <Card className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
              <div className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight sm:text-2xl">{card.value}</p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// --- Row Actions ---
function RowActions({
  role,
  onView,
  onEdit,
  onDelete,
}: {
  role: RoleRow
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Role")
  const canDelete = ability.can("delete", "Role")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>
        {canUpdate && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar rol
          </DropdownMenuItem>
        )}
        {canDelete && !role.isSystem && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar rol
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Active Filters ---
function ActiveFilters({
  search,
  typeName,
  onClearSearch,
  onClearType,
  onClearAll,
}: {
  search: string | null
  typeName: string | null
  onClearSearch: () => void
  onClearType: () => void
  onClearAll: () => void
}) {
  const hasFilters = search || typeName
  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Filtros:</span>
      {search && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Búsqueda: &quot;{search}&quot;
          <button onClick={onClearSearch} className="ml-0.5 rounded-sm hover:bg-foreground/10">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {typeName && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {typeName}
          <button onClick={onClearType} className="ml-0.5 rounded-sm hover:bg-foreground/10">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  )
}

// --- Main Component ---
export function RolesTable({ data, permissions }: RolesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const [, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<RoleDetailData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteRole, setDeleteRole] = useState<RoleRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRole, setDetailRole] = useState<RoleDetailData | null>(null)
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  )

  const updateSearchParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value) newParams.set(key, value)
        else newParams.delete(key)
      }
      if (!("page" in params)) newParams.delete("page")
      startTransition(() => {
        router.push(`/admin/roles?${newParams.toString()}`)
      })
    },
    [router, searchParams, startTransition]
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateSearchParams({ search: searchValue || undefined })
  }

  function handleClearSearch() {
    setSearchValue("")
    updateSearchParams({ search: undefined })
  }

  async function fetchRoleDetail(roleId: string): Promise<RoleDetailData | null> {
    setLoadingRoleId(roleId)
    try {
      const res = await fetch(`/admin/roles/api?id=${roleId}`)
      if (!res.ok) throw new Error("Failed")
      return await res.json()
    } catch {
      toast.error("Error al cargar detalle del rol")
      return null
    } finally {
      setLoadingRoleId(null)
    }
  }

  async function handleView(roleId: string) {
    const d = await fetchRoleDetail(roleId)
    if (d) { setDetailRole(d); setDetailOpen(true) }
  }

  async function handleEdit(roleId: string) {
    const d = await fetchRoleDetail(roleId)
    if (d) { setEditRole(d); setDialogOpen(true) }
  }

  const currentType = searchParams.get("type") || "all"
  const currentSearch = searchParams.get("search")
  const typeName = currentType === "system" ? "Del sistema" : currentType === "custom" ? "Personalizados" : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Roles y Permisos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de roles y permisos del sistema
          </p>
        </div>
        {ability.can("create", "Role") && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => { setEditRole(null); setDialogOpen(true) }}
          >
            <ShieldPlus className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatsCards
        total={data.systemCount + data.customCount}
        system={data.systemCount}
        custom={data.customCount}
      />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
              <Select
                value={currentType}
                onValueChange={(value) =>
                  updateSearchParams({ type: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="system">Del sistema</SelectItem>
                  <SelectItem value="custom">Personalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <ActiveFilters
            search={currentSearch}
            typeName={typeName}
            onClearSearch={handleClearSearch}
            onClearType={() => updateSearchParams({ type: undefined })}
            onClearAll={() => {
              setSearchValue("")
              updateSearchParams({ search: undefined, type: undefined })
            }}
          />

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 sm:pl-4">Rol</TableHead>
                  <TableHead className="hidden sm:table-cell">Permisos</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Creado</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Shield className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">No se encontraron roles</p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentType
                              ? "Intenta cambiar los filtros de búsqueda"
                              : "Crea el primer rol para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.roles.map((role) => {
                    const Icon = roleIcon(role.slug)
                    return (
                      <TableRow
                        key={role.id}
                        data-state={detailRole?.id === role.id && detailOpen ? "selected" : undefined}
                        className={`cursor-pointer ${loadingRoleId === role.id ? "opacity-60" : ""}`}
                        onClick={() => handleView(role.id)}
                      >
                        <TableCell className="pl-2 sm:pl-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              role.slug === "superadmin" ? "bg-primary/10" :
                              role.slug === "admin" ? "bg-blue-500/10" :
                              "bg-muted"
                            }`}>
                              <Icon className={`h-4 w-4 ${
                                role.slug === "superadmin" ? "text-primary" :
                                role.slug === "admin" ? "text-blue-600 dark:text-blue-400" :
                                "text-muted-foreground"
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{role.name}</p>
                              {role.description ? (
                                <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                              ) : (
                                <p className="truncate text-xs text-muted-foreground sm:hidden">
                                  {role._count.permissions} permisos
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="gap-1 font-mono text-xs">
                            <KeyRound className="h-3 w-3" />
                            {role._count.permissions}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{role._count.users}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={roleBadgeVariant(role.slug)}>
                            {role.isSystem ? "Sistema" : "Personalizado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(role.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            role={role}
                            onView={() => handleView(role.id)}
                            onEdit={() => handleEdit(role.id)}
                            onDelete={() => { setDeleteRole(role); setDeleteDialogOpen(true) }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {data.total > 0 && (
              <DataTablePagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={(p) => updateSearchParams({ page: String(p) })}
                onPageSizeChange={(size) => updateSearchParams({ pageSize: String(size), page: "1" })}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs & Sheets — mounted only when open to avoid Radix Presence + React 19 ref loop */}
      {dialogOpen && (
        <RoleDialog
          key={editRole?.id ?? "create"}
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditRole(null) }}
          role={editRole}
          permissions={permissions}
        />
      )}

      {deleteDialogOpen && deleteRole && (
        <RoleDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteRole(null) }}
          role={deleteRole}
        />
      )}

      {detailOpen && detailRole && (
        <RoleDetailSheet
          open={detailOpen}
          onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailRole(null) }}
          role={detailRole}
          onEdit={() => {
            if (detailRole) {
              setDetailOpen(false)
              setEditRole(detailRole)
              setDialogOpen(true)
            }
          }}
        />
      )}
    </div>
  )
}

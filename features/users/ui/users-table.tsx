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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
  Filter,
  UserPlus,
  ShieldCheck,
  UserMinus,
  Eye,
  KeyRound,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { UserDialog } from "./user-dialog"
import { UserDeleteDialog } from "./user-delete-dialog"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { UserDetailSheet } from "./user-detail-sheet"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { toggleUserStatusAction } from "../actions"
import { toast } from "sonner"

type DocumentType = "DNI" | "CE" | "PASAPORTE"

const DOC_TYPE_SHORT: Record<DocumentType, string> = {
  DNI: "DNI",
  CE: "CE",
  PASAPORTE: "PAS",
}

interface UserRow {
  id: string
  documentType: DocumentType
  documentNumber: string
  email: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
  roleId: string
  status: string
  avatarUrl: string | null
  lastLoginAt: Date | null
  createdAt: Date
  role: {
    id: string
    name: string
    slug: string
  }
}

interface Role {
  id: string
  name: string
  slug: string
}

interface UsersTableProps {
  data: {
    users: UserRow[]
    total: number
    activeCount: number
    inactiveCount: number
    page: number
    pageSize: number
    totalPages: number
  }
  roles: Role[]
}

const ease = [0.22, 1, 0.36, 1] as const

function formatDate(date: Date | string | null) {
  if (!date) return "Sin acceso"
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatRelativeDate(date: Date | string | null) {
  if (!date) return null
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora mismo"
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return null
}

function roleVariant(slug: string) {
  if (slug === "superadmin") return "default" as const
  if (slug === "admin") return "secondary" as const
  return "outline" as const
}

// --- Stats Cards ---
function StatsCards({
  total,
  active,
  inactive,
}: {
  total: number
  active: number
  inactive: number
}) {
  const cards = [
    {
      label: "Total usuarios",
      value: total,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Activos",
      value: active,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Inactivos",
      value: inactive,
      icon: UserMinus,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
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
              <div
                className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${card.bg}`}
              >
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
  user,
  onView,
  onEdit,
  onResetPassword,
  onDelete,
  onToggleStatus,
}: {
  user: UserRow
  onView: () => void
  onEdit: () => void
  onResetPassword: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "User")
  const canDelete = ability.can("delete", "User")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </DropdownMenuItem>
        {canUpdate && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar información
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResetPassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Resetear contraseña
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleStatus}>
              {user.status === "ACTIVE" ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Desactivar usuario
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activar usuario
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar usuario
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
  status,
  roleName,
  onClearSearch,
  onClearStatus,
  onClearRole,
  onClearAll,
}: {
  search: string | null
  status: string | null
  roleName: string | null
  onClearSearch: () => void
  onClearStatus: () => void
  onClearRole: () => void
  onClearAll: () => void
}) {
  const hasFilters = search || status || roleName
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
      {status && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {status === "ACTIVE" ? "Activos" : "Inactivos"}
          <button onClick={onClearStatus} className="ml-0.5 rounded-sm hover:bg-foreground/10">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {roleName && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Rol: {roleName}
          <button onClick={onClearRole} className="ml-0.5 rounded-sm hover:bg-foreground/10">
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
export function UsersTable({ data, roles }: UsersTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const [, startTransition] = useTransition()

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [resetPwUser, setResetPwUser] = useState<UserRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<UserRow | null>(null)
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  )

  const updateSearchParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          newParams.set(key, value)
        } else {
          newParams.delete(key)
        }
      }
      if (!("page" in params)) newParams.delete("page")
      startTransition(() => {
        router.push(`/admin/usuarios?${newParams.toString()}`)
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

  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggleStatus(user: UserRow) {
    if (togglingId) return
    setTogglingId(user.id)
    try {
      const result = await toggleUserStatusAction(user.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          user.status === "ACTIVE" ? "Usuario desactivado" : "Usuario activado"
        )
      }
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  const currentStatus = searchParams.get("status") || ""
  const currentRoleId = searchParams.get("roleId") || ""
  const currentSearch = searchParams.get("search")
  const activeRoleName = currentRoleId
    ? roles.find((r) => r.id === currentRoleId)?.name ?? null
    : null

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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de usuarios del sistema
          </p>
        </div>
        {ability.can("create", "User") && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditUser(null)
              setDialogOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatsCards
        total={data.activeCount + data.inactiveCount}
        active={data.activeCount}
        inactive={data.inactiveCount}
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
                  placeholder="Buscar por nombre, documento o email..."
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

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select
                  value={currentStatus}
                  onValueChange={(value) =>
                    updateSearchParams({
                      status: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="sm:w-[130px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="INACTIVE">Inactivos</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={currentRoleId}
                  onValueChange={(value) =>
                    updateSearchParams({
                      roleId: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="sm:w-[170px]">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <ActiveFilters
            search={currentSearch}
            status={currentStatus || null}
            roleName={activeRoleName}
            onClearSearch={handleClearSearch}
            onClearStatus={() => updateSearchParams({ status: undefined })}
            onClearRole={() => updateSearchParams({ roleId: undefined })}
            onClearAll={() => {
              setSearchValue("")
              updateSearchParams({
                search: undefined,
                status: undefined,
                roleId: undefined,
              })
            }}
          />

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 sm:pl-4">Usuario</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Último acceso
                  </TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <Users className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            No se encontraron usuarios
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentStatus || currentRoleId
                              ? "Intenta cambiar los filtros de búsqueda"
                              : "Crea el primer usuario para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user, index) => (
                    <TableRow
                      key={user.id}
                      data-state={detailUser?.id === user.id && detailOpen ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => {
                        setDetailUser(user)
                        setDetailOpen(true)
                      }}
                    >
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                              {user.firstName?.charAt(0)}
                              {user.paternalSurname?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {user.firstName} {user.paternalSurname}
                              <span className="hidden sm:inline"> {user.maternalSurname}</span>
                            </p>
                            <p className="truncate text-xs text-muted-foreground sm:hidden">
                              {user.role.name}
                            </p>
                            <p className="hidden truncate text-xs text-muted-foreground sm:block md:hidden">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {DOC_TYPE_SHORT[user.documentType] ?? user.documentType}
                          </span>
                          <code className="text-xs font-mono">
                            {user.documentNumber}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={roleVariant(user.role.slug)}
                          className="gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {user.role.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              user.status === "ACTIVE"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="text-sm">
                            {user.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {(() => {
                          const relative = formatRelativeDate(user.lastLoginAt)
                          return (
                            <div className="text-sm">
                              {relative ? (
                                <span className="text-foreground">{relative}</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {formatDate(user.lastLoginAt)}
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          user={user}
                          onView={() => {
                            setDetailUser(user)
                            setDetailOpen(true)
                          }}
                          onEdit={() => {
                            setEditUser(user)
                            setDialogOpen(true)
                          }}
                          onResetPassword={() => {
                            setResetPwUser(user)
                            setResetPwOpen(true)
                          }}
                          onDelete={() => {
                            setDeleteUser(user)
                            setDeleteDialogOpen(true)
                          }}
                          onToggleStatus={() => handleToggleStatus(user)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {data.total > 0 && (
              <DataTablePagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={(p) =>
                  updateSearchParams({ page: String(p) })
                }
                onPageSizeChange={(size) =>
                  updateSearchParams({ pageSize: String(size), page: "1" })
                }
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs & Sheets */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditUser(null)
        }}
        user={editUser}
        roles={roles}
      />

      <UserDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteUser(null)
        }}
        user={deleteUser}
      />

      <ResetPasswordDialog
        open={resetPwOpen}
        onOpenChange={(open) => {
          setResetPwOpen(open)
          if (!open) setResetPwUser(null)
        }}
        user={resetPwUser}
      />

      <UserDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailUser(null)
        }}
        user={detailUser}
        onEdit={() => {
          setDetailOpen(false)
          if (detailUser) {
            setEditUser(detailUser)
            setDialogOpen(true)
          }
        }}
        onResetPassword={() => {
          setDetailOpen(false)
          if (detailUser) {
            setResetPwUser(detailUser)
            setResetPwOpen(true)
          }
        }}
        onToggleStatus={() => {
          if (detailUser) {
            handleToggleStatus(detailUser)
            setDetailOpen(false)
          }
        }}
      />
    </div>
  )
}

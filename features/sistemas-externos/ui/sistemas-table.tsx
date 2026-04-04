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
  KeyRound,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  X,
  Filter,
  Plus,
  Server,
  ServerOff,
  RefreshCw,
  Power,
  PowerOff,
  Activity,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { SistemaDialog } from "./sistema-dialog"
import { SistemaDeleteDialog } from "./sistema-delete-dialog"
import { SistemaDetailSheet } from "./sistema-detail-sheet"
import { toggleSistemaStatusAction, regenerateApiKeyAction } from "../actions"
import { toast } from "sonner"
import type { SistemaExternoRow } from "@/entities/sistema-externo/model"

interface SistemasTableProps {
  data: {
    sistemas: SistemaExternoRow[]
    total: number
    activoCount: number
    inactivoCount: number
    page: number
    pageSize: number
    totalPages: number
  }
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

const PERMISO_COLORS: Record<string, string> = {
  identify: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  register: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  delete: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

function PermisoBadge({ permiso }: { permiso: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 ${PERMISO_COLORS[permiso] ?? ""}`}
    >
      {permiso}
    </Badge>
  )
}

// --- Stats Cards ---
function StatsCards({
  total,
  activos,
  inactivos,
}: {
  total: number
  activos: number
  inactivos: number
}) {
  const cards = [
    {
      label: "Total sistemas",
      value: total,
      icon: Server,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Activos",
      value: activos,
      icon: Activity,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Inactivos",
      value: inactivos,
      icon: ServerOff,
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
  sistema,
  onView,
  onEdit,
  onRegenerate,
  onToggleStatus,
  onDelete,
}: {
  sistema: SistemaExternoRow
  onView: () => void
  onEdit: () => void
  onRegenerate: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "SistemaExterno")
  const canDelete = ability.can("delete", "SistemaExterno")

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
              Editar sistema
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar API Key
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleStatus}>
              {sistema.activo ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desactivar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Activar
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
              Eliminar sistema
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
  statusName,
  onClearSearch,
  onClearStatus,
  onClearAll,
}: {
  search: string | null
  statusName: string | null
  onClearSearch: () => void
  onClearStatus: () => void
  onClearAll: () => void
}) {
  const hasFilters = search || statusName
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
      {statusName && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {statusName}
          <button onClick={onClearStatus} className="ml-0.5 rounded-sm hover:bg-foreground/10">
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
export function SistemasTable({ data }: SistemasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const [, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSistema, setEditSistema] = useState<SistemaExternoRow | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteSistema, setDeleteSistema] = useState<SistemaExternoRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSistema, setDetailSistema] = useState<SistemaExternoRow | null>(null)
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null)
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
        router.push(`/admin/sistemas-externos?${newParams.toString()}`)
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

  async function handleToggleStatus(sistema: SistemaExternoRow) {
    const result = await toggleSistemaStatusAction(sistema.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(sistema.activo ? "Sistema desactivado" : "Sistema activado")
    }
  }

  async function handleRegenerate(sistema: SistemaExternoRow) {
    const result = await regenerateApiKeyAction(sistema.id)
    if (result.error) {
      toast.error(result.error)
    } else if (result.data?.apiKey) {
      setRegeneratedKey(result.data.apiKey)
      // Open the dialog in create mode but showing the key
      setEditSistema(null)
      setDialogOpen(true)
      toast.success("API Key regenerada exitosamente")
    }
  }

  const currentActivo = searchParams.get("activo") || "all"
  const currentSearch = searchParams.get("search")
  const statusName =
    currentActivo === "true"
      ? "Activos"
      : currentActivo === "false"
        ? "Inactivos"
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Sistemas Externos</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de API Keys y sistemas externos conectados
          </p>
        </div>
        {ability.can("create", "SistemaExterno") && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditSistema(null)
              setRegeneratedKey(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Sistema
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatsCards
        total={data.activoCount + data.inactivoCount}
        activos={data.activoCount}
        inactivos={data.inactivoCount}
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
                value={currentActivo}
                onValueChange={(value) =>
                  updateSearchParams({ activo: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger className="sm:w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <ActiveFilters
            search={currentSearch}
            statusName={statusName}
            onClearSearch={handleClearSearch}
            onClearStatus={() => updateSearchParams({ activo: undefined })}
            onClearAll={() => {
              setSearchValue("")
              updateSearchParams({ search: undefined, activo: undefined })
            }}
          />

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 sm:pl-4">Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Descripción</TableHead>
                  <TableHead className="hidden md:table-cell">Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
                  <TableHead className="hidden lg:table-cell">Accesos</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sistemas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <KeyRound className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            No se encontraron sistemas externos
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentActivo !== "all"
                              ? "Intenta cambiar los filtros de búsqueda"
                              : "Registra el primer sistema externo para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sistemas.map((sistema) => (
                    <TableRow
                      key={sistema.id}
                      data-state={
                        detailSistema?.id === sistema.id && detailOpen
                          ? "selected"
                          : undefined
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        setDetailSistema(sistema)
                        setDetailOpen(true)
                      }}
                    >
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              sistema.activo ? "bg-emerald-500/10" : "bg-muted"
                            }`}
                          >
                            <Server
                              className={`h-4 w-4 ${
                                sistema.activo
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{sistema.nombre}</p>
                            <p className="truncate text-xs text-muted-foreground sm:hidden">
                              {sistema.permisos.join(", ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] sm:table-cell">
                        <p className="truncate text-sm text-muted-foreground">
                          {sistema.descripcion || "Sin descripción"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {sistema.permisos.map((p) => (
                            <PermisoBadge key={p} permiso={p} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={sistema.activo ? "default" : "secondary"}
                          className={
                            sistema.activo
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : ""
                          }
                        >
                          {sistema.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(sistema.ultimoAcceso)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{sistema._count.registrosAcceso}</span>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          sistema={sistema}
                          onView={() => {
                            setDetailSistema(sistema)
                            setDetailOpen(true)
                          }}
                          onEdit={() => {
                            setEditSistema(sistema)
                            setRegeneratedKey(null)
                            setDialogOpen(true)
                          }}
                          onRegenerate={() => handleRegenerate(sistema)}
                          onToggleStatus={() => handleToggleStatus(sistema)}
                          onDelete={() => {
                            setDeleteSistema(sistema)
                            setDeleteDialogOpen(true)
                          }}
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
                onPageChange={(p) => updateSearchParams({ page: String(p) })}
                onPageSizeChange={(size) =>
                  updateSearchParams({ pageSize: String(size), page: "1" })
                }
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs & Sheets */}
      {dialogOpen && (
        <SistemaDialog
          key={editSistema?.id ?? "create"}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditSistema(null)
              setRegeneratedKey(null)
            }
          }}
          sistema={editSistema}
          initialApiKey={regeneratedKey}
        />
      )}

      {deleteDialogOpen && deleteSistema && (
        <SistemaDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setDeleteSistema(null)
          }}
          sistema={deleteSistema}
        />
      )}

      {detailOpen && detailSistema && (
        <SistemaDetailSheet
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open)
            if (!open) setDetailSistema(null)
          }}
          sistema={detailSistema}
          onEdit={() => {
            if (detailSistema) {
              setDetailOpen(false)
              setEditSistema(detailSistema)
              setRegeneratedKey(null)
              setDialogOpen(true)
            }
          }}
        />
      )}
    </div>
  )
}

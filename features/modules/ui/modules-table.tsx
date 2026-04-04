"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Blocks,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  X,
  Filter,
  Users,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { Can } from "@/features/casl/provider"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { ModuleDialog } from "./module-dialog"
import { ModuleDeleteDialog } from "./module-delete-dialog"
import { toggleModuleStatusAction, reorderModulesAction } from "../actions"
import { iconMap } from "./icon-picker"
import { toast } from "sonner"

interface ModuleRow {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string
  status: string
  order: number
  createdAt: Date
  actions: string[]
  _count: { users: number }
}

const ACTION_LABELS: Record<string, string> = {
  create: "Crear",
  read: "Ver",
  update: "Editar",
  delete: "Eliminar",
  export: "Exportar",
}

interface ModulesTableProps {
  data: {
    modules: ModuleRow[]
    total: number
    activeCount: number
    inactiveCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

function StatsCards({
  total,
  activeCount,
  inactiveCount,
}: {
  total: number
  activeCount: number
  inactiveCount: number
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="py-3">
        <CardContent className="px-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{total}</p>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="px-4">
          <p className="text-xs text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {activeCount}
          </p>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="px-4">
          <p className="text-xs text-muted-foreground">Inactivos</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {inactiveCount}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function ModulesTable({ data }: ModulesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const canEdit = ability.can("update", "Module")

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editModule, setEditModule] = useState<ModuleRow | null>(null)
  const [deleteModule, setDeleteModule] = useState<ModuleRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isReordering, startReorder] = useTransition()

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value) sp.set(key, value)
        else sp.delete(key)
      }
      sp.delete("page") // reset to page 1 on filter change
      router.push(`?${sp.toString()}`)
    },
    [router, searchParams]
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateUrl({ search: search || undefined })
  }

  function clearSearch() {
    setSearch("")
    updateUrl({ search: undefined })
  }

  function handlePageChange(page: number) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set("page", page.toString())
    router.push(`?${sp.toString()}`)
  }

  function handlePageSizeChange(size: number) {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set("pageSize", size.toString())
    sp.delete("page")
    router.push(`?${sp.toString()}`)
  }

  async function handleToggleStatus(module: ModuleRow) {
    setTogglingId(module.id)
    const result = await toggleModuleStatusAction(module.id)
    setTogglingId(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        `${module.name} ${module.status === "ACTIVE" ? "desactivado" : "activado"}`
      )
      router.refresh()
    }
  }

  function handleMoveUp(module: ModuleRow) {
    const sorted = [...data.modules].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((m) => m.id === module.id)
    if (idx <= 0) return
    const ids = sorted.map((m) => m.id)
    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
    startReorder(async () => {
      const result = await reorderModulesAction(ids)
      if (result.error) toast.error(result.error)
      else router.refresh()
    })
  }

  function handleMoveDown(module: ModuleRow) {
    const sorted = [...data.modules].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((m) => m.id === module.id)
    if (idx < 0 || idx >= sorted.length - 1) return
    const ids = sorted.map((m) => m.id)
    ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
    startReorder(async () => {
      const result = await reorderModulesAction(ids)
      if (result.error) toast.error(result.error)
      else router.refresh()
    })
  }

  function handleDialogSuccess() {
    router.refresh()
  }

  const activeStatus = searchParams.get("status")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Módulos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los módulos del sistema
          </p>
        </div>
        <Can I="update" a="Module">
          <Button onClick={() => { setEditModule(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo módulo
          </Button>
        </Can>
      </div>

      {/* Stats */}
      <StatsCards
        total={data.total}
        activeCount={data.activeCount}
        inactiveCount={data.inactiveCount}
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar módulo..."
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            <Select
              value={activeStatus ?? "all"}
              onValueChange={(v) =>
                updateUrl({ status: v === "all" ? undefined : v })
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="INACTIVE">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* Active filters */}
        {(searchParams.get("search") || activeStatus) && (
          <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
            {searchParams.get("search") && (
              <Badge variant="secondary" className="gap-1">
                Búsqueda: {searchParams.get("search")}
                <button onClick={clearSearch}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {activeStatus && (
              <Badge variant="secondary" className="gap-1">
                {activeStatus === "ACTIVE" ? "Activos" : "Inactivos"}
                <button onClick={() => updateUrl({ status: undefined })}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Table */}
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                {canEdit && (
                  <TableHead className="w-10 pl-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableHead>
                )}
                <TableHead className={canEdit ? "" : "pl-6"}>Módulo</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="hidden md:table-cell">Usuarios</TableHead>
                <TableHead className="hidden lg:table-cell">Permisos</TableHead>
                <TableHead>Estado</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.modules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canEdit ? 7 : 5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <Blocks className="mx-auto mb-2 h-8 w-8" />
                    No se encontraron módulos
                  </TableCell>
                </TableRow>
              ) : (
                data.modules.map((mod, idx) => {
                  const Icon = iconMap[mod.icon] ?? Blocks
                  return (
                    <TableRow
                      key={mod.id}
                      className={togglingId === mod.id || isReordering ? "opacity-50" : ""}
                    >
                      {canEdit && (
                        <TableCell className="pl-4">
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(mod)}
                              disabled={idx === 0 || isReordering}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              aria-label="Subir"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(mod)}
                              disabled={idx === data.modules.length - 1 || isReordering}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                              aria-label="Bajar"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className={canEdit ? "" : "pl-6"}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{mod.name}</p>
                            {mod.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {mod.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                        {mod.slug}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {mod._count.users}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {mod.actions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {mod.actions.map((action) => (
                              <Badge key={action} variant="outline" className="text-[10px] px-1.5 py-0">
                                {ACTION_LABELS[action] ?? action}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={mod.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {mod.status === "ACTIVE" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditModule(mod)
                                  setDialogOpen(true)
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(mod)}
                                disabled={togglingId === mod.id}
                              >
                                {mod.status === "ACTIVE" ? (
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteModule(mod)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data.totalPages > 0 && (
            <div className="border-t p-4">
              <DataTablePagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ModuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        module={editModule}
        onSuccess={handleDialogSuccess}
      />
      <ModuleDeleteDialog
        open={!!deleteModule}
        onOpenChange={(open) => !open && setDeleteModule(null)}
        module={deleteModule}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}

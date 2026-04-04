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
  CalendarCheck,
  CalendarPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Eye,
  Search,
  X,
  Filter,
  Power,
  UserPlus,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { EventoDialog } from "./evento-dialog"
import { EventoDeleteDialog } from "./evento-delete-dialog"
import { EventoDetailSheet } from "./evento-detail-sheet"
import { EventoPersonasDialog } from "./evento-personas-dialog"
import { toggleEventoStatusAction } from "../actions"
import { toast } from "sonner"

interface EventoRow {
  id: number
  nombre: string
  descripcion: string | null
  fechaInicio: Date
  fechaFin: Date | null
  activo: boolean
  creadoEn: Date
  _count: {
    personas: number
  }
}

interface EventoDetailData {
  id: number
  nombre: string
  descripcion: string | null
  fechaInicio: Date
  fechaFin: Date | null
  activo: boolean
  creadoEn: Date
  _count: { personas: number }
  personas: {
    id: number
    asistio: boolean
    horaRegistro: Date | null
    persona: {
      id: number
      dni: string
      nombres: string
      apellidos: string
    }
  }[]
}

interface PersonaOption {
  id: number
  dni: string
  nombres: string
  apellidos: string
}

interface EventosTableProps {
  data: {
    eventos: EventoRow[]
    total: number
    activoCount: number
    inactivoCount: number
    page: number
    pageSize: number
    totalPages: number
  }
  allPersonas: PersonaOption[]
}

const ease = [0.22, 1, 0.36, 1] as const

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// --- Stats Cards ---
function StatsCards({
  total,
  activos,
  personasTotal,
}: {
  total: number
  activos: number
  personasTotal: number
}) {
  const cards = [
    {
      label: "Total eventos",
      value: total,
      icon: CalendarCheck,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Activos",
      value: activos,
      icon: Power,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Personas asignadas",
      value: personasTotal,
      icon: Users,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
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
                <p className="text-xl font-bold tracking-tight sm:text-2xl">
                  {card.value}
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {card.label}
                </p>
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
  evento,
  onView,
  onEdit,
  onManagePersonas,
  onToggle,
  onDelete,
}: {
  evento: EventoRow
  onView: () => void
  onEdit: () => void
  onManagePersonas: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Evento")
  const canDelete = ability.can("delete", "Evento")

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
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar evento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManagePersonas}>
              <UserPlus className="mr-2 h-4 w-4" />
              Gestionar personas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle}>
              <Power className="mr-2 h-4 w-4" />
              {evento.activo ? "Desactivar" : "Activar"}
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar evento
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
  activoName,
  onClearSearch,
  onClearActivo,
  onClearAll,
}: {
  search: string | null
  activoName: string | null
  onClearSearch: () => void
  onClearActivo: () => void
  onClearAll: () => void
}) {
  const hasFilters = search || activoName
  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Filtros:</span>
      {search && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Busqueda: &quot;{search}&quot;
          <button
            onClick={onClearSearch}
            className="ml-0.5 rounded-sm hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {activoName && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {activoName}
          <button
            onClick={onClearActivo}
            className="ml-0.5 rounded-sm hover:bg-foreground/10"
          >
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
export function EventosTable({ data, allPersonas }: EventosTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const [, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEvento, setEditEvento] = useState<EventoDetailData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteEvento, setDeleteEvento] = useState<EventoRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailEvento, setDetailEvento] = useState<EventoDetailData | null>(null)
  const [personasDialogOpen, setPersonasDialogOpen] = useState(false)
  const [personasEvento, setPersonasEvento] = useState<EventoDetailData | null>(null)
  const [loadingEventoId, setLoadingEventoId] = useState<number | null>(null)
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
        router.push(`/admin/eventos?${newParams.toString()}`)
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

  async function fetchEventoDetail(
    eventoId: number
  ): Promise<EventoDetailData | null> {
    setLoadingEventoId(eventoId)
    try {
      const res = await fetch(`/admin/eventos/api?id=${eventoId}`)
      if (!res.ok) throw new Error("Failed")
      return await res.json()
    } catch {
      toast.error("Error al cargar detalle del evento")
      return null
    } finally {
      setLoadingEventoId(null)
    }
  }

  async function handleView(eventoId: number) {
    const d = await fetchEventoDetail(eventoId)
    if (d) {
      setDetailEvento(d)
      setDetailOpen(true)
    }
  }

  async function handleEdit(eventoId: number) {
    const d = await fetchEventoDetail(eventoId)
    if (d) {
      setEditEvento(d)
      setDialogOpen(true)
    }
  }

  async function handleManagePersonas(eventoId: number) {
    const d = await fetchEventoDetail(eventoId)
    if (d) {
      setPersonasEvento(d)
      setPersonasDialogOpen(true)
    }
  }

  async function handleToggle(eventoId: number) {
    const result = await toggleEventoStatusAction(eventoId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Estado actualizado")
    }
  }

  const currentActivo = searchParams.get("activo") || "all"
  const currentSearch = searchParams.get("search")
  const activoName =
    currentActivo === "true"
      ? "Activos"
      : currentActivo === "false"
        ? "Inactivos"
        : null

  const personasTotal = data.eventos.reduce(
    (sum, e) => sum + e._count.personas,
    0
  )

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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Eventos Universitarios
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestion de eventos y asistencia
          </p>
        </div>
        {ability.can("create", "Evento") && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditEvento(null)
              setDialogOpen(true)
            }}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatsCards
        total={data.activoCount + data.inactivoCount}
        activos={data.activoCount}
        personasTotal={personasTotal}
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
                  placeholder="Buscar por nombre o descripcion..."
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
                  updateSearchParams({
                    activo: value === "all" ? undefined : value,
                  })
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
            activoName={activoName}
            onClearSearch={handleClearSearch}
            onClearActivo={() => updateSearchParams({ activo: undefined })}
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
                  <TableHead className="hidden sm:table-cell">
                    Fecha inicio
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Fecha fin
                  </TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead className="hidden lg:table-cell">Estado</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.eventos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <CalendarCheck className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            No se encontraron eventos
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentActivo !== "all"
                              ? "Intenta cambiar los filtros de busqueda"
                              : "Crea el primer evento para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.eventos.map((evento) => (
                    <TableRow
                      key={evento.id}
                      data-state={
                        detailEvento?.id === evento.id && detailOpen
                          ? "selected"
                          : undefined
                      }
                      className={`cursor-pointer ${loadingEventoId === evento.id ? "opacity-60" : ""}`}
                      onClick={() => handleView(evento.id)}
                    >
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <CalendarCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {evento.nombre}
                            </p>
                            {evento.descripcion ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {evento.descripcion}
                              </p>
                            ) : (
                              <p className="truncate text-xs text-muted-foreground sm:hidden">
                                {formatDate(evento.fechaInicio)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(evento.fechaInicio)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {evento.fechaFin
                            ? formatDate(evento.fechaFin)
                            : "---"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {evento._count.personas}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant={evento.activo ? "default" : "secondary"}
                        >
                          {evento.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          evento={evento}
                          onView={() => handleView(evento.id)}
                          onEdit={() => handleEdit(evento.id)}
                          onManagePersonas={() =>
                            handleManagePersonas(evento.id)
                          }
                          onToggle={() => handleToggle(evento.id)}
                          onDelete={() => {
                            setDeleteEvento(evento)
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
      {dialogOpen && (
        <EventoDialog
          key={editEvento?.id ?? "create"}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditEvento(null)
          }}
          evento={editEvento}
        />
      )}

      {deleteDialogOpen && deleteEvento && (
        <EventoDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setDeleteEvento(null)
          }}
          evento={deleteEvento}
        />
      )}

      {detailOpen && detailEvento && (
        <EventoDetailSheet
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open)
            if (!open) setDetailEvento(null)
          }}
          evento={detailEvento}
          onEdit={() => {
            if (detailEvento) {
              setDetailOpen(false)
              setEditEvento(detailEvento)
              setDialogOpen(true)
            }
          }}
          onManagePersonas={() => {
            if (detailEvento) {
              setDetailOpen(false)
              setPersonasEvento(detailEvento)
              setPersonasDialogOpen(true)
            }
          }}
        />
      )}

      {personasDialogOpen && personasEvento && (
        <EventoPersonasDialog
          open={personasDialogOpen}
          onOpenChange={(open) => {
            setPersonasDialogOpen(open)
            if (!open) setPersonasEvento(null)
          }}
          eventoId={personasEvento.id}
          eventoNombre={personasEvento.nombre}
          assignedPersonaIds={personasEvento.personas.map(
            (ep) => ep.persona.id
          )}
          allPersonas={allPersonas}
          onSaved={() => {
            // Refresh detail if it was open
            if (personasEvento) {
              fetchEventoDetail(personasEvento.id).then((d) => {
                if (d) setDetailEvento(d)
              })
            }
          }}
        />
      )}
    </div>
  )
}

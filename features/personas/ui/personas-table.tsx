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
  Eye,
  ScanFace,
  Camera,
  Briefcase,
} from "lucide-react"
import { useAbility } from "@/features/casl/provider"
import { PersonaDialog } from "./persona-dialog"
import { PersonaDeleteDialog } from "./persona-delete-dialog"
import { PersonaDetailSheet } from "./persona-detail-sheet"
import { WebcamDialog } from "./webcam-dialog"
import { DataTablePagination } from "@/shared/ui/data-table-pagination"
import { togglePersonaStatusAction } from "../actions"
import { toast } from "sonner"
import type { PersonaRow, TipoPersona } from "@/entities/persona/model"
import { TIPO_PERSONA_LABELS } from "@/entities/persona/model"

interface PersonasTableProps {
  data: {
    personas: PersonaRow[]
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
  if (!date) return "--"
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function tipoVariant(tipo: string) {
  if (tipo === "trabajador") return "default" as const
  if (tipo === "estudiante") return "secondary" as const
  return "outline" as const
}

function getRegistroAgingInfo(registradoEn: Date | string | null): {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
  className: string
} | null {
  if (!registradoEn) return null

  const registered = new Date(registradoEn)
  const now = new Date()
  const diffMs = now.getTime() - registered.getTime()
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30)

  if (diffMonths > 12) {
    return {
      label: "Registro desactualizado",
      variant: "destructive",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    }
  }
  if (diffMonths > 6) {
    return {
      label: "Actualizar registro",
      variant: "outline",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    }
  }
  return {
    label: "Vigente",
    variant: "outline",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  }
}

// --- Stats Cards ---
function StatsCards({
  total,
  active,
  conRostro,
}: {
  total: number
  active: number
  conRostro: number
}) {
  const cards = [
    {
      label: "Total personas",
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
      label: "Con rostro registrado",
      value: conRostro,
      icon: ScanFace,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
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
  persona,
  onView,
  onEdit,
  onWebcam,
  onDelete,
  onToggleStatus,
}: {
  persona: PersonaRow
  onView: () => void
  onEdit: () => void
  onWebcam: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const ability = useAbility()
  const canUpdate = ability.can("update", "Persona")
  const canDelete = ability.can("delete", "Persona")

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
            <DropdownMenuItem onClick={onWebcam}>
              <Camera className="mr-2 h-4 w-4" />
              Registrar rostro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onToggleStatus}>
              {persona.activo ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Desactivar persona
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activar persona
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
              Eliminar persona
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
  tipo,
  activo,
  onClearSearch,
  onClearTipo,
  onClearActivo,
  onClearAll,
}: {
  search: string | null
  tipo: string | null
  activo: string | null
  onClearSearch: () => void
  onClearTipo: () => void
  onClearActivo: () => void
  onClearAll: () => void
}) {
  const hasFilters = search || tipo || activo
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
      {tipo && (
        <Badge variant="secondary" className="gap-1 pr-1">
          Tipo: {TIPO_PERSONA_LABELS[tipo as TipoPersona] ?? tipo}
          <button onClick={onClearTipo} className="ml-0.5 rounded-sm hover:bg-foreground/10">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {activo && (
        <Badge variant="secondary" className="gap-1 pr-1">
          {activo === "true" ? "Activos" : "Inactivos"}
          <button onClick={onClearActivo} className="ml-0.5 rounded-sm hover:bg-foreground/10">
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
export function PersonasTable({ data }: PersonasTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ability = useAbility()
  const [, startTransition] = useTransition()

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPersona, setEditPersona] = useState<PersonaRow | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePersona, setDeletePersona] = useState<PersonaRow | null>(null)
  const [webcamOpen, setWebcamOpen] = useState(false)
  const [webcamPersona, setWebcamPersona] = useState<PersonaRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPersona, setDetailPersona] = useState<PersonaRow | null>(null)
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
        router.push(`/admin/personas?${newParams.toString()}`)
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

  const [togglingId, setTogglingId] = useState<number | null>(null)

  async function handleToggleStatus(persona: PersonaRow) {
    if (togglingId) return
    setTogglingId(persona.id)
    try {
      const result = await togglePersonaStatusAction(persona.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          persona.activo ? "Persona desactivada" : "Persona activada"
        )
      }
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  const currentTipo = searchParams.get("tipo") || ""
  const currentActivo = searchParams.get("activo") || ""
  const currentSearch = searchParams.get("search")

  // Count personas with rostro from the current page data
  const conRostroCount = data.personas.filter((p) => p.biometria).length

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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Personas</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de personas del sistema biométrico
          </p>
        </div>
        {ability.can("create", "Persona") && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditPersona(null)
              setDialogOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nueva Persona
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <StatsCards
        total={data.activoCount + data.inactivoCount}
        active={data.activoCount}
        conRostro={conRostroCount}
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
                  placeholder="Buscar por nombre, apellido o DNI..."
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
                  value={currentTipo}
                  onValueChange={(value) =>
                    updateSearchParams({
                      tipo: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="sm:w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {(Object.entries(TIPO_PERSONA_LABELS) as [TipoPersona, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={currentActivo}
                  onValueChange={(value) =>
                    updateSearchParams({
                      activo: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger className="sm:w-[130px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <ActiveFilters
            search={currentSearch}
            tipo={currentTipo || null}
            activo={currentActivo || null}
            onClearSearch={handleClearSearch}
            onClearTipo={() => updateSearchParams({ tipo: undefined })}
            onClearActivo={() => updateSearchParams({ activo: undefined })}
            onClearAll={() => {
              setSearchValue("")
              updateSearchParams({
                search: undefined,
                tipo: undefined,
                activo: undefined,
              })
            }}
          />

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-2 sm:pl-4">Persona</TableHead>
                  <TableHead className="hidden sm:table-cell">DNI</TableHead>
                  <TableHead className="hidden md:table-cell">Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Rostro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Creado</TableHead>
                  <TableHead className="w-[44px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.personas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                          <ScanFace className="h-7 w-7 text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            No se encontraron personas
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground/70">
                            {currentSearch || currentTipo || currentActivo
                              ? "Intenta cambiar los filtros de búsqueda"
                              : "Crea la primera persona para empezar"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.personas.map((persona) => (
                    <TableRow
                      key={persona.id}
                      data-state={detailPersona?.id === persona.id && detailOpen ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => {
                        setDetailPersona(persona)
                        setDetailOpen(true)
                      }}
                    >
                      <TableCell className="pl-2 sm:pl-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                              {persona.nombres?.charAt(0)}
                              {persona.apellidos?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {persona.nombres} {persona.apellidos}
                            </p>
                            <p className="truncate text-xs text-muted-foreground sm:hidden">
                              {TIPO_PERSONA_LABELS[persona.tipo]}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="text-xs font-mono">{persona.dni}</code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={tipoVariant(persona.tipo)} className="gap-1">
                          <Briefcase className="h-3 w-3" />
                          {TIPO_PERSONA_LABELS[persona.tipo]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                persona.biometria
                                  ? "bg-emerald-500"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-sm">
                              {persona.biometria ? "Registrado" : "Sin rostro"}
                            </span>
                          </div>
                          {persona.biometria && (() => {
                            const aging = getRegistroAgingInfo(persona.biometria.registradoEn)
                            if (!aging) return null
                            return (
                              <Badge
                                variant={aging.variant}
                                className={`w-fit text-[10px] px-1.5 py-0 leading-4 ${aging.className}`}
                              >
                                {aging.label}
                              </Badge>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              persona.activo
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="text-sm">
                            {persona.activo ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(persona.creadoEn)}
                        </span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          persona={persona}
                          onView={() => {
                            setDetailPersona(persona)
                            setDetailOpen(true)
                          }}
                          onEdit={() => {
                            setEditPersona(persona)
                            setDialogOpen(true)
                          }}
                          onWebcam={() => {
                            setWebcamPersona(persona)
                            setWebcamOpen(true)
                          }}
                          onDelete={() => {
                            setDeletePersona(persona)
                            setDeleteDialogOpen(true)
                          }}
                          onToggleStatus={() => handleToggleStatus(persona)}
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
      <PersonaDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditPersona(null)
        }}
        persona={editPersona}
      />

      <PersonaDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeletePersona(null)
        }}
        persona={deletePersona}
      />

      <WebcamDialog
        open={webcamOpen}
        onOpenChange={(open) => {
          setWebcamOpen(open)
          if (!open) setWebcamPersona(null)
        }}
        persona={webcamPersona}
      />

      <PersonaDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailPersona(null)
        }}
        persona={detailPersona}
        onEdit={() => {
          setDetailOpen(false)
          if (detailPersona) {
            setEditPersona(detailPersona)
            setDialogOpen(true)
          }
        }}
        onToggleStatus={() => {
          if (detailPersona) {
            handleToggleStatus(detailPersona)
            setDetailOpen(false)
          }
        }}
      />
    </div>
  )
}

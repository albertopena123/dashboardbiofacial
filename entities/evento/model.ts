export interface EventoRow {
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

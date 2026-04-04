export interface SistemaExternoRow {
  id: number
  nombre: string
  descripcion: string | null
  permisos: string[]
  activo: boolean
  creadoEn: Date
  ultimoAcceso: Date | null
  _count: {
    registrosAcceso: number
  }
}

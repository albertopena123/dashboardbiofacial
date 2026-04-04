export interface RegistroAccesoRow {
  id: number
  dispositivo: string | null
  resultado: "autorizado" | "denegado"
  scoreConfianza: number | null
  motivo: string | null
  creadoEn: Date
  persona: { id: number; dni: string; nombres: string; apellidos: string } | null
  sistema: { id: number; nombre: string } | null
}

export type TipoPersona = "trabajador" | "estudiante" | "postulante" | "egresado"

export const TIPO_PERSONA_LABELS: Record<TipoPersona, string> = {
  trabajador: "Trabajador",
  estudiante: "Estudiante",
  postulante: "Postulante",
  egresado: "Egresado",
}

export interface PersonaRow {
  id: number
  dni: string
  nombres: string
  apellidos: string
  tipo: TipoPersona
  fotoUrl: string | null
  activo: boolean
  creadoEn: Date
  biometria: {
    registradoEn: Date
  } | null
}

"use server"

import { withPermission } from "@/features/auth/lib/guard"

interface IdentifyResult {
  error?: string
  data?: {
    match: boolean
    persona_id?: number
    dni?: string
    nombres?: string
    apellidos?: string
    tipo?: string
    score?: number
    foto_url?: string | null
    best_score?: number
  }
  message?: string
}

export const identifyFaceAction = withPermission(
  "read",
  "Biometria",
  async (imageBase64: string): Promise<IdentifyResult> => {
    try {
      const res = await fetch(`${process.env.BIOAPI_URL}/v1/faces/identify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.BIOAPI_KEY!,
        },
        body: JSON.stringify({ image_base64: imageBase64 }),
      })

      const body = await res.json()

      if (!res.ok) {
        return { error: body?.message ?? `Error del servicio (${res.status})` }
      }

      return { data: body.data, message: body.message }
    } catch {
      return { error: "No se pudo conectar con el servicio biométrico" }
    }
  }
)

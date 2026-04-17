import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dni: string }> }
) {
  const { dni } = await params

  if (!/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
  }

  const res = await fetch(`https://apidatos.unamad.edu.pe/api/consulta/${dni}`)
  const data = await res.json()
  return NextResponse.json(data)
}

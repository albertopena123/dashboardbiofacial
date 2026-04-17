import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/features/auth/lib/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()

  const res = await fetch(`${process.env.BIOAPI_URL}/v1/faces/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.BIOAPI_KEY!,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data)
}

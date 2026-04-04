import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "unamad-secret-change-in-production"
)
const COOKIE_NAME = "session"

export interface SessionPayload {
  userId: string
  roleId: string
  roleSlug: string
  documentNumber: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export interface SessionDetails extends SessionPayload {
  issuedAt: Date
  expiresAt: Date
}

export async function getSessionDetails(): Promise<SessionDetails | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const data = payload as unknown as SessionPayload
    return {
      ...data,
      issuedAt: new Date((payload.iat ?? 0) * 1000),
      expiresAt: new Date((payload.exp ?? 0) * 1000),
    }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "unamad-secret-change-in-production"
)

// Routes restricted to specific roles (optimistic check)
const restrictedRoutes: Record<string, string[]> = {
  "/admin/roles": ["superadmin", "admin"],
  "/admin/configuracion": ["superadmin", "admin"],
  "/admin/usuarios": ["superadmin", "admin"],
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token, SECRET)
      const roleSlug = payload.roleSlug as string | undefined

      // Check role-restricted routes
      if (roleSlug) {
        for (const [route, allowedRoles] of Object.entries(restrictedRoutes)) {
          if (
            request.nextUrl.pathname.startsWith(route) &&
            !allowedRoles.includes(roleSlug)
          ) {
            return NextResponse.redirect(new URL("/admin", request.url))
          }
        }
      }

      return NextResponse.next()
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("session")
      return response
    }
  }

  // Redirect logged-in users away from login
  if (request.nextUrl.pathname === "/login" && token) {
    try {
      await jwtVerify(token, SECRET)
      return NextResponse.redirect(new URL("/admin", request.url))
    } catch {
      // Invalid token, let them see login
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}

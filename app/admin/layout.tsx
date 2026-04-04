import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/widgets/sidebar/app-sidebar"
import { DashboardHeader } from "@/widgets/header/dashboard-header"
import { AbilityProvider } from "@/features/casl/provider"
import { ThemeColorSync } from "@/shared/ui/theme-color-sync"
import { getSession } from "@/features/auth/lib/session"
import { getUserPermissions } from "@/features/auth/lib/guard"
import { db } from "@/shared/lib/db"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  // Fetch user data, all active modules, and permissions in parallel
  const [userData, allModules, permissions] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: {
        themeColor: true,
        avatarUrl: true,
      },
    }),
    db.module.findMany({
      where: { status: "ACTIVE" },
      select: { name: true, slug: true, icon: true, subject: true, order: true },
      orderBy: { order: "asc" },
    }),
    getUserPermissions(session.userId),
  ])

  // Derive visible modules from role permissions
  const hasManageAll = permissions.some(
    (p) => p.action === "manage" && p.subject === "all"
  )
  const permittedSubjects = new Set(permissions.map((p) => p.subject))

  const modules = allModules.filter(
    (m) => hasManageAll || (m.subject && permittedSubjects.has(m.subject))
  )

  const themeColor = userData?.themeColor ?? "neutral"

  return (
    <ThemeColorSync initialColor={themeColor}>
      <AbilityProvider permissions={permissions}>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar
              session={session}
              modules={modules}
              avatarUrl={userData?.avatarUrl ?? null}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              <DashboardHeader />
              <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </AbilityProvider>
    </ThemeColorSync>
  )
}

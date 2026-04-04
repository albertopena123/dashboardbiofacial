"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Building2,
  ChevronUp,
  LogOut,
  Blocks,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logoutAction } from "@/app/admin/actions"
import { buildNavigation, getModuleHref } from "@/shared/config/navigation"
import type { SidebarModule } from "@/entities/module/model"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  Bell,
  Shield,
  Building2,
  Blocks,
}

interface UserSession {
  firstName: string
  paternalSurname: string
  maternalSurname: string
  roleSlug: string
  documentNumber: string
}

interface AppSidebarProps {
  session?: UserSession | null
  modules?: SidebarModule[]
  avatarUrl?: string | null
}

export function AppSidebar({ session, modules, avatarUrl }: AppSidebarProps) {
  const pathname = usePathname()
  const navigation = buildNavigation(modules)

  const initials = session
    ? `${session.firstName[0]}${session.paternalSurname[0]}`
    : "AD"

  const displayName = session
    ? `${session.firstName} ${session.paternalSurname} ${session.maternalSurname}`
    : "Administrador"

  const displayDoc = session
    ? `Doc: ${session.documentNumber}`
    : "admin@unamad.edu.pe"

  function isActive(slug: string) {
    if (slug === "dashboard") {
      return pathname === "/admin"
    }
    return pathname.startsWith(`/admin/${slug}`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">UNAMAD</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Panel de Gestión
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon] || LayoutDashboard
                  return (
                    <SidebarMenuItem key={item.slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.slug)}
                        tooltip={item.title}
                      >
                        <Link href={getModuleHref(item.slug)}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    {avatarUrl && (
                      <AvatarImage src={avatarUrl} alt="Avatar" className="rounded-lg" />
                    )}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {displayDoc}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutAction()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

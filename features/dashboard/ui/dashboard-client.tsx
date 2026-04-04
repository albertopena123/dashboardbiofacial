"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  Users,
  UserCheck,
  UserX,
  Blocks,
  TrendingUp,
  Activity,
  Clock,
  LayoutDashboard,
  BarChart3,
  FileText,
  Building2,
  Bell,
  Shield,
  Settings,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const ease = [0.22, 1, 0.36, 1] as const

const activityData = [
  { name: "Lun", sesiones: 12, acciones: 34 },
  { name: "Mar", sesiones: 19, acciones: 45 },
  { name: "Mié", sesiones: 15, acciones: 28 },
  { name: "Jue", sesiones: 22, acciones: 52 },
  { name: "Vie", sesiones: 28, acciones: 61 },
  { name: "Sáb", sesiones: 8, acciones: 15 },
  { name: "Dom", sesiones: 5, acciones: 10 },
]

const moduleUsageData = [
  { name: "Dashboard", uso: 85 },
  { name: "Usuarios", uso: 62 },
  { name: "Reportes", uso: 45 },
  { name: "Documentos", uso: 38 },
  { name: "Config", uso: 20 },
]

interface DashboardData {
  session: {
    userId: string
    roleId: string
    roleSlug: string
    documentNumber: string
    firstName: string
    paternalSurname: string
    maternalSurname: string
  }
  stats: {
    totalUsers: number
    activeUsers: number
    totalModules: number
    inactiveUsers: number
  }
  recentUsers: {
    id: string
    firstName: string
    paternalSurname: string
    maternalSurname: string
    documentNumber: string
    createdAt: Date
    lastLoginAt: Date | null
    role: {
      name: string
      slug: string
    }
  }[]
  modules: {
    id: string
    name: string
    slug: string
    icon: string
    description: string | null
    order: number
    status: string
  }[]
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  index,
}: {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function roleLabel(role: { name: string; slug: string }) {
  return role.name
}

function roleVariant(slug: string) {
  if (slug === "superadmin") return "default" as const
  if (slug === "admin") return "secondary" as const
  return "outline" as const
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { session, stats, recentUsers } = data
  const greeting = getGreeting()

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {session.firstName}
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de la actividad del sistema.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Usuarios"
          value={stats.totalUsers}
          description="Usuarios registrados"
          icon={Users}
          index={0}
        />
        <StatsCard
          title="Usuarios Activos"
          value={stats.activeUsers}
          description="Con acceso al sistema"
          icon={UserCheck}
          index={1}
        />
        <StatsCard
          title="Usuarios Inactivos"
          value={stats.inactiveUsers}
          description="Sin acceso al sistema"
          icon={UserX}
          index={2}
        />
        <StatsCard
          title="Módulos Activos"
          value={stats.totalModules}
          description="Módulos disponibles"
          icon={Blocks}
          index={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Actividad Semanal
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sesiones y acciones de los últimos 7 días
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient
                        id="colorSesiones"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="name"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sesiones"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorSesiones)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="acciones"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={0.1}
                      fill="hsl(var(--chart-2))"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Uso de Módulos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Módulos más utilizados
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleUsageData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="uso"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent users + Quick access */}
      <div className="grid gap-4 lg:grid-cols-7">
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Usuarios Recientes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Últimos usuarios registrados en el sistema
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay usuarios registrados aún.
                  </p>
                ) : (
                  recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-xs text-primary">
                            {user.firstName[0]}
                            {user.paternalSurname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {user.firstName} {user.paternalSurname} {user.maternalSurname}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Doc: {user.documentNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={roleVariant(user.role.slug)}>
                          {roleLabel(user.role)}
                        </Badge>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acceso Rápido</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tus módulos asignados
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {data.modules.slice(0, 6).map((mod) => (
                  <Link
                    key={mod.id}
                    href={
                      mod.slug === "dashboard"
                        ? "/admin"
                        : `/admin/${mod.slug}`
                    }
                    className="group flex flex-col items-center gap-2 rounded-xl border p-4 transition-[background-color,border-color] duration-200 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-[transform] duration-200 group-hover:scale-105">
                      <ModuleIcon name={mod.icon} />
                    </div>
                    <span className="text-xs font-medium">{mod.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 18) return "Buenas tardes"
  return "Buenas noches"
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Building2,
  Bell,
  Shield,
  Settings,
  Blocks,
}

function ModuleIcon({ name }: { name: string }) {
  const Icon = iconMap[name] || LayoutDashboard
  return <Icon className="h-5 w-5 text-primary" />
}

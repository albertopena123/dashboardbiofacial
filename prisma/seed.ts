import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword } from "../features/auth/lib/password"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// All permission definitions
const permissionDefs = [
  { action: "manage", subject: "all", description: "Acceso total al sistema" },
  { action: "read", subject: "Dashboard", description: "Ver dashboard" },
  { action: "create", subject: "User", description: "Crear usuarios" },
  { action: "read", subject: "User", description: "Ver usuarios" },
  { action: "update", subject: "User", description: "Editar usuarios" },
  { action: "delete", subject: "User", description: "Eliminar usuarios" },
  { action: "create", subject: "Report", description: "Crear reportes" },
  { action: "read", subject: "Report", description: "Ver reportes" },
  { action: "export", subject: "Report", description: "Exportar reportes" },
  { action: "create", subject: "Document", description: "Crear documentos" },
  { action: "read", subject: "Document", description: "Ver documentos" },
  { action: "update", subject: "Document", description: "Editar documentos" },
  { action: "delete", subject: "Document", description: "Eliminar documentos" },
  { action: "create", subject: "Institution", description: "Crear instituciones" },
  { action: "read", subject: "Institution", description: "Ver instituciones" },
  { action: "update", subject: "Institution", description: "Editar instituciones" },
  { action: "delete", subject: "Institution", description: "Eliminar instituciones" },
  { action: "create", subject: "Notification", description: "Crear notificaciones" },
  { action: "read", subject: "Notification", description: "Ver notificaciones" },
  { action: "update", subject: "Notification", description: "Editar notificaciones" },
  { action: "delete", subject: "Notification", description: "Eliminar notificaciones" },
  { action: "create", subject: "Role", description: "Crear roles" },
  { action: "read", subject: "Role", description: "Ver roles" },
  { action: "update", subject: "Role", description: "Editar roles" },
  { action: "delete", subject: "Role", description: "Eliminar roles" },
  { action: "read", subject: "Setting", description: "Ver configuración" },
  { action: "update", subject: "Setting", description: "Editar configuración" },
  { action: "read", subject: "Module", description: "Ver módulos" },
  { action: "update", subject: "Module", description: "Editar módulos" },
  // Biométrico - Personas
  { action: "create", subject: "Persona", description: "Registrar personas" },
  { action: "read", subject: "Persona", description: "Ver personas" },
  { action: "update", subject: "Persona", description: "Editar personas" },
  { action: "delete", subject: "Persona", description: "Eliminar personas" },
  // Biométrico - Sistemas Externos
  { action: "create", subject: "SistemaExterno", description: "Crear sistemas externos" },
  { action: "read", subject: "SistemaExterno", description: "Ver sistemas externos" },
  { action: "update", subject: "SistemaExterno", description: "Editar sistemas externos" },
  { action: "delete", subject: "SistemaExterno", description: "Eliminar sistemas externos" },
  // Biométrico - Biometria (tiempo real)
  { action: "read", subject: "Biometria", description: "Ver dashboard biométrico en tiempo real" },
  // Biométrico - Eventos
  { action: "create", subject: "Evento", description: "Crear eventos" },
  { action: "read", subject: "Evento", description: "Ver eventos" },
  { action: "update", subject: "Evento", description: "Editar eventos" },
  { action: "delete", subject: "Evento", description: "Eliminar eventos" },
]

// Role definitions with their permission filters
const roleDefs = [
  {
    name: "Super Administrador",
    slug: "superadmin",
    description: "Acceso total al sistema",
    isSystem: true,
    // Gets manage:all (full access)
    permissionFilter: () => true,
    useManageAll: true,
  },
  {
    name: "Administrador",
    slug: "admin",
    description: "Administración general del sistema",
    isSystem: true,
    useManageAll: false,
    permissionFilter: (p: { action: string; subject: string }) => {
      // All CRUD on most subjects + read/update settings
      const allowed = [
        "User", "Document", "Report", "Institution",
        "Notification", "Dashboard", "Module",
        "Persona", "SistemaExterno", "Biometria", "Evento",
      ]
      if (allowed.includes(p.subject)) return true
      if (p.subject === "Setting") return ["read", "update"].includes(p.action)
      if (p.subject === "Role") return p.action === "read"
      return false
    },
  },
  {
    name: "Usuario",
    slug: "user",
    description: "Acceso básico al sistema",
    isSystem: true,
    useManageAll: false,
    permissionFilter: (p: { action: string; subject: string }) => {
      // Read-only on dashboard, reports, documents
      if (p.action !== "read") return false
      return ["Dashboard", "Report", "Document", "Notification"].includes(p.subject)
    },
  },
]

async function main() {
  console.log("Seeding database...")

  // 1. Create all permissions
  const permissions = []
  for (const perm of permissionDefs) {
    const created = await prisma.permission.upsert({
      where: { action_subject: { action: perm.action, subject: perm.subject } },
      update: { description: perm.description },
      create: perm,
    })
    permissions.push(created)
  }
  console.log(`${permissions.length} permissions created`)

  // 2. Create roles and assign permissions
  for (const roleDef of roleDefs) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name, description: roleDef.description },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    })

    // Determine which permissions this role gets
    let rolePermissions: typeof permissions
    if (roleDef.useManageAll) {
      // Superadmin only needs manage:all
      rolePermissions = permissions.filter(
        (p) => p.action === "manage" && p.subject === "all"
      )
    } else {
      rolePermissions = permissions.filter(
        (p) =>
          p.action !== "manage" &&
          p.subject !== "all" &&
          roleDef.permissionFilter({ action: p.action, subject: p.subject })
      )
    }

    // Assign permissions to role
    for (const perm of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      })
    }

    console.log(
      `Role "${role.name}" created with ${rolePermissions.length} permissions`
    )
  }

  // 3. Create admin user
  const superadminRole = await prisma.role.findUnique({
    where: { slug: "superadmin" },
  })

  if (!superadminRole) throw new Error("Superadmin role not found")

  const adminPassword = await hashPassword("admin123")
  const admin = await prisma.user.upsert({
    where: { documentNumber: "00000001" },
    update: { roleId: superadminRole.id },
    create: {
      documentType: "DNI",
      documentNumber: "00000001",
      email: "admin@unamad.edu.pe",
      password: adminPassword,
      firstName: "Super",
      paternalSurname: "Administrador",
      maternalSurname: "Sistema",
      roleId: superadminRole.id,
      status: "ACTIVE",
    },
  })
  console.log(`Admin user created: ${admin.documentNumber}`)

  // 4. Create default modules
  const modules = [
    {
      name: "Dashboard",
      slug: "dashboard",
      subject: "Dashboard",
      description: "Panel principal con estadísticas y resumen general",
      icon: "LayoutDashboard",
      order: 0,
    },
    {
      name: "Usuarios",
      slug: "usuarios",
      subject: "User",
      description: "Gestión de usuarios del sistema",
      icon: "Users",
      order: 1,
    },
    {
      name: "Reportes",
      slug: "reportes",
      subject: "Report",
      description: "Generación y consulta de reportes",
      icon: "BarChart3",
      order: 2,
    },
    {
      name: "Documentos",
      slug: "documentos",
      subject: "Document",
      description: "Gestión documental",
      icon: "FileText",
      order: 3,
    },
    {
      name: "Instituciones",
      slug: "instituciones",
      subject: "Institution",
      description: "Gestión de facultades e instituciones",
      icon: "Building2",
      order: 4,
    },
    {
      name: "Notificaciones",
      slug: "notificaciones",
      subject: "Notification",
      description: "Centro de notificaciones",
      icon: "Bell",
      order: 5,
    },
    {
      name: "Roles y Permisos",
      slug: "roles",
      subject: "Role",
      description: "Configuración de roles y permisos",
      icon: "Shield",
      order: 6,
    },
    {
      name: "Módulos",
      slug: "modulos",
      subject: "Module",
      description: "Gestión de módulos del sistema",
      icon: "Blocks",
      order: 7,
    },
    {
      name: "Configuración",
      slug: "configuracion",
      subject: "Setting",
      description: "Configuración general del sistema",
      icon: "Settings",
      order: 8,
    },
    // Módulos biométricos
    {
      name: "Personas",
      slug: "personas",
      subject: "Persona",
      description: "Registro y gestión de personas para identificación biométrica",
      icon: "ScanFace",
      order: 10,
    },
    {
      name: "Sistemas Externos",
      slug: "sistemas-externos",
      subject: "SistemaExterno",
      description: "Gestión de API Keys y sistemas que consumen la API biométrica",
      icon: "KeyRound",
      order: 11,
    },
    {
      name: "Tiempo Real",
      slug: "biometria-live",
      subject: "Biometria",
      description: "Dashboard de identificación biométrica en tiempo real",
      icon: "Radio",
      order: 12,
    },
    {
      name: "Eventos",
      slug: "eventos",
      subject: "Evento",
      description: "Control de eventos universitarios y asistencia biométrica",
      icon: "CalendarCheck",
      order: 13,
    },
  ]

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: {},
      create: mod,
    })
  }
  console.log(`${modules.length} modules created`)

  // 5. Assign all modules to admin
  const allModules = await prisma.module.findMany()
  for (const mod of allModules) {
    await prisma.userModule.upsert({
      where: {
        userId_moduleId: { userId: admin.id, moduleId: mod.id },
      },
      update: {},
      create: { userId: admin.id, moduleId: mod.id },
    })
  }
  console.log("All modules assigned to admin")

  // 6. Create test users: admin and auditor
  const adminRole = await prisma.role.findUnique({ where: { slug: "admin" } })
  const userRole = await prisma.role.findUnique({ where: { slug: "user" } })

  if (!adminRole || !userRole) throw new Error("Roles not found")

  const testPassword = await hashPassword("test1234")

  const adminUser = await prisma.user.upsert({
    where: { documentNumber: "12345678" },
    update: { roleId: adminRole.id },
    create: {
      documentType: "DNI",
      documentNumber: "12345678",
      email: "admin2@unamad.edu.pe",
      password: testPassword,
      firstName: "Carlos",
      paternalSurname: "Mendoza",
      maternalSurname: "Ríos",
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  })
  console.log(`Admin test user created: ${adminUser.documentNumber}`)

  const auditorUser = await prisma.user.upsert({
    where: { documentNumber: "87654321" },
    update: { roleId: userRole.id },
    create: {
      documentType: "CE",
      documentNumber: "CE20230045",
      email: "auditor@unamad.edu.pe",
      password: testPassword,
      firstName: "María",
      paternalSurname: "Quispe",
      maternalSurname: "López",
      roleId: userRole.id,
      status: "ACTIVE",
    },
  })
  console.log(`Auditor test user created: ${auditorUser.documentNumber}`)

  // Assign modules to test users
  const dashboardMod = allModules.find((m) => m.slug === "dashboard")
  const usuariosMod = allModules.find((m) => m.slug === "usuarios")
  const reportesMod = allModules.find((m) => m.slug === "reportes")
  const docsMod = allModules.find((m) => m.slug === "documentos")

  // Admin gets most modules
  const adminModules = allModules.filter((m) => m.slug !== "configuracion")
  for (const mod of adminModules) {
    await prisma.userModule.upsert({
      where: {
        userId_moduleId: { userId: adminUser.id, moduleId: mod.id },
      },
      update: {},
      create: { userId: adminUser.id, moduleId: mod.id },
    })
  }
  console.log(`${adminModules.length} modules assigned to admin user`)

  // Auditor gets read-only modules
  const auditorModules = [dashboardMod, reportesMod, docsMod].filter(Boolean)
  for (const mod of auditorModules) {
    await prisma.userModule.upsert({
      where: {
        userId_moduleId: { userId: auditorUser.id, moduleId: mod!.id },
      },
      update: {},
      create: { userId: auditorUser.id, moduleId: mod!.id },
    })
  }
  console.log(`${auditorModules.length} modules assigned to auditor user`)

  console.log("Seed completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

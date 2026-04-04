export type { Action, Subject, AppAbility, RawPermission } from "@/features/casl/permissions"

// Subject mapping from module slugs to CASL subjects
export const moduleSubjectMap: Record<string, string> = {
  dashboard: "Dashboard",
  usuarios: "User",
  reportes: "Report",
  documentos: "Document",
  instituciones: "Institution",
  notificaciones: "Notification",
  roles: "Role",
  modulos: "Module",
  configuracion: "Setting",
}

// All permission definitions for seeding
export const allPermissions = [
  // Special wildcard
  { action: "manage", subject: "all", description: "Acceso total al sistema" },

  // Dashboard
  { action: "read", subject: "Dashboard", description: "Ver dashboard" },

  // User
  { action: "create", subject: "User", description: "Crear usuarios" },
  { action: "read", subject: "User", description: "Ver usuarios" },
  { action: "update", subject: "User", description: "Editar usuarios" },
  { action: "delete", subject: "User", description: "Eliminar usuarios" },

  // Report
  { action: "create", subject: "Report", description: "Crear reportes" },
  { action: "read", subject: "Report", description: "Ver reportes" },
  { action: "export", subject: "Report", description: "Exportar reportes" },

  // Document
  { action: "create", subject: "Document", description: "Crear documentos" },
  { action: "read", subject: "Document", description: "Ver documentos" },
  { action: "update", subject: "Document", description: "Editar documentos" },
  { action: "delete", subject: "Document", description: "Eliminar documentos" },

  // Institution
  { action: "create", subject: "Institution", description: "Crear instituciones" },
  { action: "read", subject: "Institution", description: "Ver instituciones" },
  { action: "update", subject: "Institution", description: "Editar instituciones" },
  { action: "delete", subject: "Institution", description: "Eliminar instituciones" },

  // Notification
  { action: "create", subject: "Notification", description: "Crear notificaciones" },
  { action: "read", subject: "Notification", description: "Ver notificaciones" },
  { action: "update", subject: "Notification", description: "Editar notificaciones" },
  { action: "delete", subject: "Notification", description: "Eliminar notificaciones" },

  // Role
  { action: "create", subject: "Role", description: "Crear roles" },
  { action: "read", subject: "Role", description: "Ver roles" },
  { action: "update", subject: "Role", description: "Editar roles" },
  { action: "delete", subject: "Role", description: "Eliminar roles" },

  // Setting
  { action: "read", subject: "Setting", description: "Ver configuración" },
  { action: "update", subject: "Setting", description: "Editar configuración" },

  // Module
  { action: "read", subject: "Module", description: "Ver módulos" },
  { action: "update", subject: "Module", description: "Editar módulos" },
] as const

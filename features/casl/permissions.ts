import type { MongoAbility } from "@casl/ability"

export type Action = "create" | "read" | "update" | "delete" | "manage" | "export"

export type Subject =
  | "User"
  | "Report"
  | "Document"
  | "Institution"
  | "Module"
  | "Role"
  | "Notification"
  | "Setting"
  | "Dashboard"
  | "Persona"
  | "SistemaExterno"
  | "Biometria"
  | "Evento"
  | "all"

export type AppAbility = MongoAbility<[Action, Subject]>

export interface RawPermission {
  action: string
  subject: string
}

export type DocumentType = "DNI" | "CE" | "PASAPORTE"

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: "DNI",
  CE: "Carné de Extranjería",
  PASAPORTE: "Pasaporte",
}

export interface UserProfile {
  id: string
  documentType: DocumentType
  documentNumber: string
  email: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
  roleId: string
  status: "ACTIVE" | "INACTIVE"
  avatarUrl: string | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  role: {
    id: string
    name: string
    slug: string
  }
}

export interface UserListItem {
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
}

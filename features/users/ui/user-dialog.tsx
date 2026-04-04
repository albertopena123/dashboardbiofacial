"use client"

import { useActionState, useEffect, useRef, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createUserAction, updateUserAction } from "../actions"
import { useAbility } from "@/features/casl/provider"
import { toast } from "sonner"

type DocumentType = "DNI" | "CE" | "PASAPORTE"

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string; placeholder: string }[] = [
  { value: "DNI", label: "DNI", placeholder: "12345678" },
  { value: "CE", label: "Carné de Extranjería", placeholder: "CE202300123" },
  { value: "PASAPORTE", label: "Pasaporte", placeholder: "AB1234567" },
]

interface UserData {
  id: string
  documentType: DocumentType
  documentNumber: string
  email: string
  firstName: string
  paternalSurname: string
  maternalSurname: string
  roleId: string
  status: string
}

interface Role {
  id: string
  name: string
  slug: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserData | null
  roles: Role[]
}

interface ReniecData {
  NOMBRES: string
  AP_PAT: string
  AP_MAT: string
}

export function UserDialog({ open, onOpenChange, user, roles }: UserDialogProps) {
  const ability = useAbility()
  const isSuperadmin = ability.can("manage", "all")
  const availableRoles = isSuperadmin ? roles : roles.filter((r) => r.slug !== "superadmin")

  const isEditing = !!user
  const action = isEditing ? updateUserAction : createUserAction
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandled = useRef(state)

  const [docType, setDocType] = useState<DocumentType | "">(user?.documentType ?? "")
  const [docNumber, setDocNumber] = useState(user?.documentNumber ?? "")
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [paternalSurname, setPaternalSurname] = useState(user?.paternalSurname ?? "")
  const [maternalSurname, setMaternalSurname] = useState(user?.maternalSurname ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  // Reset form when user prop changes (edit vs create)
  useEffect(() => {
    setDocType(user?.documentType ?? "")
    setDocNumber(user?.documentNumber ?? "")
    setFirstName(user?.firstName ?? "")
    setPaternalSurname(user?.paternalSurname ?? "")
    setMaternalSurname(user?.maternalSurname ?? "")
    setEmail(user?.email ?? "")
    setLookupDone(false)
  }, [user])

  // Reset when dialog opens for create
  useEffect(() => {
    if (open && !user) {
      setDocType("")
      setDocNumber("")
      setFirstName("")
      setPaternalSurname("")
      setMaternalSurname("")
      setEmail("")
      setLookupDone(false)
    }
  }, [open, user])

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success(isEditing ? "Usuario actualizado" : "Usuario creado")
      onOpenChange(false)
      formRef.current?.reset()
    }
  }, [state, isEditing, onOpenChange])

  // Auto-lookup DNI via UNAMAD API when 8 digits entered
  const lookupDni = useCallback(async (dni: string) => {
    if (dni.length !== 8 || !/^\d{8}$/.test(dni)) return

    setIsLookingUp(true)
    try {
      const res = await fetch(`https://apidatos.unamad.edu.pe/api/consulta/${dni}`)
      if (!res.ok) throw new Error("Not found")
      const data: ReniecData = await res.json()

      if (data.NOMBRES) {
        setFirstName(data.NOMBRES)
        setPaternalSurname(data.AP_PAT)
        setMaternalSurname(data.AP_MAT)
        setLookupDone(true)
        toast.success("Datos obtenidos de RENIEC")
      }
    } catch {
      // Silently fail — user can fill manually
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  // When doc number changes and type is DNI, trigger lookup with debounce
  useEffect(() => {
    if (docNumber.length !== 8) {
      setLookupDone(false)
      return
    }
    if (docType !== "DNI" || isEditing) return

    const timer = setTimeout(() => lookupDni(docNumber), 400)
    return () => clearTimeout(timer)
  }, [docNumber, docType, isEditing, lookupDni])

  const hasDocType = docType !== ""
  const fieldsDisabled = !hasDocType && !isEditing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica la información del usuario. La contraseña se gestiona por separado."
              : "Selecciona el tipo de documento para habilitar el formulario."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="userId" value={user.id} />}

          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Document type + number */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="documentType">Tipo documento</Label>
              <Select
                name="documentType"
                value={docType}
                onValueChange={(v) => {
                  setDocType(v as DocumentType)
                  setDocNumber("")
                  setFirstName("")
                  setPaternalSurname("")
                  setMaternalSurname("")
                  setLookupDone(false)
                }}
              >
                <SelectTrigger id="documentType" aria-invalid={!!state?.fieldErrors?.documentType}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.fieldErrors?.documentType && (
                <p className="text-xs text-destructive">{state.fieldErrors.documentType}</p>
              )}
            </div>
            <div className="sm:col-span-3 space-y-2">
              <Label htmlFor="documentNumber">N° Documento</Label>
              <div className="relative">
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  placeholder={DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.placeholder ?? "Selecciona tipo"}
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  disabled={fieldsDisabled}
                  aria-invalid={!!state?.fieldErrors?.documentNumber}
                  className={docType === "DNI" ? "pr-8" : ""}
                />
                {docType === "DNI" && isLookingUp && (
                  <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {docType === "DNI" && lookupDone && !isLookingUp && (
                  <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                )}
              </div>
              {state?.fieldErrors?.documentNumber && (
                <p className="text-xs text-destructive">{state.fieldErrors.documentNumber}</p>
              )}
            </div>
          </div>

          {/* Names */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombres</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="Nombres completos"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={fieldsDisabled}
              aria-invalid={!!state?.fieldErrors?.firstName}
            />
            {state?.fieldErrors?.firstName && (
              <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="paternalSurname">Apellido paterno</Label>
              <Input
                id="paternalSurname"
                name="paternalSurname"
                placeholder="Apellido paterno"
                value={paternalSurname}
                onChange={(e) => setPaternalSurname(e.target.value)}
                disabled={fieldsDisabled}
                aria-invalid={!!state?.fieldErrors?.paternalSurname}
              />
              {state?.fieldErrors?.paternalSurname && (
                <p className="text-xs text-destructive">{state.fieldErrors.paternalSurname}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maternalSurname">Apellido materno</Label>
              <Input
                id="maternalSurname"
                name="maternalSurname"
                placeholder="Apellido materno"
                value={maternalSurname}
                onChange={(e) => setMaternalSurname(e.target.value)}
                disabled={fieldsDisabled}
                aria-invalid={!!state?.fieldErrors?.maternalSurname}
              />
              {state?.fieldErrors?.maternalSurname && (
                <p className="text-xs text-destructive">{state.fieldErrors.maternalSurname}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="usuario@unamad.edu.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={fieldsDisabled}
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          {/* Password solo en creación */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                disabled={fieldsDisabled}
                aria-invalid={!!state?.fieldErrors?.password}
              />
              {state?.fieldErrors?.password && (
                <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roleId">Rol</Label>
            <Select name="roleId" defaultValue={user?.roleId}>
              <SelectTrigger id="roleId" disabled={fieldsDisabled} aria-invalid={!!state?.fieldErrors?.roleId}>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.roleId && (
              <p className="text-xs text-destructive">{state.fieldErrors.roleId}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || fieldsDisabled}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

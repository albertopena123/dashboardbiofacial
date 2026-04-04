"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { updateProfileAction } from "../actions"
import { toast } from "sonner"

interface ProfileData {
  firstName: string
  paternalSurname: string
  maternalSurname: string
  email: string
  documentType: string
  documentNumber: string
}

interface ProfileFormProps {
  profile: ProfileData
}

const DOC_TYPE_LABELS: Record<string, string> = {
  DNI: "DNI",
  CE: "Carné de Extranjería",
  PASAPORTE: "Pasaporte",
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, null)
  const lastHandled = useRef(state)

  const [firstName, setFirstName] = useState(profile.firstName)
  const [paternalSurname, setPaternalSurname] = useState(profile.paternalSurname)
  const [maternalSurname, setMaternalSurname] = useState(profile.maternalSurname)
  const [email, setEmail] = useState(profile.email)

  useEffect(() => {
    if (state?.success && state !== lastHandled.current) {
      lastHandled.current = state
      toast.success("Perfil actualizado")
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información personal</CardTitle>
        <CardDescription>
          Actualiza tu nombre y correo electrónico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Document (read-only) */}
          <div className="space-y-2">
            <Label>Documento</Label>
            <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
              {DOC_TYPE_LABELS[profile.documentType] ?? profile.documentType}: {profile.documentNumber}
            </div>
            <p className="text-xs text-muted-foreground">
              El documento no se puede modificar desde aquí.
            </p>
          </div>

          {/* Names */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombres</Label>
            <Input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.firstName}
            />
            {state?.fieldErrors?.firstName && (
              <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paternalSurname">Apellido paterno</Label>
              <Input
                id="paternalSurname"
                name="paternalSurname"
                value={paternalSurname}
                onChange={(e) => setPaternalSurname(e.target.value)}
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
                value={maternalSurname}
                onChange={(e) => setMaternalSurname(e.target.value)}
                aria-invalid={!!state?.fieldErrors?.maternalSurname}
              />
              {state?.fieldErrors?.maternalSurname && (
                <p className="text-xs text-destructive">{state.fieldErrors.maternalSurname}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

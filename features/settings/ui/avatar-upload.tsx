"use client"

import { useRef, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Trash2, Loader2 } from "lucide-react"
import { uploadAvatarAction, deleteAvatarAction } from "../actions"
import { toast } from "sonner"

interface AvatarUploadProps {
  avatarUrl: string | null
  initials: string
}

export function AvatarUpload({ avatarUrl, initials }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [isUploading, startUpload] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Formato no soportado. Usa JPG, PNG, WebP o GIF")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB")
      return
    }

    const formData = new FormData()
    formData.append("avatar", file)

    startUpload(async () => {
      const result = await uploadAvatarAction(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        setPreview(result.avatarUrl ?? null)
        toast.success("Foto actualizada")
      }
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ""
    })
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAvatarAction()
      if (result.error) {
        toast.error(result.error)
      } else {
        setPreview(null)
        toast.success("Foto eliminada")
      }
    })
  }

  const busy = isUploading || isDeleting

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto de perfil</CardTitle>
        <CardDescription>
          Sube una imagen JPG, PNG, WebP o GIF. Máximo 2MB.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {preview && (
                <AvatarImage src={preview} alt="Avatar" />
              )}
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              disabled={busy}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {preview ? "Cambiar foto" : "Subir foto"}
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar foto
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

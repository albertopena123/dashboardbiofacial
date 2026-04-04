"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, Check, RotateCcw, Loader2, VideoOff } from "lucide-react"
import { registerFaceAction } from "../actions"
import { toast } from "sonner"

interface WebcamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: {
    id: number
    nombres: string
    apellidos: string
    dni: string
  } | null
}

export function WebcamDialog({
  open,
  onOpenChange,
  persona,
}: WebcamDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setCapturedImage(null)
    setResult(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch {
      setCameraError("No se pudo acceder a la cámara. Verifica los permisos del navegador.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  // Start camera when dialog opens
  useEffect(() => {
    if (open && persona) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [open, persona, startCamera, stopCamera])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
    setCapturedImage(dataUrl)
    stopCamera()
  }

  function handleRetake() {
    setCapturedImage(null)
    setResult(null)
    startCamera()
  }

  async function handleRegister() {
    if (!persona || !capturedImage) return

    setIsPending(true)
    setResult(null)

    try {
      // Extract base64 data without the data:image/jpeg;base64, prefix
      const base64 = capturedImage.split(",")[1]
      const actionResult = await registerFaceAction(persona.id, base64)

      if (actionResult.error) {
        setResult({ success: false, message: actionResult.error })
        toast.error(actionResult.error)
      } else {
        setResult({ success: true, message: "Rostro registrado exitosamente" })
        toast.success("Rostro registrado exitosamente")
      }
    } catch {
      setResult({ success: false, message: "Error al registrar rostro" })
      toast.error("Error al registrar rostro")
    } finally {
      setIsPending(false)
    }
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      stopCamera()
      setCapturedImage(null)
      setResult(null)
      setCameraError(null)
    }
    onOpenChange(openState)
  }

  if (!persona) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Registrar rostro</DialogTitle>
          <DialogDescription>
            Captura el rostro de{" "}
            <span className="font-semibold text-foreground">
              {persona.nombres} {persona.apellidos}
            </span>{" "}
            (DNI: {persona.dni})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video / Captured image / Error */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg border bg-muted">
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <VideoOff className="h-7 w-7 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">{cameraError}</p>
                <Button variant="outline" size="sm" onClick={startCamera}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Reintentar
                </Button>
              </div>
            ) : capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Captura de rostro"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Result feedback */}
          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.success
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.success && <Check className="mr-1.5 inline h-4 w-4" />}
              {result.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!capturedImage && !cameraError && (
            <Button onClick={handleCapture} disabled={!isStreaming}>
              <Camera className="mr-2 h-4 w-4" />
              Capturar
            </Button>
          )}

          {capturedImage && !result?.success && (
            <>
              <Button variant="outline" onClick={handleRetake} disabled={isPending}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retomar
              </Button>
              <Button onClick={handleRegister} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Registrar Rostro
              </Button>
            </>
          )}

          {result?.success && (
            <Button onClick={() => handleClose(false)}>
              <Check className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

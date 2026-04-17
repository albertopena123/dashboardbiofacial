"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, ScanFace, UserX, RotateCcw } from "lucide-react"
import { identifyFaceAction } from "../actions"
import { toast } from "sonner"

interface IdentifyResult {
  match: boolean
  persona_id?: number
  dni?: string
  nombres?: string
  apellidos?: string
  tipo?: string
  score?: number
  best_score?: number
}

interface IdentifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COUNTDOWN_SECONDS = 3

export function IdentifyDialog({ open, onOpenChange }: IdentifyDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionRef = useRef<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoCapturedRef = useRef(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [identifying, setIdentifying] = useState(false)
  const [result, setResult] = useState<IdentifyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const stopDetection = useCallback(() => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current)
      detectionRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const stopCamera = useCallback(() => {
    stopDetection()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
    setFaceDetected(false)
    setCountdown(null)
  }, [stopDetection])

  const doCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL("image/jpeg", 0.9)
  }, [])

  const startCamera = useCallback(async () => {
    setFaceDetected(false)
    setCountdown(null)
    autoCapturedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
      setResult(null)
      setError(null)
      setCapturedImage(null)
    } catch {
      setError("No se pudo acceder a la cámara. Verifica los permisos.")
    }
  }, [])

  const doIdentify = useCallback(async (dataUrl: string) => {
    const base64 = dataUrl.split(",")[1]
    setCapturedImage(dataUrl)
    setIdentifying(true)
    setResult(null)
    setError(null)

    const res = await identifyFaceAction(base64)
    setIdentifying(false)

    if (res.error) {
      setError(res.error)
      toast.error(res.error)
      return
    }

    if (res.data) {
      setResult(res.data)
      if (res.data.match) {
        toast.success(`Identificado: ${res.data.nombres} ${res.data.apellidos}`)
      } else {
        toast.info("No se encontró coincidencia")
      }
    }
  }, [])

  // Face detection loop
  useEffect(() => {
    if (!cameraActive || capturedImage || autoCapturedRef.current) return

    let faceStableCount = 0
    const STABLE_THRESHOLD = 8

    const detectFace = () => {
      if (!videoRef.current || !detectCanvasRef.current || autoCapturedRef.current) return

      const video = videoRef.current
      const canvas = detectCanvasRef.current
      const w = 160
      const h = 120
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, w, h)

      const centerX = w / 2
      const centerY = h * 0.46
      const rx = w * 0.28
      const ry = h * 0.35
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data

      let skinPixels = 0
      let totalPixels = 0

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = (x - centerX) / rx
          const dy = (y - centerY) / ry
          if (dx * dx + dy * dy > 1) continue

          totalPixels++
          const i = (y * w + x) * 4
          const r = data[i], g = data[i + 1], b = data[i + 2]

          if (r > 60 && g > 40 && b > 20 && r > g && r > b &&
              Math.abs(r - g) > 10 && r - b > 15 && r < 255 && g < 240) {
            skinPixels++
          }
        }
      }

      const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0
      const hasFace = skinRatio > 0.3

      if (hasFace) {
        faceStableCount++
        setFaceDetected(true)

        if (faceStableCount >= STABLE_THRESHOLD && !countdownRef.current && !autoCapturedRef.current) {
          let count = COUNTDOWN_SECONDS
          setCountdown(count)

          countdownRef.current = setInterval(() => {
            count--
            if (count <= 0) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current)
                countdownRef.current = null
              }
              setCountdown(null)
              autoCapturedRef.current = true

              const dataUrl = doCapture()
              if (dataUrl) {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((track) => track.stop())
                  streamRef.current = null
                }
                setCameraActive(false)
                setFaceDetected(false)
                doIdentify(dataUrl)
              }
            } else {
              setCountdown(count)
            }
          }, 1000)
        }
      } else {
        faceStableCount = 0
        setFaceDetected(false)

        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
          setCountdown(null)
        }
      }

      detectionRef.current = requestAnimationFrame(detectFace)
    }

    const timeout = setTimeout(() => {
      detectionRef.current = requestAnimationFrame(detectFace)
    }, 500)

    return () => {
      clearTimeout(timeout)
      stopDetection()
    }
  }, [cameraActive, capturedImage, doCapture, doIdentify, stopDetection])

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [open, startCamera, stopCamera])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setCapturedImage(null)
    autoCapturedRef.current = false
    startCamera()
  }, [startCamera])

  const handleOpenChange = useCallback(
    (val: boolean) => {
      if (!val) {
        stopCamera()
        setResult(null)
        setError(null)
        setCapturedImage(null)
        autoCapturedRef.current = false
      }
      onOpenChange(val)
    },
    [onOpenChange, stopCamera]
  )

  const ovalStroke = faceDetected ? "#22c55e" : "white"
  const statusText = countdown !== null
    ? `Capturando en ${countdown}...`
    : faceDetected
    ? "Rostro detectado, no te muevas"
    : "Coloca tu rostro dentro del óvalo"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanFace className="h-5 w-5" />
            Identificar Rostro
          </DialogTitle>
          <DialogDescription>
            Coloca tu rostro en el óvalo para identificarte automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${cameraActive ? "" : "hidden"}`}
            />

            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 260" className="h-[75%] w-auto">
                  <defs>
                    <mask id="face-mask-identify">
                      <rect width="200" height="260" fill="white" />
                      <ellipse cx="100" cy="120" rx="72" ry="92" fill="black" />
                    </mask>
                  </defs>
                  <rect
                    width="200"
                    height="260"
                    fill="rgba(0,0,0,0.5)"
                    mask="url(#face-mask-identify)"
                  />
                  <ellipse
                    cx="100"
                    cy="120"
                    rx="72"
                    ry="92"
                    fill="none"
                    stroke={ovalStroke}
                    strokeWidth="2.5"
                    strokeDasharray={faceDetected ? "0" : "8 4"}
                    style={{ transition: "stroke 0.3s, stroke-dasharray 0.3s" }}
                  />
                </svg>

                {countdown !== null && (
                  <span className="absolute text-6xl font-bold text-white drop-shadow-lg">
                    {countdown}
                  </span>
                )}

                <p className={`absolute bottom-4 text-center text-xs font-medium drop-shadow-md ${
                  faceDetected ? "text-emerald-400" : "text-white"
                }`}>
                  {statusText}
                </p>
              </div>
            )}

            {capturedImage && !cameraActive && (
              <img
                src={capturedImage}
                alt="Captura"
                className="h-full w-full object-cover"
              />
            )}

            {identifying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm font-medium">Identificando...</span>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={detectCanvasRef} className="hidden" />

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className={result.match ? "border-emerald-500/50" : "border-red-500/50"}>
              <CardContent className="p-4">
                {result.match ? (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-emerald-500/10 text-lg font-semibold text-emerald-600">
                        {result.nombres?.charAt(0)}
                        {result.apellidos?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {result.nombres} {result.apellidos}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>DNI: {result.dni}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {result.tipo}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">
                        {((result.score ?? 0) * 100).toFixed(1)}%
                      </p>
                      <p className="text-[11px] text-muted-foreground">confianza</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                      <UserX className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">No se encontró coincidencia</p>
                      <p className="text-sm text-muted-foreground">
                        Mejor score: {((result.best_score ?? 0) * 100).toFixed(1)}%
                        (umbral: 85%)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Retry */}
          {(result || error) && !identifying && (
            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

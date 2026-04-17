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
import { Check, RotateCcw, Loader2, VideoOff } from "lucide-react"
import { revalidatePersonas } from "../actions"
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

// Las instrucciones usan referencia visual en pantalla (no anatómica)
// porque la cámara es espejo. "Gira hacia la flecha" es más intuitivo.
const POSES = [
  { label: "Mira de frente a la cámara", icon: "⬤", arrowDir: null },
  { label: "Gira ligeramente tu cabeza al lado derecho", icon: "D", arrowDir: null },
  { label: "Gira ligeramente tu cabeza al lado izquierdo", icon: "I", arrowDir: null },
] as const

const CAPTURES_PER_POSE = 3
const CAPTURE_INTERVAL_MS = 600

const STEP_LABELS = ["Frente", "Derecha", "Izquierda"]

export function WebcamDialog({
  open,
  onOpenChange,
  persona,
}: WebcamDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionRef = useRef<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const processingRef = useRef(false)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Multi-pose state
  const [currentPose, setCurrentPose] = useState(0)
  const [capturePhase, setCapturePhase] = useState(0)
  const [allCaptures, setAllCaptures] = useState<string[]>([])
  const [posePreviews, setPosePreviews] = useState<(string | null)[]>([null, null, null])

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

  const doCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.9)
  }, [])

  const stopCamera = useCallback(() => {
    stopDetection()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    setFaceDetected(false)
    setCountdown(null)
  }, [stopDetection])

  const doRegister = useCallback(async (captures: string[]) => {
    if (!persona || captures.length === 0) return

    setIsPending(true)
    try {
      const images = captures.map((c) => c.split(",")[1])

      const res = await fetch("/api/faces/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: persona.id,
          images_base64: images,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setResult({ success: false, message: data.message || "Error al registrar rostro" })
        toast.error(data.message || "Error al registrar rostro")
      } else {
        setResult({
          success: true,
          message: `Rostro registrado con ${captures.length} capturas multi-pose`,
        })
        toast.success(`Rostro registrado (${captures.length} capturas, 3 poses)`)
        revalidatePersonas()
      }
    } catch {
      setResult({ success: false, message: "Error al registrar rostro" })
      toast.error("Error al registrar rostro")
    } finally {
      setIsPending(false)
    }
  }, [persona])

  const doPoseCapture = useCallback(async () => {
    processingRef.current = true
    const captures: string[] = []

    for (let i = 0; i < CAPTURES_PER_POSE; i++) {
      setCapturePhase(i + 1)
      const dataUrl = doCapture()
      if (dataUrl) captures.push(dataUrl)
      if (i < CAPTURES_PER_POSE - 1) {
        await new Promise((r) => setTimeout(r, CAPTURE_INTERVAL_MS))
      }
    }

    setCapturePhase(0)

    const preview = captures[Math.floor(captures.length / 2)] || captures[0] || null
    setPosePreviews((prev) => {
      const next = [...prev]
      next[currentPose] = preview
      return next
    })

    const newAllCaptures = [...allCaptures, ...captures]
    setAllCaptures(newAllCaptures)

    const nextPose = currentPose + 1

    if (nextPose < POSES.length) {
      setCurrentPose(nextPose)
      setFaceDetected(false)
      setCountdown(null)
      processingRef.current = false
    } else {
      stopCamera()
      await doRegister(newAllCaptures)
    }
  }, [doCapture, currentPose, allCaptures, stopCamera, doRegister])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setResult(null)
    setFaceDetected(false)
    setCountdown(null)
    setCapturePhase(0)
    setCurrentPose(0)
    setAllCaptures([])
    setPosePreviews([null, null, null])
    processingRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
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

  // Face detection loop
  useEffect(() => {
    if (!isStreaming || processingRef.current || result) return

    let faceStableCount = 0
    const STABLE_THRESHOLD = 10

    const detectFace = () => {
      if (!videoRef.current || !detectCanvasRef.current || processingRef.current) return

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

        if (faceStableCount >= STABLE_THRESHOLD && !countdownRef.current && !processingRef.current) {
          let count = 2
          setCountdown(count)

          countdownRef.current = setInterval(() => {
            count--
            if (count <= 0) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current)
                countdownRef.current = null
              }
              setCountdown(null)
              doPoseCapture()
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
  }, [isStreaming, result, doPoseCapture, stopDetection])

  // Start camera when dialog opens
  useEffect(() => {
    if (open && persona) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [open, persona, startCamera, stopCamera])

  function handleRetake() {
    setResult(null)
    processingRef.current = false
    startCamera()
  }

  function handleClose(openState: boolean) {
    if (!openState) {
      stopCamera()
      setResult(null)
      setCameraError(null)
      setAllCaptures([])
      setPosePreviews([null, null, null])
      processingRef.current = false
    }
    onOpenChange(openState)
  }

  if (!persona) return null

  const pose = POSES[currentPose]
  const ovalStroke = capturePhase > 0
    ? "#3b82f6"
    : faceDetected
    ? "#22c55e"
    : "white"

  const statusText = capturePhase > 0
    ? `Capturando pose ${currentPose + 1}/${POSES.length}...`
    : countdown !== null
    ? `${countdown}...`
    : faceDetected
    ? "No te muevas"
    : pose.label

  const showCamera = isStreaming && !result

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Registrar rostro</DialogTitle>
          <DialogDescription>
            Registro multi-pose de{" "}
            <span className="font-semibold text-foreground">
              {persona.nombres} {persona.apellidos}
            </span>{" "}
            (DNI: {persona.dni}).
            Se capturarán 3 poses para un template de alta calidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step progress */}
          {!result && (
            <div className="flex items-center justify-center gap-1">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        i < currentPose
                          ? "bg-emerald-500 text-white"
                          : i === currentPose
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < currentPose ? "✓" : i + 1}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`mx-1 mb-4 h-0.5 w-8 ${
                      i < currentPose ? "bg-emerald-500" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}

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
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${showCamera ? "" : "hidden"}`}
                />

                {!showCamera && posePreviews[2] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={posePreviews[2]}
                    alt="Captura"
                    className="h-full w-full object-cover"
                  />
                )}

                {showCamera && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 260" className="h-[75%] w-auto">
                      <defs>
                        <mask id="face-mask-register">
                          <rect width="200" height="260" fill="white" />
                          <ellipse cx="100" cy="120" rx="72" ry="92" fill="black" />
                        </mask>
                      </defs>
                      <rect
                        width="200"
                        height="260"
                        fill="rgba(0,0,0,0.5)"
                        mask="url(#face-mask-register)"
                      />
                      <ellipse
                        cx="100"
                        cy="120"
                        rx="72"
                        ry="92"
                        fill="none"
                        stroke={ovalStroke}
                        strokeWidth="2.5"
                        strokeDasharray={faceDetected || capturePhase > 0 ? "0" : "8 4"}
                        style={{ transition: "stroke 0.3s, stroke-dasharray 0.3s" }}
                      />

                      {/* Direction arrow - points to where the user should look on screen */}
                      {pose.arrowDir && !faceDetected && capturePhase === 0 && (
                        <g>
                          {pose.arrowDir === "right" && (
                            <polygon
                              points="185,120 165,108 165,132"
                              fill="white"
                              opacity="0.9"
                            />
                          )}
                          {pose.arrowDir === "left" && (
                            <polygon
                              points="15,120 35,108 35,132"
                              fill="white"
                              opacity="0.9"
                            />
                          )}
                        </g>
                      )}
                    </svg>

                    {countdown !== null && (
                      <span className="absolute text-6xl font-bold text-white drop-shadow-lg">
                        {countdown}
                      </span>
                    )}

                    {capturePhase > 0 && (
                      <div className="absolute inset-0 animate-pulse bg-white/20" />
                    )}

                    <p className={`absolute bottom-4 left-0 right-0 text-center text-xs font-medium drop-shadow-md ${
                      capturePhase > 0
                        ? "text-blue-400"
                        : faceDetected
                        ? "text-emerald-400"
                        : "text-white"
                    }`}>
                      {statusText}
                    </p>

                    <div className="absolute top-4 left-0 right-0 text-center">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                        Pose {currentPose + 1}/{POSES.length}: {pose.label}
                      </span>
                    </div>
                  </div>
                )}

                {isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm font-medium">
                        Procesando {allCaptures.length} capturas multi-pose...
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={detectCanvasRef} className="hidden" />
          </div>

          {/* Pose thumbnails */}
          <div className="flex items-center justify-center gap-3">
            {POSES.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    posePreviews[i]
                      ? "border-emerald-500"
                      : i === currentPose && isStreaming
                      ? "border-primary"
                      : "border-muted-foreground/20"
                  }`}
                >
                  {posePreviews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={posePreviews[i]!}
                      alt={`Pose ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-lg">
                      {p.icon}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {STEP_LABELS[i]}
                </span>
              </div>
            ))}
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
          {result && !result.success && (
            <Button variant="outline" onClick={handleRetake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
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

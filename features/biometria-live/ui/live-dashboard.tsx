"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Radio, Wifi, WifiOff, ScanFace, Clock, Camera } from "lucide-react"
import { IdentifyDialog } from "./identify-dialog"

interface BiometricEvent {
  persona_id: number
  dni: string
  nombres: string
  apellidos: string
  tipo: string
  score: number
  foto_url: string | null
  camara: string
  timestamp: string
}

const MAX_EVENTS = 50
const ease = [0.22, 1, 0.36, 1] as const

function getInitials(nombres: string, apellidos: string) {
  const first = nombres.charAt(0).toUpperCase()
  const last = apellidos.charAt(0).toUpperCase()
  return `${first}${last}`
}

function scoreColor(score: number) {
  if (score > 0.95) return "text-emerald-600 dark:text-emerald-400"
  if (score > 0.85) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function scoreBg(score: number) {
  if (score > 0.95) return "bg-emerald-500/10"
  if (score > 0.85) return "bg-yellow-500/10"
  return "bg-red-500/10"
}

function tipoBadgeVariant(tipo: string) {
  switch (tipo) {
    case "trabajador":
      return "default" as const
    case "estudiante":
      return "secondary" as const
    case "postulante":
      return "outline" as const
    default:
      return "outline" as const
  }
}

function relativeTime(timestamp: string) {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = Math.max(0, Math.floor((now - then) / 1000))

  if (diff < 5) return "ahora"
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

// --- Stats Cards ---
function StatsCards({
  totalHoy,
  ultimaDeteccion,
  connected,
}: {
  totalHoy: number
  ultimaDeteccion: string | null
  connected: boolean
}) {
  const cards = [
    {
      label: "Detecciones hoy",
      value: String(totalHoy),
      icon: ScanFace,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Última detección",
      value: ultimaDeteccion ? relativeTime(ultimaDeteccion) : "---",
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Conexión WebSocket",
      value: connected ? "Conectado" : "Desconectado",
      icon: connected ? Wifi : WifiOff,
      color: connected
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400",
      bg: connected ? "bg-emerald-500/10" : "bg-red-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06, ease }}
        >
          <Card className="py-2 sm:py-3">
            <CardContent className="flex items-center gap-2 px-3 py-0 sm:gap-3 sm:px-4">
              <div
                className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex ${card.bg}`}
              >
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight sm:text-2xl">
                  {card.value}
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {card.label}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// --- Event Card ---
function EventCard({ event }: { event: BiometricEvent }) {
  const [, setTick] = useState(0)

  // Re-render every 10 seconds to update relative time
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease }}
    >
      <Card className="py-2">
        <CardContent className="flex items-center gap-3 px-3 py-0 sm:px-4">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(event.nombres, event.apellidos)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {event.apellidos}, {event.nombres}
              </p>
              <Badge variant={tipoBadgeVariant(event.tipo)} className="shrink-0 text-[10px]">
                {event.tipo}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>DNI: {event.dni}</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{event.camara}</span>
            </div>
          </div>

          <div className="hidden flex-col items-end gap-1 sm:flex">
            <Badge
              variant="outline"
              className={`gap-1 font-mono text-xs ${scoreColor(event.score)} ${scoreBg(event.score)}`}
            >
              {(event.score * 100).toFixed(1)}%
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {relativeTime(event.timestamp)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1 sm:hidden">
            <span className={`text-xs font-semibold ${scoreColor(event.score)}`}>
              {(event.score * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              {relativeTime(event.timestamp)}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// --- Main Component ---
export function LiveDashboard() {
  const [events, setEvents] = useState<BiometricEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [identifyOpen, setIdentifyOpen] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)

  const connect = useCallback(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_BIOAPI_WS_URL || "ws://localhost:8000/ws/eventos"

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectAttemptRef.current = 0
      }

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as BiometricEvent
          setEvents((prev) => [data, ...prev].slice(0, MAX_EVENTS))
        } catch {
          // Ignore invalid messages
        }
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttemptRef.current),
          30000
        )
        reconnectAttemptRef.current += 1
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // Connection failed, schedule retry
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        30000
      )
      reconnectAttemptRef.current += 1
      reconnectTimeoutRef.current = setTimeout(connect, delay)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const totalHoy = events.length
  const ultimaDeteccion = events.length > 0 ? events[0].timestamp : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Biometria en Vivo
            </h1>
            <span className="relative flex h-3 w-3">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  connected ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Detecciones biometricas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIdentifyOpen(true)} size="sm" className="gap-2">
            <Camera className="h-4 w-4" />
            Identificar rostro
          </Button>
          <Badge
            variant={connected ? "default" : "destructive"}
            className="gap-1"
          >
            {connected ? (
              <>
                <Radio className="h-3 w-3" /> En vivo
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> Desconectado
              </>
            )}
          </Badge>
        </div>
      </motion.div>

      {/* Stats */}
      <StatsCards
        totalHoy={totalHoy}
        ultimaDeteccion={ultimaDeteccion}
        connected={connected}
      />

      {/* Events Feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanFace className="h-4 w-4" />
              Detecciones recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <ScanFace className="h-7 w-7 text-muted-foreground/60" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">
                    Esperando detecciones...
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/70">
                    Las detecciones apareceran aqui en tiempo real
                  </p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {events.map((event, i) => (
                  <EventCard
                    key={`${event.persona_id}-${event.timestamp}-${i}`}
                    event={event}
                  />
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <IdentifyDialog open={identifyOpen} onOpenChange={setIdentifyOpen} />
    </div>
  )
}

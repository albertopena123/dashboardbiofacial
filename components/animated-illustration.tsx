"use client"

import { useRef, useEffect } from "react"
import { motion, useInView } from "motion/react"
import { DotLottie } from "@lottiefiles/dotlottie-web"

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Filter out the "using deprecated parameters" console.warn from
 * dotlottie-web's internal WASM loader (library bug in v0.67.0).
 */
if (typeof console !== "undefined") {
  const _origWarn = console.warn
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("deprecated parameters for the initialization")
    )
      return
    _origWarn.apply(console, args)
  }
}

interface LottieIllustrationProps {
  src: string
  className?: string
  speed?: number
}

export function LottieIllustration({
  src,
  className = "",
  speed = 1,
}: LottieIllustrationProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotLottieRef = useRef<DotLottie | null>(null)

  const isNearViewport = useInView(wrapperRef, {
    once: true,
    margin: "200px 0px 200px 0px",
  })

  const isInView = useInView(wrapperRef, {
    once: false,
    margin: "0px 0px -60px 0px",
  })

  useEffect(() => {
    if (!isNearViewport || !canvasRef.current || dotLottieRef.current) return

    const dl = new DotLottie({
      canvas: canvasRef.current,
      src,
      autoplay: false,
      loop: true,
      speed,
      renderConfig: {
        autoResize: true,
        devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      },
      layout: {
        fit: "contain",
        align: [0.5, 0.5],
      },
    })

    dotLottieRef.current = dl

    return () => {
      dl.destroy()
      dotLottieRef.current = null
    }
  }, [isNearViewport, src, speed])

  // Play only when visible, pause when off-screen
  useEffect(() => {
    const dl = dotLottieRef.current
    if (!dl) return

    if (isInView) {
      dl.play()
    } else {
      dl.pause()
    }
  }, [isInView, isNearViewport])

  return (
    <motion.div
      ref={wrapperRef}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.7, ease }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          display: "block",
          contain: "layout style paint",
        }}
      />
    </motion.div>
  )
}

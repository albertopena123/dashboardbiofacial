"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useMotionValueEvent } from "motion/react"
import Link from "next/link"
import { Building2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const HIDE_DISTANCE = 40
const SHOW_DISTANCE = 15

export function SmartHeader() {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  const lastY = useRef(0)
  const dir = useRef<"up" | "down">("up")
  const acc = useRef(0)
  const hiddenRef = useRef(false)
  const scrolledRef = useRef(false)

  useMotionValueEvent(scrollY, "change", (current) => {
    const delta = current - lastY.current
    if (delta === 0) return
    lastY.current = current

    const newDir = delta > 0 ? "down" : "up"
    if (newDir !== dir.current) {
      acc.current = 0
      dir.current = newDir
    }
    acc.current += Math.abs(delta)

    const shouldScroll = current > 10
    if (shouldScroll !== scrolledRef.current) {
      scrolledRef.current = shouldScroll
      setScrolled(shouldScroll)
    }

    if (current <= 10) {
      if (hiddenRef.current) { hiddenRef.current = false; setHidden(false) }
      acc.current = 0
    } else if (dir.current === "down" && acc.current >= HIDE_DISTANCE && current > 80) {
      if (!hiddenRef.current) { hiddenRef.current = true; setHidden(true) }
      acc.current = 0
    } else if (dir.current === "up" && acc.current >= SHOW_DISTANCE) {
      if (hiddenRef.current) { hiddenRef.current = false; setHidden(false) }
      acc.current = 0
    }
  })

  return (
    <motion.header
      animate={hidden ? "hidden" : "visible"}
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "transition-[background-color,border-color,box-shadow] duration-200 ease-out",
        scrolled
          ? "border-b bg-background shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              UNAMAD
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Universidad Nacional Amazónica de Madre de Dios
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button className="rounded-xl px-5 font-semibold shadow-sm transition-[transform,box-shadow] duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]">
              <LogIn className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}

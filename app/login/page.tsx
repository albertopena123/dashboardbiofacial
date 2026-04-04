"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  Lock,
  IdCard,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { LottieIllustration } from "@/components/animated-illustration"
import { loginAction } from "./actions"

const ease = [0.22, 1, 0.36, 1] as const

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — branding + illustration */}
      <div className="relative hidden w-1/2 overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        {/* Animated blobs — pure CSS */}
        <div className="pointer-events-none absolute inset-0 [contain:strict]">
          <div className="blob-animate-1 absolute -top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-white/5 blur-2xl" />
          <div className="blob-animate-2 absolute -bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-primary-foreground transition-transform duration-200 group-hover:scale-105">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-primary-foreground">
                UNAMAD
              </span>
            </Link>
          </motion.div>

          {/* Center illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="flex justify-center"
          >
            <LottieIllustration
              src="https://assets1.lottiefiles.com/packages/lf20_xlmz9xwm.json"
              className="w-full max-w-xs xl:max-w-sm"
              speed={0.8}
            />
          </motion.div>

          {/* Text + footer */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease }}
              className="space-y-3"
            >
              <h2 className="text-2xl font-extrabold leading-tight text-primary-foreground xl:text-3xl">
                Sistema de Gestión
                <br />
                Integral
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-primary-foreground/60">
                Plataforma centralizada de gestión administrativa y académica de
                la Universidad Nacional Amazónica de Madre de Dios.
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs text-primary-foreground/40"
            >
              &copy; 2026 UNAMAD. Todos los derechos reservados.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex w-full flex-col overflow-hidden lg:w-1/2">
        {/* Subtle animated blob */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden [contain:strict]">
          <div className="blob-animate-2 absolute top-1/4 right-0 h-[250px] w-[250px] rounded-full bg-primary/3 blur-2xl" />
        </div>

        <div className="relative flex items-center justify-between p-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Volver al inicio
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="w-full max-w-sm"
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">UNAMAD</span>
            </div>

            <div className="mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease }}
                className="text-2xl font-bold tracking-tight"
              >
                Iniciar Sesión
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease }}
                className="mt-2 text-sm text-muted-foreground"
              >
                Ingresa tu número de documento y contraseña
              </motion.p>
            </div>

            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
              <CardContent className="p-0 lg:p-6">
                {state?.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {state.error}
                  </motion.div>
                )}

                <form action={formAction} className="space-y-5">
                  {/* Document number */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.25, ease }}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="documentNumber"
                      className="text-sm font-medium leading-none"
                    >
                      Número de documento
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="documentNumber"
                        name="documentNumber"
                        type="text"
                        placeholder="N° de documento"
                        required
                        autoComplete="username"
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3, ease }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium leading-none"
                      >
                        Contraseña
                      </label>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="h-11 rounded-xl pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.35, ease }}
                  >
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-11 w-full rounded-xl font-semibold transition-[transform,box-shadow] duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isPending ? (
                        <motion.div
                          className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        "Ingresar"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
              className="mt-6 text-center text-xs text-muted-foreground"
            >
              ¿Problemas para acceder?{" "}
              <button
                type="button"
                className="font-medium text-foreground transition-colors hover:underline"
              >
                Contactar soporte
              </button>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

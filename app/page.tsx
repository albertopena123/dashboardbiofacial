import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Globe,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
  ExternalLink,
  BarChart,
  Blocks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmartHeader } from "@/components/smart-header";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { LottieIllustration } from "@/components/animated-illustration";

const systemStats = [
  {
    title: "Facultades",
    value: "4",
    icon: Building2,
    description: "Facultades activas",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Carreras",
    value: "12",
    icon: GraduationCap,
    description: "Programas académicos",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Estudiantes",
    value: "3,500+",
    icon: Users,
    description: "Estudiantes matriculados",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Docentes",
    value: "180+",
    icon: BookOpen,
    description: "Personal docente",
    gradient: "from-emerald-500/10 to-green-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
];

const quickLinks = [
  { title: "Portal Web", href: "#", icon: Globe, desc: "Sitio oficial" },
  { title: "Directorio", href: "#", icon: Phone, desc: "Contactos internos" },
  {
    title: "Correo Institucional",
    href: "#",
    icon: Mail,
    desc: "Acceso al email",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SmartHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b pt-16">
        {/* Animated background blobs — pure CSS, zero JS */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden [contain:strict]">
          <div className="blob-animate-1 absolute -top-1/3 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/5 blur-2xl" />
          <div className="blob-animate-2 absolute -bottom-1/4 right-0 h-[300px] w-[300px] rounded-full bg-violet-500/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Text content */}
            <div>
              <AnimateOnScroll>
                <Badge
                  variant="secondary"
                  className="mb-6 rounded-full px-4 py-1.5 text-sm font-medium"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Sistema de Gestión Integral
                </Badge>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <h2 className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
                  Panel de Información
                </h2>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  Plataforma centralizada de gestión administrativa y académica
                  de la Universidad Nacional Amazónica de Madre de Dios.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={300}>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="group rounded-xl px-8 font-semibold shadow-lg transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Acceder al Sistema
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Conocer más
                  </Button>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Lottie Illustration */}
            <div className="flex justify-center lg:justify-end">
              <LottieIllustration
                src="https://assets1.lottiefiles.com/packages/lf20_xlmz9xwm.json"
                className="w-full max-w-md lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="mb-10 text-center">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                En cifras
              </h3>
              <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Nuestra Universidad
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {systemStats.map((stat, i) => (
              <AnimateOnScroll key={stat.title} delay={i * 100}>
                <Card className="group relative overflow-hidden border transition-[transform,box-shadow,border-color] duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-foreground/10">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`rounded-lg bg-muted p-2 transition-colors duration-300 group-hover:bg-background ${stat.iconColor}`}
                    >
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-extrabold tracking-tight">
                      {stat.value}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Features with illustration */}
      <section className="relative border-b overflow-hidden">
        {/* Animated background blobs — pure CSS */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden [contain:strict]">
          <div className="blob-animate-2 absolute -top-1/4 -left-1/4 h-[350px] w-[350px] rounded-full bg-blue-500/4 blur-2xl" />
          <div className="blob-animate-1 absolute -bottom-1/4 -right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/4 blur-2xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex justify-center lg:justify-start">
              <LottieIllustration
                src="https://assets10.lottiefiles.com/packages/lf20_5tl1xxnz.json"
                className="w-full max-w-sm lg:max-w-md"
              />
            </div>

            <div>
              <AnimateOnScroll delay={100}>
                <Badge
                  variant="outline"
                  className="mb-4 rounded-full px-3 py-1 text-xs font-medium"
                >
                  Plataforma Modular
                </Badge>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Gestión centralizada para toda la universidad
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Administra módulos de manera independiente: usuarios,
                  documentos, reportes, y más. Cada módulo se adapta a las
                  necesidades específicas de cada área.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll delay={200}>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: Shield,
                      title: "Control de Acceso",
                      desc: "Roles y permisos por módulo",
                    },
                    {
                      icon: Users,
                      title: "Multi-usuario",
                      desc: "Gestión de personal y estudiantes",
                    },
                    {
                      icon: BarChart,
                      title: "Reportes",
                      desc: "Estadísticas en tiempo real",
                    },
                    {
                      icon: Blocks,
                      title: "Modular",
                      desc: "Activa solo lo que necesitas",
                    },
                  ].map((feature) => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 rounded-xl p-3"
                    >
                      <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                        <feature.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Info + Quick Links */}
      <section className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Información institucional */}
            <AnimateOnScroll className="lg:col-span-2">
              <Card className="h-full transition-[box-shadow] duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building2 className="h-5 w-5 text-primary" />
                    Información Institucional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        icon: MapPin,
                        label: "Dirección",
                        value:
                          "Av. Jorge Chávez 1160, Puerto Maldonado, Madre de Dios",
                      },
                      {
                        icon: Phone,
                        label: "Teléfono",
                        value: "(082) 571-046",
                      },
                      {
                        icon: Mail,
                        label: "Correo",
                        value: "informes@unamad.edu.pe",
                      },
                      {
                        icon: Clock,
                        label: "Horario de Atención",
                        value: "Lunes a Viernes, 8:00 AM - 4:00 PM",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="group flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-muted/50"
                      >
                        <div className="mt-0.5 rounded-lg bg-muted p-2 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Enlaces rápidos */}
            <AnimateOnScroll delay={150}>
              <Card className="h-full transition-[box-shadow] duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Globe className="h-5 w-5 text-primary" />
                    Enlaces Rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickLinks.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      className="group flex items-center gap-3 rounded-xl p-3 transition-[background-color] duration-200 hover:bg-muted/50"
                    >
                      <div className="rounded-lg bg-muted p-2 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                        <link.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{link.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {link.desc}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </a>
                  ))}

                  <div className="pt-4">
                    <Link href="/login" className="block">
                      <Button
                        variant="outline"
                        className="group w-full rounded-xl font-semibold transition-[transform,background-color,color] duration-200 hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Acceso Administrativo
                        <ArrowRight className="ml-auto h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 [contain:strict]">
              <div className="blob-animate-1 absolute -top-1/4 right-0 h-[250px] w-[250px] rounded-full bg-white/5 blur-2xl" />
              <div className="blob-animate-2 absolute -bottom-1/4 left-0 h-[200px] w-[200px] rounded-full bg-white/5 blur-2xl" />
            </div>

            <div className="relative grid items-center gap-8 lg:grid-cols-2">
              <AnimateOnScroll>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
                    Comienza a gestionar hoy
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-primary-foreground/70">
                    Accede al sistema y optimiza los procesos administrativos y
                    académicos de tu facultad.
                  </p>
                  <div className="mt-8">
                    <Link href="/login">
                      <Button
                        size="lg"
                        variant="secondary"
                        className="group rounded-xl px-8 font-semibold shadow-lg transition-[transform,box-shadow] duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Iniciar Sesión
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </AnimateOnScroll>

              <div className="flex justify-center lg:justify-end">
                <LottieIllustration
                  src="https://assets3.lottiefiles.com/packages/lf20_tno6cg2w.json"
                  className="w-full max-w-xs sm:max-w-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold">UNAMAD</span>
            </div>
            <div className="text-center text-sm text-muted-foreground sm:text-right">
              <p>
                &copy; 2026 Universidad Nacional Amazónica de Madre de Dios.
                Todos los derechos reservados.
              </p>
              <p className="mt-1 text-xs">
                Animaciones por{" "}
                <a
                  href="https://lottiefiles.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-muted-foreground/30 underline-offset-2 transition-colors hover:text-foreground"
                >
                  LottieFiles
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

# Dashboard Biometrico UNAMAD

## Que es esto
Panel administrativo del sistema biometrico centralizado de la Universidad Nacional Amazonica de Madre de Dios (UNAMAD). Gestiona personas, API keys, eventos universitarios, y muestra identificaciones biometricas en tiempo real.

## Arquitectura del sistema completo
Tres componentes, dos repos, una sola BD PostgreSQL:

```
[Camaras IP RTSP] → [BioAPI Python (repo aparte)] → [PostgreSQL + pgvector]
                                                            ↑
                              [Este dashboard Next.js] ─────┘
                                                            ↑
                              [Sistemas externos via API Key]
```

- **Este repo (Dashboard)**: Next.js 16 + Prisma. Panel admin visual. CRUD de personas, gestion de API keys, dashboard tiempo real, eventos.
- **BioAPI (repo aparte)**: FastAPI + InsightFace. Motor biometrico puro. Este dashboard le envia fotos y recibe resultados.
- **PostgreSQL + pgvector**: BD unica. Ambos servicios acceden a las mismas tablas.

## Stack
- Next.js 16, React 19, TypeScript
- Prisma 7 con PrismaPg adapter
- TailwindCSS v4, shadcn/ui (Radix), motion (Framer Motion)
- CASL para autorizacion (AbilityJS)
- jose para JWT sessions
- Recharts para graficos

## Estructura y patrones

### Rutas
```
app/admin/
├── page.tsx                    # Dashboard home
├── usuarios/                   # CRUD usuarios del sistema
├── roles/                      # CRUD roles y permisos
├── modulos/                    # Gestion de modulos
├── personas/                   # Registro biometrico de personas
├── sistemas-externos/          # Gestion de API Keys
├── biometria-live/             # Dashboard tiempo real (WebSocket)
├── eventos/                    # Eventos universitarios
└── configuracion/              # Perfil y settings
```

### Patron de features (seguir siempre)
```
entities/{nombre}/
├── api.ts          # Solo queries de lectura con Prisma (select, pagination)
└── model.ts        # Interfaces TypeScript

features/{nombre}/
├── actions.ts      # Server actions "use server" + withPermission() HOF
└── ui/
    ├── {nombre}-table.tsx        # Componente principal: stats + filtros + tabla + paginacion
    ├── {nombre}-dialog.tsx       # Dialog crear/editar con useActionState
    ├── {nombre}-delete-dialog.tsx
    └── {nombre}-detail-sheet.tsx
```

### Reglas de desarrollo
- Pages son server components que fetchean data y la pasan a client components
- Mutations SOLO via server actions en features/{nombre}/actions.ts
- SIEMPRE envolver actions con `withPermission(action, subject, fn)`
- SIEMPRE llamar `revalidatePath()` despues de mutaciones
- Client components usan `useActionState` para formularios
- Usar `useAbility()` de CASL para mostrar/ocultar botones segun permisos
- DB via `import { db } from "@/shared/lib/db"` (singleton Prisma)

### Permisos CASL
Subjects: User, Role, Module, Setting, Dashboard, Report, Document, Institution, Notification, Persona, SistemaExterno, Biometria, Evento
Actions: create, read, update, delete, manage, export

### Conexion con BioAPI
```
# .env
BIOAPI_URL=http://localhost:8000        # Server-side (server actions)
BIOAPI_KEY=sk_live_xxxxx                # API key del dashboard
NEXT_PUBLIC_BIOAPI_WS_URL=ws://...      # Client-side (WebSocket tiempo real)
```

- Server actions llaman a FastAPI via fetch con X-API-Key header
- El componente biometria-live se conecta por WebSocket nativo para eventos en tiempo real
- El dashboard NO valida API keys, solo las crea/gestiona en la BD

## Comandos
```bash
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

## Reglas
- Mantenido por una sola persona, mantener simple
- Sin capas intermedias innecesarias
- Seguir los patrones existentes exactamente
- shadcn/ui + Tailwind para todo el UI
- Animaciones con motion (motion/react)
- Notificaciones con sonner (toast)

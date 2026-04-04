import { getEventos, getPersonasForEventoSelect } from "@/entities/evento/api"
import { EventosTable } from "@/features/eventos/ui/eventos-table"

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const [data, allPersonas] = await Promise.all([
    getEventos({
      search: params.search?.slice(0, 100),
      activo: params.activo,
      page: Math.max(1, Number(params.page) || 1),
      pageSize: [10, 20, 50].includes(Number(params.pageSize))
        ? Number(params.pageSize)
        : 10,
    }),
    getPersonasForEventoSelect(),
  ])

  return <EventosTable data={data} allPersonas={allPersonas} />
}

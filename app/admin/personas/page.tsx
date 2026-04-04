import { getPersonas } from "@/entities/persona/api"
import { PersonasTable } from "@/features/personas/ui/personas-table"

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const data = await getPersonas({
    search: params.search,
    tipo: params.tipo,
    activo: params.activo,
    page: Number(params.page) || 1,
    pageSize: [10, 20, 50].includes(Number(params.pageSize))
      ? Number(params.pageSize)
      : 10,
  })

  return <PersonasTable data={data} />
}

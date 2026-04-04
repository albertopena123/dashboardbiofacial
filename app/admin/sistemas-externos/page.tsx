import { getSistemasExternos } from "@/entities/sistema-externo/api"
import { SistemasTable } from "@/features/sistemas-externos/ui/sistemas-table"

export default async function SistemasExternosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const data = await getSistemasExternos({
    search: params.search?.slice(0, 100),
    activo: params.activo,
    page: Math.max(1, Number(params.page) || 1),
    pageSize: [10, 20, 50].includes(Number(params.pageSize))
      ? Number(params.pageSize)
      : 10,
  })

  return <SistemasTable data={data} />
}

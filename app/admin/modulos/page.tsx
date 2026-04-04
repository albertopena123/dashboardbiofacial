import { getModules } from "@/entities/module/api"
import { ModulesTable } from "@/features/modules/ui/modules-table"

export default async function ModulosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const data = await getModules({
    search: params.search,
    status: params.status,
    page: Number(params.page) || 1,
    pageSize: [10, 20, 50].includes(Number(params.pageSize))
      ? Number(params.pageSize)
      : 10,
  })

  return <ModulesTable data={data} />
}

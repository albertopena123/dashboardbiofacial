import { getRoles, getAllPermissions } from "@/entities/role/api"
import { RolesTable } from "@/features/roles/ui/roles-table"

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const [data, permissions] = await Promise.all([
    getRoles({
      search: params.search?.slice(0, 100),
      type: params.type,
      page: Math.max(1, Number(params.page) || 1),
      pageSize: [10, 20, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10,
    }),
    getAllPermissions(),
  ])

  return <RolesTable data={data} permissions={permissions} />
}

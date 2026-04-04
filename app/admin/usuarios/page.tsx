import { getUsers, getRolesForSelect } from "@/entities/user/api"
import { UsersTable } from "@/features/users/ui/users-table"

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams

  const [data, roles] = await Promise.all([
    getUsers({
      search: params.search,
      status: params.status,
      roleId: params.roleId,
      page: Number(params.page) || 1,
      pageSize: [10, 20, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10,
    }),
    getRolesForSelect(),
  ])

  return <UsersTable data={data} roles={roles} />
}

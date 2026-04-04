import { redirect } from "next/navigation"
import { getDashboardData } from "@/features/dashboard/api/data"
import { DashboardClient } from "@/features/dashboard/ui/dashboard-client"

export default async function AdminDashboard() {
  const data = await getDashboardData()
  if (!data) redirect("/login")

  return <DashboardClient data={data} />
}

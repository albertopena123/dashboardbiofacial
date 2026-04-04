"use server"

import { redirect } from "next/navigation"
import { deleteSession } from "@/features/auth/lib/session"

export async function logoutAction() {
  await deleteSession()
  redirect("/login")
}

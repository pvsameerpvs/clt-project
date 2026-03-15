import { redirect } from "next/navigation"
import { getAdminBaseUrl } from "@/lib/admin-url"

export default function CltDashboardAliasPage() {
  redirect(getAdminBaseUrl())
}

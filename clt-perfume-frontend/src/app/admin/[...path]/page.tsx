import { redirect } from "next/navigation"
import { buildAdminUrl } from "@/lib/admin-url"

export default async function AdminPathRedirectPage({
  params,
}: {
  params: Promise<{ path: string[] }>
}) {
  const { path } = await params
  const suffix = path.join("/")
  redirect(buildAdminUrl(suffix))
}

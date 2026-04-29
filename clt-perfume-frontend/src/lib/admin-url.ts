import { getAdminUrl } from "@/lib/public-config"

export function getAdminBaseUrl() {
  return getAdminUrl()
}

export function buildAdminUrl(path?: string) {
  const base = getAdminBaseUrl().replace(/\/$/, "")
  if (!path) return base
  const cleanPath = path.replace(/^\/+/, "")
  return `${base}/${cleanPath}`
}

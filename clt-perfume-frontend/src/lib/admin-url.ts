const DEFAULT_ADMIN_URL = "http://localhost:3001/dashboard"

export function getAdminBaseUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_URL || DEFAULT_ADMIN_URL
}

export function buildAdminUrl(path?: string) {
  const base = getAdminBaseUrl().replace(/\/$/, "")
  if (!path) return base
  const cleanPath = path.replace(/^\/+/, "")
  return `${base}/${cleanPath}`
}

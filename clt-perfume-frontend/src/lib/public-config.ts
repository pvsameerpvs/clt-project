export const PRODUCTION_SITE_URL = "https://cleparfum.com"
export const PRODUCTION_ADMIN_URL = "https://admin.cleparfum.com"
export const PRODUCTION_API_URL = "https://api.cleparfum.com"

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "")
}

export function getSiteUrl(origin?: string | null) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? origin || configuredUrl || PRODUCTION_SITE_URL
      : configuredUrl || PRODUCTION_SITE_URL

  return normalizeUrl(baseUrl)
}

export function getAdminUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_ADMIN_URL || PRODUCTION_ADMIN_URL)
}

export function getApiUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL)
}

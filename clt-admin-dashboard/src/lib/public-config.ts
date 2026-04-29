export const PRODUCTION_ADMIN_URL = "https://admin.cleparfum.com"
export const PRODUCTION_STOREFRONT_URL = "https://cleparfum.com"
export const PRODUCTION_API_URL = "https://api.cleparfum.com"

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "")
}

export function getAdminUrl() {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_ADMIN_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      PRODUCTION_ADMIN_URL
  )
}

export function getStorefrontUrl() {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
      PRODUCTION_STOREFRONT_URL
  )
}

export function getApiUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL)
}

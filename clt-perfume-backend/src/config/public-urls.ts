export const PRODUCTION_FRONTEND_URL = 'https://cleparfum.com'
export const PRODUCTION_ADMIN_URL = 'https://admin.cleparfum.com'

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, '')
}

function parseOrigins(value?: string) {
  return (value || '')
    .split(',')
    .map((origin) => normalizeUrl(origin.trim()))
    .filter(Boolean)
}

export function getFrontendUrl() {
  return normalizeUrl(process.env.FRONTEND_URL || PRODUCTION_FRONTEND_URL)
}

export function getAllowedOrigins() {
  const configuredOrigins = parseOrigins(process.env.FRONTEND_URLS)

  if (configuredOrigins.length > 0) {
    return Array.from(new Set(configuredOrigins))
  }

  return Array.from(new Set([getFrontendUrl(), PRODUCTION_ADMIN_URL]))
}

export function buildFrontendUrl(path = '') {
  if (!path) return getFrontendUrl()
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  return `${getFrontendUrl()}/${path.replace(/^\/+/, '')}`
}

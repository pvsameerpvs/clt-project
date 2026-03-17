export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface NavMenuCategory {
  name: string
  slug: string
  subcategories: string[]
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  description?: string | null
  image_url?: string | null
}

interface NavSectionData {
  categories: NavMenuCategory[]
  notes: Array<{ name: string; image: string; href?: string; product_slugs?: string[] }>
  banners: Array<{ title: string; image: string; href?: string; product_slugs?: string[] }>
}

interface SiteSettingsData {
  hero_slides: Array<{ image: string; tagline: string; headline: string }>
  ticker_text: string
  pocket_friendly_configs: number[]
  collections: Array<{ href: string; image: string; subtitle: string; title: string; action: string }>
  brand_story: {
    title: string
    description: string
    image: string
    features: Array<{ title: string; text: string }>
  }
  offers: Array<{ title: string; description: string; action: string; href: string }>
  navigation: Record<string, NavSectionData>
  global_store_info: {
    name: string
    slogan: string
    description: string
    email: string
    phone: string
    address: string
    social_links: {
      instagram: string
      facebook: string
      twitter: string
      youtube: string
      linkedin: string
    }
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function normalizeCategories(input: unknown): NavMenuCategory[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim()
        if (!name) return null
        return { name, slug: slugify(name), subcategories: [] }
      }

      if (!item || typeof item !== "object") return null
      const source = item as { name?: unknown; slug?: unknown; subcategories?: unknown }
      const name =
        typeof source.name === "string" && source.name.trim()
          ? source.name.trim()
          : typeof source.slug === "string"
            ? source.slug.replace(/-/g, " ").trim()
            : ""
      const slug =
        typeof source.slug === "string" && source.slug.trim()
          ? slugify(source.slug)
          : slugify(name)
      if (!name || !slug) return null

      const subcategories = Array.isArray(source.subcategories)
        ? source.subcategories
            .map((sub) => (typeof sub === "string" ? sub.trim() : ""))
            .filter(Boolean)
        : []

      return { name, slug, subcategories }
    })
    .filter((item): item is NavMenuCategory => Boolean(item))
}

const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  hero_slides: [],
  ticker_text: "",
  pocket_friendly_configs: [],
  collections: [],
  brand_story: {
    title: "",
    description: "",
    image: "",
    features: [],
  },
  offers: [],
  navigation: {},
  global_store_info: {
    name: "",
    slogan: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    social_links: {
      instagram: "",
      facebook: "",
      twitter: "",
      youtube: "",
      linkedin: "",
    },
  },
}

let settingsCache: SiteSettingsData | null = null
let settingsRequest: Promise<SiteSettingsData> | null = null
let hasLoggedSettingsWarning = false

function mergeNavigation(input: unknown) {
  const sourceNavigation = (input && typeof input === "object"
    ? (input as Record<string, { categories?: unknown; notes?: unknown; banners?: unknown }>)
    : {}) || {}

  const defaultNavigation = DEFAULT_SITE_SETTINGS.navigation as Record<
    string,
    {
      categories: NavMenuCategory[]
      notes: Array<{ name: string; image: string; href?: string; product_slugs?: string[] }>
      banners: Array<{ title: string; image: string; href?: string; product_slugs?: string[] }>
    }
  >

  const mergedKeys = new Set([
    ...Object.keys(defaultNavigation),
    ...Object.keys(sourceNavigation),
  ])

  const mergedNavigation: Record<
    string,
    {
      categories: NavMenuCategory[]
      notes: Array<{ name: string; image: string; href?: string; product_slugs?: string[] }>
      banners: Array<{ title: string; image: string; href?: string; product_slugs?: string[] }>
    }
  > = {}

  for (const key of mergedKeys) {
    const sourceSection = sourceNavigation[key] || {}
    const defaultSection = defaultNavigation[key] || { categories: [], notes: [], banners: [] }
    const categories = normalizeCategories(sourceSection.categories)

    mergedNavigation[key] = {
      ...defaultSection,
      ...sourceSection,
      categories: categories.length ? categories : defaultSection.categories,
      notes: Array.isArray(sourceSection.notes) ? sourceSection.notes : defaultSection.notes,
      banners: Array.isArray(sourceSection.banners) ? sourceSection.banners : defaultSection.banners,
    }
  }

  return mergedNavigation
}

function mergeSettings(data: unknown): SiteSettingsData {
  if (!data || typeof data !== "object") return DEFAULT_SITE_SETTINGS
  const source = data as Partial<SiteSettingsData>

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...source,
    navigation: mergeNavigation(source.navigation),
    global_store_info: {
      ...DEFAULT_SITE_SETTINGS.global_store_info,
      ...(source.global_store_info || {}),
      social_links: {
        ...DEFAULT_SITE_SETTINGS.global_store_info.social_links,
        ...(source.global_store_info?.social_links || {}),
      },
    },
  }
}

export async function getSiteSettings() {
  if (settingsCache) return settingsCache
  if (settingsRequest) return settingsRequest

  settingsRequest = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, { cache: "no-store" })
      if (!res.ok) {
        if (!hasLoggedSettingsWarning) {
          console.warn(`[settings] backend responded with status ${res.status}; using fallback settings.`)
          hasLoggedSettingsWarning = true
        }
        settingsCache = DEFAULT_SITE_SETTINGS
        return settingsCache
      }

      const data = await res.json()
      settingsCache = mergeSettings(data)
      return settingsCache
    } catch {
      if (!hasLoggedSettingsWarning) {
        console.warn("[settings] failed to fetch from backend; using fallback settings.")
        hasLoggedSettingsWarning = true
      }
      settingsCache = DEFAULT_SITE_SETTINGS
      return settingsCache
    } finally {
      settingsRequest = null
    }
  })()

  return settingsRequest
}

export function clearSiteSettingsCache() {
  settingsCache = null
  settingsRequest = null
  hasLoggedSettingsWarning = false
}

export async function getProducts(filters?: { 
  category?: string; 
  search?: string; 
  minPrice?: number; 
  maxPrice?: number;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const url = `${API_BASE_URL}/api/products${params.toString() ? '?' + params.toString() : ''}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error("Failed to fetch products")
    return res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/categories`, { cache: 'no-store' })
    if (!res.ok) throw new Error("Failed to fetch categories")
    return res.json() as Promise<ProductCategory[]>
  } catch (error) {
    console.error(error)
    return [] as ProductCategory[]
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/categories/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json() as Promise<ProductCategory>
  } catch (error) {
    console.error(error)
    return null
  }
}
export async function subscribeNewsletter(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    return res.json()
  } catch (error) {
    console.error(error)
    return { error: "Failed to subscribe" }
  }
}

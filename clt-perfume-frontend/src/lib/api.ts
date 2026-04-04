export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
import { Product } from "@/lib/products"

export type PromoDiscountType = "percentage" | "fixed"

export interface PromoValidationResponse {
  valid: boolean
  code?: string
  discountType?: PromoDiscountType
  discountValue?: number
  discountAmount?: number
  finalTotal?: number
  message?: string
}

export interface CodCheckoutItemInput {
  product_id: string
  quantity: number
  unit_price: number
  original_unit_price?: number
}

export interface CodCheckoutPayload {
  items: CodCheckoutItemInput[]
  promo?: {
    code?: string
    discountType?: PromoDiscountType
    discountValue?: number
  } | null
  shipping_address?: Record<string, unknown> | null
}

export interface CodCheckoutResponse {
  id: string
  order_number?: string
  status: string
  subtotal: number
  promo_discount: number
  total: number
  payment_method: string
}

export interface BankCheckoutSessionResponse {
  url: string
  sessionId: string
  orderId?: string
}

export interface UserOrderItemRecord {
  id: string
  product_id?: string | null
  product_name?: string | null
  product_image?: string | null
  product_slug?: string | null
  price?: number | string | null
  quantity?: number | string | null
}

export interface UserOrderRecord {
  id: string
  order_number?: string | null
  total?: number | string | null
  status?: string | null
  created_at: string
  items?: UserOrderItemRecord[] | null
  shipping_address?: {
    title?: string
    city?: string
    country?: string
  } | null
}

export interface OrderActionResponse {
  id: string
  status: string
}

export interface ReturnRequestRecord {
  id: string
  order_id: string
  reason?: string | null
  status: "pending" | "approved" | "rejected" | "completed" | string
  created_at: string
  updated_at: string
  order?: {
    order_number?: string | null
    total?: number | string | null
    status?: string | null
    created_at?: string | null
  } | null
}

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
  collections: Array<{ href: string; image: string; cover_image?: string; subtitle: string; title: string; action: string; product_slugs?: string[] }>
  brand_story: {
    title: string
    description: string
    image: string
    features: Array<{ title: string; text: string }>
  }
  offers: Array<{
    title: string
    description: string
    action: string
    href: string
    badge?: string
    bgColor?: string
    product_slugs?: string[]
    discount_percentage?: number
    is_active?: boolean
    bundle_sizes?: number[]
    bundle_discounts?: Record<string, number>
  }>
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
  if (settingsRequest) return settingsRequest

  settingsRequest = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, { cache: "no-store" })
      if (!res.ok) {
        if (!hasLoggedSettingsWarning) {
          console.warn(`[settings] backend responded with status ${res.status}; using fallback settings.`)
          hasLoggedSettingsWarning = true
        }
        return DEFAULT_SITE_SETTINGS
      }

      const data = await res.json()
      return mergeSettings(data)
    } catch {
      if (!hasLoggedSettingsWarning) {
        console.warn("[settings] failed to fetch from backend; using fallback settings.")
        hasLoggedSettingsWarning = true
      }
      return DEFAULT_SITE_SETTINGS
    } finally {
      settingsRequest = null
    }
  })()

  return settingsRequest
}

export function clearSiteSettingsCache() {
  settingsRequest = null
  hasLoggedSettingsWarning = false
}

export async function getProducts(filters?: { 
  category?: string; 
  search?: string; 
  minPrice?: number; 
  maxPrice?: number;
  limit?: number;
  includeVariants?: boolean;
}): Promise<Product[]> {
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
    const data = (await res.json()) as Product[];
    
    if (filters?.includeVariants) {
      return data;
    }
    
    return data.filter((p: Product) => p.show_in_catalog !== false);
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
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

export async function validatePromoCode(code: string, subtotal: number): Promise<PromoValidationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/promo-codes/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    })

    const data = (await res.json()) as PromoValidationResponse
    if (!res.ok) return { ...data, valid: false }
    return data
  } catch {
    return { valid: false, message: "Failed to validate promo code" }
  }
}

export async function createCashOnDeliveryOrder(
  accessToken: string,
  payload: CodCheckoutPayload
): Promise<CodCheckoutResponse> {
  const res = await fetch(`${API_BASE_URL}/api/orders/cod-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json()) as CodCheckoutResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to place cash on delivery order")
  }

  return data
}

export async function createBankCheckoutSession(
  accessToken: string,
  payload: CodCheckoutPayload
): Promise<BankCheckoutSessionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json()) as BankCheckoutSessionResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to start bank payment checkout")
  }

  if (!data.url) {
    throw new Error("Payment session URL is missing")
  }

  return data
}

export async function getMyOrders(accessToken: string): Promise<UserOrderRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const data = (await res.json()) as UserOrderRecord[] & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to load orders")
  }

  return data as UserOrderRecord[]
}

export async function cancelMyOrder(accessToken: string, orderId: string): Promise<OrderActionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = (await res.json()) as OrderActionResponse & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to cancel order")
  }
  return data
}

export async function getMyReturnRequests(accessToken: string): Promise<ReturnRequestRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/orders/return-requests`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  const data = (await res.json()) as ReturnRequestRecord[] & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to load return requests")
  }
  return data as ReturnRequestRecord[]
}

export async function requestOrderReturn(
  accessToken: string,
  orderId: string,
  payload?: { reason?: string }
): Promise<ReturnRequestRecord> {
  const res = await fetch(`${API_BASE_URL}/api/orders/${encodeURIComponent(orderId)}/return-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload || {}),
  })

  const data = (await res.json()) as ReturnRequestRecord & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit return request")
  }
  return data
}

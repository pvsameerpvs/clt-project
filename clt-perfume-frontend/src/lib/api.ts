export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

const DEFAULT_SITE_SETTINGS = {
  hero_slides: [
    { image: "/prfume-bannar-1.jpg", tagline: "ELEGANCE IN EVERY DROP", headline: "Unveil Your <br/> Inner Essence" },
    { image: "/prfume-bannar-3.jpg", tagline: "LIMITED EDITION", headline: "Ramadan <br/> Signature Scents" },
    { image: "/prfume-bannar-4.png", tagline: "MODERN CLASSICS", headline: "The Art of <br/> Fine Fragrance" },
  ],
  ticker_text: "FREE SHIPPING ON ALL ORDERS OVER 200 AED 🚚 SHOP OUR NEW ARRIVALS NOW!",
  pocket_friendly_configs: [49, 99, 149, 199, 299],
  collections: [
    { href: "/collections/mens", image: "/prfume-bannar-2.jpg", subtitle: "Bold & Sophisticated", title: "Signature Men's <br/> Fragrances", action: "Shop Collection" },
    { href: "/collections/womens", image: "/prfume-bannar-3.jpg", subtitle: "Graceful & Timeless", title: "Timeless Women's <br/> Collection", action: "Discover More" },
    { href: "/collections/deals", image: "/Philosophy.png", subtitle: "Limited Time Only", title: "Exclusive Gift Sets <br/> & Bundles", action: "View Offers" },
  ],
  brand_story: {
    title: "Crafted for the Discerning Individual",
    description: "A symphony of scents that transcends words. It is not just a perfume, but an extension of the ambition and authority of a true icon.",
    image: "/Philosophy.png",
    features: [
      { title: "Clean Formulas", text: "No heavy musk or sweetness. Just crisp, cool mineral finish." },
      { title: "Sustainable Sourcing", text: "Ingredients ethically harvested from around the globe." },
    ],
  },
  offers: [
    { title: "Signature Sets", description: "Curated collections of our finest scents, beautifully bundled and packaged.", action: "Shop Sets", href: "/signature-sets" },
    { title: "Personal Engraving", description: "Add a personalized engraving to your bottle, available on all 100ml flacons.", action: "Learn More", href: "/personal-engraving" },
    { title: "Complimentary Samples", description: "Receive two complimentary luxury miniatures with every online order.", action: "View Details", href: "/complimentary-samples" },
  ],
  navigation: {
    mens: {
      categories: ["Men Perfumes", "Best Seller For Men", "Gift Sets For Men", "Arabic Perfume", "Niche Perfumes"],
      notes: [
        { name: "Woody", image: "/prfume-bannar-2.jpg" },
        { name: "Spicy", image: "/prfume-bannar-4.png" },
      ],
      banners: [
        { title: "NEW ARRIVALS", image: "/Philosophy.png" },
        { title: "SIGNATURE", image: "/prfume-bannar-1.jpg" },
      ],
    },
    womens: {
      categories: ["Women Perfumes", "Best Seller For Women", "Gift Sets For Women", "Cosmetics", "Body Mist"],
      notes: [
        { name: "Fruity", image: "/prfume-bannar-3.jpg" },
        { name: "Floral", image: "/prfume-bannar-2.jpg" },
      ],
      banners: [
        { title: "BEST SELLERS", image: "/Philosophy.png" },
        { title: "GIFT SETS", image: "/prfume-bannar-4.png" },
      ],
    },
  },
  global_store_info: {
    name: "CLE PERFUMES",
    slogan: "CLE PERFUMES.",
    description: "Elevating the everyday with scents that define your presence. Discover the true essence of luxury with our original collections, crafted meticulously for the discerning individual.",
    email: "contact@cleperfumes.com",
    phone: "+971 50 123 4567",
    address: "Dubai, United Arab Emirates",
    social_links: {
      instagram: "https://instagram.com/cleperfumes",
      facebook: "https://facebook.com/cleperfumes",
      twitter: "https://twitter.com/cleperfumes",
      youtube: "https://youtube.com/cleperfumes",
      linkedin: "https://linkedin.com/company/cleperfumes",
    },
  },
}

let settingsCache: typeof DEFAULT_SITE_SETTINGS | null = null
let settingsRequest: Promise<typeof DEFAULT_SITE_SETTINGS> | null = null
let hasLoggedSettingsWarning = false

function mergeSettings(data: unknown): typeof DEFAULT_SITE_SETTINGS {
  if (!data || typeof data !== "object") return DEFAULT_SITE_SETTINGS
  const source = data as Partial<typeof DEFAULT_SITE_SETTINGS>

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...source,
    navigation: {
      mens: {
        ...DEFAULT_SITE_SETTINGS.navigation.mens,
        ...(source.navigation?.mens || {}),
      },
      womens: {
        ...DEFAULT_SITE_SETTINGS.navigation.womens,
        ...(source.navigation?.womens || {}),
      },
    },
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
    return res.json()
  } catch (error) {
    console.error(error)
    return []
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/categories/${slug}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
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

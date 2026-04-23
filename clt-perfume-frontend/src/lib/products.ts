export interface Promotion {
  id: string
  parent_id: string
  child_id: string
  discount_percentage: number
  is_active: boolean
  gift?: Product
}

export interface Review {
  id: string
  user: string
  avatar?: string
  rating: number
  date: string
  content: string
  images?: string[]
}

export type ProductCategory =
  | string
  | { name?: string | null; slug?: string | null }
  | Array<{ name?: string | null; slug?: string | null }>
  | null

export interface Product {
  id: string
  slug: string
  name: string
  category_id?: string | null
  category: ProductCategory
  price: number
  description: string
  images: string[]
  ml?: string
  variant_group_id?: string
  show_in_catalog?: boolean
  scent: string
  olfactive_family?: string
  olfactive_signature?: string
  concentration?: string
  mood_use?: string
  top_notes?: string[]
  heart_notes?: string[]
  base_notes?: string[]
  notes?: {
    top: string[]
    heart: string[]
    base: string[]
  }
  tags: string[]
  rating: number
  reviewCount: number
  review_count?: number
  reviews?: Review[]
  isNew?: boolean
  isBestSeller?: boolean
  isExclusive?: boolean
  is_new?: boolean
  is_best_seller?: boolean
  is_exclusive?: boolean
}

export function getCategoryLabel(category: ProductCategory): string {
  if (typeof category === "string") {
    const value = category.trim()
    return value || "Uncategorized"
  }

  if (Array.isArray(category)) {
    const firstNamed = category.find((item) => item?.name && item.name.trim().length > 0)
    return firstNamed?.name?.trim() || "Uncategorized"
  }

  if (category && typeof category === "object" && typeof category.name === "string") {
    const value = category.name.trim()
    return value || "Uncategorized"
  }

  return "Uncategorized"
}

export function getCategorySlug(category: ProductCategory): string | null {
  if (typeof category === "string") {
    const value = category.trim()
    return value ? value.toLowerCase().replace(/\s+/g, "-") : null
  }

  if (Array.isArray(category)) {
    const first = category.find((item) => (item?.slug && item.slug.trim()) || (item?.name && item.name.trim()))
    if (!first) return null
    if (first.slug && first.slug.trim()) return first.slug.trim()
    return first.name ? first.name.trim().toLowerCase().replace(/\s+/g, "-") : null
  }

  if (category && typeof category === "object") {
    if (typeof category.slug === "string" && category.slug.trim()) return category.slug.trim()
    if (typeof category.name === "string" && category.name.trim()) {
      return category.name.trim().toLowerCase().replace(/\s+/g, "-")
    }
  }

  return null
}

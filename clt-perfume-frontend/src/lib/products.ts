
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



export const products: Product[] = [
  {
    id: "1",
    slug: "breath",
    name: "Breath",
    category: "Signature Collection",
    price: 145,
    description: "A refreshing breath of nature that captures the essence of early morning dew. This fragrance embodies the purity of life with its airy and crisp composition.",
    images: ["/perfume/breath-perfume1.png", "/perfume/breath-perfume2.png"],
    scent: "Fresh & Airy",
    notes: {
      top: ["Bergamot", "Mint"],
      heart: ["Green Tea", "Jasmine"],
      base: ["White Musk", "Cedarwood"]
    },
    tags: ["Fresh", "Citrus", "Airy", "Daytime"],
    rating: 4.8,
    reviewCount: 124,
    reviews: [
      {
        id: "r1",
        user: "Sarah J.",
        rating: 5,
        date: "2 weeks ago",
        content: "Absolutely refreshing! It feels like a morning walk in a garden."
      }
    ],
    isNew: true,
    isBestSeller: true
  },
  {
    id: "2",
    slug: "elan",
    name: "Elan",
    category: "Luxury Edition",
    price: 160,
    description: "Radiate confidence and spirit with Elan. A vibrant blend designed for those who carry themselves with grace and energy.",
    images: ["/perfume/elan-perfume1.png", "/perfume/elan-perfume2.png"],
    scent: "Vibrant & Spirited",
    notes: {
      top: ["Mandarin", "Pink Pepper"],
      heart: ["Ylang-Ylang", "Orange Blossom"],
      base: ["Patchouli", "Vanilla"]
    },
    tags: ["Vibrant", "Floral", "Spicy", "Evening"],
    rating: 4.7,
    reviewCount: 89,
    reviews: [],
    isNew: true
  },
  {
    id: "3",
    slug: "first-dance",
    name: "First Dance",
    category: "Romantic Series",
    price: 155,
    description: "Capture the magic of an unforgettable moment. First Dance is a delicate floral bouquet that evokes romance and timeless elegance.",
    images: ["/perfume/first-dance1.png", "/perfume/first-dance2.png"],
    scent: "Floral & Delicate",
    notes: {
      top: ["Peony", "Lychee"],
      heart: ["Rose", "Magnolia"],
      base: ["Amber", "Honey"]
    },
    tags: ["Romantic", "Floral", "Sweet", "Date Night"],
    rating: 4.9,
    reviewCount: 200,
    reviews: [],
    isNew: false,
    isBestSeller: true
  },
  {
    id: "4",
    slug: "midnight-smock",
    name: "Midnight Smock",
    category: "Noir Collection",
    price: 180,
    description: "An enigmatic fragrance for the mysterious soul. Midnight Smock blends smoky notes with dark florals for an intense, captivating scent.",
    images: ["/perfume/midnight-perfume1.png", "/perfume/midnight-perfume2.png"],
    scent: "Mysterious & Smoky",
    notes: {
      top: ["Incense", "Black Pepper"],
      heart: ["Leather", "Labdanum"],
      base: ["Oud", "Sandalwood"]
    },
    tags: ["Smoky", "Intense", "Winter", "Night"],
    rating: 4.6,
    reviewCount: 156,
    reviews: [],
    isNew: false,
    isExclusive: true
  },
  {
    id: "5",
    slug: "noir-de-soir",
    name: "Noir de Soir",
    category: "Evening Wear",
    price: 195,
    description: "The ultimate evening companion. Noir de Soir is deep, sophisticated, and undeniably seductive.",
    images: ["/perfume/noir-perfume1.png", "/perfume/noir-perfume2.png"],
    scent: "Dark & Intense",
    notes: {
      top: ["Black Currant", "Bergamot"],
      heart: ["Dark Chocolate", "Tuberose"],
      base: ["Vetiver", "Dark Amber"]
    },
    tags: ["Dark", "Seductive", "Gourmand", "Formal"],
    rating: 4.9,
    reviewCount: 310,
    reviews: [],
    isNew: false,
    isBestSeller: true
  },
  {
    id: "6",
    slug: "tears-of-love",
    name: "Tears of Love",
    category: "Emotional Journey",
    price: 170,
    description: "A poignant and pure fragrance that speaks to the heart. Clean, aquatic notes mix with soft florals for a melancholic beauty.",
    images: ["/perfume/tears-of-love1.png", "/perfume/tears-of-love2.png"],
    scent: "Pure & Melancholic",
    notes: {
      top: ["Rain Accord", "Violet Leaf"],
      heart: ["Iris", "White Rose"],
      base: ["Musk", "Driftwood"]
    },
    tags: ["Clean", "Aquatic", "Soft", "Everyday"],
    rating: 4.5,
    reviewCount: 95,
    reviews: [],
    isNew: true
  },
  {
    id: "7",
    slug: "essence-mini",
    name: "Essence Mini",
    category: "Pocket Series",
    price: 39,
    description: "The perfect companion for your travels. A pocket-friendly essence that keeps you fresh on the go.",
    images: ["/perfume/midnight-perfume1.png", "/perfume/midnight-perfume2.png"],
    scent: "Fresh & Zingy",
    notes: {
      top: ["Lemon", "Grapefruit"],
      heart: ["Sea Salt", "Sage"],
      base: ["Ambrette", "Seaweed"]
    },
    tags: ["Mini", "Fresh", "Budget", "Travel"],
    rating: 4.4,
    reviewCount: 45,
    reviews: [],
    isNew: true
  },
  {
    id: "8",
    slug: "velvet-touch",
    name: "Velvet Touch",
    category: "Daily Wear",
    price: 85,
    description: "A smooth, velvety fragrance for everyday confidence. Subtle yet memorable.",
    images: ["/perfume/elan-perfume1.png", "/perfume/elan-perfume2.png"],
    scent: "Floral & Musky",
    notes: {
      top: ["Aldehydes", "Neroli"],
      heart: ["Jasmine", "Rose"],
      base: ["Sandalwood", "Vanilla"]
    },
    tags: ["Daily", "Soft", "Musk", "Workwear"],
    rating: 4.6,
    reviewCount: 88,
    reviews: []
  }
]

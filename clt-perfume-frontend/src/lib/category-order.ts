const CATEGORY_ORDER = ["mens", "womens", "unisex"]

export function normalizeCategoryToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function canonicalCategoryToken(value: string) {
  const token = normalizeCategoryToken(value)

  if (token === "men" || token === "mens" || token === "men-perfumes" || token === "mens-perfumes") {
    return "mens"
  }

  if (token === "women" || token === "womens" || token === "women-perfumes" || token === "womens-perfumes") {
    return "womens"
  }

  if (token === "unisex" || token === "unisex-perfumes") {
    return "unisex"
  }

  return token
}

function getCategoryRank(category: { name: string; slug?: string | null }) {
  const token = canonicalCategoryToken(category.slug || category.name)
  const rank = CATEGORY_ORDER.indexOf(token)
  return rank === -1 ? CATEGORY_ORDER.length : rank
}

export function compareCategoryDisplayOrder(
  a: { name: string; slug?: string | null },
  b: { name: string; slug?: string | null }
) {
  const rankDifference = getCategoryRank(a) - getCategoryRank(b)
  if (rankDifference !== 0) return rankDifference
  return a.name.localeCompare(b.name)
}

export function formatCategoryHeading(label: string, slug?: string | null) {
  const cleanLabel = label.replace(/\s+perfumes?$/i, "").trim()
  const token = canonicalCategoryToken(slug || cleanLabel)

  if (token === "mens") return "Men"
  if (token === "womens") return "Women"
  if (token === "unisex") return "Unisex"

  return cleanLabel || "Collection"
}

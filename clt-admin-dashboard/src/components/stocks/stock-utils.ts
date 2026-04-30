import type { AdminProduct } from "@/lib/admin-api"

export const LOW_STOCK_THRESHOLD = 10

export type StockFilter = "all" | "ready" | "low" | "out" | "inactive"

export type StockStatus = "ready" | "low" | "out" | "inactive"

export function getStockQuantity(product: AdminProduct) {
  return Math.max(0, Math.floor(Number(product.stock || 0)))
}

export function getStockStatus(product: AdminProduct): StockStatus {
  if (product.is_active === false) return "inactive"

  const stock = getStockQuantity(product)
  if (stock <= 0) return "out"
  if (stock < LOW_STOCK_THRESHOLD) return "low"

  return "ready"
}

export function getStockStatusLabel(status: StockStatus) {
  switch (status) {
    case "out":
      return "Out of stock"
    case "low":
      return "Low stock"
    case "inactive":
      return "Inactive"
    case "ready":
    default:
      return "Ready"
  }
}

export function getStockStatusClass(status: StockStatus) {
  switch (status) {
    case "out":
      return "border-red-200 bg-red-50 text-red-700"
    case "low":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "inactive":
      return "border-neutral-200 bg-neutral-100 text-neutral-500"
    case "ready":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

export function getProductSku(product: AdminProduct) {
  return product.slug || product.variant_group_id || product.id.slice(0, 8).toUpperCase()
}

export function getProductImage(product: AdminProduct) {
  return product.images?.[0] || ""
}

export function getProductCategoryName(product: AdminProduct) {
  if (!product.category) return "Uncategorized"
  if (Array.isArray(product.category)) return product.category[0]?.name || "Uncategorized"
  return product.category.name || "Uncategorized"
}

export function formatMoney(value: number | string | null | undefined) {
  return `AED ${Math.round(Number(value || 0)).toLocaleString()}`
}

export function getUniqueSizes(products: AdminProduct[]) {
  return Array.from(new Set(products.map((product) => product.ml).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )
}

import { CartItem as CartLineItem } from "@/contexts/cart-context"

export interface BundleGroup {
  id: string
  name: string
  discountPercent: number
  size: number
  items: CartLineItem[]
  originalTotal: number
  offerTotal: number
}

/**
 * Groups raw cart items into bundles and standalone items
 */
export function groupCartItems(items: CartLineItem[]) {
  const bundleMap = new Map<string, BundleGroup>()
  const singles: CartLineItem[] = []

  for (const item of items) {
    const bundle = item.bundle
    if (!bundle?.id) {
      singles.push(item)
      continue
    }

    const existing = bundleMap.get(bundle.id)
    const originalUnitPrice = Number(item.originalUnitPrice || item.product.price)
    const offerUnitPrice = Number(item.product.price)

    if (!existing) {
      bundleMap.set(bundle.id, {
        id: bundle.id,
        name: bundle.name,
        discountPercent: bundle.discountPercent,
        size: bundle.size,
        items: [item],
        originalTotal: originalUnitPrice * item.quantity,
        offerTotal: offerUnitPrice * item.quantity,
      })
      continue
    }

    existing.items.push(item)
    existing.originalTotal += originalUnitPrice * item.quantity
    existing.offerTotal += offerUnitPrice * item.quantity
  }

  return {
    standaloneItems: singles,
    bundleGroups: Array.from(bundleMap.values()),
  }
}

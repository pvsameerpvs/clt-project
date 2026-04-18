import type { CartItem } from "@/contexts/cart-context"
import type { CheckoutAddress, PaymentMethod } from "./checkout-types"

const CHECKOUT_SUCCESS_STORAGE_KEY = "cle_checkout_success_snapshot"
const CHECKOUT_SUCCESS_STORAGE_EVENT = "cle:checkout-success-snapshot"

let cachedCheckoutSuccessSnapshotRaw: string | null | undefined
let cachedCheckoutSuccessSnapshot: CheckoutSuccessSnapshot | null = null

export type CheckoutSuccessSnapshotItem = {
  productId: string
  name: string
  slug?: string | null
  image?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  bundleName?: string | null
}

export type CheckoutSuccessSnapshot = {
  orderId?: string
  orderNumber?: string
  paymentMethod: PaymentMethod
  email?: string
  whatsapp?: string
  contactName?: string
  destination?: string
  subtotal: number
  discount: number
  total: number
  createdAt: string
  items: CheckoutSuccessSnapshotItem[]
}

type CreateCheckoutSuccessSnapshotInput = {
  items: CartItem[]
  paymentMethod: PaymentMethod
  subtotal: number
  discount: number
  total: number
  email?: string
  whatsapp?: string
  address?: CheckoutAddress | null
  orderId?: string
  orderNumber?: string
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function createDestinationLabel(address?: CheckoutAddress | null) {
  if (!address) return ""

  return [address.title, address.city, address.country]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ")
}

export function createCheckoutSuccessSnapshot({
  items,
  paymentMethod,
  subtotal,
  discount,
  total,
  email,
  whatsapp,
  address,
  orderId,
  orderNumber,
}: CreateCheckoutSuccessSnapshotInput): CheckoutSuccessSnapshot {
  return {
    orderId,
    orderNumber,
    paymentMethod,
    email: String(email || "").trim() || undefined,
    whatsapp: String(whatsapp || "").trim() || undefined,
    contactName: address?.contactName?.trim() || undefined,
    destination: createDestinationLabel(address) || undefined,
    subtotal: toSafeNumber(subtotal),
    discount: toSafeNumber(discount),
    total: toSafeNumber(total),
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images?.[0] || null,
      quantity: Math.max(1, toSafeNumber(item.quantity)),
      unitPrice: toSafeNumber(item.product.price),
      lineTotal: toSafeNumber(item.product.price) * Math.max(1, toSafeNumber(item.quantity)),
      bundleName: item.bundle?.name || null,
    })),
  }
}

export function storeCheckoutSuccessSnapshot(snapshot: CheckoutSuccessSnapshot) {
  if (typeof window === "undefined") return

  const raw = JSON.stringify(snapshot)
  cachedCheckoutSuccessSnapshotRaw = raw
  cachedCheckoutSuccessSnapshot = snapshot
  window.sessionStorage.setItem(CHECKOUT_SUCCESS_STORAGE_KEY, raw)
  window.dispatchEvent(new Event(CHECKOUT_SUCCESS_STORAGE_EVENT))
}

export function readCheckoutSuccessSnapshot() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_SUCCESS_STORAGE_KEY)
    if (raw === cachedCheckoutSuccessSnapshotRaw) {
      return cachedCheckoutSuccessSnapshot
    }

    cachedCheckoutSuccessSnapshotRaw = raw

    if (!raw) {
      cachedCheckoutSuccessSnapshot = null
      return null
    }

    cachedCheckoutSuccessSnapshot = JSON.parse(raw) as CheckoutSuccessSnapshot
    return cachedCheckoutSuccessSnapshot
  } catch {
    cachedCheckoutSuccessSnapshot = null
    return null
  }
}

export function matchesCheckoutSuccessSnapshot(
  snapshot: CheckoutSuccessSnapshot | null,
  orderId?: string | null,
  orderNumber?: string | null
) {
  if (!snapshot) return false
  if (!orderId && !orderNumber) return false
  if (orderId && snapshot.orderId !== orderId) return false
  if (orderNumber && snapshot.orderNumber !== orderNumber) return false
  return true
}

export function subscribeToCheckoutSuccessSnapshot(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.sessionStorage) return
    if (event.key !== CHECKOUT_SUCCESS_STORAGE_KEY) return
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(CHECKOUT_SUCCESS_STORAGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CHECKOUT_SUCCESS_STORAGE_EVENT, onStoreChange)
  }
}

import { supabaseAdmin } from '../config/supabase'

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckoutValidationError'
  }
}

export type CheckoutItemInput = {
  product_id?: string
  quantity?: number
}

export type CheckoutPayload = {
  items?: CheckoutItemInput[]
  promo?: {
    code?: string | null
  } | null
  shipping_address?: Record<string, unknown> | null
}

type ProductRow = {
  id: string
  name: string
  slug: string | null
  images: string[] | null
  price: number | string
  stock_quantity: number | string | null
  is_active?: boolean | null
}

type PromoCodeRow = {
  code: string
  discount_type: 'percentage' | 'fixed' | string
  discount_value: number | string
  active?: boolean | null
  expires_at?: string | null
}

export type CheckoutOrderItem = {
  product_id: string
  product_name: string
  product_image: string | null
  product_slug: string | null
  price: number
  quantity: number
}

export type ResolvedCheckoutPricing = {
  items: CheckoutOrderItem[]
  subtotal: number
  promoDiscount: number
  total: number
  promoCode: string | null
}

function toSafeNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundCurrency(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100
}

function normalizePromoCode(code?: string | null) {
  const normalized = String(code || '').trim().toUpperCase()
  return normalized || null
}

export function normalizeCheckoutItems(rawItems: unknown): Array<{ product_id: string; quantity: number }> {
  const items = Array.isArray(rawItems) ? rawItems : []
  const quantityByProductId = new Map<string, number>()

  for (const item of items as CheckoutItemInput[]) {
    const productId = String(item?.product_id || '').trim()
    const quantity = Math.max(1, Math.floor(toSafeNumber(item?.quantity)))

    if (!productId) continue

    quantityByProductId.set(productId, (quantityByProductId.get(productId) || 0) + quantity)
  }

  return Array.from(quantityByProductId.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }))
}

async function getValidatedPromoDiscount(code: string | null, subtotal: number) {
  if (!code) {
    return { promoCode: null, promoDiscount: 0 }
  }

  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .select('*')
    .ilike('code', code)
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const promo = (data?.[0] || null) as PromoCodeRow | null
  if (!promo) {
    throw new CheckoutValidationError('Invalid promo code')
  }

  if (promo.active === false) {
    throw new CheckoutValidationError('Promo code is inactive')
  }

  if (promo.expires_at) {
    const expiresAt = new Date(promo.expires_at).getTime()
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      throw new CheckoutValidationError('Promo code has expired')
    }
  }

  const safeSubtotal = Math.max(0, toSafeNumber(subtotal))
  const discountType = promo.discount_type === 'fixed' ? 'fixed' : 'percentage'
  const discountValue = Math.max(0, toSafeNumber(promo.discount_value))
  const promoDiscount = roundCurrency(
    discountType === 'fixed'
      ? Math.min(safeSubtotal, discountValue)
      : (safeSubtotal * Math.min(100, discountValue)) / 100
  )

  return {
    promoCode: code,
    promoDiscount,
  }
}

export async function resolveCheckoutPricing(
  rawItems: unknown,
  promo?: { code?: string | null } | null
): Promise<ResolvedCheckoutPricing> {
  const normalizedItems = normalizeCheckoutItems(rawItems)

  if (normalizedItems.length === 0) {
    throw new CheckoutValidationError('Cart is empty')
  }

  const productIds = normalizedItems.map((item) => item.product_id)
  const { data: productRows, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, images, price, stock_quantity, is_active')
    .in('id', productIds)

  if (productsError) {
    throw new Error(productsError.message)
  }

  const products = (productRows || []) as ProductRow[]
  const productMap = new Map(products.map((product) => [product.id, product]))
  const missingProduct = productIds.find((id) => !productMap.has(id))

  if (missingProduct) {
    throw new CheckoutValidationError('One or more products are unavailable')
  }

  const orderItems: CheckoutOrderItem[] = normalizedItems.map((item) => {
    const product = productMap.get(item.product_id)!
    const stockQuantity = Math.max(0, Math.floor(toSafeNumber(product.stock_quantity)))

    if (product.is_active === false) {
      throw new CheckoutValidationError(`${product.name} is no longer available`)
    }

    if (item.quantity > stockQuantity) {
      throw new CheckoutValidationError(`${product.name} has only ${stockQuantity} item(s) left in stock`)
    }

    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || null,
      product_slug: product.slug || null,
      price: roundCurrency(toSafeNumber(product.price)),
      quantity: item.quantity,
    }
  })

  // === APPLY PRODUCT-TO-PRODUCT PROMOTIONS (GIFT SYSTEM) ===
  const { data: activePromos } = await supabaseAdmin
    .from('product_promotions')
    .select('parent_id, child_id, discount_percentage')
    .eq('is_active', true)

  if (activePromos && activePromos.length > 0) {
    for (const promo of activePromos) {
      const parentInCart = orderItems.find(i => i.product_id === promo.parent_id)
      const childInCart = orderItems.find(i => i.product_id === promo.child_id)

      if (parentInCart && childInCart) {
        // Apply discount to the child item based on the percentage
        const discount = Math.min(100, Math.max(0, toSafeNumber(promo.discount_percentage)))
        const originalPrice = childInCart.price
        childInCart.price = roundCurrency(originalPrice * (1 - discount / 100))
      }
    }
  }
  // ========================================================

  const subtotal = roundCurrency(
    orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  const { promoCode, promoDiscount } = await getValidatedPromoDiscount(
    normalizePromoCode(promo?.code),
    subtotal
  )
  const total = roundCurrency(subtotal - promoDiscount)

  return {
    items: orderItems,
    subtotal,
    promoDiscount,
    total,
    promoCode,
  }
}

export function getOrderAmountInFils(total: number | string | null | undefined) {
  return Math.max(0, Math.round(toSafeNumber(total) * 100))
}

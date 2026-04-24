import { supabaseAdmin } from '../config/supabase'

// === TYPES ===

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

interface PromoOffer {
  title?: string
  product_slugs?: string[]
  bundle_sizes?: (number | string)[]
  bundle_discounts?: Record<string, number | string>
  is_active?: boolean
}

// === UTILS ===

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

// === CORE LOGIC ===

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

  if (error) throw new Error(error.message)

  const promo = (data?.[0] || null) as PromoCodeRow | null
  if (!promo) throw new CheckoutValidationError('Invalid promo code')
  if (promo.active === false) throw new CheckoutValidationError('Promo code is inactive')

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

  return { promoCode: code, promoDiscount }
}

/**
 * Processes bundle offers from site settings and applies discounts to matching items.
 */
async function applyBundleOffers(orderItems: CheckoutOrderItem[]): Promise<void> {
  const { data: settingsData } = await supabaseAdmin
    .from('site_settings')
    .select('offers')
    .single()

  const promoOffers = (settingsData?.offers || []) as PromoOffer[]
  if (promoOffers.length === 0) return

  const discountedItemIds = new Set<string>()

  for (const offer of promoOffers) {
    if (offer.is_active === false) continue

    const productSlugs = Array.isArray(offer.product_slugs) 
      ? offer.product_slugs.map(s => String(s || "").toLowerCase().trim()) 
      : []
    
    if (productSlugs.length === 0) continue

    const itemsInOffer = orderItems.filter(item => {
      const itemSlug = String(item.product_slug || "").toLowerCase().trim()
      return itemSlug && productSlugs.includes(itemSlug) && !discountedItemIds.has(item.product_id)
    })
    
    const totalQuantityInOffer = itemsInOffer.reduce((sum, item) => sum + item.quantity, 0)
    if (totalQuantityInOffer <= 0) continue

    const bundleSizes = Array.isArray(offer.bundle_sizes) 
      ? offer.bundle_sizes.map(Number).sort((a: number, b: number) => b - a) 
      : []
    
    const bundleDiscounts = offer.bundle_discounts || {}
    const applicableSize = (bundleSizes as number[]).find((size: number) => totalQuantityInOffer >= size)
    
    if (applicableSize) {
      const discountPercentage = toSafeNumber(bundleDiscounts[applicableSize])
      if (discountPercentage > 0) {
        const discountFactor = 1 - (Math.min(100, discountPercentage) / 100)
        
        for (const item of itemsInOffer) {
          const originalPrice = item.price
          item.price = roundCurrency(item.price * discountFactor)
          discountedItemIds.add(item.product_id)
          
          const bundleTitle = offer.title || "Bundle Offer"
          if (discountFactor < 1 && !item.product_name.includes('(Offer:')) {
            item.product_name = `${item.product_name} (Offer:${bundleTitle}:AED ${originalPrice})`
          }
        }
      }
    }
  }
}

export async function resolveCheckoutPricing(
  rawItems: unknown,
  promo?: { code?: string | null } | null
): Promise<ResolvedCheckoutPricing> {
  const normalizedItems = normalizeCheckoutItems(rawItems)
  if (normalizedItems.length === 0) throw new CheckoutValidationError('Cart is empty')

  const productIds = normalizedItems.map((item) => item.product_id)
  const { data: productRows, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, slug, images, price, stock_quantity, is_active')
    .in('id', productIds)

  if (productsError) throw new Error(productsError.message)

  const products = (productRows || []) as ProductRow[]
  const productMap = new Map(products.map((product) => [product.id, product]))

  const orderItems: CheckoutOrderItem[] = normalizedItems.map((item) => {
    const product = productMap.get(item.product_id)
    if (!product) throw new CheckoutValidationError('One or more products are unavailable')
    
    const stockQuantity = Math.max(0, Math.floor(toSafeNumber(product.stock_quantity)))
    if (product.is_active === false) throw new CheckoutValidationError(`${product.name} is no longer available`)
    if (item.quantity > stockQuantity) throw new CheckoutValidationError(`${product.name} has only ${stockQuantity} item(s) left in stock`)

    return {
      product_id: product.id,
      product_name: product.name,
      product_image: product.images?.[0] || null,
      product_slug: product.slug || null,
      price: roundCurrency(toSafeNumber(product.price)),
      quantity: item.quantity,
    }
  })

  // 1. Apply product-to-product (GIFT) promotions
  const { data: activePromos } = await supabaseAdmin
    .from('product_promotions')
    .select('parent_id, child_id, discount_percentage')
    .eq('is_active', true)

  if (activePromos && activePromos.length > 0) {
    for (const promo of activePromos) {
      const parentInCart = orderItems.find(i => i.product_id === promo.parent_id)
      const childInCart = orderItems.find(i => i.product_id === promo.child_id)

      if (parentInCart && childInCart) {
        const discount = Math.min(100, Math.max(0, toSafeNumber(promo.discount_percentage)))
        childInCart.price = roundCurrency(childInCart.price * (1 - discount / 100))
      }
    }
  }

  // 2. Apply bundle offers (Promo Studio)
  await applyBundleOffers(orderItems)

  // 3. Calculate subtotal after bundle discounts
  const subtotal = roundCurrency(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))

  // 4. Apply coupon code discount
  const { promoCode, promoDiscount } = await getValidatedPromoDiscount(normalizePromoCode(promo?.code), subtotal)
  const total = roundCurrency(subtotal - promoDiscount)

  return { items: orderItems, subtotal, promoDiscount, total, promoCode }
}

export function getOrderAmountInFils(total: number | string | null | undefined) {
  return Math.max(0, Math.round(toSafeNumber(total) * 100))
}

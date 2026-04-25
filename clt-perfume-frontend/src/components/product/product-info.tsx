"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Product, getCategoryLabel, Promotion } from "@/lib/products"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Minus, 
  Plus, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard,
  Edit3,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getSiteSettings, getProducts } from "@/lib/api"
import { isOfferActive } from "@/lib/offers"
import { cn } from "@/lib/utils"

import { useCart } from "@/contexts/cart-context"
import { GiftSelector } from "./gift-selector"

interface PromoOffer {
  title: string
  href: string
  product_slugs?: string[]
  discount_percentage?: number
  is_active?: boolean
  bundle_sizes?: number[]
  bundle_discounts?: Record<string, number>
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function normalizeProductSlugs(input: unknown) {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const values: string[] = []
  for (const token of input) {
    if (typeof token !== "string") continue
    const value = slugify(token)
    if (!value || seen.has(value)) continue
    seen.add(value)
    values.push(value)
  }
  return values
}

function resolveOfferHref(offer: PromoOffer) {
  const href = typeof offer.href === "string" ? offer.href.trim() : ""
  if (/^\/offers\/[^/?#]+/i.test(href)) return href
  const fallbackSlug = slugify(offer.title)
  return fallbackSlug ? `/offers/${fallbackSlug}` : "/offers"
}

function getOfferBestDiscount(offer: PromoOffer) {
  const discounts = Object.values(offer.bundle_discounts || {})
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
  return discounts.length > 0 ? Math.max(...discounts) : 0
}

export function ProductInfo({ product, promotions = [] }: { product: Product, promotions?: Promotion[] }) {
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [engraving, setEngraving] = useState("")
  const [engravingFont, setEngravingFont] = useState("serif")
  const [matchingBundleOffer, setMatchingBundleOffer] = useState<PromoOffer | null>(null)
  const [variants, setVariants] = useState<Product[]>([])
  const { addToCart } = useCart()
  const router = useRouter()

  const engravingPrice = engraving ? 25 : 0
  const categoryLabel = getCategoryLabel(product.category)

  useEffect(() => {
    if (product.variant_group_id) {
      getProducts({ includeVariants: true }).then((all) => {
        const matching = all.filter((p: Product) => p.variant_group_id === product.variant_group_id)
        setVariants(matching.sort((a: Product, b: Product) => Number(a.ml || 0) - Number(b.ml || 0)))
      }).catch(console.error)
    }
  }, [product.variant_group_id])

  useEffect(() => {
    let active = true

    async function loadBundleOffer() {
      try {
        const settings = await getSiteSettings()
        const offers = Array.isArray(settings?.offers) ? (settings.offers as PromoOffer[]) : []
        const productSlug = slugify(product.slug)
        const matchingOffers = offers
          .filter(isOfferActive)
          .filter((offer) => normalizeProductSlugs(offer.product_slugs).includes(productSlug))
          .sort((a, b) => getOfferBestDiscount(b) - getOfferBestDiscount(a))

        if (!active) return
        setMatchingBundleOffer(matchingOffers[0] || null)
      } catch {
        if (!active) return
        setMatchingBundleOffer(null)
      }
    }

    loadBundleOffer()
    return () => {
      active = false
    }
  }, [product.slug])

  const addCurrentProductToCart = () => {
    // Add Main Product
    addToCart(
      {
        ...product,
        price: product.price + engravingPrice,
      },
      quantity,
      { replace: true } // Sync instead of additive
    )

    // Add Selected Gift (if any)
    if (selectedGiftId) {
      const promo = promotions.find(p => p.child_id === selectedGiftId)
      if (promo && promo.gift) {
        const giftPrice = promo.discount_percentage === 100 
          ? 0 
          : (promo.gift.price * (100 - promo.discount_percentage)) / 100

        addToCart(
          {
            ...promo.gift,
            price: giftPrice,
            name: `${promo.gift.name} (Gift)`,
          },
          quantity, // Matches main product quantity
          { 
            isGift: true, 
            parentId: product.id,
            originalUnitPrice: promo.gift.price,
            replace: true // Sync instead of additive
          }
        )
      }
    }
  }

  const handleBuyNow = () => {
    addCurrentProductToCart()
    router.push("/checkout")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="uppercase tracking-widest text-[10px] bg-neutral-100 text-neutral-600 rounded-sm px-2">
            {categoryLabel}
          </Badge>
          <Badge variant="outline" className="uppercase tracking-widest text-[10px] border-neutral-200 text-neutral-600 rounded-sm px-2">
            {product.ml ? `${product.ml} ML` : ""}
          </Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-medium text-neutral-900 mb-2">{product.name}</h1>
        <div className="flex items-baseline gap-3 mb-6">
          <div className="text-3xl font-light text-neutral-900">AED {product.price + engravingPrice}</div>
          {engravingPrice > 0 && (
            <span className="text-xs text-amber-600 uppercase tracking-widest">+ AED 25 Engraving</span>
          )}
        </div>

        <div className="prose prose-neutral text-neutral-600 font-light mb-8">
          <p>{product.description}</p>
        </div>

        {variants.length > 1 && (
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-3">Select Size</div>
            <div className="flex gap-3">
              {variants.map(v => (
                <Link key={v.id} href={`/product/${v.slug}`}>
                  <button className={`px-5 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 outline-none ${
                    v.id === product.id 
                    ? 'border border-black bg-black text-white shadow-md' 
                    : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-800'
                  }`}>
                    {v.ml ? `${v.ml} ML` : 'Default'}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {matchingBundleOffer && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Bundle Offer</p>
            <p className="mt-1 text-sm text-amber-900">
              {getOfferBestDiscount(matchingBundleOffer) ? `${getOfferBestDiscount(matchingBundleOffer)}% OFF` : "Special pricing"} in{" "}
              <span className="font-semibold">{matchingBundleOffer.title}</span>
            </p>
            <Link
              href={resolveOfferHref(matchingBundleOffer)}
              className="mt-2 inline-flex text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800 hover:text-black"
            >
              View Bundle Details
            </Link>
          </div>
        )}

        {/* Olfactive Profile Section */}
        {(product.olfactive_family || product.olfactive_signature || product.concentration || product.mood_use) && (
          <div className="mb-6 p-6 bg-white border border-neutral-200 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-5">Olfactive Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.olfactive_family && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Olfactive Family</div>
                  <div className="text-sm font-medium text-neutral-800">{product.olfactive_family}</div>
                </div>
              )}
              {product.concentration && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Concentration</div>
                  <div className="text-sm font-medium text-neutral-800">{product.concentration}</div>
                </div>
              )}
              {product.olfactive_signature && (
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Signature</div>
                  <div className="text-sm italic text-neutral-700 leading-relaxed">&ldquo;{product.olfactive_signature}&rdquo;</div>
                </div>
              )}
              {product.mood_use && (
                <div className="md:col-span-2">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-1">Mood & Experience</div>
                  <div className="text-sm text-neutral-600">{product.mood_use}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fragrance Notes Section */}
        {(product.top_notes || product.notes?.top) && (
          <div className="mb-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Fragrance Notes</h3>
            <div className="space-y-6">
              {[
                { label: "Top Notes", notes: product.top_notes || product.notes?.top },
                { label: "Heart Notes", notes: product.heart_notes || product.notes?.heart },
                { label: "Base Notes", notes: product.base_notes || product.notes?.base }
              ].map((section, idx) => section.notes && (
                <div key={idx} className="flex gap-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 w-24 shrink-0 mt-1">{section.label}</span>
                  <div className="flex flex-wrap gap-2">
                    {section.notes.map(note => (
                      <span key={note} className="text-sm font-light text-neutral-600 after:content-[','] last:after:content-['']">{note}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(product.tags || []).map(tag => (
              <span key={tag} className="px-3 py-1 bg-neutral-50 border border-neutral-200 text-xs uppercase tracking-wide text-neutral-600 rounded-full">
                {tag}
              </span>
          ))}
        </div>

        {/* Gift Selection Studio */}
        <GiftSelector 
          promotions={promotions}
          selectedGiftId={selectedGiftId}
          onSelect={setSelectedGiftId}
          productName={product.name}
        />
      </div>

      {/* Actions */}
      <div className="space-y-6 mt-8">
        {/* Quantity */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium uppercase tracking-wide">Quantity</span>
          <div className="flex items-center border border-neutral-200 rounded-full">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 flex items-center justify-center hover:bg-neutral-50 rounded-l-full transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 flex items-center justify-center hover:bg-neutral-50 rounded-r-full transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => {
              if (promotions.length > 0 && !selectedGiftId) {
                toast.error("Please select your complimentary gift", {
                  description: "Choose a scent to accompany your purchase."
                })
                return
              }
              addCurrentProductToCart()
              toast.success(`${quantity}x ${product.name} added to bag`, {
                description: selectedGiftId ? "Your complimentary gift has been included." : "You can view your bag or continue shopping.",
                action: {
                  label: "View Bag",
                  onClick: () => window.location.href = '/cart'
                },
              })
            }}
            variant="outline" 
            className="h-14 flex-1 rounded-full border-neutral-300 hover:bg-neutral-50 uppercase tracking-widest text-xs font-medium transition-colors"
          >
            Add to Cart
          </Button>
          <Button
            onClick={() => {
              if (promotions.length > 0 && !selectedGiftId) {
                toast.error("Please select your complimentary gift", {
                  description: "Choose a scent to accompany your purchase."
                })
                return
              }
              handleBuyNow()
            }}
            className="h-14 flex-1 rounded-full bg-black hover:bg-neutral-800 text-white uppercase tracking-widest text-xs font-medium"
          >
            Buy Now
          </Button>
        </div>

        {/* Delivery Box */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-sm">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <div className="font-medium text-neutral-900">Free Delivery</div>
              <div className="text-neutral-500 text-xs mt-1">On orders over AED 200</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <div className="font-medium text-neutral-900">Easy Returns</div>
              <div className="text-neutral-500 text-xs mt-1">30 days return policy</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <div className="font-medium text-neutral-900">Secure Payment</div>
              <div className="text-neutral-500 text-xs mt-1">Encrypted transaction</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-neutral-400 mt-0.5" />
            <div>
              <div className="font-medium text-neutral-900">Payment Options</div>
              <div className="text-neutral-500 text-xs mt-1">All cards accepted</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "@/lib/products"
import { useCart } from "@/contexts/cart-context"
import { toast } from "sonner"

interface OfferBundleBuilderProps {
  offerTitle: string
  availableBundleSizes?: number[]
  bundleDiscounts?: Record<string, number>
  products: Product[]
}

const BUNDLE_SIZES = [2, 3, 4, 5] as const
type BundleSize = typeof BUNDLE_SIZES[number]

function toNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function formatPrice(value: number) {
  return `AED ${Math.max(0, Math.round(value))}`
}

function calculateOfferPrice(originalPrice: number, discountPercent: number) {
  const safeDiscount = Math.min(100, Math.max(0, discountPercent))
  const discountAmount = (originalPrice * safeDiscount) / 100
  return {
    originalPrice,
    discountPercent: safeDiscount,
    discountAmount,
    offerPrice: Math.max(0, originalPrice - discountAmount),
  }
}

function getDiscountedUnitPrice(originalPrice: number, discountPercent: number) {
  const normalizedPrice = toNumber(originalPrice)
  const safeDiscount = Math.min(100, Math.max(0, discountPercent))
  const discounted = normalizedPrice - (normalizedPrice * safeDiscount) / 100
  return Math.max(0, Math.round(discounted * 100) / 100)
}

function normalizeBundleSizes(input?: number[]) {
  const source = Array.isArray(input) ? input : []
  const normalized = source
    .map((item) => Number(item))
    .filter((item): item is BundleSize => BUNDLE_SIZES.includes(item as BundleSize))
  if (normalized.length === 0) return [...BUNDLE_SIZES]
  return BUNDLE_SIZES.filter((size) => normalized.includes(size))
}

function getSizeDiscount(bundleDiscounts: Record<string, number> | undefined, size: BundleSize) {
  const candidate = bundleDiscounts?.[String(size)]
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) return 0
  return Math.min(100, Math.max(0, Math.round(candidate)))
}

export function OfferBundleBuilder({
  offerTitle,
  availableBundleSizes,
  bundleDiscounts,
  products,
}: OfferBundleBuilderProps) {
  const router = useRouter()
  const { addToCart, totalItems } = useCart()
  const bundleSizes = normalizeBundleSizes(availableBundleSizes)
  const [bundleSize, setBundleSize] = useState<BundleSize>(bundleSizes[0] || 2)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const bundleSequenceRef = useRef(0)

  const productsBySlug = useMemo(() => {
    const map = new Map<string, Product>()
    for (const product of products) {
      map.set(product.slug, product)
    }
    return map
  }, [products])

  const selectedProducts = useMemo(
    () => selectedSlugs.map((slug) => productsBySlug.get(slug)).filter((item): item is Product => Boolean(item)),
    [selectedSlugs, productsBySlug]
  )

  const removeSelectedProduct = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((item) => item !== slug))
  }

  const getSelectedSubtotalForSize = (size: BundleSize) => {
    const selectedForSize = selectedProducts.slice(0, size)
    return selectedForSize.reduce((sum, product) => sum + toNumber(product.price), 0)
  }

  const currentSelectedSubtotal = selectedProducts.reduce((sum, product) => sum + toNumber(product.price), 0)
  const selectedCount = selectedProducts.length
  const currentDiscount = getSizeDiscount(bundleDiscounts, bundleSize)
  const pricingBase = currentSelectedSubtotal
  const pricing = calculateOfferPrice(pricingBase, currentDiscount)
  const remaining = Math.max(0, bundleSize - selectedCount)

  const selectBundleSize = (size: BundleSize) => {
    setBundleSize(size)
    setSelectedSlugs((prev) => prev.slice(0, size))
  }

  const toggleProduct = (slug: string) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((item) => item !== slug)
      if (prev.length >= bundleSize) {
        toast.error(`You can select only ${bundleSize} items for this bundle.`)
        return prev
      }
      return [...prev, slug]
    })
  }

  const handleCheckoutBundle = () => {
    if (remaining > 0) {
      toast.error(`Add ${remaining} more item(s) to continue.`)
      return
    }

    const bundleName = `${bundleSize} Bundle - ${offerTitle}`
    const nextSequence = bundleSequenceRef.current + 1
    bundleSequenceRef.current = nextSequence
    const selectedSignature = selectedProducts.map((item) => item.slug).sort().join("-")
    const bundleId = `${bundleSize}-${offerTitle.toLowerCase().replace(/\s+/g, "-")}-${selectedSignature}-${totalItems + nextSequence}`

    selectedProducts.forEach((product) => {
      const originalUnitPrice = toNumber(product.price)
      addToCart(
        {
          ...product,
          price: getDiscountedUnitPrice(originalUnitPrice, currentDiscount),
        },
        1,
        {
          bundle: {
            id: bundleId,
            name: bundleName,
            size: bundleSize,
            discountPercent: currentDiscount,
          },
          originalUnitPrice,
        }
      )
    })

    toast.success(`${bundleName} added to bag`)
    router.push(`/cart?bundle=${encodeURIComponent(bundleName)}`)
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-3xl overflow-hidden" id="bundle-builder">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200">
          <h3 className="text-2xl font-serif text-neutral-900">Build Your Bundle</h3>
          <p className="text-sm text-neutral-500 mt-2">Select a bundle plan, compare original vs offer price, then choose products.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {bundleSizes.map((size) => {
              const sizeDiscount = getSizeDiscount(bundleDiscounts, size)
              const selectedSubtotalForSize = getSelectedSubtotalForSize(size)
              const selectedPricingForSize = calculateOfferPrice(selectedSubtotalForSize, sizeDiscount)
              const isActive = bundleSize === size
              const showTabPrice = selectedCount > 0

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => selectBundleSize(size)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-black bg-black text-white shadow-lg"
                      : "border-neutral-300 bg-white text-neutral-900 hover:border-black"
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold opacity-80">Bundle Plan</p>
                  <p className="mt-1 text-2xl font-serif">{size} Items</p>
                  {showTabPrice ? (
                    <>
                      <p className={`mt-3 text-xs ${isActive ? "text-white/70" : "text-neutral-500"}`}>Original Price</p>
                      <p className={`text-sm line-through ${isActive ? "text-white/75" : "text-neutral-500"}`}>
                        {formatPrice(selectedPricingForSize.originalPrice)}
                      </p>
                      <p className={`mt-2 text-xs ${isActive ? "text-white/70" : "text-neutral-500"}`}>Offer Price</p>
                      <p className="text-lg font-semibold">{formatPrice(selectedPricingForSize.offerPrice)}</p>
                    </>
                  ) : (
                    <p className={`mt-3 text-xs ${isActive ? "text-white/75" : "text-neutral-500"}`}>
                      Select items to see price
                    </p>
                  )}
                  <p className={`mt-2 text-[10px] uppercase tracking-[0.14em] font-bold ${isActive ? "text-amber-200" : "text-amber-700"}`}>
                    {sizeDiscount}% OFF
                  </p>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-xl bg-black px-4 py-3 text-white text-sm font-medium">
            {remaining > 0
              ? `Add ${remaining} more item(s) to fill your ${bundleSize}-item bundle.`
              : `Bundle complete. You can proceed to checkout.`}
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <span
                  key={`selected-chip-${product.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700"
                >
                  {product.name}
                  <button
                    type="button"
                    onClick={() => removeSelectedProduct(product.slug)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:border-red-400 hover:text-red-600"
                    aria-label={`Remove ${product.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => {
              const selected = selectedSlugs.includes(product.slug)
              return (
                <div
                  key={product.id}
                  className={`rounded-2xl border p-3 transition-colors ${
                    selected ? "border-black bg-neutral-50" : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100">
                    <Image
                      src={product.images?.[0] || "/placeholder-perfume.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 text-sm font-serif text-neutral-900 line-clamp-1">{product.name}</p>
                  <p className="text-xs text-neutral-500">{formatPrice(toNumber(product.price))}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.slug)}
                      className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        selected
                          ? "bg-black text-white hover:bg-neutral-800"
                          : "border border-neutral-300 bg-white text-neutral-700 hover:border-black hover:text-black"
                      }`}
                    >
                      {selected ? "Selected" : "Select"}
                    </button>
                    {selected && (
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(product.slug)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-500 hover:border-red-400 hover:text-red-600"
                        aria-label={`Unselect ${product.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="bg-neutral-50 p-6 md:p-8">
          <div className="flex items-end justify-between">
            <h4 className="text-3xl font-serif text-neutral-900">Your Cart</h4>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{selectedProducts.length} Item</p>
          </div>

          <div className="mt-4 rounded-lg bg-black px-4 py-3 text-white text-base font-semibold">
            {remaining > 0 ? `Add ${remaining} more item(s) to fill your box` : "Bundle ready for checkout"}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {Array.from({ length: bundleSize }).map((_, index) => {
              const item = selectedProducts[index]
              return (
                <div key={`slot-${index}`} className="relative aspect-square rounded-xl border border-dashed border-neutral-300 bg-white overflow-hidden">
                  {item ? (
                    <>
                      <div className="relative h-full w-full">
                        <Image
                          src={item.images?.[0] || "/placeholder-perfume.png"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedProduct(item.slug)}
                        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow hover:text-red-600"
                        aria-label={`Remove ${item.name} from bundle`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl text-neutral-300">+</div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 text-sm text-neutral-700">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.18em] text-[10px]">Original Price</span>
              <span className="line-through text-neutral-500">
                {selectedCount > 0 ? formatPrice(pricing.originalPrice) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.18em] text-[10px]">Offer Discount ({pricing.discountPercent}%)</span>
              <span>{selectedCount > 0 ? `- ${formatPrice(pricing.discountAmount)}` : "--"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-300 pt-3 text-base text-neutral-900 font-semibold">
              <span className="uppercase tracking-[0.18em] text-[10px]">Offer Price</span>
              <span>{selectedCount > 0 ? formatPrice(pricing.offerPrice) : "--"}</span>
            </div>
          </div>

          <Button
            className="mt-6 w-full h-12 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-[0.24em] text-xs"
            onClick={handleCheckoutBundle}
          >
            Checkout Bundle
          </Button>
        </aside>
      </div>
    </section>
  )
}

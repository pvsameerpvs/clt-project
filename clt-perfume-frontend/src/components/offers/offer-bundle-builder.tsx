"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
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

function formatPrice(value: number) {
  return `AED ${Math.max(0, Math.round(value))}`
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
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) return undefined
  return Math.min(100, Math.max(0, Math.round(candidate)))
}

export function OfferBundleBuilder({
  offerTitle,
  availableBundleSizes,
  bundleDiscounts,
  products,
}: OfferBundleBuilderProps) {
  const router = useRouter()
  const { addToCart } = useCart()
  const bundleSizes = normalizeBundleSizes(availableBundleSizes)
  const [bundleSize, setBundleSize] = useState<BundleSize>(bundleSizes[0] || 2)
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  const selectedProducts = useMemo(() => {
    const selectedSet = new Set(selectedSlugs)
    return products.filter((product) => selectedSet.has(product.slug))
  }, [products, selectedSlugs])

  const subtotal = selectedProducts.reduce((sum, product) => sum + Number(product.price || 0), 0)
  const perSizeDiscount = getSizeDiscount(bundleDiscounts, bundleSize)
  const discount = typeof perSizeDiscount === "number" ? perSizeDiscount : 0
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount
  const remaining = Math.max(0, bundleSize - selectedProducts.length)

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

    selectedProducts.forEach((product) => addToCart(product, 1))
    const bundleName = `${bundleSize} Bundle - ${offerTitle}`
    toast.success(`${bundleName} added to bag`)
    router.push(`/cart?bundle=${encodeURIComponent(bundleName)}`)
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-3xl overflow-hidden" id="bundle-builder">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-neutral-200">
          <h3 className="text-2xl font-serif text-neutral-900">Build Your Bundle</h3>
          <p className="text-sm text-neutral-500 mt-2">Choose a box size and select products from this offer list.</p>

          <div className="mt-5 flex flex-wrap gap-3">
            {bundleSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => selectBundleSize(size)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  bundleSize === size
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-black"
                }`}
              >
                {size} Items
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-black px-4 py-3 text-white text-sm font-medium">
            {remaining > 0
              ? `Add ${remaining} more item(s) to fill your ${bundleSize}-item bundle.`
              : `Bundle complete. You can proceed to checkout.`}
          </div>
          <p className="mt-2 text-[11px] text-neutral-600">
            Active discount for {bundleSize} items: <span className="font-semibold">{discount}%</span>
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => {
              const selected = selectedSlugs.includes(product.slug)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.slug)}
                  className={`text-left rounded-2xl border p-3 transition-colors ${
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
                  <p className="text-xs text-neutral-500">{formatPrice(product.price || 0)}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.14em] font-semibold text-neutral-700">
                    {selected ? "Selected" : "Tap to Select"}
                  </p>
                </button>
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
                <div key={`slot-${index}`} className="aspect-square rounded-xl border border-dashed border-neutral-300 bg-white overflow-hidden">
                  {item ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={item.images?.[0] || "/placeholder-perfume.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-3xl text-neutral-300">+</div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 text-sm text-neutral-700">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.18em] text-[10px]">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.18em] text-[10px]">Discount</span>
              <span>{formatPrice(discountAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-300 pt-3 text-base text-neutral-900 font-semibold">
              <span className="uppercase tracking-[0.18em] text-[10px]">Total</span>
              <span>{formatPrice(total)}</span>
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

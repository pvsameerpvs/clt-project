"use client"

import { Suspense, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CartItem as CartLineItem, getCartLineKey, useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { CartItem } from "@/components/cart/cart-item"
import { CartOrderSummary } from "@/components/cart/cart-order-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from "lucide-react"
import { validatePromoCode } from "@/lib/api"


export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
  const {
    items,
    totalPrice,
    totalItems,
    removeFromCart,
    updateQuantity,
    promo,
    setPromo,
    promoDiscountAmount,
    discountedTotal,
  } = useCart()

  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const searchParams = useSearchParams()
  const bundleName = searchParams.get("bundle")?.trim() || ""

  const [promoInput, setPromoInput] = useState("")
  const [promoMessage, setPromoMessage] = useState("")
  const [promoError, setPromoError] = useState(false)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const { standaloneItems, bundleGroups } = useMemo(() => {
    const bundleMap = new Map<
      string,
      {
        id: string
        name: string
        discountPercent: number
        size: number
        items: CartLineItem[]
        originalTotal: number
        offerTotal: number
      }
    >()

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
  }, [items])

  const hasBundleFromQueryInCart = useMemo(() => {
    if (!bundleName) return false
    return items.some((item) => item.bundle?.name === bundleName)
  }, [items, bundleName])

  const getBundleSetQuantity = (bundleGroup: (typeof bundleGroups)[number]) =>
    Math.max(
      1,
      Math.min(...bundleGroup.items.map((item) => Math.max(1, Number(item.quantity) || 1)))
    )

  const updateBundleSetQuantity = (bundleGroup: (typeof bundleGroups)[number], nextSetQuantity: number) => {
    const currentSetQuantity = getBundleSetQuantity(bundleGroup)
    const safeNext = Math.max(1, nextSetQuantity)
    const delta = safeNext - currentSetQuantity
    if (delta === 0) return

    bundleGroup.items.forEach((item) => {
      const lineKey = getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
      const currentItemQty = Math.max(1, Number(item.quantity) || 1)
      updateQuantity(lineKey, currentItemQty + delta)
    })
  }

  const orderSummaryLines = useMemo(() => {
    const bundleLines = bundleGroups.map((bundleGroup) => ({
      key: `bundle-line-${bundleGroup.id}`,
      label: `${bundleGroup.size} Bundle`,
      quantity: Math.max(1, Math.min(...bundleGroup.items.map((item) => Math.max(1, Number(item.quantity) || 1)))),
      value: bundleGroup.offerTotal,
    }))

    const singleLines = standaloneItems.map((item) => ({
      key: `single-line-${getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)}`,
      label: item.product.name,
      quantity: item.quantity,
      value: Number(item.product.price) * item.quantity,
    }))

    return [...bundleLines, ...singleLines]
  }, [bundleGroups, standaloneItems])

  const promoInputValue = promo ? promo.code : promoInput

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (!code) {
      setPromoError(true)
      setPromoMessage("Enter promo code")
      return
    }
    if (totalPrice <= 0) {
      setPromoError(true)
      setPromoMessage("Add items before applying promo")
      return
    }

    setIsApplyingPromo(true)
    setPromoMessage("")
    setPromoError(false)

    const result = await validatePromoCode(code, totalPrice)
    if (!result.valid || !result.discountType) {
      setPromoError(true)
      setPromoMessage(result.message || "Invalid promo code")
      setIsApplyingPromo(false)
      return
    }

    setPromo({
      code: (result.code || code).toUpperCase(),
      discountType: result.discountType === "fixed" ? "fixed" : "percentage",
      discountValue: Number(result.discountValue || 0),
    })
    setPromoInput("")
    setPromoError(false)
    setPromoMessage(result.message || "Promo applied")
    setIsApplyingPromo(false)
  }

  const removePromo = () => {
    setPromo(null)
    setPromoInput("")
    setPromoError(false)
    setPromoMessage("Promo removed")
  }

  const handleProceedCheckout = () => {
    if (isAuthLoading) return
    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
          <ShoppingBag className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="mb-4 text-3xl font-serif text-neutral-900">Your Bag is Empty</h1>
        <p className="mb-8 max-w-sm text-center font-light text-neutral-500">
          Discover our exclusive collections and find the perfect signature scent.
        </p>
        <Link href="/">
          <Button className="h-14 rounded-none bg-black px-8 text-xs font-medium uppercase tracking-widest text-white transition-all hover:bg-neutral-800">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-neutral-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-4xl font-serif text-neutral-900">Your Shopping Bag</h1>
          <span className="ml-2 mt-2 text-sm font-light text-neutral-500">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>

        {bundleName && hasBundleFromQueryInCart && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">Bundle:</span> {bundleName}
          </div>
        )}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="h-fit rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm md:p-10 lg:col-span-2">
            <div className="space-y-2">
              {bundleGroups.map((bundleGroup) => {
                const itemCount = bundleGroup.items.reduce((sum, item) => sum + item.quantity, 0)
                const savings = Math.max(0, bundleGroup.originalTotal - bundleGroup.offerTotal)
                const bundleSetQty = getBundleSetQuantity(bundleGroup)

                return (
                  <div key={bundleGroup.id} className="mb-4 rounded-2xl border border-neutral-200 p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">Bundle Offer</p>
                        <h3 className="mt-1 text-xl font-serif text-neutral-900">{bundleGroup.name}</h3>
                        <p className="mt-1 text-xs text-neutral-500">
                          {itemCount} items selected • {bundleGroup.discountPercent}% OFF
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          bundleGroup.items.forEach((item) =>
                            removeFromCart(getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id))
                          )
                        }
                        className="text-neutral-400 transition-colors hover:text-black"
                        aria-label={`Remove ${bundleGroup.name}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {bundleGroup.items.map((item) => (
                        <div key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2">
                          <div className="relative h-20 w-full overflow-hidden rounded-lg bg-white">
                            <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                          </div>
                          <p className="mt-2 line-clamp-1 text-xs text-neutral-700">{item.product.name}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 inline-flex items-center overflow-hidden rounded-full border border-neutral-300">
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty - 1)}
                        disabled={bundleSetQty <= 1}
                        className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Decrease ${bundleGroup.name} quantity`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="inline-flex h-8 min-w-8 items-center justify-center border-x border-neutral-300 px-2 text-sm font-medium">
                        {bundleSetQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:bg-neutral-50"
                        aria-label={`Increase ${bundleGroup.name} quantity`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
                      <div>
                        <span className="mr-2 text-neutral-500 line-through">AED {Math.round(bundleGroup.originalTotal)}</span>
                        <span className="font-semibold text-neutral-900">AED {Math.round(bundleGroup.offerTotal)}</span>
                      </div>
                      <span className="font-medium text-green-700">You save AED {Math.round(savings)}</span>
                    </div>
                  </div>
                )
              })}

              {standaloneItems.map((item) => (
                <CartItem key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} item={item} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartOrderSummary
                lines={orderSummaryLines}
                totalPrice={totalPrice}
                discountedTotal={discountedTotal}
                promo={promo}
                promoDiscountAmount={promoDiscountAmount}
                promoInputValue={promoInputValue}
                promoMessage={promoMessage}
                promoError={promoError}
                isApplyingPromo={isApplyingPromo}
                onPromoInputChange={setPromoInput}
                onApplyPromo={applyPromo}
                onRemovePromo={removePromo}
                onProceedCheckout={handleProceedCheckout}
                proceedButtonLabel={
                  isAuthLoading ? "Loading..." : "Proceed to Checkout"
                }
                proceedHelperText={!isAuthLoading && !user ? "10% discount applies automatically if you sign in." : undefined}
                isProceedDisabled={isAuthLoading}
                showPromoInput={!!user}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

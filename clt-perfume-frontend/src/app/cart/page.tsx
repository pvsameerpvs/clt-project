"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getCartLineKey, useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { CartItem } from "@/components/cart/cart-item"
import { CartOrderSummary } from "@/components/cart/cart-order-summary"
import { ArrowLeft } from "lucide-react"
import { validatePromoCode } from "@/lib/api"
import { EmptyCart } from "@/components/cart/empty-cart"
import { CartBundleItem } from "@/components/cart/cart-bundle-item"
import { groupCartItems, BundleGroup } from "@/lib/cart-utils"

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

  // Architectural Improvement: Logic moved to utility
  const { standaloneItems, bundleGroups } = useMemo(() => groupCartItems(items), [items])

  const hasBundleFromQueryInCart = useMemo(() => {
    if (!bundleName) return false
    return items.some((item) => item.bundle?.name === bundleName)
  }, [items, bundleName])

  const getBundleSetQuantity = (bundleGroup: BundleGroup) =>
    Math.max(
      1,
      Math.min(...bundleGroup.items.map((item) => Math.max(1, Number(item.quantity) || 1)))
    )

  const handleUpdateBundleSetQuantity = (bundleGroup: BundleGroup, nextSetQuantity: number) => {
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
      quantity: getBundleSetQuantity(bundleGroup),
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

  // Refactored: Split into EmptyCart component
  if (items.length === 0) {
    return <EmptyCart />
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
              {/* Refactored: Extracted Bundle Item Component */}
              {bundleGroups.map((bundleGroup) => (
                <CartBundleItem 
                   key={bundleGroup.id}
                   bundleGroup={bundleGroup}
                   setQuantity={getBundleSetQuantity(bundleGroup)}
                   onRemove={(keys) => keys.forEach(k => removeFromCart(k))}
                   onUpdateQuantity={(next) => handleUpdateBundleSetQuantity(bundleGroup, next)}
                />
              ))}

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


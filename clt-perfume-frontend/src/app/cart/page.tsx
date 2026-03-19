"use client"

import { Suspense, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CartItem as CartLineItem, getCartLineKey, useCart } from "@/contexts/cart-context"
import { CartItem } from "@/components/cart/cart-item"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Minus, Plus, ShoppingBag, X } from "lucide-react"

function formatPrice(value: number) {
  return `AED ${Math.round(Number(value) || 0)}`
}

export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity } = useCart()
  const searchParams = useSearchParams()
  const bundleName = searchParams.get("bundle")?.trim() || ""

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

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white flex flex-col items-center justify-center px-4">
        <div className="h-24 w-24 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-neutral-300" />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-4">Your Bag is Empty</h1>
        <p className="text-neutral-500 font-light mb-8 max-w-sm text-center">
          Discover our exclusive collections and find the perfect signature scent.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all">
            Continue Shopping
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/" className="h-10 w-10 bg-white shadow-sm flex items-center justify-center rounded-full hover:bg-neutral-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-4xl font-serif text-neutral-900">Your Shopping Bag</h1>
          <span className="text-sm text-neutral-500 font-light mt-2 ml-2">
            ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
        </div>

        {bundleName && hasBundleFromQueryInCart && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold">Bundle:</span> {bundleName}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-neutral-100 h-fit">
            <div className="space-y-2">
              {bundleGroups.map((bundleGroup) => {
                const itemCount = bundleGroup.items.reduce((sum, item) => sum + item.quantity, 0)
                const savings = Math.max(0, bundleGroup.originalTotal - bundleGroup.offerTotal)
                const bundleSetQty = getBundleSetQuantity(bundleGroup)

                return (
                  <div key={bundleGroup.id} className="border border-neutral-200 rounded-2xl p-5 md:p-6 mb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-semibold">Bundle Offer</p>
                        <h3 className="text-xl font-serif text-neutral-900 mt-1">{bundleGroup.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {itemCount} items selected • {bundleGroup.discountPercent}% OFF
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          bundleGroup.items.forEach((item) =>
                            removeFromCart(
                              getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)
                            )
                          )
                        }
                        className="text-neutral-400 hover:text-black transition-colors"
                        aria-label={`Remove ${bundleGroup.name}`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                  

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {bundleGroup.items.map((item) => (
                        <div key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)} className="rounded-xl border border-neutral-100 bg-neutral-50 p-2">
                          <div className="relative h-20 w-full rounded-lg overflow-hidden bg-white">
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-xs text-neutral-700 mt-2 line-clamp-1">{item.product.name}</p>
                        </div>
                      ))}
                    </div>
  <div className="mt-3 inline-flex items-center rounded-full border border-neutral-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty - 1)}
                        disabled={bundleSetQty <= 1}
                        className="h-8 w-8 inline-flex items-center justify-center hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label={`Decrease ${bundleGroup.name} quantity`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="h-8 min-w-8 px-2 inline-flex items-center justify-center text-sm font-medium border-x border-neutral-300">
                        {bundleSetQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBundleSetQuantity(bundleGroup, bundleSetQty + 1)}
                        className="h-8 w-8 inline-flex items-center justify-center hover:bg-neutral-50 transition-colors"
                        aria-label={`Increase ${bundleGroup.name} quantity`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-sm">
                      <div>
                        <span className="text-neutral-500 line-through mr-2">AED {Math.round(bundleGroup.originalTotal)}</span>
                        <span className="font-semibold text-neutral-900">AED {Math.round(bundleGroup.offerTotal)}</span>
                      </div>
                      <span className="text-green-700 font-medium">You save AED {Math.round(savings)}</span>
                    </div>
                    
                  </div>
                )
              })}

              {standaloneItems.map((item) => (
                <CartItem
                  key={getCartLineKey(item.product.id, Number(item.product.price), item.bundle?.id)}
                  item={item}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 sticky top-24">
              <h2 className="text-xl font-serif mb-6 border-b border-neutral-100 pb-4">Order Summary</h2>

              <div className="space-y-2 mb-6">
                {orderSummaryLines.map((line) => (
                  <div key={line.key} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-700">
                      {line.label}
                      <span className="text-neutral-500"> x{line.quantity}</span>
                    </span>
                    <span className="font-medium text-neutral-900">{formatPrice(line.value)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4 text-sm font-light text-neutral-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium tracking-wide">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-neutral-100 pt-6 mb-8 text-neutral-900">
                <span className="font-serif">Total</span>
                <span className="text-2xl font-serif">{formatPrice(totalPrice)}</span>
              </div>

              <Button className="w-full h-14 rounded-xl bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-xs font-medium transition-all shadow-lg shadow-black/10">
                Proceed to Checkout
              </Button>

              <div className="mt-6 flex items-center justify-center gap-4 text-neutral-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L21 21H3L5 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] uppercase tracking-widest font-medium">Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
